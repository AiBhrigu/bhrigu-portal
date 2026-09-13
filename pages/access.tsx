import Head from "next/head";
import Link from "next/link";

type Locale = "en" | "ru";

const REVENUE_EMAIL = "bhrigu-revenue@agentmail.to";
const GITHUB_PROFILE = "https://github.com/AiBhrigu";
const TEMPORAL_EVIDENCE_REPO = "https://github.com/AiBhrigu/bhrigu-bitcoin-research-state-api";
const HACKATHON_CAPSULE_REPO = "https://github.com/AiBhrigu/bhrigu-binance-agent-os-track-a";

const COPY = {
  en: {
    eyebrow: "Φ RESEARCH SYSTEMS · EXTERNAL RECON",
    title: "Find what is failing in your system.",
    lead: "One bounded, read-only recon of an AI or research system — three highest-impact findings, evidence, and an exact repair blueprint.",
    noMutation: "No development or production mutation is included.",
    firstLine: "ONE BOUNDED SYSTEM · 3 FINDINGS · EVIDENCE-LINKED · USD 300",
    priceLabel: "FIXED BASE OBJECT",
    priceScope: "ONE BOUNDED SYSTEM",
    implementation: "NO IMPLEMENTATION",
    primaryCta: "Start the recon",
    agentCta: "Agent entry contract ↓",
    directEmail: "Email directly:",
    offerTitle: "Φ External Systems Recon",
    offerLead: "One bounded system. One read-only investigation.",
    getsTitle: "You receive exactly four primary objects",
    gets: [
      ["01", "System map", "Major components, information/data flow, agent/tool boundaries, and the public/protected boundary."],
      ["02", "3 highest-impact findings", "Ranked by systemic impact, not by the number of minor defects."],
      ["03", "Evidence for each finding", "URLs, repositories/files, observable behavior, contracts/documents, and reproducible public evidence where available."],
      ["04", "Exact repair blueprint", "What must change, where, the required invariant, and the acceptance condition."],
    ],
    scopeLaw: "The scope is fixed before work begins. If the system cannot fit one bounded recon object, BHRIGU narrows or declines it before agreement.",
    forTitle: "Good fit",
    forItems: ["AI agents", "MCP servers / tools", "RAG and knowledge systems", "Research products", "Conversational AI", "Evaluation / context / memory architectures", "Bitcoin / crypto research systems", "AI-facing public products"],
    notTitle: "Not this object",
    notItems: ["Generic website agency work", "Full product development", "Open-ended consulting", "Emergency incident response", "Penetration testing", "Credential recovery", "Wallet management", "Trading execution", "Unbounded redesigns"],
    proofTitle: "Existing public proof",
    proofLead: "Inspect existing systems and artifacts. These are proof surfaces, not testimonials or award claims.",
    proofItems: [
      ["Φ Research Systems / AiBhrigu", "Public identity, agent/MCP/context-memory/evaluation work, and protected-IP boundaries.", GITHUB_PROFILE],
      ["BHRIGU Bitcoin Temporal Evidence", "Bounded read-only agent capability with MCP, deterministic verification, explicit failure behavior, and no trading authority.", TEMPORAL_EVIDENCE_REPO],
      ["BTC Cosmographer", "Live evidence-linked Bitcoin research corridor with explicit source and causality boundaries.", "/crypto-astro/btc?lang=en"],
      ["Public hackathon capsule", "Bounded read-only research-agent evidence. No award or win is implied.", HACKATHON_CAPSULE_REPO],
    ],
    agentTitle: "Agent entry contract",
    agentLead: "External agents can send a minimal qualification object directly. This is an agent-compatible transport contract, not a claim of unattended automatic processing.",
    sendTitle: "Send only what is needed to qualify the object",
    dontSendTitle: "Do not send",
    dontSend: ["Passwords", "Seed phrases", "API keys", "Wallet secrets", "Exchange credentials", "Private customer data", "Production secrets"],
    responseTitle: "Expected qualification response",
    humanTitle: "Human entry",
    humanLead: "No registration. No account. No questionnaire. No public intake database.",
    processTitle: "Commercial process",
    process: "QUALIFY → SCOPE → PRICE → PROOF → AGREEMENT → WORK → REPORT → PAYMENT",
    privacyTitle: "Privacy + protected IP boundary",
    privacyLead: "First contact may include public URLs, public repositories, public documentation, a problem statement, and authorized non-secret context. If private evidence becomes essential, the process stops until a separate authorized scope exists.",
    protectedLead: "The report may expose observations, evidence, findings, repair blueprint, and acceptance criteria. ORION internals, private prompts/planners/evaluators/corpora, unpublished research, credentials, and patent-sensitive mechanisms remain protected.",
    supportLabel: "Voluntary Bitcoin support — not payment for this service.",
    supportBody: "The existing /support corridor remains voluntary research support and does not buy access, priority, ownership, or this paid recon.",
    finalTitle: "One bounded system. One exact decision surface.",
    finalLead: "Start with public evidence and the decision this recon must support.",
    humanBody: "Φ External Systems Recon\n\nSystem:\nURL:\nWhat is not working / what should be checked:\nPrimary decision this recon should support:\nRelevant public evidence:\nLanguage: EN",
  },
  ru: {
    eyebrow: "Φ RESEARCH SYSTEMS · ВНЕШНЯЯ РАЗВЕДКА",
    title: "Найдём, что ломает вашу систему.",
    lead: "Одна bounded read-only разведка AI- или исследовательской системы: три ключевых вывода, доказательства и точный blueprint исправления.",
    noMutation: "Разработка и изменение production не входят в работу.",
    firstLine: "ОДНА СИСТЕМА · 3 ВЫВОДА · EVIDENCE-LINKED · USD 300",
    priceLabel: "ФИКСИРОВАННЫЙ БАЗОВЫЙ ОБЪЕКТ",
    priceScope: "ОДНА ОГРАНИЧЕННАЯ СИСТЕМА",
    implementation: "NO IMPLEMENTATION",
    primaryCta: "Начать разведку",
    agentCta: "Контракт для AI-агента ↓",
    directEmail: "Написать напрямую:",
    offerTitle: "Φ External Systems Recon",
    offerLead: "Одна ограниченная система. Одна read-only разведка.",
    getsTitle: "Вы получаете ровно четыре основных объекта",
    gets: [
      ["01", "Карта системы", "Основные компоненты, информационные/data-потоки, границы agent/tool и public/protected boundary."],
      ["02", "3 наиболее значимых вывода", "Ранжирование по системному влиянию, а не по числу мелких дефектов."],
      ["03", "Доказательства по каждому выводу", "URL, repository/file, наблюдаемое поведение, contract/document и воспроизводимые публичные доказательства, где они доступны."],
      ["04", "Точный blueprint исправления", "Что должно измениться, где, какой invariant требуется и как выглядит acceptance condition."],
    ],
    scopeLaw: "Scope фиксируется до начала работы. Если система не помещается в один bounded recon object, BHRIGU сужает scope или отказывает до соглашения.",
    forTitle: "Подходит",
    forItems: ["AI-агенты", "MCP servers / tools", "RAG и knowledge-системы", "Исследовательские продукты", "Conversational AI", "Evaluation / context / memory architectures", "Bitcoin / crypto research systems", "AI-facing public products"],
    notTitle: "Не этот объект",
    notItems: ["Generic website agency work", "Полная разработка продукта", "Бессрочный консалтинг", "Emergency incident response", "Penetration testing", "Credential recovery", "Wallet management", "Trading execution", "Неограниченный redesign"],
    proofTitle: "Существующие публичные доказательства",
    proofLead: "Проверяйте существующие системы и артефакты. Это proof surfaces, а не testimonials или заявления о наградах.",
    proofItems: [
      ["Φ Research Systems / AiBhrigu", "Публичная identity, agent/MCP/context-memory/evaluation работа и protected-IP boundaries.", GITHUB_PROFILE],
      ["BHRIGU Bitcoin Temporal Evidence", "Ограниченная read-only capability для агентов с MCP, deterministic verification, явным failure behavior и без торговых полномочий.", TEMPORAL_EVIDENCE_REPO],
      ["BTC Cosmographer", "Живой evidence-linked Bitcoin research corridor с явными source и causality boundaries.", "/crypto-astro/btc?lang=ru"],
      ["Public hackathon capsule", "Публичное доказательство bounded read-only research agent. Награда или победа не подразумевается.", HACKATHON_CAPSULE_REPO],
    ],
    agentTitle: "Контракт для AI-агента",
    agentLead: "Внешний агент может отправить минимальный qualification object напрямую. Это agent-compatible transport contract, а не заявление об unattended automatic processing.",
    sendTitle: "Отправляйте только данные, необходимые для qualification",
    dontSendTitle: "Не отправляйте",
    dontSend: ["Пароли", "Seed phrases", "API keys", "Wallet secrets", "Exchange credentials", "Private customer data", "Production secrets"],
    responseTitle: "Ожидаемый qualification response",
    humanTitle: "Вход для человека",
    humanLead: "Без регистрации. Без аккаунта. Без анкеты. Без публичной intake database.",
    processTitle: "Коммерческий процесс",
    process: "QUALIFY → SCOPE → PRICE → PROOF → AGREEMENT → WORK → REPORT → PAYMENT",
    privacyTitle: "Privacy + protected IP boundary",
    privacyLead: "Первый контакт может включать public URLs, public repositories, public documentation, problem statement и authorized non-secret context. Если private evidence становится необходимым, процесс останавливается до отдельного authorized scope.",
    protectedLead: "Отчёт может раскрывать observations, evidence, findings, repair blueprint и acceptance criteria. ORION internals, private prompts/planners/evaluators/corpora, unpublished research, credentials и patent-sensitive mechanisms остаются защищёнными.",
    supportLabel: "Добровольная Bitcoin-поддержка — не оплата этой услуги.",
    supportBody: "Существующий /support остаётся контуром добровольной поддержки исследований и не покупает access, priority, ownership или эту платную разведку.",
    finalTitle: "Одна ограниченная система. Одна точная поверхность решения.",
    finalLead: "Начните с публичных доказательств и решения, которое должна поддержать разведка.",
    humanBody: "Φ External Systems Recon\n\nSystem:\nURL:\nЧто не работает / что нужно проверить:\nКакое основное решение должна поддержать разведка:\nRelevant public evidence:\nLanguage: RU",
  },
} as const;

