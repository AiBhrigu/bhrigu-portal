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
  'phase_density = concentration of temporal pattern',
  'harmonic_tension = pressure / friction in the field',
  'resonance_level = alignment with the dominant pattern',
  'eclipse_proximity = closeness to eclipse-driven amplification',
  'structural_stability = capacity to hold form under pressure',
  'Use Meaning/Direction as interpretive layer, not as raw engine data.',
];

function buildFreyExportPayload({ mode, url, primaryDate, compareDate, primaryResult, compareResult, freyVoice }) {
  return {
    mode,
    url: url || '',
    primary_date: primaryDate || pickDate(primaryResult) || null,
    compare_date: compareDate || pickDate(compareResult) || null,
    primary_raw_metrics: extractMetrics(primaryResult),
    compare_raw_metrics: compareResult ? extractMetrics(compareResult) : null,
    frey_response: freyVoice || null,
    how_to_read_for_external_ai: EXPORT_GUIDE_LINES,
  };
}

function buildFreyExportText(payload) {
  return JSON.stringify(payload, null, 2);
}

module.exports = {
  EXPORT_GUIDE_LINES,
  buildFreyExportPayload,
  buildFreyExportText,
  mapResultToMinimalVoice,
};
