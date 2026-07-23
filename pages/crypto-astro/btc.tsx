import Head from "next/head";
import type { GetServerSideProps } from "next";
import { loadBtcStaticSource } from "../../lib/btc-public-static-source";
import { composeBtcPublicSnapshot } from "../../lib/btc-public-snapshot-composer";
import { renderBtcNarrativeRead } from "../../lib/btc-narrative-template-catalog";
import type { BtcNarrativeSectionFactPayload } from "../../lib/btc-deterministic-narrative-router";
import {
  loadBtcMarketEnvelope,
  type BtcMarketEnvelope,
  type BtcMarketEnvelopeFailure,
  type BtcMetricDelta,
} from "../../lib/btc-market-envelope";
import {
  formatBtcDominanceBandLabel,
  formatBtcFocusAxisLabel,
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
import type { BtcFailureCode, BtcPublicSnapshot } from "../../lib/btc-public-output-contract";

type Failure = {
  code: BtcFailureCode;
  message: string;
  last_verified_at_utc: string | null;
};

type EnvelopeFailure = {
  code: BtcMarketEnvelopeFailure["code"];
  message: string;
  last_verified_at_utc: string | null;
};

type Props = {
  result: BtcPublicSnapshot | null;
  failure: Failure | null;
  envelope: BtcMarketEnvelope | null;
  envelopeFailure: EnvelopeFailure | null;
  initialQuestion: string;
  initialDate: string;
};

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const initialQuestion = first(query.q);
  const initialDate = first(query.d);
  const empty: Props = {
    result: null,
    failure: null,
    envelope: null,
    envelopeFailure: null,
    initialQuestion: "",
    initialDate,
  };

  if (!initialQuestion) return { props: empty };

  const source = await loadBtcStaticSource();
  if (source.ok === false) {
    return {
      props: {
        ...empty,
        initialQuestion,
        failure: {
          code: source.code,
          message: source.message,
          last_verified_at_utc: source.last_verified_at_utc ?? null,
        },
      },
    };
  }

  const composed = await composeBtcPublicSnapshot(source, {
    question: initialQuestion,
    date: initialDate || undefined,
  });
  if (composed.ok === false) {
    return {
      props: {
        ...empty,
        initialQuestion,
        failure: {
          code: composed.code,
          message: composed.message,
          last_verified_at_utc: null,
        },
      },
    };
  }

  const market = await loadBtcMarketEnvelope(initialQuestion, {
    temporal: {
      state: composed.value.temporal_context.state,
      label: composed.value.temporal_context.label,
      harmonic_tension: composed.value.aspect_pressure.harmonic_tension,
    },
  });

  return {
    props: {
      result: composed.value,
      failure: null,
      envelope: market.ok === true ? market.value : null,
      envelopeFailure:
        market.ok === true
          ? null
          : {
              code: market.code,
              message: market.message,
              last_verified_at_utc: market.last_verified_at_utc ?? null,
            },
      initialQuestion,
      initialDate,
    },
  };
};

const compact = (value: number, decimals: number) => {
  const fixed = value.toFixed(decimals);
  return fixed.includes(".") ? fixed.replace(/\.?0+$/, "") : fixed;
};

const money = (value: number, signed = false) => {
  const absolute = Math.abs(value);
  const divisor =
    absolute >= 1e12 ? 1e12 : absolute >= 1e9 ? 1e9 : absolute >= 1e6 ? 1e6 : absolute >= 1e3 ? 1e3 : 1;
  const suffix = divisor === 1e12 ? "T" : divisor === 1e9 ? "B" : divisor === 1e6 ? "M" : divisor === 1e3 ? "K" : "";
  const scaled = absolute / divisor;
  const digits = suffix ? (scaled >= 100 ? 0 : 2) : 2;
  const sign = value < 0 ? "−" : signed && value > 0 ? "+" : "";
  return `${sign}$${compact(scaled, digits)}${suffix}`;
};

const pct = (value: number, decimals = 2, signed = true) =>
  `${value < 0 ? "−" : signed && value > 0 ? "+" : ""}${compact(Math.abs(value), decimals)}%`;

const plain = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());

const stateLabel = (value: string) =>
  ({
    CONFIRMATION: "Confirmation",
    DIVERGENCE: "Mixed signals",
    INSUFFICIENT_EVIDENCE: "Evidence limited",
    UP: "Strengthening",
    DOWN: "Weakening",
    UNCHANGED: "Stable",
    BOUNDED: "Mixed",
    UNAVAILABLE: "Unavailable",
  })[value] ?? plain(value);

const stateClass = (value: string) =>
  value === "CONFIRMATION"
    ? "directionConfirmation"
    : value === "DIVERGENCE"
      ? "directionDivergence"
      : "directionLimited";

const roleLabel = (value: string) =>
  value === "primary"
    ? "Primary for this question"
    : value === "unavailable"
      ? "Not available"
      : "Supporting context";

const memoryLabel = (id: string) =>
  ({
    btc_gravity_pct: "BTC dominance",
    stablecoin_share_pct: "Stablecoin share",
    alt_breadth_24h_pct: "Alt breadth · 24h",
    alt_breadth_7d_pct: "Alt breadth · 7d",
    market_field_score: "Market Field Score",
    regime_label: "Regime",
    defi_tvl_usd: "DeFi TVL",
    liquidity_context_state: "Liquidity context",
  })[id] ?? plain(id);

const memoryValue = (metric: BtcMetricDelta, value: string) => {
  const numeric = Number(value);
  if (metric.type !== "NUMERIC" || !Number.isFinite(numeric)) return plain(value);
  if (metric.unit === "usd") return money(numeric);
  if (metric.unit === "percent") return `${compact(numeric, metric.metric_id.includes("breadth") ? 1 : 2)}%`;
  if (metric.unit === "score_0_100") return compact(numeric, 1);
  return compact(numeric, 2);
};

