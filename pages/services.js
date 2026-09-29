import Head from "next/head";
import Link from "next/link";

const COPY = {
  en: {
    eyebrow: "SERVICES · AVAILABLE NOW",
    title: "Three exact ways to work with BHRIGU.",
    lead: "Three bounded offers. Each has a fixed price, exact scope, and an evidence-linked result. Choose the object that matches the decision in front of you.",
    signal: "ONE OBJECT → CLEAR BOUNDARY → VERIFIABLE OUTPUT",
    choose: "Choose by the decision you need to make.",
    compare: "Compare the three live services",
    cards: [
      {
        index: "01",
        kind: "SYSTEM TOPOLOGY",
        title: "External Systems Recon",
        price: "USD 300",
        meta: "READ-ONLY",
        body: "One bounded AI, agent, research, knowledge, or payment system. We map the state, test the important boundary, and return evidence instead of generic advice.",
        gets: ["System map", "3 highest-impact findings", "Evidence for each finding", "Exact repair / verification blueprint"],
        cta: "Open External Systems Recon",
        href: "/access",
        id: "external-systems-recon",
        special: {
          label: "SPECIALIZED PATH · EXTERNAL SYSTEMS RECON",
          title: "x402 Failure-Surface Recon",
          price: "USD 300",
          meta: "ONE PAYMENT PATH",
          body: "One x402 payment path: 402 → PaymentRequired → signing → verify → settle → response → receipt / recovery.",
          cta: "Open x402 Recon",
          href: "/access?offer=x402-recon",
          truth: "Current public claims stop short of a completed BHRIGU end-to-end x402 settlement proof.",
        },
      },
      {
        index: "02",
        kind: "COSMOGRAPHIC PASSPORT",
        title: "Frey Personal",
        price: "USD 79",
        meta: "ONE READING",
        body: "One subject. One meaningful temporal horizon. One complete reading that preserves structure, uncertainty, and the result as a portable research object.",
        gets: ["One bounded question", "One temporal horizon", "Full Cosmographic Reading", "Portable Cosmographic Passport"],
        cta: "Open Frey Personal",
        href: "/access?offer=frey-personal",
        id: "frey-personal",
      },
      {
        index: "03",
        kind: "FINITE PUBLIC REGISTRY",
        title: "AI Founding Field",
        price: "USD 99",
        meta: "ONE-TIME",
        body: "One durable public founding coordinate for an agent, model, project, or product inside a finite machine-readable field.",
        gets: ["Public coordinate", "Timestamped record", "Machine-readable object", "Finite founding registry"],
        cta: "Open Founding Field",
        href: "/field",
        id: "ai-founding-field",
      },
    ],
    boundaryEyebrow: "BOUNDARY",
    boundaryTitle: "Capabilities are broad. Purchasable objects are exact.",
    boundaryBody: "BHRIGU does not turn every research capability into a service. The commercial surface stays smaller than the research field so the scope remains defensible.",
    systemCta: "Explore the full system architecture",
    mapCta: "Open the public system map",
    finalEyebrow: "ENTRY",
    finalTitle: "Start with the object that matches the problem.",
    finalBody: "If the problem is a system failure, start with Recon. If it is one personal temporal question, start with Frey. If it is public machine identity, start with the Founding Field.",
  },
  ru: {
    eyebrow: "УСЛУГИ · ДОСТУПНО СЕЙЧАС",
    title: "Три точных способа работать с BHRIGU.",
    lead: "Три ограниченных предложения. У каждого фиксированная цена, точный scope и результат, связанный с evidence. Выберите объект под решение, которое нужно принять.",
    signal: "ОДИН ОБЪЕКТ → ЯСНАЯ ГРАНИЦА → ПРОВЕРЯЕМЫЙ РЕЗУЛЬТАТ",
    choose: "Выберите по решению, которое вам нужно принять.",
    compare: "Сравнить три действующие услуги",
    cards: [
      {
        index: "01",
        kind: "SYSTEM TOPOLOGY",
        title: "External Systems Recon",
        price: "USD 300",
        meta: "READ-ONLY",
        body: "Одна ограниченная AI-, agent-, research-, knowledge- или payment-система. Мы фиксируем состояние, проверяем важную границу и возвращаем evidence вместо общих советов.",
        gets: ["Карта системы", "3 вывода с наибольшим влиянием", "Evidence по каждому выводу", "Точный repair / verification blueprint"],
        cta: "Открыть External Systems Recon",
        href: "/access",
        id: "external-systems-recon",
        special: {
          label: "СПЕЦИАЛИЗИРОВАННЫЙ ПУТЬ · EXTERNAL SYSTEMS RECON",
          title: "x402 Failure-Surface Recon",
          price: "USD 300",
          meta: "ONE PAYMENT PATH",
          body: "Один x402 payment path: 402 → PaymentRequired → signing → verify → settle → response → receipt / recovery.",
          cta: "Открыть x402 Recon",
          href: "/access?offer=x402-recon",
          truth: "Текущие публичные claims BHRIGU пока не включают завершённый end-to-end x402 settlement proof.",
        },
      },
      {
        index: "02",
        kind: "COSMOGRAPHIC PASSPORT",
        title: "Frey Personal",
        price: "USD 79",
        meta: "ONE READING",
        body: "Один объект. Один значимый временной горизонт. Одно полное чтение, сохраняющее структуру, неопределённость и результат как переносимый исследовательский объект.",
        gets: ["Один ограниченный вопрос", "Один временной горизонт", "Полное Космографическое чтение", "Переносимый Космографический паспорт"],
        cta: "Открыть Frey Personal",
        href: "/access?offer=frey-personal",
        id: "frey-personal",
      },
      {
        index: "03",
        kind: "FINITE PUBLIC REGISTRY",
        title: "AI Founding Field",
        price: "USD 99",
        meta: "ONE-TIME",
        body: "Одна долговечная публичная founding-координата для агента, модели, проекта или продукта внутри конечного машиночитаемого поля.",
        gets: ["Публичная координата", "Timestamped запись", "Machine-readable объект", "Конечный founding-реестр"],
        cta: "Открыть Founding Field",
        href: "/field",
        id: "ai-founding-field",
      },
    ],
    boundaryEyebrow: "ГРАНИЦА",
    boundaryTitle: "Возможности широки. Приобретаемые объекты точны.",
    boundaryBody: "BHRIGU не превращает каждую исследовательскую возможность в услугу. Коммерческая поверхность остаётся уже исследовательского поля, чтобы scope можно было защищать доказательствами.",
    systemCta: "Исследовать полную архитектуру систем",
    mapCta: "Открыть публичную карту системы",
    finalEyebrow: "ВХОД",
    finalTitle: "Начните с объекта, соответствующего задаче.",
    finalBody: "Если проблема — отказ или трещина системы, начните с Recon. Если это один личный темпоральный вопрос — с Frey. Если нужна публичная machine identity — с Founding Field.",
  },
};

