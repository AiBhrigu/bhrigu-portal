const BRIDGE_VERSION = "FREY_ACCESS_BRIDGE_V0_1";

function base64UrlEncode(input) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf8").toString("base64url");
  }
  if (typeof btoa !== "undefined") {
    return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  throw new Error("FREY_ACCESS_BRIDGE_ENCODE_UNAVAILABLE");
}

function base64UrlDecode(input) {
  if (!input || typeof input !== "string") return "";
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "base64url").toString("utf8");
  }
  if (typeof atob !== "undefined") {
    const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    return atob(padded);
  }
  throw new Error("FREY_ACCESS_BRIDGE_DECODE_UNAVAILABLE");
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function buildFreyAccessCtxPacket(input) {
  const packet = {
    version: BRIDGE_VERSION,
    primary_date: normalizeString(input?.primary_date),
    secondary_date: normalizeString(input?.secondary_date),
    signal_class: normalizeString(input?.signal_class),
    structural_state: normalizeString(input?.structural_state),
    operational_vector: normalizeString(input?.operational_vector),
    delta_mode: normalizeString(input?.delta_mode),
    timeline_mode: normalizeString(input?.timeline_mode),
  };

  const hasContext = Boolean(
    packet.primary_date ||
      packet.secondary_date ||
      packet.signal_class ||
      packet.structural_state ||
      packet.operational_vector ||
      packet.delta_mode ||
      packet.timeline_mode
  );

  return hasContext ? packet : null;
}

export function encodeFreyAccessBridgeCtx(packet) {
  if (!packet) return "";
  return base64UrlEncode(JSON.stringify(packet));
}

export function decodeFreyAccessBridgeCtx(encoded) {
  const raw = normalizeString(encoded);
  if (!raw) return null;

  try {
    const decoded = JSON.parse(base64UrlDecode(raw));
    if (!decoded || typeof decoded !== "object") return null;

    return buildFreyAccessCtxPacket({
      primary_date: decoded.primary_date,
      secondary_date: decoded.secondary_date,
      signal_class: decoded.signal_class,
      structural_state: decoded.structural_state,
      operational_vector: decoded.operational_vector,
      delta_mode: decoded.delta_mode,
      timeline_mode: decoded.timeline_mode,
    });
  } catch (_error) {
    return null;
  }
}

export function buildFreyAccessHref(packet) {
  const encoded = encodeFreyAccessBridgeCtx(packet);
  return encoded ? `/access?ctx=${encodeURIComponent(encoded)}` : "/access";
}

export function buildFreyAccessBridgePrefill(packet) {
  if (!packet) return null;

  let mainQuestion = "Deep analysis request from Frey signal context";
  if (packet.delta_mode) {
    mainQuestion = "Deep analysis of temporal delta and structural shift";
  } else if (packet.timeline_mode === "active") {
    mainQuestion = "Deep analysis of temporal signal progression";
  } else if (packet.signal_class === "decision_pressure") {
    mainQuestion = "Deep analysis for a pressured decision window";
  }

  const lines = [
    "Transferred from Frey deterministic context.",
    packet.primary_date ? `Primary date: ${packet.primary_date}` : "",
    packet.secondary_date ? `Secondary date: ${packet.secondary_date}` : "",
    packet.signal_class ? `Signal class: ${packet.signal_class}` : "",
    packet.structural_state ? `Structural state: ${packet.structural_state}` : "",
    packet.operational_vector ? `Operational vector: ${packet.operational_vector}` : "",
    packet.delta_mode ? `Delta mode: ${packet.delta_mode}` : "",
    packet.timeline_mode ? `Timeline mode: ${packet.timeline_mode}` : "",
  ].filter(Boolean);

  return {
    subjectType: packet.secondary_date ? "Mixed / Not sure" : "Event / Period",
    mainQuestion,
    shortDescription: lines.join("\n"),
    preferredDepth: "Deep Phase Analysis",
  };
}