const memoryDelta = (metric: BtcMetricDelta) => {
  if (metric.type !== "NUMERIC") {
    return metric.transition === "UNCHANGED" ? "No change" : plain(metric.transition ?? metric.direction);
  }

  const numeric = Number(metric.display_delta);
  if (!Number.isFinite(numeric)) return stateLabel(metric.direction);
  if (metric.unit === "usd") return money(numeric, true);

  const sign = numeric < 0 ? "−" : numeric > 0 ? "+" : "";
  const value = compact(
    Math.abs(numeric),
    metric.metric_id.includes("breadth") || metric.unit === "score_0_100" ? 1 : 2,
  );
  return metric.unit === "percent" ? `${sign}${value} pp` : `${sign}${value} pts`;
};

const examples = [
  "What changed in the BTC field and why does it matter?",
  "What does BTC dominance mean for the wider market?",
  "What do liquidity, breadth, and pressure show now?",
  "How does the selected date change the observation context?",
  "Which BTC conditions should I watch?",
] as const;

const titles: Record<BtcNarrativeSectionFactPayload["section_id"], string> = {
  what_changed: "ROLLING MARKET CONTEXT",
  why_it_matters: "WHY IT MATTERS",
  current_structure: "CURRENT STRUCTURE",
  dominant_pressures: "DOMINANT PRESSURES",
  relative_market_field: "RELATIVE MARKET FIELD",
  temporal_context: "TEMPORAL CONTEXT",
};

function facts(payload: BtcNarrativeSectionFactPayload) {
  switch (payload.section_id) {
    case "what_changed":
      return `BTC ${money(payload.price_usd)} · 24h ${pct(payload.change_24h_pct)} · 7d ${pct(payload.change_7d_pct)} · 30d ${pct(payload.change_30d_pct)} · total-cap 24h ${pct(payload.market_cap_change_24h_pct)}.`;
    case "why_it_matters":
      return `Dominance ${compact(payload.dominance_pct, 2)}% · ${formatBtcDominanceBandLabel(payload.dominance_band)} · rank #${payload.market_cap_rank} · ${formatBtcMarketContextLabel(payload.market_context_label)}.`;
    case "current_structure":
      return `${payload.regime_label} · field ${compact(payload.field_score, 1)} · ${plain(payload.direction_bias)} · ${plain(payload.liquidity_state)}.`;
    case "dominant_pressures":
      return `${payload.pressure_label} · ${formatBtcTemporalStateLabel(payload.temporal_state)} · ${
        payload.harmonic_tension === null ? "numeric pressure unavailable" : `tension ${compact(payload.harmonic_tension, 2)}`
      } · stablecoin share ${compact(payload.stablecoin_share_pct, 2)}%.`;
    case "relative_market_field":
      return `BTC dominance ${compact(payload.dominance_pct, 2)}% · alt breadth ${compact(payload.alt_breadth_24h_pct, 1)}% · stablecoin share ${compact(payload.stablecoin_share_pct, 2)}%.`;
    case "temporal_context":
      return `${formatBtcTemporalStateLabel(payload.temporal_state)} · observation ${formatBtcObservationDate(payload.observation_date)} · market source ${formatBtcUtcTimestamp(payload.source_generated_at_utc)}.`;
  }
}

const moduleSummary = (envelope: BtcMarketEnvelope, id: string) => {
  if (id === "market_structure") {
    return `Field ${compact(envelope.current.market_field_score, 1)} · dominance ${pct(envelope.current.btc_dominance_pct, 2, false)} · ${envelope.current.regime}`;
  }
  if (id === "liquidity_membrane") {
    return `DeFi TVL ${money(envelope.current.defi_tvl_usd)} · DEX 24h ${money(envelope.current.dex_volume_24h_usd)} · stable share ${pct(envelope.current.stablecoin_share_pct, 2, false)}`;
  }
  if (id === "change_event_memory") {
    return `${envelope.memory.comparable_metric_count} comparable metrics · ${stateLabel(envelope.synthesis.state)}`;
  }
  if (id === "temporal_context") {
    const tension = envelope.current.bounded_temporal_context.harmonic_tension;
    return `${plain(envelope.current.bounded_temporal_context.state)} · tension ${tension === null ? "unavailable" : compact(tension, 2)}`;
  }
  return `${stateLabel(envelope.synthesis.state)} · ${envelope.synthesis.why_this_matters}`;
};

function PrimaryModule({
  envelope,
  node,
  position,
}: {
  envelope: BtcMarketEnvelope;
  node: BtcMarketEnvelope["phi_geometry"]["nodes"][number];
  position: "top" | "bottom";
}) {
  return (
    <article className={`phiModule primaryModule primaryModule${position === "top" ? "Top" : "Bottom"}`} data-role={node.role}>
      <div className="moduleIndex">{node.index}</div>
      <div>
        <p>{roleLabel(node.role)}</p>
        <h3>{node.label}</h3>
        <strong>{stateLabel(node.state)}</strong>
        <span>{moduleSummary(envelope, node.id)}</span>
      </div>
    </article>
  );
}

function SupportingModule({
  envelope,
  node,
}: {
  envelope: BtcMarketEnvelope;
  node: BtcMarketEnvelope["phi_geometry"]["nodes"][number];
}) {
  return (
    <article
      className={`phiModule supportModule ${node.role === "unavailable" ? "supportUnavailable" : ""}`}
      data-role={node.role}
    >
      <header>
        <span>{node.index}</span>
        <em>{roleLabel(node.role)}</em>
      </header>
      <h3>{node.label}</h3>
      <strong>{stateLabel(node.state)}</strong>
      <p>{moduleSummary(envelope, node.id)}</p>
    </article>
  );
}

