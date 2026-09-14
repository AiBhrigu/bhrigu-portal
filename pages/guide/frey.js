import PublicSupportRoute from '../../components/btc/PublicSupportRoute';

const coreDownloads = [
  { id: 'en-brief', label: 'EN Brief Publication v4', href: '/publications/frey/bhrigu-frey-en-brief-v4.pdf' },
  { id: 'en-full', label: 'EN Full Article v4', href: '/publications/frey/bhrigu-frey-en-full-article-v4.pdf' },
  { id: 'ru-aligned', label: 'RU v2 Aligned Text', href: '/publications/frey/bhrigu-frey-ru-v2-aligned.pdf' },
];

const posterDownloads = [
  { label: 'EN Approved Poster Pack v5 · Visual Guide PDF', href: '/publications/frey/bhrigu-frey-en-approved-poster-pack-v5-visual-guide.pdf' },
  { label: 'EN Approved Poster Pack v5 · ZIP', href: '/publications/frey/bhrigu-frey-en-approved-poster-pack-v5.zip' },
  { label: 'EN Approved Poster Pack v5 · SHA256', href: '/publications/frey/bhrigu-frey-en-approved-poster-pack-v5.sha256' },
  { label: 'EN Approved Poster Pack v5 · Report', href: '/publications/frey/bhrigu-frey-en-approved-poster-pack-v5-report.md' },
];

