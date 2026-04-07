import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EXPORT_GUIDE_LINES, buildFreyExportPayload, buildFreyExportText, mapResultToMinimalVoice } from "../lib/frey-export-minimal";

const MARKER = "__FREY_INTERPRETATION_CONSOLE_V1_4__";
const QUERY_BIND_FIX_MARKER = "__FREY_QUERY_ACTION_BIND_FIX_V0_1__";
const COMPARE_LEAKAGE_FIX_MARKER = "__FREY_COMPARE_LEAKAGE_SURFACE_FIX_V0_1__";
const C1_SINGLE_CONVERSATIONAL_MARKER = "__FREY_C1_SINGLE_CONVERSATIONAL_V0_1__";
const C1_1_RESULT_STACK_POLISH_MARKER = "__FREY_C1_1_RESULT_STACK_POLISH_V0_1__";
const C1_2_RESULT_TAIL_CLEAR_MARKER = "__FREY_C1_2_RESULT_TAIL_CLEAR_V0_1__";
const C1_3_COMPARE_AUTO_OPEN_MARKER = "__FREY_C1_3_COMPARE_AUTO_OPEN_V0_1__";
const C1_3_INTERPRETATION_SPACING_MARKER = "__FREY_C1_3_INTERPRETATION_SPACING_V0_1__";
const C1_4_BOTTOM_NAV_DETACH_MARKER = "__FREY_C1_4_BOTTOM_NAV_DETACH_V0_1__";
const C1_5_BOTTOM_NAV_SPACING_MARKER = "__FREY_C1_5_BOTTOM_NAV_SPACING_V0_1__";

