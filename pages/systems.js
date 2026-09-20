import Head from "next/head";
import styles from "./systems.module.css";

const PAGE_META = {
  en: {
    title: "Φ Research Systems | AI, Ephemerides & Temporal Evidence",
    description: "Research systems for AI agents, ephemerides, astrology architecture, temporal evidence, Bitcoin state, verification and information architecture.",
  },
  ru: {
    title: "Φ Research Systems | AI, эфемериды и темпоральные доказательства",
    description: "Исследовательские системы для AI-агентов, эфемерид, архитектуры астрологии, темпоральных доказательств, состояния Bitcoin, верификации и информационной архитектуры.",
  },
};

const PROOF_ROUTES = {
  temporal: "https://github.com/AiBhrigu/bhrigu-bitcoin-research-state-api",
  ephemerides: "https://www.bhrigu.io/ephemerides?lang=en",
  astro: "https://www.bhrigu.io/astro?lang=en",
  btc: "https://www.bhrigu.io/?lang=en",
  entropy: "https://github.com/captainchapster/Entropy32-Plus/blob/a69f95c0098d25b762845d3b2b4751ef412b00a0/README.md",
  phi: "https://github.com/AiBhrigu",
};

const COMMERCIAL_ROUTES = {
  recon: "https://www.bhrigu.io/access?lang=en",
  frey: "https://www.bhrigu.io/access?offer=frey-personal&lang=en",
  field: "https://www.bhrigu.io/field?lang=en",
};

const SYSTEM_CLASSES = [
  {
    number: "01",
    kind: "ai",
    title: "AI & Persistent Intelligence",
    description: "AI agents, conversational systems, MCP/tool interfaces, research interfaces, context and memory architecture, evaluation and continuity-aware state.",
    bridge: "AI agents · persistent AI · AI memory architecture · MCP · conversational AI · agent evaluation",
  },
  {
    number: "02",
    kind: "astronomy",
    title: "Astronomy & Ephemerides",
    description: "Source-bound astronomical computation, planetary positions, motion, aspect geometry, stations, ingresses, temporal archives and provenance.",
    evidence: "BHRIGU currently publishes a daily source-bound ephemeris with planetary positions, motion, aspect relations, monthly archive bindings, engine identity, commit and dataset hash.",
    bridge: "ephemeris software · planetary calculations · Swiss Ephemeris · astronomical data · aspect calculations",
  },
  {
    number: "03",
    kind: "astrology",
    title: "Astrology Systems",
    description: "Research architecture that keeps astronomical observation, astrological semantics, interpretation and uncertainty as distinct layers.",
    evidence: "The current Astro Research Atlas explicitly separates accepted, reference, research and protected/candidate layers and does not convert research mechanisms into claims of proven market causality.",
    bridge: "astrology software architecture · astrology research systems · transit systems · aspect engines · astrology AI",
  },
  {
    number: "04",
    kind: "temporal",
    title: "Temporal / Prospective Systems",
    description: "Systems that preserve previous state, current state and change across time — then represent possible future paths without silently turning scenarios into certainty.",
    evidence: "Public Bitcoin temporal evidence already preserves precommitted future windows and later compares them with observed reality without rewriting the original baseline.",
    bridge: "temporal intelligence · state tracking · scenario tracking · prospective systems · longitudinal AI",
  },
  {
    number: "05",
    kind: "evidence",
    title: "Scientific Evidence & Verification",
    description: "Provenance, version binding, deterministic validation, reproducible evidence records, explicit source authority and visible failure states.",
    evidence: "The current public Bitcoin evidence stack exposes deterministic verification, source dependencies, commit binding and fail-closed source behavior.",
    bridge: "evidence provenance · deterministic verification · reproducible research systems · AI evaluation · source verification",
  },
  {
    number: "06",
    kind: "btc",
    title: "Bitcoin / Market State Systems",
    description: "Evidence-linked Bitcoin research combining verified state, change memory, temporal context, source boundaries and bounded interpretation.",
    evidence: "BTC is currently the first and only proven public live market corridor; expansion to additional markets is explicitly held outside the proven claim.",
    bridge: "Bitcoin research · BTC market state · Bitcoin research API · temporal evidence · market-state intelligence",
  },
  {
    number: "07",
    kind: "information",
    title: "Information & Product Architecture",
    description: "System maps, information hierarchy, public/protected boundaries, research interfaces, machine-readable discovery surfaces and evidence-linked product architecture.",
    evidence: "The current public system map already separates market, temporal, interpretation/depth and commercial boundary paths rather than collapsing them into one navigation object.",
    bridge: "information architecture · research portal architecture · product system architecture · AI-readable websites · evidence-linked UX",
  },
];

const CAPABILITY_GROUPS = [
  {
    title: "AI / AGENT SYSTEMS",
    items: [
      {
        status: "PROVEN",
        title: "Read-only agent interfaces and MCP research tools.",
        body: "Public proof includes Bitcoin state endpoints, temporal-window interfaces, MCP tools, explicit source failure behavior and a no-trading/no-wallet authority boundary.",
      },
      {
        status: "PROVEN",
        title: "Machine-readable public discovery surfaces.",
        body: "The public Φ profile exposes llms.txt, sitemap and robots discovery routes, while the Founding Field defines machine-readable public registry objects.",
      },
      {
        status: "BOUNDED",
        title: "Persistent / continuity-aware intelligence.",
        body: "Public proof exists for preserving subject, accepted state, evidence boundaries, temporal windows and continuation context. This must not be expanded into a claim of unlimited autonomous memory or universal cross-session persistence.",
      },
    ],
  },
  {
    title: "ASTRONOMY / EPHEMERIDES",
    items: [
      { status: "PROVEN", title: "Source-bound planetary ephemerides." },
      { status: "PROVEN", title: "Planetary longitude and motion state." },
      { status: "PROVEN", title: "Major aspect geometry with applying / separating state." },
      { status: "PROVEN", title: "Published station and ingress context." },
      {
        status: "PROVEN",
        title: "Version, engine, repository, commit and dataset-hash provenance.",
        body: "These objects are directly present in the current Ephemerides public surface.",
      },
      {
        status: "BOUNDED",
        title: "Eclipse computation.",
        body: "Reference eclipse context is public; the Astro Atlas explicitly marks canonical event geometry as separately bounded rather than fully activated publicly.",
      },
    ],
  },
  {
    title: "ASTROLOGY SYSTEMS",
    items: [
      { status: "PROVEN", title: "Separation of astronomical observation from interpretation." },
      { status: "PROVEN", title: "Aspect-phase research semantics." },
      { status: "PROVEN", title: "Research-layer taxonomy with explicit accepted / reference / research / protected states." },
      {
        status: "BOUNDED",
        title: "Astrology × market research.",
        body: "BTC × Astro exists as active bounded research, but this does not establish astrological market causality.",
      },
      {
        status: "BOUNDED",
        title: "General astrology product architecture.",
        body: "The system has relevant research and temporal interpretation surfaces, but /systems must not imply that every conventional astrology engine is currently a proven production capability.",
      },
    ],
  },
  {
    title: "TEMPORAL / PROSPECTIVE SYSTEMS",
    items: [
      { status: "PROVEN", title: "Previous-state versus current-state comparison." },
      { status: "PROVEN", title: "Immutable precommit → later observation." },
      { status: "PROVEN", title: "Declared temporal windows." },
      {
        status: "PROVEN",
        title: "Conditions that strengthen, weaken or invalidate an interpretation.",
        body: "The Bitcoin research stack preserves precommitted windows and the BTC public corridor exposes explicit forward conditions rather than deterministic prediction.",
      },
      {
        status: "BOUNDED",
        title: "Prospective intelligence.",
        valid: ["possible paths", "conditions", "constraints", "invalidation boundaries"],
        invalid: ["guaranteed prediction", "certain future state", "predictive superiority"],
      },
    ],
  },
  {
    title: "SCIENTIFIC EVIDENCE / VERIFICATION",
    items: [
      { status: "PROVEN", title: "Source/provenance binding." },
      { status: "PROVEN", title: "Version-pinned evidence objects." },
      { status: "PROVEN", title: "Deterministic validation surfaces." },
      { status: "PROVEN", title: "Explicit failure state rather than silent source substitution." },
      {
        status: "PROVEN",
        title: "External read-only defect investigation capable of producing an actionable repair.",
        body: "Independent proof exists: Entropy32 Plus publicly credits Cosmographer / BHRIGU with identifying the overlapping interval-comparison defect, and the project changed to non-overlapping interval pairs.",
      },
    ],
  },
  {
    title: "BITCOIN / MARKET SYSTEMS",
    items: [
      { status: "PROVEN", title: "BTC evidence-linked public research corridor." },
      { status: "PROVEN", title: "Verified current state + change memory." },
      { status: "PROVEN", title: "Protocol-time and market-time evidence." },
      { status: "PROVEN", title: "Bounded expectation evidence." },
      { status: "PROVEN", title: "Visible source and causality boundaries." },
      {
        status: "BOUNDED",
        title: "Wider crypto / market systems.",
        body: "Static and research examples exist beyond BTC, but BTC remains the only proven public live corridor.",
      },
    ],
  },
  {
    title: "INFORMATION / PRODUCT ARCHITECTURE",
    items: [
      { status: "PROVEN", title: "System mapping." },
      { status: "PROVEN", title: "Public / protected boundary architecture." },
      { status: "PROVEN", title: "Research-interface architecture." },
      {
        status: "PROVEN",
        title: "Human + agent entry contracts.",
        body: "The existing commercial recon already defines system map, evidence, findings, repair blueprint and strict read-only/public-protected boundaries.",
      },
      {
        status: "BOUNDED",
        title: "Full product development.",
        body: "Architecture capability must not be converted into an implied offer to build any arbitrary product end-to-end.",
      },
    ],
  },
];

