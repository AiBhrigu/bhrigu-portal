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
    eyebrow: "FREY × COSMOGRAPHER · COSMOGRAPHIC READING",
    title: "See the field before you decide what to ask.",
    lead: "A complete Cosmographic Reading of one subject across one meaningful temporal horizon — interpreted by the Cosmographer and delivered as a portable Cosmographic Passport.",
    signal: "ONE SUBJECT · ONE TEMPORAL HORIZON · COSMOGRAPHIC PASSPORT · USD 79",
    priceLabel: "ONE COMPLETE READING",
    priceScope: "DELIVERED AS A COSMOGRAPHIC PASSPORT",
    primaryCta: "Begin the reading",
    backCta: "Open Frey →",
    guideCta: "Understand the method →",
    offerTitle: "Cosmographic Reading",
    offerLead: "You do not need to arrive with the perfect question. Bring the person, organization, project or event — and the situation that makes this moment matter.",
    passportTitle: "Your Cosmographic Passport",
    passportLead: "The reading becomes a structured object you can keep, revisit and continue exploring with your own AI.",
    getsTitle: "One reading. Seven layers of usable orientation.",
    gets: [
      ["01", "Subject + anchors", "The bounded subject and temporal anchors that define what is actually being read."],
      ["02", "Field portrait", "The current configuration of the field — what is active, compressed, open or changing."],
      ["03", "Dominant axes", "The relationships carrying the most structural weight, not a catalogue of every possible signal."],
      ["04", "Temporal movement", "Where the pattern is forming, intensifying, releasing or crossing into another phase."],
      ["05", "Cosmographer interpretation", "A joined reading of the field, with uncertainty kept visible instead of hidden behind certainty language."],
      ["06", "Focus + synthesis", "Your question when you have one — or the focus vector the Cosmographer discovers from the situation."],
      ["07", "AI continuation", "A public-safe reading/context packet for continuing the exploration in ChatGPT, Claude, Gemini or another capable AI."],
    ],
    entryTitle: "You can begin from where you actually are.",
    entryLead: "The application helps shape the focus. A polished question is not an admission requirement.",
    entryModes: [
      ["I KNOW MY QUESTION", "Bring the subject, the temporal horizon and the question you already want examined."],
      ["I KNOW THE SITUATION", "Describe what is happening and why this moment matters. The Cosmographer will define the focus vector."],
      ["I WANT THE READING", "Bring the subject and the relevant period even if you do not yet know what the central question is."],
    ],
    subjectLine: "PERSON · ORGANIZATION · PROJECT · EVENT",
    fieldLabel: "FIELD",
    timeLabel: "TIME",
    focusLabelShort: "FOCUS",
    synthesisLabel: "SYNTHESIS",
    contextTitle: "Your Frey context can enter the reading with you",
    contextValid: "The public, non-secret temporal context below came from the Frey reading that brought you here. It can seed the application without turning the reading into a fixed template.",
    contextMissing: "No Frey context was carried into this visit. That is fine — the application can start from the subject and the situation itself.",
    guideTitle: "Frey explains the instrument. The Cosmographer performs the reading.",
    guideLead: "The Frey Guide shows how the field is represented and how a Reading Packet can continue into another AI. You do not need to study the guide before applying.",
    humanTitle: "Request the USD 79 Cosmographic Reading",
    humanLead: "Start with the subject and why you are looking now. If the right question is not clear yet, say so — discovering the focus is part of the reading.",
    boundaryTitle: "A clear research boundary, without making the boundary the product",
    boundaryItems: ["Interpretive research, not a guaranteed outcome", "No open-ended consulting obligation", "No medical, legal or financial advice", "No credentials, secrets or unrelated private records"],
    processTitle: "From request to passport",
    process: "REQUEST → SUBJECT + HORIZON → FOCUS → READING → COSMOGRAPHIC PASSPORT",
    privacyTitle: "Trust layer",
    privacyLead: "Send only the context needed to understand the subject and the period. Sensitive material is not a sales requirement.",
    protectedLead: "Your Passport exposes the reading and its usable meaning. ORION internals, private prompts/planners/evaluators/corpora and unpublished mechanisms remain protected.",
    finalTitle: "Bring the subject. The Cosmographer will help find the question worth reading.",
    finalLead: "USD 79 · one complete Cosmographic Reading · delivered as your Cosmographic Passport.",
    mailTitle: "Cosmographic Reading · USD 79",
    subjectTypeLabel: "Subject type (person / organization / project / event / not sure)",
    subjectNameLabel: "Subject / name",
    situationLabel: "What is happening / why now",
    questionLabel: "Question or focus (optional)",
    contextLabel: "Context that matters",
    replyLabel: "Reply contact",
    languageLabel: "Language",
    primaryDateLabel: "Primary date / temporal anchor",
    secondaryDateLabel: "Optional second date",
    signalClassLabel: "Frey signal class",
    structuralStateLabel: "Frey structural state",
    vectorLabel: "Frey operational vector",
  },
  ru: {
    eyebrow: "FREY × КОСМОГРАФ · КОСМОГРАФИЧЕСКОЕ ЧТЕНИЕ",
    title: "Увидеть поле — прежде чем решать, какой вопрос задавать.",
    lead: "Полное Космографическое чтение одного объекта в одном значимом временном горизонте — с интерпретацией Космографа и результатом в виде переносимого Космографического паспорта.",
    signal: "ОДИН ОБЪЕКТ · ОДИН ВРЕМЕННОЙ ГОРИЗОНТ · КОСМОГРАФИЧЕСКИЙ ПАСПОРТ · USD 79",
    priceLabel: "ОДНО ПОЛНОЕ ЧТЕНИЕ",
    priceScope: "РЕЗУЛЬТАТ — КОСМОГРАФИЧЕСКИЙ ПАСПОРТ",
    primaryCta: "Начать чтение",
    backCta: "Открыть Frey →",
    guideCta: "Понять метод →",
    offerTitle: "Космографическое чтение",
    offerLead: "Не нужно заранее знать идеальный вопрос. Принесите человека, организацию, проект или событие — и ситуацию, из-за которой именно этот момент важен.",
    passportTitle: "Ваш Космографический паспорт",
    passportLead: "Чтение становится структурированным объектом, который можно сохранить, перечитать и дальше исследовать со своим AI.",
    getsTitle: "Одно чтение. Семь слоёв ориентации.",
    gets: [
      ["01", "Объект + якоря", "Ограниченный объект и временные якоря, которые точно определяют, что именно читается."],
      ["02", "Портрет поля", "Текущая конфигурация: что активно, сжато, открыто или уже меняется."],
      ["03", "Доминирующие оси", "Отношения с наибольшим структурным весом — не каталог всех возможных сигналов."],
      ["04", "Движение во времени", "Где структура формируется, усиливается, отпускает или переходит в другую фазу."],
      ["05", "Интерпретация Космографа", "Связанное чтение поля, где неопределённость остаётся видимой, а не маскируется языком уверенности."],
      ["06", "Фокус + синтез", "Ваш вопрос, если он уже есть, или focus vector, который Космограф обнаруживает в самой ситуации."],
      ["07", "Продолжение с AI", "Public-safe reading/context packet для дальнейшего исследования в ChatGPT, Claude, Gemini или другом способном AI."],
    ],
    entryTitle: "Начать можно из той точки, где вы действительно находитесь.",
    entryLead: "Заявка помогает сформировать фокус. Идеально сформулированный вопрос не является условием входа.",
    entryModes: [
      ["Я ЗНАЮ СВОЙ ВОПРОС", "Укажите объект, временной горизонт и вопрос, который уже хотите исследовать."],
      ["Я ЗНАЮ СИТУАЦИЮ", "Опишите, что происходит и почему момент важен. Космограф определит focus vector."],
      ["Я ХОЧУ ЧТЕНИЕ", "Укажите объект и значимый период, даже если главный вопрос пока ещё не сформировался."],
    ],
    subjectLine: "ЧЕЛОВЕК · ОРГАНИЗАЦИЯ · ПРОЕКТ · СОБЫТИЕ",
    fieldLabel: "ПОЛЕ",
    timeLabel: "ВРЕМЯ",
    focusLabelShort: "ФОКУС",
    synthesisLabel: "СИНТЕЗ",
    contextTitle: "Контекст Frey может войти в чтение вместе с вами",
    contextValid: "Публичный несекретный темпоральный контекст ниже пришёл из чтения Frey, которое привело вас сюда. Он может стать начальным слоем заявки, не превращая чтение в шаблон.",
    contextMissing: "Контекст Frey в этот переход не передан. Это нормально — заявка может начаться с самого объекта и ситуации.",
    guideTitle: "Frey объясняет инструмент. Космограф выполняет чтение.",
    guideLead: "Гайд Frey показывает, как представлено поле и как Reading Packet переносится в другой AI. Изучать гайд до заявки не требуется.",
    humanTitle: "Запросить Космографическое чтение за USD 79",
    humanLead: "Начните с объекта и причины, почему вы смотрите именно сейчас. Если правильный вопрос ещё не ясен — так и напишите: поиск фокуса входит в чтение.",
    boundaryTitle: "Ясная исследовательская граница — без превращения границы в сам продукт",
    boundaryItems: ["Исследовательская интерпретация, а не гарантированный исход", "Без обязательства бессрочного консультирования", "Без медицинских, юридических и финансовых рекомендаций", "Без credentials, secrets и не относящихся к чтению private records"],
    processTitle: "От заявки к паспорту",
    process: "ЗАЯВКА → ОБЪЕКТ + ГОРИЗОНТ → ФОКУС → ЧТЕНИЕ → КОСМОГРАФИЧЕСКИЙ ПАСПОРТ",
    privacyTitle: "Слой доверия",
    privacyLead: "Отправляйте только тот контекст, который нужен для понимания объекта и периода. Чувствительные данные не являются условием продажи.",
    protectedLead: "Паспорт раскрывает чтение и его применимый смысл. ORION internals, private prompts/planners/evaluators/corpora и unpublished mechanisms остаются защищёнными.",
    finalTitle: "Принесите объект. Космограф поможет найти вопрос, который действительно стоит читать.",
    finalLead: "USD 79 · одно полное Космографическое чтение · результат — ваш Космографический паспорт.",
    mailTitle: "Космографическое чтение · USD 79",
    subjectTypeLabel: "Тип объекта (человек / организация / проект / событие / не уверен)",
    subjectNameLabel: "Объект / название",
    situationLabel: "Что происходит / почему сейчас",
    questionLabel: "Вопрос или фокус (необязательно)",
    contextLabel: "Контекст, который действительно важен",
    replyLabel: "Контакт для ответа",
    languageLabel: "Язык",
    primaryDateLabel: "Основная дата / временной якорь",
    secondaryDateLabel: "Опциональная вторая дата",
    signalClassLabel: "Класс сигнала Frey",
    structuralStateLabel: "Структурное состояние Frey",
    vectorLabel: "Операционный вектор Frey",
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
    `${f.subjectTypeLabel}: `,
    `${f.subjectNameLabel}: `,
    `${f.primaryDateLabel}: ${freyContext?.primary_date || ""}`,
    `${f.secondaryDateLabel}: ${freyContext?.secondary_date || ""}`,
    `${f.situationLabel}: `,
    `${f.questionLabel}: `,
    `${f.contextLabel}: `,
    `${f.languageLabel}: ${locale.toUpperCase()}`,
    `${f.replyLabel}: `,
    "",
    freyContext?.signal_class ? `${f.signalClassLabel}: ${freyContext.signal_class}` : "",
    freyContext?.structural_state ? `${f.structuralStateLabel}: ${freyContext.structural_state}` : "",
    freyContext?.operational_vector ? `${f.vectorLabel}: ${freyContext.operational_vector}` : "",
  ].filter((line, index, arr) => line || index < 2 || index < arr.length - 3).join("\n");
  const freyMailto = `mailto:${REVENUE_EMAIL}?subject=${encodeURIComponent("[COSMOGRAPHIC READING · USD 79] ")}&body=${encodeURIComponent(freyMailBody)}`;
  const agentSubject = "[Φ RECON] <system_name>";
  const canonicalUrl = isFreyPersonal ? `https://www.bhrigu.io/access?lang=${locale}&offer=frey-personal` : `https://www.bhrigu.io/access?lang=${locale}`;
  const serviceJsonLd = isFreyPersonal ? {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Frey × Cosmographer · Cosmographic Reading",
    serviceType: "Cosmographic reading delivered as a Cosmographic Passport",
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
      description: "One complete Cosmographic Reading of one subject across one temporal horizon, delivered as a portable Cosmographic Passport with field portrait, dominant axes, temporal movement, Cosmographer interpretation, focus synthesis, and AI continuation packet.",
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
          data-bhrigu-commercial-service={isFreyPersonal ? "FREY_COSMOGRAPHIC_READING_PASSPORT_V0_1" : "PHI_EXTERNAL_SYSTEMS_RECON_V0_1"}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd).replace(/</g, "\\u003c") }}
        />
      </Head>
      <main className="q" lang={locale} data-access-surface={isFreyPersonal ? "FREY_COSMOGRAPHIC_READING_PASSPORT_V0_1" : "PHI_EXTERNAL_SYSTEMS_RECON_V0_1"}>
      {isFreyPersonal ? (
        <>
          <section className="freyHero" data-frey-personal-offer="FREY_COSMOGRAPHIC_READING_PASSPORT_USD79_V0_1">
            <div className="freyHeroCopy">
              <p className="ey">{f.eyebrow}</p>
              <h1>{f.title}</h1>
              <p className="lead">{f.lead}</p>
              <p className="signal">{f.signal}</p>
              <div className="freyHeroActions">
                <a className="primary" href="#cosmographic-application">{f.primaryCta}</a>
                <Link className="freyTextLink" href={`/guide/frey?lang=${locale}`}>{f.guideCta}</Link>
              </div>
            </div>

            <div className="fieldPlate" aria-label={f.passportTitle}>
              <div className="plateTopline"><span>COSMOGRAPHIC PASSPORT</span><span>v0.1</span></div>
              <div className="fieldOrbit" aria-hidden="true">
                <span className="orbit orbitA" />
                <span className="orbit orbitB" />
                <span className="orbit orbitC" />
                <span className="axis axisX" />
                <span className="axis axisY" />
                <span className="fieldCore">Φ</span>
                <span className="fieldNode nodeA" />
                <span className="fieldNode nodeB" />
                <span className="fieldNode nodeC" />
                <span className="fieldWord fieldWordA">{f.fieldLabel}</span>
                <span className="fieldWord fieldWordB">{f.timeLabel}</span>
                <span className="fieldWord fieldWordC">{f.focusLabelShort}</span>
                <span className="fieldWord fieldWordD">{f.synthesisLabel}</span>
              </div>
              <div className="passportPrice">
                <span>{f.priceLabel}</span>
                <strong>USD 79</strong>
                <small>{f.priceScope}</small>
              </div>
            </div>
          </section>

          <section className="passportBand">
            <div>
              <p className="ey">01 · SUBJECT</p>
              <h2>{f.offerTitle}</h2>
              <p>{f.offerLead}</p>
            </div>
            <div className="subjectRail"><span>{f.subjectLine}</span><i /></div>
          </section>

          <section className="passportSpecimen">
            <div className="passportIntro">
              <p className="ey">02 · PASSPORT</p>
              <h2>{f.passportTitle}</h2>
              <p>{f.passportLead}</p>
              <div className="passportMark"><span>FREY</span><b>×</b><span>COSMOGRAPHER</span></div>
            </div>
            <div className="passportLayers" aria-label={f.getsTitle}>
              <p className="layersTitle">{f.getsTitle}</p>
              {f.gets.map(([n, title, body]) => (
                <article className="passportLayer" key={n}>
                  <b>{n}</b>
                  <div><h3>{title}</h3><p>{body}</p></div>
                </article>
              ))}
            </div>
          </section>

          <section className="entryScene" id="cosmographic-application">
            <div className="entryHeading">
              <p className="ey">03 · APPLICATION</p>
              <h2>{f.entryTitle}</h2>
              <p>{f.entryLead}</p>
            </div>
            <div className="entryModes">
              {f.entryModes.map(([title, body], index) => (
                <article key={title} className="entryMode">
                  <b>0{index + 1}</b><h3>{title}</h3><p>{body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="freyContextScene" data-frey-personal-context={freyContext ? "valid" : "missing-or-invalid"}>
            <div>
              <p className="ey">04 · FREY CONTEXT</p>
              <h2>{f.contextTitle}</h2>
              <p>{freyContext ? f.contextValid : f.contextMissing}</p>
            </div>
            {freyContext ? (
              <div className="contextGrid">
                <article><b>{f.primaryDateLabel}</b><p>{freyContext.primary_date || "—"}</p></article>
                <article><b>{f.secondaryDateLabel}</b><p>{freyContext.secondary_date || "—"}</p></article>
                <article><b>{f.structuralStateLabel}</b><p>{freyContext.structural_state || "—"}</p></article>
                <article><b>{f.vectorLabel}</b><p>{freyContext.operational_vector || "—"}</p></article>
              </div>
            ) : <div className="contextEmpty"><span>SUBJECT</span><i /><span>TIME</span><i /><span>FOCUS</span></div>}
          </section>

          <section className="guideBridge">
            <div>
              <p className="ey">05 · METHOD / CONTINUATION</p>
              <h2>{f.guideTitle}</h2>
              <p>{f.guideLead}</p>
            </div>
            <div className="guideLinks">
              <Link className="primary" href={`/guide/frey?lang=${locale}`}>{f.guideCta}</Link>
              <Link className="freyTextLink" href={`/frey?lang=${locale}`}>{f.backCta}</Link>
            </div>
          </section>

          <section className="applicationScene">
            <div className="applicationCopy">
              <p className="ey">06 · REQUEST</p>
              <h2>{f.humanTitle}</h2>
              <p>{f.humanLead}</p>
              <a className="primary inline" href={freyMailto}>{f.primaryCta}</a>
            </div>
            <div className="requestSheet" aria-label={f.humanTitle}>
              <div className="requestSheetTop"><span>APPLICATION</span><span>USD 79</span></div>
              {[f.subjectTypeLabel, f.subjectNameLabel, f.primaryDateLabel, f.situationLabel, f.questionLabel].map((label) => (
                <div className="requestField" key={label}><span>{label}</span><i /></div>
              ))}
            </div>
          </section>

          <section className="trustLayer">
            <div>
              <p className="ey">07 · TRUST</p>
              <h2>{f.boundaryTitle}</h2>
              <ul>{f.boundaryItems.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div>
              <p className="ey">08 · PRIVACY / IP</p>
              <h2>{f.privacyTitle}</h2>
              <p>{f.privacyLead}</p><p>{f.protectedLead}</p>
            </div>
          </section>

          <section className="processScene">
            <p className="ey">09 · PATH</p>
            <h2>{f.processTitle}</h2>
            <p className="flow">{f.process}</p>
          </section>

          <section className="finalCta freyFinal">
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
        .fit,.contractGrid,.human{display:grid;grid-template-columns:1fr 1fr;gap:24px}.fit>div{min-width:0;padding:4px 12px}.fit>div+div{border-left:1px solid rgba(255,255,255,.08);padding-left:28px}.fit h2,.fit p,.fit li,.privacy p{overflow-wrap:anywhere;word-break:break-word}ul{padding-left:20px;color:rgba(255,255,255,.67);line-height:1.65}
        .proofs{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.proofs a,.support a{color:#e1c77d;text-underline-offset:3px}
        .contract{scroll-margin-top:80px}.top{margin-top:22px!important}code{color:rgba(98,201,230,.9);overflow-wrap:anywhere}pre{margin:12px 0 0;padding:16px;overflow:auto;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(0,0,0,.22);color:rgba(235,239,244,.78);font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;word-break:break-word}
        .flow{color:rgba(255,255,255,.88);font:600 13px/1.8 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em}.support{border-color:rgba(213,184,109,.15)}
        .finalCta{display:grid;grid-template-columns:1fr auto;gap:30px;align-items:center;margin-top:18px;padding:34px;border:1px solid rgba(213,184,109,.18);border-radius:20px;background:linear-gradient(120deg,rgba(213,184,109,.055),rgba(98,201,230,.025))}.finalCta .primary{min-width:190px;margin:0}
        .freyHero{position:relative;display:grid;grid-template-columns:minmax(0,1.04fr) minmax(360px,.96fr);min-height:610px;border:1px solid rgba(213,184,109,.18);border-radius:28px;overflow:hidden;background:radial-gradient(circle at 12% 18%,rgba(213,184,109,.10),transparent 34%),radial-gradient(circle at 86% 32%,rgba(98,201,230,.09),transparent 30%),linear-gradient(145deg,rgba(11,14,24,.98),rgba(5,8,15,.96))}
        .freyHero::after{content:"";position:absolute;inset:auto 0 0 0;height:1px;background:linear-gradient(90deg,transparent,rgba(213,184,109,.52),rgba(98,201,230,.3),transparent)}
        .freyHeroCopy{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center;padding:66px 56px 58px}.freyHeroCopy h1{max-width:650px;font-size:clamp(44px,5.2vw,70px)}.freyHeroCopy .lead{max-width:640px;font-size:18px}.freyHeroActions{display:flex;align-items:center;gap:20px;margin-top:26px}.freyHeroActions .primary{min-width:176px;margin:0}.freyTextLink{color:rgba(247,248,250,.76);text-decoration-color:rgba(213,184,109,.35);text-underline-offset:5px;font-size:13px}
        .fieldPlate{position:relative;display:flex;min-height:610px;flex-direction:column;justify-content:space-between;padding:32px 32px 30px;border-left:1px solid rgba(213,184,109,.15);background:linear-gradient(180deg,rgba(255,255,255,.018),rgba(0,0,0,.15));overflow:hidden}.plateTopline,.requestSheetTop{display:flex;justify-content:space-between;color:rgba(213,184,109,.72);font:600 10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em}.fieldOrbit{position:relative;width:min(340px,88%);aspect-ratio:1;margin:4px auto 12px}.orbit,.axis,.fieldNode,.fieldCore,.fieldWord{position:absolute}.orbit{inset:50%;border:1px solid rgba(213,184,109,.18);border-radius:50%;transform:translate(-50%,-50%)}.orbitA{width:88%;height:88%}.orbitB{width:62%;height:62%;border-color:rgba(98,201,230,.2)}.orbitC{width:35%;height:35%;border-color:rgba(213,184,109,.34)}.axis{background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)}.axisX{left:4%;right:4%;top:50%;height:1px}.axisY{top:4%;bottom:4%;left:50%;width:1px;background:linear-gradient(180deg,transparent,rgba(255,255,255,.12),transparent)}.fieldCore{left:50%;top:50%;transform:translate(-50%,-50%);display:grid;place-items:center;width:54px;height:54px;border:1px solid rgba(213,184,109,.55);border-radius:50%;background:rgba(5,8,15,.9);color:#e4cb84;font:400 26px/1 Georgia,serif;box-shadow:0 0 48px rgba(213,184,109,.10)}.fieldNode{width:8px;height:8px;border-radius:50%;background:#d5b86d;box-shadow:0 0 18px rgba(213,184,109,.45)}.nodeA{left:19%;top:35%}.nodeB{right:15%;top:54%;background:#62c9e6;box-shadow:0 0 18px rgba(98,201,230,.4)}.nodeC{left:44%;bottom:9%}.fieldWord{color:rgba(255,255,255,.46);font:600 9px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em}.fieldWordA{left:5%;top:48%}.fieldWordB{right:3%;top:23%}.fieldWordC{right:5%;bottom:19%}.fieldWordD{left:7%;bottom:15%}.passportPrice{display:grid;gap:5px;padding-top:20px;border-top:1px solid rgba(255,255,255,.08)}.passportPrice span,.passportPrice small{color:rgba(255,255,255,.48);font:600 9px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.11em}.passportPrice strong{color:#fff;font:500 42px/1 Georgia,serif}
        .passportBand,.passportSpecimen,.entryScene,.freyContextScene,.guideBridge,.applicationScene,.trustLayer,.processScene{margin-top:18px;border:1px solid rgba(255,255,255,.08);border-radius:22px;background:rgba(255,255,255,.01)}
        .passportBand{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(300px,.95fr);gap:40px;align-items:center;padding:38px}.passportBand h2{font-size:clamp(34px,4vw,50px)}.subjectRail{display:grid;gap:18px;padding:24px 0}.subjectRail span{color:rgba(247,248,250,.72);font:600 11px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em}.subjectRail i{display:block;height:1px;background:linear-gradient(90deg,rgba(213,184,109,.72),rgba(98,201,230,.36),transparent)}
        .passportSpecimen{display:grid;grid-template-columns:minmax(280px,.72fr) minmax(0,1.28fr);overflow:hidden}.passportIntro{display:flex;flex-direction:column;justify-content:center;padding:44px;border-right:1px solid rgba(213,184,109,.12);background:radial-gradient(circle at 10% 10%,rgba(213,184,109,.08),transparent 48%)}.passportMark{display:flex;align-items:center;gap:11px;margin-top:32px;color:rgba(255,255,255,.42);font:600 10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em}.passportMark b{color:var(--gold);font-size:17px}.passportLayers{padding:26px 34px 30px}.layersTitle{margin:0 0 10px;color:rgba(255,255,255,.52);font-size:13px}.passportLayer{display:grid;grid-template-columns:44px 1fr;gap:15px;align-items:start;padding:15px 0;border:0;border-bottom:1px solid rgba(255,255,255,.065);border-radius:0;background:none}.passportLayer:last-child{border-bottom:0}.passportLayer b{padding-top:3px;color:rgba(98,201,230,.82)}.passportLayer h3{margin:0 0 4px;font:500 17px/1.25 Georgia,serif}.passportLayer p{margin:0;font-size:13px;line-height:1.52}
        .entryScene{padding:42px}.entryHeading{max-width:720px}.entryModes{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:26px}.entryMode{position:relative;min-height:190px;padding:24px 22px;border-color:rgba(213,184,109,.12);background:linear-gradient(145deg,rgba(213,184,109,.035),rgba(98,201,230,.018))}.entryMode b{color:rgba(213,184,109,.58)}.entryMode h3{margin-top:26px;font:500 19px/1.25 Georgia,serif}.entryMode p{font-size:13px}.entryMode::after{content:"";position:absolute;left:22px;right:22px;bottom:18px;height:1px;background:linear-gradient(90deg,rgba(213,184,109,.42),transparent)}
        .freyContextScene{display:grid;grid-template-columns:minmax(0,1fr) minmax(340px,.92fr);gap:34px;align-items:center;padding:38px}.freyContextScene .contextGrid{grid-template-columns:repeat(2,1fr)}.contextEmpty{display:grid;grid-template-columns:auto 1fr auto 1fr auto;align-items:center;gap:9px;color:rgba(255,255,255,.42);font:600 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em}.contextEmpty i{height:1px;background:rgba(213,184,109,.22)}
        .guideBridge{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:34px;align-items:center;padding:42px;background:linear-gradient(120deg,rgba(98,201,230,.035),rgba(213,184,109,.028))}.guideBridge>div:first-child{max-width:730px}.guideLinks{display:grid;gap:10px;min-width:210px}.guideLinks .primary{margin:0}.guideLinks .freyTextLink{text-align:center}
        .applicationScene{display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,.88fr);overflow:hidden}.applicationCopy{display:flex;flex-direction:column;justify-content:center;padding:46px}.requestSheet{padding:30px 32px;border-left:1px solid rgba(213,184,109,.12);background:rgba(0,0,0,.12)}.requestSheetTop{margin-bottom:20px}.requestField{padding:14px 0;border-bottom:1px solid rgba(255,255,255,.07)}.requestField span{display:block;color:rgba(255,255,255,.54);font-size:11px;line-height:1.45}.requestField i{display:block;width:72%;height:1px;margin-top:13px;background:linear-gradient(90deg,rgba(213,184,109,.34),transparent)}
        .trustLayer{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;overflow:hidden}.trustLayer>div{min-width:0;padding:36px}.trustLayer>div+div{border-left:1px solid rgba(255,255,255,.07)}.trustLayer h2{font-size:clamp(25px,3vw,34px)}.trustLayer h2,.trustLayer p,.trustLayer li{overflow-wrap:anywhere;word-break:break-word}.trustLayer li,.trustLayer p{font-size:13px}.processScene{padding:38px}.processScene h2{font-size:clamp(30px,3.5vw,42px)}.freyFinal{margin-top:18px;border-radius:22px;background:radial-gradient(circle at 12% 40%,rgba(213,184,109,.08),transparent 34%),linear-gradient(120deg,rgba(213,184,109,.04),rgba(98,201,230,.025))}
        @media(max-width:860px){.hero,.offer,.fit,.contractGrid,.human,.finalCta,.freyHero,.passportSpecimen,.freyContextScene,.guideBridge,.applicationScene,.trustLayer{grid-template-columns:1fr}.passportBand{grid-template-columns:minmax(0,1fr)}.passportBand>div,.subjectRail{min-width:0}.subjectRail span{overflow-wrap:anywhere;word-break:break-word}.five,.contextGrid{grid-template-columns:repeat(2,1fr)}.action{border-left:0;border-top:1px solid rgba(213,184,109,.16)}.fieldPlate,.requestSheet{border-left:0;border-top:1px solid rgba(213,184,109,.14)}.passportIntro{border-right:0;border-bottom:1px solid rgba(213,184,109,.12)}.entryModes{grid-template-columns:1fr}.trustLayer>div+div{border-left:0;border-top:1px solid rgba(255,255,255,.07)}.systemHero{min-height:0}.systemMeaning{padding:52px 42px 46px}.systemAction{padding:38px 42px}.evidenceMotif{margin-top:38px}.four{grid-template-columns:repeat(2,1fr)}.fit>div+div{border-left:0;border-top:1px solid rgba(255,255,255,.08);padding:22px 12px 4px}.finalCta .primary{width:100%}}
        @media(max-width:560px){.q{padding:28px 12px 90px}.passportBand h2{font-size:28px}.freyHeroCopy{padding:36px 24px 28px}.freyHeroCopy h1{font-size:clamp(38px,11vw,48px)}.freyHeroCopy .lead{font-size:15px}.freyHeroActions{align-items:stretch;flex-direction:column;gap:13px}.freyHeroActions .primary{width:100%}.freyHeroActions .freyTextLink{text-align:center}.fieldPlate{min-height:440px;padding:24px}.fieldOrbit{width:min(300px,86%)}.passportBand,.entryScene,.freyContextScene,.guideBridge,.processScene{padding:28px 22px}.passportIntro,.applicationCopy{padding:30px 22px}.passportLayers,.requestSheet{padding:24px 22px}.entryMode{min-height:0}.subjectRail{padding:5px 0}.guideLinks{min-width:0;width:100%}.trustLayer>div{padding:28px 22px}.passportPrice strong{font-size:38px}.meaning,.action{padding:30px 22px}.systemMeaning{padding:22px 26px 12px}.systemAction{padding:12px 26px 22px}.systemMeaning .ey{margin-bottom:8px}.systemMeaning h1{margin-bottom:14px;font-size:clamp(36px,10.5vw,42px)}.systemMeaning .lead{font-size:15px;line-height:1.38}.evidenceMotif{width:min(280px,88%);margin-top:10px}.motifLabel{margin-top:3px;font-size:9px;letter-spacing:.1em}.systemAction .mini{margin-bottom:2px}.systemAction .primary{margin-top:2px}.directEmail{margin-top:8px}.block,.finalCta{padding:24px 20px}.four,.five,.proofs,.contextGrid{grid-template-columns:1fr}.action{gap:6px}.price{font-size:48px}.primary,.secondary{width:100%;box-sizing:border-box}.inline{width:100%}.signal{font-size:11px}}
      `}</style>
      </main>
    </>
  );
}
