from pathlib import Path
from textwrap import dedent

def clean_block(value):
    lines = value.splitlines()
    if not lines:
        return value
    head = lines[0]
    tail = dedent("\n".join(lines[1:]))
    return (head + "\n" + tail).lstrip()

def replace_once(path, old, new):
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    label = old.splitlines()[0][:120]
    if count != 1:
        raise SystemExit(f"{path}: expected one anchor, found {count} · {label!r}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")
    print(f"APPLY_OK {path} · {label}")

route = "lib/btc-cosmographer-route-graph.ts"

replace_once(
    route,
    '''function explicitDates(question: string): string[] {
  const dates: string[] = [];
  const pattern = /\\b(20\\d{2}-\\d{2}-\\d{2})\\b/g;
  let match: RegExpExecArray | null = pattern.exec(question);
  while (match) {
    dates.push(match[1]);
    match = pattern.exec(question);
  }
  return dates;
}

export function extractBtcCosmographerTimeRange(''',
    '''function explicitDates(question: string): string[] {
  const dates: string[] = [];
  const pattern = /\\b(20\\d{2}-\\d{2}-\\d{2})\\b/g;
  let match: RegExpExecArray | null = pattern.exec(question);
  while (match) {
    dates.push(match[1]);
    match = pattern.exec(question);
  }
  return dates;
}

const NAMED_MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  января: 1, февраля: 2, марта: 3, апреля: 4, мая: 5, июня: 6,
  июля: 7, августа: 8, сентября: 9, октября: 10, ноября: 11, декабря: 12,
};

function namedCalendarDate(question: string): string | null {
  const ru = question.match(/\\b([0-3]?\\d)\\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\\s+(20\\d{2})\\b/i);
  const en = question.match(/\\b(january|february|march|april|may|june|july|august|september|october|november|december)\\s+([0-3]?\\d)(?:st|nd|rd|th)?[,]?\\s+(20\\d{2})\\b/i);
  const day = Number(ru?.[1] ?? en?.[2] ?? 0);
  const monthName = (ru?.[2] ?? en?.[1] ?? "").toLowerCase();
  const year = Number(ru?.[3] ?? en?.[3] ?? 0);
  const month = NAMED_MONTHS[monthName];
  if (!day || !month || !year) return null;
  const value = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return validDate(value) ? value : null;
}

export function extractBtcCosmographerTimeRange(''',
)

replace_once(
    route,
    '''  if (dates.length === 1 && validDate(dates[0])) {
    return {
      start: dates[0],
      end: dates[0],
      label: dates[0],
      source: "QUESTION",
    };
  }

  const yearMatch = q.match(/\\b(20\\d{2})\\b/);''',
    '''  if (dates.length === 1 && validDate(dates[0])) {
    return {
      start: dates[0],
      end: dates[0],
      label: dates[0],
      source: "QUESTION",
    };
  }

  const namedDate = namedCalendarDate(q);
  if (namedDate) {
    return {
      start: namedDate,
      end: namedDate,
      label: namedDate,
      source: "QUESTION",
    };
  }

  const yearMatch = q.match(/\\b(20\\d{2})\\b/);''',
)

replace_once(
    route,
    '''  if (/subsid|block reward|награда\\s+за\\s+блок|субсиди/i.test(question)) return "subsidy";''',
    '''  if (/subsid|block reward|награда\\s+за\\s+блок|субсиди|how\\s+(?:are|do)\\s+new\\s+(?:btc|bitcoin|bitcoins?)\\s+(?:issued|created)|new\\s+(?:btc|bitcoin|bitcoins?)\\s+(?:issuance|creation)|как\\s+(?:выпускаются|создаются|появляются)\\s+новые\\s+(?:btc|биткоин[а-яё]*)/i.test(question)) return "subsidy";''',
)

replace_once(
    route,
    '''  if (/btc field|market field|поле btc|общее поле|рынок btc|рынок биткоин|btc\\s+today|bitcoin\\s+today|btc\\s+now|биткоин\\s+(?:сегодня|сейчас)|что\\s+сейчас\\s+(?:с|у)\\s+(?:btc|бит)/i.test(question)) return "general_btc_field";''',
    '''  if (/btc field|market field|поле btc|общее поле|рынок btc|рынок биткоин|btc\\s+today|bitcoin\\s+today|btc\\s+now|bitcoin\\s+now|what(?:'s|\\s+is)\\s+happening\\s+(?:with|to)\\s+(?:btc|bitcoin)|what\\s+is\\s+going\\s+on\\s+(?:with|in)\\s+(?:btc|bitcoin)|биткоин\\s+(?:сегодня|сейчас)|что\\s+(?:сейчас\\s+)?происходит\\s+(?:с|в)\\s+(?:btc|bitcoin|биткоин[а-яё]*)|что\\s+сейчас\\s+(?:с|у)\\s+(?:btc|бит)/i.test(question)) return "general_btc_field";''',
)

replace_once(
    route,
    '''function isMethodology(question: string): boolean {
  return /source|proof|method|methodology|where.*data|источник|доказатель|методик|(?:^|\s)метод(?:\s|$|[?!.])|откуда.*данн/i.test(question);
}''',
    '''function isMethodology(question: string): boolean {
  return /source|proof|method|methodology|where.*data|inference\s+boundary|evidence\s+boundary|source\s+boundary|источник|доказатель|методик|(?:^|\s)метод(?:\s|$|[?!.])|откуда.*данн|границ[а-яё]*\s+(?:вывод|доказатель|источник)/i.test(question);
}''',
)

replace_once(
    route,
    '''function isReturn(question: string): boolean {
  return /back to|return to|верн[её]мся|вернуться|снова к/i.test(question);
}''',
    '''function isReturn(question: string): boolean {
  return /back to|return to|go back|previous topic|prior topic|верн[её]мся|вернуться|вернись|предыдущ[а-яё]*\s+тем|снова к/i.test(question);
}''',
)

