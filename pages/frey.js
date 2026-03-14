import { useMemo, useState } from "react";

const MARKER = "__FREY_INTERPRETATION_CONSOLE_V1_4__";

function formatMetricLabel(label) {
  return label
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildInterpretation(result) {
  if (!result) {
    return {
      marker: "Cosmographic Interpretation",
      zones: [],
      vector: null,
    };
  }

  const phase = Number(result.phase_density ?? 0);
  const tension = Number(result.harmonic_tension ?? 0);
  const resonance = Number(result.resonance_level ?? 0);
  const stability = Number(result.structural_stability ?? 0);
  const eclipse = Number(result.eclipse_proximity ?? 0);
  const coherence = Number(result.analysis?.coherence_score ?? 0);
  const volatility = Number(result.analysis?.volatility_index ?? 0);

  const phaseState = phase >= 0.90
    ? stability >= 0.8376 && volatility <= 0.4675
      ? ["Stabilized dense core", "The dense regime stays internally settled, with strong formation continuity and very low structural agitation."]
      : stability <= 0.6360 || volatility >= 0.6495
      ? ["Compressed dense regime", "The dense regime stays structurally compact, while internal compression rises and reduces the ease of structural pacing."]
      : ["Structured dense formation", "The dense regime remains well-formed, while internal movement stays contained within a stable structural arrangement."]
    : phase >= 0.78
    ? ["Eclipse-sensitive transition band", "The field remains transitional, with enough structural density to retain a defined but shifting regime contour."]
    : phase >= 0.58
    ? ["Eclipse-sensitive transition band", "The regime moves through a looser transition layer, where structural definition shifts more readily across nearby dates."]
    : ["Open structural dispersion", "The field stays open and diffuse, with weaker formation density and low structural containment."];

  const tensionState = tension >= 0.72 || volatility >= 0.68
    ? ["Elevated internal load", "Pressure accumulates faster than release, raising distortion risk under acceleration."]
    : tension >= 0.42 || volatility >= 0.48
    ? ["Medium load with acceleration risk", "Baseline pressure stays moderate, yet distortion rises fast when motion exceeds structural pacing."]
    : ["Low pressure band", "Friction stays reduced, allowing motion without heavy internal compression."];

  const resonanceState = resonance >= 0.74 && coherence >= 0.68
    ? ["High internal coherence", "Signal coupling holds across the field and supports sustained harmonic continuity."]
    : resonance >= 0.45 || coherence >= 0.45
    ? ["Moderate coherence under fluctuation", "Signal aligns in short stable bands, but resonance breaks when the field is forced beyond its internal rhythm."]
    : ["Weak harmonic lock", "Coupling remains partial and coherence fragments under unstable movement."];

  const stabilityState = stability >= 0.72
    ? ["Supported core frame", "Structure remains well-supported and can hold motion without immediate edge-loss."]
    : stability >= 0.45 || eclipse >= 0.7
    ? ["Medium support with sensitive edges", "Core structure holds, while outer balance becomes vulnerable during amplified or fast-turning phases."]
    : ["Fragile outer balance", "Support remains limited and weak edges lose alignment under excess push."];

  const vector = tension >= 0.72 || stability < 0.4
    ? "Mode: Hold structure"
    : resonance >= 0.7 && stability >= 0.62
    ? "Mode: Advance through the stable line"
    : eclipse >= 0.72
    ? "Mode: Reduce expansion at unstable edges"
    : "Mode: Controlled advance";

  return {
    marker: "Cosmographic Interpretation",
    zones: [
      { label: "Structural State", state: phaseState[0], effect: phaseState[1] },
      { label: "Tension Profile", state: tensionState[0], effect: tensionState[1] },
      { label: "Resonance Profile", state: resonanceState[0], effect: resonanceState[1] },
      { label: "Stability", state: stabilityState[0], effect: stabilityState[1] },
    ],
    vector,
  };
}

export async function getServerSideProps({ query }) {
  const rawDate = Array.isArray(query?.d) ? query.d[0] : query?.d;
  const initialDate =
    typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : "";

  const rawCompareDate = Array.isArray(query?.d2) ? query.d2[0] : query?.d2;
  const initialCompareDate =
    typeof rawCompareDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawCompareDate)
      ? rawCompareDate
      : "";

  let initialResult = null;
  let initialCompareResult = null;
  let initialQueryMarker = "__FREY_QUERY_INTERFACE_MINI_V0_1__:EMPTY";

  if (initialDate) {
    const { default: handler } = await import("./api/frey-temporal");

    let payload = null;
    const req = { method: "GET", query: { date: initialDate } };
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(name, value) {
        this.headers[name] = value;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        payload = data;
        return data;
      },
      end() {
        return null;
      },
    };

    await handler(req, res);

    if (!payload || payload.error) {
      throw new Error("FREY_QUERY_INTERFACE_MINI_SSR_FAILED");
    }

    initialResult = payload;
    initialQueryMarker = "__FREY_QUERY_INTERFACE_MINI_V0_1__:" + initialDate;
  }

  if (initialCompareDate) {
    const { default: handler } = await import("./api/frey-temporal");

    let payload2 = null;
    const req2 = { method: "GET", query: { date: initialCompareDate } };
    const res2 = {
      statusCode: 200,
      headers: {},
      setHeader(name, value) {
        this.headers[name] = value;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        payload2 = data;
        return data;
      },
      end() {
        return null;
      },
    };

    await handler(req2, res2);

    if (!payload2 || payload2.error) {
      throw new Error("FREY_COMPARE_MODE_SSR_FAILED");
    }

    initialCompareResult = payload2;
  }

  const rawTimeline = Array.isArray(query?.tl) ? query.tl[0] : query?.tl;
  const initialTimelineDates =
    typeof rawTimeline === "string" && rawTimeline.trim()
      ? rawTimeline
          .split(",")
          .map((part) => part.trim())
          .filter((part) => /^\d{4}-\d{2}-\d{2}$/.test(part))
          .slice(0, 5)
      : ["1971-10-13", "1984-05-07", "2026-03-14"];

  const initialTimelineResults = [];
  for (const timelineDate of initialTimelineDates) {
    const { default: handler } = await import("./api/frey-temporal");
    let payload3 = null;
    const req3 = { method: "GET", query: { date: timelineDate } };
    const res3 = {
      statusCode: 200,
      headers: {},
      setHeader(name, value) {
        this.headers[name] = value;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        payload3 = data;
        return data;
      },
      end() {
        return null;
      },
    };

    await handler(req3, res3);

    if (!payload3 || payload3.error) {
      throw new Error("FREY_TIMELINE_MODE_SSR_FAILED");
    }

    initialTimelineResults.push({
      date: timelineDate,
      vector: buildTimelineVector(payload3),
    });
  }

  return {
    props: {
      initialDate,
      initialResult,
      initialCompareDate,
      initialCompareResult,
      initialTimelineDates,
      initialTimelineResults,
      initialQueryMarker,
    },
  };
}


