function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pickDate(value) {
  if (!value || typeof value !== 'object') return null;
  const candidates = [
    value.date,
    value.primary_date,
    value.secondary_date,
    value.rawMetrics && value.rawMetrics.date,
    value.metrics && value.metrics.date,
    value.result && value.result.date,
    value.snapshot && value.snapshot.date,
    value.meta && value.meta.date,
  ];
  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) return item.trim();
  }
  return null;
}

function extractMetrics(value) {
  if (!value || typeof value !== 'object') return null;
  const objs = [
    value.rawMetrics,
    value.metrics,
    value.snapshot,
    value.result,
    value.data,
    value,
  ].filter(Boolean);
  for (const obj of objs) {
    const phase_density = asNumber(obj.phase_density);
    const harmonic_tension = asNumber(obj.harmonic_tension);
    const resonance_level = asNumber(obj.resonance_level);
    const eclipse_proximity = asNumber(obj.eclipse_proximity);
    const structural_stability = asNumber(obj.structural_stability);
    if (
      phase_density !== null &&
      harmonic_tension !== null &&
      resonance_level !== null &&
      structural_stability !== null
    ) {
      return {
        engine: obj.engine || 'frey-temporal-core-v0.1',
        date: pickDate(obj) || pickDate(value) || null,
        phase_density,
        harmonic_tension,
        resonance_level,
        eclipse_proximity,
        structural_stability,
        analysis: {
          volatility_index: asNumber(obj.analysis && obj.analysis.volatility_index),
          coherence_score: asNumber(obj.analysis && obj.analysis.coherence_score),
          phase_bias: asNumber(obj.analysis && obj.analysis.phase_bias),
        },
        meta: {
          engine_version: (obj.meta && obj.meta.engine_version) || obj.engine || 'frey-temporal-core-v0.1',
          cci_version: obj.meta && obj.meta.cci_version ? obj.meta.cci_version : null,
          layer: obj.meta && obj.meta.layer ? obj.meta.layer : null,
        },
      };
    }
  }
  return null;
}

function band(value, low = 0.34, high = 0.67) {
  if (value === null) return 'unknown';
  if (value < low) return 'low';
  if (value < high) return 'mid';
  return 'high';
}

function resolveZoneSubtype(metrics) {
  const density = metrics.phase_density;
  const tension = metrics.harmonic_tension;
  const resonance = metrics.resonance_level;
  const stability = metrics.structural_stability;
  if (stability < 0.35 || (tension >= 0.78 && resonance < 0.42)) return 'edge_instability';
  if (density >= 0.72) {
    if (stability >= 0.70 && tension < 0.34) return 'dense_stabilized';
    if (stability >= 0.60 && tension < 0.67) return 'dense_structured';
    return 'dense_compressed';
  }
  if (density < 0.40) return 'non_dense_regime';
  return 'structured_transitional';
}

const TEMPLATES = {
  dense_stabilized: {
    state: 'Stabilized density',
    meaning: 'The pattern is concentrated and held in a stable frame.',
    direction: 'Advance through one clean step without adding noise.',
  },
  dense_structured: {
    state: 'Structured density',
    meaning: 'Pressure is organized enough to support deliberate movement.',
    direction: 'Keep the sequence ordered and move through the next defined node.',
  },
  dense_compressed: {
    state: 'Compressed density',
    meaning: 'The field is concentrated but carrying compression and drag.',
    direction: 'Reduce parallel motion and release one bottleneck first.',
  },
  non_dense_regime: {
    state: 'Open regime',
    meaning: 'The pattern is loose and less materially bound.',
    direction: 'Anchor the next move in one concrete signal before scaling.',
  },
  edge_instability: {
    state: 'Edge instability',
    meaning: 'The current pattern is vulnerable to rupture or misfire.',
    direction: 'Do not escalate. Stabilize structure before any expansion.',
  },
  structured_transitional: {
    state: 'Transitional structure',
    meaning: 'The field is holding form but still reorganizing under load.',
    direction: 'Stay precise and let the next step confirm direction.',
  },
};

function mapResultToMinimalVoice(payload) {
  const metrics = extractMetrics(payload);
  if (!metrics) return null;
  const tensionBand = band(metrics.harmonic_tension);
  const resonanceBand = band(metrics.resonance_level);
  const stabilityBand = band(metrics.structural_stability);
  const zoneSubtype = resolveZoneSubtype(metrics);
  const template = TEMPLATES[zoneSubtype] || TEMPLATES.structured_transitional;
  return {
    state: template.state,
    meaning: template.meaning,
    direction: template.direction,
    contract: { zoneSubtype, tensionBand, resonanceBand, stabilityBand },
  };
}

