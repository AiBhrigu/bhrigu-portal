import { useEffect, useState } from "react"

const ANCHOR_STORAGE_KEY = "frey.anchor.v1"
const ANCHOR_STORAGE_SCHEMA_VERSION = "v1"

function band(v) {
  if (v <= 0.33) return "LOW"
  if (v <= 0.66) return "MID"
  return "HIGH"
}

function mapCosmographer(temporal, ru = false) {
  const s = band(Number(temporal?.structural_stability ?? 0))
  const c = band(Number(temporal?.analysis?.coherence_score ?? 0))
  const t = band(Number(temporal?.harmonic_tension ?? 0))
  const v = band(Number(temporal?.analysis?.volatility_index ?? 0))
  const r = band(Number(temporal?.resonance_level ?? 0))
  const d = band(Number(temporal?.phase_density ?? 0))

  let structural = ru ? "Сбалансировано. Формируется." : "Balanced. Forming."
  if (s === "HIGH" && c === "HIGH") structural = ru ? "Стабильно. Согласованно." : "Stable. Coherent."
  else if (s === "HIGH" && c === "MID") structural = ru ? "Стабильно. Центрировано." : "Stable. Centered."
  else if (s === "LOW") structural = ru ? "Нестабильно. Хрупко." : "Unstable. Fragile."

  let tension = ru ? "Умеренное напряжение. Сбалансированное поле." : "Moderate tension. Balanced field."
  if (t === "HIGH" && v === "HIGH") tension = ru ? "Высокое напряжение. Нестабильное поле." : "High tension. Unstable field."
  else if (t === "HIGH") tension = ru ? "Высокое напряжение. Поле удерживается." : "High tension. Contained field."
  else if (t === "LOW" && v === "LOW") tension = ru ? "Низкое напряжение. Тихое поле." : "Low tension. Quiet field."

  let resonance = ru ? "Умеренное согласование. Плотная структура." : "Moderate alignment. Dense structure."
  if (r === "HIGH" && d === "HIGH") resonance = ru ? "Согласовано. Плотная структура." : "Aligned. Dense structure."
  else if (r === "HIGH") resonance = ru ? "Согласовано. Поддержка тонкая." : "Aligned. Thin support."
  else if (r === "LOW") resonance = ru ? "Слабое согласование. Разреженная поддержка." : "Weak alignment. Sparse support."

  let direction = ru ? "Двигаться" : "Move"
  if (s === "LOW") direction = ru ? "Стабилизировать" : "Stabilize"
  else if (t === "HIGH" && r === "LOW") direction = ru ? "Удерживать" : "Hold"
  else if (r === "HIGH" && s === "HIGH") direction = ru ? "Расширять" : "Expand"

  return { structural, tension, resonance, direction }
}

