export function computeTemporalSnapshot(dateStr) {
  const date = new Date(dateStr);
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const day = Math.floor(diff / (1000 * 60 * 60 * 24));

  const yearProgress = day / 365;
  const weekCycle = day % 7;
  const lunarCycle = day % 29;

  const phase_density = (Math.sin(2 * Math.PI * yearProgress) + 1) / 2;

  const harmonic_tension = Math.abs(
    Math.sin(2 * Math.PI * weekCycle / 7) *
    Math.cos(2 * Math.PI * lunarCycle / 29)
  );

  const resonance_level = Math.abs(
    (Math.sin(2 * Math.PI * yearProgress) +
     Math.sin(2 * Math.PI * weekCycle / 7)) / 2
  );

  const eclipse_proximity = 1 - Math.abs(0.5 - (lunarCycle / 29));

  const structural_stability =
    1 - ((harmonic_tension + resonance_level) / 2);

  return {
    engine: "frey-temporal-core-v0.1",
    date: dateStr,
    phase_density: Number(phase_density.toFixed(4)),
    harmonic_tension: Number(harmonic_tension.toFixed(4)),
    resonance_level: Number(resonance_level.toFixed(4)),
    eclipse_proximity: Number(eclipse_proximity.toFixed(4)),
    structural_stability: Number(structural_stability.toFixed(4))
  };
}