const EXPORT_GUIDE_LINES = [
  'One date = state. Two dates = transition. Delta = structural change, not a better/worse ranking.',
  'Read raw metrics first, then Frey Meaning/Direction as a bounded interpretive layer.',
  'Compare relations between metrics; do not interpret any single metric in isolation.',
  'Timeline is nearby movement around the selected date, not a deterministic forecast.',
  'Do not invent missing evidence, causal claims, certainty, prophecy, or life instructions.',
  'Keep observation, interpretation, uncertainty, and boundary visibly separate.',
];

const METRIC_SEMANTICS = {
  phase_density: 'concentration / compactness of the temporal pattern',
  harmonic_tension: 'pressure, friction, or internal load in the field',
  resonance_level: 'alignment / coherence with the dominant pattern',
  eclipse_proximity: 'proximity to eclipse-linked amplification in the Frey model',
  structural_stability: 'capacity to hold form while pressure or movement changes',
};

const REFERENCE_MATERIALS = {
  en: [
    'https://www.bhrigu.io/guide/frey?lang=en',
    'https://www.bhrigu.io/publications/frey/bhrigu-frey-en-brief-v4.pdf',
    'https://www.bhrigu.io/publications/frey/bhrigu-frey-en-full-article-v4.pdf',
    'https://www.bhrigu.io/publications/frey/bhrigu-frey-en-approved-poster-pack-v5-visual-guide.pdf',
  ],
  ru: [
    'https://www.bhrigu.io/guide/frey?lang=ru',
    'https://www.bhrigu.io/publications/frey/bhrigu-frey-ru-v2-aligned.pdf',
    'https://www.bhrigu.io/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1-visual-guide.pdf',
  ],
};

function buildExternalAiPrompt({ mode = 'single', locale = 'en' } = {}) {
  const ru = locale === 'ru';
  const compare = mode === 'compare';
  if (ru) {
    return [
      'Ты читаешь структурированный пакет BHRIGU Frey. Твоя задача — помочь человеку понять временную структуру, не превращая её в пророчество, приговор или автоматическую инструкцию.',
      '',
      'ПОРЯДОК ЧТЕНИЯ',
      '1. Сначала прочитай primary_raw_metrics как исходные данные движка. Не подменяй их интерпретацией.',
      '2. Затем прочитай frey_response как ограниченный интерпретационный слой: состояние → значение → направление.',
      '3. Связывай метрики между собой. Не делай вывод из одной цифры отдельно от остальных.',
      compare
        ? '4. Здесь две даты. primary_date — исходная дата, compare_date — вторая дата. Читай delta как карту структурного изменения между ними, а не как рейтинг «лучше / хуже». Сначала опиши, что усилилось, что ослабло и что осталось устойчивым; затем объясни общий переход.'
        : '4. Здесь одна дата. Опиши её текущее состояние, внутреннее напряжение, согласованность, устойчивость и практический вектор без детерминизма.',
      '5. Если присутствует timeline, используй его только как карту ближайшего движения вокруг выбранной даты. Не выдавай его за гарантированный прогноз.',
      '6. Если данных недостаточно, прямо скажи об этом. Не достраивай отсутствующие метрики, события или причины.',
      '',
      'СМЫСЛ МЕТРИК',
      '- phase_density: концентрация / компактность временного паттерна.',
      '- harmonic_tension: давление, трение, внутренняя нагрузка.',
      '- resonance_level: согласование / когерентность с доминирующим паттерном.',
      '- eclipse_proximity: близость к усилению, связанному с затмением, внутри модели Frey.',
      '- structural_stability: способность структуры удерживать форму при изменении давления или движения.',
      '',
      'ГРАНИЦЫ',
      '- Не представляй Frey как пророчество или абсолютную истину.',
      '- Не усиливай уверенность сверх данных.',
      '- Не придумывай причинность.',
      '- Не превращай Direction в приказ человеку.',
      '- Для финансовых, медицинских, юридических и иных высокорисковых решений Frey может быть только дополнительным рефлексивным контекстом.',
      '',
      'ФОРМАТ ОТВЕТА',
      'A. Короткий вывод в 2–4 предложениях.',
      'B. Структурное состояние: что показывают исходные метрики вместе.',
      compare ? 'C. Переход между датами: что изменилось и в какую сторону.' : 'C. Значение: как читать текущее сочетание метрик.',
      'D. Направление: какой режим действия или внимания поддерживает Frey, без командного тона.',
      'E. Неопределённость и границы: что этот пакет не доказывает.',
      'F. При необходимости — один уточняющий вопрос человеку, который поможет связать чтение с его реальным контекстом.',
      '',
      'Отвечай на языке пользователя. Сохраняй различие между raw data, интерпретацией и человеческим решением.',
    ].join('\n');
  }

  return [
    'You are reading a structured BHRIGU Frey packet. Your task is to help a person understand a temporal structure without turning it into prophecy, verdict, or automatic instruction.',
    '',
    'READING ORDER',
    '1. Read primary_raw_metrics first as deterministic engine output. Do not replace raw data with interpretation.',
    '2. Then read frey_response as a bounded interpretive layer: state → meaning → direction.',
    '3. Interpret relationships among metrics. Do not make a conclusion from one metric in isolation.',
    compare
      ? '4. This packet contains two dates. primary_date is the starting date and compare_date is the second date. Read delta as a map of structural change between them, never as a ranking of “better” and “worse” days. First identify what strengthened, weakened, or stayed stable; then describe the overall transition.'
      : '4. This packet contains one date. Describe its current structure, internal load, coherence, stability, and practical vector without deterministic claims.',
    '5. If timeline is present, use it only as a map of nearby movement around the selected date. Do not present it as a guaranteed forecast.',
    '6. If evidence is missing, say so explicitly. Do not invent metrics, events, causes, or hidden context.',
    '',
    'METRIC SEMANTICS',
    '- phase_density: concentration / compactness of the temporal pattern.',
    '- harmonic_tension: pressure, friction, or internal load.',
    '- resonance_level: alignment / coherence with the dominant pattern.',
    '- eclipse_proximity: proximity to eclipse-linked amplification inside the Frey model.',
    '- structural_stability: capacity to hold form while pressure or movement changes.',
    '',
    'BOUNDARIES',
    '- Do not present Frey as prophecy or absolute truth.',
    '- Do not amplify certainty beyond the data.',
    '- Do not invent causality.',
    '- Do not turn Direction into an order to the person.',
    '- For financial, medical, legal, or other high-stakes decisions, Frey can only be supplementary reflective context.',
    '',
    'RESPONSE FORMAT',
    'A. Short synthesis in 2–4 sentences.',
    'B. Structural state: what the raw metrics show together.',
    compare ? 'C. Transition between dates: what changed and in which direction.' : 'C. Meaning: how to read the current combination of metrics.',
    'D. Direction: what mode of attention or action Frey supports, without command language.',
    'E. Uncertainty and boundaries: what this packet does not prove.',
    'F. If useful, ask one clarifying question that connects the reading to the person’s real context.',
    '',
    'Reply in the user’s language. Preserve the distinction between raw data, interpretation, and human judgment.',
  ].join('\n');
}

