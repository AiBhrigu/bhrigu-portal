// lib/access-submit-email.ts

import type { ClientStatus, ClientViewModel, RequestFields } from "./access-models";

export interface AccessConfirmationEmailAdapter {
  sendClientConfirmation(input: {
    toEmail: string;
    clientView: ClientViewModel;
    request: RequestFields;
  }): Promise<void>;
}

export interface AccessEmailProvider {
  send(message: AccessEmailMessage): Promise<void>;
}

export interface AccessEmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export interface AccessEmailConfig {
  fromEmail: string;
  replyToEmail?: string;
  siteName: string;
  siteUrl: string;
}

export function createAccessConfirmationEmailAdapter(
  provider: AccessEmailProvider,
  config: AccessEmailConfig
): AccessConfirmationEmailAdapter {
  return {
    async sendClientConfirmation(input) {
      const subject = buildClientConfirmationSubject(input.clientView.requestId);

      const text = buildClientConfirmationText({
        requestId: input.clientView.requestId,
        submittedAt: input.clientView.submittedAt,
        clientView: input.clientView,
        request: input.request,
        siteName: config.siteName,
      });

      const html = buildClientConfirmationHtml({
        requestId: input.clientView.requestId,
        submittedAt: input.clientView.submittedAt,
        clientView: input.clientView,
        request: input.request,
        siteName: config.siteName,
        siteUrl: config.siteUrl,
      });

      await provider.send({
        to: input.toEmail,
        subject,
        text,
        html,
        replyTo: config.replyToEmail,
      });
    },
  };
}

export interface FetchEmailProviderOptions {
  endpoint: string;
  apiKey: string;
  fromEmail: string;
  timeoutMs?: number;
}

