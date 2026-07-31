# COPY_CANON_TARGETED_REPAIR_v0_1
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}: {old[:120]!r}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


def insert_after(path: str, anchor: str, addition: str) -> None:
    replace_once(path, anchor, anchor + addition)


# Public document identity: product first, internal routing absent.
replace_once(
    "pages/crypto-astro/btc/live.tsx",
    '''  const title = props.locale === "ru"
    ? "BTC Космограф · Bitcoin Corridor"
    : "BTC Cosmographer · Bitcoin Corridor";
  const description = props.locale === "ru"
    ? "Навигационный диалог по протоколу Bitcoin, BTC Market, Snapshot Memory и Astromodule."
    : "A navigational dialogue across Bitcoin Protocol, BTC Market, Snapshot Memory and Astromodule.";''',
    '''  const title = props.locale === "ru"
    ? "Чтение поля BTC · Market Cosmographer"
    : "BTC Field Read · Market Cosmographer";
  const description = props.locale === "ru"
    ? "Аналитический диалог о протоколе Bitcoin, рынке BTC, памяти снимков и астрономических данных."
    : "Analytical dialogue about the Bitcoin protocol, the BTC market, snapshot memory, and astronomical data.";''',
)

component = "components/btc/BtcCosmographerDialogue.tsx"

replace_once(
    component,
    '''function publicDomainLabel(locale: BtcPublicLocale, domain: string): string {
  const labels: Record<string, [string, string]> = {
    bitcoin_protocol: ["Bitcoin Protocol", "Bitcoin Protocol"],
    btc_market: ["BTC Market", "BTC Market"],
    snapshot_memory: ["Snapshot Memory", "Snapshot Memory"],
    astromodule: ["Astromodule", "Astromodule"],
    astro_btc_bridge: ["Astro × BTC", "Astro × BTC"],
    methodology: ["Метод и доказательность", "Method and evidence"],
    navigation: ["Навигация Bitcoin Corridor", "Bitcoin Corridor navigation"],
    unsupported: ["Граница поддержки", "Support boundary"],
  };
  const value = labels[domain] ?? [domain, domain];
  return locale === "ru" ? value[0] : value[1];
}
''',
    '''function publicDomainLabel(locale: BtcPublicLocale, domain: string): string {
  const labels: Record<string, [string, string]> = {
    bitcoin_protocol: ["Протокол Bitcoin", "Bitcoin Protocol"],
    btc_market: ["Рынок BTC", "BTC Market"],
    snapshot_memory: ["Память снимков", "Snapshot Memory"],
    astromodule: ["Астрономические данные", "Astronomical data"],
    astro_btc_bridge: ["Астрономия × BTC", "Astronomy × BTC"],
    methodology: ["Метод и доказательность", "Method and evidence"],
    navigation: ["Навигация по полю BTC", "BTC field navigation"],
    unsupported: ["Граница поддержки", "Support boundary"],
  };
  const value = labels[domain] ?? [domain, domain];
  return locale === "ru" ? value[0] : value[1];
}

const CANONICAL_PUBLIC_COPY: Record<BtcPublicLocale, Array<[string, string]>> = {
  ru: [
    ["Планетарные аспекты 2026: пять главных окон", "Планетарные аспекты 2026: пять окон по принятому рейтингу"],
    ["Почему именно эти окна важны", "По каким критериям выбраны эти окна"],
    ["Астрономическое окно и ликвидность проверены как независимые слои", "Астрономические данные и ликвидность сопоставлены независимо"],
    ["Халвинг запускается высотой блока", "Халвинг определяется высотой блока, а не календарной датой"],
    ["Контекст аспектов 2026 восстановлен", "Планетарные аспекты 2026: краткое продолжение"],
    ["Самая плотная тактическая связка", "Наибольшая концентрация точных аспектов"],
    ["самая плотная тактическая связка", "наибольшая концентрация точных аспектов"],
    ["многомесячный несущий слой", "долгосрочный астрономический контекст"],
    ["Медленный несущий контекст", "Долгосрочный астрономический контекст"],
    ["Внутренний анализ идёт от медленных пар к быстрым активаторам. Пользовательский ответ идёт от ближайших окон к многомесячному слою. Быстрый триггер уточняет момент, но не заменяет родительский цикл.", "Анализ начинается с долгосрочных конфигураций и переходит к более быстрым астрономическим событиям. Ответ пользователю идёт от ближайших окон к долгосрочному контексту. Более быстрое событие уточняет момент, но не заменяет долгосрочную конфигурацию."],
    ["сохранённому годовому коридору", "сохранённому годовому обзору"],
    ["Граница трактовки", "Граница вывода"],
    ["Граница моста Astro × BTC", "Граница сопоставления"],
    ["Multi-body Astro proof доступен", "Астрономические доказательства доступны"],
    ["Astro proof + Market proof", "Астрономические и рыночные доказательства доступны"],
    ["Protocol proof доступен", "Доказательства протокола доступны"],
    ["Astro proof ограничен", "Астрономические доказательства ограничены"],
    ["Market proof доступен", "Рыночные доказательства доступны"],
    ["Market proof недоступен", "Рыночные доказательства недоступны"],
    ["Method proof доступен", "Доказательства метода доступны"],
    ["Capability registry", "Реестр возможностей"],
    ["Рыночный evidence временно недоступен", "Рыночные доказательства временно недоступны"],
    ["Основные маршруты Bitcoin Corridor", "Основные маршруты поля BTC"],
    ["Навигация Bitcoin Corridor", "Навигация по полю BTC"],
    ["Astromodule", "Астрономические данные"],
  ],
  en: [
    ["Planetary aspects in 2026: five primary windows", "Planetary aspects in 2026: five windows by the accepted ranking"],
    ["Why these windows matter", "How these windows were selected"],
    ["The astronomy window and liquidity were checked as independent layers", "Astronomical data and liquidity were compared independently"],
    ["Halving is triggered by block height", "Halving is determined by block height, not a calendar date"],
    ["The 2026 aspect context is restored", "Planetary aspects in 2026: concise continuation"],
    ["The densest tactical cluster", "The highest concentration of exact aspects"],
    ["the densest tactical cluster", "the highest concentration of exact aspects"],
    ["multi-month carrier layer", "long-term astronomical context"],
    ["Slow carrier context", "Long-term astronomical context"],
    ["Internal analysis runs from slow pairs to fast activators. The public answer runs from nearer windows to the multi-month layer. A fast trigger refines timing but does not replace its parent cycle.", "Analysis begins with long-term configurations and then moves to faster astronomical events. The public answer moves from nearer windows to long-term context. A faster event refines timing but does not replace the long-term configuration."],
    ["saved annual corridor", "saved annual overview"],
    ["Interpretation boundary", "Inference boundary"],
    ["Astro × BTC bridge boundary", "Comparison boundary"],
    ["Multi-body Astro proof available", "Astronomical evidence available"],
    ["Astro proof + Market proof", "Astronomical and market evidence available"],
    ["Protocol proof available", "Protocol evidence available"],
    ["Astro proof limited", "Astronomical evidence limited"],
    ["Market proof available", "Market evidence available"],
    ["Market proof unavailable", "Market evidence unavailable"],
    ["Method proof available", "Method evidence available"],
    ["Capability registry", "Capability registry"],
    ["Market evidence is temporarily unavailable", "Market evidence is temporarily unavailable"],
    ["Main Bitcoin Corridor routes", "Main BTC field routes"],
    ["Bitcoin Corridor navigation", "BTC field navigation"],
    ["Astromodule", "Astronomical data"],
  ],
};

function canonicalPublicCopy(locale: BtcPublicLocale, value: string): string {
  return CANONICAL_PUBLIC_COPY[locale].reduce(
    (output, [source, target]) => output.replaceAll(source, target),
    value,
  );
}

function canonicalAnswerSections(
  locale: BtcPublicLocale,
  sections: BtcCosmographerAnswerProjection["sections"],
): BtcCosmographerAnswerProjection["sections"] {
  return sections.map((section) => ({
    ...section,
    label: canonicalPublicCopy(locale, section.label),
    paragraph: section.paragraph
      ? canonicalPublicCopy(locale, section.paragraph)
      : section.paragraph,
    bullets: section.bullets?.map((line) => canonicalPublicCopy(locale, line)),
  }));
}
''',
)

