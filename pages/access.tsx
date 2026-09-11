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
    title: "Find the three highest-impact failures in your AI or research system — with evidence and an exact repair blueprint.",
    lead: "Bounded, read-only systems recon for AI agents, MCP, RAG, knowledge systems, conversational AI, research products, and Bitcoin / crypto systems.",
    noMutation: "No development or production mutation is included.",
    firstLine: "ONE BOUNDED SYSTEM · 3 FINDINGS · EVIDENCE-LINKED · USD 300",
    priceLabel: "FIXED BASE OBJECT",
    priceScope: "ONE BOUNDED SYSTEM",
    implementation: "NO IMPLEMENTATION",
    primaryCta: "Start the recon",
    agentCta: "Agent entry contract ↓",
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
    title: "Найдём три наиболее значимых дефекта вашей AI- или исследовательской системы — с доказательствами и точным планом исправления.",
    lead: "Ограниченная read-only разведка AI-агентов, MCP, RAG, knowledge-систем, conversational AI, исследовательских продуктов и Bitcoin / crypto систем.",
    noMutation: "Разработка и изменение production не входят в работу.",
    firstLine: "ОДНА СИСТЕМА · 3 ВЫВОДА · EVIDENCE-LINKED · USD 300",
    priceLabel: "ФИКСИРОВАННЫЙ БАЗОВЫЙ ОБЪЕКТ",
    priceScope: "ОДНА ОГРАНИЧЕННАЯ СИСТЕМА",
    implementation: "NO IMPLEMENTATION",
    primaryCta: "Начать разведку",
    agentCta: "Контракт для AI-агента ↓",
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
  return { props: { locale: query.lang === "ru" ? "ru" : "en" } };
}

