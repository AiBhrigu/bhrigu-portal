function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function band(value, low = 0.34, high = 0.67) {
  if (value === null) return 'unknown';
  if (value < low) return 'low';
  if (value < high) return 'mid';
  return 'high';
}

function normalizeMetrics(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const candidateObjects = [
    payload.rawMetrics,
    payload.metrics,
    payload.data,
    payload.snapshot,
    payload.result,
    payload.analysis && payload.analysis.metrics ? payload.analysis.metrics : null,
    payload.analysis,
    payload,
  ].filter(Boolean);

  for (const candidate of candidateObjects) {
    const phaseDensity = asNumber(candidate.phase_density);
    const harmonicTension = asNumber(candidate.harmonic_tension);
    const resonanceLevel = asNumber(candidate.resonance_level);
    const structuralStability = asNumber(candidate.structural_stability);

    if (
      phaseDensity !== null &&
      harmonicTension !== null &&
      resonanceLevel !== null &&
      structuralStability !== null
    ) {
      return {
        phase_density: phaseDensity,
        harmonic_tension: harmonicTension,
        resonance_level: resonanceLevel,
        structural_stability: structuralStability,
      };
    }
  }

  return null;
}

function resolveZoneSubtype(metrics) {
  const density = metrics.phase_density;
  const tension = metrics.harmonic_tension;
  const resonance = metrics.resonance_level;
  const stability = metrics.structural_stability;

  if (stability < 0.35 || (tension >= 0.78 && resonance < 0.42)) {
    return 'edge_instability';
  }

  if (density >= 0.72) {
    if (stability >= 0.70 && tension < 0.34) {
      return 'dense_stabilized';
    }
    if (stability >= 0.60 && tension < 0.67) {
      return 'dense_structured';
    }
    return 'dense_compressed';
  }

  if (density < 0.40) {
    return 'non_dense_regime';
  }

  return 'structured_transitional';
}

const TEMPLATES = {
  dense_stabilized: {
    state: 'Stabilized density',
    meaning: 'Energy is concentrated and holding form without visible fracture.',
    direction: 'Continue with one deliberate step and avoid widening the field.',
  },
  dense_structured: {
    state: 'Structured density',
    meaning: 'Pressure is organized enough to support clean execution.',
    direction: 'Keep the sequence ordered and move through the next defined node.',
  },
  dense_compressed: {
    state: 'Compressed density',
    meaning: 'The field is loaded, but compression is starting to narrow flexibility.',
    direction: 'Reduce excess load and act through one precise channel only.',
  },
  non_dense_regime: {
    state: 'Open regime',
    meaning: 'The field is not compact enough for force and works better through calibration.',
    direction: 'Stabilize the frame first, then commit to the next move.',
  },
  structured_transitional: {
    state: 'Transitional structure',
    meaning: 'The field is coherent, but still reorganizing its internal geometry.',
    direction: 'Hold the line steady and complete the next clean adjustment.',
  },
  edge_instability: {
    state: 'Edge instability',
    meaning: 'Instability is overriding structure and can distort the line.',
    direction: 'Do not expand the scope; restore stability before moving forward.',
  },
};

function buildFreyConversationalInterpretation(payload) {
  const metrics = normalizeMetrics(payload);
  if (!metrics) return null;

  const zoneSubtype = resolveZoneSubtype(metrics);
  const tensionBand = band(metrics.harmonic_tension);
  const resonanceBand = band(metrics.resonance_level);
  const stabilityBand = band(metrics.structural_stability);
  const signature = `${zoneSubtype}__${tensionBand}__${resonanceBand}__${stabilityBand}`;
  const template =
    TEMPLATES[signature] ||
    TEMPLATES[zoneSubtype] ||
    TEMPLATES.structured_transitional;

  return {
    state: template.state,
    meaning: template.meaning,
    direction: template.direction,
    contract: {
      zoneSubtype,
      tensionBand,
      resonanceBand,
      stabilityBand,
      signature,
    },
    metrics,
  };
}

module.exports = {
  buildFreyConversationalInterpretation,
};
