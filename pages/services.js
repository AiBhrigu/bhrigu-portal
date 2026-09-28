import Head from "next/head";
import Link from "next/link";

const COPY = {
  en: {
    eyebrow: "SERVICES · AVAILABLE NOW",
    title: "Three exact ways to work with BHRIGU.",
    lead: "Not a catalogue of capabilities. Only bounded objects you can open now — with a clear scope, a visible boundary, and an evidence-linked result.",
    signal: "ONE OBJECT → CLEAR BOUNDARY → VERIFIABLE OUTPUT",
    choose: "Choose by the decision you need to make.",
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
        special: {
          label: "SPECIALIZED PATH",
          title: "x402 Failure-Surface Recon",
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
    lead: "Не каталог возможностей. Только ограниченные объекты, которые можно открыть сейчас — с ясным scope, видимой границей и результатом, связанным с доказательствами.",
    signal: "ОДИН ОБЪЕКТ → ЯСНАЯ ГРАНИЦА → ПРОВЕРЯЕМЫЙ РЕЗУЛЬТАТ",
    choose: "Выберите по решению, которое вам нужно принять.",
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
        special: {
          label: "СПЕЦИАЛИЗИРОВАННЫЙ ПУТЬ",
          title: "x402 Failure-Surface Recon",
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
  return (
    <>
      <Head>
        <meta name="phi-surface" content="BHRIGU_SERVICES_COMMERCIAL_ROOT_V0_1" />
      </Head>
      <main className="services" lang={locale} data-services-root="BHRIGU_SERVICES_COMMERCIAL_ROOT_V0_1">
        <section className="hero">
          <p className="ey">{c.eyebrow}</p>
          <h1>{c.title}</h1>
          <p className="lead">{c.lead}</p>
          <div className="signal">{c.signal}</div>
        </section>

        <section className="offers" aria-labelledby="offers-title">
          <div className="sectionHead">
            <span>01</span>
            <div>
              <p className="ey">{locale === "ru" ? "ДЕЙСТВУЮЩИЕ ОБЪЕКТЫ" : "LIVE OBJECTS"}</p>
              <h2 id="offers-title">{c.choose}</h2>
            </div>
          </div>

          <div className="offerGrid">
            {c.cards.map((card) => (
              <article className="offer" key={card.index} data-service-object={card.title.toLowerCase().replaceAll(" ", "-")}>
                <div className="offerTop">
                  <span className="index">{card.index}</span>
                  <span className="kind">{card.kind}</span>
                </div>
                <h3>{card.title}</h3>
                <p className="body">{card.body}</p>
                <ul>{card.gets.map((item) => <li key={item}>{item}</li>)}</ul>
                <div className="price"><strong>{card.price}</strong><span>{card.meta}</span></div>
                <Link className="cta" href={local(card.href, locale)}>{card.cta}<span aria-hidden="true">↗</span></Link>

                {card.special ? (
                  <div className="special" data-specialized-service="x402-failure-surface-recon">
                    <p className="specialLabel">{card.special.label}</p>
                    <h4>{card.special.title}</h4>
                    <p>{card.special.body}</p>
                    <small>{card.special.truth}</small>
                    <Link href={local(card.special.href, locale)}>{card.special.cta}<span aria-hidden="true">→</span></Link>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
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
          <p className="ey">{c.finalEyebrow}</p>
          <h2>{c.finalTitle}</h2>
          <p>{c.finalBody}</p>
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
            min-height:100vh;
            color:var(--ink);
            background:
              radial-gradient(circle at 12% 8%, rgba(98,168,216,.055), transparent 26%),
              radial-gradient(circle at 88% 34%, rgba(154,137,209,.05), transparent 30%),
              #07090c;
          }
          .hero,.offers,.boundary,.entry{width:min(1180px,calc(100% - 44px));margin:0 auto}
          .hero{padding:clamp(76px,10vw,138px) 0 78px;border-bottom:1px solid var(--line)}
          .ey{margin:0 0 18px;color:var(--gold);font:650 10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em}
          h1,h2,h3,h4{margin:0;font-family:Georgia,"Times New Roman",serif;font-weight:500}
          h1{max-width:940px;font-size:clamp(46px,7vw,86px);line-height:.98;letter-spacing:-.035em}
          .lead{max-width:820px;margin:30px 0 0;color:var(--muted);font-size:clamp(16px,2vw,20px);line-height:1.7}
          .signal{width:max-content;max-width:100%;margin-top:42px;padding:11px 14px;border:1px solid rgba(200,164,90,.25);color:rgba(241,239,233,.7);font:650 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em}
          .offers,.boundary{padding:88px 0;border-bottom:1px solid var(--line)}
          .sectionHead{display:grid;grid-template-columns:58px minmax(0,820px);gap:28px;margin-bottom:48px}
          .sectionHead>span{padding-top:5px;color:var(--faint);font:650 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace}
          .sectionHead .ey{margin-bottom:10px}
          .sectionHead h2,.entry h2{font-size:clamp(32px,4.5vw,55px);line-height:1.04;letter-spacing:-.025em}
          .offerGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line)}
          .offer{position:relative;display:flex;min-width:0;min-height:100%;padding:30px;flex-direction:column;background:rgba(6,8,11,.98)}
          .offer:first-child{background:linear-gradient(180deg,rgba(98,168,216,.055),rgba(6,8,11,.98) 34%)}
          .offer:nth-child(2){background:linear-gradient(180deg,rgba(154,137,209,.05),rgba(6,8,11,.98) 34%)}
          .offer:nth-child(3){background:linear-gradient(180deg,rgba(200,164,90,.05),rgba(6,8,11,.98) 34%)}
          .offerTop{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:34px}
          .index{color:var(--faint);font:650 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace}
          .kind{color:var(--gold);font:650 8px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-align:right}
          .offer h3{font-size:clamp(28px,3vw,38px);line-height:1.03;letter-spacing:-.025em}
          .body{min-height:132px;margin:20px 0 0;color:var(--muted);font-size:14px;line-height:1.65}
          ul{min-height:128px;margin:24px 0 0;padding:18px 0 0 18px;border-top:1px solid var(--line);color:rgba(241,239,233,.58)}
          li{margin:6px 0;padding-left:5px;font-size:12px;line-height:1.45}
          .price{display:flex;align-items:baseline;justify-content:space-between;gap:18px;margin-top:auto;padding-top:22px;border-top:1px solid rgba(200,164,90,.18)}
          .price strong{font:650 14px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em}
          .price span{color:var(--faint);font:650 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em}
          :global(.cta){display:flex;align-items:center;justify-content:space-between;gap:18px;margin-top:18px;padding:15px 0 4px;border-top:1px solid var(--line);color:var(--ink)!important;font-size:11px;font-weight:650;letter-spacing:.06em;text-decoration:none!important}
          :global(.cta span){color:var(--gold)}
          .special{margin-top:22px;padding:20px;border:1px solid rgba(98,168,216,.22);background:rgba(98,168,216,.035)}
          .specialLabel{margin:0 0 10px!important;color:var(--blue)!important;font:650 8px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em}
          .special h4{font-size:22px;line-height:1.05}
          .special p{margin:12px 0 0;color:rgba(241,239,233,.66);font-size:12px;line-height:1.55}
          .special small{display:block;margin-top:12px;color:var(--faint);font-size:10px;line-height:1.5}
          .special :global(a){display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:16px;color:rgba(241,239,233,.86)!important;font-size:10px;font-weight:650;text-decoration:none!important}
          .special :global(a span){color:var(--blue)}
          .boundaryBody{display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.6fr);gap:72px;margin-left:86px}
          .boundaryBody>p{max-width:680px;margin:0;color:var(--muted);font-size:16px;line-height:1.7}
          .boundaryBody nav{display:grid;align-content:start;border-top:1px solid rgba(200,164,90,.35)}
          .boundaryBody :global(a){display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px 0;border-bottom:1px solid var(--line);color:rgba(241,239,233,.82)!important;font-size:11px;text-decoration:none!important}
          .boundaryBody :global(a span){color:var(--gold)}
          .entry{padding:92px 0 120px}
          .entry h2{max-width:840px}
          .entry>p:last-child{max-width:760px;margin:24px 0 0;color:var(--muted);font-size:16px;line-height:1.7}
          :global(a:hover){opacity:.88}
          :global(a:focus-visible){outline:1px solid var(--gold);outline-offset:5px}
          @media(max-width:900px){
            .offerGrid{grid-template-columns:1fr}
            .body,ul{min-height:0}
            .boundaryBody{grid-template-columns:1fr;margin-left:86px;gap:36px}
          }
          @media(max-width:620px){
            .hero,.offers,.boundary,.entry{width:min(100% - 32px,1180px)}
            .hero{padding-top:64px}
            .sectionHead{grid-template-columns:38px 1fr;gap:16px}
            .offer{padding:24px 20px}
            .boundaryBody{margin-left:0}
            .signal{font-size:8px;line-height:1.6}
          }
        `}</style>
      </main>
    </>
  );
}
