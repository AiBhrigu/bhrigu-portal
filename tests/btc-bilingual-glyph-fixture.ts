declare const process: { env: Record<string, string | undefined> };

import {
  classifyBtcEnvelopeQuestion,
  type BtcEnvelopeQuestionClass,
} from "../lib/btc-market-envelope";
import {
  BTC_EXECUTIVE_QUESTION_LANGUAGE_SCHEMA,
  formatBtcQuestionExecutiveLead,
  formatBtcQuestionWatchNext,
} from "../lib/btc-executive-question-language";
import {
  BTC_BILINGUAL_EXAMPLE_ROUTES,
  BTC_PUBLIC_LANGUAGE_CONTRACT_SCHEMA,
  formatBtcModuleLabel,
  formatBtcObservationDate,
  formatBtcProofSource,
  formatBtcStateLabel,
  getBtcExampleRoutes,
  resolveBtcPublicLocale,
  type BtcPublicLocale,
} from "../lib/btc-public-language-contract";
import { canonicalizeBtcQuestionForRouter } from "../lib/btc-public-question-bridge";
import {
  BTC_EXISTING_GLYPH_BINDING,
  BTC_EXISTING_GLYPH_CLASSES,
  BTC_EXISTING_PRIMARY_ROUTE_PATH,
  BTC_EXISTING_SUPPORT_ROUTE_PATH,
  BTC_GLYPH_BINDING_BOUNDARY,
  MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256,
} from "../lib/btc-existing-glyph-canon";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(
  BTC_PUBLIC_LANGUAGE_CONTRACT_SCHEMA === "btc_public_language_contract_v0_1",
  "Language schema mismatch",
);
assert(
  BTC_EXECUTIVE_QUESTION_LANGUAGE_SCHEMA ===
    "btc_executive_question_language_v0_1",
  "Executive question-language schema mismatch",
);
assert(
  resolveBtcPublicLocale("ru", "English question").locale === "ru",
  "Explicit RU not respected",
);
assert(
  resolveBtcPublicLocale("en", "Что изменилось?").locale === "en",
  "Explicit EN not respected",
);
assert(
  resolveBtcPublicLocale("", "Что изменилось в поле BTC?").locale === "ru",
  "Cyrillic detection failed",
);
assert(
  resolveBtcPublicLocale("", "What changed in BTC?").locale === "en",
  "English default failed",
);

const allRoutes = [
  ...BTC_BILINGUAL_EXAMPLE_ROUTES.en,
  ...BTC_BILINGUAL_EXAMPLE_ROUTES.ru,
];
assert(allRoutes.length === 10, "Expected ten bilingual example routes");
assert(
  getBtcExampleRoutes("en").length === 5 &&
    getBtcExampleRoutes("ru").length === 5,
  "Expected five routes per locale",
);
assert(
  new Set(BTC_BILINGUAL_EXAMPLE_ROUTES.en.map((route) => route.id)).size ===
    5,
  "EN route IDs are not unique",
);
assert(
  new Set(BTC_BILINGUAL_EXAMPLE_ROUTES.ru.map((route) => route.id)).size ===
    5,
  "RU route IDs are not unique",
);

for (const route of allRoutes) {
  const coreQuestion = canonicalizeBtcQuestionForRouter(route.question);
  const questionClass = classifyBtcEnvelopeQuestion(coreQuestion);
  assert(
    questionClass === route.expected_question_class,
    `${route.id} question class mismatch: ${questionClass}`,
  );
  assert(
    route.expected_primary_modules.length === 2,
    `${route.id} primary module contract invalid`,
  );
  assert(
    new Set(route.expected_primary_modules).size === 2,
    `${route.id} primary modules duplicate`,
  );
}

const russianTrading = canonicalizeBtcQuestionForRouter(
  "Стоит ли мне купить или продать BTC и какую ценовую цель использовать?",
);
assert(
  russianTrading ===
    "Should I buy or sell BTC now, and what price target should I use?",
  "Russian trading request did not reach the canonical safety handoff",
);

const russianDominance = canonicalizeBtcQuestionForRouter(
  "Что означает текущая доминация BTC для более широкого рынка?",
);
assert(
  russianDominance ===
    "What does BTC dominance mean for the wider market gravity?",
  "Russian dominance noun did not reach the gravity bridge",
);
assert(
  classifyBtcEnvelopeQuestion(russianDominance) === "btc_gravity",
  "Russian dominance noun did not reach BTC gravity routing",
);