function ZoneObservation({
  envelope,
  result,
}: {
  envelope: BtcMarketEnvelope;
  result: BtcPublicSnapshot;
}) {
  const changed = envelope.memory.metrics
    .filter((metric) => metric.direction !== "UNCHANGED" || metric.transition !== "UNCHANGED")
    .slice(0, 2)
    .map(
      (metric) =>
        `${memoryLabel(metric.metric_id)} ${memoryValue(metric, metric.previous_value)} → ${memoryValue(metric, metric.current_value)} (${memoryDelta(metric)})`,
    );
  const confirms = envelope.synthesis.confirming_modules[0]?.split(":")[0];
  const weakens = envelope.synthesis.contradicting_or_weakening_modules[0]?.split(":")[0];

  return (
    <section className="readingZone zoneObservation" aria-labelledby="executive-read-title">
      <header className="readingHeader">
        <div>
          <span>Question</span>
          <h2>{result.question.normalized}</h2>
        </div>
        <dl>
          <div>
            <dt>Observation</dt>
            <dd>{formatBtcObservationDate(result.temporal_context.observation_date)}</dd>
          </div>
          <div>
            <dt>Lens</dt>
            <dd>{formatBtcQuestionLensLabel(result.question.lens)}</dd>
          </div>
          <div>
            <dt>Focus</dt>
            <dd>{formatBtcFocusAxisLabel(result.question.geometry.focus_axis)}</dd>
          </div>
        </dl>
      </header>

      {result.question.safe_reframed && (
        <p className="reframe">
          <b>{formatBtcSafetyOverlayLabel(result.question.geometry.safety_overlay)}.</b> Direct trading guidance was removed.
        </p>
      )}

      <section className="metricRibbon" aria-labelledby="current-metrics-title">
        <header>
          <p className="eyebrow">Current verified metrics</p>
          <h3 id="current-metrics-title">BTC and market envelope</h3>
          <time>{formatBtcUtcTimestamp(envelope.current.source_generated_at_utc)}</time>
        </header>
        <dl>
          <div>
            <dt>BTC</dt>
            <dd>{money(envelope.current.price_usd)}</dd>
            <small>24h {pct(envelope.current.change_24h_pct)} · 7d {pct(envelope.current.change_7d_pct)} · 30d {pct(envelope.current.change_30d_pct)}</small>
          </div>
          <div>
            <dt>Dominance</dt>
            <dd>{pct(envelope.current.btc_dominance_pct, 2, false)}</dd>
            <small>Total cap {money(envelope.current.total_market_cap_usd)}</small>
          </div>
          <div>
            <dt>Market Field</dt>
            <dd>{compact(envelope.current.market_field_score, 1)}</dd>
            <small>{envelope.current.regime} · {plain(envelope.current.direction_bias)}</small>
          </div>
          <div>
            <dt>Liquidity</dt>
            <dd>{money(envelope.current.defi_tvl_usd)}</dd>
            <small>DEX 24h {money(envelope.current.dex_volume_24h_usd)}</small>
          </div>
          <div>
            <dt>Participation</dt>
            <dd>{pct(envelope.current.alt_breadth_24h_pct, 1, false)}</dd>
            <small>7d {pct(envelope.current.alt_breadth_7d_pct, 1, false)} · ETH {pct(envelope.current.eth_rotation_anchor_pct, 2, false)}</small>
          </div>
          <div>
            <dt>Stablecoins</dt>
            <dd>{pct(envelope.current.stablecoin_share_pct, 2, false)}</dd>
            <small>{money(envelope.current.stablecoin_cap_usd)}</small>
          </div>
        </dl>
      </section>

      <section className="executiveField">
        <div className="executivePrimary">
          <p className="eyebrow">Executive Cosmographer Read</p>
          <h3 id="executive-read-title">{stateLabel(envelope.synthesis.state)}</h3>
          <p className="executiveLead">{envelope.synthesis.why_this_matters}</p>
          <dl>
            <div>
              <dt>What changed</dt>
              <dd>{changed[0] ?? "No comparable transition is asserted."}</dd>
            </div>
            <div>
              <dt>What changed next</dt>
              <dd>{changed[1] ?? "No second material transition is asserted."}</dd>
            </div>
          </dl>
        </div>
        <aside className="executiveContext">
          <dl>
            <div>
              <dt>What confirms it</dt>
              <dd>{confirms ? `${confirms} aligns with the routed structure.` : "No multi-module confirmation is asserted."}</dd>
            </div>
            <div>
              <dt>What weakens it</dt>
              <dd>{weakens ?? "No contradiction is asserted."}</dd>
            </div>
            <div>
              <dt>Watch next</dt>
              <dd>{envelope.synthesis.watch_next[0] ?? "Wait for the next accepted snapshot."}</dd>
            </div>
            <div>
              <dt>Uncertainty boundary</dt>
              <dd>{envelope.synthesis.uncertainty[0] ?? "The read remains bounded to accepted static evidence."}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </section>
  );
}