const PROOF_OBJECTS = [
  {
    number: "01",
    className: "AI / MCP / Temporal Evidence",
    title: "BHRIGU Bitcoin Temporal Evidence",
    description: "Read-only HTTP + MCP research capability with temporal windows, deterministic verification, public source dependencies and explicit authority boundaries.",
    cta: "Inspect repository ↗",
    status: "PROVEN",
    href: PROOF_ROUTES.temporal,
  },
  {
    number: "02",
    className: "Astronomy / Ephemerides",
    title: "BHRIGU Ephemerides",
    description: "Daily source-bound planetary state with motion, relations, archive context and reproducible provenance.",
    cta: "Open Ephemerides →",
    status: "PROVEN",
    href: PROOF_ROUTES.ephemerides,
  },
  {
    number: "03",
    className: "Astro Research Architecture",
    title: "Astro Research Atlas",
    description: "Public map separating sky/time evidence, research engines, Bitcoin × Astro research and protected research depth.",
    cta: "Open Astro Research Atlas →",
    status: "PROVEN / BOUNDED BY MODULE",
    href: PROOF_ROUTES.astro,
  },
  {
    number: "04",
    className: "Bitcoin State + Change",
    title: "BTC Field / Market Cosmographer",
    description: "Evidence-linked public corridor for verified Bitcoin state, change, temporal context, conditions and visible source boundaries.",
    cta: "Open BTC Field →",
    status: "PROVEN",
    href: PROOF_ROUTES.btc,
  },
  {
    number: "05",
    className: "External System Finding",
    title: "Entropy32 Plus",
    description: "Independent external repository adopted a BHRIGU/Cosmographer finding concerning overlapping entropy comparisons and publicly documented the change.",
    cta: "Inspect upstream evidence ↗",
    status: "PROVEN EXTERNAL ADOPTION",
    href: PROOF_ROUTES.entropy,
  },
  {
    number: "06",
    className: "Public Architecture Layer",
    title: "AiBhrigu / Φ Research Systems",
    description: "Public-safe system hierarchy, selected repositories, proof surfaces, machine-readable discovery routes and protected-IP boundary.",
    cta: "Inspect public proof ↗",
    status: "PROVEN PUBLIC AUTHORITY SURFACE",
    href: PROOF_ROUTES.phi,
  },
];

const METHOD = [
  ["01", "Scope", "Define the system, question and authority boundary."],
  ["02", "State", "Establish what is accepted as current and what earlier state can legitimately be compared."],
  ["03", "Evidence", "Bind observations to source, time and provenance."],
  ["04", "Change", "Identify meaningful deltas without mixing incompatible states."],
  ["05", "Verify", "Test claims, failure conditions and reproducibility."],
  ["06", "Boundary", "Keep observation, interpretation, uncertainty and protected mechanism distinct."],
  ["07", "Output", "Expose the useful result and its evidence without exposing protected mechanics."],
];

const BOUNDARIES = [
  "Astronomical observation is not automatically astrological interpretation.",
  "Astrological research is not proof of physical market causality.",
  "A prospective scenario is not a guaranteed forecast.",
  "Bitcoin research is not financial advice, a trading signal or execution authority.",
  "Persistent state does not imply unlimited personal memory, unattended autonomy or universal account history.",
  "A public interface does not imply access to ORION internals.",
  "A public proof repository does not expose private prompts, evaluators, corpora, unpublished research or protected mechanisms.",
  "A capability class does not automatically mean a commercial service is available for that capability.",
];

const COMMERCIAL = [
  {
    letter: "A",
    title: "Φ External Systems Recon",
    price: "USD 300",
    intro: ["One bounded system.", "Read-only investigation."],
    receive: ["System map", "3 highest-impact findings", "Evidence for each finding", "One exact repair blueprint"],
    cta: "Open External Systems Recon →",
    boundary: "The live object explicitly excludes full product development, penetration testing, trading execution and unbounded redesign.",
    href: COMMERCIAL_ROUTES.recon,
  },
  {
    letter: "B",
    title: "Frey Personal",
    price: "USD 79",
    intro: ["One subject.", "One meaningful temporal horizon.", "One complete Cosmographic Reading."],
    passport: true,
    cta: "Open Frey Personal →",
    boundary: "The current object keeps uncertainty visible and explicitly excludes guaranteed outcomes and medical, legal or financial advice.",
    href: COMMERCIAL_ROUTES.frey,
  },
  {
    letter: "C",
    title: "BHRIGU AI Founding Field",
    price: "USD 99 · one-time",
    intro: ["One public founding coordinate for an agent, model, project or product."],
    attributes: ["Public.", "Timestamped.", "Machine-readable."],
    cta: "Open AI Founding Field →",
    boundary: "The live field explicitly makes no promise of traffic, ranking or endorsement.",
    href: COMMERCIAL_ROUTES.field,
  },
];

const CANONICAL_DESCRIPTION = "Φ Research Systems is a research and systems field working across AI and persistent intelligence, astronomy and ephemerides, astrology research systems, temporal and prospective systems, evidence verification, Bitcoin market-state research, and information architecture. Its public systems preserve explicit boundaries between source, observation, state, change, interpretation, uncertainty and protected mechanism. BHRIGU is a public product and research surface. ORION remains protected analytical depth. AiBhrigu is a public proof namespace.";

