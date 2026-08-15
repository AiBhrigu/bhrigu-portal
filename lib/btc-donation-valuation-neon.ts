import { neon } from "@neondatabase/serverless";
import type { DonationValuationPoint, DonationValuationRecord } from "./btc-donation-valuation";

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function rowToRecord(row: Record<string, unknown>): DonationValuationRecord {
  if (row.no_consideration !== true) throw new Error("donation_valuation_row_invalid");
  return {
    receiptId: String(row.receipt_id),
    valuationPoint: String(row.valuation_point) as DonationValuationPoint,
    asset: "BTC",
    amountSats: String(row.amount_sats),
    classification: "VOLUNTARY_NON_CHARITABLE_SUPPORT",
    noConsideration: true,
    requestedValuationTimestamp: iso(row.requested_valuation_timestamp),
    sourceReturnedTimestamp: iso(row.source_returned_timestamp),
    retrievalTimestamp: iso(row.retrieval_timestamp),
    valuationSource: "MEMPOOL_SPACE_HISTORICAL_PRICE_V1",
    valuationSourceProvenance: String(row.valuation_source_provenance),
    btcReferencePrice: String(row.btc_reference_price),
    fiatReferenceCurrency: "USD",
    fiatReferenceValue: String(row.fiat_reference_value),
    createdAt: iso(row.created_at),
  };
}

function sameRecord(a: DonationValuationRecord, b: DonationValuationRecord) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function createNeonBtcDonationValuationStore(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return {
    async findValuation(receiptId: string, point: DonationValuationPoint): Promise<DonationValuationRecord | null> {
      const rows = await sql`SELECT * FROM btc_donation_receipt_valuations WHERE receipt_id=${receiptId} AND valuation_point=${point} LIMIT 1`;
      return rows[0] ? rowToRecord(rows[0] as Record<string, unknown>) : null;
    },
    async recordValuation(record: DonationValuationRecord): Promise<"created" | "replay" | "conflict"> {
      const inserted = await sql`
        INSERT INTO btc_donation_receipt_valuations(
          receipt_id,valuation_point,asset,amount_sats,classification,no_consideration,
          requested_valuation_timestamp,source_returned_timestamp,retrieval_timestamp,
          valuation_source,valuation_source_provenance,btc_reference_price,
          fiat_reference_currency,fiat_reference_value,created_at
        ) VALUES (
          ${record.receiptId},${record.valuationPoint},${record.asset},${record.amountSats},${record.classification},${record.noConsideration},
          ${record.requestedValuationTimestamp},${record.sourceReturnedTimestamp},${record.retrievalTimestamp},
          ${record.valuationSource},${record.valuationSourceProvenance},${record.btcReferencePrice},
          ${record.fiatReferenceCurrency},${record.fiatReferenceValue},${record.createdAt}
        ) ON CONFLICT (receipt_id,valuation_point) DO NOTHING RETURNING *
      `;
      if (inserted[0]) return "created";
      const rows = await sql`SELECT * FROM btc_donation_receipt_valuations WHERE receipt_id=${record.receiptId} AND valuation_point=${record.valuationPoint} LIMIT 1`;
      if (!rows[0]) throw new Error("donation_valuation_missing_after_conflict");
      return sameRecord(rowToRecord(rows[0] as Record<string, unknown>), record) ? "replay" : "conflict";
    },
  };
}
