import Head from "next/head";
import Link from "next/link";
import styles from "./index.module.css";

const PUBLIC_PROOF_URL =
  "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/index.html#what-changed";

const COPY = {
  en: {
    category: "AI MARKET INTELLIGENCE SYSTEM",
    h1Lead: "See what changed in Bitcoin —",
    h1Close: "and what would change the current read.",
    subheadline:
      "For self-directed Bitcoin investors: verified change, why it matters, and explicit conditions in one evidence-linked read.",
    openBtc: "Ask what changed in Bitcoin",
    viewProof: "View public proof",
    proofLine:
      "For self-directed Bitcoin investors · Verified sources · Explicit conditions · Evidence available",
    productEyebrow: "THE PRODUCT",
    productTitle: "One read. Three connected layers.",
    productIntro:
      "Market Cosmographer turns a market question into a bounded reading: what the evidence says now, how the field fits together, and which conditions matter next.",
    productLayers: [
      ["Market evidence", "Accepted source data establishes the observable state."],
      ["Field context", "Related signals are read together without forcing agreement."],
      ["Forward conditions", "The read states what would strengthen, weaken or invalidate the current interpretation."],
    ],
    outcomesEyebrow: "OUTCOMES",
    outcomesTitle: "Read the change before you read the noise.",
    outcomesIntro:
      "The system is designed to separate a real field change from an isolated number, a repeated narrative or an unsupported prediction.",
    outcomes: [
      ["What changed", "A verified delta against an accepted evidence state."],
      ["Why it matters", "The relationship between structure, participation, liquidity, time and memory."],
      ["What to watch", "Explicit conditions that would confirm, contradict or limit the current read."],
    ],
    btcEyebrow: "FIRST PROVEN LIVE CORRIDOR",
    btcTitle: "BTC Field",
    btcBody:
      "Bitcoin is the first public corridor where Market Cosmographer joins a verified Snapshot, market structure, field memory, temporal context and question-led reading.",
    btcDetail:
      "Open the current field, inspect its evidence boundary, then ask a bounded follow-up in the live dialogue.",
    btcStatus: "LIVE PUBLIC CORRIDOR",
    questionEyebrow: "QUESTION → KNOWLEDGE",
    questionTitle: "A question becomes a traceable read.",
    questionSteps: [
      ["Ask", "Start with the change, market structure, a named field subject or a defined time window."],
      ["Route", "The question selects the relevant evidence lane and preserves its boundary."],
      ["Read", "Cosmographer composes the answer, conditions and limits in a visible order."],
      ["Verify", "Sources, observation period and available proof remain attached to the result."],
    ],
    proofEyebrow: "PUBLIC PROOF",
    proofTitle: "Evidence is part of the product surface.",
    proofBody:
      "The analytical mirror exposes the accepted market Snapshot, provenance, field structure, methodology and change record used to evaluate the public corridor.",
    proofBoundary:
      "Evidence supports an inspectable research reading. It does not create trading advice or prediction certainty.",
    methodEyebrow: "METHOD",
    methodTitle: "Observe. Relate. Condition.",
    methodItems: [
      ["Observe", "Bind the read to accepted data and its stated revision."],
      ["Relate", "Compare modules as one field while preserving divergence."],
      ["Condition", "Name the forward conditions and the point where the interpretation stops holding."],
    ],
    rolesEyebrow: "SYSTEM ROLES",
    rolesTitle: "One public path. Four distinct authorities.",
    roles: [
      ["BHRIGU", "opens public access"],
      ["Frey", "holds the dialogue"],
      ["Cosmographer", "owns the reading and forward conditions"],
      ["ORION", "protects the research core"],
    ],
    continuityEyebrow: "FIELD CONTINUITY",
    continuityTitle: "Keep the analytical frame coherent.",
    continuityBody:
      "Field Continuity preserves the subject, evidence boundary and accepted starting state inside a defined reading, so a follow-up can be compared without silently changing the question.",
    continuityBoundary:
      "It is a reading value, not a promise of account history, cross-device memory, alerts, monitoring or automatic delivery.",
    marketsEyebrow: "MARKETS",
    marketsTitle: "Bitcoin first. Expansion only after proof.",
    marketsBody:
      "The method can be applied to additional market fields, but BTC Field is the first and only proven public live corridor today. New corridors remain outside the public claim until their data, method and acceptance are verified.",
    closeEyebrow: "START WITH THE LIVE FIELD",
    closeTitle: "See what changed in Bitcoin — and what conditions matter next.",
    closeBody:
      "Enter the accepted BTC Field in your language. The evidence boundary remains visible from the first read.",
  },
  ru: {
    category: "СИСТЕМА AI-АНАЛИТИКИ РЫНКОВ",
    h1Lead: "Что изменилось в Bitcoin —",
    h1Close: "и что изменит текущее чтение.",
    subheadline:
      "Для самостоятельных Bitcoin-инвесторов: проверенное изменение, его значение и явные условия в одном чтении со связанными доказательствами.",
    openBtc: "Спросить, что изменилось в Bitcoin",
    viewProof: "Посмотреть публичные доказательства",
    proofLine:
      "Для самостоятельных Bitcoin-инвесторов · Проверенные источники · Явные условия · Доказательства доступны",
    productEyebrow: "ПРОДУКТ",
    productTitle: "Одно чтение. Три связанных слоя.",
    productIntro:
      "Market Cosmographer превращает вопрос о рынке в ограниченное чтение: что показывают доказательства сейчас, как связано поле и какие условия важны дальше.",
    productLayers: [
      ["Рыночные доказательства", "Принятые данные источников устанавливают наблюдаемое состояние."],
      ["Контекст поля", "Связанные сигналы читаются вместе без принудительного согласования."],
      ["Будущие условия", "Чтение показывает, что усилит, ослабит или отменит текущую интерпретацию."],
    ],
    outcomesEyebrow: "РЕЗУЛЬТАТ",
    outcomesTitle: "Сначала изменение. Потом шум.",
    outcomesIntro:
      "Система отделяет реальное изменение поля от отдельной цифры, повторяемого нарратива или неподтверждённого прогноза.",
    outcomes: [
      ["Что изменилось", "Проверенная дельта относительно принятого состояния доказательств."],
      ["Почему это важно", "Связь структуры, участия, ликвидности, времени и памяти."],
      ["Что отслеживать", "Явные условия, которые подтвердят, опровергнут или ограничат текущее чтение."],
    ],
    btcEyebrow: "ПЕРВЫЙ ДОКАЗАННЫЙ ЖИВОЙ КОРИДОР",
    btcTitle: "BTC Field",
    btcBody:
      "Bitcoin — первый публичный коридор, где Market Cosmographer объединяет проверенный Snapshot, структуру рынка, память поля, временной контекст и чтение по вопросу.",
    btcDetail:
      "Откройте текущее поле, проверьте границу доказательств и задайте ограниченный уточняющий вопрос в живом диалоге.",
    btcStatus: "ЖИВОЙ ПУБЛИЧНЫЙ КОРИДОР",
    questionEyebrow: "ВОПРОС → ЗНАНИЕ",
    questionTitle: "Вопрос становится проверяемым чтением.",
    questionSteps: [
      ["Вопрос", "Начните с изменения, структуры рынка, предмета поля или заданного временного окна."],
      ["Маршрут", "Вопрос выбирает нужную линию доказательств и сохраняет её границу."],
      ["Чтение", "Космограф собирает ответ, условия и ограничения в видимом порядке."],
      ["Проверка", "Источники, период наблюдения и доступные доказательства остаются связаны с результатом."],
    ],
    proofEyebrow: "ПУБЛИЧНЫЕ ДОКАЗАТЕЛЬСТВА",
    proofTitle: "Доказательства встроены в продукт.",
    proofBody:
      "Аналитическое зеркало показывает принятый рыночный Snapshot, происхождение данных, структуру поля, метод и историю изменений, по которым проверяется публичный коридор.",
    proofBoundary:
      "Доказательства поддерживают проверяемое исследовательское чтение. Они не создают торговый совет или уверенность в предсказании.",
    methodEyebrow: "МЕТОД",
    methodTitle: "Наблюдать. Связывать. Формулировать условия.",
    methodItems: [
      ["Наблюдать", "Привязать чтение к принятым данным и заявленной ревизии."],
      ["Связывать", "Сопоставить модули как одно поле, сохраняя расхождения."],
      ["Условия", "Назвать будущие условия и точку, где интерпретация перестаёт действовать."],
    ],
    rolesEyebrow: "РОЛИ СИСТЕМЫ",
    rolesTitle: "Один публичный путь. Четыре разные роли.",
    roles: [
      ["BHRIGU", "открывает публичный доступ"],
      ["Frey", "удерживает диалог"],
      ["Космограф", "владеет чтением и условиями его изменения"],
      ["ORION", "защищает исследовательское ядро"],
    ],
    continuityEyebrow: "НЕПРЕРЫВНОСТЬ ПОЛЯ",
    continuityTitle: "Сохраняйте целостность аналитической рамки.",
    continuityBody:
      "Field Continuity сохраняет предмет, границу доказательств и принятое исходное состояние внутри определённого чтения, чтобы уточнение не меняло вопрос незаметно.",
    continuityBoundary:
      "Это ценность чтения, а не обещание истории аккаунта, межустройственной памяти, уведомлений, мониторинга или автоматической доставки.",
    marketsEyebrow: "РЫНКИ",
    marketsTitle: "Сначала Bitcoin. Расширение — только после доказательств.",
    marketsBody:
      "Метод применим к другим рыночным полям, но сегодня BTC Field — первый и единственный доказанный публичный живой коридор. Новые коридоры не входят в публичное обещание до проверки данных, метода и приёмки.",
    closeEyebrow: "НАЧНИТЕ С ЖИВОГО ПОЛЯ",
    closeTitle: "Посмотрите, что изменилось в Bitcoin — и какие условия важны дальше.",
    closeBody:
      "Откройте принятое BTC Field на своём языке. Граница доказательств видна с первого чтения.",
  },
};