const RU_TEXT = new Map([
  ["AI & Persistent Intelligence", "AI и интеллект с непрерывностью состояния"],
  ["AI agents, conversational systems, MCP/tool interfaces, research interfaces, context and memory architecture, evaluation and continuity-aware state.", "AI-агенты, диалоговые системы, интерфейсы MCP и инструментов, исследовательские интерфейсы, архитектура контекста и памяти, оценка и состояние с сохранением непрерывности."],
  ["AI agents · persistent AI · AI memory architecture · MCP · conversational AI · agent evaluation", "AI-агенты · AI с сохраняемым состоянием · архитектура памяти AI · MCP · диалоговый AI · оценка агентов"],
  ["Astronomy & Ephemerides", "Астрономия и эфемериды"],
  ["Source-bound astronomical computation, planetary positions, motion, aspect geometry, stations, ingresses, temporal archives and provenance.", "Астрономические вычисления, привязанные к источникам; положения и движение планет, геометрия аспектов, станции, ингрессии, временные архивы и происхождение данных."],
  ["BHRIGU currently publishes a daily source-bound ephemeris with planetary positions, motion, aspect relations, monthly archive bindings, engine identity, commit and dataset hash.", "Сейчас BHRIGU публикует ежедневные эфемериды, привязанные к источникам: положения и движение планет, отношения аспектов, связи с месячным архивом, идентификатор вычислительного движка, commit и хеш набора данных."],
  ["ephemeris software · planetary calculations · Swiss Ephemeris · astronomical data · aspect calculations", "программы эфемерид · расчёты положений планет · Swiss Ephemeris · астрономические данные · расчёты аспектов"],
  ["Astrology Systems", "Системы астрологии"],
  ["Research architecture that keeps astronomical observation, astrological semantics, interpretation and uncertainty as distinct layers.", "Исследовательская архитектура, в которой астрономическое наблюдение, астрологическая семантика, интерпретация и неопределённость остаются раздельными слоями."],
  ["The current Astro Research Atlas explicitly separates accepted, reference, research and protected/candidate layers and does not convert research mechanisms into claims of proven market causality.", "Текущий Astro Research Atlas явно разделяет принятый, справочный, исследовательский и защищённый/кандидатный слои и не превращает исследовательские механизмы в утверждения о доказанной рыночной причинности."],
  ["astrology software architecture · astrology research systems · transit systems · aspect engines · astrology AI", "архитектура программ астрологии · исследовательские системы астрологии · системы транзитов · движки аспектов · AI для астрологии"],
  ["Temporal / Prospective Systems", "Темпоральные / проспективные системы"],
  ["Systems that preserve previous state, current state and change across time — then represent possible future paths without silently turning scenarios into certainty.", "Системы, сохраняющие предыдущее состояние, текущее состояние и изменение во времени, а затем представляющие возможные будущие траектории, не превращая незаметно сценарии в определённость."],
  ["Public Bitcoin temporal evidence already preserves precommitted future windows and later compares them with observed reality without rewriting the original baseline.", "Публичные темпоральные доказательства Bitcoin уже сохраняют заранее зафиксированные будущие окна, а затем сопоставляют их с наблюдаемой реальностью, не переписывая исходную базовую линию."],
  ["temporal intelligence · state tracking · scenario tracking · prospective systems · longitudinal AI", "темпоральный интеллект · отслеживание состояния · отслеживание сценариев · проспективные системы · продольный AI-анализ"],
  ["Scientific Evidence & Verification", "Научные доказательства и верификация"],
  ["Provenance, version binding, deterministic validation, reproducible evidence records, explicit source authority and visible failure states.", "Происхождение данных, привязка версий, детерминированная валидация, воспроизводимые записи доказательств, явный авторитет источника и видимые состояния отказа."],
  ["The current public Bitcoin evidence stack exposes deterministic verification, source dependencies, commit binding and fail-closed source behavior.", "Текущий публичный стек доказательств Bitcoin показывает детерминированную верификацию, зависимости от источников, привязку к commit и закрытое при отказе поведение источника."],
  ["evidence provenance · deterministic verification · reproducible research systems · AI evaluation · source verification", "происхождение доказательств · детерминированная верификация · воспроизводимые исследовательские системы · оценка AI · проверка источников"],
  ["Bitcoin / Market State Systems", "Системы состояния Bitcoin / рынка"],
  ["Evidence-linked Bitcoin research combining verified state, change memory, temporal context, source boundaries and bounded interpretation.", "Исследование Bitcoin, связанное с доказательствами и объединяющее проверенное состояние, память изменений, темпоральный контекст, границы источников и ограниченную интерпретацию."],
  ["BTC is currently the first and only proven public live market corridor; expansion to additional markets is explicitly held outside the proven claim.", "Сейчас BTC — первый и единственный доказанный публичный живой рыночный коридор; расширение на другие рынки явно находится за пределами доказанного утверждения."],
  ["Bitcoin research · BTC market state · Bitcoin research API · temporal evidence · market-state intelligence", "исследование Bitcoin · состояние рынка BTC · исследовательский API Bitcoin · темпоральные доказательства · интеллект состояния рынка"],
  ["Information & Product Architecture", "Информационная и продуктовая архитектура"],
  ["System maps, information hierarchy, public/protected boundaries, research interfaces, machine-readable discovery surfaces and evidence-linked product architecture.", "Карты систем, информационная иерархия, публичные/защищённые границы, исследовательские интерфейсы, машиночитаемые поверхности обнаружения и продуктовая архитектура, связанная с доказательствами."],
  ["The current public system map already separates market, temporal, interpretation/depth and commercial boundary paths rather than collapsing them into one navigation object.", "Текущая публичная карта системы уже разделяет рыночный путь, темпоральный путь, путь интерпретации/глубины и коммерческую границу, не сводя их к одному навигационному объекту."],
  ["information architecture · research portal architecture · product system architecture · AI-readable websites · evidence-linked UX", "информационная архитектура · архитектура исследовательских порталов · архитектура продуктовых систем · сайты, читаемые AI · UX, связанный с доказательствами"],
  ["AI / AGENT SYSTEMS", "AI / АГЕНТНЫЕ СИСТЕМЫ"],
  ["Read-only agent interfaces and MCP research tools.", "Интерфейсы агентов только для чтения и исследовательские инструменты MCP."],
  ["Public proof includes Bitcoin state endpoints, temporal-window interfaces, MCP tools, explicit source failure behavior and a no-trading/no-wallet authority boundary.", "Публичные доказательства включают конечные точки состояния Bitcoin, интерфейсы темпоральных окон, инструменты MCP, явное поведение при отказе источника и границу полномочий без торговли и доступа к кошельку."],
  ["Machine-readable public discovery surfaces.", "Машиночитаемые публичные поверхности обнаружения."],
  ["The public Φ profile exposes llms.txt, sitemap and robots discovery routes, while the Founding Field defines machine-readable public registry objects.", "Публичный профиль Φ открывает маршруты обнаружения llms.txt, sitemap и robots, а Founding Field определяет машиночитаемые объекты публичного реестра."],
  ["Persistent / continuity-aware intelligence.", "Интеллект с сохраняемым состоянием и непрерывностью."],
  ["Public proof exists for preserving subject, accepted state, evidence boundaries, temporal windows and continuation context. This must not be expanded into a claim of unlimited autonomous memory or universal cross-session persistence.", "Публичные доказательства подтверждают сохранение объекта, принятого состояния, границ доказательств, темпоральных окон и контекста продолжения. Это нельзя расширять до утверждения о неограниченной автономной памяти или универсальной непрерывности между сессиями."],
  ["ASTRONOMY / EPHEMERIDES", "АСТРОНОМИЯ / ЭФЕМЕРИДЫ"],
  ["Source-bound planetary ephemerides.", "Планетные эфемериды, привязанные к источникам."],
  ["Planetary longitude and motion state.", "Долгота планет и состояние движения."],
  ["Major aspect geometry with applying / separating state.", "Геометрия мажорных аспектов с состоянием схождения / расхождения."],
  ["Published station and ingress context.", "Опубликованный контекст станций и ингрессий."],
  ["Version, engine, repository, commit and dataset-hash provenance.", "Происхождение версии, движка, репозитория, commit и хеша набора данных."],
  ["These objects are directly present in the current Ephemerides public surface.", "Эти объекты непосредственно присутствуют на текущей публичной поверхности Ephemerides."],
  ["Eclipse computation.", "Расчёт затмений."],
  ["Reference eclipse context is public; the Astro Atlas explicitly marks canonical event geometry as separately bounded rather than fully activated publicly.", "Справочный контекст затмений публичен; Astro Atlas явно отмечает каноническую геометрию событий как отдельно ограниченную, а не полностью активированную публично."],
  ["ASTROLOGY SYSTEMS", "СИСТЕМЫ АСТРОЛОГИИ"],
  ["Separation of astronomical observation from interpretation.", "Отделение астрономического наблюдения от интерпретации."],
  ["Aspect-phase research semantics.", "Исследовательская семантика фаз аспектов."],
  ["Research-layer taxonomy with explicit accepted / reference / research / protected states.", "Таксономия исследовательских слоёв с явными состояниями: принятое / справочное / исследовательское / защищённое."],
  ["Astrology × market research.", "Исследование астрологии × рынка."],
  ["BTC × Astro exists as active bounded research, but this does not establish astrological market causality.", "BTC × Astro существует как активное ограниченное исследование, но это не устанавливает астрологическую причинность рынка."],
  ["General astrology product architecture.", "Общая продуктовая архитектура астрологии."],
  ["The system has relevant research and temporal interpretation surfaces, but /systems must not imply that every conventional astrology engine is currently a proven production capability.", "В системе есть соответствующие исследовательские поверхности и поверхности темпоральной интерпретации, но /systems не должна подразумевать, что каждый традиционный астрологический движок уже является доказанной производственной возможностью."],
  ["TEMPORAL / PROSPECTIVE SYSTEMS", "ТЕМПОРАЛЬНЫЕ / ПРОСПЕКТИВНЫЕ СИСТЕМЫ"],
  ["Previous-state versus current-state comparison.", "Сопоставление предыдущего и текущего состояния."],
  ["Immutable precommit → later observation.", "Неизменяемая предварительная фиксация → последующее наблюдение."],
  ["Declared temporal windows.", "Заявленные темпоральные окна."],
  ["Conditions that strengthen, weaken or invalidate an interpretation.", "Условия, которые усиливают, ослабляют или делают интерпретацию недействительной."],
  ["The Bitcoin research stack preserves precommitted windows and the BTC public corridor exposes explicit forward conditions rather than deterministic prediction.", "Исследовательский стек Bitcoin сохраняет заранее зафиксированные окна, а публичный коридор BTC показывает явные будущие условия вместо детерминированного предсказания."],
  ["Prospective intelligence.", "Проспективный интеллект."],
  ["possible paths", "возможные траектории"],
  ["conditions", "условия"],
  ["constraints", "ограничения"],
  ["invalidation boundaries", "границы недействительности"],
  ["guaranteed prediction", "гарантированное предсказание"],
  ["certain future state", "достоверно известное будущее состояние"],
  ["predictive superiority", "превосходство в прогнозировании"],
  ["SCIENTIFIC EVIDENCE / VERIFICATION", "НАУЧНЫЕ ДОКАЗАТЕЛЬСТВА / ВЕРИФИКАЦИЯ"],
  ["Source/provenance binding.", "Привязка источника и происхождения данных."],
  ["Version-pinned evidence objects.", "Объекты доказательств, закреплённые за версией."],
  ["Deterministic validation surfaces.", "Поверхности детерминированной валидации."],
  ["Explicit failure state rather than silent source substitution.", "Явное состояние отказа вместо незаметной подмены источника."],
  ["External read-only defect investigation capable of producing an actionable repair.", "Внешнее исследование дефекта только для чтения, способное привести к применимому исправлению."],
  ["Independent proof exists: Entropy32 Plus publicly credits Cosmographer / BHRIGU with identifying the overlapping interval-comparison defect, and the project changed to non-overlapping interval pairs.", "Существует независимое доказательство: Entropy32 Plus публично указывает Cosmographer / BHRIGU как источник выявления дефекта сравнения перекрывающихся интервалов; после этого проект перешёл к неперекрывающимся парам интервалов."],
  ["BITCOIN / MARKET SYSTEMS", "BITCOIN / РЫНОЧНЫЕ СИСТЕМЫ"],
  ["BTC evidence-linked public research corridor.", "Публичный исследовательский коридор BTC, связанный с доказательствами."],
  ["Verified current state + change memory.", "Проверенное текущее состояние + память изменений."],
  ["Protocol-time and market-time evidence.", "Доказательства времени протокола и рыночного времени."],
  ["Bounded expectation evidence.", "Доказательства ограниченных ожиданий."],
  ["Visible source and causality boundaries.", "Видимые границы источников и причинности."],
  ["Wider crypto / market systems.", "Более широкие crypto / рыночные системы."],
  ["Static and research examples exist beyond BTC, but BTC remains the only proven public live corridor.", "За пределами BTC существуют статические и исследовательские примеры, однако BTC остаётся единственным доказанным публичным живым коридором."],
  ["INFORMATION / PRODUCT ARCHITECTURE", "ИНФОРМАЦИОННАЯ / ПРОДУКТОВАЯ АРХИТЕКТУРА"],
  ["System mapping.", "Картирование систем."],
  ["Public / protected boundary architecture.", "Архитектура публичных / защищённых границ."],
  ["Research-interface architecture.", "Архитектура исследовательских интерфейсов."],
  ["Human + agent entry contracts.", "Контракты входа для человека + агента."],
  ["The existing commercial recon already defines system map, evidence, findings, repair blueprint and strict read-only/public-protected boundaries.", "Существующий коммерческий Recon уже определяет карту системы, доказательства, выводы, blueprint исправления и строгие границы: только для чтения / публичное и защищённое."],
  ["Full product development.", "Полная разработка продукта."],
  ["Architecture capability must not be converted into an implied offer to build any arbitrary product end-to-end.", "Архитектурную возможность нельзя превращать в подразумеваемое предложение создать любой произвольный продукт от начала до конца."],
  ["AI / MCP / Temporal Evidence", "AI / MCP / темпоральные доказательства"],
  ["Read-only HTTP + MCP research capability with temporal windows, deterministic verification, public source dependencies and explicit authority boundaries.", "Исследовательская возможность HTTP + MCP только для чтения, с темпоральными окнами, детерминированной верификацией, публичными зависимостями от источников и явными границами полномочий."],
  ["Inspect repository ↗", "Открыть репозиторий ↗"],
  ["Astronomy / Ephemerides", "Астрономия / эфемериды"],
  ["Daily source-bound planetary state with motion, relations, archive context and reproducible provenance.", "Ежедневное состояние планет, привязанное к источникам, с движением, отношениями, архивным контекстом и воспроизводимым происхождением данных."],
  ["Open Ephemerides →", "Открыть Ephemerides →"],
  ["Astro Research Architecture", "Архитектура астро-исследований"],
  ["Public map separating sky/time evidence, research engines, Bitcoin × Astro research and protected research depth.", "Публичная карта, разделяющая доказательства неба/времени, исследовательские движки, исследование Bitcoin × Astro и защищённую исследовательскую глубину."],
  ["Open Astro Research Atlas →", "Открыть Astro Research Atlas →"],
  ["Bitcoin State + Change", "Состояние + изменение Bitcoin"],
  ["Evidence-linked public corridor for verified Bitcoin state, change, temporal context, conditions and visible source boundaries.", "Публичный коридор, связанный с доказательствами: проверенное состояние Bitcoin, изменение, темпоральный контекст, условия и видимые границы источников."],
  ["Open BTC Field →", "Открыть BTC Field →"],
  ["External System Finding", "Вывод по внешней системе"],
  ["Independent external repository adopted a BHRIGU/Cosmographer finding concerning overlapping entropy comparisons and publicly documented the change.", "Независимый внешний репозиторий принял вывод BHRIGU/Cosmographer о перекрывающихся сравнениях энтропии и публично задокументировал изменение."],
  ["Inspect upstream evidence ↗", "Проверить внешнее доказательство ↗"],
  ["Public Architecture Layer", "Публичный архитектурный слой"],
  ["Public-safe system hierarchy, selected repositories, proof surfaces, machine-readable discovery routes and protected-IP boundary.", "Безопасная для публикации иерархия системы, избранные репозитории, поверхности доказательств, машиночитаемые маршруты обнаружения и граница защищённой интеллектуальной собственности."],
  ["Inspect public proof ↗", "Проверить публичные доказательства ↗"],
  ["PROVEN", "ДОКАЗАНО"],
  ["BOUNDED", "ОГРАНИЧЕНО"],
  ["PROVEN / BOUNDED BY MODULE", "ДОКАЗАНО / ОГРАНИЧЕНО ПО МОДУЛЮ"],
  ["PROVEN EXTERNAL ADOPTION", "ДОКАЗАНО ВНЕШНИМ ПРИМЕНЕНИЕМ"],
  ["PROVEN PUBLIC AUTHORITY SURFACE", "ДОКАЗАННАЯ ПУБЛИЧНАЯ ПОВЕРХНОСТЬ-АВТОРИТЕТ"],
  ["Scope", "Область"],
  ["Define the system, question and authority boundary.", "Определить систему, вопрос и границу полномочий."],
  ["State", "Состояние"],
  ["Establish what is accepted as current and what earlier state can legitimately be compared.", "Установить, что принято как текущее состояние и с каким предыдущим состоянием его правомерно сравнивать."],
  ["Evidence", "Доказательства"],
  ["Bind observations to source, time and provenance.", "Связать наблюдения с источником, временем и происхождением данных."],
  ["Change", "Изменение"],
  ["Identify meaningful deltas without mixing incompatible states.", "Выявить значимые изменения, не смешивая несовместимые состояния."],
  ["Verify", "Верификация"],
  ["Test claims, failure conditions and reproducibility.", "Проверить утверждения, условия отказа и воспроизводимость."],
  ["Boundary", "Граница"],
  ["Keep observation, interpretation, uncertainty and protected mechanism distinct.", "Сохранять различие между наблюдением, интерпретацией, неопределённостью и защищённым механизмом."],
  ["Output", "Результат"],
  ["Expose the useful result and its evidence without exposing protected mechanics.", "Показать полезный результат и его доказательства, не раскрывая защищённую механику."],
  ["Astronomical observation is not automatically astrological interpretation.", "Астрономическое наблюдение не является автоматически астрологической интерпретацией."],
  ["Astrological research is not proof of physical market causality.", "Астрологическое исследование не доказывает физическую причинность рынка."],
  ["A prospective scenario is not a guaranteed forecast.", "Проспективный сценарий не является гарантированным прогнозом."],
  ["Bitcoin research is not financial advice, a trading signal or execution authority.", "Исследование Bitcoin не является финансовой рекомендацией, торговым сигналом или полномочием на исполнение сделок."],
  ["Persistent state does not imply unlimited personal memory, unattended autonomy or universal account history.", "Сохраняемое состояние не подразумевает неограниченную персональную память, автономию без надзора или универсальную историю аккаунта."],
  ["A public interface does not imply access to ORION internals.", "Публичный интерфейс не подразумевает доступ к внутренним механизмам ORION."],
  ["A public proof repository does not expose private prompts, evaluators, corpora, unpublished research or protected mechanisms.", "Публичный репозиторий доказательств не раскрывает приватные промпты, оценщики, корпуса, неопубликованные исследования или защищённые механизмы."],
  ["A capability class does not automatically mean a commercial service is available for that capability.", "Класс возможностей не означает автоматически, что для этой возможности доступен коммерческий сервис."],
  ["One bounded system.", "Одна ограниченная система."],
  ["Read-only investigation.", "Исследование только для чтения."],
  ["System map", "Карта системы"],
  ["3 highest-impact findings", "3 вывода с наибольшим влиянием"],
  ["Evidence for each finding", "Доказательства для каждого вывода"],
  ["One exact repair blueprint", "Один точный blueprint исправления"],
  ["Open External Systems Recon →", "Открыть External Systems Recon →"],
  ["The live object explicitly excludes full product development, penetration testing, trading execution and unbounded redesign.", "Действующий объект явно исключает полную разработку продукта, тестирование на проникновение, исполнение торговых операций и неограниченный редизайн."],
  ["One subject.", "Один объект."],
  ["One meaningful temporal horizon.", "Один значимый темпоральный горизонт."],
  ["One complete Cosmographic Reading.", "Одно полное Космографическое чтение."],
  ["Open Frey Personal →", "Открыть Frey Personal →"],
  ["The current object keeps uncertainty visible and explicitly excludes guaranteed outcomes and medical, legal or financial advice.", "Текущий объект сохраняет неопределённость видимой и явно исключает гарантированные исходы, а также медицинские, юридические или финансовые рекомендации."],
  ["One public founding coordinate for an agent, model, project or product.", "Одна публичная исходная координата для агента, модели, проекта или продукта."],
  ["Public.", "Публично."],
  ["Timestamped.", "С временной меткой."],
  ["Machine-readable.", "Машиночитаемо."],
  ["Open AI Founding Field →", "Открыть AI Founding Field →"],
  ["The live field explicitly makes no promise of traffic, ranking or endorsement.", "Действующее поле явно не обещает трафика, рейтинга или одобрения."],
  ["USD 99 · one-time", "USD 99 · единоразово"],
  ["Φ RESEARCH SYSTEMS", "Φ RESEARCH SYSTEMS"],
  ["One research architecture. Multiple system classes.", "Одна исследовательская архитектура. Множество классов систем."],
  ["We design evidence-bound systems for problems where state, change, time, provenance and interpretation must remain traceable.", "Мы проектируем системы, связанные с доказательствами, для задач, где состояние, изменение, время, происхождение данных и интерпретация должны оставаться прослеживаемыми."],
  ["AI and persistent intelligence. Astronomy and ephemerides. Astrology research systems. Temporal and prospective systems. Scientific evidence and verification. Bitcoin and market-state research. Information and product architecture.", "AI и интеллект с непрерывностью состояния. Астрономия и эфемериды. Исследовательские системы астрологии. Темпоральные и проспективные системы. Научные доказательства и верификация. Исследование Bitcoin и состояния рынка. Информационная и продуктовая архитектура."],
  ["ONE CORE", "ОДНО ЯДРО"],
  ["MULTIPLE SYSTEM CLASSES", "МНОЖЕСТВО КЛАССОВ СИСТЕМ"],
  ["Explore system classes ↓", "Исследовать классы систем ↓"],
  ["Inspect public proof →", "Проверить публичные доказательства →"],
  ["One Φ field expressed through seven distinct system classes", "Одно поле Φ, выраженное через семь различных классов систем"],
  ["ONE", "ОДНО"],
  ["FIELD", "ПОЛЕ"],
  ["Public proof objects", "Объекты публичных доказательств"],
  ["CONCRETE PUBLIC PROOF", "КОНКРЕТНЫЕ ПУБЛИЧНЫЕ ДОКАЗАТЕЛЬСТВА"],
  ["THE FIELD", "ПОЛЕ"],
  ["Systems that preserve the difference between data, state, change and interpretation.", "Системы, сохраняющие различие между данными, состоянием, изменением и интерпретацией."],
  ["Many systems become unreliable when current state is separated from its history, evidence loses provenance, uncertainty disappears, or interpretation is presented as fact.", "Многие системы становятся ненадёжными, когда текущее состояние отделяют от его истории, доказательства теряют происхождение, неопределённость исчезает или интерпретацию представляют как факт."],
  ["Φ Research Systems works on that structural layer.", "Φ Research Systems работает именно с этим структурным слоем."],
  ["The shared pattern is simple:", "Общий паттерн прост:"],
  ["Object to output relationship", "Связь от объекта к результату"],
  ["OBJECT", "ОБЪЕКТ"],
  ["STATE", "СОСТОЯНИЕ"],
  ["CHANGE", "ИЗМЕНЕНИЕ"],
  ["TIME", "ВРЕМЯ"],
  ["EVIDENCE", "ДОКАЗАТЕЛЬСТВА"],
  ["VERIFICATION", "ВЕРИФИКАЦИЯ"],
  ["BOUNDARY", "ГРАНИЦА"],
  ["OUTPUT", "РЕЗУЛЬТАТ"],
  ["Different domains require different instruments.", "Разным областям нужны разные инструменты."],
  ["The architectural discipline remains consistent.", "Архитектурная дисциплина остаётся неизменной."],
  ["The domain changes.", "Область меняется."],
  ["The requirement for traceable state does not.", "Требование к прослеживаемому состоянию — нет."],
  ["SYSTEM CLASSES", "КЛАССЫ СИСТЕМ"],
  ["Seven classes. One structural field.", "Семь классов. Одно структурное поле."],
  ["Search bridge:", "Поисковый мост:"],
  ["CAPABILITY STATUS", "СТАТУС ВОЗМОЖНОСТЕЙ"],
  ["Claim only what can be defended.", "Утверждать только то, что можно защитить доказательствами."],
  ["Each capability displayed here must resolve to either:", "Каждая представленная здесь возможность должна иметь один из двух статусов:"],
  ["public working proof exists.", "существует публичное работающее доказательство."],
  ["capability or research exists, but the public proof supports only a narrower statement.", "возможность или исследование существует, но публичные доказательства поддерживают только более узкое утверждение."],
  ["Valid public language:", "Допустимый публичный язык:"],
  ["Invalid public language:", "Недопустимый публичный язык:"],
  ["PROOF", "ДОКАЗАТЕЛЬСТВА"],
  ["Working systems leave inspectable evidence.", "Работающие системы оставляют проверяемые доказательства."],
  ["This section should contain proof objects, not generic logos or testimonials.", "Этот раздел содержит объекты доказательств, а не общие логотипы или отзывы."],
  ["Proof", "Доказательство"],
  ["Proof status:", "Статус доказательства:"],
  ["METHOD", "МЕТОД"],
  ["Fix the object before interpreting the system.", "Сначала зафиксировать объект, затем интерпретировать систему."],
  ["SCOPE → STATE → EVIDENCE → CHANGE → VERIFY → BOUNDARY → OUTPUT", "ОБЛАСТЬ → СОСТОЯНИЕ → ДОКАЗАТЕЛЬСТВА → ИЗМЕНЕНИЕ → ВЕРИФИКАЦИЯ → ГРАНИЦА → РЕЗУЛЬТАТ"],
  ["Capability is not unlimited authority.", "Возможность не означает неограниченных полномочий."],
  ["Φ Research Systems works with explicit limits.", "Φ Research Systems работает с явными границами."],
  ["EXPOSE MEANING", "РАСКРЫВАТЬ СМЫСЛ"],
  ["PROVE CAPABILITY", "ДОКАЗЫВАТЬ ВОЗМОЖНОСТЬ"],
  ["PROTECT MECHANISM", "ЗАЩИЩАТЬ МЕХАНИЗМ"],
  ["The present ORION public page independently confirms that ORION is protected analytical depth rather than a public API, dashboard or open research mechanism.", "Действующая публичная страница ORION независимо подтверждает: ORION — защищённая аналитическая глубина, а не публичный API, панель управления или открытый исследовательский механизм."],
  ["AVAILABLE NOW", "ДОСТУПНО СЕЙЧАС"],
  ["Capabilities are broad. Purchasable objects are exact.", "Возможности широки. Приобретаемые объекты точно определены."],
  ["Do not convert the seven system classes into seven service cards.", "Семь классов систем нельзя превращать в семь карточек услуг."],
  ["Only these live commercial objects belong here.", "Здесь находятся только эти действующие коммерческие объекты."],
  ["You receive:", "Вы получаете:"],
  ["Delivered as a portable", "Результат передаётся как переносимый"],
  ["Cosmographic Passport", "Космографический паспорт"],
  ["CAPABILITY ≠ PRODUCT", "ВОЗМОЖНОСТЬ ≠ ПРОДУКТ"],
  ["What Φ Research Systems can credibly work with is broader than what BHRIGU currently sells.", "Область, с которой Φ Research Systems может достоверно работать, шире того, что BHRIGU продаёт сейчас."],
  ["ENTRY", "ВХОД"],
  ["Start with the system, not the pitch.", "Начните с системы, а не с предложения."],
  ["If you are evaluating Φ Research Systems, inspect the working evidence first.", "Если вы оцениваете Φ Research Systems, сначала проверьте работающие доказательства."],
  ["If you need a live commercial object, choose the exact entry point that matches the problem.", "Если вам нужен действующий коммерческий объект, выберите точную точку входа, соответствующую задаче."],
  ["View commercial entry points ↑", "Посмотреть коммерческие точки входа ↑"],
  ["Evidence-bound systems across AI, time, astronomy, research and markets.", "Системы, связанные с доказательствами, на пересечении AI, времени, астрономии, исследований и рынков."],
  [CANONICAL_DESCRIPTION, "Φ Research Systems — исследовательское и системное поле, работающее с AI и интеллектом с непрерывностью состояния, астрономией и эфемеридами, исследовательскими системами астрологии, темпоральными и проспективными системами, верификацией доказательств, исследованием состояния рынка Bitcoin и информационной архитектурой. Его публичные системы сохраняют явные границы между источником, наблюдением, состоянием, изменением, интерпретацией, неопределённостью и защищённым механизмом. BHRIGU — публичная продуктовая и исследовательская поверхность. ORION остаётся защищённой аналитической глубиной. AiBhrigu — публичное пространство доказательств."],
]);

