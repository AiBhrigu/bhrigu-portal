export const MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_ID =
  "MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_v0_1" as const;

export const MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256 =
  "4034ba35df2d738e7f2cbe1d266fd9a2188aa3972ab629b9cd49f4f05258eb04" as const;

export const BTC_EXISTING_PRIMARY_ROUTE_PATH =
  "M120 100 C320 25 570 45 835 125 C930 155 885 285 760 300 C575 325 450 215 260 290 C120 345 230 475 555 480 C680 482 730 455 790 420" as const;

export const BTC_EXISTING_SUPPORT_ROUTE_PATH =
  "M145 125 C300 225 430 90 585 180 C700 245 635 360 770 410" as const;

export const BTC_EXISTING_GLYPH_CLASSES = [
  "FIELD_ANCHOR",
  "PRIMARY_ROUTE",
  "SUPPORT_ROUTE",
  "CONFIRMATION_FLOW",
  "DIVERGENCE_SPLIT",
  "MEMORY_TRANSITION",
  "TEMPORAL_INTERVAL",
  "INSUFFICIENT_EVIDENCE",
  "SEALED_BOUNDARY",
  "REVIEW_CLOSURE",
] as const;

export type BtcExistingGlyphClass = (typeof BTC_EXISTING_GLYPH_CLASSES)[number];

export const BTC_EXISTING_GLYPH_BINDING = {
  field_anchor: "FIELD_ANCHOR",
  primary_route: "PRIMARY_ROUTE",
  support_route: "SUPPORT_ROUTE",
  confirmation_flow: "CONFIRMATION_FLOW",
  divergence_split: "DIVERGENCE_SPLIT",
  memory_transition: "MEMORY_TRANSITION",
  temporal_interval: "TEMPORAL_INTERVAL",
  insufficient_evidence: "INSUFFICIENT_EVIDENCE",
  sealed_boundary: "SEALED_BOUNDARY",
  review_closure: "REVIEW_CLOSURE",
  watch_point: null,
  source_verified: null,
} as const;

export const BTC_GLYPH_BINDING_BOUNDARY = {
  existing_glyphs_only: true,
  new_glyph_family: false,
  external_icon_pack: false,
  random_symbols: false,
  decorative_repetition: false,
  watch_point_text_only: true,
  source_proof_quiet_only: true,
} as const;
