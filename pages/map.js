import Link from "next/link";

const MARKET_COSMOGRAPHER_URL = "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/index#surface";

const COPY = {
  en: {
    ey: "SYSTEM MAP",
    title: "One public system. Distinct roles.",
    groups: [
      ["Market path", [
        ["BHRIGU", "Public home", "/"],
        ["Market Cosmographer", "Primary current product", MARKET_COSMOGRAPHER_URL],
        ["BTC Field", "First proven Bitcoin corridor", "/crypto-astro/btc"],
      ]],
      ["Temporal path", [
        ["Frey", "Active temporal reading/dialogue", "/frey"],
        ["Reading", "Temporal meaning surface", "/reading"],
        ["Frey Guide", "How to read, compare and carry Frey into another AI", "/guide/frey"],
      ]],
      ["Interpretation & depth", [
        ["Cosmographer", "Interpretation/navigation role", "/cosmographer"],
        ["Cosmography", "Research language and boundary", "/cosmography"],
        ["ORION", "Protected research depth", "/orion"],
      ]],
      ["Public boundary", [
        ["Support", "Voluntary Bitcoin support", "/support"],
        ["Access", "Reviewed intake temporarily closed", "/access"],
        ["DAO", "Future/peripheral only", "/dao"],
      ]],
    ],
  },
  ru: {
    ey: "КАРТА СИСТЕМЫ",
    title: "Одна публичная система. Разные роли.",
    groups: [
      ["Рыночный путь", [
        ["BHRIGU", "Публичный дом", "/"],
        ["Market Cosmographer", "Основной текущий продукт", MARKET_COSMOGRAPHER_URL],
        ["BTC Field", "Первый доказанный Bitcoin-коридор", "/crypto-astro/btc"],
      ]],
      ["Темпоральный путь", [
        ["Frey", "Действующее темпоральное чтение/диалог", "/frey"],
        ["Reading", "Поверхность темпорального смысла", "/reading"],
        ["Гид Frey", "Как читать, сравнивать и передавать Frey стороннему ИИ", "/guide/frey"],
      ]],
      ["Интерпретация и глубина", [
        ["Космограф", "Роль интерпретации/навигации", "/cosmographer"],
        ["Космография", "Исследовательский язык и граница", "/cosmography"],
        ["ORION", "Защищённая исследовательская глубина", "/orion"],
      ]],
      ["Публичная граница", [
        ["Поддержка", "Добровольная Bitcoin-поддержка", "/support"],
        ["Доступ", "Reviewed intake временно закрыт", "/access"],
        ["DAO", "Только будущее/периферия", "/dao"],
      ]],
    ],
  },
};

const GROUP_TONES = ["blue", "violet", "mix", "gold"];

export async function getServerSideProps({ query }) {
  return { props: { locale: query.lang === "ru" ? "ru" : "en" } };
}