function formatMetricLabel(label) {
  return label
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildMinimalVoiceBridge(minimalVoice) {
  if (!minimalVoice) return "";

  const state = String(minimalVoice.state || "").toLowerCase();
  const tensionBand = String(minimalVoice.contract?.tensionBand || "").toLowerCase();
  const resonanceBand = String(minimalVoice.contract?.resonanceBand || "").toLowerCase();
  const stabilityBand = String(minimalVoice.contract?.stabilityBand || "").toLowerCase();

  if (state.includes("instability") || stabilityBand.includes("fragile") || stabilityBand.includes("sensitive")) {
    return "Outer stability is weakening faster than the core can compensate.";
  }

  if (state.includes("compression") || state.includes("compressed") || tensionBand.includes("elevated")) {
    return "Pressure is accumulating faster than release inside the active frame.";
  }

  if (state.includes("coherence") || resonanceBand.includes("high") || resonanceBand.includes("moderate")) {
    return "Signal alignment still holds, but only inside a narrower stable corridor.";
  }

  return "The field keeps its core line, but edge behavior now needs tighter pacing.";
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

function buildConversationalResponse(responseSurface, interpretation) {
  if (!responseSurface || !interpretation) {
    return {
      title: "Frey conversational response",
      lead: "",
      summary: "",
      operator_note: "",
    };
  }

  const structural = interpretation.zones?.[0];
  const tension = interpretation.zones?.[1];
  const resonance = interpretation.zones?.[2];
  const stability = interpretation.zones?.[3];

  return {
    title: interpretation.vector || "Mode: Controlled advance",
    lead: structural?.effect || "Deterministic reading becomes visible after the run.",
    summary: [tension?.state, resonance?.state, stability?.state].filter(Boolean).join(" · "),
    operator_note: [tension?.effect, resonance?.effect, stability?.effect].filter(Boolean).join(" "),
  };
}

function buildBoundTimelineDates(primaryDate, compareDate) {
  return [];
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildResponseSurface(result, activeDate, uiState, errorMessage) {
  const normalizedState = uiState || (result ? "success" : "idle");
  const phase = Number(result?.phase_density ?? 0);
  const tension = Number(result?.harmonic_tension ?? 0);
  const resonance = Number(result?.resonance_level ?? 0);
  const stability = Number(result?.structural_stability ?? 0);
  const eclipse = Number(result?.eclipse_proximity ?? 0);

  const intensityBand =
    tension >= 0.72 ? "high" :
    tension >= 0.42 ? "medium" :
    "low";

  const stabilityBand =
    stability >= 0.72 ? "supported" :
    stability >= 0.45 ? "sensitive" :
    "fragile";

  const resonanceBand =
    resonance >= 0.74 ? "high" :
    resonance >= 0.45 ? "medium" :
    "low";

  return {
    ui_state: normalizedState,
    active_date: activeDate || result?.date || "",
    engine: result?.engine || "frey-temporal-core-v0.1",
    engine_version: result?.meta?.engine_version || result?.engine || "",
    metrics: result
      ? {
          phase_density: phase,
          harmonic_tension: tension,
          resonance_level: resonance,
          eclipse_proximity: eclipse,
          structural_stability: stability,
        }
      : null,
    compact_summary: result
      ? {
          intensity_band: intensityBand,
          stability_band: stabilityBand,
          resonance_band: resonanceBand,
        }
      : null,
    error: errorMessage || "",
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

  const rawSignalQuery = Array.isArray(query?.q) ? query.q[0] : query?.q;
  const { bindFreySignal } = await import("../lib/frey-signal-binder.js");
  const initialSignalBind = bindFreySignal(rawSignalQuery);

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

  if (rawSignalQuery && initialSignalBind?.marker) {
    initialQueryMarker = initialQueryMarker + "|" + initialSignalBind.marker;
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
  const explicitTimelineDates =
    typeof rawTimeline === "string" && rawTimeline.trim()
      ? rawTimeline
          .split(",")
          .map((part) => part.trim())
          .filter((part) => /^\d{4}-\d{2}-\d{2}$/.test(part))
          .slice(0, 5)
      : [];

  const initialTimelineDates =
    explicitTimelineDates.length > 0
      ? explicitTimelineDates
      : buildBoundTimelineDates(initialDate, initialCompareDate);

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


  const initialInterpretation = buildInterpretation(initialResult);
  const initialDeltaBlock = buildDeltaBlock(initialResult, initialCompareResult);
  const {
    buildFreyAccessCtxPacket,
    buildFreyAccessHref,
  } = await import("../lib/frey-access-bridge.js");

  const initialAccessCtx = buildFreyAccessCtxPacket({
    primary_date: initialDate,
    secondary_date: initialCompareDate,
    signal_class: initialSignalBind?.signal_class || "",
    structural_state: initialInterpretation?.zones?.[0]?.state || "",
    operational_vector: initialSignalBind?.operational_vector_shift?.primary_mode || "",
    delta_mode: initialDeltaBlock?.mode || "",
    timeline_mode: initialTimelineResults.length > 0 ? "active" : "",
  });

  const initialAccessHref = buildFreyAccessHref(initialAccessCtx);

  return {
    props: {
      initialDate,
      initialResult,
      initialCompareDate,
      initialCompareResult,
      initialTimelineDates,
      initialTimelineResults,
      initialQueryMarker,
      initialSignalBind,
      initialAccessCtx,
      initialAccessHref,
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

export default function Frey({ initialDate, initialResult, initialCompareDate, initialCompareResult, initialTimelineDates, initialTimelineResults, initialQueryMarker, initialSignalBind, initialAccessCtx, initialAccessHref }) {
  const [query, setQuery] = useState(initialSignalBind?.raw_query || "");
  const [date, setDate] = useState(initialDate);
  const [result, setResult] = useState(initialResult);
  const [compareDate, setCompareDate] = useState(initialCompareDate || "");
  const [compareResult, setCompareResult] = useState(initialCompareResult);
  const [loading, setLoading] = useState(false);
  const [uiError, setUiError] = useState("");
  const [entryOpen, setEntryOpen] = useState(false); // __FREY_IDLE_PROD_CANON_V0_3__
  const [exportCopied, setExportCopied] = useState(false);
  const entryTraceSeed = `Temporal Snapshot · ${/^\d{4}-\d{2}-\d{2}$/.test(date) ? date : getTodayIsoDate()}`;
  const compareExpandRef = useRef(null);

  const interpretation = useMemo(() => buildInterpretation(result), [result]);
  const compareInterpretation = useMemo(() => buildInterpretation(compareResult), [compareResult]);
  const deltaBlock = useMemo(() => buildDeltaBlock(result, compareResult), [result, compareResult]);
  const responseUiState = uiError ? "error" : loading ? "loading" : result ? "success" : "idle";
  const responseSurface = useMemo(
    () => buildResponseSurface(result, date || initialDate, responseUiState, uiError),
    [result, date, initialDate, responseUiState, uiError]
  );
  const conversationalResponse = useMemo(
    () => buildConversationalResponse(responseSurface, interpretation),
    [responseSurface, interpretation]
  );

  function buildFreyUrl(next) {
    const params = new URLSearchParams();
    const nextQuery = typeof next?.query === "string" ? next.query.trim() : "";
    const nextDate = typeof next?.date === "string" ? next.date : "";
    const nextCompareDate = typeof next?.compareDate === "string" ? next.compareDate : "";
    const nextTimelineDates = Array.isArray(next?.timelineDates) ? next.timelineDates : [];

    if (nextQuery) params.set("q", nextQuery);
    if (nextDate) params.set("d", nextDate);
    if (nextCompareDate) params.set("d2", nextCompareDate);

    const normalizedTimeline = nextTimelineDates
      .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
      .slice(0, 5)
      .join(",");

    if (normalizedTimeline) params.set("tl", normalizedTimeline);

    const qs = params.toString();
    return qs ? `/frey?${qs}` : "/frey";
  }

  function runSignal() {
    const trimmedQuery = query.trim();
    if (!trimmedQuery && !date) {
      setUiError("Mark a signal trace or select a date.");
      return;
    }
    const resolvedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : getTodayIsoDate();
    setUiError("");
    setLoading(true);
    if (typeof window !== "undefined") {
      window.location.assign(
        buildFreyUrl({ query: trimmedQuery, date: resolvedDate, compareDate: "", timelineDates: [] })
      );
    }
  }

  function runCompare() {
    if (!date || !compareDate) {
      setUiError("Set both dates for compare mode.");
      return;
    }
    setUiError("");
    setLoading(true);
    if (typeof window !== "undefined") {
      window.location.assign(
        buildFreyUrl({ query, date, compareDate, timelineDates: [] })
      );
    }
  }

  function runTemporal() {
    if (!date) {
      setUiError("Select an active date.");
      return;
    }
    setUiError("");
    setLoading(true);
    if (typeof window !== "undefined") {
      window.location.assign(buildFreyUrl({ query, date, compareDate, timelineDates: [] }));
    }
  }

  const hasResult = Boolean(result);
  const hasCompare = Boolean(result && compareResult);
  const hasTimeline = Array.isArray(initialTimelineResults) && initialTimelineResults.length > 0;

  useEffect(() => {
    if (!hasCompare || typeof window === "undefined") return;
    const node = compareExpandRef.current;
    if (!node) return;
    node.open = true;
    const raf = window.requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect();
      const targetTop = Math.max(window.scrollY + rect.top - 144, 0);
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(raf);
  }, [hasCompare, initialCompareDate]);

  return (
    <div className={`freyRoot${hasResult ? " freyRootResult" : ""}`}>
      {!hasResult && !entryOpen ? <div className="freyAxis" style={{ opacity: 0.18 }} /> : null}
      <div
        className={`freyMembrane${hasResult ? " isResult" : ""}${entryOpen ? " isEntryOpen" : ""}`}
        data-frey-bind={MARKER}
        data-frey-query-fix={QUERY_BIND_FIX_MARKER}
        data-frey-compare-leakage-fix={COMPARE_LEAKAGE_FIX_MARKER}
        data-frey-query-bind="__FREY_QUERY_INTERFACE_MINI_V0_1__"
        data-frey-query-date={initialDate || ""}
        data-frey-surface-reduction="__FREY_SURFACE_REDUCTION_V0_1__"
        data-frey-surface-state={hasResult ? "result" : "idle"}
      >
        <div className="freyContent">
          {!hasResult && (
            <div
              className="freyEntryBlock"
              data-frey-main-entry-canon="__FREY_MAIN_ENTRY_CANON_V0_1__"
              data-frey-main-entry-local="__FREY_MAIN_ENTRY_LOCAL_SPEC_V0_1__"
              data-frey-idle-prod-canon="__FREY_IDLE_ENTRY_VISIBLE_V0_3__"
            >
              {!entryOpen ? (
                <button
                  className="freyThresholdButton"
                  type="button"
                  aria-label="Activate Frey signal gate"
                  onClick={() => {
                    if (!query.trim()) setQuery(entryTraceSeed);
                    setEntryOpen(true);
                  }}
                >
                  <span className="freyThresholdField" aria-hidden="true">
                    <span className="freyThresholdBody" />
                    <span className="freyThresholdVoid" />
                    <span className="freyThresholdGlow freyThresholdGlowLeft" />
                    <span className="freyThresholdGlow freyThresholdGlowRight" />
                    <span className="freyThresholdSeam" />
                    <span className="freyThresholdCore" />
                  </span>
                </button>
              ) : (
                <div className="freySignalSurface">
                  <div className="freySignalHeader">
                    <div className="freySignalEyebrow">Signal Trace</div>
                    <button className="freyGhostButton" type="button" onClick={() => setEntryOpen(false)}>
                      RESEAL
                    </button>
                  </div>

                  <textarea
                    className="freySignalTextarea"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Mark signal trace..."
                  />

                  <div className="freySignalActions">
                    <button className="freyButton freyButtonPrimary" type="button" onClick={runSignal}>
                      {loading ? "Running..." : "Run Frey"}
                    </button>
                  </div>
                </div>
              )}

              {uiError && !hasResult ? (
                <div className="freyInlineError">{uiError}</div>
              ) : null}
            </div>
          )}

          {hasResult && (
            <div className="freyResultFlow" data-frey-result-tail-clear={C1_2_RESULT_TAIL_CLEAR_MARKER}>
              <section
                className="freyConversationBlock freyResultBlock"
                data-frey-c1={C1_SINGLE_CONVERSATIONAL_MARKER}
                data-frey-response-surface={C1_SINGLE_CONVERSATIONAL_MARKER}
                data-frey-response-state={responseSurface.ui_state}
                data-frey-c1-1={C1_1_RESULT_STACK_POLISH_MARKER}
              >
                <div className="freyConversationHeader">
                  <div className="freyConversationHeaderText">
                    <div className="freyConversationEyebrow">Frey signal reading</div>
                    <div className="freyConversationTitle">{conversationalResponse.title}</div>
                  </div>
                  <div className="freyResponseState">{responseSurface.ui_state}</div>
                </div>

                <div className="freyConversationLead">{conversationalResponse.lead}</div>

                <div className="freyConversationMetaRow">
                  <div className="freyConversationMetaCard">
                    <div className="freyConversationMetaLabel">Active Date</div>
                    <div className="freyConversationMetaValue">{responseSurface.active_date || "n/a"}</div>
                  </div>
                  <div className="freyConversationMetaCard">
                    <div className="freyConversationMetaLabel">Engine</div>
                    <div className="freyConversationMetaValue">{responseSurface.engine_version || responseSurface.engine || "n/a"}</div>
                  </div>
                </div>

                {conversationalResponse.summary && (
                  <div className="freyConversationBand">{conversationalResponse.summary}</div>
                )}

                {responseSurface.ui_state === "error" && (
                  <div className="freyResponseError">{responseSurface.error || "Unable to run Frey."}</div>
                )}

                {responseSurface.ui_state === "success" && responseSurface.metrics && (
                  <>
                    <div className="freyConversationMetricRow">
                      <div className="freyConversationMetric">
                        <div className="freyConversationMetricLabel">Intensity</div>
                        <div className="freyConversationMetricValue">{responseSurface.compact_summary?.intensity_band || "n/a"}</div>
                      </div>
                      <div className="freyConversationMetric">
                        <div className="freyConversationMetricLabel">Stability</div>
                        <div className="freyConversationMetricValue">{responseSurface.compact_summary?.stability_band || "n/a"}</div>
                      </div>
                      <div className="freyConversationMetric">
                        <div className="freyConversationMetricLabel">Resonance</div>
                        <div className="freyConversationMetricValue">{responseSurface.compact_summary?.resonance_band || "n/a"}</div>
                      </div>
                    </div>

                    {(() => {
                      const minimalVoice = mapResultToMinimalVoice(result);
                      if (!minimalVoice) return null;
                      const minimalVoiceBridge = buildMinimalVoiceBridge(minimalVoice);
                      return (
                        <section
                          className="freyVoiceMinimal freyResultBlock"
                          data-frey-voice-minimal="__FREY_C1_CANONICAL_MINIMAL_VOICE_V0_5__"
                          data-frey-voice-zone={minimalVoice.contract.zoneSubtype}
                          data-frey-voice-tension={minimalVoice.contract.tensionBand}
                          data-frey-voice-resonance={minimalVoice.contract.resonanceBand}
                          data-frey-voice-stability={minimalVoice.contract.stabilityBand}
                        >
                          <div className="freyVoiceMinimalHalo" aria-hidden="true" />
                          <div className="freyVoiceMinimalEyebrow">Frey Interpretation</div>
                          <div className="freyVoiceMinimalState">{minimalVoice.state}</div>
                          <div className="freyVoiceMinimalBridge">{minimalVoiceBridge}</div>
                          <div className="freyVoiceMinimalBody">
                            <div className="freyVoiceMinimalRow">
                              <div className="freyVoiceMinimalLabel">Meaning</div>
                              <div className="freyVoiceMinimalValue">{minimalVoice.meaning}</div>
                            </div>
                            <div className="freyVoiceMinimalRow">
                              <div className="freyVoiceMinimalLabel">Direction</div>
                              <div className="freyVoiceMinimalValue freyVoiceMinimalValueStrong">{minimalVoice.direction}</div>
                            </div>
                          </div>
                        </section>
                      );
                    })()}

                    <details className="freyInlineExpandBlock" data-frey-primary-reading="__FREY_C1_PRIMARY_READING_V0_2__" data-frey-primary-reading-state="open" open>
                      <summary className="freyInlineExpandSummary">Primary reading</summary>
                      <div className="freyConversationOperatorNote freyConversationOperatorNoteCompact">
                        <div className="freyConversationOperatorText">{conversationalResponse.operator_note}</div>
                      </div>
                    </details>

                    <div className="freyConversationResultTail">
                      <details className="freyInlineExpandBlock" data-frey-interpretation={MARKER} data-frey-interpretation-clean={C1_3_INTERPRETATION_SPACING_MARKER}>
                        <summary className="freyInlineExpandSummary">Interpretation layers</summary>
                        <div className="freyInterpretation freyInterpretationResult">

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
                        </div>
                      </details>

                      <details className="freyInlineExpandBlock freyMetricsExpand" data-frey-raw-metrics="__FREY_RAW_METRICS_RESULT_ONLY_V0_1__">
                        <summary className="freyInlineExpandSummary">Raw metrics</summary>
                        <pre className="freyJson">{JSON.stringify(result, null, 2)}</pre>
                      </details>
                    </div>
                  </>
                )}
              </section>

              <div className="freyResultControls">
                <div className="freyResultControlsLabel">Expand controls</div>
                <div
                  className="freyResultControlsHint"
                  data-frey-compare-discoverability="__FREY_COMPARE_DISCOVERABILITY_V0_27__"
                  data-frey-compare-state={hasCompare ? "active" : "ready"}
                >
                  {hasCompare
                    ? "Compare active · Review both dates below."
                    : "Open Compare to enter any date and compute Cosmographic Delta."}
                </div>
                <div className="freyExpandStack">
                  <details ref={compareExpandRef} className="freyExpandBlock" data-frey-compare="__FREY_COMPARE_MODE_V0_1__" data-frey-compare-auto-open={C1_3_COMPARE_AUTO_OPEN_MARKER} data-frey-expand-state={hasCompare ? "active" : "ready"} open={hasCompare}>
                    <summary className="freyExpandSummary">Compare another date</summary>

                    <div className="freyCompareBlock freyCompareBlockSecondary" data-frey-compare-primary={initialDate || ""} data-frey-compare-secondary={initialCompareDate || ""}>
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

                      {hasCompare && (
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
                        </>
                      )}
                    </div>
                  </details>

                  <details className="freyExpandBlock" data-frey-timeline="__FREY_TIMELINE_RESULT_ONLY_V0_1__" data-frey-expand-state={hasTimeline ? "active" : "empty"}>
                    <summary className="freyExpandSummary">Timeline around active date</summary>
                    {hasTimeline ? (
                      <div className="freyTimelineBlock">
                        <div className="freyTimelineRow">
                          {initialTimelineResults.map((entry) => (
                            <div
                              key={entry.date}
                              className={`freyTimelineChip${entry.date === initialDate ? " isActive" : ""}`}
                            >
                              <div className="freyTimelineDate">{entry.date}</div>
                              <div className="freyTimelineVector">{entry.vector}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="freyExpandEmpty" data-frey-timeline-state="pending">Timeline is not expanded in this run.</div>
                    )}
                  </details>
                </div>
              </div>


              {responseSurface.ui_state === "success" && (() => {
                const primaryDateValue = typeof primaryDate !== "undefined" ? primaryDate : (typeof selectedDate !== "undefined" ? selectedDate : null);
                const compareDateValue = typeof secondaryDate !== "undefined" ? secondaryDate : (typeof initialCompareDate !== "undefined" ? initialCompareDate : null);
                const compareResultValue = typeof compareResult !== "undefined" ? compareResult : null;
                const minimalVoice = mapResultToMinimalVoice(result);
                const exportPayload = buildFreyExportPayload({
                  mode: hasCompare ? "compare" : "single",
                  url: typeof window !== "undefined" ? window.location.href : "",
                  primaryDate: primaryDateValue,
                  compareDate: compareDateValue,
                  primaryResult: result,
                  compareResult: compareResultValue,
                  freyVoice: minimalVoice,
                });
                const copyText = buildFreyExportText(exportPayload);
                const copyLabel = hasCompare ? "Copy compare snapshot" : "Copy snapshot";
                const copyFeedbackLabel = exportCopied ? "Copied" : copyLabel;
                return (
                  <details className="freyExportBlock freyResultBlock" data-frey-export="__FREY_EXPORT_LAYER_V0_2__" data-frey-export-mode={hasCompare ? "compare" : "single"}>
                    <summary className="freyExportSummary">AI Export</summary>
                    <div className="freyExportInner">
                      <div className="freyExportTop">
                        <div className="freyExportEyebrow">Portable snapshot</div>
                        <button
                          type="button"
                          className="freyExportCopyButton"
                          data-frey-copy-feedback={exportCopied ? "copied" : "idle"}
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(copyText);
                            setExportCopied(true);
                            if (typeof window !== "undefined") {
                              window.setTimeout(() => setExportCopied(false), 1400);
                            }
                          }}
                        >
                          {copyFeedbackLabel}
                        </button>
                      </div>
                      <pre className="freyExportPre">{copyText}</pre>
                      <div className="freyExportGuide">
                        {EXPORT_GUIDE_LINES.map((line) => (
                          <div key={line} className="freyExportGuideLine">{line}</div>
                        ))}
                      </div>
                    </div>
                  </details>
                );
              })()}

              {initialAccessCtx && (
                <>
                <div
                  className="freyEscalationBlock"
                  data-frey-access-bridge="__FREY_ACCESS_BRIDGE_V0_1__"
                  data-frey-access-signal={initialAccessCtx.signal_class || ""}
                  data-frey-access-vector={initialAccessCtx.operational_vector || ""}
                >
                  <div className="freyEscalationLabel">Escalation</div>
                  <div className="freyEscalationText">
                    Request deep analysis when the current result needs operator review.
                  </div>
                  <Link
                    href={initialAccessHref}
                    className="freyButton freyTemporalButton"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                  >
                    Request deep analysis
                  </Link>
                </div>
                <div className="freyBottomNavClearance" data-frey-bottom-nav-detach={C1_4_BOTTOM_NAV_DETACH_MARKER} data-frey-bottom-nav-spacing={C1_5_BOTTOM_NAV_SPACING_MARKER} data-frey-bottom-nav-trim="__FREY_C1_5_BOTTOM_NAV_TRIM_V0_2__" data-frey-bottom-nav-dynamic="__FREY_C1_5_1_DYNAMIC_BOTTOM_CLEARANCE_V0_1__" aria-hidden="true" />
              </>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .freyRoot {
          min-height: 100vh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          background: radial-gradient(circle at center, #0b1220 0%, #05070c 70%);
          position: relative;
          padding: clamp(40px, 9vh, 96px) 24px 24px;
        }

        .freyRootResult {
          align-items: flex-start;
          padding-top: clamp(28px, 4vh, 44px);
          padding-bottom: clamp(56px, 7vh, 72px);
        }

        .freyAxis {
          position: absolute;
          width: 1px;
          height: 100%;
          background: rgba(255, 200, 120, 0.15);
        }

        .freyMembrane {
          width: min(100%, 860px);
          min-height: min(68vh, 640px);
          padding: 40px;
          border-radius: 40px;
          border: 1px solid rgba(255, 200, 120, 0.18);
          background:
            radial-gradient(circle at 50% 48%, rgba(22, 52, 125, 0.14), transparent 32%),
            rgba(7, 10, 18, 0.84);
          backdrop-filter: blur(18px);
          box-shadow: 0 26px 92px rgba(0, 0, 0, 0.38);
          position: relative;
          overflow: hidden;
        }

        .freyMembrane:not(.isResult):not(.isEntryOpen)::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(90deg, transparent calc(50% - 0.5px), rgba(255, 255, 255, 0.08) 50%, transparent calc(50% + 0.5px)),
            linear-gradient(180deg, transparent calc(50% - 0.5px), rgba(255, 255, 255, 0.12) 50%, transparent calc(50% + 0.5px));
          pointer-events: none;
          opacity: 0.74;
        }

        .freyMembrane.isResult {
          width: min(100%, 840px);
          min-height: auto;
          border-radius: 34px;
        }

        .freyContent {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 0;
          min-height: inherit;
        }

        .freyEntryBlock {
          flex: 1;
          min-height: 460px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .freyThresholdButton {
          appearance: none;
          border: 0;
          padding: 0;
          margin: 0;
          background: transparent;
          cursor: pointer;
        }

        .freyThresholdField {
          position: relative;
          display: block;
          width: 200px;
          height: 246px;
        }

        .freyThresholdBody {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 118px;
          height: 202px;
          transform: translate(-50%, -50%);
          border-radius: 40px;
          background: radial-gradient(circle at 50% 50%, rgba(4, 7, 13, 0.98), rgba(4, 7, 13, 0.94) 56%, rgba(4, 7, 13, 0.08) 100%);
          animation: freyThresholdBreath 5.8s ease-in-out infinite;
        }

        .freyThresholdVoid {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 94px;
          height: 182px;
          transform: translate(-50%, -50%);
          border-radius: 34px;
          background: radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.95), rgba(2, 4, 8, 0.985) 72%, rgba(0, 0, 0, 0.02) 100%);
          box-shadow: 0 0 56px rgba(0, 0, 0, 0.60);
          animation: freyThresholdVoid 5.2s ease-in-out infinite;
        }

        .freyThresholdGlow {
          display: none;

          position: absolute;
          top: 50%;
          width: 16px;
          height: 146px;
          border-radius: 999px;
          transform: translateY(-50%);
          background: linear-gradient(180deg, rgba(146, 183, 255, 0.00), rgba(122, 161, 255, 0.10), rgba(146, 183, 255, 0.00));
          filter: blur(2px);
          animation: freyThresholdGlow 4.6s ease-in-out infinite;
        }

        .freyThresholdGlowLeft {
          left: calc(50% - 14px);
        }

        .freyThresholdGlowRight {
          display: none;

          left: calc(50% + 12px);
          animation-delay: 0.16s;
        }

        .freyThresholdSeam {
          display: none;

          position: absolute;
          left: 50%;
          top: 50%;
          width: 2px;
          height: 154px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: linear-gradient(180deg, rgba(255, 226, 180, 0.00), rgba(233, 204, 149, 0.34), rgba(255, 226, 180, 0.00));
          opacity: 0.18;
          animation: none;
        }

        .freyThresholdCore {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 42px;
          height: 42px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: radial-gradient(circle at 40% 34%, rgba(255, 246, 228, 0.98), rgba(233, 204, 149, 0.70) 30%, rgba(106, 151, 255, 0.26) 60%, rgba(18, 36, 84, 0.08) 100%);
          box-shadow: 0 0 10px rgba(233, 204, 149, 0.08), 0 0 24px rgba(65, 104, 190, 0.08);
          animation: freyThresholdCore 4.8s ease-in-out infinite;
        }

        .freyThresholdCore::after {
          content: "";
          position: absolute;
          inset: 8px;
          border-radius: 999px;
          background: radial-gradient(circle at 42% 36%, rgba(255, 251, 242, 0.98), rgba(255, 228, 176, 0.54) 42%, rgba(255, 228, 176, 0.00) 100%);
          animation: freyThresholdCoreInner 3.6s ease-in-out infinite;
        }

        .freySignalSurface {
          width: min(100%, 500px);
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 22px;
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: linear-gradient(180deg, rgba(12, 15, 24, 0.56), rgba(7, 10, 18, 0.76));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 0 40px rgba(0, 0, 0, 0.18);
        }

        .freySignalSurfaceIdle {
          width: min(100%, 640px);
          padding: 28px;
          border-radius: 32px;
          border: 1px solid rgba(255, 200, 120, 0.18);
          background:
            radial-gradient(circle at 50% 0%, rgba(255, 214, 148, 0.08), transparent 42%),
            linear-gradient(180deg, rgba(14, 18, 28, 0.82), rgba(7, 10, 18, 0.92));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 24px 80px rgba(0, 0, 0, 0.28);
        }

        .freySignalHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .freySignalEyebrow {
          font-size: 11px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: rgba(255, 245, 226, 0.72);
        }

        .freySignalLead {
          font-size: 20px;
          line-height: 1.35;
          color: rgba(245, 247, 252, 0.96);
          max-width: 24ch;
        }

        .freySignalHint {
          font-size: 14px;
          line-height: 1.55;
          color: rgba(214, 220, 236, 0.74);
          max-width: 48ch;
        }

        .freyGhostButton {
          min-height: 40px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          border-radius: 16px;
          background: transparent;
          color: rgba(245, 247, 252, 0.86);
          padding: 0 14px;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .freySignalTextarea {
          width: 100%;
          min-height: 144px;
          resize: none;
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(4, 7, 13, 0.92);
          color: rgba(245, 247, 252, 0.96);
          padding: 16px 16px;
          font-size: 20px;
          line-height: 1.25;
          outline: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
        }

        .freySignalTextarea::placeholder {
          color: rgba(184, 192, 214, 0.16);
        }

        .freySignalActions {
          display: flex;
          justify-content: flex-end;
        }

        @keyframes freyThresholdBreath {
          0%, 100% { opacity: 0.84; transform: translate(-50%, -50%) scaleY(0.985); }
          50% { opacity: 0.98; transform: translate(-50%, -50%) scaleY(1.02); }
        }

        @keyframes freyThresholdVoid {
          0%, 100% { opacity: 0.74; }
          50% { opacity: 0.94; }
        }

        @keyframes freyThresholdGlow {
          0%, 100% { opacity: 0.10; }
          50% { opacity: 0.26; }
        }

        @keyframes freyThresholdSeam {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.34; }
        }

        @keyframes freyThresholdCore {
          0%, 100% {
            opacity: 0.82;
            transform: translate(-50%, -50%) scale(0.94);
            box-shadow: 0 0 10px rgba(233, 204, 149, 0.08), 0 0 24px rgba(65, 104, 190, 0.08);
          }
          50% {
            opacity: 0.98;
            transform: translate(-50%, -50%) scale(1.08);
            box-shadow: 0 0 18px rgba(233, 204, 149, 0.14), 0 0 40px rgba(65, 104, 190, 0.14);
          }
        }

        @keyframes freyThresholdCoreInner {
          0%, 100% { opacity: 0.76; transform: scale(0.96); }
          50% { opacity: 1; transform: scale(1.04); }
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

        .freyGrantDemoBar {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
        }

        .freySsrBridgeMarker {
          position: absolute;
          left: -9999px;
          width: 1px;
          height: 1px;
          overflow: hidden;
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
          font-size: 15px;
          color: rgba(248, 244, 236, 0.96);
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


        .freyResponseSurface {
          margin-top: 18px;
          margin-bottom: 18px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(255, 255, 255, 0.03);
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .freyResponseHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .freyResponseTitle {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(245, 239, 226, 0.86);
        }

        .freyResponseState {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(215, 182, 111, 0.9);
        }

        .freyResponseGrid,
        .freyResponseSummaryGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .freyResponseMetric {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
          padding: 12px;
        }

        .freyResponseLabel {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(184, 192, 214, 0.72);
          margin-bottom: 8px;
        }

        .freyResponseValue {
          color: rgba(245, 239, 226, 0.96);
          font-size: 16px;
          line-height: 1.38;
          word-break: break-word;
        }

        .freyResponseSummary {
          display: grid;
          gap: 10px;
        }

        .freyResponseSummaryTitle {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(184, 192, 214, 0.72);
        }

        .freyResponseNote {
          color: rgba(214, 221, 240, 0.82);
          font-size: 14px;
          line-height: 1.58;
        }

        .freyResponseError {
          color: rgba(255, 162, 162, 0.96);
          font-size: 13px;
          line-height: 1.45;
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
          font-size: 17px;
          line-height: 1.32;
          color: rgba(245, 247, 252, 0.98);
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .freyInterpretationEffect {
          font-size: 14px;
          line-height: 1.62;
          color: rgba(192, 200, 222, 0.86);
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


        .freyEntryBlock {
          display: grid;
          gap: 10px;
        }

        .freyCommandRowPrimary {
          margin-bottom: 0;
        }

        .freyButtonPrimary {
          min-width: 168px;
        }

        .freyInlineError {
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 120, 120, 0.18);
          background: rgba(120, 18, 22, 0.16);
          color: rgba(255, 214, 214, 0.92);
          font-size: 13px;
          line-height: 1.45;
        }

        .freyResultFlow {
          display: grid;
          gap: 16px;
          margin-top: 18px;
          margin-bottom: 84px;
          padding-bottom: 40px;
        }

        .freyResultBlock {
          border-color: rgba(255, 200, 120, 0.16);
          background: rgba(255, 255, 255, 0.03);
        }

        .freyInterpretationResult {
          margin-top: 0;
        }

        .freyExpandStack {
          display: grid;
          gap: 14px;
        }

        .freyExpandBlock {
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(255, 255, 255, 0.02);
          overflow: hidden;
        }

        .freyExpandSummary {
          cursor: pointer;
          list-style: none;
          padding: 14px 16px;
          font-size: 11px;
          line-height: 1;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(238, 227, 204, 0.78);
        }

        .freyExpandSummary::-webkit-details-marker {
          display: none;
        }

        .freyCompareBlockSecondary {
          margin-top: 0;
          padding: 0 16px 16px;
          border: 0;
          background: transparent;
        }

        .freyExportBlock {
          margin-top: 26px;
          margin-bottom: 10px;
          border: 1px solid rgba(255, 244, 222, 0.08);
          background: rgba(255, 244, 222, 0.018);
          box-shadow: none;
          display: grid;
          gap: 0;
          overflow: hidden;
        }

        .freyExportSummary {
          list-style: none;
          cursor: pointer;
          padding: 12px 14px;
          font-size: 10px;
          line-height: 1;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 244, 222, 0.62);
        }

        .freyExportSummary::-webkit-details-marker {
          display: none;
        }

        .freyExportInner {
          display: grid;
          gap: 10px;
          padding: 0 14px 14px;
        }

        .freyExportTop {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .freyExportEyebrow,
        .freyVoiceMinimalHalo {
          position: absolute;
          inset: 0 0 auto 0;
          height: 86px;
          background: radial-gradient(ellipse at top, rgba(231, 202, 141, 0.18), rgba(231, 202, 141, 0.08) 46%, rgba(231, 202, 141, 0) 78%);
          pointer-events: none;
          opacity: 0.9;
        }

        .freyVoiceMinimalEyebrow {
          font-size: 12px;
          line-height: 1;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 244, 222, 0.68);
          justify-self: center;
        }

        .freyExportCopyButton {
          appearance: none;
          border: 1px solid rgba(255, 244, 222, 0.16);
          background: transparent;
          color: rgba(255, 244, 222, 0.9);
          font-size: 11px;
          line-height: 1;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 8px 10px;
          cursor: pointer;
        }

        .freyExportPre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 12px;
          line-height: 1.5;
          color: rgba(255, 244, 222, 0.92);
          background: rgba(0, 0, 0, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 12px;
          overflow-x: auto;
        }

        .freyExportGuide {
          display: grid;
          gap: 4px;
        }

        .freyExportGuideLine,
        .freyVoiceMinimalValue {
          font-size: 15px;
          line-height: 1.7;
          color: rgba(255, 244, 222, 0.94);
        }

        .freyVoiceMinimal {
          position: relative;
          overflow: hidden;
          margin-top: 24px;
          margin-bottom: 24px;
          padding: 22px 22px 20px;
          border: 1px solid rgba(255, 244, 222, 0.18);
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255, 244, 222, 0.10) 0%, rgba(255, 244, 222, 0.05) 28%, rgba(255, 244, 222, 0.02) 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), inset 0 18px 36px rgba(255, 244, 222, 0.025);
          display: grid;
          gap: 16px;
          text-align: center;
        }

        .freyVoiceMinimal > * {
          position: relative;
          z-index: 1;
        }

        .freyVoiceMinimalBody {
          display: grid;
          gap: 10px;
          text-align: left;
        }

        .freyVoiceMinimalState {
          font-size: 26px;
          line-height: 1.12;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(255, 244, 222, 0.98);
          max-width: 18ch;
          margin: 0 auto;
        }

        .freyVoiceMinimalBridge {
          font-size: 15px;
          line-height: 1.68;
          color: rgba(255, 244, 222, 0.88);
          max-width: 58ch;
          margin: 0 auto;
        }

        .freyVoiceMinimalRow {
          display: grid;
          gap: 4px;
          padding: 0 0 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .freyVoiceMinimalRow:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .freyVoiceMinimalLabel {
          font-size: 11px;
          line-height: 1;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 244, 222, 0.54);
        }

        .freyVoiceMinimalValueStrong {
          color: rgba(255, 244, 222, 0.96);
        }


        .freyResponseSurface {
          margin-top: 18px;
          margin-bottom: 18px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(255, 255, 255, 0.03);
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .freyResponseHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .freyResponseTitle {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(245, 239, 226, 0.86);
        }

        .freyResponseState {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(215, 182, 111, 0.9);
        }

        .freyResponseGrid,
        .freyResponseSummaryGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .freyResponseMetric {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
          padding: 12px;
        }

        .freyResponseLabel {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(184, 192, 214, 0.72);
          margin-bottom: 8px;
        }

        .freyResponseValue {
          color: rgba(245, 239, 226, 0.96);
          font-size: 16px;
          line-height: 1.38;
          word-break: break-word;
        }

        .freyResponseSummary {
          display: grid;
          gap: 10px;
        }

        .freyResponseSummaryTitle {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(184, 192, 214, 0.72);
        }

        .freyResponseNote {
          color: rgba(214, 221, 240, 0.82);
          font-size: 14px;
          line-height: 1.58;
        }

        .freyResponseError {
          color: rgba(255, 162, 162, 0.96);
          font-size: 13px;
          line-height: 1.45;
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
          font-size: 17px;
          line-height: 1.32;
          color: rgba(245, 247, 252, 0.98);
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .freyInterpretationEffect {
          font-size: 14px;
          line-height: 1.62;
          color: rgba(192, 200, 222, 0.86);
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


        .freyEntryBlock {
          display: grid;
          gap: 10px;
        }

        .freyCommandRowPrimary {
          margin-bottom: 0;
        }

        .freyButtonPrimary {
          min-width: 168px;
        }

        .freyInlineError {
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 120, 120, 0.18);
          background: rgba(120, 18, 22, 0.16);
          color: rgba(255, 214, 214, 0.92);
          font-size: 13px;
          line-height: 1.45;
        }

        .freyResultFlow {
          display: grid;
          gap: 16px;
          margin-top: 18px;
          margin-bottom: 84px;
          padding-bottom: 40px;
        }

        .freyResultBlock {
          border-color: rgba(255, 200, 120, 0.16);
          background: rgba(255, 255, 255, 0.03);
        }

        .freyInterpretationResult {
          margin-top: 0;
        }

        .freyExpandStack {
          display: grid;
          gap: 14px;
        }

        .freyExpandBlock {
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(255, 255, 255, 0.02);
          overflow: hidden;
        }

        .freyExpandSummary {
          cursor: pointer;
          list-style: none;
          padding: 14px 16px;
          font-size: 11px;
          line-height: 1;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(238, 227, 204, 0.78);
        }

        .freyExpandSummary::-webkit-details-marker {
          display: none;
        }

        .freyCompareBlockSecondary {
          margin-top: 0;
          padding: 0 16px 16px;
          border: 0;
          background: transparent;
        }

        .freyVoiceMinimalHalo {
          position: absolute;
          inset: 0 0 auto 0;
          height: 86px;
          background: radial-gradient(ellipse at top, rgba(231, 202, 141, 0.18), rgba(231, 202, 141, 0.08) 46%, rgba(231, 202, 141, 0) 78%);
          pointer-events: none;
          opacity: 0.9;
        }

        .freyVoiceMinimalEyebrow {
          font-size: 11px;
          line-height: 1;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 244, 222, 0.58);
        }

        .freyExportCopyButton {
          appearance: none;
          border: 1px solid rgba(255, 244, 222, 0.16);
          background: transparent;
          color: rgba(255, 244, 222, 0.9);
          font-size: 11px;
          line-height: 1;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 8px 10px;
          cursor: pointer;
        }

        .freyExportPre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 12px;
          line-height: 1.5;
          color: rgba(255, 244, 222, 0.92);
          background: rgba(0, 0, 0, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 12px;
          overflow-x: auto;
        }

        .freyExportGuide {
          display: grid;
          gap: 4px;
        }

        .freyExportGuideLine,
        .freyVoiceMinimalValue {
          font-size: 15px;
          line-height: 1.7;
          color: rgba(255, 244, 222, 0.94);
        }

        .freyVoiceMinimal {
          position: relative;
          overflow: hidden;
          margin-top: 24px;
          margin-bottom: 24px;
          padding: 22px 22px 20px;
          border: 1px solid rgba(255, 244, 222, 0.18);
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(255, 244, 222, 0.10) 0%, rgba(255, 244, 222, 0.05) 28%, rgba(255, 244, 222, 0.02) 100%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), inset 0 18px 36px rgba(255, 244, 222, 0.025);
          display: grid;
          gap: 16px;
          text-align: center;
        }

        .freyVoiceMinimal > * {
          position: relative;
          z-index: 1;
        }

        .freyVoiceMinimalBody {
          display: grid;
          gap: 10px;
          text-align: left;
        }

        .freyVoiceMinimalState {
          font-size: 26px;
          line-height: 1.12;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(255, 244, 222, 0.98);
          max-width: 18ch;
          margin: 0 auto;
        }

        .freyVoiceMinimalBridge {
          font-size: 15px;
          line-height: 1.68;
          color: rgba(255, 244, 222, 0.88);
          max-width: 58ch;
          margin: 0 auto;
        }

        .freyVoiceMinimalRow {
          display: grid;
          gap: 4px;
          padding: 0 0 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .freyVoiceMinimalRow:last-child {
          border-bottom: 0;
          padding-bottom: 0;
        }

        .freyVoiceMinimalLabel {
          font-size: 11px;
          line-height: 1;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(255, 244, 222, 0.54);
        }

        .freyVoiceMinimalValueStrong {
          color: rgba(255, 244, 222, 0.96);
        }


        .freyResponseSurface {
          margin-top: 18px;
          margin-bottom: 18px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(255, 255, 255, 0.03);
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .freyResponseHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .freyResponseTitle {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(245, 239, 226, 0.86);
        }

        .freyResponseState {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(215, 182, 111, 0.9);
        }

        .freyResponseGrid,
        .freyResponseSummaryGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .freyResponseMetric {
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
          padding: 12px;
        }

        .freyResponseLabel {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(184, 192, 214, 0.72);
          margin-bottom: 8px;
        }

        .freyResponseValue {
          color: rgba(245, 239, 226, 0.96);
          font-size: 16px;
          line-height: 1.38;
          word-break: break-word;
        }

        .freyResponseSummary {
          display: grid;
          gap: 10px;
        }

        .freyResponseSummaryTitle {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(184, 192, 214, 0.72);
        }

        .freyResponseNote {
          color: rgba(214, 221, 240, 0.82);
          font-size: 14px;
          line-height: 1.58;
        }

        .freyResponseError {
          color: rgba(255, 162, 162, 0.96);
          font-size: 13px;
          line-height: 1.45;
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
          font-size: 17px;
          line-height: 1.32;
          color: rgba(245, 247, 252, 0.98);
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .freyInterpretationEffect {
          font-size: 14px;
          line-height: 1.62;
          color: rgba(192, 200, 222, 0.86);
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


        .freyEntryBlock {
          display: grid;
          gap: 10px;
        }

        .freyCommandRowPrimary {
          margin-bottom: 0;
        }

        .freyButtonPrimary {
          min-width: 168px;
        }

        .freyInlineError {
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255, 120, 120, 0.18);
          background: rgba(120, 18, 22, 0.16);
          color: rgba(255, 214, 214, 0.92);
          font-size: 13px;
          line-height: 1.45;
        }

        .freyResultFlow {
          display: grid;
          gap: 16px;
          margin-top: 18px;
          margin-bottom: 84px;
          padding-bottom: 40px;
        }

        .freyResultBlock {
          border-color: rgba(255, 200, 120, 0.16);
          background: rgba(255, 255, 255, 0.03);
        }

        .freyInterpretationResult {
          margin-top: 0;
        }

        .freyExpandStack {
          display: grid;
          gap: 14px;
        }

        .freyExpandBlock {
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(255, 255, 255, 0.02);
          overflow: hidden;
        }

        .freyExpandSummary {
          cursor: pointer;
          list-style: none;
          padding: 14px 16px;
          font-size: 11px;
          line-height: 1;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(238, 227, 204, 0.78);
        }

        .freyExpandSummary::-webkit-details-marker {
          display: none;
        }

        .freyCompareBlockSecondary {
          margin-top: 0;
          padding: 0 16px 16px;
          border: 0;
          background: transparent;
        }

        .freyResultControlsHint {
          margin: 0 0 12px;
          font-size: 14px;
          line-height: 1.58;
          color: rgba(220, 184, 116, 0.9);
        }

        .freyEscalationBlock {
          display: grid;
          gap: 10px;
          padding: 16px 18px;
          margin-bottom: 24px;
          border-radius: 18px;
          border: 1px solid rgba(255, 200, 120, 0.14);
          background: linear-gradient(180deg, rgba(255, 200, 120, 0.08), rgba(255, 255, 255, 0.02));
        }

        .freyEscalationLabel {
          font-size: 10px;
          line-height: 1;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(239, 222, 185, 0.7);
        }

        .freyEscalationText {
          font-size: 14px;
          line-height: 1.62;
          color: rgba(214, 221, 240, 0.84);
        }

        .freyConversationBlock {
          display: grid;
          gap: 14px;
          padding: 20px;
        }

        .freyConversationHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .freyConversationHeaderText {
          display: grid;
          gap: 8px;
        }

        .freyConversationEyebrow {
          font-size: 10px;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: rgba(188, 197, 220, 0.58);
        }

        .freyConversationTitle {
          font-size: 26px;
          line-height: 1.18;
          color: rgba(255, 249, 236, 0.98);
          font-weight: 620;
        }

        .freyConversationLead {
          font-size: 16px;
          line-height: 1.64;
          color: rgba(226, 232, 244, 0.9);
        }

        .freyConversationMetaRow {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .freyConversationMetaCard,
        .freyConversationMetric,
        .freyConversationOperatorNote {
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
          padding: 12px 14px;
        }

        .freyConversationMetaLabel,
        .freyConversationMetricLabel,
        .freyConversationOperatorLabel,
        .freyResultControlsLabel {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(184, 192, 214, 0.72);
          margin-bottom: 8px;
        }

        .freyConversationMetaValue,
        .freyConversationMetricValue {
          color: rgba(245, 239, 226, 0.96);
          font-size: 16px;
          line-height: 1.4;
        }

        .freyConversationBand {
          border-radius: 999px;
          border: 1px solid rgba(255, 200, 120, 0.16);
          background: rgba(255, 200, 120, 0.08);
          padding: 10px 14px;
          font-size: 11px;
          line-height: 1.4;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 244, 222, 0.92);
        }

        .freyConversationMetricRow {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .freyConversationResultTail {
          display: grid;
          gap: 12px;
          padding-bottom: 28px;
        }

        .freyInlineExpandBlock {
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.07);
          background: rgba(255, 255, 255, 0.02);
          overflow: hidden;
        }

        .freyInlineExpandSummary {
          cursor: pointer;
          list-style: none;
          padding: 14px 16px;
          font-size: 11px;
          line-height: 1;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(238, 227, 204, 0.78);
        }

        .freyInlineExpandSummary::-webkit-details-marker {
          display: none;
        }

        .freyInlineExpandBlock[open] > .freyInlineExpandSummary {
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .freyConversationOperatorNoteCompact {
          border: 0;
          background: transparent;
          padding: 0 16px 16px;
        }

        .freyMetricsExpand .freyJson {
          padding-top: 0;
        }

        .freyConversationOperatorText {
          font-size: 16px;
          line-height: 1.76;
          color: rgba(214, 221, 240, 0.92);
        }

        .freyConversationBlock .freyInterpretationResult {
          margin-top: 0;
          padding: 2px 16px 16px;
          border-top: 0;
        }

        .freyResultControls {
          display: grid;
          gap: 12px;
          padding-bottom: clamp(20px, 3vh, 28px);
        }

        /* __FREY_C1_5_2_RESULT_TAIL_SPACE_REDUCTION_V0_3__ */
        .freyBottomNavClearance {
          height: clamp(12px, 2.2vh, 20px);
          pointer-events: none;
        }

        .freyExpandEmpty {
          padding: 0 16px 16px;
          font-size: 13px;
          line-height: 1.5;
          color: rgba(184, 192, 214, 0.72);
        }

        @media (max-width: 760px) {
          .freyRootResult {
            padding-top: 72px;
            padding-bottom: clamp(72px, 9vh, 92px);
          }

          .freyResultFlow {
            margin-bottom: clamp(56px, 7vh, 76px);
            padding-bottom: 36px;
          }

          .freyMembrane {
            padding: 22px;
          }

          .freyCommandRow,
          .freyTemporalRow,
          .freyResponseGrid,
          .freyResponseSummaryGrid,
          .freyConversationMetaRow,
          .freyConversationMetricRow {
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

          .freyResultControls {
            padding-bottom: clamp(24px, 4vh, 32px);
          }

          .freyBottomNavClearance {
            height: clamp(16px, 2.6vh, 24px);
          }
        }
      `}</style>
    </div>
  );
}




