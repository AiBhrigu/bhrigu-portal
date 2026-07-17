import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { BTC_SOURCE_URLS, loadBtcStaticSource } from "../../lib/btc-public-static-source";
import { composeBtcPublicSnapshot } from "../../lib/btc-public-snapshot-composer";
import type { BtcPublicSnapshot, BtcFailureCode } from "../../lib/btc-public-output-contract";

type FailureProps = { code: BtcFailureCode; message: string; last_verified_at_utc?: string };
type PageProps = { result: BtcPublicSnapshot | null; failure: FailureProps | null; initialQuestion: string; initialDate: string };

function first(value: string | string[] | undefined): string { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }

export const getServerSideProps: GetServerSideProps<PageProps> = async ({ query }) => {
  const initialQuestion = first(query.q);
  const initialDate = first(query.d);
  if (!initialQuestion) return { props: { result: null, failure: null, initialQuestion: "", initialDate } };

  const source = await loadBtcStaticSource();
  if (source.ok === false) return { props: { result: null, failure: { code: source.code, message: source.message, last_verified_at_utc: source.last_verified_at_utc ?? null }, initialQuestion, initialDate } };
  const composed = await composeBtcPublicSnapshot(source, { question: initialQuestion, date: initialDate || undefined });
  if (composed.ok === false) return { props: { result: null, failure: { code: composed.code, message: composed.message }, initialQuestion, initialDate } };
  return { props: { result: composed.value, failure: null, initialQuestion, initialDate } };
};

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value >= 1000 ? 0 : 2 }).format(value);
const pct = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
const freshnessLabel = (value: BtcPublicSnapshot["market_snapshot"]["freshness"]) => value === "FRESH" ? "Verified recent snapshot" : "Verified static snapshot · limited freshness";
const sourceLabel = (value: string) => value.split("_").map((part) => part.length <= 3 ? part.toUpperCase() : `${part[0].toUpperCase()}${part.slice(1)}`).join(" ");

function momentumRead(result: BtcPublicSnapshot): string {
  const changes = [result.market_snapshot.change_24h_pct, result.market_snapshot.change_7d_pct, result.market_snapshot.change_30d_pct];
  if (changes.every((value) => value > 0)) return "Price direction is aligned across the published 24-hour, 7-day, and 30-day horizons.";
  if (changes.every((value) => value < 0)) return "Downward pressure is aligned across the published 24-hour, 7-day, and 30-day horizons.";
  return "The published horizons are mixed, so the BTC field is not moving as one uniform momentum block.";
}

function gravityRead(result: BtcPublicSnapshot): string {
  if (result.btc_gravity.dominance_band === "high") return "BTC is the dominant gravity center in the current public market field.";
  if (result.btc_gravity.dominance_band === "lower") return "BTC gravity is lower relative to the broader public market field, so relative participation outside BTC carries more structural weight.";
  return "BTC leadership and broader market participation are in a balanced gravity relationship.";
}

function numericPressure(result: BtcPublicSnapshot): string {
  return result.aspect_pressure.harmonic_tension === null
    ? "No numeric aspect value is published."
    : `Harmonic tension ${result.aspect_pressure.harmonic_tension.toFixed(4)}.`;
}