function buildDeltaBlock(primary, secondary) {
  if (!primary || !secondary) {
    return null;
  }

  const metrics = [
    ["phase_density", Number((secondary.phase_density ?? 0) - (primary.phase_density ?? 0))],
    ["harmonic_tension", Number((secondary.harmonic_tension ?? 0) - (primary.harmonic_tension ?? 0))],
    ["resonance_level", Number((secondary.resonance_level ?? 0) - (primary.resonance_level ?? 0))],
    ["structural_stability", Number((secondary.structural_stability ?? 0) - (primary.structural_stability ?? 0))],
  ];

  const direction = (value) => (value > 0 ? "UP" : value < 0 ? "DOWN" : "FLAT");
  const fmt = (value) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;

  const resonanceDelta = metrics[2][1];
  const tensionDelta = metrics[1][1];
  const stabilityDelta = metrics[3][1];

  let mode = "Balanced temporal shift";
  let description = "The compared dates remain within a moderate structural reconfiguration band.";

  if (resonanceDelta >= 0.20 && stabilityDelta >= 0.08) {
    mode = "Acceleration of structural resonance";
    description = "The field moves from a more constrained configuration toward a clearer expansion window.";
  } else if (tensionDelta <= -0.20 && stabilityDelta >= 0.05) {
    mode = "Collapse of harmonic tension";
    description = "The field descends toward a more stable basin with lower internal strain.";
  } else if (tensionDelta >= 0.20 && stabilityDelta <= -0.08) {
    mode = "Escalation into unstable load";
    description = "The compared dates show rising pressure with weaker structural support.";
  }

  return {
    rows: metrics.map(([label, value]) => ({
      label,
      arrow: direction(value),
      value: fmt(value),
    })),
    mode,
    description,
  };
}