function ZonePhi({ envelope }: { envelope: BtcMarketEnvelope }) {
  const primary = envelope.phi_geometry.nodes.filter((node) => node.role === "primary");
  const support = envelope.phi_geometry.nodes.filter((node) => node.role !== "primary");

  return (
    <section className="readingZone zonePhi" aria-labelledby="phi-field-title">
      <header className="zoneHeading">
        <div>
          <p className="eyebrow">Unified semantic field</p>
          <h2 id="phi-field-title">Five-module Φ-field</h2>
        </div>
        <p>Two routed modules lead. Three remain supporting or unavailable.</p>
      </header>

      <div className="phiPlane">
        <div className="primaryField">
          <PrimaryModule envelope={envelope} node={primary[0]} position="top" />
          <div className="btcAxis">
            <span>BTC</span>
            <b>Central gravity</b>
            <small>{plain(envelope.question_class)}</small>
          </div>
          <PrimaryModule envelope={envelope} node={primary[1]} position="bottom" />
        </div>
        <div className="supportBand">
          {support.map((node) => (
            <SupportingModule key={node.id} envelope={envelope} node={node} />
          ))}
        </div>
      </div>

      <div className={`fieldDirection ${stateClass(envelope.synthesis.state)}`}>
        <span>{stateLabel(envelope.synthesis.state)}</span>
        <i aria-hidden="true" />
        <p>{envelope.memory.transition_interpretation}</p>
      </div>

      <section className="memoryAxis" aria-labelledby="memory-title">
        <header>
          <div>
            <p className="eyebrow">Accepted Change Memory</p>
            <h3 id="memory-title">Previous → current</h3>
          </div>
          <p>{envelope.memory.comparable_metric_count} comparable · {envelope.memory.unavailable_metrics.length} unavailable</p>
        </header>
        <div className="memoryScale" aria-hidden="true">
          <span>Previous accepted</span>
          <i />
          <span>Current accepted</span>
        </div>
        <div className="memoryTableWrap">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Previous</th>
                <th>Change</th>
                <th>Current</th>
              </tr>
            </thead>
            <tbody>
              {envelope.memory.metrics.map((metric) => (
                <tr key={metric.metric_id}>
                  <th>{memoryLabel(metric.metric_id)}</th>
                  <td>{memoryValue(metric, metric.previous_value)}</td>
                  <td>{memoryDelta(metric)}</td>
                  <td>{memoryValue(metric, metric.current_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function ZoneEvidence({
  envelope,
  result,
}: {
  envelope: BtcMarketEnvelope;
  result: BtcPublicSnapshot;
}) {
  return (
    <section className="readingZone zoneEvidence" aria-labelledby="evidence-title">
      <header className="zoneHeading">
        <div>
          <p className="eyebrow">Evidence and closure</p>
          <h2 id="evidence-title">Open technical evidence only when needed</h2>
        </div>
        <p>Analytical proof remains complete without repeating the executive read.</p>
      </header>

      <div className="evidenceStack">
        <details>
          <summary>Detailed module evidence</summary>
          <ol className="moduleEvidenceList">
            {result.cosmographer_read.sections.map((section) => {
              const role = getBtcReadRolePresentation(section.role);
              return (
                <li key={section.section_id}>
                  <header>
                    <span>{String(section.order).padStart(2, "0")}</span>
                    <h3>{titles[section.section_id]}</h3>
                    <em>{role.badge === "PRIMARY READ" ? "Primary" : "Supporting"}</em>
                  </header>
                  <p><b>Facts.</b> {facts(section.fact_payload)}</p>
                  <p><b>Cosmographer read.</b> {renderBtcNarrativeRead(section.read_template_id, section.fact_payload)}</p>
                </li>
              );
            })}
          </ol>
          <div className="watchEvidence">
            <section>
              <h3>Watch conditions</h3>
              <ol>{result.watch_conditions.map((item) => <li key={item}>{formatBtcWatchConditionForDisplay(item)}</li>)}</ol>
            </section>
            <section>
              <h3>Uncertainty</h3>
              <p>{result.uncertainty.freshness}</p>
              <p>{result.uncertainty.question_limit}</p>
              <p>{result.uncertainty.temporal_limit}</p>
              <p>{result.uncertainty.source_limit}</p>
            </section>
          </div>
        </details>

        <details>
          <summary>Verified history</summary>
          {envelope.verified_history.available ? (
            <>
              <p>{envelope.verified_history.observation_window}</p>
              <div className="historyTableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Checkpoint</th>
                      <th>BTC</th>
                      <th>Dominance</th>
                      <th>Breadth 24h / 7d</th>
                      <th>Stable share</th>
                      <th>Field / regime</th>
                      <th>Commit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {envelope.verified_history.checkpoints.map((checkpoint) => (
                      <tr key={checkpoint.snapshot_id}>
                        <th>{plain(checkpoint.role)}<small>{formatBtcUtcTimestamp(checkpoint.accepted_at_utc)}</small></th>
                        <td>{money(checkpoint.btc_price_usd)}</td>
                        <td>{pct(checkpoint.btc_dominance_pct, 2, false)}</td>
                        <td>{pct(checkpoint.alt_breadth_24h_pct, 1, false)} / {pct(checkpoint.alt_breadth_7d_pct, 1, false)}</td>
                        <td>{pct(checkpoint.stablecoin_share_pct, 2, false)}</td>
                        <td>{compact(checkpoint.market_field_score, 1)}<small>{checkpoint.regime}</small></td>
                        <td><code>{checkpoint.commit_sha.slice(0, 12)}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="methodNote">{envelope.verified_history.methodology_repair_disclosure}</p>
            </>
          ) : (
            <p>Historical comparison is suppressed because an immutable accepted checkpoint could not be verified.</p>
          )}
        </details>

        <details className="sourceProof">
          <summary>Source proof, exact accepted values, hashes and boundaries</summary>
          <p>
            <a href={envelope.source_proof.registry_url}>Snapshot Registry</a> ·{" "}
            <a href={envelope.source_proof.delta_url}>Snapshot Delta</a> ·{" "}
            <a href={envelope.source_proof.previous_snapshot_url}>Previous immutable snapshot</a>
          </p>

          <section>
            <h3>Reviewed sources</h3>
            <ul className="sourceRows">
              {result.source_proof.sources.map((source) => (
                <li key={source.label}>
                  <b>{formatBtcProofSourceLabel(source.label)}</b>
                  <span>{formatBtcProofStatusLabel(source.status)} · {formatBtcUtcTimestamp(source.fetched_at_utc)}</span>
                  <a href={source.url}>Open source</a>
                  <code>{source.sha256}</code>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Exact accepted memory values and methodology</h3>
            <div className="exactMemoryTableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Previous exact</th>
                    <th>Current exact</th>
                    <th>Methodology</th>
                    <th>Sources</th>
                  </tr>
                </thead>
                <tbody>
                  {envelope.memory.metrics.map((metric) => (
                    <tr key={metric.metric_id}>
                      <th>{metric.metric_id}</th>
                      <td><code>{metric.previous_value}</code></td>
                      <td><code>{metric.current_value}</code></td>
                      <td><code>{metric.methodology_id}</code></td>
                      <td><code>{metric.proof_sources.join(",")}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3>Immutable hashes</h3>
            <div className="hashList">
              <code>current snapshot · {envelope.source_proof.current_snapshot_sha256}</code>
              <code>previous snapshot · {envelope.source_proof.previous_snapshot_sha256}</code>
              <code>current proof · {envelope.source_proof.current_proof_sha256}</code>
              <code>previous proof · {envelope.source_proof.previous_proof_sha256}</code>
              <code>current bindings · {envelope.source_proof.current_bindings_sha256}</code>
              <code>previous bindings · {envelope.source_proof.previous_bindings_sha256}</code>
            </div>
          </section>

          <section className="closingBoundary">
            <h3>Public boundary</h3>
            <p>Read only · static accepted evidence · no live adapter claim · no trading signal · no forecast · no price target · no investment recommendation · no personal-memory claim · ORION protected.</p>
            <p><b>Inactive:</b> {envelope.inactive_modules.join(" · ")}</p>
          </section>
        </details>
      </div>
    </section>
  );
}

function Envelope({
  envelope,
  result,
}: {
  envelope: BtcMarketEnvelope;
  result: BtcPublicSnapshot;
}) {
  return (
    <>
      <ZoneObservation envelope={envelope} result={result} />
      <ZonePhi envelope={envelope} />
      <ZoneEvidence envelope={envelope} result={result} />
    </>
  );
}

export default function Page({
  result,
  failure,
  envelope,
  envelopeFailure,
  initialQuestion,
  initialDate,
}: Props) {
  const inputFailure = failure?.code === "invalid_input";
  const date = initialDate ? `&d=${encodeURIComponent(initialDate)}` : "";

  return (
    <>
      <Head>
        <title>BTC Field Read · Market Cosmographer</title>
        <meta
          name="description"
          content="BTC-centric, whole-market-aware Cosmographer field using static accepted evidence and Snapshot Memory."
        />
      </Head>
      <main>
        <section className="hero">
          <p className="eyebrow">Market Cosmographer · BTC corridor</p>
          <h1>BTC Field Read</h1>
          <p>BTC remains the gravity anchor. The wider market forms the analytical envelope.</p>
        </section>

        <section className="questionPanel" aria-labelledby="btc-question-title">
          <header>
            <div>
              <p className="eyebrow">Question and observation</p>
              <h2 id="btc-question-title">Ask one BTC field question</h2>
            </div>
            {result && (
              <div className="observation">
                <span>Observation</span>
                <b>{formatBtcObservationDate(result.temporal_context.observation_date)}</b>
              </div>
            )}
          </header>
          <form method="get" action="/crypto-astro/btc">
            <label>
              Question
              <textarea
                name="q"
                minLength={8}
                maxLength={280}
                required
                defaultValue={initialQuestion}
                placeholder="What changed in the BTC field, why does it matter, and what conditions should I watch?"
              />
            </label>
            <label>
              Observation date · UTC
              <input name="d" type="date" defaultValue={initialDate} />
            </label>
            <button>Run BTC Field Read</button>
          </form>
          <details className="examples">
            <summary>Example questions</summary>
            <div>
              {examples.map((question) => (
                <a key={question} href={`/crypto-astro/btc?q=${encodeURIComponent(question)}${date}`}>
                  {question}
                </a>
              ))}
            </div>
          </details>
          <p className="privacyNote">The date controls only the bounded temporal lane. Do not include wallet addresses, keys, account details, or identifying information.</p>
        </section>

        {failure && (
          <section className="failure" role="alert">
            <p className="eyebrow">{inputFailure ? "Question check" : "Source-bound failure"}</p>
            <h2>{inputFailure ? "Adjust the question or date" : "BTC Field Read unavailable"}</h2>
            <p>{failure.message}</p>
            {failure.last_verified_at_utc && <p>Last verified: {formatBtcUtcTimestamp(failure.last_verified_at_utc)}</p>}
            <details>
              <summary>Technical details</summary>
              <code>{failure.code}</code>
            </details>
          </section>
        )}

        {result && (
          <section className="reading" aria-label="BTC Cosmographer reading">
            {envelope ? (
              <Envelope envelope={envelope} result={result} />
            ) : (
              <section className="readingZone failure">
                <p className="eyebrow">Market envelope fail-closed</p>
                <h2>Whole-market envelope unavailable</h2>
                <p>{envelopeFailure?.message ?? "The analytical envelope could not be verified."}</p>
                <p>The bounded BTC reader remains available, while Change Memory and cross-module synthesis stay suppressed.</p>
                <details>
                  <summary>Bounded reader evidence</summary>
                  {result.cosmographer_read.sections.map((section) => (
                    <article key={section.section_id}>
                      <h3>{titles[section.section_id]}</h3>
                      <p>{facts(section.fact_payload)}</p>
                      <p>{renderBtcNarrativeRead(section.read_template_id, section.fact_payload)}</p>
                    </article>
                  ))}
                </details>
              </section>
            )}
          </section>
        )}

        <div className="closingField" aria-hidden="true"><span /></div>
      </main>
      <style jsx global>{`
        :global(*){box-sizing:border-box}
        :global(html){scroll-padding-top:calc(84px + env(safe-area-inset-top));scroll-padding-bottom:calc(clamp(128px,12vh,168px) + env(safe-area-inset-bottom))}
        :global(html,body){margin:0;background:#050a12;color:#e8eef6;font-family:Inter,system-ui,sans-serif;overflow-x:hidden}
        :global(a){color:#b7d2ff}
        :global(code){overflow-wrap:anywhere}
        :global(:focus-visible){outline:2px solid #dbe6ef;outline-offset:3px}
        main{width:min(1280px,100%);margin:auto;padding:28px 18px 0}
        .hero{padding:clamp(24px,4vw,48px) 0;border-bottom:1px solid #ffffff20}
        .hero h1{margin:8px 0 4px;font-size:clamp(42px,7vw,78px);letter-spacing:-.06em}
        .hero p:last-child{max-width:720px;color:#aebccc;font-size:clamp(16px,2vw,20px)}
        .eyebrow{margin:0;color:#93a7bb;font:800 11px/1.3 system-ui;letter-spacing:.15em;text-transform:uppercase}
        .questionPanel{padding:24px 0;border-bottom:1px solid #ffffff20}
        .questionPanel>header{display:flex;justify-content:space-between;gap:18px;align-items:start}
        .questionPanel h2,.failure h2{margin:7px 0 14px;font-size:clamp(24px,3vw,36px)}
        .observation{display:grid;gap:3px;text-align:right}
        .observation span{font-size:10px;color:#8193a8;letter-spacing:.12em;text-transform:uppercase}
        .observation b{color:#e8eef6}
        form{display:grid;grid-template-columns:minmax(0,2fr) minmax(210px,.65fr) auto;gap:12px;align-items:end}
        label{display:grid;gap:7px;color:#bdc9d8;font-size:13px}
        textarea,input{width:100%;border:1px solid #ffffff27;border-radius:10px;padding:12px;background:#07111d;color:#f0f5fa;font:inherit}
        textarea{min-height:76px;resize:vertical}
        button{border:1px solid #dbe6ef70;border-radius:999px;padding:13px 18px;background:#dbe6ef0d;color:#e5edf4;font-weight:800;cursor:pointer}
        .examples{margin-top:14px}
        .examples summary{cursor:pointer;color:#c5d2dd;font-weight:700}
        .examples>div{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
        .examples a{border-bottom:1px solid #9fc4ff42;padding:7px 2px;text-decoration:none;font-size:12px}
        .privacyNote{margin-bottom:0;color:#8193a8;font-size:12px}
        .failure{padding:24px 0;border-bottom:1px solid #ff8c8c4d}
        .failure p,.failure li{color:#aebccc;line-height:1.6}
        .reading{display:block}
        .readingZone{padding:28px 0;border-bottom:1px solid #ffffff20}
        .readingHeader{display:grid;grid-template-columns:minmax(0,61.803398875fr) minmax(280px,38.196601125fr);gap:clamp(24px,4vw,52px);align-items:end}
        .readingHeader>div>span,.readingHeader dt{font-size:10px;color:#8193a8;letter-spacing:.12em;text-transform:uppercase}
        .readingHeader h2{margin:5px 0 0;font-size:clamp(28px,3.4vw,40px);letter-spacing:-.035em;line-height:1.02}
        .readingHeader dl{margin:0;border-top:1px solid #ffffff20}
        .readingHeader dl div{display:grid;grid-template-columns:92px 1fr;gap:12px;padding:7px 0;border-bottom:1px solid #ffffff12}
        .readingHeader dd{margin:0;color:#dbe5ed;text-align:right}
        .reframe{margin:18px 0 0;border-left:2px solid #9bb6cc;padding:8px 12px;color:#aebccc}
        .metricRibbon{margin-top:20px;border-block:1px solid #ffffff20}
        .metricRibbon>header{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:end;padding:10px 0;border-bottom:1px solid #ffffff12}
        .metricRibbon>header .eyebrow{grid-column:1/-1}
        .metricRibbon>header h3{margin:0;font-size:18px}
        .metricRibbon>header time{color:#8193a8;font-size:11px}
        .metricRibbon>dl{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));margin:0}
        .metricRibbon>dl>div{min-width:0;padding:10px 12px;border-left:1px solid #ffffff12}
        .metricRibbon>dl>div:first-child{border-left:0;padding-left:0}
        .metricRibbon dt{font-size:9px;color:#8193a8;letter-spacing:.1em;text-transform:uppercase}
        .metricRibbon dd{margin:4px 0 2px;font-size:clamp(18px,1.7vw,22px);font-weight:800;color:#eef3f7}
        .metricRibbon small{display:block;color:#91a3b8;line-height:1.4;overflow-wrap:anywhere}
        .executiveField{display:grid;grid-template-columns:minmax(0,61.803398875fr) minmax(280px,38.196601125fr);gap:clamp(24px,3vw,40px);margin-top:22px}
        .executivePrimary{padding-right:clamp(12px,2vw,28px)}
        .executivePrimary h3{margin:6px 0 8px;font-size:clamp(34px,4vw,50px);letter-spacing:-.05em;line-height:1;color:#f2f5f7}
        .executiveLead{max-width:760px;margin:0;color:#c4d0da;font-size:clamp(16px,1.5vw,18px);line-height:1.4}
        .executivePrimary dl{margin:18px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:18px}
        .executivePrimary dl div{border-top:1px solid #ffffff20;padding-top:11px}
        .executivePrimary dt,.executiveContext dt{font-size:9px;color:#93a7bb;letter-spacing:.1em;text-transform:uppercase}
        .executivePrimary dd,.executiveContext dd{margin:5px 0 0;color:#c1ccd6;line-height:1.4}
        .executiveContext{border-left:1px solid #ffffff20;padding-left:clamp(20px,3vw,38px)}
        .executiveContext dl{margin:0}
        .executiveContext dl div{padding:8px 0;border-bottom:1px solid #ffffff14}
        .zoneHeading{display:flex;justify-content:space-between;gap:24px;align-items:end}
        .zoneHeading h2{margin:7px 0 0;font-size:clamp(28px,4vw,46px);letter-spacing:-.035em}
        .zoneHeading>p{max-width:440px;margin:0;color:#8193a8;text-align:right;line-height:1.5}
        .phiPlane{display:grid;grid-template-columns:minmax(0,61.803398875fr) minmax(300px,38.196601125fr);gap:clamp(28px,4vw,56px);margin-top:34px;border-block:1px solid #ffffff20}
        .primaryField{display:grid;grid-template-rows:auto auto auto;padding:0 clamp(20px,4vw,54px) 0 0}
        .phiModule{min-width:0}
        .primaryModule{display:grid;grid-template-columns:48px minmax(0,1fr);gap:18px;padding:22px 0}
        .primaryModuleTop{border-bottom:1px solid #ffffff18}
        .primaryModuleBottom{border-top:1px solid #ffffff18}
        .moduleIndex{font-size:11px;color:#708396;letter-spacing:.1em;padding-top:5px}
        .primaryModule p{margin:0;color:#8193a8;font-size:9px;letter-spacing:.1em;text-transform:uppercase}
        .primaryModule h3{margin:5px 0 3px;font-size:clamp(22px,3vw,34px);letter-spacing:-.02em;color:#edf2f5}
        .primaryModule strong{display:block;color:#d6e0e8;font-size:12px}
        .primaryModule span{display:block;margin-top:8px;color:#91a3b8;line-height:1.45}
        .btcAxis{position:relative;min-height:172px;display:grid;align-content:center;padding:28px 0}
        .btcAxis::before{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:linear-gradient(90deg,#9bb6cc66,#ffffff22)}
        .btcAxis span,.btcAxis b,.btcAxis small{position:relative;width:max-content;background:#050a12;padding-right:18px}
        .btcAxis span{font-size:clamp(58px,8vw,104px);font-weight:900;letter-spacing:-.075em;line-height:.82;color:#f3f6f8}
        .btcAxis b{margin-top:11px;font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#b8c6d1}
        .btcAxis small{margin-top:4px;color:#708396}
        .supportBand{display:grid;grid-template-columns:1fr 1fr;align-content:stretch;border-left:1px solid #ffffff20;padding-left:clamp(20px,3vw,38px)}
        .supportModule{padding:22px 16px;border-bottom:1px solid #ffffff18}
        .supportModule:nth-child(odd){border-right:1px solid #ffffff18;padding-left:0}
        .supportModule:nth-child(even){padding-right:0}
        .supportModule:last-child{grid-column:1/-1;border-right:0;border-bottom:0;padding-left:0;padding-right:0}
        .supportModule header{display:flex;justify-content:space-between;gap:10px}
        .supportModule header span,.supportModule header em{font-size:9px;color:#708396}
        .supportModule h3{margin:10px 0 4px;font-size:15px;color:#cbd6df}
        .supportModule strong{font-size:11px;color:#aebdca}
        .supportModule p{margin:8px 0 0;color:#8092a5;font-size:11px;line-height:1.45}
        .supportUnavailable{opacity:.48}
        .fieldDirection{display:grid;grid-template-columns:auto minmax(80px,1fr) minmax(0,2fr);gap:14px;align-items:center;padding:18px 0;border-bottom:1px solid #ffffff20}
        .fieldDirection>span{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#b9c6d1}
        .fieldDirection i{display:block;height:1px}
        .fieldDirection p{margin:0;color:#8193a8;font-size:12px}
        .directionConfirmation i{background:#9bb6cc}
        .directionDivergence i{background:linear-gradient(90deg,#9bb6cc 0 43%,transparent 43% 57%,#9bb6cc 57% 100%)}
        .directionLimited i{background:repeating-linear-gradient(90deg,#7f93a5 0 8px,transparent 8px 15px)}
        .memoryAxis{padding-top:28px}
        .memoryAxis>header{display:flex;justify-content:space-between;gap:20px;align-items:end}
        .memoryAxis h3{margin:6px 0 0;font-size:24px}
        .memoryAxis>header>p{margin:0;color:#8193a8}
        .memoryScale{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;margin-top:18px;color:#708396;font-size:9px;letter-spacing:.1em;text-transform:uppercase}
        .memoryScale i{height:1px;background:linear-gradient(90deg,#71869a,#d8e1e8);position:relative}
        .memoryScale i::after{content:"";position:absolute;right:0;top:-3px;width:7px;height:7px;border-top:1px solid #d8e1e8;border-right:1px solid #d8e1e8;transform:rotate(45deg)}
        .memoryTableWrap,.historyTableWrap,.exactMemoryTableWrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}
        table{width:100%;border-collapse:collapse}
        .memoryAxis table{margin-top:12px}
        th,td{text-align:left;border-bottom:1px solid #ffffff12;padding:9px 8px;font-size:11px;vertical-align:top}
        th{color:#9fb0bf;font-weight:700}
        td{color:#bdc8d1}
        .memoryAxis th:first-child,.memoryAxis td:first-child{padding-left:0}
        .memoryAxis th:last-child,.memoryAxis td:last-child{padding-right:0}
        .memoryAxis tbody td:nth-child(3){color:#e4ebf0;font-weight:800}
        .evidenceStack{margin-top:28px}
        .evidenceStack>details{border-top:1px solid #ffffff20;padding:16px 0}
        .evidenceStack>details:last-child{border-bottom:1px solid #ffffff20}
        .evidenceStack>details>summary{cursor:pointer;color:#d5dfe7;font-weight:800;letter-spacing:.02em}
        .evidenceStack p,.evidenceStack li{color:#aebccc;line-height:1.55}
        .moduleEvidenceList{list-style:none;padding:0;margin:18px 0 0}
        .moduleEvidenceList>li{padding:16px 0;border-top:1px solid #ffffff14}
        .moduleEvidenceList header{display:grid;grid-template-columns:40px 1fr auto;gap:12px;align-items:center}
        .moduleEvidenceList header span,.moduleEvidenceList header em{font-size:9px;color:#718496}
        .moduleEvidenceList h3{margin:0;color:#d8e1e8;font-size:13px;letter-spacing:.06em}
        .watchEvidence{display:grid;grid-template-columns:61.803398875fr 38.196601125fr;gap:32px;border-top:1px solid #ffffff18;padding-top:18px}
        .historyTableWrap table,.exactMemoryTableWrap table{min-width:860px;margin-top:12px}
        .historyTableWrap small{display:block;margin-top:4px;color:#718496}
        .methodNote{border-left:2px solid #9bb6cc;padding-left:12px}
        .sourceProof>section{padding-top:18px;border-top:1px solid #ffffff14;margin-top:18px}
        .sourceRows{list-style:none;margin:10px 0 0;padding:0}
        .sourceRows li{display:grid;grid-template-columns:minmax(150px,.8fr) minmax(180px,1fr) auto;gap:10px;padding:10px 0;border-top:1px solid #ffffff12}
        .sourceRows code{grid-column:1/-1;color:#718496;font-size:10px}
        .hashList{display:grid;gap:7px}
        .hashList code,.sourceProof code{display:block;color:#718496;font-size:10px;white-space:normal;word-break:break-word}
        .closingBoundary{padding-top:20px;border-top:1px solid #ffffff20;margin-top:20px}
        .closingBoundary p{color:#8193a8}
        .closingField{height:calc(clamp(128px,12vh,168px) + env(safe-area-inset-bottom));display:grid;place-items:start center;padding-top:48px}
        .closingField span{display:block;width:min(420px,61.803%);height:1px;background:linear-gradient(90deg,transparent,#b9a56a66,transparent)}
        @media(max-width:1080px){
          .metricRibbon>dl{grid-template-columns:repeat(3,minmax(0,1fr))}
          .metricRibbon>dl>div:nth-child(4){border-left:0;padding-left:0}
          .phiPlane,.executiveField,.readingHeader{grid-template-columns:1fr}
          .readingHeader dl{max-width:620px}
          .executiveContext{border-left:0;border-top:1px solid #ffffff20;padding:18px 0 0}
          .primaryField{padding-right:0}
          .supportBand{border-left:0;border-top:1px solid #ffffff20;padding-left:0}
          .watchEvidence{grid-template-columns:1fr}
        }
        @media(max-width:800px){
          /* BTC_MOBILE_SCROLL_CLEARANCE_V0_1 */
          :global(html){scroll-padding-top:calc(108px + env(safe-area-inset-top));}
          .questionPanel,.questionPanel [id],.readingZone,.readingZone [id],.phiModule,.btcAxis,.memoryAxis,.evidenceStack>details{scroll-margin-top:calc(108px + env(safe-area-inset-top));scroll-margin-bottom:calc(96px + env(safe-area-inset-bottom));}
          main{padding-inline:12px}
          .questionPanel>header,.zoneHeading,.memoryAxis>header{display:grid}
          .observation,.zoneHeading>p{text-align:left}
          form{grid-template-columns:1fr}
          .metricRibbon>dl{grid-template-columns:1fr 1fr}
          .metricRibbon>dl>div:nth-child(odd){border-left:0;padding-left:0}
          .executivePrimary dl{grid-template-columns:1fr}
          .supportBand{grid-template-columns:1fr}
          .supportModule,.supportModule:nth-child(odd),.supportModule:nth-child(even),.supportModule:last-child{grid-column:auto;border-right:0;padding-left:0;padding-right:0}
          .fieldDirection{grid-template-columns:auto 1fr}.fieldDirection p{grid-column:1/-1}
          .sourceRows li{grid-template-columns:1fr}.sourceRows code{grid-column:auto}
        }
        @media(max-width:520px){
          .metricRibbon>dl{grid-template-columns:1fr}
          .metricRibbon>dl>div{border-left:0;padding-left:0}
          .readingHeader h2{font-size:30px}
          .primaryModule{grid-template-columns:34px 1fr}
          .btcAxis span{font-size:64px}
          .memoryAxis table{min-width:620px}
          .closingField{height:calc(128px + env(safe-area-inset-bottom))}
        }
      `}</style>
    </>
  );
}