const FREY_PERSONAL_COPY = {
  en: {
    eyebrow: "FREY × COSMOGRAPHER · PERSONAL RESEARCH",
    title: "Turn one Frey reading into a finished personal temporal research object.",
    lead: "One person. One question. One time window. A bounded research memo that separates observation, interpretation, uncertainty, and the conditions that would change the current read.",
    boundary: "No guaranteed prediction. No open-ended consulting. No medical, legal, or financial advice.",
    signal: "ONE PERSON · ONE QUESTION · ONE TIME WINDOW · USD 79",
    priceLabel: "FIXED PERSONAL OBJECT",
    priceScope: "ONE BOUNDED RESEARCH MEMO",
    primaryCta: "Request personal research",
    backCta: "Return to Frey →",
    offerTitle: "Frey Personal Temporal Research",
    offerLead: "A bounded personal research object built from one Frey reading and one explicit question.",
    getsTitle: "You receive exactly five research objects",
    gets: [
      ["01", "Personal temporal map", "The active structure of the selected time window, expressed as a bounded research map."],
      ["02", "3 highest-signal factors", "The three factors carrying the most interpretive weight in the current read."],
      ["03", "Time window", "Where the current structure is active, strengthening, weakening, or changing."],
      ["04", "Forward conditions", "What observable conditions would materially change the present interpretation."],
      ["05", "Finished research memo", "One concise deliverable that joins the map, signals, window, conditions, and uncertainty boundary."],
    ],
    contextTitle: "Frey context carried into the request",
    contextValid: "The public, non-secret context below was transferred from your current Frey reading and will prefill the request.",
    contextMissing: "No valid Frey context was transferred. You can still request this fixed object by sending one question and one time window.",
    humanTitle: "Request the USD 79 research object",
    humanLead: "No registration. No account. No questionnaire. Start by email with one question and only the context needed for the research object.",
    boundaryTitle: "Bounded research boundary",
    boundaryItems: ["No guaranteed prediction", "No open-ended consulting", "No medical advice", "No legal advice", "No financial advice", "No credentials or secrets"],
    processTitle: "Commercial process",
    process: "REQUEST → SCOPE CONFIRMATION → PAYMENT ARRANGEMENT → WORK → RESEARCH MEMO",
    privacyTitle: "Privacy + protected IP boundary",
    privacyLead: "Send only the personal context needed to understand the question. Do not send passwords, API keys, wallet secrets, account credentials, or unrelated private records.",
    protectedLead: "The delivered memo may expose observations, interpretation, uncertainty, and forward conditions. ORION internals, private prompts/planners/evaluators/corpora, unpublished research, and protected mechanisms remain private.",
    supportLabel: "Voluntary Bitcoin support is not payment for this research object.",
    supportBody: "The existing /support corridor remains voluntary research support and does not purchase this USD 79 personal research object.",
    finalTitle: "One person. One question. One bounded temporal research memo.",
    finalLead: "Start from the Frey reading you already have, then state the one question the memo must help you examine.",
    mailTitle: "Frey Personal Temporal Research · USD 79",
    questionLabel: "One question",
    contextLabel: "Short context",
    replyLabel: "Reply contact",
    languageLabel: "Language",
    primaryDateLabel: "Primary date",
    secondaryDateLabel: "Optional second date",
    signalClassLabel: "Signal class",
    structuralStateLabel: "Structural state",
    vectorLabel: "Operational vector",
  },
  ru: {
    eyebrow: "FREY × КОСМОГРАФ · ПЕРСОНАЛЬНОЕ ИССЛЕДОВАНИЕ",
    title: "Превратите одно чтение Frey в законченный персональный темпоральный исследовательский объект.",
    lead: "Один человек. Один вопрос. Одно временное окно. Ограниченный research memo, который разделяет наблюдение, интерпретацию, неопределённость и условия, способные изменить текущее чтение.",
    boundary: "Без гарантированного прогноза. Без бессрочного консультирования. Без медицинских, юридических и финансовых рекомендаций.",
    signal: "ОДИН ЧЕЛОВЕК · ОДИН ВОПРОС · ОДНО ВРЕМЕННОЕ ОКНО · USD 79",
    priceLabel: "ФИКСИРОВАННЫЙ ПЕРСОНАЛЬНЫЙ ОБЪЕКТ",
    priceScope: "ОДИН ОГРАНИЧЕННЫЙ RESEARCH MEMO",
    primaryCta: "Запросить персональное исследование",
    backCta: "Вернуться в Frey →",
    offerTitle: "Frey Personal Temporal Research",
    offerLead: "Ограниченный персональный исследовательский объект на основе одного чтения Frey и одного явного вопроса.",
    getsTitle: "Вы получаете ровно пять исследовательских объектов",
    gets: [
      ["01", "Персональная темпоральная карта", "Активная структура выбранного временного окна как ограниченная исследовательская карта."],
      ["02", "3 наиболее значимых фактора", "Три фактора, которые несут наибольший интерпретационный вес в текущем чтении."],
      ["03", "Временное окно", "Где текущая структура активна, усиливается, ослабевает или меняется."],
      ["04", "Условия вперёд", "Какие наблюдаемые условия способны существенно изменить текущую интерпретацию."],
      ["05", "Законченный research memo", "Один компактный результат, объединяющий карту, сигналы, окно, условия и границу неопределённости."],
    ],
    contextTitle: "Контекст Frey, перенесённый в запрос",
    contextValid: "Публичный несекретный контекст ниже перенесён из текущего чтения Frey и будет подставлен в запрос.",
    contextMissing: "Корректный контекст Frey не передан. Этот фиксированный объект всё равно можно запросить, указав один вопрос и одно временное окно.",
    humanTitle: "Запросить исследовательский объект за USD 79",
    humanLead: "Без регистрации. Без аккаунта. Без анкеты. Начните с письма: один вопрос и только тот контекст, который нужен для исследовательского объекта.",
    boundaryTitle: "Граница ограниченного исследования",
    boundaryItems: ["Без гарантированного прогноза", "Без бессрочного консультирования", "Без медицинских рекомендаций", "Без юридических рекомендаций", "Без финансовых рекомендаций", "Без credentials и secrets"],
    processTitle: "Коммерческий процесс",
    process: "REQUEST → SCOPE CONFIRMATION → PAYMENT ARRANGEMENT → WORK → RESEARCH MEMO",
    privacyTitle: "Privacy + protected IP boundary",
    privacyLead: "Отправляйте только персональный контекст, необходимый для понимания вопроса. Не отправляйте пароли, API keys, wallet secrets, account credentials или не относящиеся к вопросу private records.",
    protectedLead: "Research memo может раскрывать наблюдения, интерпретацию, неопределённость и forward conditions. ORION internals, private prompts/planners/evaluators/corpora, unpublished research и protected mechanisms остаются закрытыми.",
    supportLabel: "Добровольная Bitcoin-поддержка не является оплатой этого исследовательского объекта.",
    supportBody: "Существующий /support остаётся добровольной поддержкой исследований и не покупает персональный объект за USD 79.",
    finalTitle: "Один человек. Один вопрос. Один ограниченный темпоральный research memo.",
    finalLead: "Начните с уже полученного чтения Frey и сформулируйте один вопрос, который должен исследовать memo.",
    mailTitle: "Frey Personal Temporal Research · USD 79",
    questionLabel: "Один вопрос",
    contextLabel: "Краткий контекст",
    replyLabel: "Контакт для ответа",
    languageLabel: "Язык",
    primaryDateLabel: "Основная дата",
    secondaryDateLabel: "Опциональная вторая дата",
    signalClassLabel: "Класс сигнала",
    structuralStateLabel: "Структурное состояние",
    vectorLabel: "Операционный вектор",
  },
} as const;