function mapNavigator(temporal, ru = false) {
  const s = band(Number(temporal?.structural_stability ?? 0))
  const c = band(Number(temporal?.analysis?.coherence_score ?? 0))
  const t = band(Number(temporal?.harmonic_tension ?? 0))
  const v = band(Number(temporal?.analysis?.volatility_index ?? 0))
  const r = band(Number(temporal?.resonance_level ?? 0))

  const lowSignal = t === "LOW" && v === "LOW" && c !== "LOW"
  let primaryBand = "ALIGNMENT"
  if (lowSignal) primaryBand = "LOW_SIGNAL"
  else if (s === "LOW") primaryBand = "STABILIZATION"
  else if (t === "HIGH" && r === "LOW") primaryBand = "CONTAINMENT"
  else if (t === "HIGH") primaryBand = "CONCENTRATION"
  else if (r === "HIGH" && s === "HIGH" && c === "HIGH") primaryBand = "OPENING"

  let modulation = "CLARITY"
  if (primaryBand === "LOW_SIGNAL") modulation = "SOFTENING"
  else if (s === "LOW") modulation = "FRAGILITY"
  else if (t === "HIGH" || v === "HIGH") modulation = "PRESSURE"

  const payload = {
    primaryBand,
    modulation,
    formula: ru ? "Сначала согласовать, затем двигаться" : "Align first, then move",
    origin: ru ? "Этот день продолжает поле, которому всё ещё требуется лучшее внутреннее согласование." : "This day continues a field that is still asking for better internal agreement.",
    gate: ru ? "Ключ дня — согласование до ускорения." : "Today's pivot is alignment before acceleration.",
    vector: ru ? "Если сейчас привести линию в порядок, ближайшая дуга склоняется к более ясному направлению и меньшему внутреннему сопротивлению." : "If the line is brought into order now, the near arc tends toward clearer direction and less inner resistance.",
    action: ru ? "Приведите главную линию в порядок." : "Bring the main line into order.",
    boundary: ru ? "Не двигайтесь до согласования." : "Do not move before alignment."
  }

  if (primaryBand === "LOW_SIGNAL") {
    payload.formula = ru ? "Удерживать тихую линию" : "Hold the quiet line"
    payload.origin = ru ? "Этот день несёт более тихое поле: давление низкое, смысл не требует усилия." : "This day carries a quieter field, where pressure is low and meaning does not need force."
    payload.gate = ru ? "Ключ дня — не расширение, а чистое внимание к тому, что уже стоит." : "Today's pivot is not expansion but clean attention to what already stands."
    payload.vector = ru ? "Если линия остаётся простой, ближайшая дуга склоняется к более устойчивой ясности без лишнего напряжения." : "If the line stays simple, the near arc tends toward steadier clarity without extra strain."
    payload.action = ru ? "Сохраняйте одну лёгкую устойчивую линию." : "Keep one light steady line."
    payload.boundary = ru ? "Не форсируйте точку разворота." : "Do not force a turning point."
    return payload
  }

  if (primaryBand === "STABILIZATION") {
    payload.formula = ru ? "Стабилизировать до расширения" : "Stabilize before extension"
    payload.origin = ru ? "Этот день приходит через более тонкий слой поддержки, где структура требует защиты до движения." : "This day arrives through a thinner support layer, where structure asks for protection before movement."
    payload.gate = ru ? "Ключ дня — сохранить целостность основы, а не нагружать её сильнее." : "Today's pivot is keeping the base coherent instead of asking it to carry more weight."
    payload.vector = ru ? "Если сейчас укрепить основу, ближайшая дуга склоняется к более прочной поддержке и меньшему внутреннему рассеянию." : "If the base is reinforced now, the near arc tends toward firmer support and less internal scatter."
    payload.action = ru ? "Укрепите главную основу." : "Reinforce the main base."
    payload.boundary = ru ? "Пока не расширяйте поле." : "Do not widen the field yet."
    return payload
  }

  if (primaryBand === "CONTAINMENT") {
    payload.formula = ru ? "Удерживать линию, снижать давление" : "Hold the line, reduce pressure"
    payload.origin = ru ? "Этот день продолжает более горячее поле, где давление растёт быстрее поддержки." : "This day continues a hotter field, where pressure rises faster than support."
    payload.gate = ru ? "Ключ дня — удержание, а не масштабирование." : "Today's pivot is containment, not scale."
    payload.vector = ru ? "Если удерживать давление, а не усиливать его, ближайшая дуга склоняется к более устойчивому контролю." : "If pressure is held instead of amplified, the near arc tends toward steadier control."
    payload.action = ru ? "Снизьте нагрузку на главную линию." : "Reduce load on the main line."
    payload.boundary = ru ? "Не превращайте давление в скорость." : "Do not turn pressure into speed."
    return payload
  }

  if (primaryBand === "CONCENTRATION") {
    payload.formula = ru ? "Одна линия, меньше шума" : "One line, less noise"
    payload.origin = ru ? "Этот день входит через плотное сигнальное поле, где избыток фронтов быстро размывает центр." : "This day enters through a dense signal field, where too many fronts quickly blur the center."
    payload.gate = ru ? "Ключ дня — выбрать одну линию, которая действительно может нести день." : "Today's pivot is choosing the one line that can actually carry the day."
    payload.vector = ru ? "Если сейчас сузить поле, ближайшая дуга склоняется к более ясному движению и меньшим потерям на трение." : "If the field is narrowed now, the near arc tends toward clearer movement and less wasted friction."
    payload.action = ru ? "Выберите одну ведущую линию." : "Choose one leading line."
    payload.boundary = ru ? "Не открывайте новые фронты." : "Do not open new fronts."
    return payload
  }

  if (primaryBand === "OPENING") {
    payload.formula = ru ? "Раскрываться из устойчивой основы" : "Open from stable ground"
    payload.origin = ru ? "Этот день приходит с сильной согласованностью и достаточной поддержкой для измеренного движения наружу." : "This day arrives with strong coherence and enough support for measured outward motion."
    payload.gate = ru ? "Ключ дня — контролируемое раскрытие, а не грубый толчок." : "Today's pivot is controlled opening, not raw push."
    payload.vector = ru ? "Если основа остаётся видимой, ближайшая дуга склоняется к более чистому расширению с меньшим сопротивлением." : "If the base stays visible, the near arc tends toward cleaner expansion with less drag."
    payload.action = ru ? "Продлите одну подготовленную линию." : "Extend one prepared line."
    payload.boundary = ru ? "Не обгоняйте основу." : "Do not outrun the base."
    return payload
  }

  return payload
}