function local(href, locale) {
  if (/^https?:\/\//.test(href)) return href;
  return `${href}${href.includes("?") ? "&" : "?"}lang=${locale}`;
}

export async function getServerSideProps({ query }) {
  return { props: { locale: query.lang === "ru" ? "ru" : "en" } };
}

export default function Services({ locale }) {
  const c = COPY[locale] || COPY.en;
  const specialized = c.cards[0].special;

  return (
    <>
      <Head>
        <meta name="phi-surface" content="BHRIGU_SERVICES_COMMERCIAL_ROOT_V0_2" />
      </Head>

      <main className="services" lang={locale} data-services-root="BHRIGU_SERVICES_COMMERCIAL_ROOT_V0_2">
        <section className="hero">
          <div className="heroInner">
            <p className="ey">{c.eyebrow}</p>
            <h1>{c.title}</h1>
            <p className="lead">{c.lead}</p>
            <div className="signal">{c.signal}</div>

            <nav className="heroOfferRail" aria-label={c.compare}>
              {c.cards.map((card) => (
                <a key={card.id} href={`#${card.id}`}>
                  <span>{card.title}</span>
                  <strong>{card.price}</strong>
                </a>
              ))}
            </nav>
          </div>
        </section>

        <section className="offers" id="live-offers" aria-labelledby="offers-title">
          <div className="sectionHead">
            <span>01</span>
            <div>
              <p className="ey">{locale === "ru" ? "ДЕЙСТВУЮЩИЕ ОБЪЕКТЫ" : "LIVE OBJECTS"}</p>
              <h2 id="offers-title">{c.choose}</h2>
            </div>
          </div>

          <div className="offerGrid">
            {c.cards.map((card) => (
              <article className="offer" id={card.id} key={card.index} data-service-object={card.title.toLowerCase().replaceAll(" ", "-")}>
                <div className="offerTop">
                  <span className="index">{card.index}</span>
                  <span className="kind">{card.kind}</span>
                </div>

                <h3>{card.title}</h3>

                <div className="price">
                  <strong>{card.price}</strong>
                  <span>{card.meta}</span>
                </div>

                <p className="body">{card.body}</p>

                <div className="deliverableLabel">
                  {locale === "ru" ? "ВЫ ПОЛУЧАЕТЕ" : "YOU RECEIVE"}
                </div>
                <ul>{card.gets.map((item) => <li key={item}>{item}</li>)}</ul>

                <Link className="cta" href={local(card.href, locale)}>
                  {card.cta}<span aria-hidden="true">↗</span>
                </Link>
              </article>
            ))}
          </div>

          {specialized ? (
            <aside className="specialRail" data-specialized-service="x402-failure-surface-recon">
              <div className="specialIdentity">
                <p>{specialized.label}</p>
                <h3>{specialized.title}</h3>
              </div>

              <div className="specialBody">
                <p>{specialized.body}</p>
                <small>{specialized.truth}</small>
              </div>

              <div className="specialAction">
                <div className="specialPrice">
                  <strong>{specialized.price}</strong>
                  <span>{specialized.meta}</span>
                </div>
                <Link href={local(specialized.href, locale)}>
                  {specialized.cta}<span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>
          ) : null}
        </section>

        <section className="boundary">
          <div className="sectionHead">
            <span>02</span>
            <div>
              <p className="ey">{c.boundaryEyebrow}</p>
              <h2>{c.boundaryTitle}</h2>
            </div>
          </div>

          <div className="boundaryBody">
            <p>{c.boundaryBody}</p>
            <nav>
              <Link href={local("/systems", locale)}>{c.systemCta}<span aria-hidden="true">→</span></Link>
              <Link href={local("/map", locale)}>{c.mapCta}<span aria-hidden="true">→</span></Link>
            </nav>
          </div>
        </section>

        <section className="entry">
          <div>
            <p className="ey">{c.finalEyebrow}</p>
            <h2>{c.finalTitle}</h2>
          </div>

          <div className="entryDecision">
            <p>{c.finalBody}</p>

            <nav className="entryActions" aria-label={locale === "ru" ? "Выбрать услугу" : "Choose a service"}>
              {c.cards.map((card) => (
                <Link key={card.id} href={local(card.href, locale)}>
                  <span>
                    <strong>{card.title}</strong>
                    <small>{card.price}</small>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </nav>

            {specialized ? (
              <Link className="entrySpecial" href={local(specialized.href, locale)}>
                <span>{specialized.title}</span>
                <small>{specialized.price} · {specialized.meta}</small>
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </div>
        </section>

        <style jsx>{`
          .services {
            --gold:#c8a45a;
            --blue:#62a8d8;
            --violet:#9a89d1;
            --ink:#f1efe9;
            --muted:rgba(241,239,233,.68);
            --faint:rgba(241,239,233,.42);
            --line:rgba(241,239,233,.10);
            width:100%;
            max-width:none;
            margin:0;
            padding:0;
            min-height:100vh;
            color:var(--ink);
            background:
              radial-gradient(circle at 12% 8%, rgba(98,168,216,.055), transparent 26%),
              radial-gradient(circle at 88% 34%, rgba(154,137,209,.05), transparent 30%),
              #07090c;
          }

          .hero,.offers,.boundary,.entry {
            width:min(1360px,calc(100% - 64px));
            margin:0 auto;
          }

          .hero {
            padding:clamp(70px,7vw,104px) 0 58px;
            border-bottom:1px solid var(--line);
          }

          .heroInner { max-width:1160px; }

          .ey {
            margin:0 0 16px;
            color:var(--gold);
            font:650 10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;
            letter-spacing:.18em;
          }

          h1,h2,h3,h4 {
            margin:0;
            font-family:Georgia,"Times New Roman",serif;
            font-weight:500;
          }

          h1 {
            max-width:1080px;
            font-size:clamp(48px,6.25vw,88px);
            line-height:.98;
            letter-spacing:-.035em;
          }

          .lead {
            max-width:900px;
            margin:26px 0 0;
            color:var(--muted);
            font-size:clamp(16px,1.45vw,19px);
            line-height:1.65;
          }

          .signal {
            width:max-content;
            max-width:100%;
            margin-top:30px;
            padding:10px 13px;
            border:1px solid rgba(200,164,90,.25);
            color:rgba(241,239,233,.7);
            font:650 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;
            letter-spacing:.12em;
          }

          .heroOfferRail {
            display:grid;
            grid-template-columns:repeat(3,minmax(0,1fr));
            gap:14px;
            margin-top:38px;
          }

          .heroOfferRail a {
            display:flex;
            align-items:baseline;
            justify-content:space-between;
            gap:18px;
            min-width:0;
            padding:15px 0 4px;
            border-top:1px solid rgba(200,164,90,.32);
            color:rgba(241,239,233,.82);
            text-decoration:none!important;
          }

          .heroOfferRail span {
            min-width:0;
            font-size:11px;
            line-height:1.4;
          }

          .heroOfferRail strong {
            flex:0 0 auto;
            color:var(--ink);
            font:650 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;
            letter-spacing:.06em;
          }

          .offers,.boundary {
            padding:68px 0;
            border-bottom:1px solid var(--line);
          }

          .sectionHead {
            display:grid;
            grid-template-columns:58px minmax(0,900px);
            gap:28px;
            margin-bottom:38px;
          }

          .sectionHead>span {
            padding-top:5px;
            color:var(--faint);
            font:650 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;
          }

          .sectionHead .ey { margin-bottom:9px; }

          .sectionHead h2,.entry h2 {
            font-size:clamp(32px,4vw,56px);
            line-height:1.04;
            letter-spacing:-.025em;
          }

          .offerGrid {
            display:grid;
            grid-template-columns:repeat(3,minmax(0,1fr));
            gap:16px;
          }

          .offer {
            display:flex;
            min-width:0;
            min-height:100%;
            padding:30px;
            flex-direction:column;
            border:1px solid var(--line);
            background:rgba(6,8,11,.98);
          }

          .offer:first-child {
            background:linear-gradient(180deg,rgba(98,168,216,.055),rgba(6,8,11,.98) 34%);
          }

          .offer:nth-child(2) {
            background:linear-gradient(180deg,rgba(154,137,209,.05),rgba(6,8,11,.98) 34%);
          }

          .offer:nth-child(3) {
            background:linear-gradient(180deg,rgba(200,164,90,.05),rgba(6,8,11,.98) 34%);
          }

          .offerTop {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:18px;
            margin-bottom:28px;
          }

          .index {
            color:var(--faint);
            font:650 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;
          }

          .kind {
            color:var(--gold);
            font:650 8px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;
            letter-spacing:.14em;
            text-align:right;
          }

          .offer h3 {
            max-width:320px;
            font-size:clamp(29px,2.5vw,40px);
            line-height:1.02;
            letter-spacing:-.025em;
          }

          .price {
            display:flex;
            align-items:baseline;
            justify-content:space-between;
            gap:18px;
            margin-top:20px;
            padding:14px 0;
            border-top:1px solid rgba(200,164,90,.22);
            border-bottom:1px solid var(--line);
          }

          .price strong {
            font:650 14px/1 ui-monospace,SFMono-Regular,Menlo,monospace;
            letter-spacing:.08em;
          }

          .price span {
            color:var(--faint);
            font:650 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;
            letter-spacing:.14em;
          }

          .body {
            min-height:112px;
            margin:20px 0 0;
            color:var(--muted);
            font-size:14px;
            line-height:1.62;
          }

          .deliverableLabel {
            margin-top:24px;
            padding-top:16px;
            border-top:1px solid var(--line);
            color:var(--faint);
            font:650 8px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;
            letter-spacing:.14em;
          }

          ul {
            min-height:112px;
            margin:12px 0 0;
            padding:0 0 0 18px;
            color:rgba(241,239,233,.62);
          }

          li {
            margin:6px 0;
            padding-left:5px;
            font-size:12px;
            line-height:1.45;
          }

          :global(.cta) {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:18px;
            margin-top:auto;
            padding:18px 0 2px;
            border-top:1px solid rgba(200,164,90,.24);
            color:var(--ink)!important;
            font-size:11px;
            font-weight:650;
            letter-spacing:.04em;
            text-decoration:none!important;
          }

          :global(.cta span) { color:var(--gold); }

          .specialRail {
            display:grid;
            grid-template-columns:minmax(250px,.7fr) minmax(0,1.45fr) minmax(210px,.55fr);
            gap:34px;
            align-items:center;
            margin-top:16px;
            padding:24px 28px;
            border:1px solid rgba(98,168,216,.26);
            background:
              linear-gradient(90deg,rgba(98,168,216,.055),rgba(98,168,216,.015) 58%,rgba(6,8,11,.96));
          }

          .specialIdentity p {
            margin:0 0 9px;
            color:var(--blue);
            font:650 8px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;
            letter-spacing:.14em;
          }

          .specialIdentity h3 {
            font-size:clamp(24px,2.15vw,34px);
            line-height:1.03;
          }

          .specialBody>p {
            margin:0;
            color:rgba(241,239,233,.68);
            font-size:13px;
            line-height:1.6;
          }

          .specialBody small {
            display:block;
            margin-top:9px;
            color:var(--faint);
            font-size:9.5px;
            line-height:1.5;
          }

          .specialAction {
            display:grid;
            gap:14px;
            align-self:stretch;
            align-content:center;
          }

          .specialPrice {
            display:flex;
            align-items:baseline;
            justify-content:space-between;
            gap:14px;
            padding-bottom:12px;
            border-bottom:1px solid rgba(98,168,216,.18);
          }

          .specialPrice strong {
            font:650 13px/1 ui-monospace,SFMono-Regular,Menlo,monospace;
            letter-spacing:.07em;
          }

          .specialPrice span {
            color:var(--faint);
            font:650 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;
            letter-spacing:.12em;
          }

          .specialAction :global(a) {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:14px;
            color:rgba(241,239,233,.9)!important;
            font-size:11px;
            font-weight:650;
            text-decoration:none!important;
          }

          .specialAction :global(a span) { color:var(--blue); }

          .boundaryBody {
            display:grid;
            grid-template-columns:minmax(0,1.15fr) minmax(320px,.7fr);
            gap:74px;
            margin-left:86px;
          }

          .boundaryBody>p {
            max-width:740px;
            margin:0;
            color:var(--muted);
            font-size:16px;
            line-height:1.68;
          }

          .boundaryBody nav {
            display:grid;
            align-content:start;
            border-top:1px solid rgba(200,164,90,.35);
          }

          .boundaryBody :global(a) {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:18px;
            padding:15px 0;
            border-bottom:1px solid var(--line);
            color:rgba(241,239,233,.82)!important;
            font-size:11px;
            text-decoration:none!important;
          }

          .boundaryBody :global(a span) { color:var(--gold); }

          .entry {
            display:grid;
            grid-template-columns:minmax(0,1fr) minmax(0,.78fr);
            gap:84px;
            align-items:end;
            padding:68px 0 86px;
          }

          .entry h2 { max-width:820px; }

          .entryDecision {
            display:grid;
            gap:24px;
            align-content:end;
          }

          .entryDecision>p {
            max-width:680px;
            margin:0;
            color:var(--muted);
            font-size:16px;
            line-height:1.68;
          }

          .entryActions {
            display:grid;
            border-top:1px solid rgba(200,164,90,.35);
          }

          .entryActions :global(a) {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:18px;
            padding:14px 0;
            border-bottom:1px solid var(--line);
            color:rgba(241,239,233,.88)!important;
            text-decoration:none!important;
          }

          .entryActions :global(a>span:first-child) {
            display:flex;
            align-items:baseline;
            justify-content:space-between;
            gap:18px;
            width:100%;
          }

          .entryActions :global(strong) {
            font-size:11px;
            font-weight:650;
          }

          .entryActions :global(small) {
            color:var(--faint);
            font:650 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;
            letter-spacing:.08em;
          }

          .entryActions :global(a>span:last-child) {
            color:var(--gold);
          }

          :global(.entrySpecial) {
            display:grid;
            grid-template-columns:minmax(0,1fr) auto auto;
            align-items:center;
            gap:14px;
            padding:12px 14px;
            border:1px solid rgba(98,168,216,.24);
            color:rgba(241,239,233,.82)!important;
            text-decoration:none!important;
            background:rgba(98,168,216,.025);
          }

          :global(.entrySpecial>span:first-child) {
            font-size:10px;
            font-weight:650;
          }

          :global(.entrySpecial small) {
            color:var(--faint);
            font:650 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;
            letter-spacing:.08em;
          }

          :global(.entrySpecial>span:last-child) { color:var(--blue); }

          :global(a:hover) { opacity:.88; }
          :global(a:focus-visible) { outline:1px solid var(--gold); outline-offset:5px; }

          @media(max-width:980px) {
            .hero,.offers,.boundary,.entry { width:min(100% - 40px,1360px); }
            .offerGrid { grid-template-columns:1fr; }
            .body,ul { min-height:0; }
            .specialRail { grid-template-columns:1fr; gap:18px; }
            .specialAction { max-width:360px; }
            .boundaryBody { grid-template-columns:1fr; margin-left:86px; gap:34px; }
            .entry { grid-template-columns:1fr; gap:24px; }
            .entryDecision { gap:20px; }
          }

          @media(max-width:620px) {
            .hero,.offers,.boundary,.entry { width:min(100% - 32px,1360px); }
            .hero { padding-top:52px; padding-bottom:44px; }
            h1 { font-size:clamp(42px,13vw,60px); }
            .heroOfferRail { grid-template-columns:1fr; gap:0; margin-top:30px; }
            .sectionHead { grid-template-columns:38px 1fr; gap:16px; }
            .offer { padding:24px 20px; }
            .boundaryBody { margin-left:0; }
            .specialRail { padding:22px 20px; }
            .signal { font-size:8px; line-height:1.6; }
            .entry { padding:56px 0 72px; }
            :global(.entrySpecial) { grid-template-columns:1fr auto; }
            :global(.entrySpecial small) { grid-column:1 / -1; order:3; }
          }
        `}</style>
      </main>
    </>
  );
}