export default function BtcSnapshotPage({ result, failure, initialQuestion, initialDate }: PageProps) {
  return <>
    <Head>
      <title>BTC Field Read</title>
      <meta name="description" content="One coherent, source-bound Cosmographer read of the current BTC market and bounded temporal field." />
    </Head>
    <main className="page">
      <section className="hero module">
        <p className="eyebrow">Crypto-Astro · first live corridor</p>
        <h1>BTC Field Read</h1>
        <p className="lead">Ask one BTC question. This source-bound corridor combines reviewed market facts, approved bounded temporal context, source proof, and Cosmographer navigation into one coherent read.</p>
      </section>

      <section className="module" aria-labelledby="btc-question-title">
        <h2 id="btc-question-title">Ask one BTC field question</h2>
        <form method="get" action="/crypto-astro/btc" className="form">
          <label>Question
            <textarea name="q" minLength={8} maxLength={280} required defaultValue={initialQuestion} placeholder="What changed in the BTC field, why does it matter, and what conditions should I watch?" />
          </label>
          <label>Optional temporal observation date (UTC)
            <input name="d" type="date" defaultValue={initialDate} />
          </label>
          <button type="submit">Run BTC Field Read</button>
        </form>
        <p className="privacy">The selected date controls the bounded temporal lane only. Market facts remain tied to the visible source snapshot timestamp. Do not include wallet addresses, account details, private keys, or identifying information.</p>
      </section>

      {failure && <section className="module failure" role="alert">
        <p className="eyebrow">Source-bound failure</p>
        <h2>BTC Field Read unavailable</h2>
        <p>{failure.message}</p>
        <p className="muted">Reason category: {failure.code}</p>
        {failure.last_verified_at_utc && <p className="muted">Last verified timestamp: {failure.last_verified_at_utc}</p>}
        <a href="https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/index.html" target="_blank" rel="noopener noreferrer">Open the public proof route</a>
      </section>}

      {result && <>
        <section className="module result" aria-labelledby="result-title">
          <div className="resultHead"><div><p className="eyebrow">{result.asset.symbol} · {freshnessLabel(result.market_snapshot.freshness)}</p><h2 id="result-title">One coherent Cosmographer read</h2></div><span>{result.request_id}</span></div>
          <div className="snapshotSummary" aria-label="Verified snapshot summary">
            <div><span>Snapshot</span><strong>{result.market_snapshot.source_generated_at_utc.slice(0, 10)}</strong></div>
            <div><span>Evidence</span><strong>{result.source_proof.sources.length} reviewed sources</strong></div>
            <div><span>Regime</span><strong>{result.market_structure.regime_label}</strong></div>
            <div><span>Freshness</span><strong>{freshnessLabel(result.market_snapshot.freshness)}</strong></div>
          </div>
          {result.question.safe_reframed && <p className="reframe">Direct trading guidance was removed. The question was converted to observable BTC field context.</p>}
          <p className="question"><strong>Question lens:</strong> {result.question.lens}<br />{result.question.normalized}</p>

          <div className="readFlow">
            <section className="readSection" aria-labelledby="what-changed-title"><span className="step">01</span><div><h3 id="what-changed-title">WHAT CHANGED</h3><div className="factBlock"><span>FACTS</span><p>BTC is {money(result.market_snapshot.price_usd)}. Published change: 24h {pct(result.market_snapshot.change_24h_pct)}, 7d {pct(result.market_snapshot.change_7d_pct)}, 30d {pct(result.market_snapshot.change_30d_pct)}. Total market-cap change over 24h is {pct(result.market_snapshot.market_cap_change_24h_pct)}.</p></div><div className="readBlock"><span>COSMOGRAPHER READ</span><p>{momentumRead(result)}</p></div></div></section>
            <section className="readSection" aria-labelledby="why-matters-title"><span className="step">02</span><div><h3 id="why-matters-title">WHY IT MATTERS</h3><div className="factBlock"><span>FACTS</span><p>BTC dominance is {result.btc_gravity.dominance_pct.toFixed(2)}% in the {result.btc_gravity.dominance_band} band, with market rank #{result.btc_gravity.market_cap_rank}. Published context: {result.btc_gravity.market_context_label}.</p></div><div className="readBlock"><span>COSMOGRAPHER READ</span><p>{gravityRead(result)} This frames how strongly the wider field should be read through BTC leadership rather than through isolated asset moves.</p></div></div></section>
            <section className="readSection" aria-labelledby="current-structure-title"><span className="step">03</span><div><h3 id="current-structure-title">CURRENT STRUCTURE</h3><div className="factBlock"><span>FACTS</span><p>Regime: {result.market_structure.regime_label}. Field score: {result.market_structure.field_score.toFixed(1)}. Direction bias: {result.market_structure.direction_bias}. Liquidity state: {result.market_structure.liquidity_state}.</p></div><div className="readBlock"><span>COSMOGRAPHER READ</span><p>The current structure is defined by the published regime and direction bias, while liquidity determines how broadly that structure can be expressed across the market.</p></div></div></section>
            <section className="readSection" aria-labelledby="dominant-pressures-title"><span className="step">04</span><div><h3 id="dominant-pressures-title">DOMINANT PRESSURES</h3><div className="factBlock"><span>FACTS</span><p>Bounded pressure: {result.aspect_pressure.label}. Temporal state: {result.aspect_pressure.state}. {numericPressure(result)} Stablecoin share is {result.market_structure.stablecoin_share_pct.toFixed(2)}%.</p></div><div className="readBlock"><span>COSMOGRAPHER READ</span><p>The dominant pressure is the interaction of BTC gravity, liquidity conditions, stablecoin positioning, and the bounded temporal state. None of these elements is converted into a buy, sell, entry, or exit instruction.</p></div></div></section>
            <section className="readSection" aria-labelledby="relative-field-title"><span className="step">05</span><div><h3 id="relative-field-title">RELATIVE MARKET FIELD</h3><div className="factBlock"><span>FACTS</span><p>BTC dominance is {result.btc_gravity.dominance_pct.toFixed(2)}%, alt breadth is {result.market_structure.alt_breadth_24h_pct.toFixed(1)}% across the stated universe, and stablecoin share is {result.market_structure.stablecoin_share_pct.toFixed(2)}%.</p></div><div className="readBlock"><span>COSMOGRAPHER READ</span><p>Read BTC dominance and alt breadth together: dominance shows where market gravity is concentrated, while breadth shows how widely participation is distributed around that center.</p></div></div></section>
            <section className="readSection" aria-labelledby="temporal-context-title"><span className="step">06</span><div><h3 id="temporal-context-title">TEMPORAL CONTEXT</h3><div className="factBlock"><span>FACTS</span><p>Temporal state: {result.temporal_context.state}. Selected temporal date: {result.temporal_context.observation_date}. Market source snapshot: {result.market_snapshot.source_generated_at_utc}.</p></div><div className="readBlock"><span>COSMOGRAPHER READ</span><p>{result.temporal_context.limitation}</p></div></div></section>
          </div>

          <div className="watch"><h3>WATCH CONDITIONS</h3><ol>{result.watch_conditions.map((item) => <li key={item}>{item}</li>)}</ol></div>
          <div className="uncertainty"><h3>UNCERTAINTY</h3><p>{result.uncertainty.freshness}</p><p>{result.uncertainty.question_limit}</p><p>{result.uncertainty.temporal_limit}</p><p>{result.uncertainty.source_limit}</p><p className="timestamps"><strong>Report generated:</strong> {result.generated_at_utc}<br /><strong>Market snapshot timestamp:</strong> {result.market_snapshot.source_generated_at_utc}<br /><strong>Temporal observation date:</strong> {result.temporal_context.observation_date}</p></div>
          <div className="boundaryBlock"><h3>BOUNDARY</h3><p>Read only · static public snapshot · no live adapter claim · no trading signal · no forecast · no price target · no investment recommendation · ORION core protected.</p></div>
          <Link className="access" href={result.deeper_access_route}>Request deeper operator-reviewed access</Link>
        </section>

        <details className="module proof">
          <summary>SOURCE PROOF · {result.source_proof.sources.length} reviewed sources</summary>
          <p>CoinGecko data attribution is preserved through the source URLs below. DeFiLlama sources provide public liquidity context.</p>
          <p><a href={BTC_SOURCE_URLS.snapshot}>Canonical snapshot JSON</a> · <a href={BTC_SOURCE_URLS.proof}>Proof JSON</a> · <a href={BTC_SOURCE_URLS.marketField}>Market-field JSON</a></p>
          <div className="proofGrid">{result.source_proof.sources.map((source) => <article key={source.label}><strong>{sourceLabel(source.label)}</strong><span>{source.status} · {source.fetched_at_utc}</span><a href={source.url} target="_blank" rel="noopener noreferrer">Source URL</a><details className="hash"><summary>Proof hash</summary><code>{source.sha256}</code></details></article>)}</div>
        </details>
      </>}
    </main>
    <style jsx>{`
      :global(*){box-sizing:border-box} :global(html,body){margin:0;background:#050a12;color:#e7edf5;font-family:Inter,ui-sans-serif,system-ui,sans-serif;overflow-x:hidden} :global(a){color:#9fc4ff}
      .page{width:min(980px,100%);margin:0 auto;padding:24px 16px 64px;display:grid;gap:18px}.module{min-width:0;border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:clamp(18px,3vw,30px);background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025));box-shadow:0 20px 70px rgba(0,0,0,.22)}
      .hero{background:radial-gradient(circle at 15% 0,rgba(247,212,125,.13),transparent 38%),radial-gradient(circle at 90% 10%,rgba(115,163,255,.12),transparent 38%),rgba(255,255,255,.025)}.eyebrow{margin:0;color:#f1c96b;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}h1{margin:12px 0 0;font-size:clamp(36px,7vw,72px);line-height:.98;letter-spacing:-.05em}h2{margin:8px 0 16px;font-size:clamp(25px,4vw,38px)}h3{margin:0 0 10px;font-size:14px;color:#f3d17a;letter-spacing:.08em}.lead{max-width:850px;color:#bdc9d8;line-height:1.65}.privacy,.muted{color:#8fa0b4;font-size:13px;line-height:1.55}.form{display:grid;grid-template-columns:minmax(0,2fr) minmax(190px,.75fr) auto;gap:12px;align-items:end}.form label{display:grid;gap:7px;color:#b8c6d8;font-size:13px}.form textarea,.form input{width:100%;border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:12px;background:#07111d;color:#eef4fb;font:inherit}.form textarea{min-height:92px;resize:vertical}.form button,.access{display:inline-flex;justify-content:center;align-items:center;border:1px solid rgba(247,212,125,.48);border-radius:999px;padding:13px 18px;background:rgba(247,212,125,.09);color:#f7d47d;font-weight:800;text-decoration:none;cursor:pointer}.failure{border-color:rgba(255,130,130,.35)}.resultHead{display:flex;justify-content:space-between;gap:12px;align-items:start}.resultHead span{font:11px ui-monospace,monospace;color:#7f90a4;overflow-wrap:anywhere}.snapshotSummary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:16px 0 18px}.snapshotSummary div{border:1px solid rgba(255,255,255,.11);border-radius:14px;padding:12px;background:rgba(0,0,0,.14)}.snapshotSummary span{display:block;color:#8394a8;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.snapshotSummary strong{display:block;margin-top:6px;color:#e3ebf5;font-size:13px;line-height:1.35}.reframe{border-left:3px solid #f1c96b;padding:12px 14px;background:rgba(241,201,107,.07);color:#e5d6a8}.question{line-height:1.6;color:#c7d1df}.readFlow{margin-top:22px;border-top:1px solid rgba(255,255,255,.12)}.readSection{display:grid;grid-template-columns:42px minmax(0,1fr);gap:14px;padding:22px 0;border-bottom:1px solid rgba(255,255,255,.1)}.step{font:700 12px ui-monospace,monospace;color:#6f8197;padding-top:2px}.factBlock,.readBlock{border-radius:16px;padding:14px 16px;margin-top:10px}.factBlock{border:1px solid rgba(255,255,255,.11);background:rgba(0,0,0,.16)}.readBlock{border-left:3px solid #f1c96b;background:rgba(241,201,107,.055)}.factBlock span,.readBlock span{display:block;margin-bottom:6px;font-size:10px;font-weight:800;letter-spacing:.14em;color:#8798ad}.readBlock span{color:#d7b85f}.factBlock p,.readBlock p,.watch li,.uncertainty p,.boundaryBlock p{margin:0;color:#b7c4d4;line-height:1.62}.readBlock p{color:#d9e2ed}.watch,.uncertainty,.boundaryBlock{margin-top:16px;border:1px solid rgba(255,255,255,.11);border-radius:18px;padding:16px;background:rgba(0,0,0,.16)}.uncertainty p+p{margin-top:7px}.timestamps{padding-top:7px;border-top:1px solid rgba(255,255,255,.08)}.watch ol{margin:0;padding-left:20px;display:grid;gap:8px}.access{margin-top:16px}.proof summary{cursor:pointer;color:#f3d17a;font-weight:800}.proofGrid{display:grid;gap:10px;margin-top:14px}.proofGrid article{display:grid;gap:7px;border-top:1px solid rgba(255,255,255,.1);padding-top:12px;min-width:0}.proofGrid span{color:#91a1b5;font-size:12px}.hash{font-size:12px}.hash summary{color:#91a1b5;font-weight:700}.proofGrid code{display:block;margin-top:7px;font-size:11px;color:#8193a8;overflow-wrap:anywhere}
      :global(a:focus-visible),button:focus-visible,textarea:focus-visible,input:focus-visible,summary:focus-visible{outline:2px solid #f3d17a;outline-offset:3px}
      @media(max-width:760px){.form{grid-template-columns:1fr}.form button{width:100%}.resultHead{display:grid}.snapshotSummary{grid-template-columns:repeat(2,minmax(0,1fr))}.readSection{grid-template-columns:28px minmax(0,1fr)}h1{font-size:38px}.page{padding-inline:10px}.module{border-radius:20px;padding:18px 14px}}
    `}</style>
  </>;
}
