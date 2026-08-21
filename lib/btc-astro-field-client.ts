export const BTC_ASTRO_FIELD_SCHEMA = "bhrigu_public_astro_field_v0_1" as const;
export const BTC_ASTRO_CANONICAL_ENGINE = "orion_native_swisseph_canonical_v0_1" as const;
export const BTC_TEMPORAL_ORIGIN_UTC = "2009-01-03T18:15:05Z" as const;
export const BTC_TEMPORAL_ORIGIN_DATE = "2009-01-03" as const;
export const BTC_PROSPECTIVE_HORIZON_DATE = "2028-12-31" as const;
export const BTC_ASTRO_SERVICE_MAX_INTERVAL_DAYS = 370 as const;
export const BTC_ASTRO_CHUNK_DAYS = 369 as const;
export const BTC_ASTRO_MAX_RANGE_WINDOWS = 20 as const;
export const BTC_ASTRO_RANGE_CONCURRENCY = 5 as const;

export type BtcAstroPhenomenon = "positions" | "aspects" | "stations" | "ingresses" | "lunar_phases";
export type BtcAstroEventId = "genesis" | "halving_1" | "halving_2" | "halving_3" | "halving_4";

export type BtcAstroFieldRequest = {
  timestamp_utc?: string;
  start_utc?: string;
  end_utc?: string;
  bodies?: string[];
  phenomena: BtcAstroPhenomenon[];
};

export type BtcAstroAnchor = {
  id: BtcAstroEventId;
  label: string;
  height: number;
  timestamp_utc: string;
  source: string;
};

export const BTC_ASTRO_EVENT_ANCHORS: Record<BtcAstroEventId, BtcAstroAnchor> = {
  genesis: {
    id: "genesis",
    label: "Bitcoin Genesis block",
    height: 0,
    timestamp_utc: BTC_TEMPORAL_ORIGIN_UTC,
    source: "https://github.com/AiBhrigu/phi-cosmography-open/blob/bbaa339d9c4abd84151dbfd6259aee012e4055cc/docs/crypto-astro-service/btc-protocol-price-history/BTC_HALVING_EPOCH_ARCHIVE_v0_1.csv",
  },
  halving_1: {
    id: "halving_1",
    label: "Bitcoin first halving",
    height: 210000,
    timestamp_utc: "2012-11-28T15:24:38Z",
    source: "https://github.com/AiBhrigu/phi-cosmography-open/blob/bbaa339d9c4abd84151dbfd6259aee012e4055cc/docs/crypto-astro-service/btc-protocol-price-history/BTC_HALVING_EPOCH_ARCHIVE_v0_1.csv",
  },
  halving_2: {
    id: "halving_2",
    label: "Bitcoin second halving",
    height: 420000,
    timestamp_utc: "2016-07-09T16:46:13Z",
    source: "https://github.com/AiBhrigu/phi-cosmography-open/blob/bbaa339d9c4abd84151dbfd6259aee012e4055cc/docs/crypto-astro-service/btc-protocol-price-history/BTC_HALVING_EPOCH_ARCHIVE_v0_1.csv",
  },
  halving_3: {
    id: "halving_3",
    label: "Bitcoin third halving",
    height: 630000,
    timestamp_utc: "2020-05-11T19:23:43Z",
    source: "https://github.com/AiBhrigu/phi-cosmography-open/blob/bbaa339d9c4abd84151dbfd6259aee012e4055cc/docs/crypto-astro-service/btc-protocol-price-history/BTC_HALVING_EPOCH_ARCHIVE_v0_1.csv",
  },
  halving_4: {
    id: "halving_4",
    label: "Bitcoin fourth halving",
    height: 840000,
    timestamp_utc: "2024-04-20T00:09:27Z",
    source: "https://github.com/AiBhrigu/phi-cosmography-open/blob/bbaa339d9c4abd84151dbfd6259aee012e4055cc/docs/crypto-astro-service/btc-protocol-price-history/BTC_HALVING_EPOCH_ARCHIVE_v0_1.csv",
  },
};

export type BtcAstroFieldResult = {
  ok: true;
  packet: Record<string, unknown>;
  anchor: BtcAstroAnchor | null;
  requested_at_utc: string;
};

function endpoint(): string {
  if (process.env.VERCEL_ENV === "production") throw new Error("ASTRO_FIELD_PREVIEW_ONLY");
  const value = process.env.BHRIGU_ASTRO_FIELD_URL?.trim();
  if (!value) throw new Error("ASTRO_FIELD_ENDPOINT_UNAVAILABLE");
  return value;
}

