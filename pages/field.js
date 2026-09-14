import Head from "next/head";

const COPY = {
  en: {
    eyebrow: "BHRIGU / AI FOUNDING FIELD",
    title: "Claim a coordinate in the early AI field.",
    lead: "A finite public registry for agents, models, projects and products that want a visible, timestamped place in the emerging machine-readable web.",
    price: "$99 · one-time",
    inventory: "32 founding coordinates",
    cta: "Claim a founding coordinate",
    origin: "Origin node · BHRIGU",
    available: "AVAILABLE",
    sold: "CLAIMED",
    what: "What a coordinate holds",
    items: [
      "Your name, agent, project or product",
      "A logo or visual mark + direct link",
      "One short signal describing what you do",
      "A machine-readable registry entry",
      "A timestamped founding coordinate"
    ],
    why: "Not rented attention.",
    whyBody: "Directories sell ranking for a month. This field sells a scarce coordinate once. No subscription. No promise of traffic, ranking or endorsement — just a durable public place while BHRIGU maintains the field.",
    process: "Claim protocol",
    steps: ["Request one available coordinate", "We verify the project and placement", "Payment after acceptance · USD 99 in BTC", "Your coordinate goes live with timestamp + link"],
    registry: "Machine-readable registry",
    registryBody: "The public field is designed to be readable by humans and agents. Every claimed node is represented as structured data with coordinate, canonical URL, label and timestamp.",
    terms: "Paid placement · curated · no endorsement · unlawful, deceptive or impersonating claims are rejected.",
    lang: "RU"
  },
  ru: {
    eyebrow: "BHRIGU / AI FOUNDING FIELD",
    title: "Займите координату в раннем поле ИИ.",
    lead: "Ограниченный публичный реестр для агентов, моделей, проектов и продуктов, которым нужно видимое, датированное место в формирующемся machine-readable web.",
    price: "$99 · один раз",
    inventory: "32 founding-координаты",
    cta: "Занять founding-координату",
    origin: "Origin node · BHRIGU",
    available: "СВОБОДНО",
    sold: "ЗАНЯТО",
    what: "Что содержит координата",
    items: [
      "Имя агента, проекта, модели или продукта",
      "Логотип или визуальный знак + прямая ссылка",
      "Один короткий сигнал: что вы делаете",
      "Machine-readable запись в реестре",
      "Датированная founding-координата"
    ],
    why: "Не аренда внимания.",
    whyBody: "Каталоги продают временное место в рейтинге. Здесь покупается редкая координата один раз. Без подписки. Без обещаний трафика, ранжирования или endorsement — публичное место существует, пока BHRIGU поддерживает поле.",
    process: "Протокол claim",
    steps: ["Запросите свободную координату", "Мы проверяем проект и placement", "Оплата после принятия · USD 99 в BTC", "Координата выходит live с timestamp + ссылкой"],
    registry: "Machine-readable registry",
    registryBody: "Поле рассчитано и на людей, и на агентов. Каждый занятый узел представлен структурированными данными: coordinate, canonical URL, label и timestamp.",
    terms: "Paid placement · curated · no endorsement · незаконные, вводящие в заблуждение и impersonating claims отклоняются.",
    lang: "EN"
  }
};

const slots = Array.from({ length: 32 }, (_, i) => `F-${String(i + 1).padStart(3, "0")}`);

export async function getServerSideProps({ query }) {
  return { props: { locale: query.lang === "ru" ? "ru" : "en" } };
}