function buildTimelineVector(result) {
  const phase = Number(result?.phase_density ?? 0);
  const tension = Number(result?.harmonic_tension ?? 0);
  const resonance = Number(result?.resonance_level ?? 0);
  const stability = Number(result?.structural_stability ?? 0);

  if (tension >= 0.72 || stability < 0.4) return "Hold structure";
  if (resonance >= 0.7 && stability >= 0.62) return "Stable line";
  if (phase >= 0.9) return "Dense phase";
  return "Controlled advance";
}

export default function Frey({ initialDate, initialResult, initialCompareDate, initialCompareResult, initialTimelineDates, initialTimelineResults, initialQueryMarker }) {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState(initialDate);
  const [result, setResult] = useState(initialResult);
  const [compareDate, setCompareDate] = useState(initialCompareDate || "");
  const [compareResult, setCompareResult] = useState(initialCompareResult);
  const [timelineDates, setTimelineDates] = useState(initialTimelineDates || []);
  const [timelineResults, setTimelineResults] = useState(initialTimelineResults || []);
  const [loading, setLoading] = useState(false);

  const SNAPSHOT_DATES = [
    "2026-03-14",
    "2025-01-26",
    "2000-01-01",
    "1984-05-07",
    "1971-10-13",
  ];

  const interpretation = useMemo(() => buildInterpretation(result), [result]);
  const compareInterpretation = useMemo(() => buildInterpretation(compareResult), [compareResult]);
  const deltaBlock = useMemo(() => buildDeltaBlock(result, compareResult), [result, compareResult]);

  function runSnapshot(nextDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)) return;
    if (typeof window !== "undefined") {
      window.location.assign(`/frey?d=${encodeURIComponent(nextDate)}`);
    }
  }

  function runCompare() {
    if (!date || !compareDate) return;
    if (typeof window !== "undefined") {
      window.location.assign(`/frey?d=${encodeURIComponent(date)}&d2=${encodeURIComponent(compareDate)}`);
    }
  }

  function runTimeline(nextDates) {
    if (!Array.isArray(nextDates) || !nextDates.length) return;
    const normalized = nextDates
      .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
      .slice(0, 5)
      .join(',');
    if (!normalized) return;
    if (typeof window !== "undefined") {
      const primary = date ? `d=${encodeURIComponent(date)}&` : '';
      const secondary = compareDate ? `d2=${encodeURIComponent(compareDate)}&` : '';
      window.location.assign(`/frey?${primary}${secondary}tl=${encodeURIComponent(normalized)}`);
    }
  }

  function runTemporal() {
    if (!date) return;
    if (typeof window !== "undefined") {
      window.location.assign(`/frey?d=${encodeURIComponent(date)}`);
    }
  }

  return (
    <div className="freyRoot">
      <div className="freyAxis" />
      <div className="freyMembrane" data-frey-bind={MARKER} data-frey-query-bind="__FREY_QUERY_INTERFACE_MINI_V0_1__" data-frey-query-date={initialDate || ""}>
        <div className="freyContent">
          <div
            className="freyMode"
            data-frey-grant-demo="__FREY_GRANT_DEMO_LOCK_V0_1__"
            data-frey-grant-demo-state="LOCKED"
          >
            FREY · Grant Demo Lock
          </div>

          <div className="freyCommandRow">
            <input
              className="freyInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter signal..."
            />
            <button className="freyButton" type="button">Next</button>
          </div>

          <div className="freyGrantDemoBar">
            <div className="freyGrantDemoTitle">Grant demo surface</div>
            <div className="freyGrantDemoMeta">Query · Snapshots · Compare · Delta · Timeline</div>
          </div>

          <div className="freyDivider" />

          <div className="freyTemporalBlock" data-frey-temporal="V0_7" data-frey-query-marker={initialQueryMarker}>
            <div className="freyTemporalTitle">Temporal Snapshot</div>

            <div
              className="freySnapshotRow"
              data-frey-snapshots="__FREY_TEMPORAL_SNAPSHOTS_V0_1__"
              data-frey-snapshot-active={initialDate || ""}
            >
              {SNAPSHOT_DATES.map((snapshotDate) => (
                <button
                  key={snapshotDate}
                  type="button"
                  className={`freySnapshotChip${initialDate === snapshotDate ? " isActive" : ""}`}
                  onClick={() => runSnapshot(snapshotDate)}
                >
                  {snapshotDate}
                </button>
              ))}
            </div>

            <div className="freyTemporalRow">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="freyInput freyTemporalInput"
              />

              <button onClick={runTemporal} className="freyButton freyTemporalButton" type="button">
                {loading ? "Running..." : "Run Temporal"}
              </button>
            </div>

            <div
              className="freyCompareBlock"
              data-frey-compare="__FREY_COMPARE_MODE_V0_1__"
              data-frey-compare-primary={initialDate || ""}
              data-frey-compare-secondary={initialCompareDate || ""}
            >
              <div className="freyCompareRow">
                <input
                  type="date"
                  value={compareDate}
                  onChange={(e) => setCompareDate(e.target.value)}
                  className="freyInput freyTemporalInput"
                />

                <button onClick={runCompare} className="freyButton freyTemporalButton" type="button">
                  Compare
                </button>
              </div>

              {result && compareResult && (
                <>
                  <div className="freyCompareGrid">
                    <div className="freyCompareCard">
                      <div className="freyCompareLabel">Primary · {initialDate}</div>
                      <div className="freyCompareMode">{interpretation.vector}</div>
                    </div>
                    <div className="freyCompareCard">
                      <div className="freyCompareLabel">Secondary · {initialCompareDate}</div>
                      <div className="freyCompareMode">{compareInterpretation.vector}</div>
                    </div>
                  </div>

                  {deltaBlock && (
                    <div
                      className="freyDeltaBlock"
                      data-frey-delta="__FREY_MULTI_DATE_ANALYSIS_V0_1__"
                      data-frey-delta-primary={initialDate || ""}
                      data-frey-delta-secondary={initialCompareDate || ""}
                    >
                      <div className="freyDeltaTitle" data-frey-demo-flow="__FREY_DEMO_FLOW_POLISH_V0_1__">Cosmographic Delta</div>

                      <div className="freyDeltaGrid">
                        {deltaBlock.rows.map((row) => (
                          <div key={row.label} className="freyDeltaRow">
                            <div className="freyDeltaMetric">{formatMetricLabel(row.label)}</div>
                            <div className="freyDeltaValue">{row.arrow} {row.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="freyDeltaRelation">
                        <div className="freyDeltaRelationTag">Temporal relation mode</div>
                        <div className="freyDeltaRelationMode">{deltaBlock.mode}</div>
                        <div className="freyDeltaRelationText">{deltaBlock.description}</div>
                      </div>
                    </div>
                  )}

                  {timelineResults && timelineResults.length > 0 && (
                    <div
                      className="freyTimelineBlock"
                      data-frey-timeline="__FREY_TIMELINE_MODE_V0_1__"
                      data-frey-timeline-dates={timelineDates.join(',')}
                    >
                      <div className="freyTimelineTitle">Timeline evolution</div>
                      <div className="freyTimelineRow">
                        {timelineResults.map((item) => (
                          <button
                            key={item.date}
                            type="button"
                            className={`freyTimelineChip${initialDate === item.date ? " isActive" : ""}`}
                            onClick={() => runTimeline(timelineResults.map((entry) => entry.date))}
                          >
                            <span className="freyTimelineDate">{item.date}</span>
                            <span className="freyTimelineVector">Mode: {item.vector}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {result && (
              <div className="freyInterpretation" data-frey-interpretation={MARKER}>
                <div className="freyInterpretationHeader">
                  <div className="freyInterpretationTitle">{interpretation.marker}</div>
                  <div className="freyInterpretationRule" />
                </div>

                <div className="freyInterpretationGridV14">
                  {interpretation.zones.map((zone) => (
                    <div key={zone.label} className="freyInterpretationZone">
                      <div className="freyInterpretationZoneLabel">{zone.label}</div>
                      <div className="freyInterpretationZoneBody">
                        <div className="freyInterpretationState">{zone.state}</div>
                        <div className="freyInterpretationEffect">{zone.effect}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="freyOperationalVector">
                  <div className="freyOperationalVectorTag">Operational Vector</div>
                  <div className="freyOperationalVectorMode">{interpretation.vector}</div>
                </div>

                <details className="freyMetrics">
                  <summary className="freyMetricsSummary">Raw Metrics</summary>
                  <pre className="freyJson">{JSON.stringify(result, null, 2)}</pre>
                </details>
              </div>
            )}
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
          padding: 24px;
        }

        .freyAxis {
          position: absolute;
          width: 1px;
          height: 100%;
          background: rgba(255, 200, 120, 0.15);
        }

        .freyMembrane {
          width: min(100%, 720px);
          padding: 40px;
          border-radius: 24px;
          border: 1px solid rgba(255, 200, 120, 0.26);
          background: rgba(12, 16, 24, 0.92);
          backdrop-filter: blur(14px);
          box-shadow: 0 24px 72px rgba(0, 0, 0, 0.42);
        }

        .freyContent {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .freyMode {
          font-size: 12px;
          line-height: 1;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(245, 239, 226, 0.88);
          margin-bottom: 14px;
        }

        .freyCommandRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          margin-bottom: 20px;
        }

        .freyInput {
          width: 100%;
          min-height: 54px;
          border-radius: 16px;
          border: 1px solid rgba(255, 200, 120, 0.18);
          background: rgba(7, 11, 18, 0.9);
          color: rgba(245, 247, 252, 0.96);
          padding: 0 16px;
          font-size: 15px;
          outline: none;
        }

        .freyInput::placeholder {
          color: rgba(184, 192, 214, 0.42);
        }

        .freyButton {
          min-height: 54px;
          border-radius: 16px;
          border: 1px solid rgba(255, 200, 120, 0.22);
          background: linear-gradient(180deg, rgba(255, 200, 120, 0.16), rgba(255, 200, 120, 0.06));
          color: rgba(248, 244, 236, 0.96);
          padding: 0 18px;
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 600;
          cursor: pointer;
        }

        .freyGrantDemoBar {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
          padding: 12px 14px;
          border-radius: 16px;
          border: 1px solid rgba(255, 200, 120, 0.14);
          background: rgba(255, 255, 255, 0.02);
        }

        .freyGrantDemoTitle {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 240, 220, 0.84);
        }

        .freyGrantDemoMeta {
          font-size: 12px;
          color: rgba(220, 224, 236, 0.74);
        }

        .freyDivider {
          height: 1px;
          background: linear-gradient(90deg, rgba(255, 200, 120, 0.18), rgba(255, 255, 255, 0.04));
          margin-bottom: 20px;
        }

        .freyTemporalBlock {
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.02);
          padding: 18px;
        }

        .freyTemporalTitle {
          font-size: 11px;
          line-height: 1;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(188, 197, 220, 0.52);
          margin-bottom: 14px;
        }

        .freySnapshotRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .freySnapshotChip {
          min-height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(255, 200, 120, 0.18);
          background: rgba(255, 255, 255, 0.03);
          color: rgba(245, 247, 252, 0.88);
          padding: 0 12px;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .freySnapshotChip.isActive {
          border-color: rgba(255, 200, 120, 0.42);
          background: rgba(255, 200, 120, 0.10);
          color: rgba(255, 248, 236, 0.98);
        }

        .freyTemporalRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
        }

        .freyCompareBlock {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .freyCompareRow {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
        }

        .freyCompareGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 12px;
        }

        .freyCompareCard {
          border-radius: 16px;
          border: 1px solid rgba(255, 200, 120, 0.12);
          background: rgba(255, 255, 255, 0.02);
          padding: 12px;
        }

        .freyCompareLabel {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(188, 197, 220, 0.58);
          margin-bottom: 8px;
        }

        .freyCompareMode {
          font-size: 14px;
          color: rgba(248, 244, 236, 0.94);
        }

        .freyDeltaBlock {
          margin-top: 12px;
          border-radius: 16px;
          border: 1px solid rgba(255, 200, 120, 0.12);
          background: rgba(255, 255, 255, 0.02);
          padding: 12px;
        }

        .freyDeltaTitle {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(188, 197, 220, 0.58);
          margin-bottom: 10px;
        }

        .freyDeltaBlock {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
        }

        .freyDeltaGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }

        .freyDeltaMetric {
          text-transform: none;
          letter-spacing: 0.01em;
        }

        .freyDeltaRow {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          padding-bottom: 6px;
        }

        .freyDeltaMetric {
          font-size: 12px;
          color: rgba(245, 247, 252, 0.80);
        }

        .freyDeltaValue {
          font-size: 12px;
          color: rgba(255, 240, 220, 0.96);
        }

        .freyDeltaRelationTag {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(188, 197, 220, 0.58);
          margin-bottom: 6px;
        }

        .freyDeltaRelationMode {
          font-size: 14px;
          color: rgba(248, 244, 236, 0.96);
          margin-bottom: 6px;
        }

        .freyDeltaRelationText {
          font-size: 12px;
          color: rgba(220, 224, 236, 0.78);
          line-height: 1.5;
        }

        .freyTimelineBlock {
          margin-top: 12px;
          border-radius: 16px;
          border: 1px solid rgba(255, 200, 120, 0.12);
          background: rgba(255, 255, 255, 0.02);
          padding: 12px;
        }

        .freyTimelineTitle {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(188, 197, 220, 0.58);
          margin-bottom: 10px;
        }

        .freyTimelineRow {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        @media (max-width: 820px) {
          .freyTimelineRow {
            grid-template-columns: 1fr;
          }
        }

        .freyTimelineChip {
          border-radius: 14px;
          border: 1px solid rgba(255, 200, 120, 0.12);
          background: rgba(255, 255, 255, 0.02);
          padding: 10px;
          text-align: left;
          cursor: pointer;
        }

        .freyTimelineChip.isActive {
          border-color: rgba(255, 200, 120, 0.42);
          background: rgba(255, 200, 120, 0.10);
        }

        .freyTimelineDate {
          display: block;
          font-size: 11px;
          color: rgba(248, 244, 236, 0.94);
          margin-bottom: 6px;
        }

        .freyTimelineVector {
          display: block;
          font-size: 11px;
          color: rgba(220, 224, 236, 0.78);
        }

        .freyTemporalInput,
        .freyTemporalButton {
          margin-bottom: 0;
        }

        .freyInterpretation {
          margin-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 16px;
        }

        .freyInterpretationHeader {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .freyInterpretationTitle {
          font-size: 10px;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(188, 197, 220, 0.52);
          white-space: nowrap;
        }

        .freyInterpretationRule {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.03));
        }

        .freyInterpretationGridV14 {
          display: grid;
          gap: 12px;
        }

        .freyInterpretationZone {
          display: grid;
          grid-template-columns: 148px 1fr;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .freyInterpretationZone:last-child {
          border-bottom: 0;
        }

        .freyInterpretationZoneLabel {
          font-size: 10px;
          line-height: 1.25;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(151, 160, 185, 0.48);
          padding-top: 3px;
        }

        .freyInterpretationZoneBody {
          display: grid;
          gap: 4px;
        }

        .freyInterpretationState {
          font-size: 15px;
          line-height: 1.28;
          color: rgba(245, 247, 252, 0.98);
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .freyInterpretationEffect {
          font-size: 12px;
          line-height: 1.34;
          color: rgba(184, 192, 214, 0.74);
        }

        .freyOperationalVector {
          margin-top: 14px;
          border-radius: 18px;
          border: 1px solid rgba(231, 202, 141, 0.18);
          background: linear-gradient(180deg, rgba(231, 202, 141, 0.12), rgba(231, 202, 141, 0.06));
          padding: 16px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .freyOperationalVectorTag {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(239, 222, 185, 0.68);
        }

        .freyOperationalVectorMode {
          font-size: 17px;
          line-height: 1.18;
          color: rgba(255, 249, 236, 0.98);
          font-weight: 650;
          text-align: right;
        }

        .freyMetrics {
          margin-top: 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
          overflow: hidden;
        }

        .freyMetricsSummary {
          cursor: pointer;
          padding: 14px 16px;
          list-style: none;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(184, 192, 214, 0.72);
        }

        .freyMetricsSummary::-webkit-details-marker {
          display: none;
        }

        .freyJson {
          margin: 0;
          padding: 0 16px 16px;
          opacity: 0.76;
          white-space: pre-wrap;
          word-break: break-word;
          color: rgba(214, 221, 240, 0.78);
          font-size: 12px;
          line-height: 1.45;
        }

        @media (max-width: 760px) {
          .freyMembrane {
            padding: 22px;
          }

          .freyCommandRow,
          .freyTemporalRow {
            grid-template-columns: 1fr;
          }

          .freyInterpretationZone {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .freyOperationalVector {
            flex-direction: column;
            align-items: flex-start;
          }

          .freyOperationalVectorMode {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
