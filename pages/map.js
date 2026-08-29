import Link from "next/link";

const COPY = {
  en: {
    ey: "SYSTEM MAP",
    title: "One public system. Distinct roles.",
    groups: [
      ["Market path", [
        ["BHRIGU", "Public home", "/"],
        ["Market Cosmographer", "Primary current product", "/"],
        ["BTC Field", "First proven Bitcoin corridor", "/crypto-astro/btc"],
      ]],
      ["Temporal path", [
        ["Frey", "Active temporal reading/dialogue", "/frey"],
        ["Reading", "Temporal meaning surface", "/reading"],
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
        ["Market Cosmographer", "Основной текущий продукт", "/"],
        ["BTC Field", "Первый доказанный Bitcoin-коридор", "/crypto-astro/btc"],
      ]],
      ["Темпоральный путь", [
        ["Frey", "Действующее темпоральное чтение/диалог", "/frey"],
        ["Reading", "Поверхность темпорального смысла", "/reading"],
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

export async function getServerSideProps({ query }) {
  return { props: { locale: query.lang === "ru" ? "ru" : "en" } };
}

export default function MapPage({ locale }) {
  const c = COPY[locale];
  return (
    <main className="q">
      <p className="ey">{c.ey}</p>
      <h1>{c.title}</h1>
      {c.groups.map(([group, items]) => (
        <section key={group}>
          <h2>{group}</h2>
          <div className="mapRows">
            {items.map(([name, description, href]) => (
              <Link className="mapRow" key={name} href={`${href}?lang=${locale}`}>
                <strong className="mapName">{name}</strong>
                <span className="mapDescription">{description}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <style jsx>{`
        .q {
          max-width: 960px;
          margin: auto;
          padding: 72px 22px 120px;
        }
        .ey {
          color: #d5b86d;
          letter-spacing: 0.16em;
          font-size: 12px;
        }
        .q h1 {
          font: 400 clamp(38px, 6vw, 64px) / 1.02 Georgia, serif;
        }
        .q section {
          margin-top: 34px;
        }
        .mapRows {
          display: grid;
          gap: 8px;
        }
        .mapRow {
          display: grid;
          grid-template-columns: minmax(210px, 280px) minmax(0, 1fr);
          column-gap: 28px;
          row-gap: 4px;
          align-items: baseline;
          padding: 14px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: inherit;
          text-decoration: none;
        }
        .mapName {
          min-width: 0;
        }
        .mapDescription {
          min-width: 0;
          color: rgba(255, 255, 255, 0.62);
          text-align: left;
          line-height: 1.45;
        }
        @media (max-width: 600px) {
          .mapRow {
            grid-template-columns: 1fr;
            row-gap: 5px;
          }
          .mapDescription {
            text-align: left;
          }
        }
      `}</style>
    </main>
  );
}