replace_once(component, '    ASTRO_INTERVAL: ["Astromodule · период", "Astromodule · interval"],', '    ASTRO_INTERVAL: ["Астрономические данные · период", "Astronomical data · interval"],')
replace_once(component, '    ASTRO_STATE: ["Astromodule · состояние", "Astromodule · state"],', '    ASTRO_STATE: ["Астрономические данные · состояние", "Astronomical data · state"],')
replace_once(component, '    ASTRO_YEAR_OVERVIEW: ["Astromodule · годовой обзор", "Astromodule · annual overview"],', '    ASTRO_YEAR_OVERVIEW: ["Астрономические данные · годовой обзор", "Astronomical data · annual overview"],')
replace_once(component, '    ASTRO_BTC_BRIDGE: ["Astro × BTC · сопоставление", "Astro × BTC · comparison"],', '    ASTRO_BTC_BRIDGE: ["Астрономия × BTC · сопоставление", "Astronomy × BTC · comparison"],')
replace_once(component, '    NAVIGATION: ["Навигация Bitcoin Corridor", "Bitcoin Corridor navigation"],', '    NAVIGATION: ["Навигация по полю BTC", "BTC field navigation"],')

replace_once(
    component,
    '''  const evidenceLines = props.answer.sections
    .flatMap((section) => section.bullets ?? [])
    .slice(0, 3);''',
    '''  const canonicalSections = canonicalAnswerSections(props.locale, props.answer.sections);
  const evidenceLines = canonicalSections
    .flatMap((section) => section.bullets ?? [])
    .slice(0, 3);''',
)
replace_once(component, "    headline: props.answer.headline,", "    headline: canonicalPublicCopy(props.locale, props.answer.headline),")
replace_once(component, "    direct_answer: props.answer.direct_answer,", "    direct_answer: canonicalPublicCopy(props.locale, props.answer.direct_answer),")
replace_once(component, "    source_boundary: props.answer.source_boundary,", "    source_boundary: canonicalPublicCopy(props.locale, props.answer.source_boundary),")
replace_once(component, "    sections: props.answer.sections,", "    sections: canonicalSections,")
replace_once(component, "    proof_label: props.answer.proof_label,", "    proof_label: canonicalPublicCopy(props.locale, props.answer.proof_label),")

