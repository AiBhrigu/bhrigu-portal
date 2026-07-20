import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { BTC_SOURCE_URLS, loadBtcStaticSource } from "../../lib/btc-public-static-source";
import { composeBtcPublicSnapshot } from "../../lib/btc-public-snapshot-composer";
import { renderBtcNarrativeRead } from "../../lib/btc-narrative-template-catalog";
import type { BtcNarrativeSectionFactPayload } from "../../lib/btc-deterministic-narrative-router";
import {
  formatBtcDominanceBandLabel,
  formatBtcFocusAxisLabel,
  formatBtcFreshnessLabel,
  formatBtcMarketContextLabel,
  formatBtcObservationDate,
  formatBtcProofSourceLabel,
  formatBtcProofStatusLabel,
  formatBtcQuestionLensLabel,
  formatBtcSafetyOverlayLabel,
  formatBtcTemporalStateLabel,
  formatBtcUtcTimestamp,
  formatBtcWatchConditionForDisplay,
  getBtcReadRolePresentation,
} from "../../lib/btc-public-display-labels";
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

const EXAMPLE_QUESTIONS = [
  "What changed in the BTC field and why does it matter?",
  "What does BTC dominance mean for the wider market?",
  "What do liquidity, breadth, and pressure show now?",
  "How does the selected date change the observation context?",
  "Which BTC conditions should I watch?",
] as const;

const SECTION_TITLES: Record<BtcNarrativeSectionFactPayload["section_id"], string> = {
  what_changed: "WHAT CHANGED",
  why_it_matters: "WHY IT MATTERS",
  current_structure: "CURRENT STRUCTURE",
  dominant_pressures: "DOMINANT PRESSURES",
  relative_market_field: "RELATIVE MARKET FIELD",
  temporal_context: "TEMPORAL CONTEXT",
};

function factText(payload: BtcNarrativeSectionFactPayload): string {
  switch (payload.section_id) {
    case "what_changed":
      return `BTC is ${money(payload.price_usd)}. Published change: 24h ${pct(payload.change_24h_pct)}, 7d ${pct(payload.change_7d_pct)}, 30d ${pct(payload.change_30d_pct)}. Total market-cap change over 24h is ${pct(payload.market_cap_change_24h_pct)}.`;
    case "why_it_matters":
      return `BTC dominance is ${payload.dominance_pct.toFixed(2)}% in the ${formatBtcDominanceBandLabel(payload.dominance_band)} band, with market rank #${payload.market_cap_rank}. Published context: ${formatBtcMarketContextLabel(payload.market_context_label)}.`;
    case "current_structure":
      return `Regime: ${payload.regime_label}. Field score: ${payload.field_score.toFixed(1)}. Direction bias: ${payload.direction_bias}. Liquidity state: ${payload.liquidity_state}.`;
    case "dominant_pressures":
      return `Bounded pressure: ${payload.pressure_label}. Temporal state: ${formatBtcTemporalStateLabel(payload.temporal_state)}. ${payload.harmonic_tension === null ? "No numeric aspect value is published." : `Harmonic tension ${payload.harmonic_tension.toFixed(4)}.`} Stablecoin share is ${payload.stablecoin_share_pct.toFixed(2)}%.`;
    case "relative_market_field":
      return `BTC dominance is ${payload.dominance_pct.toFixed(2)}%, alt breadth is ${payload.alt_breadth_24h_pct.toFixed(1)}% across the stated universe, and stablecoin share is ${payload.stablecoin_share_pct.toFixed(2)}%.`;
    case "temporal_context":
      return `Temporal state: ${formatBtcTemporalStateLabel(payload.temporal_state)}. Selected temporal date: ${formatBtcObservationDate(payload.observation_date)}. Market source snapshot: ${formatBtcUtcTimestamp(payload.source_generated_at_utc)}.`;
  }
}