const AGENT_CONTRACT = {
  request_type: "phi_external_systems_recon",
  version: "1",
  system_name: "",
  system_url: "",
  system_type: "agent|mcp|rag|knowledge|research|conversational_ai|bitcoin_crypto|other",
  problem: "",
  primary_decision: "",
  evidence_urls: [],
  constraints: ["read_only", "no_credentials", "no_production_mutation"],
  preferred_language: "en|ru",
  reply_contact: "",
};

const QUALIFICATION_RESPONSE = `STATUS=QUALIFIED | NEEDS_SCOPE | DECLINED
OBJECT=one bounded system
PRICE=USD 300
DELIVERABLE=system map + 3 findings + evidence + repair blueprint
IMPLEMENTATION=NO
NEXT=scope agreement`;

export async function getServerSideProps({ query }: any) {
  const rawLang = Array.isArray(query?.lang) ? query.lang[0] : query?.lang;
  const locale: Locale = rawLang === "ru" ? "ru" : "en";
  const rawOffer = Array.isArray(query?.offer) ? query.offer[0] : query?.offer;
  const offer = rawOffer === "frey-personal" ? "frey-personal" : "system-recon";

  let freyContext = null;
  if (offer === "frey-personal") {
    const rawCtx = Array.isArray(query?.ctx) ? query.ctx[0] : query?.ctx;
    const boundedCtx = typeof rawCtx === "string" ? rawCtx.trim().slice(0, 4096) : "";
    if (boundedCtx) {
      const { decodeFreyAccessBridgeCtx } = await import("../lib/frey-access-bridge.js");
      freyContext = decodeFreyAccessBridgeCtx(boundedCtx);
    }
  }

  return { props: { locale, offer, freyContext } };
}

