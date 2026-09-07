import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { buildBhriguBinanceAgentOsTrackARecord, type BhriguTrackARecord } from "../../lib/btc-binance-agent-os-track-a";

type Props = { record: BhriguTrackARecord | null; error: string | null };

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const record = await buildBhriguBinanceAgentOsTrackARecord({ source: "auto" });
    return { props: { record, error: null } };
  } catch (error) {
    return { props: { record: null, error: error instanceof Error ? error.message : "UNAVAILABLE" } };
  }
};

const C = {
  field: "#05070C", gold: "#D2A45F", goldHigh: "#E7BF7E",
  blue: "#6AA8FF", violet: "#8F7CF4", ivory: "#F4F0E8",
  muted: "#9CA4B5", line: "rgba(255,255,255,.12)", panel: "rgba(255,255,255,.035)",
};

function Metric({ label, value, accent = C.ivory }: { label: string; value: string; accent?: string }) {
  return <div style={{ padding: "18px 0", borderTop: `1px solid ${C.line}` }}>
    <div style={{ fontSize: 11, letterSpacing: ".15em", color: C.muted, marginBottom: 7 }}>{label}</div>
    <div style={{ fontSize: 22, color: accent, fontWeight: 600 }}>{value}</div>
  </div>;
}

function Card({ eyebrow, title, children, accent }: { eyebrow: string; title: string; children: React.ReactNode; accent: string }) {
  return <section style={{ border: `1px solid ${C.line}`, background: C.panel, borderRadius: 18, padding: 24, minHeight: 260 }}>
    <div style={{ fontSize: 11, letterSpacing: ".16em", color: accent, marginBottom: 12 }}>{eyebrow}</div>
    <h2 style={{ margin: 0, fontSize: 25, lineHeight: 1.15, color: C.ivory, fontWeight: 600 }}>{title}</h2>
    <div style={{ marginTop: 22 }}>{children}</div>
  </section>;
}

export default function TrackADemo({ record, error }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const price = record?.market_time.last_price_usdt ?? "—";
  const change = record?.market_time.price_change_percent_24h ?? "—";
  const source = record?.source_path ?? "unavailable";
  return <>
    <Head><title>BHRIGU · Bitcoin Research Agent · Track A</title></Head>
    <main style={{ minHeight: "100vh", background: C.field, color: C.ivory, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", padding: "46px 34px 54px" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start", borderBottom: `1px solid ${C.line}`, paddingBottom: 26 }}>
          <div>
            <div style={{ color: C.gold, fontSize: 12, letterSpacing: ".18em", marginBottom: 12 }}>BHRIGU · BITCOIN COSMOGRAPHER</div>
            <h1 style={{ fontSize: "clamp(34px,5vw,66px)", lineHeight: .98, letterSpacing: "-.045em", margin: 0, maxWidth: 790 }}>Bitcoin Research Agent</h1>
            <p style={{ color: C.muted, fontSize: 17, margin: "18px 0 0", maxWidth: 720 }}>Binance Agent OS Track A · read-only research intelligence, not a trading bot.</p>
          </div>
          <div style={{ border: `1px solid ${C.gold}`, color: C.goldHigh, borderRadius: 999, padding: "9px 13px", fontSize: 11, letterSpacing: ".12em", whiteSpace: "nowrap" }}>LIVE DEMO</div>
        </header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 18, marginTop: 24 }}>
          <Card eyebrow="MARKET TIME" title="Binance Spot · BTCUSDT" accent={C.blue}>
            <Metric label="LAST PRICE" value={`${price} USDT`} accent={C.blue} />
            <Metric label="24H CHANGE" value={change === "—" ? change : `${change}%`} />
            <Metric label="SOURCE / FRESHNESS" value={`${source} · ${record?.market_time.freshness_state ?? "UNAVAILABLE"}`} />
          </Card>
          <Card eyebrow="PROTOCOL TIME" title="Bitcoin Halving Epoch 4" accent={C.gold}>
            <Metric label="EPOCH" value="840,000 → 1,049,999" accent={C.goldHigh} />
            <Metric label="BLOCK SUBSIDY" value="3.125 BTC" />
            <Metric label="ROLE" value="Protocol-time coordinate · not a forecast" />
          </Card>
          <Card eyebrow="PRECOMMITTED WINDOW" title="SEP 10 · 2026" accent={C.violet}>
            <Metric label="ROLE" value="Observation boundary" accent={C.violet} />
            <Metric label="PRICE TARGET" value="NO" />
            <Metric label="RETROACTIVE REWRITE" value="FORBIDDEN" />
          </Card>
          <Card eyebrow="RESEARCH MEMORY" title="FIELD → WINDOW → REALITY → MEMORY" accent={C.blue}>
            <Metric label="CONFIRMATION" value="Compare the precommitted record with observed reality" />
            <Metric label="INVALIDATION" value="If evidence is stale, make no live conclusion" />
          </Card>
        </div>
        {error && <div style={{ marginTop: 18, border: "1px solid rgba(255,120,120,.4)", borderRadius: 14, padding: 16, color: "#FFB5B5" }}>Live market evidence unavailable: {error}</div>}
        <section style={{ marginTop: 24, border: `1px solid ${C.gold}`, borderRadius: 18, padding: "23px 25px", display: "flex", justifyContent: "space-between", gap: 24, alignItems: "center" }}>
          <div>
            <div style={{ color: C.gold, fontSize: 11, letterSpacing: ".16em", marginBottom: 7 }}>AUTHORITY BOUNDARY</div>
            <div style={{ fontSize: 25, fontWeight: 650 }}>RESEARCH_STATE_NOT_TRADE</div>
          </div>
          <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, textAlign: "right" }}>
            TRADING = FALSE<br />WALLET ACCESS = FALSE<br />PRIVATE ACCOUNT DATA = FALSE
          </div>
        </section>
        <footer style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.line}`, color: C.muted, fontSize: 12, display: "flex", justifyContent: "space-between", gap: 20 }}>
          <span>Expose Meaning · Protect Mechanism</span>
          <span>Observed {record?.market_time.observed_at ?? "unavailable"}</span>
        </footer>
      </div>
    </main>
    <style jsx global>{`nav[aria-label="Portal navigation"] { display: none !important; }`}</style>
  </>;
}
