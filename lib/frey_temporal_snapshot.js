export function buildTemporalSnapshot({ positions, aspects }) {
  const totalAspects = aspects?.length || 0;
  const totalBodies = Object.keys(positions || {}).length;

  const phase_density = totalBodies;
  const harmonic_tension = totalAspects;
  const resonance_level = totalBodies > 0 ? totalAspects / totalBodies : 0;
  const eclipse_proximity = 0;
  const structural_stability = totalBodies > 5 ? 1 : 0;

  return {
    phase_density,
    harmonic_tension,
    resonance_level,
    eclipse_proximity,
    structural_stability
  };
}
