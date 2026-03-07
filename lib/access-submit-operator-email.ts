// lib/access-submit-operator-email.ts

import type {
  FreyReport,
  FreyReportReady,
  LikelyLevel,
  OperatorPacketModel,
} from "./access-models";

export interface AccessOperatorEmailAdapter {
  sendOperatorNotification(input: {
    operatorEmail: string;
    requestId: string;
    submittedAt: string;
    operatorPacket: OperatorPacketModel;
  }): Promise<void>;
}

export interface AccessOperatorEmailProvider {
  send(message: AccessOperatorEmailMessage): Promise<void>;
}

export interface AccessOperatorEmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export interface AccessOperatorEmailConfig {
  fromEmail: string;
  replyToEmail?: string;
  siteName: string;
  siteUrl: string;
}

export function createAccessOperatorEmailAdapter(
  provider: AccessOperatorEmailProvider,
  config: AccessOperatorEmailConfig
): AccessOperatorEmailAdapter {
  return {
    async sendOperatorNotification(input) {
      const subject = buildOperatorNotificationSubject(
        input.requestId,
        input.operatorPacket.derived.likelyLevel
      );

      const text = buildOperatorNotificationText({
        requestId: input.requestId,
        submittedAt: input.submittedAt,
        operatorPacket: input.operatorPacket,
        siteName: config.siteName,
      });

      const html = buildOperatorNotificationHtml({
        requestId: input.requestId,
        submittedAt: input.submittedAt,
        operatorPacket: input.operatorPacket,
        siteName: config.siteName,
        siteUrl: config.siteUrl,
      });

      await provider.send({
        to: input.operatorEmail,
        subject,
        text,
        html,
        replyTo: config.replyToEmail,
      });
    },
  };
}

export interface FetchOperatorEmailProviderOptions {
  endpoint: string;
  apiKey: string;
  fromEmail: string;
  timeoutMs?: number;
}

export function createFetchOperatorEmailProvider(
  options: FetchOperatorEmailProviderOptions
): AccessOperatorEmailProvider {
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
            `Operator email provider failed: ${response.status} ${body || ""}`.trim()
          );
        }
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export function createConsoleOperatorEmailProvider(): AccessOperatorEmailProvider {
  return {
    async send(message) {
      console.log("[access-operator-email]", {
        to: message.to,
        subject: message.subject,
        replyTo: message.replyTo ?? null,
        text: message.text,
      });
    },
  };
}

export function buildOperatorNotificationSubject(
  requestId: string,
  likelyLevel: LikelyLevel
): string {
  return `New access request — ${requestId} — ${likelyLevel}`;
}

export function buildOperatorNotificationText(input: {
  requestId: string;
  submittedAt: string;
  operatorPacket: OperatorPacketModel;
  siteName: string;
}): string {
  const packet = input.operatorPacket;

  const dates =
    packet.normalizedDates.length > 0
      ? packet.normalizedDates
          .map((d) => {
            const main =
              d.human && d.iso
                ? `${d.label}: ${d.human} (${d.iso})`
                : `${d.label}: not resolved`;
            return `- ${main} [${d.status}]`;
          })
          .join("\n")
      : "- No normalized dates";

  const escalation =
    packet.derived.manualEscalationReasons.length > 0
      ? packet.derived.manualEscalationReasons.map((x) => `- ${x}`).join("\n")
      : "- None";

  const missingFields =
    packet.derived.criticalMissingFields.length > 0
      ? packet.derived.criticalMissingFields.map((x) => `- ${x}`).join("\n")
      : "- None";

  return [
    "New access request",
    "",
    `Request ID: ${input.requestId}`,
    `Submitted: ${formatOperatorEmailDateTime(input.submittedAt)}`,
    `Likely level: ${packet.derived.likelyLevel}`,
    `Anchor integrity: ${packet.derived.anchorIntegrity}`,
    `Manual escalation: ${packet.derived.manualEscalation ? "Yes" : "No"}`,
    "",
    "Request",
    `Name: ${packet.request.name}`,
    `Email: ${packet.request.email}`,
    `Subject type: ${packet.request.subjectType || "Not set"}`,
    `Main question: ${packet.request.mainQuestion || "Not set"}`,
    `Preferred depth: ${packet.request.preferredDepth || "Not set"}`,
    "",
    "Operator summary",
    `Primary anchor: ${packet.operatorSummary.primaryAnchor}`,
    `Signal state: ${packet.operatorSummary.signalState}`,
    `Review readiness: ${packet.operatorSummary.reviewReadiness}`,
    "",
    "Temporal meta",
    `Access entry: ${packet.requestTemporalMeta.accessEntryAt || "Not set"}`,
    `Draft started: ${packet.requestTemporalMeta.draftStartedAt || "Not set"}`,
    `Date confirmation: ${packet.requestTemporalMeta.dateConfirmationCompletedAt || "Not set"}`,
    `Submitted: ${packet.requestTemporalMeta.requestSubmittedAt || input.submittedAt}`,
    `Entry source: ${packet.requestTemporalMeta.accessEntrySource}`,
    `Resume count: ${packet.requestTemporalMeta.resumeCount}`,
    `Draft duration ms: ${packet.requestTemporalMeta.draftDurationMs ?? "Not set"}`,
    `Correction requested: ${packet.requestTemporalMeta.correctionRequested ? "Yes" : "No"}`,
    "",
    "Normalized dates",
    dates,
    "",
    "Critical missing fields",
    missingFields,
    "",
    "Manual escalation reasons",
    escalation,
    "",
    input.siteName,
  ].join("\n");
}