replace_once(
    route,
    '''function isNavigation(question: string): boolean {
  return /what can you do|how can i ask|available routes|capabilit|what can i ask|что ты умеешь|какие вопросы|маршрут|возможност/i.test(question);
}

function isReturn(question: string): boolean {''',
    '''function isNavigation(question: string): boolean {
  return /what can you do|how can i ask|available routes|capabilit|what can i ask|что ты умеешь|какие вопросы|маршрут|возможност/i.test(question);
}

function isUnsupportedMarketRequest(question: string): boolean {
  return /guaranteed\\s+(?:btc|bitcoin)?\\s*price|guaranteed\\s+(?:price\\s+)?target|exact\\s+(?:btc|bitcoin)?\\s*price\\s+(?:tomorrow|next)|price\\s+target\\s+(?:for\\s+)?tomorrow|гарантированн[а-яё]*\\s+(?:цел[ьи]|цен[ау])|точн[а-яё]*\\s+цен[ау]\\s+(?:btc|bitcoin|биткоин[а-яё]*)?\\s*(?:на\\s+)?завтра|ценов[а-яё]*\\s+цел[ьи]\\s+(?:btc|bitcoin|биткоин[а-яё]*)/i.test(question);
}

function isReturn(question: string): boolean {''',
)

replace_once(
    route,
    '''function isReferential(question: string): boolean {
  return /^(?:why|why\\?|what about that|and this|it|this|that|them|so|then|почему|почему\\?|а это|это|этот|эта|они|там|а\\s|и\\s|тогда|что важнее|какие показатели|что изменит|какой день|какие дни)/i.test(question.trim());
}''',
    '''function isReferential(question: string): boolean {
  return /^(?:why|why\\?|what about that|and this|it|this|that|them|so|then|what changed most|what creates (?:the )?divergence|which facts create (?:the )?divergence|what would resolve it|what aspect is most relevant|which aspect matters most|why is that (?:aspect|change|signal) relevant|почему|почему\\?|а это|это|этот|эта|они|там|а\\s|и\\s|тогда|что важнее|какие показатели|что изменит|что изменилось сильнее|что созда[её]т расхождение|какие факты создают расхождение|что снимет расхождение|какой аспект (?:самый )?важн|какой аспект наиболее значим|почему этот (?:аспект|сигнал|переход) важен|какой день|какие дни)/i.test(question.trim());
}''',
)

replace_once(
    route,
    '''  const hasBtc = hasBtcReference(question);
  if (isBitcoinGenesisChartQuestion(question)) return "unsupported";
  if (body && hasBtc) return "astro_btc_bridge";
  if (body && market) return "astro_btc_bridge";
  if (isMultiBodyLanguage(question) && hasBtc) return "astro_btc_bridge";
  if (isMultiBodyLanguage(question)) return "astromodule";
  if (body || /astromodule|астромодул|planet|планет|retrograd|ретроград|aspect|аспект|eclipse|затмени/i.test(question)) return "astromodule";
  if (protocol) return "bitcoin_protocol";
  if (market === "change_memory") return "snapshot_memory";
  if (market) return "btc_market";
  if (isMethodology(question)) return "methodology";
  if (isNavigation(question)) return "navigation";
  if (hasBtc) return "btc_market";
  return "unsupported";''',
    '''  const hasBtc = hasBtcReference(question);
  if (isBitcoinGenesisChartQuestion(question)) return "unsupported";
  if (isUnsupportedMarketRequest(question)) return "unsupported";
  if (body && hasBtc) return "astro_btc_bridge";
  if (body && market) return "astro_btc_bridge";
  if (isMultiBodyLanguage(question) && hasBtc) return "astro_btc_bridge";
  if (isMultiBodyLanguage(question)) return "astromodule";
  if (body || /astromodule|астромодул|planet|планет|retrograd|ретроград|aspect|аспект|eclipse|затмени/i.test(question)) return "astromodule";
  if (isMethodology(question)) return "methodology";
  if (protocol) return "bitcoin_protocol";
  if (market === "change_memory") return "snapshot_memory";
  if (market) return "btc_market";
  if (isNavigation(question)) return "navigation";
  if (hasBtc) return "btc_market";
  return "unsupported";''',
)

replace_once(
    route,
    '''  const genesisChart = isBitcoinGenesisChartQuestion(q);
  let inferredDomain = inferDomain(q, protocol, body, market);
  let forcedSubject: string | null = genesisChart
    ? "bitcoin_genesis_chart"
    : multiBody
      ? "planetary_aspects"
      : null;''',
    '''  const genesisChart = isBitcoinGenesisChartQuestion(q);
  const unsupportedMarketRequest = isUnsupportedMarketRequest(q);
  let inferredDomain = inferDomain(q, protocol, body, market);
  let forcedSubject: string | null = genesisChart
    ? "bitcoin_genesis_chart"
    : unsupportedMarketRequest
      ? "unsupported_market_request"
      : multiBody
        ? "planetary_aspects"
        : null;''',
)

replace_once(
    route,
    '''  const resolvedDomain =
  relation === "FOLLOW_UP" && domain === "unsupported" && packet
    ? packet.prior_domain
    : domain;
  const resolvedSubject =
  relation === "FOLLOW_UP" && subject === "unknown" && packet
    ? packet.prior_subject
    : subject;''',
    '''  const inheritsContext =
  relation === "FOLLOW_UP" || relation === "RETURN_TO_PREVIOUS_TOPIC";
  const resolvedDomain =
  inheritsContext && !explicit && packet
    ? packet.prior_domain
    : domain;
  const resolvedSubject =
  inheritsContext && !explicit && packet
    ? packet.prior_subject
    : subject;''',
)

replace_once(
    route,
    '''      : explicit || relation === "FOLLOW_UP"
        ? "HIGH"
        : "BOUNDED";''',
    '''      : explicit || relation === "FOLLOW_UP" || relation === "RETURN_TO_PREVIOUS_TOPIC"
        ? "HIGH"
        : "BOUNDED";''',
)

live = "pages/crypto-astro/btc/live.tsx"

