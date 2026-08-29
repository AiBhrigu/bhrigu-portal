import Link from "next/link";

const COPY = {
  en: {
    eyebrow: "START · CURRENT BHRIGU",
    title: "Start with the working system, not the archive.",
    lead: "BHRIGU is the public home of Market Cosmographer, BTC Field, Frey, public proof, and clearly bounded research surfaces.",
    items: [
      ["BTC Field", "The first proven live corridor for evidence-linked Bitcoin intelligence.", "/crypto-astro/btc"],
      ["Frey", "A distinct active temporal reading and dialogue service.", "/frey"],
      ["Public proof", "Inspect the source-bound research surface behind current public claims.", "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/index.html"],
      ["System map", "See how BHRIGU, Cosmographer, Frey and ORION relate without collapsing their roles.", "/map"],
    ],
    boundary: "ORION remains protected research depth. Public surfaces expose meaning, evidence and boundaries — not private internals.",
    cta: "Open BTC Field",
  },
  ru: {
    eyebrow: "СТАРТ · ТЕКУЩИЙ BHRIGU",
    title: "Начните с работающей системы, а не с архива.",
    lead: "BHRIGU — публичный дом Market Cosmographer, BTC Field, Frey, публичных доказательств и чётко ограниченных исследовательских поверхностей.",
    items: [
      ["BTC Field", "Первый доказанный живой коридор evidence-linked Bitcoin intelligence.", "/crypto-astro/btc"],
      ["Frey", "Отдельный действующий сервис темпорального чтения и диалога.", "/frey"],
      ["Публичные доказательства", "Проверьте source-bound исследовательскую поверхность, на которой основаны текущие публичные утверждения.", "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/index.html"],
      ["Карта системы", "Посмотрите связи BHRIGU, Космографа, Frey и ORION без смешения их ролей.", "/map"],
    ],
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
  return <main className="quietPhi" lang={locale}>
    <p className="eyebrow">{c.eyebrow}</p>
    <h1>{c.title}</h1>
    <p className="lead">{c.lead}</p>
    <section className="grid" aria-label={locale === "ru" ? "Основные маршруты" : "Primary routes"}>
      {c.items.map(([name, body, href]) => <Link key={name} href={local(href, locale)} className="node"><strong>{name}</strong><span>{body}</span></Link>)}
    </section>
    <p className="boundary">{c.boundary}</p>
    <Link className="primary" href={local("/crypto-astro/btc", locale)}>{c.cta} →</Link>
    <style jsx>{`
      .quietPhi{max-width:980px;margin:0 auto;padding:72px 22px 120px;color:#eef1f4}.eyebrow{color:#d5b86d;letter-spacing:.16em;font-size:12px}.quietPhi h1{max-width:820px;font:400 clamp(38px,6vw,68px)/1 Georgia,serif;margin:18px 0}.lead,.boundary{max-width:760px;color:rgba(238,241,244,.72);font-size:17px;line-height:1.7}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:38px 0}.node{display:grid;gap:8px;padding:20px;border:1px solid rgba(255,255,255,.1);text-decoration:none;color:inherit;background:rgba(255,255,255,.02)}.node span{color:rgba(238,241,244,.64);line-height:1.55}.primary{display:inline-block;margin-top:24px;color:#e1c77d;text-decoration:none}@media(max-width:680px){.grid{grid-template-columns:1fr}.quietPhi{padding-top:48px}}
    `}</style>
  </main>;
}
