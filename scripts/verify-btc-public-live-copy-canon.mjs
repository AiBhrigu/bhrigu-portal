import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const component = read("components/btc/BtcCosmographerDialogue.tsx");
const live = read("pages/crypto-astro/btc/live.tsx");
const projectionWorkflow = read(".github/workflows/btc-public-live-multi-body-projection-pr.yml");
const visualWorkflow = read(".github/workflows/btc-public-live-visual-information-acceptance-pr.yml");

const report = {
  schema: "btc_public_live_copy_canon_verifier_v0_1",
  status: "PASS",
  checks: {},
  failures: [],
};

function check(name, passed, details = "") {
  const ok = Boolean(passed);
  report.checks[name] = { passed: ok, details };
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${details ? ` · ${details}` : ""}`);
  if (!ok) report.failures.push(name);
}

function includes(source, value, name) {
  check(name, source.includes(value), value);
}

function excludes(source, value, name) {
  check(name, !source.includes(value), value);
}

includes(live, '"Чтение поля BTC · Market Cosmographer"', "ru_document_title");
includes(live, '"BTC Field Read · Market Cosmographer"', "en_document_title");
includes(live, "Аналитический диалог о протоколе Bitcoin, рынке BTC, памяти снимков и астрономических данных.", "ru_meta_description");
includes(live, "Analytical dialogue about the Bitcoin protocol, the BTC market, snapshot memory, and astronomical data.", "en_meta_description");

includes(component, '<p className="eyebrow">Market Cosmographer</p>', "hero_product_family");
includes(component, 'ru ? "Чтение поля BTC" : "BTC Field Read"', "hero_product_name");
includes(component, 'ru ? "Ваш вопрос о поле BTC" : "Your question about the BTC field"', "question_label");
includes(component, 'astromodule: ["Астрономические данные", "Astronomical data"]', "public_astro_domain_label");
includes(component, 'ASTRO_YEAR_OVERVIEW: ["Астрономические данные · годовой обзор", "Astronomical data · annual overview"]', "annual_mode_label");
includes(component, 'NAVIGATION: ["Навигация по полю BTC", "BTC field navigation"]', "navigation_mode_label");

const requiredMappings = [
  ["Планетарные аспекты 2026: пять главных окон", "Планетарные аспекты 2026: пять окон по принятому рейтингу"],
  ["Planetary aspects in 2026: five primary windows", "Planetary aspects in 2026: five windows by the accepted ranking"],
  ["Почему именно эти окна важны", "По каким критериям выбраны эти окна"],
  ["Why these windows matter", "How these windows were selected"],
  ["Астрономическое окно и ликвидность проверены как независимые слои", "Астрономические данные и ликвидность сопоставлены независимо"],
  ["The astronomy window and liquidity were checked as independent layers", "Astronomical data and liquidity were compared independently"],
  ["Халвинг запускается высотой блока", "Халвинг определяется высотой блока, а не календарной датой"],
  ["Halving is triggered by block height", "Halving is determined by block height, not a calendar date"],
  ["Контекст аспектов 2026 восстановлен", "Планетарные аспекты 2026: краткое продолжение"],
  ["The 2026 aspect context is restored", "Planetary aspects in 2026: concise continuation"],
  ["Медленный несущий контекст", "Долгосрочный астрономический контекст"],
  ["Slow carrier context", "Long-term astronomical context"],
  ["Граница трактовки", "Граница вывода"],
  ["Interpretation boundary", "Inference boundary"],
  ["Граница моста Astro × BTC", "Граница сопоставления"],
  ["Astro × BTC bridge boundary", "Comparison boundary"],
  ["Multi-body Astro proof доступен", "Астрономические доказательства доступны"],
  ["Multi-body Astro proof available", "Astronomical evidence available"],
  ["Astro proof + Market proof", "Астрономические и рыночные доказательства доступны"],
];

for (const [before, after] of requiredMappings) {
  includes(component, before, `mapping_source_${before}`);
  includes(component, after, `mapping_target_${after}`);
}

includes(component, "const canonicalSections = canonicalAnswerSections(props.locale, props.answer.sections);", "canonical_sections_before_session");
includes(component, "headline: canonicalPublicCopy(props.locale, props.answer.headline)", "canonical_headline_before_session");
includes(component, "direct_answer: canonicalPublicCopy(props.locale, props.answer.direct_answer)", "canonical_direct_answer_before_session");
includes(component, "source_boundary: canonicalPublicCopy(props.locale, props.answer.source_boundary)", "canonical_boundary_before_session");
includes(component, "proof_label: canonicalPublicCopy(props.locale, props.answer.proof_label)", "canonical_proof_before_session");

excludes(live, '"BTC Космограф · Bitcoin Corridor"', "old_ru_document_title_absent");
excludes(live, '"BTC Cosmographer · Bitcoin Corridor"', "old_en_document_title_absent");
excludes(component, '<p className="eyebrow">Bitcoin Corridor</p>', "old_hero_eyebrow_absent");
excludes(component, 'ru ? "BTC Космограф" : "BTC Cosmographer"', "old_hero_title_absent");
excludes(component, 'ASTRO_YEAR_OVERVIEW: ["Astromodule · годовой обзор", "Astromodule · annual overview"]', "old_annual_mode_absent");
excludes(component, 'NAVIGATION: ["Навигация Bitcoin Corridor", "Bitcoin Corridor navigation"]', "old_navigation_mode_absent");

includes(projectionWorkflow, "scripts/verify-btc-public-live-copy-canon.mjs", "projection_workflow_tracks_copy_verifier");
includes(projectionWorkflow, "Verify canonical product copy and headings", "projection_workflow_runs_copy_verifier");
includes(visualWorkflow, "scripts/verify-btc-public-live-copy-canon.mjs", "visual_scope_tracks_copy_verifier");

report.status = report.failures.length ? "FAIL" : "PASS";
const outDir = path.join(root, "artifacts");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "btc-public-live-copy-canon-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);

if (report.failures.length) {
  console.error(`COPY_CANON_FAILURES=${report.failures.length}`);
  process.exit(1);
}

console.log(`PASS_PUBLIC_LIVE_COPY_CANON=${Object.keys(report.checks).length}/${Object.keys(report.checks).length}`);
