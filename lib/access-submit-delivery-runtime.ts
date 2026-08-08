import type { StoredAccessSubmissionV1 } from "./access-models";
import {
  buildClientConfirmationHtml,
  buildClientConfirmationSubject,
  buildClientConfirmationText,
} from "./access-submit-email";
import {
  buildOperatorNotificationHtml,
  buildOperatorNotificationSubject,
  buildOperatorNotificationText,
} from "./access-submit-operator-email";
import {
  getPrivateAccessDeliveryState,
  markPrivateAccessDeliverySent,
  reservePrivateAccessDelivery,
  type PrivateBlobClient,
} from "./access-private-intake";

export type AccessDeliveryResult = {
  operatorNotified: boolean;
  clientAcknowledged: boolean;
  syntheticSkipped: boolean;
  idempotentReplay: boolean;
  status: "complete" | "synthetic_skipped";
};

export type AccessDeliveryConfig = {
  endpoint: string;
  apiKey: string;
  fromEmail: string;
  replyToEmail?: string;
  operatorEmail: string;
  siteName: string;
  siteUrl: string;
};

export class AccessDeliveryError extends Error {
  code:
    | "delivery_not_configured"
    | "delivery_reconciliation_required"
    | "operator_notification_failed"
    | "client_acknowledgement_failed";

  constructor(code: AccessDeliveryError["code"], message: string) {
    super(message);
    this.name = "AccessDeliveryError";
    this.code = code;
  }
}

export function resolveAccessDeliveryConfig(
  env: NodeJS.ProcessEnv = process.env
): AccessDeliveryConfig {
  const endpoint = clean(env.ACCESS_EMAIL_ENDPOINT);
  const apiKey = clean(env.ACCESS_EMAIL_API_KEY);
  const fromEmail = clean(env.ACCESS_EMAIL_FROM);
  const operatorEmail = clean(env.ACCESS_OPERATOR_EMAIL);
  const replyToEmail = clean(env.ACCESS_EMAIL_REPLY_TO) || undefined;
  const siteName = clean(env.ACCESS_SITE_NAME) || "BHRIGU";
  const siteUrl = (
    clean(env.ACCESS_SITE_URL) || "https://www.bhrigu.io"
  ).replace(/\/$/, "");

  const missing = [
    ["ACCESS_EMAIL_ENDPOINT", endpoint],
    ["ACCESS_EMAIL_API_KEY", apiKey],
    ["ACCESS_EMAIL_FROM", fromEmail],
    ["ACCESS_OPERATOR_EMAIL", operatorEmail],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new AccessDeliveryError(
      "delivery_not_configured",
      `Private intake delivery is not configured: ${missing.join(", ")}.`
    );
  }

  return {
    endpoint,
    apiKey,
    fromEmail,
    replyToEmail,
    operatorEmail,
    siteName,
    siteUrl,
  };
}