function normalizeBodies(values: string[] | null | undefined): string[] | undefined {
  if (!values?.length) return undefined;
  const canonical = new Map([
    ["sun", "Sun"], ["moon", "Moon"], ["mercury", "Mercury"], ["venus", "Venus"], ["mars", "Mars"],
    ["jupiter", "Jupiter"], ["saturn", "Saturn"], ["uranus", "Uranus"], ["neptune", "Neptune"], ["pluto", "Pluto"],
  ]);
  return Array.from(new Set(values.map((value) => canonical.get(value.toLowerCase())).filter((value): value is string => Boolean(value))));
}

function endOfUtcDate(date: string): string {
  return `${date}T23:59:59Z`;
}

export type BtcAstroWindow = { startDate: string; endDate: string };

function utcDate(date: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("BTC_TEMPORAL_DATE_INVALID");
  const value = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(value.getTime())) throw new Error("BTC_TEMPORAL_DATE_INVALID");
  return value;
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function validateBtcTemporalRange(startDate: string, endDate: string): void {
  const start = utcDate(startDate);
  const end = utcDate(endDate);
  if (end < start) throw new Error("BTC_TEMPORAL_RANGE_REVERSED");
  if (startDate < BTC_TEMPORAL_ORIGIN_DATE) throw new Error("BTC_TEMPORAL_BEFORE_GENESIS");
  if (endDate > BTC_PROSPECTIVE_HORIZON_DATE) throw new Error("BTC_TEMPORAL_AFTER_V1_HORIZON");
}

export function buildBtcAstroWindows(startDate: string, endDate: string): BtcAstroWindow[] {
  validateBtcTemporalRange(startDate, endDate);
  const windows: BtcAstroWindow[] = [];
  const end = utcDate(endDate);
  let cursor = utcDate(startDate);
  while (cursor <= end) {
    const candidate = new Date(cursor.getTime() + (BTC_ASTRO_CHUNK_DAYS - 1) * 86_400_000);
    const windowEnd = candidate < end ? candidate : end;
    windows.push({ startDate: dateOnly(cursor), endDate: dateOnly(windowEnd) });
    cursor = new Date(windowEnd.getTime() + 86_400_000);
  }
  if (windows.length > BTC_ASTRO_MAX_RANGE_WINDOWS) throw new Error("BTC_TEMPORAL_RANGE_TOO_WIDE");
  return windows;
}

function temporalMode(startDate: string, endDate: string): string {
  const today = new Date().toISOString().slice(0, 10);
  if (endDate < today) return "HISTORICAL_RECONSTRUCTION";
  if (startDate > today) return "PROSPECTIVE";
  if (endDate > today) return "HISTORICAL_TO_PROSPECTIVE";
  return "HISTORICAL_TO_NOW";
}

function sampled<T>(rows: T[], max: number): T[] {
  if (rows.length <= max) return rows;
  if (max <= 1) return [rows[0]];
  const out: T[] = [];
  for (let i = 0; i < max; i += 1) out.push(rows[Math.round(i * (rows.length - 1) / (max - 1))]);
  return out;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function postAstroField(request: BtcAstroFieldRequest, timeoutMs: number): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint(), {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(request),
      cache: "no-store",
      signal: controller.signal,
    });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok || payload.ok !== true || payload.schema_version !== BTC_ASTRO_FIELD_SCHEMA) {
      throw new Error(`ASTRO_FIELD_HTTP_${response.status}`);
    }
    const provenance = payload.provenance && typeof payload.provenance === "object" ? payload.provenance as Record<string, unknown> : null;
    if (provenance?.engine_id !== BTC_ASTRO_CANONICAL_ENGINE || provenance.public_safe_output_only !== true) {
      throw new Error("ASTRO_FIELD_CANONICAL_PROVENANCE_INVALID");
    }
    return payload;
  } finally {
    clearTimeout(timer);
  }
}