replace_once(
    live,
    '''function needsMarket(route: BtcCosmographerRoute): boolean {
  return ["btc_market", "snapshot_memory", "astro_btc_bridge"].includes(route.domain);
}

type PendingClarificationPacket = {''',
    '''function needsMarket(route: BtcCosmographerRoute): boolean {
  return ["btc_market", "snapshot_memory", "astro_btc_bridge"].includes(route.domain);
}

const MARKET_EVIDENCE_QUESTIONS: Record<BtcEnvelopeQuestionClass, string> = {
  btc_gravity: "What does BTC dominance mean for wider market gravity?",
  market_structure: "Do regime, Market Field Score and market cap confirm the current BTC structure?",
  liquidity: "What do stablecoin share, DeFi TVL and DEX volume show about current BTC liquidity?",
  market_participation_rotation: "What do altcoin breadth, ETH rotation and participation show around BTC?",
  change_memory: "What changed in accepted Snapshot Memory since the previous verified snapshot?",
  temporal_pressure: "How does the selected date change BTC temporal pressure?",
  general_btc_field: "What is the current BTC field overview and why does it matter?",
};

function marketEvidenceQuestion(route: BtcCosmographerRoute): string {
  return route.market_question_class
    ? MARKET_EVIDENCE_QUESTIONS[route.market_question_class]
    : canonicalizeBtcQuestionForRouter(route.normalized_question);
}

function isReturnRequest(question: string): boolean {
  return /back to|return to|go back|previous topic|prior topic|верн[её]мся|вернись|вернуться|снова к|предыдущ(?:ей|ему|ая|ий) тем/i.test(question);
}

function parseReturnContext(
  query: Record<string, string | string[] | undefined>,
): BtcCosmographerContextPacket | null {
  const parsed = parseBtcCosmographerContext({
    cc: query.rcc,
    cd: query.rcd,
    cs: query.rcs,
    ci: query.rci,
    ca: query.rca,
    cm: query.rcm,
    ct0: query.rct0,
    ct1: query.rct1,
    cb: query.rcb,
  });
  return parsed.malformed ? null : parsed.packet;
}

type PendingClarificationPacket = {''',
)

replace_once(
    live,
    '''  res.setHeader("X-BTC-Dialogue-Session-Schema", BTC_DIALOGUE_SESSION_SCHEMA);
  const initialQuestion = first(query.q);''',
    '''  res.setHeader("X-BTC-Dialogue-Session-Schema", BTC_DIALOGUE_SESSION_SCHEMA);
  res.setHeader("X-Robots-Tag", "noindex, follow");
  const initialQuestion = first(query.q);''',
)

replace_once(
    live,
    '''  const packet = parsed.malformed
  ? null
  : parsed.packet ?? parseLegacyContext(query);
  const pendingClarification = parsePendingClarification(query);''',
    '''  const packet = parsed.malformed
  ? null
  : parsed.packet ?? parseLegacyContext(query);
  const returnPacket = parseReturnContext(query);
  const pendingClarification = parsePendingClarification(query);''',
)

replace_once(
    live,
    '''  const retainedAstroMemory = parseRetainedAstroMemory(query);
  const initialRoute = routeBtcCosmographerLocalRc(
    resolvedLocale.locale,
    routingQuestion,
    packet,
    initialDate || undefined,
    retainedAstroMemory,
  );
  const relationResolution = applyBtcRelationIntentPrecedence(
    initialRoute,
    routingQuestion,
    packet,
    retainedAstroMemory,
  );''',
    '''  const retainedAstroMemory = parseRetainedAstroMemory(query);
  const activePacket = isReturnRequest(routingQuestion)
    ? returnPacket ?? packet
    : packet;
  const initialRoute = routeBtcCosmographerLocalRc(
    resolvedLocale.locale,
    routingQuestion,
    activePacket,
    initialDate || undefined,
    retainedAstroMemory,
  );
  const relationResolution = applyBtcRelationIntentPrecedence(
    initialRoute,
    routingQuestion,
    activePacket,
    retainedAstroMemory,
  );''',
)

replace_once(
    live,
    '''    const marketQuestion = canonicalizeBtcQuestionForRouter(route.normalized_question);''',
    '''    const marketQuestion = marketEvidenceQuestion(route);''',
)

replace_once(
    live,
    '''    <Head>
      <title>{title}</title>
      <meta name="description" content={description}/>
      <meta name="btc-live-dialogue" content="semantic-route-graph-v0-1"/>''',
    '''    <Head>
      <title>{title}</title>
      <meta name="description" content={description}/>
      <meta name="robots" content="noindex,follow"/>
      <link rel="canonical" href={`https://www.bhrigu.io/crypto-astro/btc?lang=${props.locale}`}/>
      <link rel="alternate" hrefLang="en" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>
      <link rel="alternate" hrefLang="ru" href="https://www.bhrigu.io/crypto-astro/btc?lang=ru"/>
      <link rel="alternate" hrefLang="x-default" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>
      <meta property="og:title" content={title}/>
      <meta property="og:description" content={description}/>
      <meta property="og:url" content={`https://www.bhrigu.io/crypto-astro/btc?lang=${props.locale}`}/>
      <meta name="twitter:title" content={title}/>
      <meta name="twitter:description" content={description}/>
      <meta name="btc-live-dialogue" content="semantic-route-graph-v0-1"/>''',
)

component = "components/btc/BtcCosmographerDialogue.tsx"

replace_once(
    component,
    '''  const contextTurn = contextSafe ? latestContextTurn(turns) : null;
  const retainedAstroTurn = [...turns].reverse().find((turn) =>''',
    '''  const contextTurn = contextSafe ? latestContextTurn(turns) : null;
  const contextTurnIndex = contextTurn
    ? turns.findIndex((turn) => turn.turn_id === contextTurn.turn_id)
    : -1;
  const returnContextTurn = contextTurnIndex > 0
    ? latestContextTurn(turns.slice(0, contextTurnIndex))
    : null;
  const retainedAstroTurn = [...turns].reverse().find((turn) =>''',
)

replace_once(
    component,
    '''  const contextFields = contextTurn ? {
    cc: BTC_COSMOGRAPHER_CONTEXT_SCHEMA,''',
    '''  const returnContextFields = returnContextTurn ? {
    rcc: BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
    rcd: returnContextTurn.route_domain ?? "unsupported",
    rcs: returnContextTurn.route_subject ?? returnContextTurn.question_class ?? "unknown",
    rci: (returnContextTurn.route_intents ?? returnContextTurn.question_facets).join(","),
    rca: returnContextTurn.answer_state === "BOUNDED" ? "LIMITED" : returnContextTurn.answer_state,
    rcm: returnContextTurn.market_question_class ?? returnContextTurn.question_class ?? "",
    rct0: returnContextTurn.time_start ?? returnContextTurn.observation_date ?? "",
    rct1: returnContextTurn.time_end ?? returnContextTurn.observation_date ?? "",
    rcb: returnContextTurn.source_snapshot_generated_at_utc ?? "",
  } : null;
  const contextFields = contextTurn ? {
    cc: BTC_COSMOGRAPHER_CONTEXT_SCHEMA,''',
)

