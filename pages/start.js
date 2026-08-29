import Link from "next/link";

const COPY = {
  en: {
    eyebrow: "START · CURRENT BHRIGU",
    title: "Start with the working system, not the archive.",
    lead: "BHRIGU is the public home of Market Cosmographer, BTC Field, Frey, public proof, and clearly bounded research surfaces.",
    choose: "Choose a surface",
    chooseLead: "Four different doors into the same public system. Start with Bitcoin, temporal reading, evidence, or the relationship map.",
    items: [
      ["01", "BITCOIN · LIVE FIELD", "BTC Field", "The first proven live corridor for evidence-linked Bitcoin intelligence.", "/crypto-astro/btc", "Open BTC Field"],
      ["02", "TEMPORAL · ACTIVE SERVICE", "Frey", "A distinct active temporal reading and dialogue service.", "/frey", "Open Frey"],
      ["03", "EVIDENCE · PUBLIC PROOF", "Public proof", "Inspect the source-bound research surface behind current public claims.", "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/index.html", "Inspect proof"],
      ["04", "SYSTEM · RELATION MAP", "System map", "See how BHRIGU, Cosmographer, Frey and ORION relate without collapsing their roles.", "/map", "Open system map"],
    ],
    boundaryLabel: "Protected depth",
    boundary: "ORION remains protected research depth. Public surfaces expose meaning, evidence and boundaries — not private internals.",
    cta: "Open BTC Field",
  },
  ru: {
    eyebrow: "СТАРТ · ТЕКУЩИЙ BHRIGU",
    title: "Начните с работающей системы, а не с архива.",
    lead: "BHRIGU — публичный дом Market Cosmographer, BTC Field, Frey, публичных доказательств и чётко ограниченных исследовательских поверхностей.",
    choose: "Выберите поверхность",
    chooseLead: "Четыре разных входа в одну публичную систему: Bitcoin, темпоральное чтение, доказательства или карта связей.",
    items: [
      ["01", "BITCOIN · ЖИВОЕ ПОЛЕ", "BTC Field", "Первый доказанный живой коридор evidence-linked Bitcoin intelligence.", "/crypto-astro/btc", "Открыть BTC Field"],
      ["02", "TEMPORAL · АКТИВНЫЙ СЕРВИС", "Frey", "Отдельный действующий сервис темпорального чтения и диалога.", "/frey", "Открыть Frey"],
      ["03", "EVIDENCE · ПУБЛИЧНЫЙ PROOF", "Публичные доказательства", "Проверьте source-bound исследовательскую поверхность, на которой основаны текущие публичные утверждения.", "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/index.html", "Открыть доказательства"],
      ["04", "SYSTEM · КАРТА СВЯЗЕЙ", "Карта системы", "Посмотрите связи BHRIGU, Космографа, Frey и ORION без смешения их ролей.", "/map", "Открыть карту"],
    ],
    boundaryLabel: "Защищённая глубина",
    boundary: "ORION остаётся защищённой исследовательской глубиной. Публичные поверхности показывают смысл, доказательства и границы — не приватные механизмы.",
    cta: "Открыть BTC Field",
  },
};

function local(href, locale) {
  if (href.startsWith("http")) return href;
  return `${href}${href.includes("?") ? "&" : "?"}lang=${locale}`;
}

export async function getServerSideProps({ query }) {
  return { props: { locale: query.lang === "ru" ? "ru" : "en" } };
}