function fmt(v, digits = 4) {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(digits) : "—"
}

export async function getServerSideProps({ query }) {
  const rawLang = Array.isArray(query?.lang) ? query.lang[0] : query?.lang
  const locale = rawLang === "ru" ? "ru" : "en"
  const rawDate = Array.isArray(query?.d)
    ? query.d[0]
    : (query?.d ?? (Array.isArray(query?.date) ? query.date[0] : query?.date))

  const date = typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : new Date().toISOString().slice(0, 10)

  const { default: handler } = await import("./api/frey-temporal")
  const reqMock = { query: { date } }

  let data = {}
  const resMock = {
    status() { return this },
    json(obj) { data = obj }
  }

  await handler(reqMock, resMock)

  return { props: { temporal: data, locale } }
}

export default function Reading({ temporal, locale = "en" }) {
  const ru = locale === "ru"
  const [cosmoActive, setCosmoActive] = useState(false)
  const [selectedIntent, setSelectedIntent] = useState(null)
  const [readingMode, setReadingMode] = useState("general")

  useEffect(() => {
    if (!temporal?.date) {
      setReadingMode("general")
      return
    }

    if (typeof window === "undefined") return

    let nextMode = "general"

    try {
      const raw = window.localStorage.getItem(ANCHOR_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        const isValid = parsed
          && parsed.schema_version === ANCHOR_STORAGE_SCHEMA_VERSION
          && /^\d{4}-\d{2}-\d{2}$/.test(parsed.anchor_date || "")
          && parsed.anchor_date === temporal.date

        if (isValid) nextMode = "personal"
      }
    } catch (_error) {}

    setReadingMode(nextMode)
  }, [temporal?.date])

  if (!temporal || !temporal.date) {
    return (
      <main style={{ maxWidth: 820, margin: "80px auto", padding: "0 24px 84px", fontFamily: "system-ui" }}>
        <section
          data-frey-guide-link="FREY_GUIDE_LINK_PLACEMENT_V0_3"
          style={{
            width: 'min(1040px, 100%)',
            margin: '18px auto',
            border: '1px solid rgba(226, 180, 92, 0.28)',
            borderRadius: '20px',
            padding: '16px 18px',
            background: 'rgba(9, 12, 20, 0.68)',
            boxShadow: '0 18px 42px rgba(0, 0, 0, 0.18)',
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              color: '#d8ad62',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            {ru ? "Гид" : "Guide"}
          </p>
          <a
            href={ru ? "/guide/frey?lang=ru" : "/guide/frey?lang=en"}
            style={{
              color: '#f7d08a',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {ru ? "Как читать ответ Frey" : "Learn how to read a Frey response."}
          </a>
        </section>

        <h1>{ru ? "Темпоральное чтение Frey" : "Frey Temporal Reading"}</h1>
        <p>{ru ? "Темпоральный движок недоступен." : "Temporal engine unavailable."}</p>
      </main>
    )
  }

  const cosmo = mapCosmographer(temporal, ru)
  const navigator = mapNavigator(temporal, ru)
  const navigatorModeLabel = readingMode === "personal" ? (ru ? "Ежедневный навигатор · Личный" : "Daily Navigator · Personal") : (ru ? "Ежедневный навигатор" : "Daily Navigator")
  const actionStepText = readingMode === "personal"
    ? (ru ? "Выберите одну линзу ниже, чтобы продолжить это чтение с сохранением непрерывности." : "Choose one lens below to continue this continuity-bound reading.")
    : (ru ? "Выберите одну линзу ниже, чтобы продолжить это чтение." : "Choose one lens below to continue this reading.")
  const intentLabel = readingMode === "personal" ? (ru ? "Интерпретировать сигнал в непрерывности" : "Interpret this signal in continuity") : (ru ? "Интерпретировать этот сигнал" : "Interpret this signal")
  const cosmographerLabel = readingMode === "personal" ? (ru ? "Космограф · Личный" : "Cosmographer · Personal") : (ru ? "Космограф" : "Cosmographer")
  const placeholderText = readingMode === "personal"
    ? (ru ? "Выберите одно ограниченное направление, чтобы продолжить текущий сигнал в личном режиме." : "Select one bounded direction to continue the present signal in personal mode.")
    : (ru ? "Выберите одно ограниченное направление для чтения текущего сигнала." : "Select one bounded direction to read the present signal.")

  const shell = {
    maxWidth: 820,
    margin: "80px auto",
    padding: "0 24px 84px",
    fontFamily: "system-ui"
  }

  const label = {
    fontSize: 14,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.66,
    margin: 0
  }

  const metricValue = {
    fontSize: 20,
    lineHeight: 1.35,
    marginTop: 10,
    marginBottom: 0,
    opacity: 0.92,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.01em"
  }

  const unfoldWrap = {
    marginTop: 40,
    paddingTop: 32,
    borderTop: "1px solid rgba(255,255,255,0.08)"
  }

  const gate = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 168,
    padding: "9px 18px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    opacity: 0.74,
    fontSize: 15,
    letterSpacing: "0.01em"
  }

  const navigatorWrap = {
    marginTop: 52,
    paddingTop: 34,
    borderTop: "1px solid rgba(255,255,255,0.08)"
  }

  const formulaWrap = {
    marginTop: 18,
    padding: "20px 22px 22px",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)"
  }

  const formulaLine = {
    fontSize: 34,
    lineHeight: 1.08,
    marginTop: 14,
    marginBottom: 0,
    fontWeight: 650,
    letterSpacing: "-0.03em"
  }

  const continuityCue = {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    marginBottom: 12,
    padding: "5px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.025)",
    opacity: 0.54,
    fontSize: 11,
    lineHeight: 1,
    letterSpacing: "0.08em",
    textTransform: "uppercase"
  }

  const navGrid = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 14,
    marginTop: 22
  }

  const navCard = {
    padding: "18px 20px 20px",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)"
  }

  const navLabel = {
    fontSize: 12,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    opacity: 0.52,
    margin: 0
  }

  const navText = {
    fontSize: 18,
    lineHeight: 1.45,
    marginTop: 12,
    marginBottom: 0,
    opacity: 0.94
  }

  const intentWrap = {
    marginTop: 52,
    paddingTop: 34,
    borderTop: "1px solid rgba(255,255,255,0.08)"
  }

  const intentGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
    marginTop: 20
  }

  const intentButton = (active) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 48,
    padding: "12px 14px",
    borderRadius: 18,
    border: active ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.10)",
    background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 14,
    letterSpacing: "0.01em",
    textAlign: "center"
  })

  const responseCell = {
    marginTop: 22,
    padding: "22px 22px 24px",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)"
  }

  const responseLabel = {
    fontSize: 12,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    opacity: 0.52,
    margin: 0
  }

  const responseTitle = {
    fontSize: 28,
    lineHeight: 1.14,
    marginTop: 16,
    marginBottom: 0,
    fontWeight: 620,
    letterSpacing: "-0.02em"
  }

  const responseLine = {
    fontSize: 18,
    lineHeight: 1.45,
    marginTop: 16,
    marginBottom: 0,
    opacity: 0.92
  }

  const placeholder = {
    fontSize: 16,
    lineHeight: 1.5,
    marginTop: 16,
    marginBottom: 0,
    opacity: 0.58
  }

  const intents = {
    structure: {
      label: ru ? "Структурное условие" : "Structural condition",
      summary: cosmo.structural,
      anchor: `${ru ? "Якорь: структурное состояние" : "Anchor: Structural State"} ${fmt(temporal.structural_stability, 3)}.`,
      implication: ru ? "Читайте этот сигнал через целостность формы, а не через расширение." : "Read this signal through form integrity, not through expansion."
    },
    tension: {
      label: ru ? "Паттерн напряжения" : "Tension pattern",
      summary: cosmo.tension,
      anchor: `${ru ? "Якорь: поле напряжения" : "Anchor: Tension Field"} ${fmt(temporal.harmonic_tension, 4)}.`,
      implication: ru ? "Читайте этот сигнал через поведение давления, а не через проекцию нарратива." : "Read this signal through pressure behavior, not through narrative projection."
    },
    resonance: {
      label: ru ? "Качество резонанса" : "Resonance quality",
      summary: cosmo.resonance,
      anchor: `${ru ? "Якорь: поле резонанса" : "Anchor: Resonance Field"} ${fmt(temporal.resonance_level, 4)}.`,
      implication: ru ? "Читайте этот сигнал через силу согласования, а не через эмоциональное усиление." : "Read this signal through alignment strength, not through emotional amplification."
    },
    direction: {
      label: ru ? "Вектор направления" : "Direction vector",
      summary: `→ ${cosmo.direction}`,
      anchor: ru ? "Якорь: текущее чтение остаётся одно-состоянием." : "Anchor: current reading remains single-state.",
      implication: ru ? "Рассматривайте это как ограниченный следующий ход внутри текущего поля." : "Treat this as the bounded next move inside the present field."
    }
  }

  const activeCell = selectedIntent ? intents[selectedIntent] : null

  return (
    <main
      data-reading-surface="READING_SURFACE_MICRO_POLISH_V0_2"
      data-cosmographer-direction-gate="COSMOGRAPHER_DIRECTION_GATE_V0_1"
      data-reading-daily-navigator-foundation="READING_DAILY_NAVIGATOR_FOUNDATION_V0_1"
      data-reading-personal-mode-plumbing="A4_READING_PERSONAL_MODE_PLUMBING_V0_1"
      style={shell}
    >
        <section
          data-frey-guide-link="FREY_GUIDE_LINK_PLACEMENT_V0_3"
          style={{
            width: 'min(1040px, 100%)',
            margin: '18px auto',
            border: '1px solid rgba(226, 180, 92, 0.28)',
            borderRadius: '20px',
            padding: '16px 18px',
            background: 'rgba(9, 12, 20, 0.68)',
            boxShadow: '0 18px 42px rgba(0, 0, 0, 0.18)',
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              color: '#d8ad62',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            {ru ? "Гид" : "Guide"}
          </p>
          <a
            href={ru ? "/guide/frey?lang=ru" : "/guide/frey?lang=en"}
            style={{
              color: '#f7d08a',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {ru ? "Как читать ответ Frey" : "Learn how to read a Frey response."}
          </a>
        </section>

      <h1 style={{ fontSize: 80, lineHeight: 0.96, margin: 0, fontWeight: 700, letterSpacing: "-0.04em" }}>
        {ru ? "Темпоральное чтение Frey" : "Frey Temporal Reading"}
      </h1>

      <section style={{ marginTop: 42 }}>
        <p style={label}>{ru ? "Временной якорь" : "Date Anchor"}</p>
        <p style={{ ...metricValue, fontSize: 22 }}>{temporal.date}</p>
      </section>

      <section style={{ marginTop: 38 }}>
        <p style={label}>{ru ? "Структурное состояние" : "Structural State"}</p>
        <p style={metricValue}>{fmt(temporal.structural_stability, 3)}</p>
      </section>

      <section style={{ marginTop: 34 }}>
        <p style={label}>{ru ? "Поле напряжения" : "Tension Field"}</p>
        <p style={metricValue}>{fmt(temporal.harmonic_tension, 4)}</p>
      </section>

      <section style={{ marginTop: 34 }}>
        <p style={label}>{ru ? "Поле резонанса" : "Resonance Field"}</p>
        <p style={metricValue}>{fmt(temporal.resonance_level, 4)}</p>
      </section>

      <section
        style={navigatorWrap}
        data-reading-navigator-mode="READING_DAILY_NAVIGATOR_FOUNDATION_V0_1"
        data-reading-personal-mode={readingMode}
      >
        <p style={label}>{ru ? "Линия навигатора" : "Navigator Line"}</p>
        {readingMode === "personal" && (
          <span
            data-reading-personal-continuity-cue="A5_READING_PERSONAL_VISIBLE_CUE_V0_1"
            style={continuityCue}
          >
            {ru ? "Непрерывность связана" : "Continuity linked"}
          </span>
        )}
        <div style={formulaWrap}>
          <p style={responseLabel}>{navigatorModeLabel}</p>
          <p style={formulaLine}>{navigator.formula}</p>
        </div>

        <div style={navGrid}>
          <div style={navCard}>
            <p style={navLabel}>{ru ? "Источник" : "Origin"}</p>
            <p style={navText}>{navigator.origin}</p>
          </div>
          <div style={navCard}>
            <p style={navLabel}>{ru ? "Текущий порог" : "Current Gate"}</p>
            <p style={navText}>{navigator.gate}</p>
          </div>
          <div style={navCard}>
            <p style={navLabel}>{ru ? "Вектор" : "Vector"}</p>
            <p style={navText}>{navigator.vector}</p>
          </div>
          <div style={navCard}>
            <p style={navLabel}>{ru ? "Верное действие" : "Right Action"}</p>
            <p style={navText}>{navigator.action}</p>
          </div>
          <div style={navCard}>
            <p style={navLabel}>{ru ? "Граница" : "Boundary"}</p>
            <p style={navText}>{navigator.boundary}</p>
          </div>
        </div>
      </section>

      <div
        data-reading-nav-action-cell-live="READING_NAVIGATOR_ACTION_CELL_LIVE_LAYER_V0_1"
        data-reading-nav-action-cell="READING_NAVIGATOR_ACTION_CELL_V0_1"
        data-reading-personal-mode={readingMode}
        style={{
          marginTop: 16,
          marginBottom: 16,
          padding: "14px 16px",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.03)"
        }}
      >
        <p style={label}>{ru ? "Следующий шаг" : "Next step"}</p>
        <p style={{ fontSize: 16, lineHeight: 1.5, marginTop: 6, marginBottom: 0, opacity: 0.78 }}>
          {actionStepText}
        </p>
      </div>

      <section style={unfoldWrap}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button type="button" onClick={() => setCosmoActive(v => !v)} style={gate}>
            {ru ? "Раскрыть" : "Unfold"}
          </button>
        </div>
      </section>

      {cosmoActive && (
        <section style={{ marginTop: 64, paddingTop: 10 }}>
          <div style={{ marginTop: 24 }}>
            <p style={label}>{ru ? "Структурное состояние" : "Structural State"}</p>
            <p style={{ fontSize: 24, lineHeight: 1.28, marginTop: 18, marginBottom: 0, fontWeight: 560 }}>
              {cosmo.structural}
            </p>
          </div>

          <div style={{ marginTop: 40 }}>
            <p style={label}>{ru ? "Поле напряжения" : "Tension Field"}</p>
            <p style={{ fontSize: 24, lineHeight: 1.28, marginTop: 18, marginBottom: 0, fontWeight: 560 }}>
              {cosmo.tension}
            </p>
          </div>

          <div style={{ marginTop: 40 }}>
            <p style={label}>{ru ? "Поле резонанса" : "Resonance Field"}</p>
            <p style={{ fontSize: 24, lineHeight: 1.28, marginTop: 18, marginBottom: 0, fontWeight: 560 }}>
              {cosmo.resonance}
            </p>
          </div>

          <div style={{ marginTop: 42, paddingTop: 34, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={label}>{ru ? "Вектор направления" : "Direction Vector"}</p>
            <p style={{ fontSize: 64, lineHeight: 1, marginTop: 22, marginBottom: 0, fontWeight: 700, letterSpacing: "-0.04em" }}>
              → {cosmo.direction}
            </p>
          </div>

          <div
            style={intentWrap}
            data-reading-personal-mode={readingMode}
          >
            <p style={label}>{intentLabel}</p>

            <div style={intentGrid}>
              <button type="button" onClick={() => setSelectedIntent("structure")} style={intentButton(selectedIntent === "structure")}>
                {ru ? "Структурное условие" : "Structural condition"}
              </button>
              <button type="button" onClick={() => setSelectedIntent("tension")} style={intentButton(selectedIntent === "tension")}>
                {ru ? "Паттерн напряжения" : "Tension pattern"}
              </button>
              <button type="button" onClick={() => setSelectedIntent("resonance")} style={intentButton(selectedIntent === "resonance")}>
                {ru ? "Качество резонанса" : "Resonance quality"}
              </button>
              <button type="button" onClick={() => setSelectedIntent("direction")} style={intentButton(selectedIntent === "direction")}>
                {ru ? "Вектор направления" : "Direction vector"}
              </button>
            </div>

            <div style={responseCell} data-reading-personal-mode={readingMode}>
              <p style={responseLabel}>{cosmographerLabel}</p>

              {activeCell ? (
                <>
                  <p style={responseTitle}>{activeCell.label}</p>
                  <p style={responseLine}>{activeCell.summary}</p>
                  <p style={responseLine}>{activeCell.anchor}</p>
                  <p style={responseLine}>{activeCell.implication}</p>
                </>
              ) : (
                <p style={placeholder}>{placeholderText}</p>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

