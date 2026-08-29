import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EXPORT_GUIDE_LINES, buildFreyExportPayload, buildFreyExportText, mapResultToMinimalVoice } from "../lib/frey-export-minimal";
import PublicSupportRoute from "../components/btc/PublicSupportRoute";

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
const AI_READING_PACKET_MARKER = "__FREY_AI_READING_PACKET_HUMAN_V0_1__";
const ANCHOR_STORAGE_KEY = "frey.anchor.v1";
const ANCHOR_STORAGE_SCHEMA_VERSION = "v1";

const FREY_RU_TEXT = new Map([["Cosmographer · Relation Lens", "Космограф · Линза связей"], ["Compare reads structural difference; anchor stays quiet.", "Сравнение читает структурную разницу; якорь остаётся неизменным."], ["Loading personal axis", "Загрузка личной оси"], ["Anchor mirrors Active Date", "Якорь повторяет активную дату"], ["Active Date matches Anchor", "Активная дата совпадает с якорем"], ["Quiet personal axis", "Тихая личная ось"], ["success", "готово"], ["error", "ошибка"], ["loading", "выполняется"], ["idle", "ожидание"], ["high", "высокая"], ["medium", "средняя"], ["mid", "средняя"], ["low", "низкая"], ["supported", "поддержана"], ["sensitive", "чувствительна"], ["fragile", "хрупкая"], ["Outer stability is weakening faster than the core can compensate.", "Внешняя стабильность ослабевает быстрее, чем ядро успевает компенсировать."], ["Pressure is accumulating faster than release inside the active frame.", "Давление накапливается внутри активной рамки быстрее, чем происходит разрядка."], ["Signal alignment still holds, but only inside a narrower stable corridor.", "Согласование сигнала сохраняется, но только внутри более узкого устойчивого коридора."], ["The field keeps its core line, but edge behavior now needs tighter pacing.", "Поле сохраняет основную линию, но поведение на краях требует более точного темпа."], ["Stabilized dense core", "Стабилизированное плотное ядро"], ["The dense regime stays internally settled, with strong formation continuity and very low structural agitation.", "Плотный режим остаётся внутренне устойчивым: непрерывность формы высока, структурное возмущение очень низкое."], ["Compressed dense regime", "Сжатый плотный режим"], ["The dense regime stays structurally compact, while internal compression rises and reduces the ease of structural pacing.", "Плотный режим остаётся структурно компактным, но внутреннее сжатие растёт и усложняет структурный темп."], ["Structured dense formation", "Структурированная плотная форма"], ["The dense regime remains well-formed, while internal movement stays contained within a stable structural arrangement.", "Плотный режим сохраняет форму, а внутреннее движение остаётся в пределах устойчивой структуры."], ["Eclipse-sensitive transition band", "Переходная зона, чувствительная к затмению"], ["The field remains transitional, with enough structural density to retain a defined but shifting regime contour.", "Поле остаётся переходным; плотности достаточно, чтобы сохранять определённый, но меняющийся контур режима."], ["The regime moves through a looser transition layer, where structural definition shifts more readily across nearby dates.", "Режим проходит через более свободный переходный слой, где структурная определённость быстрее меняется между соседними датами."], ["Open structural dispersion", "Открытая структурная дисперсия"], ["The field stays open and diffuse, with weaker formation density and low structural containment.", "Поле остаётся открытым и рассеянным, с меньшей плотностью формы и слабым структурным удержанием."], ["Elevated internal load", "Повышенная внутренняя нагрузка"], ["Pressure accumulates faster than release, raising distortion risk under acceleration.", "Давление накапливается быстрее разрядки, повышая риск искажения при ускорении."], ["Medium load with acceleration risk", "Средняя нагрузка с риском ускорения"], ["Baseline pressure stays moderate, yet distortion rises fast when motion exceeds structural pacing.", "Базовое давление остаётся умеренным, но искажение быстро растёт, когда движение опережает структурный темп."], ["Low pressure band", "Зона низкого давления"], ["Friction stays reduced, allowing motion without heavy internal compression.", "Трение остаётся сниженным, позволяя двигаться без сильного внутреннего сжатия."], ["High internal coherence", "Высокая внутренняя согласованность"], ["Signal coupling holds across the field and supports sustained harmonic continuity.", "Связность сигнала удерживается по всему полю и поддерживает устойчивую гармоническую непрерывность."], ["Moderate coherence under fluctuation", "Умеренная согласованность при колебаниях"], ["Signal aligns in short stable bands, but resonance breaks when the field is forced beyond its internal rhythm.", "Сигнал согласуется в коротких устойчивых зонах, но резонанс нарушается, если поле принуждают выйти за внутренний ритм."], ["Weak harmonic lock", "Слабая гармоническая фиксация"], ["Coupling remains partial and coherence fragments under unstable movement.", "Связность остаётся частичной, а согласованность фрагментируется при нестабильном движении."], ["Supported core frame", "Поддержанная рамка ядра"], ["Structure remains well-supported and can hold motion without immediate edge-loss.", "Структура хорошо поддержана и может удерживать движение без немедленной потери краёв."], ["Medium support with sensitive edges", "Средняя поддержка с чувствительными краями"], ["Core structure holds, while outer balance becomes vulnerable during amplified or fast-turning phases.", "Структура ядра удерживается, но внешний баланс становится уязвимым в усиленных или быстро меняющихся фазах."], ["Fragile outer balance", "Хрупкий внешний баланс"], ["Support remains limited and weak edges lose alignment under excess push.", "Поддержка ограничена, а слабые края теряют согласование при избыточном давлении."], ["Mode: Hold structure", "Режим: удерживать структуру"], ["Mode: Advance through the stable line", "Режим: двигаться по устойчивой линии"], ["Mode: Reduce expansion at unstable edges", "Режим: уменьшить расширение на нестабильных краях"], ["Mode: Controlled advance", "Режим: контролируемое продвижение"], ["Structural State", "Структурное состояние"], ["Tension Profile", "Профиль напряжения"], ["Resonance Profile", "Профиль резонанса"], ["Deterministic reading becomes visible after the run.", "Детерминированное чтение становится видимым после запуска."], ["Stabilized density", "Стабилизированная плотность"], ["The pattern is concentrated and held in a stable frame.", "Паттерн сконцентрирован и удерживается в устойчивой рамке."], ["Advance through one clean step without adding noise.", "Продвигайтесь одним чистым шагом, не добавляя шума."], ["Structured density", "Структурированная плотность"], ["Pressure is organized enough to support deliberate movement.", "Давление достаточно организовано для осознанного движения."], ["Keep the sequence ordered and move through the next defined node.", "Сохраняйте порядок последовательности и переходите к следующему определённому узлу."], ["Compressed density", "Сжатая плотность"], ["The field is concentrated but carrying compression and drag.", "Поле сконцентрировано, но несёт сжатие и сопротивление."], ["Reduce parallel motion and release one bottleneck first.", "Сократите параллельное движение и сначала освободите одно узкое место."], ["Open regime", "Открытый режим"], ["The pattern is loose and less materially bound.", "Паттерн свободный и менее материально связан."], ["Anchor the next move in one concrete signal before scaling.", "Привяжите следующий ход к одному конкретному сигналу до масштабирования."], ["Edge instability", "Нестабильность края"], ["The current pattern is vulnerable to rupture or misfire.", "Текущий паттерн уязвим к разрыву или ошибочному срабатыванию."], ["Do not escalate. Stabilize structure before any expansion.", "Не усиливайте. Стабилизируйте структуру до любого расширения."], ["Transitional structure", "Переходная структура"], ["The field is holding form but still reorganizing under load.", "Поле удерживает форму, но продолжает перестраиваться под нагрузкой."], ["Stay precise and let the next step confirm direction.", "Сохраняйте точность и дайте следующему шагу подтвердить направление."], ["Balanced temporal shift", "Сбалансированный временной сдвиг"], ["The compared dates remain within a moderate structural reconfiguration band.", "Сравниваемые даты остаются в умеренной зоне структурной перенастройки."], ["Acceleration of structural resonance", "Ускорение структурного резонанса"], ["The field moves from a more constrained configuration toward a clearer expansion window.", "Поле движется от более ограниченной конфигурации к более ясному окну расширения."], ["Collapse of harmonic tension", "Снижение гармонического напряжения"], ["The field descends toward a more stable basin with lower internal strain.", "Поле смещается к более устойчивому бассейну с меньшим внутренним напряжением."], ["Escalation into unstable load", "Рост нестабильной нагрузки"], ["The compared dates show rising pressure with weaker structural support.", "Сравниваемые даты показывают рост давления при более слабой структурной поддержке."], ["Hold structure", "Удерживать структуру"], ["Stable line", "Устойчивая линия"], ["Dense phase", "Плотная фаза"], ["Controlled advance", "Контролируемое продвижение"], ["Phase Density", "Плотность фазы"], ["Harmonic Tension", "Гармоническое напряжение"], ["Resonance Level", "Уровень резонанса"], ["Structural Stability", "Структурная стабильность"], ["phase_density = concentration of temporal pattern", "phase_density = концентрация временного паттерна"], ["harmonic_tension = pressure / friction in the field", "harmonic_tension = давление / трение в поле"], ["resonance_level = alignment with the dominant pattern", "resonance_level = согласование с доминирующим паттерном"], ["eclipse_proximity = closeness to eclipse-driven amplification", "eclipse_proximity = близость к усилению, связанному с затмением"], ["structural_stability = capacity to hold form under pressure", "structural_stability = способность удерживать форму под давлением"], ["Use Meaning/Direction as interpretive layer, not as raw engine data.", "Используйте Значение/Направление как интерпретационный слой, а не как сырые данные движка."], ["UP", "ВВЕРХ"], ["DOWN", "ВНИЗ"], ["FLAT", "БЕЗ ИЗМЕНЕНИЙ"], ["Stability", "Стабильность"], ["Copy snapshot", "Скопировать snapshot"], ["Copy compare snapshot", "Скопировать snapshot сравнения"], ["Copied", "Скопировано"], ["Single-date export is ready for direct AI handoff.", "Экспорт для одной даты готов к прямой передаче в ИИ."], ["Compare export includes both dates and the active delta.", "Экспорт сравнения включает обе даты и активную дельту."]]);
function freyText(value, ru) {
  if (!ru || typeof value !== "string") return value;
  const exact = FREY_RU_TEXT.get(value);
  if (exact) return exact;
  if (value.includes(" · ")) return value.split(" · ").map((segment) => FREY_RU_TEXT.get(segment) || segment).join(" · ");
  if (value.includes(". ")) {
    const parts = value.split(". ");
    let translatedAny = false;
    const translated = parts.map((segment, index) => {
      const sentence = index < parts.length - 1 ? `${segment}.` : segment;
      const mapped = FREY_RU_TEXT.get(sentence);
      if (mapped) translatedAny = true;
      return mapped || sentence;
    });
    if (translatedAny) return translated.join(" ");
  }
  return value;
}

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
      title: "⌬ Cosmographer · Relation Lens",
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

function formatHumanDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
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
  const rawLang = Array.isArray(query?.lang) ? query.lang[0] : query?.lang;
  const initialLocale = rawLang === "ru" ? "ru" : "en";
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
      initialLocale,
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

export default function Frey({ initialDate, initialResult, initialCompareDate, initialCompareResult, initialTimelineDates, initialTimelineResults, initialQueryMarker, initialSignalBind, initialAccessCtx, initialAccessHref, initialLocale = "en" }) {
  const ru = initialLocale === "ru";
  const [query, setQuery] = useState(initialSignalBind?.raw_query || "");
  const [date, setDate] = useState(initialDate);
  const [result, setResult] = useState(initialResult);
  const [compareDate, setCompareDate] = useState(initialCompareDate || "");
  const [compareResult, setCompareResult] = useState(initialCompareResult);
  const [loading, setLoading] = useState(false);
  const [uiError, setUiError] = useState("");
  const [entryOpen, setEntryOpen] = useState(false); // __FREY_IDLE_PROD_CANON_V0_3__
  const [exportCopied, setExportCopied] = useState(false);
  const [activeDateEditOpen, setActiveDateEditOpen] = useState(false);
  const [activeDateDraft, setActiveDateDraft] = useState(initialDate || "");
  const [persistedAnchorDate, setPersistedAnchorDate] = useState("");
  const [anchorStorageReady, setAnchorStorageReady] = useState(false);
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
  const compareActive = /^\d{4}-\d{2}-\d{2}$/.test(compareDate || "");
  const anchorDisplayDate = compareActive
    ? responseSurface.active_date
    : (persistedAnchorDate || responseSurface.active_date);
  const hasPersistedAnchor = Boolean(persistedAnchorDate);
  const anchorMatchesActive = Boolean(
    !compareActive
    && hasPersistedAnchor
    && /^\d{4}-\d{2}-\d{2}$/.test(responseSurface.active_date || "")
    && persistedAnchorDate === responseSurface.active_date
  );
  const showSetCurrent = !compareActive && anchorStorageReady && (!hasPersistedAnchor || !anchorMatchesActive);
  const showReset = !compareActive && anchorStorageReady && hasPersistedAnchor;
  const anchorStatusLine = compareActive
    ? "Compare reads structural difference; anchor stays quiet."
    : !anchorStorageReady
    ? "Loading personal axis"
    : !hasPersistedAnchor
    ? "Anchor mirrors Active Date"
    : anchorMatchesActive
    ? "Active Date matches Anchor"
    : "Quiet personal axis";
  const conversationalResponse = useMemo(
    () => buildConversationalResponse(responseSurface, interpretation),
    [responseSurface, interpretation]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (compareActive) {
      setPersistedAnchorDate("");
      setAnchorStorageReady(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(ANCHOR_STORAGE_KEY);
      if (!raw) {
        setPersistedAnchorDate("");
        setAnchorStorageReady(true);
        return;
      }

      const parsed = JSON.parse(raw);
      const isValid = parsed
        && parsed.schema_version === ANCHOR_STORAGE_SCHEMA_VERSION
        && /^\d{4}-\d{2}-\d{2}$/.test(parsed.anchor_date || "");

      if (!isValid) {
        window.localStorage.removeItem(ANCHOR_STORAGE_KEY);
        setPersistedAnchorDate("");
        setAnchorStorageReady(true);
        return;
      }

      setPersistedAnchorDate(parsed.anchor_date);
      setAnchorStorageReady(true);
    } catch (_error) {
      try { window.localStorage.removeItem(ANCHOR_STORAGE_KEY); } catch (_removeError) {}
      setPersistedAnchorDate("");
      setAnchorStorageReady(true);
    }
  }, [compareActive]);

  function buildFreyUrl(next) {
    const params = new URLSearchParams();
    params.set("lang", initialLocale);
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
      setUiError(ru ? "Отметьте сигнальный след или выберите дату." : "Mark a signal trace or select a date.");
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
      setUiError(ru ? "Укажите обе даты для режима сравнения." : "Set both dates for compare mode.");
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
      setUiError(ru ? "Выберите активную дату." : "Select an active date.");
      return;
    }
    setUiError("");
    setLoading(true);
    if (typeof window !== "undefined") {
      window.location.assign(buildFreyUrl({ query, date, compareDate, timelineDates: [] }));
    }
  }

  function openActiveDateEditor() {
    const currentDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : (/^\d{4}-\d{2}-\d{2}$/.test(responseSurface.active_date) ? responseSurface.active_date : "");
    setActiveDateDraft(currentDate);
    setActiveDateEditOpen(true);
  }

  function closeActiveDateEditor() {
    const currentDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : (/^\d{4}-\d{2}-\d{2}$/.test(responseSurface.active_date) ? responseSurface.active_date : "");
    setActiveDateDraft(currentDate);
    setActiveDateEditOpen(false);
  }

  function applyActiveDateDirectEdit() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(activeDateDraft)) {
      setUiError(ru ? "Выберите корректную активную дату." : "Select a valid active date.");
      return;
    }
    if (activeDateDraft === date) {
      setActiveDateEditOpen(false);
      return;
    }
    setDate(activeDateDraft);
    setActiveDateEditOpen(false);
    setUiError("");
    setLoading(true);
    if (typeof window !== "undefined") {
      window.location.assign(
        buildFreyUrl({ query, date: activeDateDraft, compareDate: "", timelineDates: [] })
      );
    }
  }

  function setCurrentDateAsAnchor() {
    if (compareActive || typeof window === "undefined") return;
    const currentDate = /^\d{4}-\d{2}-\d{2}$/.test(responseSurface.active_date || "")
      ? responseSurface.active_date
      : (/^\d{4}-\d{2}-\d{2}$/.test(date || "") ? date : "");
    if (!currentDate) return;

    const record = {
      anchor_date: currentDate,
      written_at: new Date().toISOString(),
      schema_version: ANCHOR_STORAGE_SCHEMA_VERSION,
      origin: "manual_set",
    };

    try {
      window.localStorage.setItem(ANCHOR_STORAGE_KEY, JSON.stringify(record));
      setPersistedAnchorDate(currentDate);
      setAnchorStorageReady(true);
    } catch (_error) {
      setPersistedAnchorDate("");
      setAnchorStorageReady(true);
    }
  }

  function resetAnchorPersistence() {
    if (compareActive || typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(ANCHOR_STORAGE_KEY);
    } catch (_error) {}
    setPersistedAnchorDate("");
    setAnchorStorageReady(true);
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
    <div className={`freyRoot${hasResult ? " freyRootResult" : ""}`} data-frey-ui-refresh="__FREY_PUBLIC_BOUNDARY_VISUAL_LIFT_V0_1__" data-frey-mobile-repair="__FREY_MOBILE_RESULT_CONTAINMENT_AND_ACTION_ANCHOR_V0_1__">

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
                  aria-label={ru ? "Активировать сигнальный порог Frey" : "Activate Frey signal gate"}
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
                    <div className="freySignalEyebrow">{ru ? "Сигнальный след" : "Signal Trace"}</div>
                    <button className="freyGhostButton" type="button" onClick={() => setEntryOpen(false)}>
                      {ru ? "ЗАКРЫТЬ" : "RESEAL"}
                    </button>
                  </div>

                  <textarea
                    className="freySignalTextarea"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={ru ? "Отметьте сигнальный след..." : "Mark signal trace..."}
                  />

                  <div className="freySignalActions">
                    <button className="freyButton freyButtonPrimary" type="button" onClick={runSignal}>
                      {loading ? (ru ? "Выполняется..." : "Running...") : (ru ? "Запустить Frey" : "Run Frey")}
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
                    <div className="freyConversationEyebrow">⌬ {ru ? "Космограф · Линза связей" : "Cosmographer · Relation Lens"}</div>
                    <div className="freyConversationTitle">{freyText(conversationalResponse.title, ru)}</div>
                  </div>
                  <div className="freyResponseState">{freyText(responseSurface.ui_state, ru)}</div>
                </div>

                <div className="freyConversationLead">{freyText(conversationalResponse.lead, ru)}</div>

                <div
                  className="freyConversationMetaBand"
                  data-frey-unified-meta-band="__FREY_TRUE_UNIFIED_META_BAND_V0_1__"
                >
                  <div className="freyConversationMetaBandPrimary">
                    <div
                      className="freyConversationMetaBandCell freyConversationMetaBandCellActive"
                      data-frey-compare-primary-edit-restore="__FREY_COMPARE_PRIMARY_EDIT_RESTORE_V0_1__"
                    >
                      <div className="freyConversationMetaLabel">◉ {ru ? "Активная дата · Точка чтения" : "Active Date · Reading Point"}</div>
                      {!activeDateEditOpen ? (
                        <button
                          className="freyConversationMetaTrigger"
                          type="button"
                          onClick={openActiveDateEditor}
                          aria-expanded={activeDateEditOpen ? "true" : "false"}
                        >
                          <span className="freyConversationMetaValue">
                            {responseSurface.active_date ? formatHumanDate(responseSurface.active_date) : "n/a"}
                          </span>
                          <span className="freyConversationMetaHint">{ru ? "Нажмите, чтобы изменить" : "Click to edit"}</span>
                        </button>
                      ) : (
                        <div className="freyConversationMetaInline">
                          <input
                            type="date"
                            value={activeDateDraft}
                            onChange={(e) => setActiveDateDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") applyActiveDateDirectEdit();
                              if (e.key === "Escape") closeActiveDateEditor();
                            }}
                            className="freyInput freyConversationMetaInlineInput"
                            autoFocus
                          />
                          <div className="freyConversationMetaHint">{ru ? "Измените дату и примените её, чтобы перезагрузить детерминированный результат." : "Edit the date, then apply to reload the deterministic result."}</div>
                          <div className="freyConversationMetaActionRow">
                            <button
                              className="freyGhostButton freyConversationMetaClose"
                              type="button"
                              onClick={closeActiveDateEditor}
                            >
                              {ru ? "Отмена" : "Cancel"}
                            </button>
                            <button
                              className="freyButton freyConversationMetaApply"
                              type="button"
                              onClick={applyActiveDateDirectEdit}
                            >
                              {ru ? "Применить" : "Apply"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                
                    <div
                      className="freyConversationMetaBandCell freyConversationMetaBandCellAnchor"
                      data-frey-anchor-a1="__FREY_ANCHOR_A1_V0_1__"
                      data-frey-anchor-a2="__FREY_ANCHOR_A2_SINGLE_STORAGE_V0_1__"
                    >
                      <div className="freyConversationMetaLabel">⌖ {ru ? "Якорь · Личная ось" : "Anchor · Personal Axis"}</div>
                      <div className="freyConversationMetaValue">
                        {anchorDisplayDate ? formatHumanDate(anchorDisplayDate) : "n/a"}
                      </div>
                      <div className="freyConversationMetaHint">{freyText(anchorStatusLine, ru)}</div>
                      {(showSetCurrent || showReset) && (
                        <div
                          className="freyConversationMetaActionRow"
                          data-frey-anchor-a2-visibility="__FREY_ANCHOR_ACTION_VISIBILITY_POLISH_V0_2__"
                        >
                          {showSetCurrent && (
                            <button
                              className="freyGhostButton freyConversationMetaClose"
                              type="button"
                              onClick={setCurrentDateAsAnchor}
                            >
                              {ru ? "Установить текущую" : "Set current"}
                            </button>
                          )}
                          {showReset && (
                            <button
                              className="freyGhostButton freyConversationMetaClose"
                              type="button"
                              onClick={resetAnchorPersistence}
                            >
                              {ru ? "Сбросить" : "Reset"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                
                  <div className="freyConversationMetaBandSecondary">
                    <div className="freyConversationMetaBandCell freyConversationMetaBandCellEngine">
                      <div className="freyConversationMetaLabel">{ru ? "Движок" : "Engine"}</div>
                      <div className="freyConversationMetaValue">{responseSurface.engine_version || responseSurface.engine || "n/a"}</div>
                    </div>
                  </div>
                </div>

                {conversationalResponse.summary && (
                  <div className="freyConversationBand">{freyText(conversationalResponse.summary, ru)}</div>
                )}

                {responseSurface.ui_state === "error" && (
                  <div className="freyResponseError">{responseSurface.error || (ru ? "Не удалось запустить Frey." : "Unable to run Frey.")}</div>
                )}

                {responseSurface.ui_state === "success" && responseSurface.metrics && (
                  <>
                    <div className="freyConversationMetricRow">
                      <div className="freyConversationMetric">
                        <div className="freyConversationMetricLabel">{ru ? "Интенсивность" : "Intensity"}</div>
                        <div className="freyConversationMetricValue">{freyText(responseSurface.compact_summary?.intensity_band || "n/a", ru)}</div>
                      </div>
                      <div className="freyConversationMetric">
                        <div className="freyConversationMetricLabel">{ru ? "Стабильность" : "Stability"}</div>
                        <div className="freyConversationMetricValue">{freyText(responseSurface.compact_summary?.stability_band || "n/a", ru)}</div>
                      </div>
                      <div className="freyConversationMetric">
                        <div className="freyConversationMetricLabel">{ru ? "Резонанс" : "Resonance"}</div>
                        <div className="freyConversationMetricValue">{freyText(responseSurface.compact_summary?.resonance_band || "n/a", ru)}</div>
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
                          <div className="freyVoiceMinimalEyebrow">{ru ? "Интерпретация Frey" : "Frey Interpretation"}</div>
                          <div className="freyVoiceMinimalState">{freyText(minimalVoice.state, ru)}</div>
                          <div className="freyVoiceMinimalBridge">{freyText(minimalVoiceBridge, ru)}</div>
                          <div className="freyVoiceMinimalBody">
                            <div className="freyVoiceMinimalRow">
                              <div className="freyVoiceMinimalLabel">{ru ? "Значение" : "Meaning"}</div>
                              <div className="freyVoiceMinimalValue">{freyText(minimalVoice.meaning, ru)}</div>
                            </div>
                            <div className="freyVoiceMinimalRow">
                              <div className="freyVoiceMinimalLabel">{ru ? "Направление" : "Direction"}</div>
                              <div className="freyVoiceMinimalValue freyVoiceMinimalValueStrong">{freyText(minimalVoice.direction, ru)}</div>
                            </div>
                          </div>
                        </section>
                      );
                    })()}

                    <details className="freyInlineExpandBlock" data-frey-primary-reading="__FREY_C1_PRIMARY_READING_V0_2__" data-frey-primary-reading-state="open" open>
                      <summary className="freyInlineExpandSummary">{ru ? "Основное чтение" : "Primary reading"}</summary>
                      <div className="freyConversationOperatorNote freyConversationOperatorNoteCompact">
                        <div className="freyConversationOperatorText">{freyText(conversationalResponse.operator_note, ru)}</div>
                      </div>
                    </details>

                    <div className="freyConversationResultTail">
                      <details className="freyInlineExpandBlock" data-frey-interpretation={MARKER} data-frey-interpretation-clean={C1_3_INTERPRETATION_SPACING_MARKER}>
                        <summary className="freyInlineExpandSummary">{ru ? "Слои интерпретации" : "Interpretation layers"}</summary>
                        <div className="freyInterpretation freyInterpretationResult">

                          <div className="freyInterpretationGridV14">
                            {interpretation.zones.map((zone) => (
                              <div key={freyText(zone.label, ru)} className="freyInterpretationZone">
                                <div className="freyInterpretationZoneLabel">{freyText(zone.label, ru)}</div>
                                <div className="freyInterpretationZoneBody">
                                  <div className="freyInterpretationState">{freyText(zone.state, ru)}</div>
                                  <div className="freyInterpretationEffect">{freyText(zone.effect, ru)}</div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="freyOperationalVector">
                            <div className="freyOperationalVectorTag">{ru ? "Операционный вектор" : "Operational Vector"}</div>
                            <div className="freyOperationalVectorMode">{freyText(interpretation.vector, ru)}</div>
                          </div>
                        </div>
                      </details>

                      <details className="freyInlineExpandBlock freyMetricsExpand" data-frey-raw-metrics="__FREY_RAW_METRICS_RESULT_ONLY_V0_1__">
                        <summary className="freyInlineExpandSummary">{ru ? "Исходные метрики" : "Raw metrics"}</summary>
                        <pre className="freyJson">{JSON.stringify(result, null, 2)}</pre>
                      </details>
                    </div>
                  </>
                )}
              </section>

              <div className="freyResultControls">
                  <div data-frey-guide-discoverability="__FREY_GUIDE_DISCOVERABILITY_V0_1__" className="freyGuideRoute">
                    <div className="freyGuideRouteCopy">
                      <span className="freyGuideRouteEyebrow">{initialLocale === "ru" ? "ГИД FREY" : "FREY GUIDE"}</span>
                      <span className="freyGuideRouteText">{initialLocale === "ru" ? "Как читать одну дату, сравнивать две даты, понимать Δ и передавать чтение стороннему ИИ." : "How to read one date, compare two dates, understand Δ and carry a Frey reading into another AI."}</span>
                    </div>
                    <Link className="freyGuideRouteLink" href={`/guide/frey?lang=${initialLocale}`}>
                      {initialLocale === "ru" ? "Открыть полный Guide →" : "Open the full Guide →"}
                    </Link>
                  </div>
                <div className="freyResultControlsLabel" data-frey-human-navigation={AI_READING_PACKET_MARKER}>{ru ? "Продолжить чтение" : "Continue the reading"}</div>
                <div
                  className="freyResultControlsHint"
                  data-frey-compare-discoverability="__FREY_COMPARE_DISCOVERABILITY_V0_27__"
                  data-frey-compare-state={hasCompare ? "active" : "ready"}
                >
                  {hasCompare
                    ? (ru ? "Сравнение со второй датой активно. Ниже показано, что изменилось между двумя датами." : "A second-date comparison is active. Below you can see what changed between the two dates.")
                    : (ru ? "Добавьте вторую дату, чтобы увидеть Δ — что изменилось между текущей и выбранной датой." : "Add a second date to see Δ — what changed between the current date and the date you choose.")}
                </div>
                <div className="freyExpandStack">
                  <details ref={compareExpandRef} className="freyExpandBlock" data-frey-compare="__FREY_COMPARE_MODE_V0_1__" data-frey-compare-auto-open={C1_3_COMPARE_AUTO_OPEN_MARKER} data-frey-expand-state={hasCompare ? "active" : "ready"} open={hasCompare}>
                    <summary className="freyExpandSummary">{ru ? "Сравнить со второй датой · Δ изменения" : "Compare with a second date · Δ change"}</summary>

                    <div className="freyCompareBlock freyCompareBlockSecondary" data-frey-compare-primary={initialDate || ""} data-frey-compare-secondary={initialCompareDate || ""}>
                      <div className="freyResultControlsHint">{ru ? "Выберите любую вторую дату. Frey рассчитает обе даты и покажет структурный переход между ними — не рейтинг «лучше / хуже»." : "Choose any second date. Frey calculates both dates and shows the structural transition between them — not a better/worse ranking."}</div>
                      <div className="freyCompareRow">
                        <input
                          type="date"
                          value={compareDate}
                          onChange={(e) => setCompareDate(e.target.value)}
                          className="freyInput freyTemporalInput"
                        />

                        <button onClick={runCompare} className="freyButton freyTemporalButton" type="button">
                          {ru ? "Сравнить" : "Compare"}
                        </button>
                      </div>

                      {hasCompare && (
                        <>
                          <div className="freyCompareGrid">
                            <div className="freyCompareCard">
                              <div className="freyCompareLabel">◉ {ru ? "Активная дата" : "Active Date"} · {initialDate}</div>
                              <div className="freyCompareMode">{freyText(interpretation.vector, ru)}</div>
                            </div>
                            <div className="freyCompareCard">
                              <div className="freyCompareLabel">Δ {ru ? "Дата сравнения" : "Compare Date"} · {initialCompareDate}</div>
                              <div className="freyCompareMode">{freyText(compareInterpretation.vector, ru)}</div>
                            </div>
                          </div>

                          {deltaBlock && (
                            <div
                              className="freyDeltaBlock"
                              data-frey-delta="__FREY_MULTI_DATE_ANALYSIS_V0_1__"
                              data-frey-delta-primary={initialDate || ""}
                              data-frey-delta-secondary={initialCompareDate || ""}
                            >
                              <div className="freyDeltaTitle" data-frey-demo-flow="__FREY_DEMO_FLOW_POLISH_V0_1__">{ru ? "Δ Структурная разница" : "Δ Structural Difference"}</div>

                              <div className="freyDeltaGrid">
                                {deltaBlock.rows.map((row) => (
                                  <div key={row.label} className="freyDeltaRow">
                                    <div className="freyDeltaMetric">{freyText(formatMetricLabel(row.label), ru)}</div>
                                    <div className="freyDeltaValue">{freyText(row.arrow, ru)} {row.value}</div>
                                  </div>
                                ))}
                              </div>

                              <div className="freyDeltaRelation">
                                <div className="freyDeltaRelationTag">⌬ {ru ? "Режим связи" : "Relation mode"}</div>
                                <div className="freyDeltaRelationMode">{freyText(deltaBlock.mode, ru)}</div>
                                <div className="freyDeltaRelationText">{freyText(deltaBlock.description, ru)}</div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </details>

                  <details className="freyExpandBlock" data-frey-timeline="__FREY_TIMELINE_RESULT_ONLY_V0_1__" data-frey-expand-state={hasTimeline ? "active" : "empty"}>
                    <summary className="freyExpandSummary">↔ {ru ? "Ближайшие даты · Таймлайн" : "Nearby dates · Timeline"}</summary>
                    {hasTimeline ? (
                      <div className="freyTimelineBlock">
                        <div className="freyTimelineRow">
                          {initialTimelineResults.map((entry) => (
                            <div
                              key={entry.date}
                              className={`freyTimelineChip${entry.date === initialDate ? " isActive" : ""}`}
                            >
                              <div className="freyTimelineDate">{entry.date}</div>
                              <div className="freyTimelineVector">{freyText(entry.vector, ru)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="freyExpandEmpty" data-frey-timeline-state="pending">{ru ? "Здесь появится движение вокруг выбранной даты после расчёта соседних дат. Это карта ближайшего движения, а не гарантированный прогноз." : "Nearby date runs appear here as a local movement map around the selected date, not a guaranteed forecast."}</div>
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
        locale: initialLocale,
        url: typeof window !== "undefined" ? window.location.href : "",
                  primaryDate: primaryDateValue,
                  compareDate: compareDateValue,
                  primaryResult: result,
                  compareResult: compareResultValue,
                  freyVoice: minimalVoice,
        deltaBlock,
        timelineResults: initialTimelineResults,
      });
                const copyText = buildFreyExportText(exportPayload);
                const copyLabel = hasCompare ? (ru ? "Скопировать пакет сравнения для ИИ" : "Copy compare packet for AI") : (ru ? "Скопировать пакет для другого ИИ" : "Copy packet for another AI");
                const copyFeedbackLabel = exportCopied ? (ru ? "Скопировано" : "Copied") : copyLabel;
                const exportHelpText = hasCompare
                  ? (ru ? "Полноценный промт + обе даты + Δ структурного изменения. Вставьте пакет в сторонний ИИ и добавьте свой вопрос." : "A full prompt + both dates + structural Δ. Paste the packet into another AI and add your question.")
                  : (ru ? "Полноценный промт + данные Frey одной даты. Сторонний ИИ получает правила трактовки вместе с самим чтением." : "A full prompt + one-date Frey data. The receiving AI gets the interpretation rules together with the reading itself.");
                return (
                  <details className="freyExportBlock freyResultBlock" data-frey-export="__FREY_EXPORT_LAYER_V0_2__" data-frey-export-mode={hasCompare ? "compare" : "single"}>
                    <summary className="freyExportSummary">{ru ? "Для другого ИИ · Пакет чтения" : "For another AI · Reading Packet"}</summary>
                    <div className="freyExportInner">
                      <div className="freyExportTop">
                        <div className="freyExportMeta">
                          <div className="freyExportEyebrow" data-frey-export-help="__FREY_EXPORT_HELP_V0_2__">{ru ? "Промт + данные Frey" : "Prompt + Frey data"}</div>
                          <div className="freyExportHelp">{exportHelpText}</div>
                          <Link href={`/guide/frey?lang=${initialLocale}`} style={{ color: "rgba(231,191,126,.92)", fontSize: "12px", textDecoration: "none" }}>{ru ? "Как правильно читать Frey и AI-пакет →" : "How to read Frey and the AI packet →"}</Link>
                        </div>
                        <button
                          type="button"
                          className={`freyExportCopyButton${exportCopied ? " isCopied" : ""}`}
                          data-frey-copy-feedback={exportCopied ? "copied" : "idle"}
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.clipboard) navigator.clipboard.writeText(copyText);
                            setExportCopied(true);
                            if (typeof window !== "undefined") {
                              window.setTimeout(() => setExportCopied(false), 1400);
                            }
                          }}
                        >
                          {freyText(copyFeedbackLabel, ru)}
                        </button>
                      </div>
                      <pre className="freyExportPre">{copyText}</pre>
                      <div className="freyExportGuide">
                        {(ru ? [
                "Одна дата = состояние. Две даты = переход. Δ = структурное изменение, а не рейтинг лучше/хуже.",
                "Сначала читайте исходные метрики, затем Значение/Направление Frey как ограниченный слой интерпретации.",
                "Связывайте метрики между собой; не трактуйте одну цифру изолированно.",
                "Таймлайн показывает ближайшее движение вокруг выбранной даты, а не гарантированный прогноз.",
                "Не придумывайте отсутствующие данные, причинность, пророчество или автоматические жизненные инструкции.",
                "Всегда отделяйте наблюдение, интерпретацию, неопределённость и границу."
              ] : EXPORT_GUIDE_LINES).map((line) => (
                <div key={line} className="freyExportGuideLine">{line}</div>
              ))}
                      </div>
                    </div>
                  </details>
                );
              })()}

              {responseSurface.ui_state === "success" && (
                <PublicSupportRoute locale={initialLocale} surface="frey" />
              )}

              {initialAccessCtx && (
                <>
                <div
                  className="freyEscalationBlock"
                  data-frey-access-bridge="__FREY_ACCESS_BRIDGE_V0_1__"
                  data-frey-access-signal={initialAccessCtx.signal_class || ""}
                  data-frey-access-vector={initialAccessCtx.operational_vector || ""}
                >
                  <div className="freyEscalationLabel">{ru ? "Углубление" : "Escalation"}</div>
                  <div className="freyEscalationText">
                    {ru ? "Запросите глубокий анализ, когда текущему результату нужен операторский разбор." : "Request deep analysis when the current result needs operator review."}
                  </div>
                  <Link
                    href={`${initialAccessHref}${initialAccessHref.includes("?") ? "&" : "?"}lang=${initialLocale}`}
                    className="freyButton freyTemporalButton"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                  >
                    {ru ? "Запросить глубокий анализ" : "Request deep analysis"}
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
        }

        .freyExportTop {
          align-items: flex-start;
        }

        .freyExportMeta {
          display: grid;
          gap: 4px;
          min-width: 0;
        }

        .freyExportEyebrow {
          position: static;
          inset: auto;
          height: auto;
          background: none;
          filter: none;
          opacity: 1;
          pointer-events: auto;
          font-size: 10px;
          line-height: 1;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 244, 222, 0.68);
          justify-self: start;
        }

        .freyExportHelp {
          font-size: 12px;
          line-height: 1.45;
          color: rgba(255, 244, 222, 0.58);
          max-width: 420px;
        }

        .freyExportCopyButton:hover,
        .freyExportCopyButton:focus-visible {
          border-color: rgba(255, 244, 222, 0.34);
          background: rgba(255, 244, 222, 0.07);
          outline: none;
        }

        .freyExportCopyButton.isCopied {
          border-color: rgba(231, 202, 141, 0.46);
          background: rgba(231, 202, 141, 0.12);
          color: rgba(255, 244, 222, 0.98);
        }
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

        .freyConversationMetaCardEditable {
          display: grid;
          gap: 8px;
        }

        .freyConversationMetaTrigger {
          appearance: none;
          border: 0;
          background: transparent;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 8px;
          text-align: left;
          color: inherit;
          cursor: pointer;
        }

        .freyConversationMetaInline {
          display: grid;
          gap: 10px;
        }

        .freyConversationMetaInlineInput {
          min-height: 48px;
          padding: 0 12px;
        }

        .freyConversationMetaHint {
          font-size: 12px;
          line-height: 1.5;
          color: rgba(184, 192, 214, 0.72);
        }

        .freyConversationMetaActionRow {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .freyConversationMetaClose {
          min-height: 38px;
          border-radius: 12px;
          padding: 0 12px;
        }

        .freyConversationMetaApply {
          min-height: 38px;
          border-radius: 12px;
          padding: 0 14px;
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

        .freyGuideRoute {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          margin-bottom: 14px;
          padding: 16px 18px;
          border: 1px solid rgba(154, 137, 209, 0.28);
          border-radius: 18px;
          background: radial-gradient(circle at 100% 0%, rgba(154, 137, 209, 0.12), transparent 42%), linear-gradient(90deg, rgba(98, 168, 216, 0.055), rgba(154, 137, 209, 0.045));
        }
        .freyGuideRouteCopy { display: grid; gap: 6px; }
        .freyGuideRouteEyebrow { color: rgba(176, 160, 225, 0.92); font-size: 10px; font-weight: 750; letter-spacing: 0.16em; text-transform: uppercase; }
        .freyGuideRouteText { max-width: 560px; color: rgba(220, 226, 240, 0.82); font-size: 13px; line-height: 1.55; }
        :global(.freyGuideRouteLink) { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; padding: 0 14px; border: 1px solid rgba(98, 168, 216, 0.34); border-radius: 999px; color: rgba(161, 204, 232, 0.96) !important; background: rgba(98, 168, 216, 0.045); text-decoration: none !important; white-space: nowrap; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; }
        :global(.freyGuideRouteLink:hover), :global(.freyGuideRouteLink:focus-visible) { border-color: rgba(154, 137, 209, 0.58); background: rgba(154, 137, 209, 0.08); outline: none; }
        @media (max-width: 760px) { .freyGuideRoute { grid-template-columns: 1fr; gap: 12px; } :global(.freyGuideRouteLink) { width: fit-content; max-width: 100%; white-space: normal; text-align: center; } }

        .freyResultControls {
          display: grid;
          gap: 12px;
          padding-bottom: clamp(20px, 3vh, 28px);
        }


        /* __FREY_PUBLIC_BOUNDARY_VISUAL_LIFT_V0_1__ */
        .freyRootResult {
--frey-gold: #c8a45a;
--frey-blue: #62a8d8;
--frey-violet: #9a89d1;
background:
  radial-gradient(circle at 10% 8%, rgba(98, 168, 216, 0.075), transparent 28%),
  radial-gradient(circle at 90% 26%, rgba(154, 137, 209, 0.075), transparent 30%),
  linear-gradient(180deg, #060911 0%, #05070c 100%);
padding-top: clamp(34px, 5vh, 54px);
        }

        .freyMembrane.isResult {
width: min(100%, 980px);
padding: clamp(22px, 3vw, 34px);
border-radius: 30px;
border-color: rgba(200, 164, 90, 0.22);
background:
  linear-gradient(90deg, rgba(98, 168, 216, 0.035), transparent 20%, transparent 78%, rgba(154, 137, 209, 0.04)),
  rgba(6, 9, 16, 0.93);
box-shadow: 0 30px 110px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.025);
        }

        .freyResultFlow {
gap: 20px;
margin-top: 0;
margin-bottom: 54px;
padding-bottom: 24px;
        }

        .freyConversationBlock {
position: relative;
overflow: hidden;
padding: clamp(22px, 3vw, 32px);
border: 1px solid rgba(154, 137, 209, 0.19);
border-radius: 24px;
background:
  radial-gradient(circle at 100% 0%, rgba(154, 137, 209, 0.085), transparent 32%),
  radial-gradient(circle at 0% 100%, rgba(98, 168, 216, 0.055), transparent 34%),
  rgba(12, 15, 25, 0.82);
box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
        }

        .freyConversationBlock::before {
content: "";
position: absolute;
inset: 0 0 auto;
height: 2px;
background: linear-gradient(90deg, var(--frey-blue), var(--frey-violet) 58%, var(--frey-gold));
opacity: 0.68;
        }

        .freyConversationHeader {
padding-bottom: 18px;
border-bottom: 1px solid rgba(255, 255, 255, 0.065);
        }

        .freyConversationEyebrow {
color: rgba(161, 204, 232, 0.82);
        }

        .freyConversationTitle {
font-size: clamp(28px, 3.2vw, 36px);
letter-spacing: -0.025em;
        }

        .freyResponseState {
display: inline-flex;
align-items: center;
min-height: 30px;
padding: 0 10px;
border: 1px solid rgba(200, 164, 90, 0.28);
border-radius: 999px;
background: rgba(200, 164, 90, 0.055);
color: rgba(232, 202, 137, 0.92);
        }

        .freyConversationLead {
max-width: 68ch;
font-size: 17px;
line-height: 1.72;
color: rgba(226, 232, 244, 0.86);
        }

        .freyConversationMetaBand {
padding: 16px;
border-color: rgba(121, 151, 210, 0.22);
background:
  linear-gradient(90deg, rgba(98, 168, 216, 0.05), rgba(154, 137, 209, 0.035)),
  rgba(7, 10, 19, 0.88);
        }

        .freyConversationMetaBandCellActive,
        .freyConversationMetaBandCellAnchor {
padding: 13px 14px;
border-radius: 16px;
border: 1px solid rgba(255, 255, 255, 0.055);
        }

        .freyConversationMetaBandCellActive {
background: rgba(98, 168, 216, 0.045);
border-color: rgba(98, 168, 216, 0.14);
        }

        .freyConversationMetaBandCellAnchor {
background: rgba(154, 137, 209, 0.04);
border-color: rgba(154, 137, 209, 0.14);
        }

        .freyConversationMetaBandSecondary {
margin-top: 4px;
        }

        .freyConversationBand {
border-radius: 16px;
border-color: rgba(200, 164, 90, 0.24);
background: linear-gradient(90deg, rgba(200, 164, 90, 0.09), rgba(154, 137, 209, 0.035));
padding: 12px 15px;
line-height: 1.52;
        }

        .freyConversationMetricRow {
gap: 12px;
        }

        .freyConversationMetric {
min-height: 94px;
padding: 15px 16px;
border-radius: 16px;
background: rgba(255, 255, 255, 0.018);
        }

        .freyConversationMetric:nth-child(1) { border-color: rgba(98, 168, 216, 0.22); }
        .freyConversationMetric:nth-child(2) { border-color: rgba(154, 137, 209, 0.24); }
        .freyConversationMetric:nth-child(3) { border-color: rgba(200, 164, 90, 0.22); }

        .freyConversationMetricLabel {
margin-bottom: 12px;
color: rgba(184, 192, 214, 0.62);
        }

        .freyConversationMetricValue {
font-size: 18px;
        }

        .freyVoiceMinimal {
margin: 8px 0 4px;
padding: clamp(26px, 3vw, 38px);
border-radius: 24px;
border-color: rgba(154, 137, 209, 0.26);
background:
  radial-gradient(circle at 50% 0%, rgba(200, 164, 90, 0.115), transparent 34%),
  radial-gradient(circle at 100% 100%, rgba(98, 168, 216, 0.065), transparent 34%),
  rgba(16, 18, 28, 0.86);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.035), 0 20px 54px rgba(0,0,0,0.17);
        }

        .freyVoiceMinimal::after {
content: "Φ";
position: absolute;
top: 12px;
right: 22px;
font: 400 88px/1 Georgia, serif;
color: rgba(98, 168, 216, 0.055);
pointer-events: none;
        }

        .freyVoiceMinimalState {
max-width: 20ch;
font-size: clamp(30px, 4vw, 44px);
letter-spacing: 0.01em;
        }

        .freyVoiceMinimalBridge {
max-width: 62ch;
font-size: 16px;
        }

        .freyVoiceMinimalBody {
gap: 14px;
padding-top: 4px;
        }

        .freyVoiceMinimalRow {
padding: 14px 0 16px;
        }

        .freyConversationResultTail {
gap: 14px;
padding-bottom: 18px;
        }

        .freyInlineExpandBlock {
border-radius: 18px;
border-color: rgba(121, 151, 210, 0.15);
background: rgba(255, 255, 255, 0.016);
        }

        .freyInlineExpandBlock[open] {
background: linear-gradient(180deg, rgba(98,168,216,0.025), rgba(154,137,209,0.018));
        }

        .freyInlineExpandSummary {
padding: 16px 18px;
color: rgba(226, 214, 188, 0.82);
        }

        .freyInterpretationZone {
grid-template-columns: 165px minmax(0, 1fr);
gap: 20px;
padding: 17px 0;
        }

        .freyInterpretationZoneLabel {
color: rgba(161, 177, 211, 0.62);
        }

        .freyInterpretationState {
font-size: 18px;
        }

        .freyInterpretationEffect {
color: rgba(198, 206, 225, 0.82);
        }

        .freyOperationalVector {
margin-top: 18px;
border-color: rgba(200, 164, 90, 0.3);
background: linear-gradient(90deg, rgba(200,164,90,0.115), rgba(154,137,209,0.04));
padding: 18px 20px;
        }

        .freyOperationalVectorMode {
font-size: 19px;
        }

        .freyJson {
max-height: 340px;
overflow: auto;
padding: 4px 18px 18px;
line-height: 1.58;
        }

        .freyResultControls {
position: relative;
margin-top: 30px;
padding: 30px 24px 24px;
border: 1px solid rgba(154, 137, 209, 0.22);
border-radius: 24px;
background:
  radial-gradient(circle at 100% 0%, rgba(154,137,209,0.085), transparent 32%),
  radial-gradient(circle at 0% 100%, rgba(98,168,216,0.055), transparent 36%),
  rgba(10, 13, 22, 0.72);
        }

        .freyResultControls::before {
content: "Φ";
position: absolute;
top: -21px;
left: 24px;
width: 42px;
height: 42px;
display: grid;
place-items: center;
border-radius: 50%;
border: 1px solid rgba(200,164,90,0.34);
background: #080b12;
color: rgba(200,164,90,0.9);
font: 400 24px/1 Georgia, serif;
box-shadow: 0 10px 28px rgba(0,0,0,0.3), 0 0 24px rgba(154,137,209,0.08);
pointer-events: none;
        }

        .freyResultControls::after {
content: "";
position: absolute;
top: 0;
left: 74px;
right: 24px;
height: 1px;
background: linear-gradient(90deg, rgba(98,168,216,0.42), rgba(154,137,209,0.35), rgba(200,164,90,0.18), transparent);
pointer-events: none;
        }

        .freyResultControlsLabel {
margin: 8px 0 0;
color: rgba(224, 214, 191, 0.8);
font-size: 11px;
        }

        .freyResultControlsHint {
margin: 0 0 8px;
max-width: 68ch;
font-size: 15px;
color: rgba(222, 190, 125, 0.92);
        }

        .freyGuideRoute {
margin-bottom: 4px;
padding: 18px 20px;
border-radius: 20px;
border-color: rgba(154, 137, 209, 0.36);
background:
  radial-gradient(circle at 100% 0%, rgba(154,137,209,0.15), transparent 38%),
  linear-gradient(90deg, rgba(98,168,216,0.07), rgba(154,137,209,0.055));
        }

        .freyExpandStack {
gap: 12px;
        }

        .freyExpandBlock {
border-radius: 18px;
border-color: rgba(255,255,255,0.09);
background: rgba(255,255,255,0.02);
        }

        .freyExpandBlock[data-frey-compare] { border-color: rgba(98, 168, 216, 0.25); }
        .freyExpandBlock[data-frey-timeline] { border-color: rgba(154, 137, 209, 0.25); }

        .freyExpandBlock[open] {
background: linear-gradient(180deg, rgba(98,168,216,0.035), rgba(154,137,209,0.025));
        }

        .freyExpandSummary {
padding: 17px 18px;
color: rgba(235, 226, 207, 0.86);
        }

        .freyCompareBlockSecondary {
padding: 2px 18px 18px;
        }

        .freyTimelineBlock {
margin: 0;
border: 0;
background: transparent;
padding: 2px 18px 18px;
        }

        .freyExportBlock {
margin: 0;
border-radius: 24px;
border-color: rgba(98, 168, 216, 0.24);
background:
  radial-gradient(circle at 100% 0%, rgba(98,168,216,0.09), transparent 34%),
  radial-gradient(circle at 0% 100%, rgba(154,137,209,0.065), transparent 38%),
  rgba(8, 11, 19, 0.76);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.025);
        }

        .freyExportSummary {
padding: 17px 18px;
font-size: 11px;
color: rgba(164, 205, 232, 0.9);
        }

        .freyExportInner {
gap: 14px;
padding: 0 18px 18px;
        }

        .freyExportCopyButton {
min-height: 40px;
padding: 0 14px;
border-radius: 999px;
border-color: rgba(98,168,216,0.32);
background: rgba(98,168,216,0.04);
        }

        .freyExportPre {
max-height: 330px;
overflow: auto;
border-radius: 14px;
background: rgba(3, 6, 12, 0.78);
        }

        .freyEscalationBlock {
padding: 20px 22px;
margin-bottom: 8px;
border-radius: 22px;
border-color: rgba(154,137,209,0.22);
background:
  radial-gradient(circle at 100% 0%, rgba(154,137,209,0.09), transparent 36%),
  linear-gradient(90deg, rgba(154,137,209,0.035), rgba(200,164,90,0.04));
        }

        :global([data-public-support-route="frey"]) {
margin-top: 4px !important;
padding: 30px !important;
border: 1px solid rgba(200,164,90,0.22) !important;
border-radius: 24px !important;
background:
  radial-gradient(circle at 100% 0%, rgba(200,164,90,0.085), transparent 36%),
  linear-gradient(90deg, rgba(98,168,216,0.025), rgba(154,137,209,0.025)) !important;
        }

        :global([data-public-support-route="frey"] .publicSupportCta) {
border-color: rgba(200,164,90,0.4) !important;
background: rgba(200,164,90,0.05) !important;
        }

        :global(nav[data-prevnext="FREY_NAV_SINGLE_V0_4"]) {
left: auto !important;
right: 22px !important;
bottom: 22px !important;
width: auto !important;
opacity: 0.78;
transition: opacity 160ms ease, transform 160ms ease;
transform: scale(0.94);
        }

        :global(nav[data-prevnext="FREY_NAV_SINGLE_V0_4"]:hover),
        :global(nav[data-prevnext="FREY_NAV_SINGLE_V0_4"]:focus-within) {
opacity: 1;
transform: scale(1);
        }

        :global(nav[data-prevnext="FREY_NAV_SINGLE_V0_4"] .pnInner) {
border-color: rgba(200,164,90,0.18) !important;
background: rgba(7,9,14,0.84) !important;
box-shadow: 0 12px 38px rgba(0,0,0,0.28);
        }

        @media (max-width: 760px) {
.freyRootResult {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding-top: 70px;
  padding-left: 14px;
  padding-right: 14px;
  overflow-x: clip;
}

.freyMembrane.isResult {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 16px;
  border-radius: 22px;
  overflow-x: clip;
}

.freyConversationBlock {
  padding: 18px;
  border-radius: 20px;
}

.freyConversationHeader {
  flex-direction: column;
  gap: 12px;
}

.freyResponseState {
  align-self: flex-start;
}

.freyConversationMetaBand {
  padding: 12px;
}

.freyConversationMetaBandCellActive,
.freyConversationMetaBandCellAnchor {
  padding: 12px;
}

.freyVoiceMinimal {
  min-width: 0;
  max-width: 100%;
  padding: 24px 18px;
}

.freyVoiceMinimal::after {
  right: 10px;
  font-size: 68px;
}

.freyVoiceMinimalState {
  max-width: 100%;
  font-size: clamp(25px, 8vw, 36px);
  overflow-wrap: anywhere;
  word-break: normal;
  hyphens: auto;
}

.freyInterpretationZone {
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 16px 0;
}

.freyResultControls {
  padding: 18px;
  border-radius: 20px;
}

.freyGuideRoute {
  padding: 16px;
}

.freyExportTop {
  flex-direction: column;
}

.freyExportCopyButton {
  width: fit-content;
}

:global([data-public-support-route="frey"]) {
  padding: 22px 20px !important;
  border-radius: 20px !important;
}

.freyResultFlow,
.freyVoiceMinimal,
.freyVoiceMinimalBody,
.freyVoiceMinimalRow,
.freyVoiceMinimalBridge,
.freyVoiceMinimalValue,
.freyInterpretationZone,
.freyResultControls,
.freyGuideRoute,
.freyResultControlsHint {
  min-width: 0;
  max-width: 100%;
}

.freyVoiceMinimalBridge,
.freyVoiceMinimalValue,
.freyResultControlsHint {
  overflow-wrap: anywhere;
  word-break: normal;
}

.freyResultControls {
  padding: 28px 16px 18px;
}

.freyResultControls::before {
  left: 16px;
  width: 38px;
  height: 38px;
  top: -19px;
  font-size: 22px;
}

.freyResultControls::after {
  left: 64px;
  right: 16px;
}

:global(nav[data-prevnext="FREY_NAV_SINGLE_V0_4"]) {
  position: static !important;
  left: auto !important;
  right: auto !important;
  bottom: auto !important;
  width: 100% !important;
  max-width: 100% !important;
  margin: 28px 0 20px !important;
  padding: 0 14px calc(12px + env(safe-area-inset-bottom)) !important;
  box-sizing: border-box !important;
  opacity: 0.94;
  transform: none;
  z-index: auto !important;
}
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
      /* __FREY_TRUE_UNIFIED_META_BAND_V0_1__ */
      .freyConversationMetaBand {
        margin-top: 8px;
        display: grid;
        gap: 8px;
        padding: 12px 14px 10px;
        border: 1px solid rgba(207, 168, 98, 0.14);
        border-radius: 22px;
        background:
          linear-gradient(180deg, rgba(11, 15, 29, 0.94) 0%, rgba(8, 12, 24, 0.9) 100%),
          rgba(255, 255, 255, 0.01);
      }
      .freyConversationMetaBandPrimary {
        display: grid;
        grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
        gap: 14px;
        align-items: start;
      }
      .freyConversationMetaBandSecondary {
        display: block;
        padding-top: 8px;
        border-top: 1px solid rgba(207, 168, 98, 0.12);
      }
      .freyConversationMetaBandCell {
        min-width: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
      }
      .freyConversationMetaBandCellEngine {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 10px;
      }
      .freyConversationMetaBandCellEngine .freyConversationMetaLabel {
        margin: 0;
        min-width: fit-content;
      }
      .freyConversationMetaBandCellEngine .freyConversationMetaValue {
        margin: 0;
        font-size: 14px;
        line-height: 1.45;
        color: rgba(224, 214, 192, 0.8);
      }
      .freyConversationMetaBand .freyConversationMetaTrigger {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        margin: 0;
        padding: 0;
        border: 0;
        background: transparent;
        text-align: left;
        color: inherit;
      }
      .freyConversationMetaBand .freyConversationMetaLabel {
        margin-bottom: 4px;
      }
      .freyConversationMetaBand .freyConversationMetaValue {
        margin-top: 0;
      }
      .freyConversationMetaBand .freyConversationMetaHint {
        margin-top: 0;
        font-size: 11px;
      }
      .freyConversationMetaBand .freyConversationMetaInline {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      @media (max-width: 980px) {
        .freyConversationMetaBandPrimary {
          grid-template-columns: minmax(0, 1fr);
          gap: 10px;
        }
        .freyConversationMetaBandSecondary {
          padding-top: 6px;
        }
      }

      `}</style>
    </div>
  );
}




