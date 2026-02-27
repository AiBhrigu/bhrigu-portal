export const getServerSideProps = async () => {
  return {
    props: {
      force_ssr_marker: "READING_V2_SURFACE_V0_1",
      metrics: {
        phase_density: 50,
        harmonic_tension: 60,
        resonance_level: 40,
        structural_stability: 42,
        volatility_index: 63,
        coherence_score: 44
      }
    }
  };
};

function bar(value) {
  const safe = typeof value === "number" ? value : 0;
  return {
    width: safe + "%"
  };
}

export default function Reading(props) {
  const force_ssr_marker = props?.force_ssr_marker ?? "SSR_GUARD_FALLBACK";

  const metrics = props?.metrics ?? {};

  const phase_density = metrics?.phase_density ?? 0;
  const harmonic_tension = metrics?.harmonic_tension ?? 0;
  const resonance_level = metrics?.resonance_level ?? 0;
  const structural_stability = metrics?.structural_stability ?? 0;
  const volatility_index = metrics?.volatility_index ?? 0;
  const coherence_score = metrics?.coherence_score ?? 0;

  return (
    <div data-reading-surface="READING_V2_SURFACE_V0_1">
      <h1>Reading v2 Surface</h1>

      <div style={{ marginBottom: "24px" }}>
        <p>Phase Density</p>
        <div style={{ background: "#222", height: "8px" }}>
          <div style={{ ...bar(phase_density), background: "#d4af37", height: "8px" }} />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p>Harmonic Tension</p>
        <div style={{ background: "#222", height: "8px" }}>
          <div style={{ ...bar(harmonic_tension), background: "#b8860b", height: "8px" }} />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p>Resonance Level</p>
        <div style={{ background: "#222", height: "8px" }}>
          <div style={{ ...bar(resonance_level), background: "#daa520", height: "8px" }} />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p>Structural Stability</p>
        <div style={{ background: "#222", height: "8px" }}>
          <div style={{ ...bar(structural_stability), background: "#cd853f", height: "8px" }} />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p>Volatility</p>
        <div style={{ background: "#222", height: "6px" }}>
          <div style={{ ...bar(volatility_index), background: "#888", height: "6px" }} />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p>Coherence</p>
        <div style={{ background: "#222", height: "6px" }}>
          <div style={{ ...bar(coherence_score), background: "#aaa", height: "6px" }} />
        </div>
      </div>

      <p>Engine: frey-temporal-core-v0.1</p>
      <div id="surface-marker">{force_ssr_marker}</div>
    </div>
  );
}