export default function Access({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const mailto = `mailto:${REVENUE_EMAIL}?subject=${encodeURIComponent("[Φ RECON] ")}&body=${encodeURIComponent(c.humanBody)}`;
  const agentSubject = "[Φ RECON] <system_name>";
  const canonicalUrl = `https://www.bhrigu.io/access?lang=${locale}`;
  const serviceJsonLd = {
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
        <script type="application/ld+json" data-bhrigu-commercial-service="PHI_EXTERNAL_SYSTEMS_RECON_V0_1" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd).replace(/</g, "\\u003c") }} />
      </Head>
      <main className="q" lang={locale} data-access-surface="PHI_EXTERNAL_SYSTEMS_RECON_V0_1">
      <section className="hero">
        <div className="meaning">
          <p className="ey">{c.eyebrow}</p>
          <h1>{c.title}</h1>
          <p className="lead">{c.lead}</p>
          <p className="boundary">{c.noMutation}</p>
          <p className="signal">{c.firstLine}</p>
        </div>
        <aside className="action" aria-label={c.offerTitle}>
          <p className="mini">{c.priceLabel}</p>
          <strong className="price">USD 300</strong>
          <span>{c.priceScope}</span>
          <span>READ-ONLY</span>
          <span>{c.implementation}</span>
          <a className="primary" href={mailto}>{c.primaryCta}</a>
          <a className="secondary" href="#agent-entry">{c.agentCta}</a>
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

      <style jsx>{`
        .q{--gold:#d5b86d;--cyan:#62c9e6;max-width:1080px;margin:auto;padding:54px 20px 120px;color:rgba(247,248,250,.94)}
        .hero{display:grid;grid-template-columns:minmax(0,61.803fr) minmax(280px,38.197fr);border:1px solid rgba(213,184,109,.16);border-radius:24px;overflow:hidden;background:radial-gradient(circle at 10% 8%,rgba(213,184,109,.08),transparent 34%),radial-gradient(circle at 100% 20%,rgba(98,201,230,.06),transparent 28%),rgba(255,255,255,.012)}
        .meaning{padding:48px 44px}.action{display:flex;flex-direction:column;gap:10px;padding:42px 34px;border-left:1px solid rgba(213,184,109,.16);background:rgba(0,0,0,.14)}
        .ey,.mini{margin:0 0 12px;color:var(--gold);font-size:11px;letter-spacing:.15em;text-transform:uppercase}.mini{color:rgba(213,184,109,.72)}
        h1{margin:0 0 20px;font:400 clamp(38px,5.4vw,66px)/.99 Georgia,serif;letter-spacing:-.035em}h2{margin:0 0 14px;font:500 clamp(28px,3.5vw,42px)/1.08 Georgia,serif}h3{margin:8px 0 8px;font-size:16px}
        p{color:rgba(255,255,255,.68);line-height:1.65}.lead{max-width:720px;font-size:17px}.boundary{padding-left:16px;border-left:1px solid rgba(213,184,109,.4)}.signal{margin-top:26px;color:rgba(255,255,255,.88);font:600 12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em}
        .price{font:500 clamp(42px,5vw,64px)/1 Georgia,serif;color:#fff}.action span{color:rgba(255,255,255,.62);font:600 11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em}
        .primary,.secondary{display:inline-flex;justify-content:center;align-items:center;min-height:46px;margin-top:10px;padding:0 18px;border-radius:999px;text-decoration:none}.primary{background:var(--gold);color:#111!important;font-weight:700}.secondary{border:1px solid rgba(255,255,255,.16);color:rgba(255,255,255,.82)!important}.inline{width:max-content}
        .block{margin-top:18px;padding:32px;border:1px solid rgba(255,255,255,.085);border-radius:20px;background:rgba(255,255,255,.01)}.offer{display:grid;grid-template-columns:1fr 1fr;gap:36px}.scopeLaw{margin:0;padding-left:18px;border-left:1px solid rgba(98,201,230,.28)}
        .grid{display:grid;gap:12px}.four{grid-template-columns:repeat(4,1fr)}article{min-width:0;padding:18px;border:1px solid rgba(255,255,255,.075);border-radius:15px;background:rgba(255,255,255,.012)}article b{color:var(--cyan);font:600 11px ui-monospace,SFMono-Regular,Menlo,monospace}article p{margin-bottom:0;font-size:14px}
        .fit,.contractGrid,.human{display:grid;grid-template-columns:1fr 1fr;gap:24px}.fit>div{padding:4px 12px}.fit>div+div{border-left:1px solid rgba(255,255,255,.08);padding-left:28px}ul{padding-left:20px;color:rgba(255,255,255,.67);line-height:1.65}
        .proofs{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.proofs a,.support a{color:#e1c77d;text-underline-offset:3px}
        .contract{scroll-margin-top:80px}.top{margin-top:22px!important}code{color:rgba(98,201,230,.9);overflow-wrap:anywhere}pre{margin:12px 0 0;padding:16px;overflow:auto;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(0,0,0,.22);color:rgba(235,239,244,.78);font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;word-break:break-word}
        .flow{color:rgba(255,255,255,.88);font:600 13px/1.8 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em}.support{border-color:rgba(213,184,109,.15)}
        .finalCta{display:grid;grid-template-columns:1fr auto;gap:30px;align-items:center;margin-top:18px;padding:34px;border:1px solid rgba(213,184,109,.18);border-radius:20px;background:linear-gradient(120deg,rgba(213,184,109,.055),rgba(98,201,230,.025))}.finalCta .primary{min-width:190px;margin:0}
        @media(max-width:860px){.hero,.offer,.fit,.contractGrid,.human,.finalCta{grid-template-columns:1fr}.action{border-left:0;border-top:1px solid rgba(213,184,109,.16)}.four{grid-template-columns:repeat(2,1fr)}.fit>div+div{border-left:0;border-top:1px solid rgba(255,255,255,.08);padding:22px 12px 4px}.finalCta .primary{width:100%}}
        @media(max-width:560px){.q{padding:28px 12px 90px}.meaning,.action{padding:30px 22px}.block,.finalCta{padding:24px 20px}.four,.proofs{grid-template-columns:1fr}.action{gap:8px}.price{font-size:50px}.primary,.secondary{width:100%;box-sizing:border-box}.inline{width:100%}.signal{font-size:11px}}
      `}</style>
      </main>
    </>
  );
}