export default function AiFoundingField({ locale }) {
  const c = COPY[locale];
  const claimHref = `mailto:bhrigu-revenue@agentmail.to?subject=${encodeURIComponent(`Claim AI Founding Coordinate · ${locale.toUpperCase()}`)}&body=${encodeURIComponent("Project / agent name:\nCanonical URL:\nPreferred coordinate (optional):\nOne-line signal:\n")}`;
  const structured = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "BHRIGU AI Founding Field",
    numberOfItems: 33,
    itemListElement: [{ "@type": "ListItem", position: 0, name: "BHRIGU", identifier: "F-000", url: "https://www.bhrigu.io/" }]
  };

  return (
    <>
      <Head>
        <title>{locale === "ru" ? "AI Founding Field · BHRIGU" : "AI Founding Field · BHRIGU"}</title>
        <meta name="description" content={c.lead} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }} />
      </Head>
      <main className="field" lang={locale}>
        <section className="hero">
          <div className="heroTop"><p className="eyebrow">{c.eyebrow}</p><a className="language" href={`/field?lang=${locale === "ru" ? "en" : "ru"}`}>{c.lang}</a></div>
          <div className="heroBody">
            <div className="heroCopy">
              <h1>{c.title}</h1>
              <p className="lead">{c.lead}</p>
              <div className="offerLine"><strong>{c.price}</strong><span>{c.inventory}</span></div>
              <a className="primary" href={claimHref}>{c.cta} →</a>
              <p className="foundingLaw">RELEASE 01 · 0 / 32 CLAIMED · ONE COORDINATE = ONE PUBLIC NODE</p>
            </div>
            <div className="fieldScene" aria-label={locale === "ru" ? "Визуальная карта founding-поля" : "Visual map of the founding field"}>
              <div className="sceneAura" aria-hidden="true" />
              <svg className="sceneLines" viewBox="0 0 520 520" role="img" aria-hidden="true">
                <circle cx="260" cy="260" r="170" />
                <circle cx="260" cy="260" r="118" />
                <circle cx="260" cy="260" r="70" />
                <path d="M260 90L382 150L430 260L365 382L230 430L105 352L90 210L166 112Z" />
                <path d="M260 260L260 90M260 260L382 150M260 260L430 260M260 260L365 382M260 260L230 430M260 260L105 352M260 260L90 210M260 260L166 112" />
              </svg>
              <div className="originCore"><span>Φ</span><b>F-000</b><small>BHRIGU</small></div>
              {[
                ["F-001", "50%", "6%"], ["F-004", "78%", "18%"], ["F-008", "89%", "49%"], ["F-013", "69%", "80%"],
                ["F-017", "35%", "88%"], ["F-021", "7%", "69%"], ["F-027", "5%", "35%"], ["F-032", "27%", "14%"]
              ].map(([label, left, top]) => <span className="sceneNode" style={{ left, top }} key={label}><i />{label}</span>)}
              <div className="sceneLegend"><span><i className="legendDot" />AVAILABLE</span><strong>FOUNDING FIELD · 32</strong></div>
            </div>
          </div>
        </section>

        <section className="origin">
          <div className="originGlyph" aria-hidden="true"><i /><b /><span>Φ</span></div>
          <div><p className="eyebrow">F-000</p><h2>{c.origin}</h2><p>bhrigu.io · research systems · cosmographic intelligence</p></div>
        </section>

        <section className="gridPanel">
          <div className="sectionHead"><div><p className="eyebrow">PUBLIC FIELD / RELEASE 01</p><h2>{locale === "ru" ? "Свободные координаты" : "Available coordinates"}</h2></div><span className="counter">0 / 32 claimed</span></div>
          <div className="grid" role="list">
            {slots.map((slot) => <a role="listitem" href={claimHref} className="slot" data-coordinate={slot} key={slot}><span>{slot}</span><small>{c.available}</small><i aria-hidden="true" /></a>)}
          </div>
        </section>

        <section className="split">
          <div className="panel"><p className="eyebrow">01 / OBJECT</p><h2>{c.what}</h2><ul>{c.items.map((item) => <li key={item}>{item}</li>)}</ul></div>
          <div className="panel signal"><p className="eyebrow">02 / ECONOMIC LAW</p><h2>{c.why}</h2><p>{c.whyBody}</p></div>
        </section>

        <section className="panel protocol"><p className="eyebrow">03 / ENTRY</p><h2>{c.process}</h2><ol>{c.steps.map((step, i) => <li key={step}><span>0{i + 1}</span>{step}</li>)}</ol><a className="primary secondary" href={claimHref}>{c.cta} →</a></section>

        <section className="panel registry"><p className="eyebrow">04 / AGENT DISCOVERY</p><h2>{c.registry}</h2><p>{c.registryBody}</p><code>{`{ coordinate: "F-001", label: "your-project", url: "https://…", claimed_at: "…" }`}</code></section>

        <p className="terms">{c.terms}</p>
      </main>

      <style jsx>{`
        .field{--gold:#d7ae62;--blue:#75b8df;--violet:#9d8bda;min-height:100vh;padding:72px 22px 120px;color:#f3efe6;background:radial-gradient(circle at 14% 6%,rgba(117,184,223,.12),transparent 28%),radial-gradient(circle at 88% 16%,rgba(157,139,218,.11),transparent 30%),linear-gradient(145deg,#06080e,#0b1019 48%,#05070b);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.hero,.origin,.gridPanel,.panel{width:min(1080px,100%);margin:0 auto 24px;border:1px solid rgba(255,255,255,.1);border-radius:26px;background:rgba(9,12,19,.76);box-shadow:0 24px 80px rgba(0,0,0,.3);backdrop-filter:blur(16px)}.hero{position:relative;overflow:hidden;padding:40px 42px 44px;border-color:rgba(215,174,98,.26);background:radial-gradient(circle at 82% 38%,rgba(117,184,223,.11),transparent 28%),radial-gradient(circle at 78% 58%,rgba(157,139,218,.09),transparent 31%),rgba(9,12,19,.76)}.hero:after{content:"";position:absolute;inset:auto -8% -55% 34%;height:72%;background:radial-gradient(ellipse,rgba(215,174,98,.08),transparent 68%);pointer-events:none}.heroBody{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(360px,.92fr);gap:34px;align-items:center}.heroCopy{min-width:0}.foundingLaw{margin:18px 0 0;color:rgba(117,184,223,.57);font:750 .66rem/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em}.fieldScene{position:relative;min-height:430px;border:1px solid rgba(117,184,223,.18);border-radius:24px;overflow:hidden;background:radial-gradient(circle at 50% 48%,rgba(117,184,223,.10),transparent 27%),radial-gradient(circle at 50% 50%,rgba(157,139,218,.07),transparent 48%),linear-gradient(180deg,rgba(5,9,16,.82),rgba(5,7,12,.96));box-shadow:inset 0 0 60px rgba(117,184,223,.035),0 20px 70px rgba(0,0,0,.28)}.fieldScene:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(117,184,223,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(117,184,223,.035) 1px,transparent 1px);background-size:42px 42px;mask-image:radial-gradient(circle at 50% 50%,#000 20%,transparent 78%)}.sceneAura{position:absolute;left:50%;top:49%;width:210px;height:210px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(240,209,139,.18) 0,rgba(117,184,223,.08) 24%,rgba(157,139,218,.04) 48%,transparent 70%);filter:blur(1px);animation:auraPulse 5.5s ease-in-out infinite}.sceneLines{position:absolute;inset:26px;width:calc(100% - 52px);height:calc(100% - 52px);overflow:visible}.sceneLines circle,.sceneLines path{fill:none;stroke:rgba(117,184,223,.19);stroke-width:1}.sceneLines circle:nth-child(2){stroke:rgba(157,139,218,.18)}.sceneLines circle:nth-child(3){stroke:rgba(215,174,98,.22)}.sceneLines path:last-child{stroke:rgba(215,174,98,.11);stroke-dasharray:3 6}.originCore{position:absolute;left:50%;top:49%;display:grid;place-items:center;width:118px;height:118px;transform:translate(-50%,-50%);border:1px solid rgba(240,209,139,.45);border-radius:50%;background:radial-gradient(circle,rgba(215,174,98,.16),rgba(8,12,18,.88) 66%);box-shadow:0 0 55px rgba(215,174,98,.12),inset 0 0 30px rgba(215,174,98,.08)}.originCore:before,.originCore:after{content:"";position:absolute;border:1px solid rgba(117,184,223,.22);border-radius:50%}.originCore:before{inset:-21px}.originCore:after{inset:-46px;border-color:rgba(157,139,218,.14)}.originCore span{position:relative;z-index:2;color:#f3d894;font:700 36px/1 Georgia,serif;text-shadow:0 0 18px rgba(240,209,139,.35)}.originCore b{position:relative;z-index:2;margin-top:-12px;color:rgba(243,239,230,.82);font:800 .64rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em}.originCore small{position:relative;z-index:2;color:rgba(117,184,223,.62);font:750 .52rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em}.sceneNode{position:absolute;display:flex;align-items:center;gap:7px;transform:translate(-50%,-50%);color:rgba(243,239,230,.48);font:750 .57rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;white-space:nowrap}.sceneNode i{width:7px;height:7px;border-radius:50%;background:var(--blue);box-shadow:0 0 13px rgba(117,184,223,.95);animation:nodePulse 3.4s ease-in-out infinite}.sceneNode:nth-of-type(3n) i{background:var(--violet);box-shadow:0 0 13px rgba(157,139,218,.9)}.sceneNode:nth-of-type(4n) i{background:var(--gold);box-shadow:0 0 13px rgba(215,174,98,.9)}.sceneLegend{position:absolute;left:18px;right:18px;bottom:16px;display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid rgba(255,255,255,.065);color:rgba(243,239,230,.4);font:700 .55rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.09em}.sceneLegend span{display:flex;align-items:center;gap:7px}.sceneLegend strong{color:rgba(215,174,98,.62);font-weight:750}.legendDot{width:6px;height:6px;border-radius:50%;background:var(--blue);box-shadow:0 0 10px rgba(117,184,223,.9)}@keyframes auraPulse{0%,100%{transform:translate(-50%,-50%) scale(.94);opacity:.72}50%{transform:translate(-50%,-50%) scale(1.06);opacity:1}}@keyframes nodePulse{0%,100%{transform:scale(.75);opacity:.65}50%{transform:scale(1.18);opacity:1}}.heroTop,.sectionHead{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}.eyebrow{margin:0 0 13px;color:var(--gold);font-size:.76rem;font-weight:800;letter-spacing:.17em;text-transform:uppercase}.language{color:#f6d99d;text-decoration:none;border:1px solid rgba(215,174,98,.25);border-radius:999px;padding:8px 11px;font-size:.76rem}h1,h2,p{margin-top:0}h1{max-width:680px;margin-bottom:22px;font-size:clamp(2.55rem,4.8vw,4.5rem);line-height:1.01;letter-spacing:-.05em}h2{margin-bottom:14px;font-size:clamp(1.55rem,3vw,2.35rem);letter-spacing:-.035em}p,li{color:rgba(243,239,230,.72);font-size:1rem;line-height:1.72}.lead{max-width:820px;font-size:clamp(1.08rem,2vw,1.35rem);color:rgba(243,239,230,.82)}.offerLine{display:flex;flex-wrap:wrap;gap:12px 22px;align-items:center;margin:28px 0 24px}.offerLine strong{font-size:1.5rem;color:#fff1cc}.offerLine span{color:rgba(243,239,230,.58)}.primary{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:12px 20px;border-radius:999px;background:linear-gradient(135deg,#f0d18b,#c99b47);color:#151006;text-decoration:none;font-weight:850;box-shadow:0 0 34px rgba(215,174,98,.15)}.origin{display:grid;grid-template-columns:130px 1fr;gap:26px;align-items:center;padding:28px 34px;border-color:rgba(117,184,223,.22)}.origin h2{margin-bottom:5px}.origin p:last-child{margin-bottom:0}.originGlyph{position:relative;width:108px;height:108px;border:1px solid rgba(117,184,223,.3);border-radius:50%;display:grid;place-items:center}.originGlyph:before,.originGlyph:after{content:"";position:absolute;border:1px solid rgba(157,139,218,.26);border-radius:50%}.originGlyph:before{width:74px;height:74px}.originGlyph:after{width:42px;height:42px}.originGlyph span{position:relative;z-index:2;color:#f0d18b;font:700 26px Georgia,serif}.originGlyph i,.originGlyph b{position:absolute;width:7px;height:7px;border-radius:50%;background:var(--blue);box-shadow:0 0 18px var(--blue)}.originGlyph i{top:12px;right:21px}.originGlyph b{bottom:16px;left:19px;background:var(--violet);box-shadow:0 0 18px var(--violet)}.gridPanel{padding:34px}.counter{color:rgba(243,239,230,.48);font:700 .78rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em}.grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:9px;margin-top:24px}.slot{position:relative;min-height:92px;padding:13px;border:1px solid rgba(255,255,255,.095);border-radius:15px;background:linear-gradient(145deg,rgba(117,184,223,.045),rgba(157,139,218,.025));color:inherit;text-decoration:none;overflow:hidden;transition:transform 150ms ease,border-color 150ms ease,background 150ms ease}.slot:hover,.slot:focus-visible{transform:translateY(-2px);border-color:rgba(215,174,98,.45);background:rgba(215,174,98,.06);outline:none}.slot span{display:block;font:750 .82rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:rgba(243,239,230,.86)}.slot small{position:absolute;left:13px;bottom:12px;color:rgba(117,184,223,.66);font-size:.57rem;letter-spacing:.11em}.slot i{position:absolute;right:10px;top:10px;width:5px;height:5px;border-radius:50%;background:var(--blue);box-shadow:0 0 12px rgba(117,184,223,.85)}.split{width:min(1080px,100%);margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:24px}.split .panel{margin:0;padding:34px}.panel{padding:34px}.panel ul{margin:18px 0 0;padding-left:20px}.panel li{margin:7px 0}.signal{border-color:rgba(157,139,218,.24);background:radial-gradient(circle at 100% 0%,rgba(157,139,218,.09),transparent 36%),rgba(9,12,19,.74)}.protocol ol{list-style:none;padding:0;margin:22px 0;display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.protocol li{padding:18px;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:rgba(255,255,255,.025);line-height:1.5}.protocol li span{display:block;margin-bottom:13px;color:var(--gold);font:750 .7rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em}.secondary{margin-top:4px}.registry{border-color:rgba(117,184,223,.2)}.registry p{max-width:820px}.registry code{display:block;margin-top:18px;padding:16px 18px;overflow:auto;border:1px solid rgba(117,184,223,.14);border-radius:14px;background:#05080d;color:#9fd3ee;font-size:.82rem}.terms{width:min(1080px,100%);margin:28px auto 0;color:rgba(243,239,230,.38);font-size:.78rem;text-align:center}@media(max-width:850px){.field{padding:34px 14px 100px}.hero{padding:28px 22px 30px}.heroBody{grid-template-columns:1fr}.fieldScene{min-height:380px;order:-1}.hero h1{font-size:clamp(2.4rem,11vw,4rem);line-height:1.01}.origin{grid-template-columns:88px 1fr;padding:24px}.originGlyph{width:72px;height:72px}.originGlyph:before{width:50px;height:50px}.originGlyph:after{width:28px;height:28px}.gridPanel,.panel{padding:24px}.grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.slot{min-height:78px;padding:10px}.slot small{left:10px;bottom:9px}.split{grid-template-columns:1fr}.protocol ol{grid-template-columns:1fr 1fr}.primary{width:100%}}@media(max-width:480px){.fieldScene{min-height:320px}.sceneLines{inset:16px;width:calc(100% - 32px);height:calc(100% - 32px)}.originCore{width:94px;height:94px}.originCore span{font-size:29px}.sceneNode{font-size:.5rem}.sceneLegend{left:12px;right:12px}.sceneLegend strong{display:none}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}.protocol ol{grid-template-columns:1fr}.origin{grid-template-columns:1fr}.originGlyph{margin-bottom:4px}}
        @media(prefers-reduced-motion:reduce){.sceneAura,.sceneNode i{animation:none}}
      `}</style>
    </>
  );
}
