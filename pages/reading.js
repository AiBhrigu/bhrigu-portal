import { computeTemporalSnapshot } from "../lib/frey_temporal_snapshot"
import { freyTemporalAnalysis } from "../lib/frey_temporal_analysis"
import { composeReadingV2 } from "../lib/contracts/reading-compose-v2"

export async function getServerSideProps(context) {
  const { date } = context.query

  const targetDate =
    typeof date === "string" && date.length > 0
      ? date
      : new Date().toISOString().slice(0, 10)

  const snapshot = computeTemporalSnapshot(targetDate)
  const analysis = freyTemporalAnalysis(snapshot)

  const raw = {
    engine: "frey-temporal-core-v0.1",
    ...snapshot,
    analysis
  }

  const adapted = {
    ...raw,
    core: raw,
    derived: raw.analysis || {}
  }

  const traceId = `trace_${Date.now()}`
  const composed = composeReadingV2(adapted, traceId)

  return {
    props: {
      snapshot_date: targetDate,
      reading: composed,
      surface_marker: "READING_V2_SURFACE_V0_4"
    }
  }
}

export default function Reading({ snapshot_date, reading, surface_marker }) {
  return (
    <div data-reading-surface="READING_V2_SURFACE_V0_4">
      <h1>Reading v2 Canonical</h1>

      <section>
        <h3>Snapshot Anchor</h3>
        <p>{snapshot_date}</p>
      </section>

      <section>
        <h3>Structural Metrics</h3>
        <pre>{JSON.stringify(reading?.meta_metrics || {}, null, 2)}</pre>
      </section>

      <section>
        <h3>System State</h3>
        <pre>{JSON.stringify(reading?.system_state || {}, null, 2)}</pre>
      </section>

      <section>
        <h3>Interpretation</h3>
        <pre>{JSON.stringify(reading?.summary || "", null, 2)}</pre>
      </section>

      <div id="surface-marker">{surface_marker}</div>
    </div>
  )
}
