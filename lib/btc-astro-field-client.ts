export const BTC_ASTRO_FIELD_SCHEMA = "bhrigu_public_astro_field_v0_1" as const;
export const BTC_ASTRO_CANONICAL_ENGINE = "orion_native_swisseph_canonical_v0_1" as const;

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
    timestamp_utc: "2009-01-03T18:15:05Z",
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

export async function loadBtcAstroField(input: {
  timestampUtc?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  bodies?: string[] | null;
  phenomena?: BtcAstroPhenomenon[] | null;
  bitcoinEvent?: BtcAstroEventId | null;
  timeoutMs?: number;
}): Promise<BtcAstroFieldResult> {
  const anchor = input.bitcoinEvent ? BTC_ASTRO_EVENT_ANCHORS[input.bitcoinEvent] : null;
  const phenomena: BtcAstroPhenomenon[] = Array.from(
    new Set<BtcAstroPhenomenon>(input.phenomena?.length ? input.phenomena : ["positions", "aspects"]),
  );
  const request: BtcAstroFieldRequest = {
    bodies: normalizeBodies(input.bodies),
    phenomena,
  };
  if (anchor) {
    request.timestamp_utc = anchor.timestamp_utc;
  } else if (input.timestampUtc) {
    request.timestamp_utc = input.timestampUtc;
  } else if (input.startDate && input.endDate) {
    request.start_utc = `${input.startDate}T00:00:00Z`;
    request.end_utc = endOfUtcDate(input.endDate);
  } else {
    request.timestamp_utc = new Date().toISOString();
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 20_000);
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
    return { ok: true, packet: payload, anchor, requested_at_utc: new Date().toISOString() };
  } finally {
    clearTimeout(timer);
  }
}