replace_once(
    component,
    '''        {retainedAstroFields && Object.entries(retainedAstroFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }
    {Object.entries(contextFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }''',
    '''        {retainedAstroFields && Object.entries(retainedAstroFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }
    {returnContextFields && Object.entries(returnContextFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }
    {Object.entries(contextFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }''',
)

answer = "lib/btc-cosmographer-answer.ts"

replace_once(
    answer,
    '''function navigationAnswer(
  locale: BtcPublicLocale,''',
    '''function unsupportedMarketRequestAnswer(locale: BtcPublicLocale): BtcCosmographerAnswerProjection {
  return {
    answer_state: "LIMITED",
    answer_mode: "NAVIGATION",
    headline: locale === "ru"
      ? "Гарантированная ценовая цель недоступна"
      : "A guaranteed price target is not available",
    direct_answer: locale === "ru"
      ? "Космограф не выдаёт гарантированную цену BTC, торговый сигнал или инструкцию на завтра. Он может показать принятое состояние рынка, доказательства и условия, которые изменят чтение."
      : "Cosmographer does not provide a guaranteed BTC price, trading signal, or instruction for tomorrow. It can show the accepted market state, evidence, and conditions that would change the read.",
    sections: [{
      id: "supported_alternative",
      label: locale === "ru" ? "Доступная альтернатива" : "Supported alternative",
      bullets: locale === "ru"
        ? ["Текущее состояние BTC", "Изменения с прошлого Snapshot", "Условия усиления или ослабления чтения"]
        : ["Current BTC state", "Changes since the previous Snapshot", "Conditions that strengthen or weaken the read"],
    }],
    source_boundary: locale === "ru"
      ? "Гарантия будущей цены не может быть доказана принятым evidence packet."
      : "A future-price guarantee cannot be supported by the accepted evidence packet.",
    proof_label: locale === "ru" ? "Граница поддержки подтверждена" : "Support boundary confirmed",
  };
}

function navigationAnswer(
  locale: BtcPublicLocale,''',
)

replace_once(
    answer,
    '''    case "unsupported":
      if (route.subject === "bitcoin_genesis_chart") return genesisChartClarification(locale);
      return navigationAnswer(locale, route.raw_question);''',
    '''    case "unsupported":
      if (route.subject === "bitcoin_genesis_chart") return genesisChartClarification(locale);
      if (route.subject === "unsupported_market_request") return unsupportedMarketRequestAnswer(locale);
      return navigationAnswer(locale, route.raw_question);''',
)

runtime = "lib/btc-cosmographer-evidence-navigation-runtime.ts"
replace_once(
    runtime,
    '''const OUT_OF_SCOPE_TRADING = /buy|sell|long|short|leverage|position size|stop[- ]?loss|take[- ]?profit|allocate|portfolio|купить|продать|лонг|шорт|плечо|стоп[- ]?лосс|тейк[- ]?профит|дол[юя].*портфел/i;''',
    '''const OUT_OF_SCOPE_TRADING = /buy|sell|long|short|leverage|position size|stop[- ]?loss|take[- ]?profit|allocate|portfolio|guaranteed\\s+(?:(?:btc|bitcoin)\\s+)?(?:price|target)|exact\\s+(?:(?:btc|bitcoin)\\s+)?price|price\\s+target|купить|продать|лонг|шорт|плечо|стоп[- ]?лосс|тейк[- ]?профит|дол[юя].*портфел|гарантированн[а-яё]*\\s+(?:цен|цел)|точн[а-яё]*\\s+ценов[а-яё]*\\s+цел/i;''',
)

document = "pages/_document.js"
Path(document).write_text(clean_block('''import Document, { Html, Head, Main, NextScript } from "next/document";

export default class BhriguDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const raw = Array.isArray(ctx.query?.lang) ? ctx.query.lang[0] : ctx.query?.lang;
    const lang = raw === "ru" ? "ru" : "en";
    return { ...initialProps, lang };
  }

  render() {
    const lang = this.props.lang === "ru" ? "ru" : "en";
    return (
      <Html lang={lang}>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
'''), encoding="utf-8")

app = "pages/_app.js"
replace_once(
    app,
    '''  "/archive": {
    "title": "Archive · BHRIGU",
    "desc": "Archive: preserved snapshots, milestone references, and stable surface artifacts."
  }
};''',
    '''  "/archive": {
    "title": "Archive · BHRIGU",
    "desc": "Archive: preserved snapshots, milestone references, and stable surface artifacts."
  },
  "/crypto-astro/btc": {
    "title": "BTC Field · Evidence-Linked Bitcoin Intelligence | BHRIGU",
    "desc": "Market Cosmographer's first public corridor for Bitcoin investors and researchers: current BTC state, accepted change memory, sources, and explicit conditions."
  },
  "/crypto-astro/btc/live": {
    "title": "BTC Field Dialogue · Market Cosmographer | BHRIGU",
    "desc": "A bounded analytical dialogue about Bitcoin protocol, BTC market state, Snapshot memory, astronomical data, and evidence boundaries."
  }
};''',
)

replace_once(
    app,
    '''  const meta = getMeta(path);
  const canonical = 'https://www.bhrigu.io' + (path === '/' ? '/' : path);''',
    '''  const meta = getMeta(path);
  const rawLang = Array.isArray(router?.query?.lang) ? router.query.lang[0] : router?.query?.lang;
  const lang = rawLang === "ru" ? "ru" : "en";
  const isBtc = path === "/crypto-astro/btc" || path === "/crypto-astro/btc/live";
  const canonicalPath = path === "/crypto-astro/btc/live" ? "/crypto-astro/btc" : path;
  const canonical = 'https://www.bhrigu.io' + (canonicalPath === '/' ? '/' : canonicalPath) + (isBtc ? `?lang=${lang}` : "");''',
)