function tr(locale, value) {
  return locale === "ru" ? RU_TEXT.get(value) || value : value;
}

function externalProps(href) {
  return href.startsWith("https://github.com")
    ? { target: "_blank", rel: "noreferrer" }
    : {};
}

function Geometry({ kind, locale = "en" }) {
  if (kind === "ai") {
    return <div className={`${styles.geometry} ${styles.geometryAi}`} aria-hidden="true"><i /><i /><i /><b /></div>;
  }
  if (kind === "astronomy") {
    return <div className={`${styles.geometry} ${styles.geometryAstronomy}`} aria-hidden="true"><i /><b /><span /><span /><span /></div>;
  }
  if (kind === "astrology") {
    return <div className={`${styles.geometry} ${styles.geometryAstrology}`} aria-hidden="true"><i /><span /><span /><span /><span /></div>;
  }
  if (kind === "temporal") {
    return <div className={`${styles.geometry} ${styles.geometryTemporal}`} aria-hidden="true"><b /><i /><span /><span /><span /></div>;
  }
  if (kind === "evidence") {
    return <div className={`${styles.geometry} ${styles.geometryEvidence}`} aria-hidden="true"><span>{locale === "ru" ? "ИСТОЧНИК" : "SOURCE"}</span><i /><span>{locale === "ru" ? "ПРОИСХОЖДЕНИЕ" : "PROVENANCE"}</span><i /><span>{locale === "ru" ? "ПРОВЕРКА" : "VERIFY"}</span><i /><span>{locale === "ru" ? "ГРАНИЦА" : "BOUNDARY"}</span></div>;
  }
  if (kind === "btc") {
    return <div className={`${styles.geometry} ${styles.geometryBtc}`} aria-hidden="true"><span /><span /><b>₿</b><span /><span /></div>;
  }
  return <div className={`${styles.geometry} ${styles.geometryInformation}`} aria-hidden="true"><i><i><i /></i></i></div>;
}