export function createFetchEmailProvider(
  options: FetchEmailProviderOptions
): AccessEmailProvider {
  return {
    async send(message) {
      const controller = new AbortController();
      const timeoutMs = options.timeoutMs ?? 10000;
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(options.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${options.apiKey}`,
          },
          body: JSON.stringify({
            from: options.fromEmail,
            to: [message.to],
            subject: message.subject,
            text: message.text,
            html: message.html,
            reply_to: message.replyTo,
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
    },
  };
}

export function createConsoleEmailProvider(): AccessEmailProvider {
  return {
    async send(message) {
      console.log("[access-email]", {
        to: message.to,
        subject: message.subject,
        replyTo: message.replyTo ?? null,
        text: message.text,
      });
    },
  };
}

export function buildClientConfirmationSubject(requestId: string): string {
  return `Request received — ${requestId}`;
}

export function buildClientConfirmationText(input: {
  requestId: string;
  submittedAt: string;
  clientView: ClientViewModel;
  request: RequestFields;
  siteName: string;
}): string {
  const submittedDates =
    input.clientView.submittedDates.length > 0
      ? input.clientView.submittedDates
          .map((item) => `${item.label}: ${item.human} (${item.iso})`)
          .join("\n")
      : "No submitted dates";

  const nextSteps = input.clientView.nextSteps
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n");

  return [
    "Request received",
    "",
    "Your request has been submitted for manual review.",
    "",
    `Request ID: ${input.requestId}`,
    `Status: ${formatClientStatusText(input.clientView.status)}`,
    `Submitted: ${formatEmailDateTime(input.submittedAt)}`,
    "",
    "Request summary",
    `Subject type: ${input.request.subjectType || "Not set"}`,
    `Main question: ${input.request.mainQuestion || "Not set"}`,
    `Preferred depth: ${input.request.preferredDepth || "Not set"}`,
    "",
    "Submitted dates",
    submittedDates,
    "",
    "Next steps",
    nextSteps,
    "",
    "If you notice a date error, reply to this email before processing begins.",
    "",
    input.siteName,
  ].join("\n");
}

export function buildClientConfirmationHtml(input: {
  requestId: string;
  submittedAt: string;
  clientView: ClientViewModel;
  request: RequestFields;
  siteName: string;
  siteUrl: string;
}): string {
  const submittedDatesHtml =
    input.clientView.submittedDates.length > 0
      ? input.clientView.submittedDates
          .map(
            (item) => `
              <tr>
                <td style="padding:8px 0;color:#8da0b3;font-size:13px;vertical-align:top;">${escapeHtml(item.label)}</td>
                <td style="padding:8px 0;color:#eaf1f7;font-size:14px;">
                  ${escapeHtml(item.human)}<br />
                  <span style="color:#8da0b3;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;">
                    ${escapeHtml(item.iso)}
                  </span>
                </td>
              </tr>
            `
          )
          .join("")
      : `
          <tr>
            <td colspan="2" style="padding:8px 0;color:#8da0b3;font-size:13px;">
              No submitted dates
            </td>
          </tr>
        `;

  const nextStepsHtml = input.clientView.nextSteps
    .map(
      (step) =>
        `<li style="margin:0 0 8px;color:#d7e1ea;font-size:14px;line-height:1.6;">${escapeHtml(step)}</li>`
    )
    .join("");

  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#07111b;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:680px;margin:0 auto;padding:32px 18px;">
      <div style="border:1px solid rgba(255,255,255,0.12);background:#0c1825;border-radius:18px;padding:24px;">
        <p style="margin:0 0 10px;color:#8da0b3;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">
          Request received
        </p>

        <h1 style="margin:0 0 14px;color:#f3f7fb;font-size:28px;line-height:1.08;font-weight:600;">
          Your request has been submitted for manual review
        </h1>

        <p style="margin:0 0 18px;color:#c9d5df;font-size:15px;line-height:1.7;">
          Level, scope, pricing, and processing are confirmed only after review.
        </p>

        <div style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;margin:0 0 18px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding:8px 0;color:#8da0b3;font-size:13px;">Request ID</td>
              <td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${escapeHtml(input.requestId)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#8da0b3;font-size:13px;">Status</td>
              <td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${escapeHtml(formatClientStatusText(input.clientView.status))}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#8da0b3;font-size:13px;">Submitted</td>
              <td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${escapeHtml(formatEmailDateTime(input.submittedAt))}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#8da0b3;font-size:13px;">Subject type</td>
              <td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${escapeHtml(input.request.subjectType || "Not set")}</td>
            </tr>
          </table>
        </div>

        <div style="margin:0 0 18px;">
          <p style="margin:0 0 10px;color:#8da0b3;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">
            Request summary
          </p>
          <p style="margin:0 0 8px;color:#d7e1ea;font-size:14px;line-height:1.6;">
            <strong>Main question:</strong> ${escapeHtml(input.request.mainQuestion || "Not set")}
          </p>
          <p style="margin:0;color:#d7e1ea;font-size:14px;line-height:1.6;">
            <strong>Preferred depth:</strong> ${escapeHtml(input.request.preferredDepth || "Not set")}
          </p>
        </div>

        <div style="margin:0 0 18px;">
          <p style="margin:0 0 10px;color:#8da0b3;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">
            Submitted dates
          </p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${submittedDatesHtml}
          </table>
        </div>

        <div style="margin:0 0 18px;">
          <p style="margin:0 0 10px;color:#8da0b3;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">
            Next steps
          </p>
          <ol style="padding-left:18px;margin:0;">
            ${nextStepsHtml}
          </ol>
        </div>

        <div style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px;margin:0 0 18px;">
          <p style="margin:0;color:#c9d5df;font-size:14px;line-height:1.7;">
            If you notice a date error, reply to this email before processing begins.
          </p>
        </div>

        <div style="margin-top:22px;">
          <a
            href="${escapeHtml(input.siteUrl)}/access"
            style="display:inline-block;padding:12px 18px;border-radius:999px;background:#f3f7fb;color:#091522;text-decoration:none;font-size:14px;"
          >
            Return to Access
          </a>
        </div>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

function formatClientStatusText(status: ClientStatus): string {
  switch (status) {
    case "pending_manual_review":
      return "Pending manual review";
    case "correction_requested":
      return "Correction requested";
    case "ready_for_confirmation":
      return "Ready for confirmation";
    case "processing":
      return "Processing";
    case "closed":
      return "Closed";
  }
}

function formatEmailDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