replace_once(
    app,
    '''        <link rel="canonical" href={canonical} key="canonical" />

      <title>{meta.title}</title>''',
    '''        <link rel="canonical" href={canonical} key="canonical" />
      {isBtc && <link rel="alternate" hrefLang="en" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>}
      {isBtc && <link rel="alternate" hrefLang="ru" href="https://www.bhrigu.io/crypto-astro/btc?lang=ru"/>}
      {isBtc && <link rel="alternate" hrefLang="x-default" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>}
      {path === "/crypto-astro/btc/live" && <meta name="robots" content="noindex,follow"/>}

      <title>{meta.title}</title>''',
)

replace_once(
    app,
    '''        <meta key="og:url" property="og:url" content={meta.canonical} />''',
    '''        <meta key="og:url" property="og:url" content={canonical} />''',
)

btc = "pages/crypto-astro/btc.tsx"

replace_once(
    btc,
    '''type Failure = { code: BtcFailureCode; message: string; last_verified_at_utc: string | null };''',
    '''const BTC_ACCEPTED_PUBLIC_KNOWLEDGE: Record<BtcPublicLocale, Array<{ question: string; answer: string }>> = {
  en: [
    { question: "What is Market Cosmographer?", answer: "Market Cosmographer is BHRIGU's evidence-linked market intelligence product. BTC Field is its first public corridor." },
    { question: "Who is BTC Field for?", answer: "BTC Field is designed for Bitcoin investors and researchers who need current state, accepted change memory, sources, and explicit conditions." },
    { question: "What does the current BTC read use?", answer: "It uses the accepted Market Snapshot, verified derivations, and the latest compatible Snapshot Delta." },
    { question: "Can BTC Field guarantee a future price?", answer: "No. It does not provide guaranteed prices, trading signals, leverage instructions, or position sizing." },
    { question: "How are protocol and market answers separated?", answer: "Protocol answers use pinned Bitcoin sources; market answers use accepted market records. One evidence lane does not replace another." },
    { question: "How is astronomy compared with BTC?", answer: "Astronomical evidence and BTC state are checked independently. Temporal concurrence is not presented as causality." },
  ],
  ru: [
    { question: "Что такое Market Cosmographer?", answer: "Market Cosmographer — продукт BHRIGU для доказательно связанной рыночной аналитики. BTC Field — его первый публичный коридор." },
    { question: "Для кого создан BTC Field?", answer: "BTC Field создан для инвесторов и исследователей Bitcoin, которым нужны текущее состояние, принятая память изменений, источники и явные условия." },
    { question: "На чём основано текущее чтение BTC?", answer: "Оно использует принятый Market Snapshot, проверенные производные и последнюю совместимую Snapshot Delta." },
    { question: "Может ли BTC Field гарантировать будущую цену?", answer: "Нет. Он не выдаёт гарантированные цены, торговые сигналы, инструкции по плечу или размеру позиции." },
    { question: "Как разделены ответы о протоколе и рынке?", answer: "Ответы о протоколе используют закреплённые источники Bitcoin; рыночные ответы используют принятые рыночные записи. Один доказательный слой не подменяет другой." },
    { question: "Как астрономия сопоставляется с BTC?", answer: "Астрономические данные и состояние BTC проверяются независимо. Временное совпадение не представляется как причинность." },
  ],
};

type Failure = { code: BtcFailureCode; message: string; last_verified_at_utc: string | null };''',
)

replace_once(
    btc,
    '''  const metaDescription = ru
    ? "Проверяемое чтение поля Bitcoin: текущие изменения, рыночная структура, память Snapshot, временные окна и условия."
    : "A verifiable Bitcoin field read covering current changes, market structure, Snapshot memory, temporal windows, and conditions.";
  return <>''',
    '''  const metaDescription = ru
    ? "Проверяемое чтение Bitcoin для инвесторов и исследователей: текущее состояние, рыночная структура, память Snapshot, источники и явные условия."
    : "Evidence-linked Bitcoin intelligence for investors and researchers: current state, market structure, Snapshot memory, sources, and explicit conditions.";
  const canonical = `https://www.bhrigu.io/crypto-astro/btc?lang=${p.locale}`;
  const acceptedKnowledge = BTC_ACCEPTED_PUBLIC_KNOWLEDGE[p.locale];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": canonical,
        url: canonical,
        name: pageTitle,
        description: metaDescription,
        inLanguage: p.locale,
        isPartOf: { "@type": "WebSite", name: "BHRIGU", url: "https://www.bhrigu.io/" },
        about: { "@type": "Thing", name: "Bitcoin market intelligence" },
        audience: { "@type": "Audience", audienceType: "Bitcoin investors and researchers" },
      },
      {
        "@type": "WebApplication",
        name: "Market Cosmographer · BTC Field",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        description: metaDescription,
        url: canonical,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        mainEntity: acceptedKnowledge.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
  return <>''',
)

replace_once(
    btc,
    '''    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription}/>
      <meta name="btc-glyph-canon-sha256"''',
    '''    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription}/>
      <meta name="robots" content="index,follow"/>
      <link rel="canonical" href={canonical}/>
      <link rel="alternate" hrefLang="en" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>
      <link rel="alternate" hrefLang="ru" href="https://www.bhrigu.io/crypto-astro/btc?lang=ru"/>
      <link rel="alternate" hrefLang="x-default" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>
      <meta property="og:type" content="website"/>
      <meta property="og:title" content={pageTitle}/>
      <meta property="og:description" content={metaDescription}/>
      <meta property="og:url" content={canonical}/>
      <meta name="twitter:card" content="summary_large_image"/>
      <meta name="twitter:title" content={pageTitle}/>
      <meta name="twitter:description" content={metaDescription}/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}/>
      <meta name="btc-glyph-canon-sha256"''',
)

replace_once(
    btc,
    '''          <p>{ru
        ? "Что изменилось в Bitcoin, почему это важно и что может произойти дальше."
        : "What changed in Bitcoin, why it matters, and what may happen next."}</p>''',
    '''          <p>{ru
        ? "Доказательно связанная аналитика Bitcoin для инвесторов и исследователей: что изменилось, почему это важно и какие условия изменят чтение."
        : "Evidence-linked Bitcoin intelligence for investors and researchers: what changed, why it matters, and which conditions would change the read."}</p>''',
)