function buildFreyExportPayload({
  mode,
  locale = 'en',
  url,
  primaryDate,
  compareDate,
  primaryResult,
  compareResult,
  freyVoice,
  deltaBlock = null,
  timelineResults = null,
}) {
  const normalizedLocale = locale === 'ru' ? 'ru' : 'en';
  return {
    schema_version: 'frey-ai-reading-packet-v1',
    protocol_version: 'frey-external-ai-reading-protocol-v1',
    mode,
    language: normalizedLocale,
    url: url || '',
    primary_date: primaryDate || pickDate(primaryResult) || null,
    compare_date: compareDate || pickDate(compareResult) || null,
    primary_raw_metrics: extractMetrics(primaryResult),
    compare_raw_metrics: compareResult ? extractMetrics(compareResult) : null,
    delta: deltaBlock || null,
    timeline: Array.isArray(timelineResults) ? timelineResults : null,
    frey_response: freyVoice || null,
    metric_semantics: METRIC_SEMANTICS,
    reading_law: EXPORT_GUIDE_LINES,
    prompt_for_external_ai: buildExternalAiPrompt({ mode, locale: normalizedLocale }),
    reference_materials: REFERENCE_MATERIALS[normalizedLocale],
  };
}

function buildFreyExportText(payload) {
  const prompt = payload && payload.prompt_for_external_ai ? payload.prompt_for_external_ai : '';
  const data = payload ? { ...payload } : {};
  delete data.prompt_for_external_ai;
  return [
    'BHRIGU FREY · AI READING PACKET',
    '',
    'INSTRUCTION FOR THE RECEIVING AI',
    prompt,
    '',
    '--- FREY DATA PACKET ---',
    JSON.stringify(data, null, 2),
  ].join('\n');
}

module.exports = {
  EXPORT_GUIDE_LINES,
  METRIC_SEMANTICS,
  REFERENCE_MATERIALS,
  buildExternalAiPrompt,
  buildFreyExportPayload,
  buildFreyExportText,
  mapResultToMinimalVoice,
};