function SectionHeading({ index, eyebrow, title, id }) {
  return (
    <header className={styles.sectionHeading}>
      <p className={styles.sectionIndex}>{index}</p>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
    </header>
  );
}

function SystemsStructuredData({ locale }) {
  const canonical = locale === "ru" ? "https://www.bhrigu.io/systems?lang=ru" : "https://www.bhrigu.io/systems";
  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonical}#page`,
    url: canonical,
    name: PAGE_META[locale].title,
    description: tr(locale, CANONICAL_DESCRIPTION),
    inLanguage: locale,
    about: {
      "@type": "Thing",
      name: "Φ Research Systems",
      description: tr(locale, CANONICAL_DESCRIPTION),
      sameAs: [PROOF_ROUTES.phi],
    },
    mainEntity: {
      "@type": "ItemList",
      name: "system_classes",
      numberOfItems: 7,
      itemListElement: SYSTEM_CLASSES.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tr(locale, item.title),
        description: tr(locale, item.description),
      })),
    },
    hasPart: [
      {
        "@type": "ItemList",
        name: "public_proof",
        numberOfItems: 6,
        itemListElement: PROOF_OBJECTS.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tr(locale, item.title),
          url: item.href,
          additionalType: tr(locale, item.status),
        })),
      },
      {
        "@type": "ItemList",
        name: "commercial_entries",
        numberOfItems: 3,
        itemListElement: COMMERCIAL.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: tr(locale, item.title),
          description: item.price,
          url: item.href,
        })),
      },
    ],
    sameAs: Object.values(PROOF_ROUTES),
  };
  return <script type="application/ld+json" data-systems-machine-graph="PHI_RESEARCH_SYSTEMS_V0_1" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export async function getServerSideProps({ query }) {
  return { props: { locale: query.lang === "ru" ? "ru" : "en" } };
}