type AccessProps = {
  locale: Locale;
  offer: "system-recon" | "frey-personal";
  freyContext: any | null;
};

export default function Access({ locale, offer, freyContext }: AccessProps) {
  const c = COPY[locale];
  const f = FREY_PERSONAL_COPY[locale];
  const isFreyPersonal = offer === "frey-personal";
  const mailto = `mailto:${REVENUE_EMAIL}?subject=${encodeURIComponent("[Φ RECON] ")}&body=${encodeURIComponent(c.humanBody)}`;
  const freyMailBody = [
    f.mailTitle,
    "",
    `${f.primaryDateLabel}: ${freyContext?.primary_date || ""}`,
    `${f.secondaryDateLabel}: ${freyContext?.secondary_date || ""}`,
    `${f.questionLabel}: `,
    `${f.contextLabel}: `,
    `${f.languageLabel}: ${locale.toUpperCase()}`,
    `${f.replyLabel}: `,
    "",
    freyContext?.signal_class ? `${f.signalClassLabel}: ${freyContext.signal_class}` : "",
    freyContext?.structural_state ? `${f.structuralStateLabel}: ${freyContext.structural_state}` : "",
    freyContext?.operational_vector ? `${f.vectorLabel}: ${freyContext.operational_vector}` : "",
  ].filter((line, index, arr) => line || index < 2 || index < arr.length - 3).join("\n");
  const freyMailto = `mailto:${REVENUE_EMAIL}?subject=${encodeURIComponent("[FREY PERSONAL · USD 79] ")}&body=${encodeURIComponent(freyMailBody)}`;
  const agentSubject = "[Φ RECON] <system_name>";
  const canonicalUrl = `https://www.bhrigu.io/access?lang=${locale}${isFreyPersonal ? "&offer=frey-personal" : ""}`;
  const serviceJsonLd = isFreyPersonal ? {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Frey Personal Temporal Research",
    serviceType: "Bounded personal temporal research",
    url: canonicalUrl,
    provider: {
      "@type": "Organization",
      name: "Φ Research Systems / BHRIGU",
      url: "https://www.bhrigu.io/",
      email: REVENUE_EMAIL,
    },
    description: f.lead,
    offers: {
      "@type": "Offer",
      price: "79",
      priceCurrency: "USD",
      url: canonicalUrl,
      description: "One person, one question, one time window: personal temporal map, 3 highest-signal factors, time window, forward conditions, and one finished research memo.",
    },
  } : {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Φ External Systems Recon",
    serviceType: "External AI and research systems recon",
    url: canonicalUrl,
    provider: {
      "@type": "Organization",
      name: "Φ Research Systems / BHRIGU",
      url: "https://www.bhrigu.io/",
      email: REVENUE_EMAIL,
    },
    description: c.lead,
    offers: {
      "@type": "Offer",
      price: "300",
      priceCurrency: "USD",
      url: canonicalUrl,
      description: "One bounded read-only system recon: system map, 3 findings, evidence, and exact repair blueprint. Implementation not included.",
    },
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          data-bhrigu-commercial-service={isFreyPersonal ? "FREY_PERSONAL_TEMPORAL_RESEARCH_V0_1" : "PHI_EXTERNAL_SYSTEMS_RECON_V0_1"}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd).replace(/</g, "\\u003c") }}
        />
      </Head>
      <main className="q" lang={locale} data-access-surface={isFreyPersonal ? "FREY_PERSONAL_TEMPORAL_RESEARCH_V0_1" : "PHI_EXTERNAL_SYSTEMS_RECON_V0_1"}>
      {isFreyPersonal ? (
        <>
          <section className="hero" data-frey-personal-offer="FREY_PERSONAL_TEMPORAL_RESEARCH_USD79_V0_1">
            <div className="meaning">
              <p className="ey">{f.eyebrow}</p>
              <h1>{f.title}</h1>
              <p className="lead">{f.lead}</p>
              <p className="boundary">{f.boundary}</p>
              <p className="signal">{f.signal}</p>
            </div>
            <aside className="action" aria-label={f.offerTitle}>
              <p className="mini">{f.priceLabel}</p>
              <strong className="price">USD 79</strong>
              <span>ONE PERSON</span>
              <span>ONE QUESTION</span>
              <span>ONE TIME WINDOW</span>
              <a className="primary" href={freyMailto}>{f.primaryCta}</a>
              <Link className="secondary" href={`/frey?lang=${locale}`}>{f.backCta}</Link>
            </aside>
          </section>

          <section className="block offer">
            <div><p className="ey">01 · OBJECT</p><h2>{f.offerTitle} — USD 79</h2><p>{f.offerLead}</p></div>
            <p className="scopeLaw">{f.boundary}</p>
          </section>

          <section className="block">
            <p className="ey">02 · DELIVERABLE</p>
            <h2>{f.getsTitle}</h2>
            <div className="grid five">
              {f.gets.map(([n, title, body]) => <article key={n}><b>{n}</b><h3>{title}</h3><p>{body}</p></article>)}
            </div>
          </section>

          <section className="block freyContext" data-frey-personal-context={freyContext ? "valid" : "missing-or-invalid"}>
            <p className="ey">03 · FREY CONTEXT</p>
            <h2>{f.contextTitle}</h2>
            <p>{freyContext ? f.contextValid : f.contextMissing}</p>
            {freyContext ? (
              <div className="contextGrid">
                <article><b>{f.primaryDateLabel}</b><p>{freyContext.primary_date || "—"}</p></article>
                <article><b>{f.secondaryDateLabel}</b><p>{freyContext.secondary_date || "—"}</p></article>
                <article><b>{f.structuralStateLabel}</b><p>{freyContext.structural_state || "—"}</p></article>
                <article><b>{f.vectorLabel}</b><p>{freyContext.operational_vector || "—"}</p></article>
              </div>
            ) : null}
          </section>

          <section className="block human">
            <div><p className="ey">04 · REQUEST</p><h2>{f.humanTitle}</h2><p>{f.humanLead}</p><a className="primary inline" href={freyMailto}>{f.primaryCta}</a></div>
            <pre>{freyMailBody}</pre>
          </section>

          <section className="block fit">
            <div><p className="ey">05 · BOUNDARY</p><h2>{f.boundaryTitle}</h2><ul>{f.boundaryItems.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div><p className="ey">06 · CONTACT</p><h2>{REVENUE_EMAIL}</h2><p>{f.humanLead}</p></div>
          </section>

          <section className="block process">
            <p className="ey">07 · PROCESS</p><h2>{f.processTitle}</h2><p className="flow">{f.process}</p>
          </section>

          <section className="block privacy">
            <p className="ey">08 · PRIVACY / PROTECTED IP</p><h2>{f.privacyTitle}</h2><p>{f.privacyLead}</p><p>{f.protectedLead}</p>
          </section>

          <section className="block support">
            <p className="ey">09 · SUPPORT SEPARATION</p><h2>{f.supportLabel}</h2><p>{f.supportBody}</p><Link href={`/support?lang=${locale}`}>/support →</Link>
          </section>

          <section className="finalCta">
            <div><p className="ey">10 · START</p><h2>{f.finalTitle}</h2><p>{f.finalLead}</p></div>
            <a className="primary" href={freyMailto}>{f.primaryCta}</a>
          </section>
        </>
      ) : (
        <>
      <section className="hero systemHero">
        <div className="meaning systemMeaning">
          <p className="ey">{c.eyebrow}</p>
          <h1>{c.title}</h1>
          <p className="lead">{c.lead}</p>
          <div className="evidenceMotif" aria-hidden="true"><span className="motifNode" /><span className="motifLine" /><span className="motifNode" /><span className="motifLine" /><span className="motifNode" /></div>
          <p className="motifLabel">SYSTEM → EVIDENCE → REPAIR</p>
        </div>
        <aside className="action systemAction" aria-label={c.offerTitle}>
          <p className="mini">{c.priceLabel}</p>
          <strong className="price">USD 300</strong>
          <span>{c.priceScope}</span>
          <span>READ-ONLY</span>
          <span>{c.implementation}</span>
          <a className="primary" href={mailto}>{c.primaryCta}</a>
          <a className="secondary" href="#agent-entry">{c.agentCta}</a>
          <p className="directEmail"><span>{c.directEmail}</span><a href={"mailto:" + REVENUE_EMAIL}>{REVENUE_EMAIL}</a></p>
        </aside>
      </section>

      <section className="block offer">
        <div><p className="ey">01 · OBJECT</p><h2>{c.offerTitle} — USD 300</h2><p>{c.offerLead}</p></div>
        <p className="scopeLaw">{c.scopeLaw}</p>
      </section>

      <section className="block">
        <p className="ey">02 · DELIVERABLE</p>
        <h2>{c.getsTitle}</h2>
        <div className="grid four">
          {c.gets.map(([n, title, body]) => <article key={n}><b>{n}</b><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>

      <section className="block fit">
        <div><p className="ey">03 · FIT</p><h2>{c.forTitle}</h2><ul>{c.forItems.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><p className="ey">04 · BOUNDARY</p><h2>{c.notTitle}</h2><ul>{c.notItems.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </section>

      <section className="block">
        <p className="ey">05 · PROOF</p>
        <h2>{c.proofTitle}</h2>
        <p>{c.proofLead}</p>
        <div className="proofs">
          {c.proofItems.map(([name, body, href]) => {
            const external = /^https?:\/\//.test(href);
            return <article key={name}><h3>{name}</h3><p>{body}</p>{external ? <a href={href} target="_blank" rel="noreferrer">Inspect public proof ↗</a> : <Link href={href}>Inspect public proof →</Link>}</article>;
          })}
        </div>
      </section>

      <section className="block contract" id="agent-entry">
        <p className="ey">06 · AGENT ENTRY</p>
        <h2>{c.agentTitle}</h2>
        <p>{c.agentLead}</p>
        <div className="contractGrid">
          <div>
            <p className="mini">TO</p><code>{REVENUE_EMAIL}</code>
            <p className="mini top">SUBJECT</p><code>{agentSubject}</code>
            <p className="mini top">{c.sendTitle}</p>
            <pre>{JSON.stringify(AGENT_CONTRACT, null, 2)}</pre>
          </div>
          <div>
            <p className="mini">{c.dontSendTitle}</p>
            <ul>{c.dontSend.map((item) => <li key={item}>{item}</li>)}</ul>
            <p className="mini top">{c.responseTitle}</p>
            <pre>{QUALIFICATION_RESPONSE}</pre>
          </div>
        </div>
      </section>

      <section className="block human">
        <div><p className="ey">07 · HUMAN ENTRY</p><h2>{c.humanTitle}</h2><p>{c.humanLead}</p><a className="primary inline" href={mailto}>{c.primaryCta}</a></div>
        <pre>{c.humanBody}</pre>
      </section>

      <section className="block process">
        <p className="ey">08 · PROCESS</p><h2>{c.processTitle}</h2><p className="flow">{c.process}</p>
      </section>

      <section className="block privacy">
        <p className="ey">09 · PRIVACY / PROTECTED IP</p><h2>{c.privacyTitle}</h2><p>{c.privacyLead}</p><p>{c.protectedLead}</p>
      </section>

      <section className="block support">
        <p className="ey">10 · SUPPORT SEPARATION</p><h2>{c.supportLabel}</h2><p>{c.supportBody}</p><Link href={`/support?lang=${locale}`}>/support →</Link>
      </section>

      <section className="finalCta">
        <div><p className="ey">11 · START</p><h2>{c.finalTitle}</h2><p>{c.finalLead}</p></div>
        <a className="primary" href={mailto}>{c.primaryCta}</a>
      </section>
        </>
      )}

      <style jsx>{`
        .q{--gold:#d5b86d;--cyan:#62c9e6;max-width:1080px;margin:auto;padding:54px 20px 120px;color:rgba(247,248,250,.94)}
        .hero{display:grid;grid-template-columns:minmax(0,61.803fr) minmax(280px,38.197fr);border:1px solid rgba(213,184,109,.16);border-radius:24px;overflow:hidden;background:radial-gradient(circle at 10% 8%,rgba(213,184,109,.08),transparent 34%),radial-gradient(circle at 100% 20%,rgba(98,201,230,.06),transparent 28%),rgba(255,255,255,.012)}
        .meaning{padding:48px 44px}.action{display:flex;flex-direction:column;gap:10px;padding:42px 34px;border-left:1px solid rgba(213,184,109,.16);background:rgba(0,0,0,.14)}
        .systemHero{min-height:520px}.systemMeaning,.systemAction{justify-content:center}.systemMeaning{padding:64px 56px}.systemMeaning h1{max-width:660px;margin-bottom:24px;font-size:clamp(44px,5.2vw,68px);line-height:1.01}.systemMeaning .lead{max-width:610px;margin:0;font-size:18px;line-height:1.62}.systemAction{padding:54px 38px}.systemAction .primary{margin-top:24px}
        .evidenceMotif{display:grid;grid-template-columns:10px minmax(44px,96px) 10px minmax(44px,96px) 10px;align-items:center;width:min(330px,76%);margin-top:54px}.motifNode{width:10px;height:10px;border:1px solid rgba(213,184,109,.78);border-radius:50%;box-shadow:0 0 18px rgba(213,184,109,.12)}.motifNode:nth-of-type(3){border-color:rgba(98,201,230,.62)}.motifLine{height:1px;background:linear-gradient(90deg,rgba(213,184,109,.55),rgba(98,201,230,.32))}.motifLabel{margin:11px 0 0;color:rgba(255,255,255,.42);font:600 10px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em}
        .directEmail{display:grid;gap:3px;margin:14px 0 0;padding-top:14px;border-top:1px solid rgba(255,255,255,.08);font-size:12px;line-height:1.45}.directEmail span{color:rgba(255,255,255,.42);font:500 10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase}.directEmail a{width:max-content;max-width:100%;color:rgba(255,255,255,.72);text-decoration-color:rgba(213,184,109,.34);text-underline-offset:4px;overflow-wrap:anywhere}
        .ey,.mini{margin:0 0 12px;color:var(--gold);font-size:11px;letter-spacing:.15em;text-transform:uppercase}.mini{color:rgba(213,184,109,.72)}
        h1{margin:0 0 20px;font:400 clamp(38px,5.4vw,66px)/.99 Georgia,serif;letter-spacing:-.035em}h2{margin:0 0 14px;font:500 clamp(28px,3.5vw,42px)/1.08 Georgia,serif}h3{margin:8px 0 8px;font-size:16px}
        p{color:rgba(255,255,255,.68);line-height:1.65}.lead{max-width:720px;font-size:17px}.boundary{padding-left:16px;border-left:1px solid rgba(213,184,109,.4)}.signal{margin-top:26px;color:rgba(255,255,255,.88);font:600 12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em}
        .price{font:500 clamp(42px,5vw,64px)/1 Georgia,serif;color:#fff}.action span{color:rgba(255,255,255,.62);font:600 11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em}
        .primary,.secondary{display:inline-flex;justify-content:center;align-items:center;min-height:46px;margin-top:10px;padding:0 18px;border-radius:999px;text-decoration:none}.primary{background:var(--gold);color:#111!important;font-weight:700}.secondary{border:1px solid rgba(255,255,255,.16);color:rgba(255,255,255,.82)!important}.inline{width:max-content}
        .block{margin-top:18px;padding:32px;border:1px solid rgba(255,255,255,.085);border-radius:20px;background:rgba(255,255,255,.01)}.offer{display:grid;grid-template-columns:1fr 1fr;gap:36px}.scopeLaw{margin:0;padding-left:18px;border-left:1px solid rgba(98,201,230,.28)}
        .grid{display:grid;gap:12px}.four{grid-template-columns:repeat(4,1fr)}.five{grid-template-columns:repeat(5,minmax(0,1fr))}.contextGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.contextGrid article b{display:block;color:var(--gold);font:600 10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;text-transform:uppercase}.contextGrid article p{margin-top:8px;overflow-wrap:anywhere}article{min-width:0;padding:18px;border:1px solid rgba(255,255,255,.075);border-radius:15px;background:rgba(255,255,255,.012)}article b{color:var(--cyan);font:600 11px ui-monospace,SFMono-Regular,Menlo,monospace}article p{margin-bottom:0;font-size:14px}
        .fit,.contractGrid,.human{display:grid;grid-template-columns:1fr 1fr;gap:24px}.fit>div{padding:4px 12px}.fit>div+div{border-left:1px solid rgba(255,255,255,.08);padding-left:28px}.fit h2,.fit p,.privacy p{overflow-wrap:anywhere;word-break:break-word}ul{padding-left:20px;color:rgba(255,255,255,.67);line-height:1.65}
        .proofs{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.proofs a,.support a{color:#e1c77d;text-underline-offset:3px}
        .contract{scroll-margin-top:80px}.top{margin-top:22px!important}code{color:rgba(98,201,230,.9);overflow-wrap:anywhere}pre{margin:12px 0 0;padding:16px;overflow:auto;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(0,0,0,.22);color:rgba(235,239,244,.78);font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;word-break:break-word}
        .flow{color:rgba(255,255,255,.88);font:600 13px/1.8 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em}.support{border-color:rgba(213,184,109,.15)}
        .finalCta{display:grid;grid-template-columns:1fr auto;gap:30px;align-items:center;margin-top:18px;padding:34px;border:1px solid rgba(213,184,109,.18);border-radius:20px;background:linear-gradient(120deg,rgba(213,184,109,.055),rgba(98,201,230,.025))}.finalCta .primary{min-width:190px;margin:0}
        @media(max-width:860px){.hero,.offer,.fit,.contractGrid,.human,.finalCta{grid-template-columns:1fr}.five,.contextGrid{grid-template-columns:repeat(2,1fr)}.action{border-left:0;border-top:1px solid rgba(213,184,109,.16)}.systemHero{min-height:0}.systemMeaning{padding:52px 42px 46px}.systemAction{padding:38px 42px}.evidenceMotif{margin-top:38px}.four{grid-template-columns:repeat(2,1fr)}.fit>div+div{border-left:0;border-top:1px solid rgba(255,255,255,.08);padding:22px 12px 4px}.finalCta .primary{width:100%}}
        @media(max-width:560px){.q{padding:28px 12px 90px}.meaning,.action{padding:30px 22px}.systemMeaning{padding:22px 26px 12px}.systemAction{padding:12px 26px 22px}.systemMeaning .ey{margin-bottom:8px}.systemMeaning h1{margin-bottom:14px;font-size:clamp(36px,10.5vw,42px)}.systemMeaning .lead{font-size:15px;line-height:1.38}.evidenceMotif{width:min(280px,88%);margin-top:10px}.motifLabel{margin-top:3px;font-size:9px;letter-spacing:.1em}.systemAction .mini{margin-bottom:2px}.systemAction .primary{margin-top:2px}.directEmail{margin-top:8px}.block,.finalCta{padding:24px 20px}.four,.five,.proofs,.contextGrid{grid-template-columns:1fr}.action{gap:6px}.price{font-size:48px}.primary,.secondary{width:100%;box-sizing:border-box}.inline{width:100%}.signal{font-size:11px}}
      `}</style>
      </main>
    </>
  );
}