function EditorialList({ items, numbered = false }) {
  return (
    <ol className={styles.editorialList} data-numbered={numbered ? "true" : "false"}>
      {items.map(([title, body], index) => (
        <li key={title}>
          <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function SectionHeading({ eyebrow, title, body }) {
  return (
    <div className={styles.sectionHeading}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h2>{title}</h2>
      {body ? <p className={styles.sectionLead}>{body}</p> : null}
    </div>
  );
}

function buildJsonLd() {
  const home = "https://www.bhrigu.io/";
  const product = `${home}#market-cosmographer`;
  const btc = "https://www.bhrigu.io/crypto-astro/btc";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${home}#organization`,
        name: "BHRIGU",
        url: home,
      },
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        name: "BHRIGU",
        url: home,
        publisher: { "@id": `${home}#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${home}#webpage`,
        url: home,
        name: "Market Cosmographer · AI Market Intelligence | BHRIGU",
        isPartOf: { "@id": `${home}#website` },
        about: { "@id": product },
      },
      {
        "@type": "SoftwareApplication",
        "@id": product,
        name: "Market Cosmographer",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: home,
        description:
          "An AI market intelligence system combining verified market data, field context and explicit conditions in an evidence-linked read.",
        provider: { "@id": `${home}#organization` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${home}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "BHRIGU", item: home },
          { "@type": "ListItem", position: 2, name: "Market Cosmographer", item: product },
          { "@type": "ListItem", position: 3, name: "BTC Field", item: btc },
        ],
      },
    ],
  };
}

export function getServerSideProps({ query }) {
  return { props: { locale: query.lang === "ru" ? "ru" : "en" } };
}

export default function Home({ locale }) {
  const copy = COPY[locale] || COPY.en;
  const btcEntryHref = `/crypto-astro/btc?lang=${locale}`;
  const primaryQuestion = locale === "ru"
    ? "Что изменилось в Bitcoin с предыдущего принятого Snapshot — и почему это важно?"
    : "What changed in Bitcoin since the previous accepted Snapshot — and why does it matter?";
  const btcQuestionHref = `/crypto-astro/btc/live?lang=${locale}&q=${encodeURIComponent(primaryQuestion)}`;
  const jsonLd = buildJsonLd();

  return (
    <>
      <Head>
        <title>Market Cosmographer · AI Market Intelligence | BHRIGU</title>
        <meta
          name="description"
          content="Evidence-linked Bitcoin intelligence for self-directed investors: verified change, why it matters, and explicit conditions."
        />
        <meta property="og:title" content="Market Cosmographer · AI Market Intelligence | BHRIGU" />
        <meta
          property="og:description"
          content="See what changed in Bitcoin, why it matters, and which conditions would change the current read."
        />
        <meta property="og:url" content="https://www.bhrigu.io/" />
        <meta name="twitter:title" content="Market Cosmographer · AI Market Intelligence | BHRIGU" />
        <meta
          name="twitter:description"
          content="Know what changed — and what conditions matter next. Open the evidence-linked BTC Field by BHRIGU."
        />
        <meta name="phi-surface" content="MARKET_COSMOGRAPHER_PRIMARY_PRODUCT_V0_1" />
      </Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main
        id="market-cosmographer"
        className={styles.page}
        lang={locale}
        data-primary-product="market-cosmographer"
        data-home-contract="BHRIGU_HOME_MARKET_COSMOGRAPHER_PRIMARY_PRODUCT_IMPLEMENTATION_v0_1"
      >
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <p className={styles.product}>MARKET COSMOGRAPHER</p>
            <p className={styles.category}>{copy.category}</p>
            <h1 id="home-title">
              <span>{copy.h1Lead}</span>
              <span>{copy.h1Close}</span>
            </h1>
            <p className={styles.subheadline}>{copy.subheadline}</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href={btcQuestionHref} data-primary-cta="btc-current-change-question">
                {copy.openBtc}
                <span aria-hidden="true">↗</span>
              </Link>
              <a
                className={styles.secondaryCta}
                href={PUBLIC_PROOF_URL}
                data-secondary-cta="public-proof"
              >
                {copy.viewProof}
              </a>
            </div>
            <p className={styles.proofLine}>{copy.proofLine}</p>
          </div>
          <div className={styles.heroGlyph} aria-hidden="true">
            <span className={styles.phiGlyph}>Φ</span>
            <span className={styles.glyphLabel}>MARKET / TIME / CONDITION</span>
          </div>
        </section>

        <section id="product" className={styles.editorialSection}>
          <SectionHeading
            eyebrow={copy.productEyebrow}
            title={copy.productTitle}
            body={copy.productIntro}
          />
          <EditorialList items={copy.productLayers} />
        </section>

        <section id="outcomes" className={`${styles.editorialSection} ${styles.blueSection}`}>
          <SectionHeading
            eyebrow={copy.outcomesEyebrow}
            title={copy.outcomesTitle}
            body={copy.outcomesIntro}
          />
          <EditorialList items={copy.outcomes} />
        </section>

        <section id="btc-field" className={`${styles.editorialSection} ${styles.btcSection}`}>
          <div>
            <SectionHeading
              eyebrow={copy.btcEyebrow}
              title={copy.btcTitle}
              body={copy.btcBody}
            />
            <p className={styles.sectionSupport}>{copy.btcDetail}</p>
            <Link className={styles.textCta} href={btcEntryHref}>
              {locale === "ru" ? "Открыть обзор BTC Field" : "Open BTC Field overview"} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className={styles.btcVisual} aria-label={copy.btcStatus} role="img">
            <span className={styles.btcOrbit} />
            <span className={styles.btcDisc}>₿</span>
            <span className={styles.btcStatus}>{copy.btcStatus}</span>
          </div>
        </section>

        <section id="question-to-knowledge" className={styles.editorialSection}>
          <SectionHeading eyebrow={copy.questionEyebrow} title={copy.questionTitle} />
          <EditorialList items={copy.questionSteps} numbered />
        </section>

        <section id="proof" className={`${styles.editorialSection} ${styles.proofSection}`}>
          <SectionHeading
            eyebrow={copy.proofEyebrow}
            title={copy.proofTitle}
            body={copy.proofBody}
          />
          <div className={styles.proofRoute}>
            <p>{copy.proofBoundary}</p>
            <a href={PUBLIC_PROOF_URL} className={styles.textCta}>
              {copy.viewProof} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <section id="method" className={`${styles.editorialSection} ${styles.violetSection}`}>
          <SectionHeading eyebrow={copy.methodEyebrow} title={copy.methodTitle} />
          <EditorialList items={copy.methodItems} />
        </section>

        <section id="system-roles" className={styles.editorialSection}>
          <SectionHeading eyebrow={copy.rolesEyebrow} title={copy.rolesTitle} />
          <dl className={styles.roleMap}>
            {copy.roles.map(([name, role]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{role}</dd>
              </div>
            ))}
          </dl>
          <nav className={styles.quietRoutes} aria-label="BHRIGU system routes">
            <Link href="/frey">Frey</Link>
            <Link href="/cosmographer">Cosmographer</Link>
            <Link href="/orion">ORION</Link>
          </nav>
        </section>

        <section id="continuity" className={`${styles.editorialSection} ${styles.continuitySection}`}>
          <SectionHeading
            eyebrow={copy.continuityEyebrow}
            title={copy.continuityTitle}
            body={copy.continuityBody}
          />
          <p className={styles.boundaryNote}>{copy.continuityBoundary}</p>
        </section>

        <section id="markets" className={styles.editorialSection}>
          <SectionHeading
            eyebrow={copy.marketsEyebrow}
            title={copy.marketsTitle}
            body={copy.marketsBody}
          />
          <div className={styles.marketState}>
            <span>01</span>
            <strong>BTC FIELD</strong>
            <small>{copy.btcStatus}</small>
          </div>
        </section>

        <section id="open-btc-field" className={styles.closingSection}>
          <p className={styles.eyebrow}>{copy.closeEyebrow}</p>
          <h2>{copy.closeTitle}</h2>
          <p>{copy.closeBody}</p>
          <Link className={styles.primaryCta} href={btcQuestionHref}>
            {copy.openBtc}
            <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>
    </>
  );
}
