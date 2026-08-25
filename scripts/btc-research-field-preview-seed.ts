import { createNeonBtcResearchFieldStore } from "../lib/btc-research-field-neon";

async function main() {
  const databaseUrl = process.env.BTC_RESEARCH_FIELD_DATABASE_URL?.trim();
  if (!databaseUrl) throw new Error("BTC_RESEARCH_FIELD_DATABASE_URL required");
  const store = createNeonBtcResearchFieldStore(databaseUrl);
  const created = await store.createPendingField({
    locale: "en",
    title: "BTC Polymarket continuity preview",
    primaryQuestion: "How is the Bitcoin expectation field changing?",
    timeHorizon: "through 2026-12-31",
    evidencePreferences: ["polymarket", "binance", "market_structure"],
    watchConditions: ["material expectation change"],
    exactPolymarketContracts: [],
  });
  const activated = await store.activatePreview(created.field.fieldId);
  if (!activated) throw new Error("preview_activation_failed");
  console.log(JSON.stringify({
    fieldId: activated.fieldId,
    secret: created.secret,
    privatePath: `/crypto-astro/btc/field/${activated.fieldId}#${created.secret}`,
    serviceStart: activated.serviceStart,
    serviceEnd: activated.serviceEnd,
    realBtc: false,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
