import type { StoredAccessSubmissionV1 } from "./access-models";
import {
  buildClientConfirmationHtml,
  buildClientConfirmationSubject,
  buildClientConfirmationText,
  createFetchEmailProvider,
} from "./access-submit-email";
import {
  buildOperatorNotificationHtml,
  buildOperatorNotificationSubject,
  buildOperatorNotificationText,
  createFetchOperatorEmailProvider,
} from "./access-submit-operator-email";

export type AccessDeliveryResult = {
  operatorNotified: boolean;
  clientAcknowledged: boolean;
  syntheticSkipped: boolean;
};

type AccessDeliveryConfig = {
  endpoint: string;
  apiKey: string;
  fromEmail: string;
  replyToEmail?: string;
  operatorEmail: string;
  siteName: string;
  siteUrl: string;
};

export class AccessDeliveryError extends Error {
  code: "delivery_not_configured" | "operator_notification_failed" | "client_acknowledgement_failed";

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
  const siteUrl = (clean(env.ACCESS_SITE_URL) || "https://www.bhrigu.io").replace(/\/$/, "");

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
  syntheticProof: boolean;
  env?: NodeJS.ProcessEnv;
}): Promise<AccessDeliveryResult> {
  if (input.syntheticProof) {
    return {
      operatorNotified: false,
      clientAcknowledged: false,
      syntheticSkipped: true,
    };
  }

  const config = resolveAccessDeliveryConfig(input.env);
  const reviewUrl = `${config.siteUrl}/access-review?id=${encodeURIComponent(
    input.record.requestId
  )}&token=${encodeURIComponent(input.reviewToken)}`;

  const operatorProvider = createFetchOperatorEmailProvider({
    endpoint: config.endpoint,
    apiKey: config.apiKey,
    fromEmail: config.fromEmail,
  });
  const clientProvider = createFetchEmailProvider({
    endpoint: config.endpoint,
    apiKey: config.apiKey,
    fromEmail: config.fromEmail,
  });

  const operatorText = `${buildOperatorNotificationText({
    requestId: input.record.requestId,
    submittedAt: input.record.createdAt,
    operatorPacket: input.record.operatorPacket,
    siteName: config.siteName,
  })}\n\nPrivate operator review\n${reviewUrl}\n`;
  const operatorHtml = appendPrivateReviewLink(
    buildOperatorNotificationHtml({
      requestId: input.record.requestId,
      submittedAt: input.record.createdAt,
      operatorPacket: input.record.operatorPacket,
      siteName: config.siteName,
      siteUrl: config.siteUrl,
    }),
    reviewUrl
  );

  try {
    await operatorProvider.send({
      to: config.operatorEmail,
      subject: buildOperatorNotificationSubject(
        input.record.requestId,
        input.record.operatorPacket.derived.likelyLevel
      ),
      text: operatorText,
      html: operatorHtml,
      replyTo: input.record.request.email,
    });
  } catch (error) {
    throw new AccessDeliveryError(
      "operator_notification_failed",
      error instanceof Error ? error.message : "Operator notification failed."
    );
  }

  try {
    await clientProvider.send({
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
    });
  } catch (error) {
    throw new AccessDeliveryError(
      "client_acknowledgement_failed",
      error instanceof Error ? error.message : "Client acknowledgement failed."
    );
  }

  return {
    operatorNotified: true,
    clientAcknowledged: true,
    syntheticSkipped: false,
  };
}

function appendPrivateReviewLink(html: string, reviewUrl: string): string {
  const block = `
    <div style="margin:22px 0 0;padding:16px;border:1px solid rgba(215,182,111,0.45);border-radius:14px;background:#091522;">
      <p style="margin:0 0 10px;color:#d7b66f;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Private operator review</p>
      <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;padding:11px 16px;border-radius:999px;background:#d7b66f;color:#091522;text-decoration:none;font-weight:700;font-size:14px;">Open private request</a>
      <p style="margin:10px 0 0;color:#8da0b3;font-size:12px;line-height:1.5;">This capability link is operator-only. Do not forward it.</p>
    </div>`;
  return html.includes("</body>") ? html.replace("</body>", `${block}\n</body>`) : `${html}${block}`;
}

function clean(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
