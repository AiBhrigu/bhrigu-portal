import Link from "next/link";

const PUBLIC_ATLAS_URL = "https://aibhrigu.github.io/phi-cosmography-open/";

const COPY = {
  en: {
    ey: "RESEARCH LANGUAGE · PUBLIC ATLAS",
    title: "Cosmography Φ",
    lead: "Cosmography describes structure, cycles and relation as a readable field. BHRIGU holds the language and boundary here; the public read-only visual Atlas is materialized as a separate evidence surface.",
    atlasEy: "PUBLIC VISUAL AUTHORITY",
    atlasTitle: "Φ-Cosmography Public Research Atlas",
    atlasBody: "Historical and conceptual Solar-System maps: Inner φ-Core, φ-Floors, Helion φ⁵ and the text-only X Boundary. Static, read-only and provenance-bound.",
    atlasCta: "Open public Atlas ↗",
    bounds: [
      "Conceptual / historical maps are not current ephemeris outputs",
      "No public ORION internals",
      "No prediction, discovery or financial authority on this surface",
    ],
    links: [["ORION boundary","/orion"],["Frey interface","/frey"],["Reading surface","/reading"],["System map","/map"]],
  },
  ru: {
    ey: "ИССЛЕДОВАТЕЛЬСКИЙ ЯЗЫК · ПУБЛИЧНЫЙ АТЛАС",
    title: "Космография Φ",
    lead: "Космография описывает структуру, циклы и связи как читаемое поле. BHRIGU удерживает здесь язык и границу; публичный read-only визуальный Атлас материализован как отдельная поверхность доказательств.",
    atlasEy: "ПУБЛИЧНАЯ ВИЗУАЛЬНАЯ AUTHORITY",
    atlasTitle: "Публичный исследовательский атлас Φ-Космографии",
    atlasBody: "Исторические и концептуальные карты Солнечной системы: Inner φ-Core, φ-Floors, Helion φ⁵ и текстовая граница X Boundary. Статично, read-only и с явным provenance.",
    atlasCta: "Открыть публичный Атлас ↗",
    bounds: [
      "Концептуальные / исторические карты не являются текущими эфемеридами",
      "Нет публичных внутренних механизмов ORION",
      "Нет предсказательной, discovery- или финансовой authority на этой поверхности",
    ],
    links: [["Граница ORION","/orion"],["Интерфейс Frey","/frey"],["Поверхность Reading","/reading"],["Карта системы","/map"]],
  },
};

export async function getServerSideProps({query}) {
  return {props:{locale:query.lang==="ru"?"ru":"en"}};
}

export default function Cosmography({locale}) {
  const c=COPY[locale];
  return <main className="q" lang={locale} data-cosmography-entry="BHRIGU_COSMOGRAPHY_ATLAS_BIND_V0_1">
    <p className="ey">{c.ey}</p>
    <h1>{c.title}</h1>
    <p className="lead">{c.lead}</p>

    <section className="atlasGate" aria-label={c.atlasTitle}>
      <span>{c.atlasEy}</span>
      <h2>{c.atlasTitle}</h2>
      <p>{c.atlasBody}</p>
      <a href={PUBLIC_ATLAS_URL}>{c.atlasCta}</a>
    </section>

    <ul className="bounds">{c.bounds.map(x=><li key={x}>{x}</li>)}</ul>
    <nav>{c.links.map(([n,h])=><Link key={h} href={`${h}?lang=${locale}`}>{n} →</Link>)}</nav>

    <style jsx>{`
      .q{max-width:860px;margin:auto;padding:80px 22px 130px}
      .ey,.atlasGate>span{color:#d5b86d;letter-spacing:.16em;font-size:12px}
      .q h1{font:400 clamp(38px,6vw,62px)/1 Georgia,serif;margin:12px 0 18px}
      .lead,.q li,.atlasGate p{color:rgba(255,255,255,.68);line-height:1.7}
      .lead{max-width:760px}
      .atlasGate{margin:34px 0 28px;padding:24px;border:1px solid rgba(126,183,216,.26);border-radius:18px;background:radial-gradient(circle at 100% 0%,rgba(98,168,216,.08),transparent 45%),rgba(255,255,255,.012)}
      .atlasGate h2{margin:8px 0 10px;font:400 clamp(24px,4vw,34px)/1.15 Georgia,serif}
      .atlasGate p{max-width:700px;margin:0 0 18px}
      .atlasGate a{display:inline-flex;padding:10px 14px;border:1px solid rgba(213,184,109,.34);border-radius:999px;color:#e1c77d;text-decoration:none}
      .bounds{padding-left:20px;margin:28px 0}
      .q nav{display:grid;margin-top:34px}
      .q nav :global(a){padding:12px 0;border-top:1px solid rgba(255,255,255,.1);color:#e1c77d;text-decoration:none}
    `}</style>
  </main>;
}