replace_once(
    btc,
    '''      <BtcQuestionMembrane
        locale={p.locale}
        initialQuestion={p.initialQuestion}
        initialDate={p.initialDate}
        result={p.result}
      />

      {p.binanceObservation&&<BtcBinanceFreeObservationPanel''',
    '''      <BtcQuestionMembrane
        locale={p.locale}
        initialQuestion={p.initialQuestion}
        initialDate={p.initialDate}
        result={p.result}
      />

      <section className="readingZone acceptedKnowledge" aria-labelledby="btc-accepted-knowledge-title" data-accepted-public-knowledge="true">
        <header className="zoneHeading">
          <div>
            <p className="eyebrow">{ru ? "Принятые публичные знания" : "Accepted public knowledge"}</p>
            <h2 id="btc-accepted-knowledge-title">{ru ? "Что поиску и AI следует знать о BTC Field" : "What search and AI should know about BTC Field"}</h2>
          </div>
          <p>{ru ? "Канонические ответы индексируются на входной странице; произвольные live-запросы не индексируются." : "Canonical answers are indexable on the entry page; arbitrary live queries are not indexable."}</p>
        </header>
        <div className="evidenceStack">
          {acceptedKnowledge.map((item) => <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>)}
        </div>
      </section>

      {p.binanceObservation&&<BtcBinanceFreeObservationPanel''',
)

Path("public").mkdir(exist_ok=True)
Path("public/robots.txt").write_text(
    "User-agent: *\\nAllow: /\\n\\nSitemap: https://www.bhrigu.io/sitemap.xml\\n",
    encoding="utf-8",
)
Path("public/sitemap.xml").write_text(clean_block('''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://www.bhrigu.io/</loc>
  </url>
  <url>
    <loc>https://www.bhrigu.io/crypto-astro/btc?lang=en</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ru" href="https://www.bhrigu.io/crypto-astro/btc?lang=ru"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>
  </url>
  <url>
    <loc>https://www.bhrigu.io/crypto-astro/btc?lang=ru</loc>
    <xhtml:link rel="alternate" hreflang="en" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ru" href="https://www.bhrigu.io/crypto-astro/btc?lang=ru"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>
  </url>
</urlset>
'''), encoding="utf-8")
Path("public/llms.txt").write_text(clean_block('''# BHRIGU

BHRIGU is the public product home.

## Primary product
- Market Cosmographer: evidence-linked market intelligence.
- BTC Field: the first public corridor, designed for Bitcoin investors and researchers.

## Canonical public pages
- https://www.bhrigu.io/
- https://www.bhrigu.io/crypto-astro/btc?lang=en
- https://www.bhrigu.io/crypto-astro/btc?lang=ru

## Index policy
The BTC entry page and its accepted public knowledge are indexable.
Arbitrary live dialogue queries at /crypto-astro/btc/live are noindex and are not canonical knowledge pages.

## Evidence boundary
Market answers use the accepted Market Snapshot and Delta.
Bitcoin protocol answers use pinned protocol sources.
Astronomical answers use the published ephemeris evidence index.
Astronomy × BTC comparisons do not claim causality.
The system does not provide guaranteed prices or trading instructions.
'''), encoding="utf-8")

static_check = Path("scripts/run-btc-natural-followup-discovery-static-fixture.mjs")
static_check.write_text(clean_block('''import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const checks = [];
const check = (name, pass) => {
  checks.push({ name, pass: Boolean(pass) });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}`);
};

const route = read("lib/btc-cosmographer-route-graph.ts");
const live = read("pages/crypto-astro/btc/live.tsx");
const component = read("components/btc/BtcCosmographerDialogue.tsx");
const app = read("pages/_app.js");
const document = read("pages/_document.js");
const entry = read("pages/crypto-astro/btc.tsx");

check("natural_current_state", route.includes("what(?:'s|\\\\s+is)\\\\s+happening"));
check("natural_issuance", route.includes("how\\\\s+(?:are|do)\\\\s+new"));
check("methodology_precedence", route.indexOf("if (isMethodology(question))") < route.indexOf('if (market === "change_memory")'));
check("referential_divergence", route.includes("which facts create"));
check("named_calendar_date", route.includes("namedCalendarDate"));
check("return_context_inheritance", route.includes('relation === "RETURN_TO_PREVIOUS_TOPIC"'));
check("market_evidence_rebinding", live.includes("marketEvidenceQuestion(route)"));
check("return_packet", live.includes("parseReturnContext") && component.includes("returnContextFields"));
check("live_noindex_header", live.includes('X-Robots-Tag", "noindex, follow'));
check("dynamic_html_lang", document.includes("<Html lang={lang}>"));
check("btc_route_meta", app.includes('"/crypto-astro/btc/live"'));
check("accepted_public_knowledge", entry.includes("BTC_ACCEPTED_PUBLIC_KNOWLEDGE"));
check("json_ld", entry.includes("application/ld+json"));
check("robots", read("public/robots.txt").includes("Sitemap:"));
check("sitemap", read("public/sitemap.xml").includes("btc?lang=ru"));
check("llms", read("public/llms.txt").includes("Arbitrary live dialogue queries"));

const failures = checks.filter((item) => !item.pass);
if (failures.length) process.exit(1);
console.log(`BTC_NATURAL_FOLLOWUP_DISCOVERY_STATIC=PASS checks=${checks.length}`);
'''), encoding="utf-8")

