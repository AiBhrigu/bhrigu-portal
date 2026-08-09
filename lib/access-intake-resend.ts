import { Resend } from "resend";

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
import type { AccessIntakeDelivery } from "./access-intake-runtime";

export function createResendAccessIntakeDelivery(config: {
  apiKey: string;
  fromEmail: string;
  operatorEmail: string;
  replyToEmail: string;
  siteName: string;
  siteUrl: string;
}): AccessIntakeDelivery {
  const resend = new Resend(config.apiKey);

  return {
    async send(input) {
      const record = input.record;
      const message =
        input.kind === "operator_notification"
          ? {
              to: config.operatorEmail,
              subject: buildOperatorNotificationSubject(
                record.requestId,
                record.derived.likelyLevel
              ),
              text: buildOperatorNotificationText({
                requestId: record.requestId,
                submittedAt: record.createdAt,
                operatorPacket: record.operatorPacket,
                siteName: config.siteName,
              }),
              html: buildOperatorNotificationHtml({
                requestId: record.requestId,
                submittedAt: record.createdAt,
                operatorPacket: record.operatorPacket,
                siteName: config.siteName,
                siteUrl: config.siteUrl,
              }),
            }
          : {
              to: record.request.email,
              subject: buildClientConfirmationSubject(record.requestId),
              text: buildClientConfirmationText({
                requestId: record.requestId,
                submittedAt: record.createdAt,
                clientView: record.clientView,
                request: record.request,
                siteName: config.siteName,
              }),
              html: buildClientConfirmationHtml({
                requestId: record.requestId,
                submittedAt: record.createdAt,
                clientView: record.clientView,
                request: record.request,
                siteName: config.siteName,
                siteUrl: config.siteUrl,
              }),
            };

      const { data, error } = await resend.emails.send(
        {
          from: config.fromEmail,
          to: message.to,
          replyTo: config.replyToEmail,
          subject: message.subject,
          text: message.text,
          html: message.html,
        },
        { idempotencyKey: input.idempotencyKey }
      );

      if (error || !data?.id) {
        throw new Error(error?.name || "resend_delivery_failed");
      }

      return { providerMessageId: data.id };
    },
  };
}