const questionClasses: readonly BtcEnvelopeQuestionClass[] = [
  "btc_gravity",
  "market_structure",
  "liquidity",
  "market_participation_rotation",
  "change_memory",
  "temporal_pressure",
  "general_btc_field",
];
const timestamp = "2026-07-26T10:51:12Z";
for (const locale of ["en", "ru"] as const satisfies readonly BtcPublicLocale[]) {
  const leads = questionClasses.map((questionClass) =>
    formatBtcQuestionExecutiveLead(locale, questionClass, "DIVERGENCE"),
  );
  const watches = questionClasses.map((questionClass) =>
    formatBtcQuestionWatchNext(locale, questionClass, timestamp),
  );
  assert(
    new Set(leads).size === questionClasses.length,
    `${locale} executive leads are not question-specific`,
  );
  assert(
    new Set(watches).size === questionClasses.length,
    `${locale} watch conditions are not question-specific`,
  );
  assert(
    leads.every((lead) => lead.length >= 80 && lead.length <= 360),
    `${locale} executive lead length outside bounded product range`,
  );
  assert(
    watches.every((watch) => watch.includes(timestamp)),
    `${locale} watch condition lost accepted snapshot timestamp`,
  );
}

const temporalLeadEn = formatBtcQuestionExecutiveLead(
  "en",
  "temporal_pressure",
  "DIVERGENCE",
);
const temporalLeadRu = formatBtcQuestionExecutiveLead(
  "ru",
  "temporal_pressure",
  "DIVERGENCE",
);
assert(
  temporalLeadEn.includes("market facts tied to the accepted snapshot"),
  "EN temporal lead lost immutable market-fact boundary",
);
assert(
  temporalLeadRu.includes("рыночные факты привязанными к принятому снимку"),
  "RU temporal lead lost immutable market-fact boundary",
);

assert(
  formatBtcModuleLabel("ru", "market_structure") === "СТРУКТУРА РЫНКА",
  "RU module label mismatch",
);
assert(
  formatBtcModuleLabel("en", "market_structure") === "MARKET STRUCTURE",
  "EN module label mismatch",
);
assert(
  formatBtcStateLabel("ru", "DIVERGENCE") === "Смешанные сигналы",
  "RU synthesis label mismatch",
);
assert(
  formatBtcObservationDate("ru", "2026-07-23") === "23 июл 2026",
  "RU date mismatch",
);
assert(
  formatBtcObservationDate("en", "2026-07-23") === "23 Jul 2026",
  "EN date mismatch",
);

assert(
  formatBtcProofSource("coingecko_global").startsWith("CoinGecko"),
  "CoinGecko canonical name lost",
);
assert(
  formatBtcProofSource("defillama_protocols").startsWith("DefiLlama"),
  "DefiLlama canonical name lost",
);

assert(
  MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256 ===
    "4034ba35df2d738e7f2cbe1d266fd9a2188aa3972ab629b9cd49f4f05258eb04",
  "Glyph canon hash mismatch",
);
assert(BTC_EXISTING_GLYPH_CLASSES.length === 10, "Unexpected glyph family expansion");
assert(
  BTC_EXISTING_PRIMARY_ROUTE_PATH.startsWith("M120 100"),
  "Primary native route path changed",
);
assert(
  BTC_EXISTING_SUPPORT_ROUTE_PATH.startsWith("M145 125"),
  "Support native route path changed",
);
assert(
  BTC_EXISTING_GLYPH_BINDING.watch_point === null,
  "Watch-point glyph was silently invented",
);
assert(
  BTC_EXISTING_GLYPH_BINDING.source_verified === null,
  "Source-verified glyph was silently invented",
);
assert(
  BTC_GLYPH_BINDING_BOUNDARY.external_icon_pack === false,
  "External icon pack boundary changed",
);
assert(
  BTC_GLYPH_BINDING_BOUNDARY.decorative_repetition === false,
  "Decorative repetition boundary changed",
);

const report = {
  schema_version: "btc_bilingual_glyph_fixture_report_v0_1",
  head_sha: process.env.GITHUB_SHA ?? "LOCAL",
  locales: ["en", "ru"],
  example_routes: allRoutes.length,
  real_router_question_classes: "PASS",
  russian_dominance_noun_route: "PASS",
  question_specific_executive_leads: "PASS",
  question_specific_watch_conditions: "PASS",
  russian_trading_safety_handoff: "PASS",
  canonical_source_names: "PASS",
  glyph_canon_sha256: MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256,
  existing_glyphs_only: "PASS",
  unmapped_watch_point: "TEXT_ONLY",
  unmapped_source_verified: "QUIET_ONLY",
} as const;

console.log(JSON.stringify(report));