const ruPosterDownloads = [
  { label: 'RU Approved Poster Pack v1 · Visual Guide PDF', href: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1-visual-guide.pdf' },
  { label: 'RU Approved Poster Pack v1 · ZIP', href: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1.zip' },
  { label: 'RU Approved Poster Pack v1 · ZIP SHA256', href: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1.zip.sha256' },
  { label: 'RU Approved Poster Pack v1 · Manifest SHA256', href: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1-manifest.sha256' },
  { label: 'RU Approved Poster Pack v1 · Report', href: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1-report.md' },
  { label: 'RU Approved Poster Pack v1 · Contact Sheet', href: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1-contact.jpg' },
];

const VISUAL_GUIDES = {
  en: {
    eyebrow: 'VISUAL GUIDE · FREY',
    title: 'Frey Visual Guide',
    provenance: 'APPROVED POSTER PACK v5 · EN',
    preview: '/publications/frey/bhrigu-frey-en-approved-poster-pack-v5-preview.webp',
    previewAlt: 'Preview of four approved Frey Visual Guide posters: time metric, reading grammar, Compare / Delta and AI Read Protocol.',
    pdf: '/publications/frey/bhrigu-frey-en-approved-poster-pack-v5-visual-guide.pdf',
    lead: 'An approved visual sequence showing how Frey is meant to be read — from metric structure and comparison to AI handoff and the public route.',
    bullets: [
      'Read Frey metrics as a structure, not isolated scores.',
      'Follow the intended state → meaning → direction reading order.',
      'Understand Compare / Δ as structural change, not a better/worse ranking.',
      'Carry Frey context into another AI without stripping away the method.',
      'See how the visual layer fits the public Frey route.',
    ],
    cta: 'Open Visual Guide →',
    meta: 'PDF · approved visual sequence',
    techTitle: 'Files & verification',
    tech: [
      ['ZIP', posterDownloads[1].href],
      ['SHA256', posterDownloads[2].href],
      ['Build report', posterDownloads[3].href],
    ],
    continuity: 'This is Frey’s visual grammar. It helps you read Frey independently and carry the result into another AI. A separate Cosmographic Reading uses Frey as an instrument and may be delivered as a Cosmographic Passport; this PDF is not the Passport itself.',
    alternateLabel: 'Also available in Russian · RU v1',
    alternateBody: 'Open the approved Russian visual sequence without changing the current Guide language.',
    alternateCta: 'Open RU Visual Guide →',
  },
  ru: {
    eyebrow: 'ВИЗУАЛЬНЫЙ ГИД · FREY',
    title: 'Визуальный гид Frey',
    provenance: 'APPROVED POSTER PACK v1 · RU',
    preview: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1-preview.webp',
    previewAlt: 'Превью четырёх утверждённых постеров Frey: метрика времени, грамматика чтения, Сравнение / Дельта и передача метрики ИИ.',
    pdf: '/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1-visual-guide.pdf',
    lead: 'Семь визуальных листов, которые показывают, как читать структуру Frey: от метрики и порядка чтения до Δ-сравнения и передачи контекста другому ИИ.',
    bullets: [
      'Как читать метрики во взаимосвязи, а не как отдельные числа.',
      'Как двигаться от состояния к смыслу и направлению.',
      'Как понимать Δ двух дат как структурный переход, а не рейтинг «лучше / хуже».',
      'Как различаются режимы и типы дат.',
      'Как передать контекст Frey другому ИИ без потери метода.',
    ],
    cta: 'Открыть визуальный гид →',
    meta: 'PDF · утверждённая визуальная последовательность',
    techTitle: 'Файлы и проверка',
    tech: [
      ['ZIP', ruPosterDownloads[1].href],
      ['ZIP SHA256', ruPosterDownloads[2].href],
      ['Manifest SHA256', ruPosterDownloads[3].href],
      ['Build report', ruPosterDownloads[4].href],
      ['Все страницы', ruPosterDownloads[5].href],
    ],
    continuity: 'Это визуальная грамматика инструмента Frey. Она помогает читать Frey самостоятельно и продолжать результат с ИИ. Отдельное Космографическое чтение использует Frey как инструмент и может быть доставлено как Космографический паспорт. Сам PDF не является Паспортом.',
    alternateLabel: 'Также доступно на английском · EN v5',
    alternateBody: 'Откройте утверждённую английскую визуальную последовательность, не меняя язык текущего Guide.',
    alternateCta: 'Открыть EN Visual Guide →',
  },
};

const COPY = {
  en: {
    title: 'Frey Guide · How to read, compare and carry a reading into AI',
    description: 'The complete public guide to BHRIGU Frey: one-date reading, two-date comparison, timeline, AI reading packet, approved PDFs and boundaries.',
    eyebrow: 'BHRIGU / FREY GUIDE',
    hero: 'How to read a Frey response without losing its structure',
    lead: 'Frey is a bounded temporal-reading interface. It is not a chatbot, horoscope, oracle or prediction engine. This guide explains how to read one date, compare two dates, follow nearby movement and hand the result to another AI without stripping away its method or boundaries.',
    routeTitle: 'The public route',
    routeIntro: 'The current public path remains simple. Frey remains a distinct temporal service; external systems recon is handled separately through /access.',
    routes: [
      ['/frey', '1 · Frey', 'Choose a date or temporal focus and receive the deterministic Frey result.'],
      ['/reading', '2 · Reading', 'Use the reading layer to understand structural state, tension, resonance, direction and boundary.'],
      ['/access', '3 · External systems recon', 'Paid bounded external systems recon is handled separately from Frey.'],
    ],
    readTitle: 'How to read one Frey date',
    readBody1: 'Read a Frey response as a structure, not as a command. The primary movement is raw metrics → state → meaning → direction → boundary.',
    readBody2: 'The five metrics are relational. Phase Density describes concentration of the temporal pattern; Harmonic Tension describes pressure or friction; Resonance Level describes alignment with the dominant pattern; Eclipse Proximity marks model-specific amplification proximity; Structural Stability describes the capacity to hold form under pressure.',
    readBody3: 'Do not interpret one metric in isolation. The useful reading comes from the relationship among concentration, pressure, coherence and stability.',
    compareTitle: 'Two dates · Compare and Δ Structural Difference',
    compareLead: 'One date opens a state. Two dates open a transition.',
    compareBody1: 'Choose any second date in Compare. Frey calculates both dates and shows Δ — what changed between the active date and the second date.',
    compareBody2: 'Δ is a map of structural change, not a ranking of “better” and “worse” days. Read what strengthened, weakened or stayed stable, then read the relation mode as the transition between the two structures.',
    timelineTitle: 'Timeline · Nearby dates',
    timelineBody: 'Timeline extends the selected date into nearby date-based runs so you can see movement around the reading point. It is a local movement map, not a guaranteed forecast.',
    aiTitle: 'AI Reading Packet · a prompt for another AI',
    aiLead: 'AI Export is not just a JSON snapshot. It is a portable instruction packet designed so another AI understands how Frey must be read.',
    aiBody1: 'The packet carries raw metrics, Frey interpretation, one-date or two-date mode, Δ when present, nearby timeline when present, metric semantics, method boundaries, and a detailed prompt for the receiving AI.',
    aiBody2: 'That prompt tells the receiving AI to read raw data first, preserve state → meaning → direction, interpret relations rather than isolated numbers, treat two dates as a transition rather than a better/worse ranking, keep uncertainty explicit, avoid invented causality and keep human judgment central.',
    aiBody3: 'This makes the export useful in ChatGPT, Claude, Gemini or another capable AI even when that AI has never seen Frey before. The approved guide materials below remain the deeper public reference layer.',
    aiSteps: [
      '1 · Run Frey for one date, or add a second date in Compare.',
      '2 · Open “For another AI · Reading Packet”.',
      '3 · Copy the full packet — prompt plus Frey data.',
      '4 · Paste it into another AI and add your own real-world question or context.',
      '5 · The receiving AI should separate raw data, interpretation, uncertainty and your final human decision.',
    ],
    materialsEyebrow: 'PUBLICATION MATERIALS',
    materialsTitle: 'Approved guide materials',
    materialsBody: 'These are not disposable downloads. They preserve the detailed public-safe interpretation method that helps both people and AI systems understand how Frey should be read.',
    enPackEyebrow: 'APPROVED VISUAL PACK · EN',
    enPackTitle: 'Poster Pack v5',
    enPackBody: 'English approved visual guide pack and its reproducibility files.',
    ruPackEyebrow: 'APPROVED VISUAL PACK · RU',
    ruPackTitle: 'Poster Pack v1',
    ruPackBody: 'Russian approved visual guide pack. It is also a strong explanatory prompt/reference for AI-assisted interpretation because it preserves the logic, vocabulary and reading order of Frey.',
    boundaryTitle: 'Boundary',
    boundary: 'BHRIGU / Frey is not financial, medical, legal, trading or deterministic life advice. Frey turns a temporal pattern into a readable structure; the final decision remains human.',
    support: 'Guide materials and public Frey remain distinct from the paid external systems recon available through /access.',
  },
  ru: {
    title: 'Гид Frey · Как читать, сравнивать и передавать чтение ИИ',
    description: 'Полный публичный гид BHRIGU Frey: чтение одной даты, сравнение двух дат, таймлайн, пакет для стороннего ИИ, PDF и границы метода.',
    eyebrow: 'BHRIGU / ГИД FREY',
    hero: 'Как читать ответ Frey, не теряя его структуру',
    lead: 'Frey — ограниченный интерфейс темпорального чтения. Это не чат-бот, не гороскоп, не оракул и не машина предсказаний. Этот гид объясняет, как читать одну дату, сравнивать две даты, смотреть ближайшее движение и передавать результат другому ИИ без потери метода и границ.',
    routeTitle: 'Публичный маршрут',
    routeIntro: 'Текущий публичный путь остаётся простым. Frey остаётся отдельным темпоральным сервисом; внешняя разведка систем обрабатывается отдельно через /access.',
    routes: [
      ['/frey', '1 · Frey', 'Выберите дату или временной фокус и получите детерминированный результат Frey.'],
      ['/reading', '2 · Reading', 'Читайте структурное состояние, напряжение, резонанс, направление и границу.'],
      ['/access', '3 · Внешняя разведка систем', 'Платная ограниченная внешняя разведка систем обрабатывается отдельно от Frey.'],
    ],
    readTitle: 'Как читать одну дату Frey',
    readBody1: 'Читайте ответ Frey как структуру, а не как команду. Основной порядок: исходные метрики → состояние → значение → направление → граница.',
    readBody2: 'Пять метрик работают во взаимосвязи. Phase Density показывает концентрацию временного паттерна; Harmonic Tension — давление или трение; Resonance Level — согласование с доминирующим паттерном; Eclipse Proximity — близость к модельному усилению; Structural Stability — способность структуры удерживать форму под давлением.',
    readBody3: 'Не трактуйте одну метрику отдельно. Смысл возникает из отношений между концентрацией, давлением, согласованностью и устойчивостью.',
    compareTitle: 'Две даты · Сравнение и Δ структурной разницы',
    compareLead: 'Одна дата открывает состояние. Две даты открывают переход.',
    compareBody1: 'Выберите любую вторую дату в Compare. Frey рассчитает обе даты и покажет Δ — что изменилось между активной и второй датой.',
    compareBody2: 'Δ — карта структурного изменения, а не рейтинг «лучше / хуже». Сначала смотрите, что усилилось, ослабло или осталось устойчивым, затем читайте режим связи как переход между двумя структурами.',
    timelineTitle: 'Таймлайн · Ближайшие даты',
    timelineBody: 'Таймлайн расширяет выбранную дату соседними расчётами и показывает движение вокруг точки чтения. Это локальная карта движения, а не гарантированный прогноз.',
    aiTitle: 'Пакет для ИИ · полноценный промт для стороннего чтения',
    aiLead: 'AI Export — это не просто JSON snapshot. Это переносимый инструкционный пакет, который объясняет другому ИИ, как именно нужно читать Frey.',
    aiBody1: 'Пакет переносит исходные метрики, интерпретацию Frey, режим одной или двух дат, Δ при сравнении, ближайший таймлайн при наличии, смысл метрик, методические границы и подробный промт для принимающего ИИ.',
    aiBody2: 'Промт требует сначала читать raw data, сохранять порядок состояние → значение → направление, связывать метрики между собой, трактовать две даты как переход, а не «лучше / хуже», явно показывать неопределённость, не придумывать причинность и оставлять окончательное решение человеку.',
    aiBody3: 'Поэтому пакет можно вставить в ChatGPT, Claude, Gemini или другой сильный ИИ, даже если он раньше не видел Frey. Approved материалы ниже остаются более глубоким публичным справочным слоем.',
    aiSteps: [
      '1 · Запустите Frey для одной даты или добавьте вторую дату в Compare.',
      '2 · Откройте «Для другого ИИ · Пакет чтения».',
      '3 · Скопируйте весь пакет — промт вместе с данными Frey.',
      '4 · Вставьте его в другой ИИ и добавьте свой реальный вопрос или контекст.',
      '5 · Принимающий ИИ должен отделять исходные данные, интерпретацию, неопределённость и ваше человеческое решение.',
    ],
    materialsEyebrow: 'ПУБЛИКАЦИОННЫЕ МАТЕРИАЛЫ',
    materialsTitle: 'Approved материалы Frey',
    materialsBody: 'Это не лишние загрузки. Они сохраняют подробный публично-безопасный метод трактовки, благодаря которому и человек, и ИИ лучше понимают, как правильно читать Frey.',
    enPackEyebrow: 'APPROVED VISUAL PACK · EN',
    enPackTitle: 'Poster Pack v5',
    enPackBody: 'Утверждённый английский визуальный гид и файлы воспроизводимости.',
    ruPackEyebrow: 'APPROVED VISUAL PACK · RU',
    ruPackTitle: 'Poster Pack v1',
    ruPackBody: 'Утверждённый русский визуальный гид. Он одновременно работает как сильный подробный промт/справочник для ИИ-трактовки, потому что сохраняет логику, словарь и порядок чтения Frey.',
    boundaryTitle: 'Граница',
    boundary: 'BHRIGU / Frey не является финансовой, медицинской, юридической, торговой или детерминированной жизненной рекомендацией. Frey превращает временной паттерн в читаемую структуру; окончательное решение остаётся за человеком.',
    support: 'Материалы Guide и публичный Frey остаются отдельными от платной внешней разведки систем через /access.',
  },
};

export async function getServerSideProps({ query }) {
  return { props: { locale: query.lang === 'ru' ? 'ru' : 'en' } };
}

function localeHref(path, locale) {
  if (!path.startsWith('/')) return path;
  return `${path}${path.includes('?') ? '&' : '?'}lang=${locale}`;
}

export default function FreyGuidePage({ locale }) {
  const c = COPY[locale];
  const guide = VISUAL_GUIDES[locale];
  const alternateGuide = VISUAL_GUIDES[locale === 'ru' ? 'en' : 'ru'];
  const canonical = `https://www.bhrigu.io/guide/frey?lang=${locale}`;

  return (
    <>
<main
        className="freyGuide"
        data-frey-guide="FREY_GUIDE_PUBLIC_ROUTE_V0_2"
        data-frey-guide-preservation="FREY_GUIDE_INFORMATION_PRESERVATION_V0_1"
        data-frey-downloads="FREY_GUIDE_APPROVED_DOWNLOADS_V0_1"
        data-frey-poster-pack="FREY_GUIDE_APPROVED_POSTER_PACK_V5"
        data-frey-poster-pack-ru="FREY_GUIDE_APPROVED_POSTER_PACK_RU_V1"
        lang={locale}
      >
        <section className="hero">
          <div className="heroTop">
            <p className="eyebrow">{c.eyebrow}</p>
            <a className="language" href={`/guide/frey?lang=${locale === 'ru' ? 'en' : 'ru'}`}>{locale === 'ru' ? 'EN' : 'RU'}</a>
          </div>
          <h1>{c.hero}</h1>
          <p className="lead">{c.lead}</p>
          <div className="routeLine" aria-label="BHRIGU Frey public route">
            <a href={localeHref('/frey', locale)}>/frey</a><span>→</span><a href={localeHref('/reading', locale)}>/reading</a><span>→</span><a href={localeHref('/access', locale)}>/access</a>
          </div>
        </section>

        <section className="panel">
          <h2>{c.routeTitle}</h2>
          <p>{c.routeIntro}</p>
          <div className="grid">
            {c.routes.map(([path, title, body]) => (
              <a className="card" key={path} href={localeHref(path, locale)}>
                <p className="path">{path}</p>
                <h3>{title}</h3>
                <p>{body}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="panel split" data-frey-guide-reading-protocol="one-date">
          <div>
            <p className="eyebrow">01 · ONE DATE</p>
            <h2>{c.readTitle}</h2>
            <p>{c.readBody1}</p><p>{c.readBody2}</p><p>{c.readBody3}</p>
          </div>
          <div className="metricBox">
            {['phase density', 'harmonic tension', 'resonance level', 'eclipse proximity', 'structural stability'].map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>

        <section className="panel feature" data-frey-guide-reading-protocol="two-date-compare">
          <p className="eyebrow">02 · TWO DATES</p>
          <h2>{c.compareTitle}</h2>
          <p className="featureLead">{c.compareLead}</p>
          <p>{c.compareBody1}</p><p>{c.compareBody2}</p>
          <a className="primaryAction" href={localeHref('/frey', locale)}>{locale === 'ru' ? 'Открыть Frey и выбрать вторую дату →' : 'Open Frey and choose a second date →'}</a>
        </section>

        <section className="panel feature" data-frey-guide-reading-protocol="timeline">
          <p className="eyebrow">03 · NEARBY MOVEMENT</p>
          <h2>{c.timelineTitle}</h2>
          <p>{c.timelineBody}</p>
        </section>

        <section className="panel aiPanel" data-frey-guide-ai-protocol="FREY_EXTERNAL_AI_READING_PROTOCOL_V1">
          <p className="eyebrow">04 · AI HANDOFF</p>
          <h2>{c.aiTitle}</h2>
          <p className="featureLead">{c.aiLead}</p>
          <p>{c.aiBody1}</p><p>{c.aiBody2}</p><p>{c.aiBody3}</p>
          <ol>{c.aiSteps.map((step) => <li key={step}>{step}</li>)}</ol>
          <a className="primaryAction" href={localeHref('/frey', locale)}>{locale === 'ru' ? 'Создать пакет Frey для другого ИИ →' : 'Create a Frey packet for another AI →'}</a>
        </section>

        <section
          className="panel visualGuidePanel"
          data-frey-guide-primary-visual="true"
          data-frey-guide-approved-en-pack="v5"
          data-frey-guide-approved-ru-pack="v1"
        >
          <div className="visualGuideHeader">
            <div>
              <p className="eyebrow">{guide.eyebrow}</p>
              <h2>{guide.title}</h2>
            </div>
            <p className="provenance">{guide.provenance}</p>
          </div>
          <div className="visualGuideGrid">
            <div className="previewFrame" aria-label={guide.previewAlt}>
              <img className="previewImage" src={guide.preview} alt={guide.previewAlt} loading="lazy" />
            </div>
            <div className="guideCopy">
              <p className="visualLead">{guide.lead}</p>
              <ul className="valueList">{guide.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
              <a className="visualGuideCta" href={guide.pdf} target="_blank" rel="noreferrer">{guide.cta}</a>
              <p className="guideMeta">{guide.meta}</p>
            </div>
          </div>
          <p className="continuityNote">{guide.continuity}</p>
          <details className="techDetails">
            <summary>{guide.techTitle}</summary>
            <div className="techLinks">{guide.tech.map(([label, href]) => <a href={href} key={href}>{label}</a>)}</div>
          </details>
        </section>

        <section className="panel referencePanel" data-frey-guide-approved-core-materials="true">
          <p className="eyebrow">{c.materialsEyebrow}</p>
          <h2>{locale === 'ru' ? 'Справочные материалы' : 'Reference materials'}</h2>
          <p>{c.materialsBody}</p>
          <div className="referenceLinks">{coreDownloads.map((item) => <a className="referenceLink" href={item.href} key={item.id}>{item.label}</a>)}</div>
        </section>

        <section className="panel alternateGuide" data-frey-guide-alternate-visual="true">
          <p className="eyebrow">{guide.alternateLabel}</p>
          <h2>{alternateGuide.title}</h2>
          <p>{guide.alternateBody}</p>
          <a className="alternateLink" href={alternateGuide.pdf} target="_blank" rel="noreferrer">{guide.alternateCta}</a>
        </section>

        <section className="boundary">
          <h2>{c.boundaryTitle}</h2>
          <p>{c.boundary}</p>
          <p className="quiet">{c.support}</p>
        </section>

        <PublicSupportRoute locale={locale} surface="guide" />
      </main>

      <style jsx>{`
        .freyGuide{min-height:100vh;padding:72px 22px 130px;color:#f5efe2;background:radial-gradient(circle at 20% 10%,rgba(226,180,92,.18),transparent 32%),radial-gradient(circle at 80% 0%,rgba(75,124,255,.16),transparent 30%),linear-gradient(145deg,#070a12 0%,#10131d 46%,#06070b 100%);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.hero,.panel,.boundary{width:min(1040px,100%);margin:0 auto 24px;border:1px solid rgba(226,180,92,.24);border-radius:28px;background:rgba(9,12,20,.72);box-shadow:0 24px 80px rgba(0,0,0,.32);backdrop-filter:blur(18px)}.hero{padding:48px}.panel,.boundary{padding:34px}.heroTop{display:flex;justify-content:space-between;gap:20px;align-items:center}.language{color:#f7d08a;text-decoration:none;border:1px solid rgba(226,180,92,.26);border-radius:999px;padding:8px 11px;font-size:.78rem}.eyebrow,.path{margin:0 0 12px;color:#d8ad62;font-size:.78rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase}h1,h2,h3,p{margin-top:0}h1{max-width:880px;margin-bottom:18px;font-size:clamp(2.4rem,7vw,5.8rem);line-height:.95;letter-spacing:-.07em}h2{margin-bottom:16px;font-size:clamp(1.6rem,4vw,2.6rem);letter-spacing:-.04em}h3{margin-bottom:10px;font-size:1.2rem}p,li{color:rgba(245,239,226,.78);font-size:1rem;line-height:1.75}.lead,.featureLead{max-width:820px;font-size:clamp(1.08rem,2.2vw,1.38rem)}.routeLine{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-top:30px;font-size:clamp(1.25rem,4vw,2rem);font-weight:800}.routeLine a,.download,.primaryAction{color:#f7d08a;text-decoration:none}.routeLine span{color:rgba(245,239,226,.46)}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:22px}.card{min-height:210px;padding:24px;border:1px solid rgba(245,239,226,.12);border-radius:22px;background:rgba(255,255,255,.045);color:inherit;text-decoration:none}.split{display:grid;grid-template-columns:1.25fr .75fr;gap:28px;align-items:center}.metricBox,.downloads{display:flex;flex-wrap:wrap;gap:10px}.metricBox span,.download{border:1px solid rgba(226,180,92,.24);border-radius:999px;padding:10px 14px;background:rgba(226,180,92,.08);font-size:.92rem}.feature{border-color:rgba(125,166,255,.22)}.aiPanel{border-color:rgba(125,166,255,.42);background:linear-gradient(145deg,rgba(15,24,42,.82),rgba(9,12,20,.76))}.aiPanel ol{margin:22px 0;padding-left:22px}.primaryAction{display:inline-flex;margin-top:10px;padding:12px 16px;border:1px solid rgba(226,180,92,.3);border-radius:999px;background:rgba(226,180,92,.07);font-weight:700}.visualGuidePanel{position:relative;overflow:hidden;border-color:rgba(226,180,92,.48);background:radial-gradient(circle at 20% 30%,rgba(226,180,92,.12),transparent 38%),linear-gradient(145deg,rgba(9,12,20,.9),rgba(10,16,28,.86))}.visualGuidePanel:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 0 72%,rgba(96,176,220,.045) 100%)}.visualGuideHeader{position:relative;display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:24px}.visualGuideHeader h2{margin-bottom:0}.provenance{margin:3px 0 0;color:rgba(247,208,138,.62);font-size:.72rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;text-align:right}.visualGuideGrid{position:relative;display:grid;grid-template-columns:minmax(0,1.27fr) minmax(280px,1fr);gap:30px;align-items:center}.previewFrame{padding:10px;border:1px solid rgba(226,180,92,.28);border-radius:22px;background:#070a10;box-shadow:0 24px 70px rgba(0,0,0,.34),0 0 46px rgba(226,180,92,.045)}.previewImage{display:block;width:100%;height:auto;border-radius:14px}.visualLead{font-size:1.08rem;color:rgba(245,239,226,.88)}.valueList{margin:18px 0 22px;padding-left:20px}.valueList li{margin:7px 0;color:rgba(245,239,226,.74);line-height:1.55}.visualGuideCta{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:12px 20px;border:1px solid rgba(247,208,138,.52);border-radius:999px;color:#130f08;background:linear-gradient(135deg,#f0cf82,#c99d4d);box-shadow:0 0 0 1px rgba(247,208,138,.08),0 0 34px rgba(226,180,92,.18);font-weight:800;text-decoration:none}.guideMeta{margin:10px 0 0;color:rgba(245,239,226,.48);font-size:.82rem}.continuityNote{position:relative;margin:26px 0 0;padding-top:20px;border-top:1px solid rgba(245,239,226,.09);color:rgba(245,239,226,.6);font-size:.9rem}.techDetails{position:relative;margin-top:16px;padding-top:14px;border-top:1px solid rgba(245,239,226,.07)}.techDetails summary{cursor:pointer;color:rgba(245,239,226,.58);font-size:.88rem;font-weight:700}.techLinks,.referenceLinks{display:flex;flex-wrap:wrap;gap:12px 18px;margin-top:14px}.techLinks a,.referenceLink,.alternateLink{color:#d8ad62;text-decoration:none;border-bottom:1px solid rgba(216,173,98,.4);font-size:.88rem}.referencePanel{border-color:rgba(245,239,226,.12);background:rgba(9,12,20,.56)}.alternateGuide{border-color:rgba(125,166,255,.2);background:rgba(10,14,23,.62)}.alternateGuide h2{font-size:1.55rem;margin-bottom:10px}.alternateGuide p:not(.eyebrow){max-width:760px}.boundary{border-color:rgba(125,166,255,.28)}.quiet{color:rgba(245,239,226,.52);font-size:.9rem}@media(max-width:820px){.freyGuide{padding:28px 14px 110px}.hero,.panel,.boundary{border-radius:22px;padding:24px}.grid,.split,.visualGuideGrid{grid-template-columns:1fr}.card{min-height:0}.downloads{display:grid}.download{border-radius:16px}.heroTop{align-items:flex-start}.visualGuideHeader{display:block}.provenance{text-align:left;margin-top:8px}.visualGuideGrid{gap:22px}.previewFrame{padding:7px;border-radius:18px}.visualGuideCta{width:100%}.techLinks,.referenceLinks{display:grid;gap:12px}.techLinks a,.referenceLink{width:max-content;max-width:100%}}
      `}</style>
    </>
  );
}
