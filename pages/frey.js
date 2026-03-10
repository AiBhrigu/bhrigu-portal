import { useMemo, useState } from "react";

function band(value) {
  if (typeof value !== "number") return "unknown";
  if (value >= 0.75) return "high";
  if (value >= 0.45) return "medium";
  return "low";
}

function buildInterpretation(result) {
  if (!result) return null;

  const density = band(result.phase_density);
  const tension = band(result.harmonic_tension);
  const resonance = band(result.resonance_level);
  const eclipse = band(result.eclipse_proximity);
  const stability = band(result.structural_stability);

  let tone = "Balanced signal with moderate movement.";

  if (stability === "high" && resonance === "high") {
    tone = "Stable resonance window with strong alignment potential.";
  } else if (tension === "high" && stability !== "high") {
    tone = "High-pressure window. Move carefully and reduce unnecessary friction.";
  } else if (density === "high" && resonance === "low") {
    tone = "Dense field with low coherence. Good for observation, not force.";
  } else if (eclipse === "high") {
    tone = "Eclipse-sensitive window. Expect amplification, distortion, or accelerated shifts.";
  }

  return {
    tone,
    rows: [
      ["Phase density", density],
      ["Harmonic tension", tension],
      ["Resonance level", resonance],
      ["Eclipse proximity", eclipse],
      ["Structural stability", stability]
    ]
  };
}

export default function Frey() {
  const [date, setDate] = useState("");
  const [result, setResult] = useState(null);

  const interpretation = useMemo(() => buildInterpretation(result), [result]);

  async function runTemporal() {
    if (!date) return;
    const res = await fetch(`/api/frey-temporal?date=${date}`);
    const data = await res.json();
    setResult(data);
  }

  return (
    <div className="freyRoot">
      <div className="freyAxis" />
      <div className="freyMembrane" data-frey-bind={MARKER}>
        <div className="freyContent">
          <div className="freyMode">FREY · Query Interface</div>

          <input className="freyInput" placeholder="Enter signal..." />
          <button className="freyButton">Next</button>

          <div className="freyDivider" />

          <div className="freyTemporalBlock" data-frey-temporal="V0_7">
            <div className="freyTemporalTitle">Temporal Snapshot</div>

            <div className="freyTemporalRow">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="freyInput freyTemporalInput"
              />

              <button onClick={runTemporal} className="freyButton freyTemporalButton">
                Run Temporal
              </button>
            </div>

            {interpretation && (
              <div className="freyInterpretation" data-frey-interpretation={MARKER}>
                <div className="freyInterpretationTitle">Cosmographic Interpretation</div>
                <div className="freyInterpretationTone">{interpretation.tone}</div>
                <div className="freyInterpretationGrid">
                  {interpretation.rows.map(([label, value]) => (
                    <div key={label} className="freyInterpretationRow">
                      <span className="freyInterpretationLabel">{label}</span>
                      <span className="freyInterpretationValue">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result && <pre className="freyJson">{JSON.stringify(result, null, 2)}</pre>}
          </div>
        </div>
      </div>

      <style jsx>{`
        .freyRoot {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #0b1220 0%, #05070c 70%);
          position: relative;
        }

        .freyAxis {
          position: absolute;
          width: 1px;
          height: 100%;
          background: rgba(255, 200, 120, 0.15);
        }

        .freyMembrane {
          width: 560px;
          padding: 48px;
          border-radius: 22px;
          border: 1px solid rgba(255, 200, 120, 0.3);
          background: rgba(12, 16, 24, 0.92);
          backdrop-filter: blur(14px);
        }

        .freyContent {
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: center;
        }

        .freyDivider {
          margin-top: 28px;
          border-top: 1px solid rgba(255, 200, 120, 0.2);
          padding-top: 24px;
        }

        .freyTemporalBlock {
          margin-top: 6px;
        }

        .freyTemporalTitle {
          font-size: 14px;
          opacity: 0.7;
          margin-bottom: 14px;
        }

        .freyTemporalRow {
          display: flex;
          align-items: center;
          gap: 14px;
          max-width: 460px;
          margin: 0 auto;
        }

        .freyInput {
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255, 200, 120, 0.3);
          background: rgba(10, 14, 20, 0.9);
          color: #fff;
        }

        .freyButton {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255, 200, 120, 0.4);
          background: rgba(255, 200, 120, 0.1);
          color: #fff;
          cursor: pointer;
        }

        .freyTemporalInput {
          flex: 1;
          height: 44px;
        }

        .freyTemporalButton {
          flex: 0.618;
          height: 44px;
        }

        .freyTemporalButton:hover {
          background: rgba(255, 200, 120, 0.18);
        }

        .freyInterpretation {
          margin-top: 18px;
          padding: 16px;
          border-radius: 14px;
          border: 1px solid rgba(255, 200, 120, 0.24);
          background: rgba(255, 200, 120, 0.06);
          text-align: left;
        }

        .freyInterpretationTitle {
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.72;
          margin-bottom: 8px;
        }

        .freyInterpretationTone {
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .freyInterpretationGrid {
          display: grid;
          gap: 8px;
        }

        .freyInterpretationRow {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 200, 120, 0.12);
        }

        .freyInterpretationLabel {
          opacity: 0.72;
        }

        .freyInterpretationValue {
          text-transform: capitalize;
        }

        .freyJson {
          margin-top: 18px;
          text-align: left;
          font-size: 12px;
          overflow-x: auto;
        }

        @media (max-width: 768px) {
          .freyMembrane {
            width: 92%;
            padding: 32px;
          }
        }

        @media (max-width: 520px) {
          .freyTemporalRow {
            flex-direction: column;
          }

          .freyTemporalButton {
            width: 100%;
          }

          .freyInterpretationRow {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

const MARKER = "__FREY_INTERPRETATION_BIND_MINIMAL_V0_2__";
