import { neon } from "@neondatabase/serverless";

export type BtcCleanChatGuardDisposition =
  | "admitted"
  | "replay"
  | "rate_limited"
  | "concurrency_limited"
  | "budget_limited";

export type BtcCleanChatGuardDecision = {
  disposition: BtcCleanChatGuardDisposition;
  retryAfterSeconds: number;
};

function decision(row: Record<string, unknown> | undefined): BtcCleanChatGuardDecision {
  const disposition = String(row?.disposition ?? "");
  if (!["admitted", "replay", "rate_limited", "concurrency_limited", "budget_limited"].includes(disposition)) {
    throw new Error("btc_clean_chat_guard_decision_invalid");
  }
  return {
    disposition: disposition as BtcCleanChatGuardDisposition,
    retryAfterSeconds: Math.max(0, Number(row?.retry_after_seconds ?? 0) || 0),
  };
}

export function createNeonBtcCleanChatCostGuardStore(databaseUrl: string) {
  const sql = neon(databaseUrl);

  async function reserve(input: { admissionKey: string; clientKey: string; ipKey: string; now: Date; reservationMicros: number }) {
    const rows = await sql`
      SELECT * FROM btc_clean_chat_guard_reserve(
        ${input.admissionKey},${input.clientKey},${input.ipKey},${input.now.toISOString()},${input.reservationMicros}
      )
    `;
    return decision(rows[0] as Record<string, unknown> | undefined);
  }

  async function upgrade(input: { admissionKey: string; now: Date; reservationMicros: number }) {
    const rows = await sql`
      SELECT * FROM btc_clean_chat_guard_upgrade(
        ${input.admissionKey},${input.now.toISOString()},${input.reservationMicros}
      )
    `;
    return decision(rows[0] as Record<string, unknown> | undefined);
  }

  async function settle(input: { admissionKey: string; now: Date; actualMicros: number | null; state: "completed" | "failed" }) {
    await sql`
      SELECT btc_clean_chat_guard_settle(
        ${input.admissionKey},${input.now.toISOString()},${input.actualMicros},${input.state}
      )
    `;
  }

  return { reserve, upgrade, settle };
}