export function buildOperatorNotificationHtml(input: {
  requestId: string;
  submittedAt: string;
  operatorPacket: OperatorPacketModel;
  siteName: string;
  siteUrl: string;
}): string {
  const packet = input.operatorPacket;

  const datesHtml =
    packet.normalizedDates.length > 0
      ? packet.normalizedDates
          .map((d) => {
            const value =
              d.human && d.iso
                ? `${escapeHtml(d.human)}<br /><span style="color:#8da0b3;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;">${escapeHtml(d.iso)}</span>`
                : "not resolved";

            return `
              <tr>
                <td style="padding:8px 0;color:#8da0b3;font-size:13px;vertical-align:top;">${escapeHtml(d.label)}</td>
                <td style="padding:8px 0;color:#eaf1f7;font-size:14px;">${value}</td>
                <td style="padding:8px 0;color:#8da0b3;font-size:12px;vertical-align:top;">${escapeHtml(d.status)}</td>
              </tr>
            `;
          })
          .join("")
      : `
          <tr>
            <td colspan="3" style="padding:8px 0;color:#8da0b3;font-size:13px;">No normalized dates</td>
          </tr>
        `;

  const escalationHtml =
    packet.derived.manualEscalationReasons.length > 0
      ? packet.derived.manualEscalationReasons
          .map((x) => `<li style="margin:0 0 8px;color:#d7e1ea;font-size:14px;">${escapeHtml(x)}</li>`)
          .join("")
      : `<li style="margin:0 0 8px;color:#8da0b3;font-size:14px;">None</li>`;

  const missingHtml =
    packet.derived.criticalMissingFields.length > 0
      ? packet.derived.criticalMissingFields
          .map((x) => `<li style="margin:0 0 8px;color:#ffd2d2;font-size:14px;">${escapeHtml(x)}</li>`)
          .join("")
      : `<li style="margin:0 0 8px;color:#8da0b3;font-size:14px;">None</li>`;

  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#07111b;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:760px;margin:0 auto;padding:32px 18px;">
      <div style="border:1px solid rgba(255,255,255,0.12);background:#0c1825;border-radius:18px;padding:24px;">
        <p style="margin:0 0 10px;color:#8da0b3;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">New access request</p>

        <h1 style="margin:0 0 14px;color:#f3f7fb;font-size:28px;line-height:1.08;font-weight:600;">
          ${escapeHtml(input.requestId)} — ${escapeHtml(packet.derived.likelyLevel)}
        </h1>

        <p style="margin:0 0 18px;color:#c9d5df;font-size:15px;line-height:1.7;">
          Submitted ${escapeHtml(formatOperatorEmailDateTime(input.submittedAt))}
        </p>

        <div style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px;margin:0 0 18px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td style="padding:8px 0;color:#8da0b3;font-size:13px;">Likely level</td><td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${escapeHtml(packet.derived.likelyLevel)}</td></tr>
            <tr><td style="padding:8px 0;color:#8da0b3;font-size:13px;">Anchor integrity</td><td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${escapeHtml(packet.derived.anchorIntegrity)}</td></tr>
            <tr><td style="padding:8px 0;color:#8da0b3;font-size:13px;">Manual escalation</td><td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${packet.derived.manualEscalation ? "Yes" : "No"}</td></tr>
            <tr><td style="padding:8px 0;color:#8da0b3;font-size:13px;">Primary anchor</td><td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${escapeHtml(packet.operatorSummary.primaryAnchor)}</td></tr>
            <tr><td style="padding:8px 0;color:#8da0b3;font-size:13px;">Signal state</td><td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${escapeHtml(packet.operatorSummary.signalState)}</td></tr>
          </table>
        </div>

        <div style="margin:0 0 18px;">
          <p style="margin:0 0 10px;color:#8da0b3;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">Request</p>
          <p style="margin:0 0 8px;color:#d7e1ea;font-size:14px;line-height:1.6;"><strong>Name:</strong> ${escapeHtml(packet.request.name)}</p>
          <p style="margin:0 0 8px;color:#d7e1ea;font-size:14px;line-height:1.6;"><strong>Email:</strong> ${escapeHtml(packet.request.email)}</p>
          <p style="margin:0 0 8px;color:#d7e1ea;font-size:14px;line-height:1.6;"><strong>Subject type:</strong> ${escapeHtml(packet.request.subjectType || "Not set")}</p>
          <p style="margin:0 0 8px;color:#d7e1ea;font-size:14px;line-height:1.6;"><strong>Main question:</strong> ${escapeHtml(packet.request.mainQuestion || "Not set")}</p>
          <p style="margin:0;color:#d7e1ea;font-size:14px;line-height:1.6;"><strong>Preferred depth:</strong> ${escapeHtml(packet.request.preferredDepth || "Not set")}</p>
        </div>

        <div style="margin:0 0 18px;">
          <p style="margin:0 0 10px;color:#8da0b3;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">Temporal meta</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr><td style="padding:8px 0;color:#8da0b3;font-size:13px;">Access entry</td><td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${escapeHtml(packet.requestTemporalMeta.accessEntryAt || "Not set")}</td></tr>
            <tr><td style="padding:8px 0;color:#8da0b3;font-size:13px;">Draft started</td><td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${escapeHtml(packet.requestTemporalMeta.draftStartedAt || "Not set")}</td></tr>
            <tr><td style="padding:8px 0;color:#8da0b3;font-size:13px;">Date confirmation</td><td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${escapeHtml(packet.requestTemporalMeta.dateConfirmationCompletedAt || "Not set")}</td></tr>
            <tr><td style="padding:8px 0;color:#8da0b3;font-size:13px;">Submitted</td><td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${escapeHtml(packet.requestTemporalMeta.requestSubmittedAt || input.submittedAt)}</td></tr>
            <tr><td style="padding:8px 0;color:#8da0b3;font-size:13px;">Entry source</td><td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${escapeHtml(packet.requestTemporalMeta.accessEntrySource)}</td></tr>
            <tr><td style="padding:8px 0;color:#8da0b3;font-size:13px;">Resume count</td><td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${packet.requestTemporalMeta.resumeCount}</td></tr>
            <tr><td style="padding:8px 0;color:#8da0b3;font-size:13px;">Draft duration ms</td><td style="padding:8px 0;color:#f3f7fb;font-size:14px;">${packet.requestTemporalMeta.draftDurationMs ?? "Not set"}</td></tr>
          </table>
        </div>

        <div style="margin:0 0 18px;">
          <p style="margin:0 0 10px;color:#8da0b3;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">Normalized dates</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            ${datesHtml}
          </table>
        </div>

        <div style="margin:0 0 18px;">
          <p style="margin:0 0 10px;color:#8da0b3;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">Critical missing fields</p>
          <ul style="padding-left:18px;margin:0;">
            ${missingHtml}
          </ul>
        </div>

        <div style="margin:0 0 18px;">
          <p style="margin:0 0 10px;color:#8da0b3;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">Manual escalation reasons</p>
          <ul style="padding-left:18px;margin:0;">
            ${escalationHtml}
          </ul>
        </div>

        <div style="margin-top:22px;">
          <a
            href="${escapeHtml(input.siteUrl)}/access"
            style="display:inline-block;padding:12px 18px;border-radius:999px;background:#f3f7fb;color:#091522;text-decoration:none;font-size:14px;"
          >
            Open Access
          </a>
        </div>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

function formatOperatorEmailDateTime(iso: string): string {
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