Path(".github/workflows/btc-natural-followup-discovery-pr.yml").write_text(clean_block('''name: BTC Natural Follow-up and Discovery PR

on:
  pull_request:
    branches: [master]
    paths:
      - components/btc/BtcCosmographerDialogue.tsx
      - lib/btc-cosmographer-answer.ts
      - lib/btc-cosmographer-evidence-navigation-runtime.ts
      - lib/btc-cosmographer-route-graph.ts
      - pages/_app.js
      - pages/_document.js
      - pages/crypto-astro/btc.tsx
      - pages/crypto-astro/btc/live.tsx
      - public/robots.txt
      - public/sitemap.xml
      - public/llms.txt
      - scripts/run-btc-natural-followup-discovery-static-fixture.mjs
      - scripts/verify-btc-natural-followup-conversations.py
      - .github/workflows/btc-natural-followup-discovery-pr.yml

permissions:
  contents: read

concurrency:
  group: btc-natural-followup-discovery-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  exact-head:
    runs-on: ubuntu-24.04
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Install locked dependencies
        run: npm ci --ignore-scripts
      - name: Static contract
        run: node scripts/run-btc-natural-followup-discovery-static-fixture.mjs
      - name: Production build
        run: npm run build
      - name: Start exact-head server
        run: |
          npm start > /tmp/btc-next.log 2>&1 &
          echo $! > /tmp/btc-next.pid
          for attempt in $(seq 1 60); do
            curl -fsS 'http://127.0.0.1:3000/crypto-astro/btc/live?lang=en' >/dev/null && exit 0
            sleep 1
          done
          cat /tmp/btc-next.log
          exit 1
      - name: Install browser client
        run: python3 -m pip install --disable-pip-version-check selenium==4.34.2
      - name: Verify 24 three-turn dialogues
        run: python3 scripts/verify-btc-natural-followup-conversations.py
      - name: Stop server
        if: always()
        run: |
          if test -f /tmp/btc-next.pid; then kill "$(cat /tmp/btc-next.pid)" || true; fi
          if test -f /tmp/btc-next.log; then tail -n 100 /tmp/btc-next.log; fi
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: btc-natural-followup-${{ github.event.pull_request.head.sha }}
          path: artifacts/btc-natural-followup-conversation-report.json
          if-no-files-found: warn
          retention-days: 14
'''), encoding="utf-8")