export default function MapPage({ locale }) {
  const c = COPY[locale];
  return (
    <main className="q" lang={locale}>
      <p className="ey">{c.ey}</p>
      <h1>{c.title}</h1>
      <div className="mapFieldLine" aria-hidden="true"><span /><i /><b /></div>
      {c.groups.map(([group, items], groupIndex) => (
        <section key={group} data-map-tone={GROUP_TONES[groupIndex]}>
          <div className="groupHead">
            <span className="groupIndex">0{groupIndex + 1}</span>
            <h2>{group}</h2>
          </div>
          <div className="mapRows">
            {items.map(([name, description, href]) => {
              const target = /^https?:\/\//.test(href) ? href : `${href}?lang=${locale}`;
              return (
                <Link className="mapRow" key={name} href={target}>
                  <strong className="mapName">{name}</strong>
                  <span className="mapDescription">{description}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      <style jsx>{`
        .q {
          --map-gold: #c8a45a;
          --map-blue: #62a8d8;
          --map-violet: #9a89d1;
          max-width: 960px;
          margin: auto;
          padding: 72px 22px 120px;
          background:
            radial-gradient(circle at 2% 15%, rgba(98,168,216,.05), transparent 24%),
            radial-gradient(circle at 98% 44%, rgba(154,137,209,.05), transparent 28%);
        }
        .ey { color: #d5b86d; letter-spacing: .16em; font-size: 12px; }
        .q h1 { margin-bottom: 22px; font: 400 clamp(38px,6vw,64px)/1.02 Georgia,serif; }
        .mapFieldLine { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; width: min(420px, 70%); height: 2px; margin: 0 0 36px; overflow: hidden; border-radius: 999px; opacity: .82; }
        .mapFieldLine span { background: var(--map-blue); }
        .mapFieldLine i { background: var(--map-violet); }
        .mapFieldLine b { background: var(--map-gold); }
        .q section {
          position: relative;
          margin-top: 16px;
          padding: 22px 24px 18px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.085);
          border-radius: 20px;
          background: rgba(255,255,255,.012);
        }
        .q section::before { content:""; position:absolute; inset:0 auto 0 0; width:2px; background: var(--map-gold); }
        .q section[data-map-tone="blue"] { border-color: rgba(98,168,216,.20); background: radial-gradient(circle at 100% 0%, rgba(98,168,216,.085), transparent 34%), rgba(255,255,255,.01); }
        .q section[data-map-tone="blue"]::before { background: linear-gradient(var(--map-blue), var(--map-gold)); }
        .q section[data-map-tone="violet"] { border-color: rgba(154,137,209,.22); background: radial-gradient(circle at 100% 0%, rgba(154,137,209,.095), transparent 35%), rgba(255,255,255,.01); }
        .q section[data-map-tone="violet"]::before { background: var(--map-violet); }
        .q section[data-map-tone="mix"] { border-color: rgba(121,151,210,.20); background: radial-gradient(circle at 96% 5%, rgba(154,137,209,.075), transparent 31%), radial-gradient(circle at 4% 100%, rgba(98,168,216,.055), transparent 34%), rgba(255,255,255,.01); }
        .q section[data-map-tone="mix"]::before { background: linear-gradient(var(--map-blue), var(--map-violet)); }
        .q section[data-map-tone="gold"] { border-color: rgba(200,164,90,.19); background: radial-gradient(circle at 100% 0%, rgba(200,164,90,.065), transparent 34%), rgba(255,255,255,.01); }
        .groupHead { display:flex; align-items:baseline; gap:14px; margin-bottom:10px; }
        .groupIndex { color: rgba(213,184,109,.65); font: 600 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.12em; }
        .q section[data-map-tone="blue"] .groupIndex { color: var(--map-blue); }
        .q section[data-map-tone="violet"] .groupIndex { color: var(--map-violet); }
        .groupHead h2 { margin:0; font-size: 22px; font-weight: 600; }
        .mapRows { display:grid; gap:0; }
        :global(.mapRow) {
          display:grid;
          grid-template-columns:minmax(210px,280px) minmax(0,1fr);
          column-gap:28px;
          row-gap:4px;
          align-items:baseline;
          padding:14px 0;
          border-top:1px solid rgba(255,255,255,.08);
          color:inherit;
          text-decoration:none;
          transition: background 140ms ease, padding 140ms ease;
        }
        :global(.mapRow:hover), :global(.mapRow:focus-visible) { padding-left: 8px; background: linear-gradient(90deg, rgba(98,168,216,.035), rgba(154,137,209,.025), transparent); outline:none; }
        .mapName { min-width:0; color: rgba(242,244,247,.94); }
        .mapDescription { min-width:0; color:rgba(255,255,255,.62); text-align:left; line-height:1.45; }
        @media(max-width:600px) {
          .q { padding: 48px 16px 110px; }
          .mapFieldLine { width: 78%; margin-bottom: 28px; }
          .q section { padding: 20px 18px 16px; border-radius: 17px; }
          :global(.mapRow) { grid-template-columns:1fr; row-gap:5px; padding:13px 0; }
          :global(.mapRow:hover), :global(.mapRow:focus-visible) { padding-left: 5px; }
          .mapDescription { text-align:left; }
        }
      `}</style>
    </main>
  );
}