replace_once(
    component,
    '''        <p className="eyebrow">Bitcoin Corridor</p>
        <h1 id="btc-cosmographer-title">{ru ? "BTC Космограф" : "BTC Cosmographer"}</h1>
        <p>{ru
          ? "Свободно переходите между протоколом Bitcoin, рынком, Snapshot Memory, Astromodule и мостом Astro × BTC. Явная новая тема сильнее прошлого контекста."
          : "Move freely between Bitcoin protocol, market, Snapshot Memory, Astromodule and the Astro × BTC bridge. An explicit new topic overrides prior context."}</p>''',
    '''        <p className="eyebrow">Market Cosmographer</p>
        <h1 id="btc-cosmographer-title">{ru ? "Чтение поля BTC" : "BTC Field Read"}</h1>
        <p>{ru
          ? "Задайте вопрос о протоколе Bitcoin, рынке BTC, памяти снимков или астрономических данных. Космограф разделяет источники, выводы и границы доказательности."
          : "Ask about the Bitcoin protocol, the BTC market, snapshot memory, or astronomical data. Cosmographer keeps sources, conclusions, and evidence boundaries separate."}</p>''',
)
replace_once(
    component,
    ''': (ru ? "Ваш вопрос в Bitcoin Corridor" : "Your Bitcoin Corridor question")}</span>''',
    ''': (ru ? "Ваш вопрос о поле BTC" : "Your question about the BTC field")}</span>''',
)
replace_once(
    component,
    '''                  <span>{turn.proof_label ?? (turn.proof_available ? "Proof available" : "Proof unavailable")}</span>''',
    '''                  <span>{turn.proof_label ?? (turn.proof_available
                    ? (turn.locale === "ru" ? "Доказательства доступны" : "Evidence available")
                    : (turn.locale === "ru" ? "Доказательства недоступны" : "Evidence unavailable"))}</span>''',
)

# Track and execute the new verifier in both exact-scope workflows.
for workflow in (
    ".github/workflows/btc-public-live-multi-body-projection-pr.yml",
    ".github/workflows/btc-public-live-visual-information-acceptance-pr.yml",
):
    insert_after(
        workflow,
        "      - scripts/apply-btc-public-live-multi-body-projection.py\n",
        "      - scripts/verify-btc-public-live-copy-canon.mjs\n",
    )
    replace_once(workflow, "Verify exact twelve-file scope", "Verify exact thirteen-file scope")

projection_workflow = ".github/workflows/btc-public-live-multi-body-projection-pr.yml"
insert_after(
    projection_workflow,
    '''          node scripts/run-btc-cosmographer-multi-body-local-rc-fixture.mjs
''',
    '''
      - name: Verify canonical product copy and headings
        run: node scripts/verify-btc-public-live-copy-canon.mjs
''',
)

# Existing visual acceptance remains authoritative, but its governed labels and
# return cue must follow the repaired public product copy.
visual = "scripts/verify-btc-public-live-visual-information-acceptance.py"
replace_once(
    visual,
    '''PUBLIC_DOMAIN_LABELS = {
    "Bitcoin Protocol",
    "BTC Market",
    "Snapshot Memory",
    "Astromodule",
    "Astro × BTC",
    "Метод и доказательность",
    "Method and evidence",
    "Навигация Bitcoin Corridor",
    "Bitcoin Corridor navigation",
    "Граница поддержки",
    "Support boundary",
}''',
    '''PUBLIC_DOMAIN_LABELS = {
    "Протокол Bitcoin",
    "Bitcoin Protocol",
    "Рынок BTC",
    "BTC Market",
    "Память снимков",
    "Snapshot Memory",
    "Астрономические данные",
    "Astronomical data",
    "Астрономия × BTC",
    "Astronomy × BTC",
    "Метод и доказательность",
    "Method and evidence",
    "Навигация по полю BTC",
    "BTC field navigation",
    "Граница поддержки",
    "Support boundary",
}''',
)
replace_once(
    visual,
    '''    check(f"ru_return_{suffix}_restored_context_cue", "восстанов" in return_state["headline"].casefold(), return_state["headline"])''',
    '''    check(f"ru_return_{suffix}_continuation_cue", "краткое продолжение" in return_state["headline"].casefold(), return_state["headline"])''',
)

print("PASS_PUBLIC_LIVE_CANONICAL_PRODUCT_COPY_AND_HEADING_REPAIR")