export async function deliverPrivateAccessSubmission(input: {
  record: StoredAccessSubmissionV1;
  reviewToken: string;
  idempotencySha256: string;
  syntheticProof: boolean;
  env?: NodeJS.ProcessEnv;
  client?: PrivateBlobClient;
}): Promise<AccessDeliveryResult> {
  if (input.syntheticProof) {
    return {
      operatorNotified: false,
      clientAcknowledged: false,
      syntheticSkipped: true,
      idempotentReplay: false,
      status: "synthetic_skipped",
    };
  }

  const config = resolveAccessDeliveryConfig(input.env);
  const client = input.client;
  const initialState = await getPrivateAccessDeliveryState(
    input.record.requestId,
    client
  );

  if (initialState.status === "complete") {
    const operatorReplay = await reservePrivateAccessDelivery(
      input.record.requestId,
      input.idempotencySha256,
      "operator",
      client
    );
    const clientReplay = await reservePrivateAccessDelivery(
      input.record.requestId,
      input.idempotencySha256,
      "client",
      client
    );
    if (operatorReplay !== "already_sent" || clientReplay !== "already_sent") {
      throw reconciliationError(input.record.requestId);
    }
    return {
      operatorNotified: false,
      clientAcknowledged: false,
      syntheticSkipped: false,
      idempotentReplay: true,
      status: "complete",
    };
  }

  if (initialState.status === "reconciliation_required") {
    throw reconciliationError(input.record.requestId);
  }

  const reviewUrl = `${config.siteUrl}/access-review?id=${encodeURIComponent(
    input.record.requestId
  )}&token=${encodeURIComponent(input.reviewToken)}`;

  let operatorNotified = false;
  let clientAcknowledged = false;

  if (initialState.operator.sent) {
    const operatorReplay = await reservePrivateAccessDelivery(
      input.record.requestId,
      input.idempotencySha256,
      "operator",
      client
    );
    if (operatorReplay !== "already_sent") {
      throw reconciliationError(input.record.requestId);
    }
  } else {
    const operatorReservation = await reservePrivateAccessDelivery(
      input.record.requestId,
      input.idempotencySha256,
      "operator",
      client
    );

    if (operatorReservation === "already_reserved") {
      throw reconciliationError(input.record.requestId);
    }

    if (operatorReservation !== "already_sent") {
      try {
        await sendProviderMessage({
          config,
          idempotencyKey: deliveryIdempotencyKey(
            input.record.requestId,
            "operator"
          ),
          message: {
            to: config.operatorEmail,
            subject: buildOperatorNotificationSubject(
              input.record.requestId,
              input.record.operatorPacket.derived.likelyLevel
            ),
            text: `${buildOperatorNotificationText({
              requestId: input.record.requestId,
              submittedAt: input.record.createdAt,
              operatorPacket: input.record.operatorPacket,
              siteName: config.siteName,
            })}\n\nPrivate operator review\n${reviewUrl}\n`,
            html: appendPrivateReviewLink(
              buildOperatorNotificationHtml({
                requestId: input.record.requestId,
                submittedAt: input.record.createdAt,
                operatorPacket: input.record.operatorPacket,
                siteName: config.siteName,
                siteUrl: config.siteUrl,
              }),
              reviewUrl
            ),
            replyTo: input.record.request.email,
          },
        });
        await markPrivateAccessDeliverySent(
          input.record.requestId,
          input.idempotencySha256,
          "operator",
          client
        );
        operatorNotified = true;
      } catch (error) {
        throw new AccessDeliveryError(
          "delivery_reconciliation_required",
          `Operator delivery for ${input.record.requestId} entered a reserved but unconfirmed state: ${
            error instanceof Error ? error.message : "unknown delivery error"
          }`
        );
      }
    }
  }

  const afterOperator = await getPrivateAccessDeliveryState(
    input.record.requestId,
    client
  );
  if (afterOperator.status === "reconciliation_required") {
    throw reconciliationError(input.record.requestId);
  }

  if (afterOperator.client.sent) {
    const clientReplay = await reservePrivateAccessDelivery(
      input.record.requestId,
      input.idempotencySha256,
      "client",
      client
    );
    if (clientReplay !== "already_sent") {
      throw reconciliationError(input.record.requestId);
    }
  } else {
    const clientReservation = await reservePrivateAccessDelivery(
      input.record.requestId,
      input.idempotencySha256,
      "client",
      client
    );

    if (clientReservation === "already_reserved") {
      throw reconciliationError(input.record.requestId);
    }

    if (clientReservation !== "already_sent") {
      try {
        await sendProviderMessage({
          config,
          idempotencyKey: deliveryIdempotencyKey(
            input.record.requestId,
            "client"
          ),
          message: {
            to: input.record.request.email,
            subject: buildClientConfirmationSubject(input.record.requestId),
            text: buildClientConfirmationText({
              requestId: input.record.requestId,
              submittedAt: input.record.createdAt,
              clientView: input.record.clientView,
              request: input.record.request,
              siteName: config.siteName,
            }),
            html: buildClientConfirmationHtml({
              requestId: input.record.requestId,
              submittedAt: input.record.createdAt,
              clientView: input.record.clientView,
              request: input.record.request,
              siteName: config.siteName,
              siteUrl: config.siteUrl,
            }),
            replyTo: config.replyToEmail,
          },
        });
        await markPrivateAccessDeliverySent(
          input.record.requestId,
          input.idempotencySha256,
          "client",
          client
        );
        clientAcknowledged = true;
      } catch (error) {
        throw new AccessDeliveryError(
          "delivery_reconciliation_required",
          `Client delivery for ${input.record.requestId} entered a reserved but unconfirmed state: ${
            error instanceof Error ? error.message : "unknown delivery error"
          }`
        );
      }
    }
  }

  const finalState = await getPrivateAccessDeliveryState(
    input.record.requestId,
    client
  );
  if (finalState.status !== "complete") {
    throw reconciliationError(input.record.requestId);
  }

  return {
    operatorNotified,
    clientAcknowledged,
    syntheticSkipped: false,
    idempotentReplay: !operatorNotified && !clientAcknowledged,
    status: "complete",
  };
}

function reconciliationError(requestId: string): AccessDeliveryError {
  return new AccessDeliveryError(
    "delivery_reconciliation_required",
    `Delivery for ${requestId} is reserved but not durably confirmed. Automatic resend is blocked to prevent duplicates.`
  );
}

function deliveryIdempotencyKey(
  requestId: string,
  channel: "operator" | "client"
): string {
  return `bhrigu-access-${requestId}-${channel}-v0-1`;
}

async function sendProviderMessage(input: {
  config: AccessDeliveryConfig;
  idempotencyKey: string;
  message: {
    to: string;
    subject: string;
    text: string;
    html: string;
    replyTo?: string;
  };
}): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(input.config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.config.apiKey}`,
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        from: input.config.fromEmail,
        to: [input.message.to],
        subject: input.message.subject,
        text: input.message.text,
        html: input.message.html,
        reply_to: input.message.replyTo,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await safeReadText(response);
      throw new Error(
        `Email provider request failed: ${response.status} ${body || ""}`.trim()
      );
    }
  } finally {
    clearTimeout(timer);
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "";
  }
}

function appendPrivateReviewLink(html: string, reviewUrl: string): string {
  const block = `
    <div style="margin:22px 0 0;padding:16px;border:1px solid rgba(215,182,111,0.45);border-radius:14px;background:#091522;">
      <p style="margin:0 0 10px;color:#d7b66f;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Private operator review</p>
      <a href="${escapeHtml(
        reviewUrl
      )}" style="display:inline-block;padding:11px 16px;border-radius:999px;background:#d7b66f;color:#091522;text-decoration:none;font-weight:700;font-size:14px;">Open private request</a>
      <p style="margin:10px 0 0;color:#8da0b3;font-size:12px;line-height:1.5;">This capability link is operator-only. Do not forward it.</p>
    </div>`;
  return html.includes("</body>")
    ? html.replace("</body>", `${block}\n</body>`)
    : `${html}${block}`;
}

function clean(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