Path("scripts/verify-btc-natural-followup-conversations.py").write_text(clean_block(r'''import json
import os
from urllib.parse import quote
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE = "http://127.0.0.1:3000/crypto-astro/btc/live"
SESSION_KEY = "bhrigu:btc-cosmographer:session:v0_3"

BASE_CASES = [
    ("market", "What is the current BTC market structure?", "Why?", "Now switch to the Bitcoin protocol.", "btc_market", "market_structure", "bitcoin_protocol", "overview"),
    ("market", "Какова текущая рыночная структура BTC?", "Какие факты создают расхождение?", "Теперь перейди к протоколу Bitcoin.", "btc_market", "market_structure", "bitcoin_protocol", "overview"),
    ("current", "What is happening with BTC now?", "What changed most?", "What changed since the previous accepted Snapshot?", "btc_market", "general_btc_field", "snapshot_memory", "change_memory"),
    ("current", "Что происходит с BTC сейчас?", "Что изменилось сильнее?", "Что изменилось с предыдущего принятого Snapshot BTC?", "btc_market", "general_btc_field", "snapshot_memory", "change_memory"),
    ("snapshot", "What changed since the previous accepted BTC Snapshot?", "Why does that matter?", "Who was Satoshi Nakamoto?", "snapshot_memory", "change_memory", "bitcoin_protocol", "satoshi_history"),
    ("snapshot", "Что изменилось с предыдущего принятого Snapshot BTC?", "Почему это важно?", "Кто был Сатоши Накамото?", "snapshot_memory", "change_memory", "bitcoin_protocol", "satoshi_history"),
    ("issuance", "How are new bitcoin issued?", "Why does the subsidy decrease?", "What is the current BTC market structure?", "bitcoin_protocol", "subsidy", "btc_market", "market_structure"),
    ("issuance", "Как выпускаются новые биткоины?", "Почему субсидия уменьшается?", "Какова текущая рыночная структура BTC?", "bitcoin_protocol", "subsidy", "btc_market", "market_structure"),
    ("origins", "Who was Satoshi Nakamoto?", "What is known for certain?", "How did Bitcoin begin?", "bitcoin_protocol", "satoshi_history", "bitcoin_protocol", "bitcoin_origin"),
    ("origins", "Кто был Сатоши Накамото?", "Что известно точно?", "Как появился Bitcoin?", "bitcoin_protocol", "satoshi_history", "bitcoin_protocol", "bitcoin_origin"),
    ("astronomy", "Where is Jupiter on August 6, 2026?", "What aspect is most relevant?", "Now switch to the Bitcoin protocol.", "astromodule", "jupiter", "bitcoin_protocol", "overview"),
    ("astronomy", "Где находится Юпитер 6 августа 2026 года?", "Какой аспект наиболее значим?", "Теперь перейди к протоколу Bitcoin.", "astromodule", "jupiter", "bitcoin_protocol", "overview"),
    ("bridge", "How does Jupiter coincide with BTC market structure on August 6, 2026?", "Which facts create the divergence?", "Which sources support this comparison?", "astro_btc_bridge", "jupiter", "methodology", "source_and_method"),
    ("bridge", "Как Юпитер совпадает со структурой BTC 6 августа 2026 года?", "Какие факты создают расхождение?", "Какие источники поддерживают это сопоставление?", "astro_btc_bridge", "jupiter", "methodology", "source_and_method"),
    ("method", "Which sources and method support the current BTC read?", "Where is the inference boundary?", "What is happening with BTC now?", "methodology", "source_and_method", "btc_market", "general_btc_field"),
    ("method", "Какие источники и метод поддерживают текущее чтение BTC?", "Где проходит граница вывода?", "Что происходит с BTC сейчас?", "methodology", "source_and_method", "btc_market", "general_btc_field"),
    ("unsupported", "Give me a guaranteed BTC price target for tomorrow.", "What is the current BTC market structure?", "Now switch to the Bitcoin protocol.", "unsupported", "unsupported_market_request", "bitcoin_protocol", "overview"),
    ("unsupported", "Дай мне гарантированную цель цены BTC на завтра.", "Какова текущая рыночная структура BTC?", "Теперь перейди к протоколу Bitcoin.", "unsupported", "unsupported_market_request", "bitcoin_protocol", "overview"),
    ("return", "What is the current BTC market structure?", "Now switch to the Bitcoin protocol.", "Return to the previous topic.", "btc_market", "market_structure", "btc_market", "market_structure"),
    ("return", "Какова текущая рыночная структура BTC?", "Теперь перейди к протоколу Bitcoin.", "Вернись к предыдущей теме.", "btc_market", "market_structure", "btc_market", "market_structure"),
    ("date_return", "Where is Jupiter on August 6, 2026?", "Now switch to the Bitcoin protocol.", "Return to the previous topic.", "astromodule", "jupiter", "astromodule", "jupiter"),
    ("date_return", "Где находится Юпитер 6 августа 2026 года?", "Теперь перейди к протоколу Bitcoin.", "Вернись к предыдущей теме.", "astromodule", "jupiter", "astromodule", "jupiter"),
    ("parity", "What is the Bitcoin protocol?", "Why is proof of work important?", "What is happening with BTC now?", "bitcoin_protocol", "overview", "btc_market", "general_btc_field"),
    ("parity", "Что такое протокол Bitcoin?", "Почему доказательство работы важно?", "Что происходит с BTC сейчас?", "bitcoin_protocol", "overview", "btc_market", "general_btc_field"),
]

def attr(node, name):
    return node.get_attribute(name) or ""

def run_case(index, case):
    tag, q1, q2, q3, d1, s1, d3, s3 = case
    locale = "ru" if any("а" <= char.lower() <= "я" or char.lower() == "ё" for char in q1) else "en"
    width = 390 if index % 2 else 1280
    options = webdriver.ChromeOptions()
    for argument in ("--headless=new", "--no-sandbox", "--disable-dev-shm-usage", f"--window-size={width},1000"):
        options.add_argument(argument)
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 30)
    checks = []

    def record(name, passed, details=""):
        checks.append({"name": name, "passed": bool(passed), "details": details})
        if not passed:
            raise AssertionError(f"{name}: {details}")

    def turns():
        return driver.find_elements(By.CSS_SELECTOR, "article[data-route-domain]")

    def latest():
        wait.until(lambda _: len(turns()) > 0)
        return turns()[-1]

    def submit(question):
        previous = driver.find_element(By.CSS_SELECTOR, "main.liveDialoguePage")
        textarea = wait.until(lambda d: d.find_element(By.CSS_SELECTOR, 'textarea[name="q"]'))
        textarea.clear()
        textarea.send_keys(question)
        driver.execute_script("arguments[0].requestSubmit()", driver.find_element(By.CSS_SELECTOR, "form.liveComposer"))
        wait.until(EC.staleness_of(previous))
        wait.until(lambda _: len(turns()) > 0)
        return latest()

    try:
        driver.get(f"{BASE}?lang={locale}")
        driver.execute_script("window.sessionStorage.clear()")
        driver.get(f"{BASE}?lang={locale}&q={quote(q1)}")
        first = latest()
        record("turn1_domain", attr(first, "data-route-domain") == d1, attr(first, "data-route-domain"))
        record("turn1_subject", attr(first, "data-route-subject") == s1, attr(first, "data-route-subject"))
        record("turn1_direct_first", bool(first.find_elements(By.CSS_SELECTOR, '[data-answer-direct="true"]')))
        record("html_lang", driver.find_element(By.TAG_NAME, "html").get_attribute("lang") == locale)
        second = submit(q2)
        record("turn2_not_clarify", attr(second, "data-route-disposition") != "CLARIFY", attr(second, "data-route-disposition"))
        if tag not in ("unsupported",):
            record("turn2_continuity", attr(second, "data-context-relation") in ("FOLLOW_UP", "CROSS_MODULE_BRIDGE"), attr(second, "data-context-relation"))
        second_period = ""
        if tag in ("astronomy", "bridge"):
            second_period = driver.find_element(By.CSS_SELECTOR, ".activeContextLine").get_attribute("data-active-period") or ""
        third = submit(q3)
        record("turn3_domain", attr(third, "data-route-domain") == d3, attr(third, "data-route-domain"))
        record("turn3_subject", attr(third, "data-route-subject") == s3, attr(third, "data-route-subject"))
        if tag in ("return", "date_return"):
            record("return_relation", attr(third, "data-context-relation") == "RETURN_TO_PREVIOUS_TOPIC", attr(third, "data-context-relation"))
        if tag in ("astronomy", "bridge"):
            record("exact_date_retained", "2026" in second_period, second_period)
        if tag == "date_return":
            return_period = driver.find_element(By.CSS_SELECTOR, ".activeContextLine").get_attribute("data-active-period") or ""
            record("exact_date_retained", "2026" in return_period, return_period)
            record("exact_date_not_month_only", any(token in return_period for token in ("06.08.2026", "06 AUG 2026", "2026-08-06")), return_period)
        visible = driver.find_element(By.CSS_SELECTOR, "main.liveDialoguePage").text
        record("no_internal_authority_visible", "ACCEPTED_MARKET_RECORD_AND_VERIFIED" not in visible)
        record("evidence_disclosure", bool(driver.find_elements(By.CSS_SELECTOR, "details[data-answer-source-boundary]")))
        record("three_turns", len(turns()) >= 3, str(len(turns())))
        driver.execute_script("window.sessionStorage.clear()")
        driver.get(f"{BASE}?lang={locale}")
        record("clean_reset", not driver.find_elements(By.CSS_SELECTOR, ".liveThread"))
    finally:
        driver.quit()
    return {
        "index": index + 1,
        "tag": tag,
        "locale": locale,
        "viewport": "mobile" if width == 390 else "desktop",
        "checks": checks,
        "status": "PASS" if all(item["passed"] for item in checks) else "FAIL",
    }

results = []
error = None
try:
    for index, case in enumerate(BASE_CASES):
        results.append(run_case(index, case))
except Exception as exc:
    error = str(exc)

report = {
    "schema": "btc_natural_followup_conversation_acceptance_v0_1",
    "status": "PASS" if error is None and len(results) == 24 and all(row["status"] == "PASS" for row in results) else "FAIL",
    "dialogue_count": len(results),
    "required_dialogue_count": 24,
    "results": results,
    "error": error,
}
os.makedirs("artifacts", exist_ok=True)
with open("artifacts/btc-natural-followup-conversation-report.json", "w", encoding="utf-8") as handle:
    json.dump(report, handle, ensure_ascii=False, indent=2)
print(json.dumps(report, ensure_ascii=False))
if report["status"] != "PASS":
    raise SystemExit(1)
'''), encoding="utf-8")

Path(".github/workflows/_apply-btc-natural-followup-repair.yml").unlink()
Path("scripts/apply-btc-natural-followup-repair.py").unlink()