import Head from "next/head";
import Link from "next/link";
import styles from "./app-gateway.module.css";

const COPY = {
  en: {
    title: "BHRIGU Application Layer | Active Research Systems",
    description: "The public application layer of BHRIGU: active research, dialogue, evidence and system-navigation surfaces.",
    eyebrow: "BHRIGU · APPLICATION LAYER",
    h1: "One access surface. Multiple active systems.",
    lead: "app.bhrigu.io is the application layer of BHRIGU: a bounded entry point into active research, dialogue, evidence and navigation surfaces.",
    boundary: "PUBLIC ACCESS ≠ PROTECTED CORE",
    routes: [
      ["Φ Research Systems", "Capability root · seven system classes · public proof", "/systems"],
      ["Frey", "Active temporal dialogue and reading", "/frey"],
      ["Market Cosmographer", "Evidence-linked Bitcoin research surface", "/"],
      ["Ephemerides", "Source-bound planetary research data", "/ephemerides"],
      ["System Map", "Roles, paths and public boundaries", "/map"],
      ["ORION", "Protected research depth · role and boundary only", "/orion"],
    ],
    retiredEy: "ARCHITECTURE UPDATE",
    retiredTitle: "Astrodash is retired.",
    retiredBody: "The previous Astrodash login surface is not part of the current public BHRIGU architecture. Current access is through the active systems above.",
    footer: "BHRIGU · Φ Research Systems",
    systems: "SYSTEMS",
    frey: "OPEN FREY",
    map: "MAP",
    lang: "RU",
  },
  ru: {
    title: "BHRIGU · Слой приложений | Активные исследовательские системы",
    description: "Публичный слой приложений BHRIGU: активные исследовательские, диалоговые, доказательные и навигационные поверхности.",
    eyebrow: "BHRIGU · СЛОЙ ПРИЛОЖЕНИЙ",
    h1: "Одна поверхность доступа. Несколько активных систем.",
    lead: "app.bhrigu.io — прикладной слой BHRIGU: ограниченная точка входа в активные исследовательские, диалоговые, доказательные и навигационные поверхности.",
    boundary: "ПУБЛИЧНЫЙ ДОСТУП ≠ ЗАЩИЩЁННОЕ ЯДРО",
    routes: [
      ["Φ Research Systems", "Корень возможностей · семь классов систем · публичные доказательства", "/systems"],
      ["Frey", "Активный темпоральный диалог и чтение", "/frey"],
      ["Market Cosmographer", "Bitcoin-исследование, связанное с доказательствами", "/"],
      ["Эфемериды", "Планетные исследовательские данные, привязанные к источникам", "/ephemerides"],
      ["Карта системы", "Роли, маршруты и публичные границы", "/map"],
      ["ORION", "Защищённая исследовательская глубина · только роль и граница", "/orion"],
    ],
    retiredEy: "ОБНОВЛЕНИЕ АРХИТЕКТУРЫ",
    retiredTitle: "Astrodash закрыт.",
    retiredBody: "Предыдущая поверхность входа Astrodash не является частью текущей публичной архитектуры BHRIGU. Актуальный доступ идёт через активные системы выше.",
    footer: "BHRIGU · Φ Research Systems",
    systems: "СИСТЕМЫ",
    frey: "ОТКРЫТЬ FREY",
    map: "КАРТА",
    lang: "EN",
  },
};

function publicUrl(path, locale) {
  return `https://www.bhrigu.io${path}${path.includes("?") ? "&" : "?"}lang=${locale}`;
}

export async function getServerSideProps({ query, req }) {
  const locale = query.lang === "ru" ? "ru" : "en";
  const host = String(req.headers.host || "").split(":")[0].toLowerCase();
  return { props: { locale, canonicalHost: host === "app.bhrigu.io" } };
}

export default function AppGateway({ locale, canonicalHost }) {
  const c = COPY[locale];
  const canonical = locale === "ru" ? "https://app.bhrigu.io/?lang=ru" : "https://app.bhrigu.io/";

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: c.title,
    url: canonical,
    description: c.description,
    isPartOf: {
      "@type": "WebSite",
      name: "BHRIGU",
      url: "https://www.bhrigu.io/",
    },
    about: {
      "@type": "Thing",
      name: "Φ Research Systems",
      url: "https://www.bhrigu.io/systems",
    },
  };

  return (
    <>
      <Head>
        <title>{c.title}</title>
        <meta name="description" content={c.description} />
        <meta name="robots" content={canonicalHost ? "index,follow" : "noindex,nofollow"} />
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="en" href="https://app.bhrigu.io/" />
        <link rel="alternate" hrefLang="ru" href="https://app.bhrigu.io/?lang=ru" />
        <link rel="alternate" hrefLang="x-default" href="https://app.bhrigu.io/" />
        <meta property="og:title" content={c.title} />
        <meta property="og:description" content={c.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      </Head>

      <div className={styles.page} lang={locale}>
        <main>
          <section className={styles.hero}>
            <div className={styles.eyebrow}><span>Φ</span>{c.eyebrow}</div>
            <h1>{c.h1}</h1>
            <p className={styles.lead}>{c.lead}</p>
            <div className={styles.boundary}>{c.boundary}</div>
          </section>

          <section className={styles.field} aria-label="Active BHRIGU systems">
            <div className={styles.core} aria-hidden="true">
              <span>ONE</span><b>Φ</b><small>FIELD</small>
            </div>
            <div className={styles.routes}>
              {c.routes.map(([name, description, path], index) => (
                <a className={styles.route} href={publicUrl(path, locale)} key={name}>
                  <span className={styles.index}>0{index + 1}</span>
                  <span className={styles.routeCopy}>
                    <strong>{name}</strong>
                    <small>{description}</small>
                  </span>
                  <span className={styles.arrow}>↗</span>
                </a>
              ))}
            </div>
          </section>

          <section className={styles.retired}>
            <p className={styles.retiredEy}>{c.retiredEy}</p>
            <h2>{c.retiredTitle}</h2>
            <p>{c.retiredBody}</p>
          </section>
        </main>

        <footer className={styles.footer}>{c.footer}</footer>
      </div>
    </>
  );
}