export default function Start({ locale }) {
  const c = COPY[locale] || COPY.en;
  return (
    <main className="startSurface" lang={locale}>
      <section className="hero">
        <p className="eyebrow">{c.eyebrow}</p>
        <h1>{c.title}</h1>
        <p className="lead">{c.lead}</p>
      </section>

      <section className="orientation" aria-labelledby="start-orientation-title">
        <div className="sectionHead">
          <p className="sectionIndex">01 — 04</p>
          <div>
            <h2 id="start-orientation-title">{c.choose}</h2>
            <p>{c.chooseLead}</p>
          </div>
        </div>

        <div className="grid" aria-label={locale === "ru" ? "Основные маршруты" : "Primary routes"}>
          {c.items.map(([index, meta, name, body, href, action], itemIndex) => (
            <Link
              key={name}
              href={local(href, locale)}
              className={`startNode${itemIndex === 0 ? " startNodePrimary" : ""}`}
            >
              <span className="cardTop">
                <span className="cardIndex">{index}</span>
                <span className="cardMeta">{meta}</span>
              </span>
              <strong className="cardName">{name}</strong>
              <span className="cardBody">{body}</span>
              <span className="cardAction">{action} <span aria-hidden="true">↗</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="boundaryPanel" aria-label={c.boundaryLabel}>
        <p className="boundaryLabel">{c.boundaryLabel}</p>
        <p className="boundary">{c.boundary}</p>
        <Link className="primaryButton" href={local("/crypto-astro/btc", locale)}>
          {c.cta} <span aria-hidden="true">→</span>
        </Link>
      </section>

      <style jsx>{`
        .startSurface {
          max-width: 1080px;
          margin: 0 auto;
          padding: 74px 24px 132px;
          color: #eef1f4;
        }
        .hero {
          max-width: 900px;
        }
        .eyebrow,
        .sectionIndex,
        .boundaryLabel {
          margin: 0;
          color: #d5b86d;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .startSurface h1 {
          max-width: 900px;
          margin: 18px 0 20px;
          font: 400 clamp(42px, 6.2vw, 76px) / 0.98 Georgia, serif;
          letter-spacing: -0.045em;
        }
        .lead {
          max-width: 780px;
          margin: 0;
          color: rgba(238, 241, 244, 0.72);
          font-size: 17px;
          line-height: 1.72;
        }
        .orientation {
          margin-top: 62px;
        }
        .sectionHead {
          display: grid;
          grid-template-columns: 120px minmax(0, 1fr);
          gap: 24px;
          align-items: start;
          margin-bottom: 24px;
        }
        .sectionHead h2 {
          margin: -5px 0 7px;
          font: 500 clamp(25px, 3vw, 34px) / 1.12 Georgia, serif;
        }
        .sectionHead p:not(.sectionIndex) {
          max-width: 660px;
          margin: 0;
          color: rgba(238, 241, 244, 0.56);
          line-height: 1.6;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        :global(.startNode) {
          position: relative;
          display: grid;
          min-height: 260px;
          grid-template-rows: auto auto 1fr auto;
          gap: 16px;
          padding: 26px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.11);
          border-radius: 22px;
          color: inherit !important;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.015));
          text-decoration: none !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
          transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
        }
        :global(.startNodePrimary) {
          border-color: rgba(213, 184, 109, 0.42);
          background: radial-gradient(circle at 90% 0%, rgba(213, 184, 109, 0.13), transparent 40%), rgba(213, 184, 109, 0.035);
        }
        :global(.startNode:hover),
        :global(.startNode:focus-visible) {
          transform: translateY(-2px);
          border-color: rgba(213, 184, 109, 0.48);
          background-color: rgba(255, 255, 255, 0.05);
          outline: none;
        }
        .cardTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .cardIndex {
          color: rgba(213, 184, 109, 0.9);
          font: 600 12px / 1 ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .cardMeta {
          color: rgba(238, 241, 244, 0.42);
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 0.14em;
          text-align: right;
        }
        .cardName {
          max-width: 92%;
          color: rgba(255, 255, 255, 0.95);
          font: 500 clamp(24px, 3vw, 34px) / 1.05 Georgia, serif;
          letter-spacing: -0.025em;
        }
        .cardBody {
          max-width: 430px;
          color: rgba(238, 241, 244, 0.62);
          font-size: 14px;
          line-height: 1.6;
        }
        .cardAction {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          color: #d9bd75;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .boundaryPanel {
          display: grid;
          grid-template-columns: 170px minmax(0, 1fr) auto;
          gap: 24px;
          align-items: center;
          margin-top: 28px;
          padding: 26px 28px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.018);
        }
        .boundary {
          margin: 0;
          color: rgba(238, 241, 244, 0.58);
          font-size: 13px;
          line-height: 1.62;
        }
        :global(.primaryButton) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 44px;
          padding: 0 17px;
          border: 1px solid rgba(213, 184, 109, 0.42);
          border-radius: 999px;
          color: #e1c77d !important;
          background: rgba(213, 184, 109, 0.055);
          text-decoration: none !important;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 750;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }
        @media (max-width: 760px) {
          .startSurface {
            padding: 48px 16px 112px;
          }
          .startSurface h1 {
            font-size: clamp(40px, 12vw, 58px);
          }
          .orientation {
            margin-top: 48px;
          }
          .sectionHead {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .grid {
            grid-template-columns: 1fr;
          }
          :global(.startNode) {
            min-height: 230px;
            padding: 22px;
            border-radius: 18px;
          }
          .boundaryPanel {
            grid-template-columns: 1fr;
            gap: 14px;
            padding: 22px;
          }
          :global(.primaryButton) {
            width: fit-content;
            max-width: 100%;
            white-space: normal;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