export default function SystemsPage({ locale = "en" }) {
  const meta = PAGE_META[locale] || PAGE_META.en;
  const canonical = locale === "ru" ? "https://www.bhrigu.io/systems?lang=ru" : "https://www.bhrigu.io/systems";
  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="en" href="https://www.bhrigu.io/systems" />
        <link rel="alternate" hrefLang="ru" href="https://www.bhrigu.io/systems?lang=ru" />
        <link rel="alternate" hrefLang="x-default" href="https://www.bhrigu.io/systems" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <SystemsStructuredData locale={locale} />
      </Head>

      <main className={styles.systems} data-systems-page="PHI_RESEARCH_SYSTEMS_V0_1" lang={locale}>
        <section className={styles.hero} aria-labelledby="systems-title">
          <div className={styles.heroCore}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{tr(locale, "Φ RESEARCH SYSTEMS")}</p>
              <h1 id="systems-title">{tr(locale, "One research architecture. Multiple system classes.")}</h1>
              <p className={styles.heroLead}>{tr(locale, "We design evidence-bound systems for problems where state, change, time, provenance and interpretation must remain traceable.")}</p>
              <p className={styles.heroClasses}>{tr(locale, "AI and persistent intelligence. Astronomy and ephemerides. Astrology research systems. Temporal and prospective systems. Scientific evidence and verification. Bitcoin and market-state research. Information and product architecture.")}</p>
              <p className={styles.identityLine}>{tr(locale, "ONE CORE")} <span>→</span> {tr(locale, "MULTIPLE SYSTEM CLASSES")}</p>
              <div className={styles.heroActions}>
                <a href="#system-classes">{tr(locale, "Explore system classes ↓")}</a>
                <a href="#public-proof">{tr(locale, "Inspect public proof →")}</a>
              </div>
            </div>

            <div className={styles.fieldCanvas} aria-label={tr(locale, "One Φ field expressed through seven distinct system classes")}>
              <div className={styles.fieldCore}>
                <span>{tr(locale, "ONE")}</span>
                <strong>Φ</strong>
                <span>{tr(locale, "FIELD")}</span>
              </div>
              <div className={styles.fieldAxis} aria-hidden="true" />
              {SYSTEM_CLASSES.map((item) => (
                <div className={`${styles.expression} ${styles[`expression${item.number}`]}`} key={item.number}>
                  <span className={styles.expressionNumber}>{item.number}</span>
                  <Geometry kind={item.kind} locale={locale} />
                  <strong>{tr(locale, item.title)}</strong>
                </div>
              ))}
            </div>
          </div>

          <nav className={styles.proofRail} aria-label={tr(locale, "Public proof objects")}>
            <span className={styles.proofRailLabel}>{tr(locale, "CONCRETE PUBLIC PROOF")}</span>
            {PROOF_OBJECTS.map((proof) => (
              <a href={proof.href} {...externalProps(proof.href)} key={proof.number}>
                <span>{proof.number} · {tr(locale, proof.title)}</span>
                <strong>{tr(locale, proof.status)}</strong>
              </a>
            ))}
          </nav>
        </section>

        <div className={styles.machineReader} data-machine-readable="canonical_entity_description">
          <p>{tr(locale, CANONICAL_DESCRIPTION)}</p>
          <p>system_classes · capability_status · public_proof · commercial_entries · boundaries · canonical_urls · sameAs</p>
        </div>

        <section className={`${styles.section} ${styles.fieldSection}`} aria-labelledby="field-title">
          <SectionHeading index="01" eyebrow={tr(locale, "THE FIELD")} id="field-title" title={tr(locale, "Systems that preserve the difference between data, state, change and interpretation.")} />
          <div className={styles.fieldStatement}>
            <div className={styles.fieldBody}>
              <p>{tr(locale, "Many systems become unreliable when current state is separated from its history, evidence loses provenance, uncertainty disappears, or interpretation is presented as fact.")}</p>
              <p>{tr(locale, "Φ Research Systems works on that structural layer.")}</p>
              <p>{tr(locale, "The shared pattern is simple:")}</p>
            </div>
            <div className={styles.relationChain} aria-label={tr(locale, "Object to output relationship")}>
              {["OBJECT", "STATE", "CHANGE", "TIME", "EVIDENCE", "VERIFICATION", "BOUNDARY", "OUTPUT"].map((node) => <span key={node}>{tr(locale, node)}</span>)}
            </div>
            <div className={styles.fieldClosing}>
              <p>{tr(locale, "Different domains require different instruments.")}</p>
              <p>{tr(locale, "The architectural discipline remains consistent.")}</p>
              <strong>{tr(locale, "The domain changes.")}<br />{tr(locale, "The requirement for traceable state does not.")}</strong>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.classesSection}`} id="system-classes" aria-labelledby="classes-title">
          <SectionHeading index="02" eyebrow={tr(locale, "SYSTEM CLASSES")} id="classes-title" title={tr(locale, "Seven classes. One structural field.")} />
          <div className={styles.classLedger}>
            {SYSTEM_CLASSES.map((item) => (
              <article className={styles.classRow} key={item.number} data-system-class={item.kind}>
                <div className={styles.classIdentity}>
                  <span>{item.number}</span>
                  <Geometry kind={item.kind} locale={locale} />
                </div>
                <div className={styles.classCopy}>
                  <h3>{tr(locale, item.title)}</h3>
                  <p>{tr(locale, item.description)}</p>
                  {item.evidence && <p className={styles.classEvidence}>{tr(locale, item.evidence)}</p>}
                </div>
                <p className={styles.searchBridge}><strong>{tr(locale, "Search bridge:")}</strong><br />{tr(locale, item.bridge)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.capabilitiesSection}`} aria-labelledby="capabilities-title">
          <SectionHeading index="03" eyebrow={tr(locale, "CAPABILITY STATUS")} id="capabilities-title" title={tr(locale, "Claim only what can be defended.")} />
          <p className={styles.sectionLead}>{tr(locale, "Each capability displayed here must resolve to either:")}</p>
          <div className={styles.statusKey}>
            <p><strong>{tr(locale, "PROVEN")}</strong> — {tr(locale, "public working proof exists.")}</p>
            <p><strong>{tr(locale, "BOUNDED")}</strong> — {tr(locale, "capability or research exists, but the public proof supports only a narrower statement.")}</p>
          </div>
          <div className={styles.capabilityGroups}>
            {CAPABILITY_GROUPS.map((group) => (
              <section className={styles.capabilityGroup} key={group.title}>
                <h3>{tr(locale, group.title)}</h3>
                <div className={styles.capabilityList}>
                  {group.items.map((item) => (
                    <article className={styles.capabilityItem} key={`${group.title}-${item.title}`}>
                      <span className={item.status === "PROVEN" ? styles.proven : styles.bounded}>{tr(locale, item.status)}</span>
                      <div>
                        <h4>{tr(locale, item.title)}</h4>
                        {item.body && <p>{tr(locale, item.body)}</p>}
                        {item.valid && (
                          <div className={styles.languageBoundary}>
                            <p><strong>{tr(locale, "Valid public language:")}</strong></p>
                            <p>{item.valid.map((value) => tr(locale, value)).join(" · ")}</p>
                            <p><strong>{tr(locale, "Invalid public language:")}</strong></p>
                            <p>{item.invalid.map((value) => tr(locale, value)).join(" · ")}</p>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.proofSection}`} id="public-proof" aria-labelledby="proof-title">
          <SectionHeading index="04" eyebrow={tr(locale, "PROOF")} id="proof-title" title={tr(locale, "Working systems leave inspectable evidence.")} />
          <p className={styles.sectionLead}>{tr(locale, "This section should contain proof objects, not generic logos or testimonials.")}</p>
          <div className={styles.proofLedger}>
            {PROOF_OBJECTS.map((proof) => (
              <article className={styles.proofObject} key={proof.number}>
                <div className={styles.proofIndex}>
                  <span>{tr(locale, "Proof")} {proof.number} ·</span>
                  <strong>{tr(locale, proof.className)}</strong>
                </div>
                <div className={styles.proofCopy}>
                  <h3>{tr(locale, proof.title)}</h3>
                  <p>{tr(locale, proof.description)}</p>
                  <a href={proof.href} {...externalProps(proof.href)}>{tr(locale, proof.cta)}</a>
                </div>
                <p className={styles.proofStatus}>{tr(locale, "Proof status:")} <strong>{tr(locale, proof.status)}.</strong></p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.methodSection}`} aria-labelledby="method-title">
          <SectionHeading index="05" eyebrow={tr(locale, "METHOD")} id="method-title" title={tr(locale, "Fix the object before interpreting the system.")} />
          <div className={styles.methodChain}>
            {METHOD.map(([number, title, body]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{tr(locale, title)}</h3>
                <p>{tr(locale, body)}</p>
              </article>
            ))}
          </div>
          <p className={styles.methodLine}>{tr(locale, "SCOPE → STATE → EVIDENCE → CHANGE → VERIFY → BOUNDARY → OUTPUT")}</p>
        </section>

        <section className={`${styles.section} ${styles.boundarySection}`} aria-labelledby="boundary-title">
          <SectionHeading index="06" eyebrow={tr(locale, "BOUNDARY")} id="boundary-title" title={tr(locale, "Capability is not unlimited authority.")} />
          <p className={styles.sectionLead}>{tr(locale, "Φ Research Systems works with explicit limits.")}</p>
          <div className={styles.boundaryLedger}>
            {BOUNDARIES.map((boundary, index) => <p key={boundary}><span>{String(index + 1).padStart(2, "0")}</span>{tr(locale, boundary)}</p>)}
          </div>
          <p className={styles.boundaryLine}>{tr(locale, "EXPOSE MEANING")} <span>·</span> {tr(locale, "PROVE CAPABILITY")} <span>·</span> {tr(locale, "PROTECT MECHANISM")}</p>
          <p className={styles.orionBoundary}>{tr(locale, "The present ORION public page independently confirms that ORION is protected analytical depth rather than a public API, dashboard or open research mechanism.")}</p>
        </section>

        <section className={`${styles.section} ${styles.commercialSection}`} id="commercial" aria-labelledby="commercial-title">
          <SectionHeading index="07" eyebrow={tr(locale, "AVAILABLE NOW")} id="commercial-title" title={tr(locale, "Capabilities are broad. Purchasable objects are exact.")} />
          <p className={styles.sectionLead}>{tr(locale, "Do not convert the seven system classes into seven service cards.")}</p>
          <p className={styles.sectionLead}>{tr(locale, "Only these live commercial objects belong here.")}</p>
          <div className={styles.commercialRail}>
            {COMMERCIAL.map((item) => (
              <article key={item.letter}>
                <div className={styles.commercialIdentity}>
                  <span>{item.letter}</span>
                  <h3>{item.title}</h3>
                  <strong>{tr(locale, item.price)}</strong>
                </div>
                <div className={styles.commercialBody}>
                  {item.intro.map((line) => <p key={line}>{tr(locale, line)}</p>)}
                  {item.receive && <><p>{tr(locale, "You receive:")}</p><ul>{item.receive.map((line) => <li key={line}>{tr(locale, line)}</li>)}</ul></>}
                  {item.passport && <p>{tr(locale, "Delivered as a portable")} <strong>{tr(locale, "Cosmographic Passport")}</strong>.</p>}
                  {item.attributes && <p className={styles.attributes}>{item.attributes.map((value) => tr(locale, value)).join(" ")}</p>}
                </div>
                <div className={styles.commercialAction}>
                  <a href={item.href}>{tr(locale, item.cta)}</a>
                  <p>{tr(locale, item.boundary)}</p>
                </div>
              </article>
            ))}
          </div>
          <div className={styles.separationLine}>
            <strong>{tr(locale, "CAPABILITY ≠ PRODUCT")}</strong>
            <p>{tr(locale, "What Φ Research Systems can credibly work with is broader than what BHRIGU currently sells.")}</p>
          </div>
        </section>

        <section className={`${styles.section} ${styles.entrySection}`} aria-labelledby="entry-title">
          <SectionHeading index="08" eyebrow={tr(locale, "ENTRY")} id="entry-title" title={tr(locale, "Start with the system, not the pitch.")} />
          <div className={styles.entryGrid}>
            <div>
              <p>{tr(locale, "If you are evaluating Φ Research Systems, inspect the working evidence first.")}</p>
              <p>{tr(locale, "If you need a live commercial object, choose the exact entry point that matches the problem.")}</p>
            </div>
            <div className={styles.entryActions}>
              <a href="#public-proof">{tr(locale, "Inspect public proof →")}</a>
              <a href="#commercial">{tr(locale, "View commercial entry points ↑")}</a>
            </div>
          </div>
          <footer className={styles.pageFooter}>
            <strong>Φ Research Systems</strong>
            <p>{tr(locale, "Evidence-bound systems across AI, time, astronomy, research and markets.")}</p>
          </footer>
        </section>
      </main>
    </>
  );
}
