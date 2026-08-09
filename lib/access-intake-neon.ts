import { neon } from "@neondatabase/serverless";

import type { StoredAccessSubmissionV1 } from "./access-models";
import type {
  AccessDeliveryKind,
  AccessIntakeStore,
} from "./access-intake-runtime";

export interface AccessReviewRequest {
  record: StoredAccessSubmissionV1;
  deliveries: Array<{
    kind: AccessDeliveryKind;
    state: string;
    attempts: number;
    providerMessageId: string | null;
    lastErrorCode: string | null;
  }>;
}

export function createNeonAccessIntakeStore(
  databaseUrl: string
): AccessIntakeStore & {
  listForReview(limit?: number): Promise<AccessReviewRequest[]>;
} {
  // Deliberately lazy and request-scoped: importing this module cannot fail a build
  // when the Marketplace has not provisioned DATABASE_URL yet.
  const sql = neon(databaseUrl);

  return {
    async reserve(input) {
      const recordJson = JSON.stringify(input.record);
      const [insertedRows] = await sql.transaction((tx) => [
        tx`
          INSERT INTO access_intake_requests (
            request_id,
            idempotency_key,
            payload_hash,
            record,
            status,
            created_at,
            updated_at
          ) VALUES (
            ${input.record.requestId},
            ${input.idempotencyKey},
            ${input.payloadHash},
            ${recordJson}::jsonb,
            ${input.record.status},
            ${input.record.createdAt},
            ${input.record.updatedAt}
          )
          ON CONFLICT (idempotency_key) DO NOTHING
          RETURNING request_id, payload_hash, record
        `,
        tx`
          INSERT INTO access_intake_deliveries (
            request_id, kind, idempotency_key, state
          )
          SELECT request_id, 'operator_notification',
            ${input.deliveryKeys.operator_notification}, 'pending'
          FROM access_intake_requests
          WHERE idempotency_key = ${input.idempotencyKey}
            AND payload_hash = ${input.payloadHash}
          ON CONFLICT (request_id, kind) DO NOTHING
        `,
        tx`
          INSERT INTO access_intake_deliveries (
            request_id, kind, idempotency_key, state
          )
          SELECT request_id, 'client_confirmation',
            ${input.deliveryKeys.client_confirmation}, 'pending'
          FROM access_intake_requests
          WHERE idempotency_key = ${input.idempotencyKey}
            AND payload_hash = ${input.payloadHash}
          ON CONFLICT (request_id, kind) DO NOTHING
        `,
      ]);

      const inserted = firstRow(insertedRows);
      if (inserted) {
        return {
          disposition: "created" as const,
          record: parseRecord(inserted.record),
        };
      }

      const existingRows = await sql`
        SELECT payload_hash, record
        FROM access_intake_requests
        WHERE idempotency_key = ${input.idempotencyKey}
        LIMIT 1
      `;
      const existing = firstRow(existingRows);
      if (!existing) throw new Error("idempotency_reservation_missing");

      return {
        disposition:
          existing.payload_hash === input.payloadHash ? "replay" : "conflict",
        record: parseRecord(existing.record),
      };
    },

    async claimDelivery(input) {
      const rows = await sql`
        UPDATE access_intake_deliveries
        SET
          state = 'sending',
          attempts = attempts + 1,
          claimed_at = ${input.claimedAt},
          updated_at = ${input.claimedAt},
          last_error_code = NULL
        WHERE request_id = ${input.requestId}
          AND kind = ${input.kind}
          AND (
            state IN ('pending', 'failed')
            OR (state = 'sending' AND claimed_at < NOW() - INTERVAL '5 minutes')
          )
        RETURNING idempotency_key
      `;
      const row = firstRow(rows);
      return {
        claimed: Boolean(row),
        idempotencyKey: row ? String(row.idempotency_key) : null,
      };
    },

    async completeDelivery(input) {
      await sql`
        UPDATE access_intake_deliveries
        SET
          state = 'delivered',
          provider_message_id = ${input.providerMessageId},
          delivered_at = ${input.deliveredAt},
          updated_at = ${input.deliveredAt},
          last_error_code = NULL
        WHERE request_id = ${input.requestId}
          AND kind = ${input.kind}
          AND state = 'sending'
      `;
    },

    async failDelivery(input) {
      await sql`
        UPDATE access_intake_deliveries
        SET
          state = 'failed',
          last_error_code = ${input.errorCode},
          updated_at = ${input.failedAt}
        WHERE request_id = ${input.requestId}
          AND kind = ${input.kind}
          AND state = 'sending'
      `;
    },

    async listForReview(limit = 20) {
      const boundedLimit = Math.max(1, Math.min(50, Math.trunc(limit)));
      const rows = await sql`
        SELECT
          r.record,
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'kind', d.kind,
                'state', d.state,
                'attempts', d.attempts,
                'providerMessageId', d.provider_message_id,
                'lastErrorCode', d.last_error_code
              ) ORDER BY d.kind
            ) FILTER (WHERE d.request_id IS NOT NULL),
            '[]'::jsonb
          ) AS deliveries
        FROM access_intake_requests r
        LEFT JOIN access_intake_deliveries d ON d.request_id = r.request_id
        GROUP BY r.request_id, r.created_at
        ORDER BY r.created_at DESC
        LIMIT ${boundedLimit}
      `;

      return rows.map((row) => ({
        record: parseRecord(row.record),
        deliveries: parseJson(row.deliveries) as AccessReviewRequest["deliveries"],
      }));
    },
  };
}

function firstRow(rows: unknown): Record<string, any> | null {
  return Array.isArray(rows) && rows.length > 0
    ? (rows[0] as Record<string, any>)
    : null;
}

function parseRecord(value: unknown): StoredAccessSubmissionV1 {
  return parseJson(value) as StoredAccessSubmissionV1;
}

function parseJson(value: unknown): unknown {
  if (typeof value === "string") return JSON.parse(value);
  return value;
}
