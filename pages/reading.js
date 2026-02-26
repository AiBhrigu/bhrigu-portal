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
  return {
    width: value + "%"
  };
}

export default function Reading({ force_ssr_marker, metrics }) {
  return (
    <div data-reading-surface="READING_V2_SURFACE_V0_1">
      <h1>Reading v2 Surface</h1>

      <div style={{ marginBottom: "24px" }}>
        <p>Phase Density</p>
        <div style={{ background: "#222", height: "8px" }}>
          <div style={{ ...bar(metrics.phase_density), background: "#d4af37", height: "8px" }} />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p>Harmonic Tension</p>
        <div style={{ background: "#222", height: "8px" }}>
          <div style={{ ...bar(metrics.harmonic_tension), background: "#b8860b", height: "8px" }} />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p>Resonance Level</p>
        <div style={{ background: "#222", height: "8px" }}>
          <div style={{ ...bar(metrics.resonance_level), background: "#daa520", height: "8px" }} />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p>Structural Stability</p>
        <div style={{ background: "#222", height: "8px" }}>
          <div style={{ ...bar(metrics.structural_stability), background: "#cd853f", height: "8px" }} />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p>Volatility</p>
        <div style={{ background: "#222", height: "6px" }}>
          <div style={{ ...bar(metrics.volatility_index), background: "#888", height: "6px" }} />
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <p>Coherence</p>
        <div style={{ background: "#222", height: "6px" }}>
          <div style={{ ...bar(metrics.coherence_score), background: "#aaa", height: "6px" }} />
        </div>
      </div>

      <p>Engine: frey-temporal-core-v0.1</p>
      <div id="surface-marker">{force_ssr_marker}</div>
    </div>
  );
}