function aggregateAstroPackets(
  packets: Record<string, unknown>[],
  windows: BtcAstroWindow[],
  request: BtcAstroFieldRequest,
  startDate: string,
  endDate: string,
): Record<string, unknown> {
  const keys = ["aspect_events", "stations", "ingresses", "lunar_phases"] as const;
  const limits: Record<(typeof keys)[number], number> = { aspect_events: 120, stations: 80, ingresses: 100, lunar_phases: 60 };
  const merged: Record<string, unknown> = {};
  const counts: Record<string, number> = {};
  for (const key of keys) {
    const rows = packets.flatMap((packet) => Array.isArray(packet[key]) ? packet[key] as unknown[] : []);
    counts[key] = rows.length;
    merged[key] = sampled(rows, limits[key]);
  }
  const windowSummaries = packets.map((packet, index) => ({
    start_utc: `${windows[index].startDate}T00:00:00Z`,
    end_utc: endOfUtcDate(windows[index].endDate),
    event_counts: Object.fromEntries(keys.map((key) => [key, Array.isArray(packet[key]) ? (packet[key] as unknown[]).length : 0])),
  }));
  return {
    ok: true,
    schema_version: BTC_ASTRO_FIELD_SCHEMA,
    mode: "interval_series",
    request: { ...request, start_utc: `${startDate}T00:00:00Z`, end_utc: endOfUtcDate(endDate) },
    temporal_scope: {
      bitcoin_origin_utc: BTC_TEMPORAL_ORIGIN_UTC,
      prospective_horizon_utc: `${BTC_PROSPECTIVE_HORIZON_DATE}T23:59:59Z`,
      mode: temporalMode(startDate, endDate),
      window_count: windows.length,
      service_window_max_days: BTC_ASTRO_SERVICE_MAX_INTERVAL_DAYS,
      orchestration_window_days: BTC_ASTRO_CHUNK_DAYS,
      event_counts_total: counts,
      compacted_for_model_cost: true,
      future_market_outcomes_established: false,
    },
    start_snapshot: packets[0]?.start_snapshot ?? packets[0]?.snapshot,
    end_snapshot: packets.at(-1)?.end_snapshot ?? packets.at(-1)?.snapshot,
    window_summaries: windowSummaries,
    ...merged,
    provenance: packets[0]?.provenance,
    boundaries: {
      ...(packets[0]?.boundaries && typeof packets[0].boundaries === "object" ? packets[0].boundaries as Record<string, unknown> : {}),
      long_range_orchestration: true,
      representative_event_sampling: true,
      historical_reconstruction_not_point_in_time_bhrigu_memory: true,
      future_not_established_fact: true,
    },
  };
}

export async function loadBtcAstroField(input: {
  timestampUtc?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  bodies?: string[] | null;
  phenomena?: BtcAstroPhenomenon[] | null;
  bitcoinEvent?: BtcAstroEventId | null;
  timeoutMs?: number;
}): Promise<BtcAstroFieldResult> {
  const explicitAnchor = input.bitcoinEvent ? BTC_ASTRO_EVENT_ANCHORS[input.bitcoinEvent] : null;
  const rangeAnchor = input.startDate === BTC_TEMPORAL_ORIGIN_DATE ? BTC_ASTRO_EVENT_ANCHORS.genesis : null;
  const anchor = explicitAnchor ?? rangeAnchor;
  const phenomena: BtcAstroPhenomenon[] = Array.from(
    new Set<BtcAstroPhenomenon>(input.phenomena?.length ? input.phenomena : ["positions", "aspects"]),
  );
  const baseRequest: BtcAstroFieldRequest = { bodies: normalizeBodies(input.bodies), phenomena };
  const timeoutMs = input.timeoutMs ?? 20_000;

  if (input.startDate && input.endDate) {
    const windows = buildBtcAstroWindows(input.startDate, input.endDate);
    const packets = await mapWithConcurrency(windows, BTC_ASTRO_RANGE_CONCURRENCY, (window) => postAstroField({
      ...baseRequest,
      start_utc: `${window.startDate}T00:00:00Z`,
      end_utc: endOfUtcDate(window.endDate),
    }, timeoutMs));
    const packet = windows.length === 1 ? packets[0] : aggregateAstroPackets(packets, windows, baseRequest, input.startDate, input.endDate);
    return { ok: true, packet, anchor, requested_at_utc: new Date().toISOString() };
  }

  const request: BtcAstroFieldRequest = { ...baseRequest };
  if (explicitAnchor) request.timestamp_utc = explicitAnchor.timestamp_utc;
  else if (input.timestampUtc) request.timestamp_utc = input.timestampUtc;
  else request.timestamp_utc = new Date().toISOString();
  const packet = await postAstroField(request, timeoutMs);
  return { ok: true, packet, anchor, requested_at_utc: new Date().toISOString() };
}