export default function BtcSnapshotPage({ result, failure, initialQuestion, initialDate }: PageProps) {
  const inputFailure = failure?.code === "invalid_input";
  const exampleDate = initialDate ? `&d=${encodeURIComponent(initialDate)}` : "";

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
        <p className="questionHelp">Write naturally. Ordinary BTC questions are accepted. Requests for direct action are converted into observable research context rather than rejected.</p>
        <form method="get" action="/crypto-astro/btc" className="form">
          <label>Question
            <textarea name="q" minLength={8} maxLength={280} required defaultValue={initialQuestion} placeholder="What changed in the BTC field, why does it matter, and what conditions should I watch?" />
          </label>
          <label>Optional temporal observation date (UTC)
            <input name="d" type="date" defaultValue={initialDate} />
          </label>
          <button type="submit">Run BTC Field Read</button>
        </form>
        <div className="examples" aria-label="Example BTC field questions">
          <span>Try an example</span>
          <div>{EXAMPLE_QUESTIONS.map((question) => <a key={question} href={`/crypto-astro/btc?q=${encodeURIComponent(question)}${exampleDate}`}>{question}</a>)}</div>
        </div>
        <p className="privacy">The selected date controls the bounded temporal lane only. Market facts remain tied to the visible source snapshot timestamp. Do not include wallet addresses, account details, private keys, or identifying information.</p>
      </section>

      {failure && <section className="module failure" role="alert">
        <p className="eyebrow">{inputFailure ? "Question check" : "Source-bound failure"}</p>
        <h2>{inputFailure ? "Adjust the question or date" : "BTC Field Read unavailable"}</h2>
        <p>{failure.message}</p>
        <p className="muted">{inputFailure
          ? "The public source remains available. Correct the question or date in the form above and run the read again."
          : "A verified source, proof, freshness, or public-contract check prevented this read. The form remains available above."}</p>
        {failure.last_verified_at_utc && <p className="muted">Last verified: {formatBtcUtcTimestamp(failure.last_verified_at_utc)}</p>}
        <details className="technical"><summary>Technical details</summary><code>{failure.code}</code></details>
        {!inputFailure && <a href="https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/index.html" target="_blank" rel="noopener noreferrer">Open the public proof route</a>}
      </section>}

      {result && <>
        <section className="module result" aria-labelledby="result-title">
          <div className="resultHead"><div><p className="eyebrow">{result.asset.symbol} · {formatBtcFreshnessLabel(result.market_snapshot.freshness)}</p><h2 id="result-title">One coherent Cosmographer read</h2></div></div>
          <div className="snapshotSummary" aria-label="Verified snapshot overview">
            <div><span>Observation</span><strong>{formatBtcObservationDate(result.temporal_context.observation_date)}</strong></div>
            <div><span>Evidence sources</span><strong>{result.source_proof.sources.length} reviewed</strong></div>
            <div><span>Market regime</span><strong>{result.market_structure.regime_label}</strong></div>
            <div><span>Verification status</span><strong>{formatBtcFreshnessLabel(result.market_snapshot.freshness)}</strong></div>
          </div>
          {result.question.safe_reframed && <p className="reframe"><strong>{formatBtcSafetyOverlayLabel(result.question.geometry.safety_overlay)}.</strong> Direct trading guidance was removed. The question was converted to observable BTC field context.</p>}
          <p className="question"><strong>Question lens:</strong> {formatBtcQuestionLensLabel(result.question.lens)}<br /><strong>Focus axis:</strong> {formatBtcFocusAxisLabel(result.question.geometry.focus_axis)}<br />{result.question.normalized}</p>

          <div className="readFlow">
            {result.cosmographer_read.sections.map((section) => {
              const titleId = `${section.section_id}-title`;
              const role = getBtcReadRolePresentation(section.role);
              return <section className={`readSection ${role.className}`} data-role={role.dataRole} aria-labelledby={titleId} key={section.section_id}>
                <span className="step">{String(section.order).padStart(2, "0")}</span>
                <div>
                  <div className="sectionHeading"><h3 id={titleId}>{SECTION_TITLES[section.section_id]}</h3><span className="roleBadge">{role.badge}</span></div>
                  <div className="factBlock"><span>FACTS</span><p>{factText(section.fact_payload)}</p></div>
                  <div className="readBlock"><span>COSMOGRAPHER READ</span><p>{renderBtcNarrativeRead(section.read_template_id, section.fact_payload)}</p></div>
                </div>
              </section>;
            })}
          </div>

          <div className="watch"><h3>WATCH CONDITIONS</h3><ol>{result.watch_conditions.map((item) => {
            const display = formatBtcWatchConditionForDisplay(item);
            return <li key={item}>{display}</li>;
          })}</ol></div>

          <div className="uncertainty">
            <h3>UNCERTAINTY</h3>
            <p>{result.uncertainty.freshness}</p>
            <p>{result.uncertainty.question_limit}</p>
            <p>{result.uncertainty.temporal_limit}</p>
            <p>{result.uncertainty.source_limit}</p>
            <p className="timestamps"><strong>Report generated:</strong> {formatBtcUtcTimestamp(result.generated_at_utc)}<br /><strong>Market snapshot generated:</strong> {formatBtcUtcTimestamp(result.market_snapshot.source_generated_at_utc)}<br /><strong>Temporal observation date:</strong> {formatBtcObservationDate(result.temporal_context.observation_date)}</p>
          </div>

          <div className="boundaryBlock">
            <h3>BOUNDARY</h3>
            <p>Read only · static public snapshot · no live adapter claim · no trading signal · no forecast · no price target · no investment recommendation · ORION core protected.</p>
          </div>

          <details className="technical"><summary>Technical read details</summary><p><strong>Request ID:</strong> <code>{result.request_id}</code></p><p><strong>Route:</strong> <code>{result.cosmographer_read.route_version}</code></p></details>
          <Link className="access" href={result.deeper_access_route}>Request deeper operator-reviewed access</Link>
        </section>

        <details className="module proof">
          <summary>SOURCE PROOF · {result.source_proof.sources.length} reviewed sources</summary>
          <p>CoinGecko data attribution is preserved through the source URLs below. DeFiLlama sources provide public liquidity context.</p>
          <p><a href={BTC_SOURCE_URLS.snapshot}>Canonical snapshot JSON</a> · <a href={BTC_SOURCE_URLS.proof}>Proof JSON</a> · <a href={BTC_SOURCE_URLS.marketField}>Market-field JSON</a></p>
          <div className="proofGrid">{result.source_proof.sources.map((source) => <article key={source.label}>
            <strong>{formatBtcProofSourceLabel(source.label)}</strong>
            <span>{formatBtcProofStatusLabel(source.status)} · fetched {formatBtcUtcTimestamp(source.fetched_at_utc)}</span>
            <a href={source.url} target="_blank" rel="noopener noreferrer">Open source</a>
            <details className="hash"><summary>Technical proof details</summary><p><strong>SHA-256</strong></p><code>{source.sha256}</code><p><strong>Bytes:</strong> {source.bytes}</p><p><strong>Internal label:</strong> <code>{source.label}</code></p></details>
          </article>)}</div>
        </details>
      </>}
    </main>
    <style jsx>{`
      :global(*){box-sizing:border-box} :global(html,body){margin:0;background:#050a12;color:#e7edf5;font-family:Inter,ui-sans-serif,system-ui,sans-serif;overflow-x:hidden} :global(a){color:#9fc4ff}
      .page{width:min(980px,100%);margin:0 auto;padding:24px 16px 64px;display:grid;gap:18px}.module{min-width:0;border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:clamp(18px,3vw,30px);background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025));box-shadow:0 20px 70px rgba(0,0,0,.22)}
      .hero{background:radial-gradient(circle at 15% 0,rgba(247,212,125,.13),transparent 38%),radial-gradient(circle at 90% 10%,rgba(115,163,255,.12),transparent 38%),rgba(255,255,255,.025)}.eyebrow{margin:0;color:#f1c96b;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}h1{margin:12px 0 0;font-size:clamp(36px,7vw,72px);line-height:.98;letter-spacing:-.05em}h2{margin:8px 0 16px;font-size:clamp(25px,4vw,38px)}h3{margin:0;font-size:14px;color:#f3d17a;letter-spacing:.08em}.lead{max-width:850px;color:#bdc9d8;line-height:1.65}.boundary,.privacy,.muted,.questionHelp{color:#8fa0b4;font-size:13px;line-height:1.55}.questionHelp{max-width:760px;margin:-4px 0 14px}.form{display:grid;grid-template-columns:minmax(0,2fr) minmax(190px,.75fr) auto;gap:12px;align-items:end}.form label{display:grid;gap:7px;color:#b8c6d8;font-size:13px}.form textarea,.form input{width:100%;border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:12px;background:#07111d;color:#eef4fb;font:inherit}.form textarea{min-height:92px;resize:vertical}.form button,.access{display:inline-flex;justify-content:center;align-items:center;border:1px solid rgba(247,212,125,.48);border-radius:999px;padding:13px 18px;background:rgba(247,212,125,.09);color:#f7d47d;font-weight:800;text-decoration:none;cursor:pointer}.form button:focus-visible,.access:focus-visible,.examples a:focus-visible,.proof a:focus-visible,.proof summary:focus-visible,.technical summary:focus-visible,.hash summary:focus-visible{outline:3px solid #9fc4ff;outline-offset:3px}.examples{display:grid;gap:8px;margin:16px 0 4px}.examples>span{color:#d7b85f;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.examples>div{display:flex;flex-wrap:wrap;gap:8px}.examples a{border:1px solid rgba(159,196,255,.22);border-radius:999px;padding:8px 11px;background:rgba(115,163,255,.055);color:#b9d2f4;font-size:12px;line-height:1.3;text-decoration:none}.examples a:hover{border-color:rgba(247,212,125,.45);color:#f3d17a}.failure{border-color:rgba(255,130,130,.35)}.resultHead{display:flex;justify-content:space-between;gap:12px;align-items:start}.reframe{border-left:3px solid #f1c96b;padding:12px 14px;background:rgba(241,201,107,.07);color:#e5d6a8}.question{line-height:1.6;color:#c7d1df}.snapshotSummary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0 18px}.snapshotSummary div{display:grid;gap:5px;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px;background:rgba(0,0,0,.14)}.snapshotSummary span{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#8293a7}.snapshotSummary strong{font-size:13px;color:#dbe5f0;line-height:1.35}.readFlow{margin-top:22px;border-top:1px solid rgba(255,255,255,.12)}.readSection{display:grid;grid-template-columns:42px minmax(0,1fr);gap:14px;padding:22px 14px;border-bottom:1px solid rgba(255,255,255,.1);border-left:2px solid transparent}.readSectionPrimary{border-left-color:rgba(247,212,125,.78);background:linear-gradient(90deg,rgba(247,212,125,.065),transparent 64%)}.readSectionSupporting{opacity:.9}.readSectionPrimary h3{font-weight:900}.readSectionSupporting h3{color:#c9b46f}.sectionHeading{display:flex;align-items:center;justify-content:space-between;gap:12px}.roleBadge{display:inline-flex;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:5px 8px;font-size:9px;font-weight:800;letter-spacing:.1em;color:#9aabc0;white-space:nowrap}.readSectionPrimary .roleBadge{border-color:rgba(247,212,125,.45);background:rgba(247,212,125,.1);color:#f3d17a}.step{font:700 12px ui-monospace,monospace;color:#6f8197;padding-top:2px}.readSectionPrimary .step{color:#f1c96b}.factBlock,.readBlock{border-radius:16px;padding:14px 16px;margin-top:10px}.factBlock{border:1px solid rgba(255,255,255,.11);background:rgba(0,0,0,.16)}.readBlock{border-left:3px solid #f1c96b;background:rgba(241,201,107,.055)}.readSectionPrimary .readBlock{background:rgba(241,201,107,.09);border-left-width:4px}.factBlock span,.readBlock span{display:block;margin-bottom:6px;font-size:10px;font-weight:800;letter-spacing:.14em;color:#8798ad}.readBlock span{color:#d7b85f}.factBlock p,.readBlock p,.watch li,.uncertainty p,.boundaryBlock p{margin:0;color:#b7c4d4;line-height:1.62}.readBlock p{color:#d9e2ed}.watch,.uncertainty,.boundaryBlock{margin-top:16px;border:1px solid rgba(255,255,255,.11);border-radius:18px;padding:16px;background:rgba(0,0,0,.16)}.watch h3,.uncertainty h3,.boundaryBlock h3{margin-bottom:10px}.watch ol{margin:0;padding-left:20px;display:grid;gap:8px}.timestamps{margin-top:12px!important}.access{margin-top:16px}.technical{margin-top:16px;border-top:1px solid rgba(255,255,255,.1);padding-top:12px;color:#91a1b5}.technical summary,.hash summary,.proof summary{cursor:pointer;color:#f3d17a;font-weight:800}.technical code,.proofGrid code{font-size:11px;color:#8193a8;overflow-wrap:anywhere}.proofGrid{display:grid;gap:10px;margin-top:14px}.proofGrid article{display:grid;gap:7px;border-top:1px solid rgba(255,255,255,.1);padding-top:12px;min-width:0}.proofGrid span{color:#91a1b5;font-size:12px}.hash{margin-top:2px}.hash p{margin:8px 0 3px;color:#91a1b5;font-size:12px}
      @media(max-width:760px){.form{grid-template-columns:1fr}.form button{width:100%}.resultHead{display:grid}.snapshotSummary{grid-template-columns:1fr 1fr}.readSection{grid-template-columns:28px minmax(0,1fr);padding-inline:8px}.sectionHeading{align-items:flex-start}.roleBadge{white-space:normal;text-align:right}h1{font-size:38px}.page{padding-inline:10px}.module{border-radius:20px;padding:18px 14px}.examples>div{display:grid}.examples a{border-radius:14px}}
      @media(max-width:420px){.snapshotSummary{grid-template-columns:1fr}.readSection{grid-template-columns:24px minmax(0,1fr);gap:9px}.factBlock,.readBlock{padding:12px}.roleBadge{font-size:8px}}
    `}</style>
  </>;
}
