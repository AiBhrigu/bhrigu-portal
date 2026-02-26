import { interpretReading } from "../lib/reading-interpretation"

export async function getServerSideProps(context) {
  const { date } = context.query

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.bhrigu.io"}/api/frey-temporal?date=${date || ""}`
  )

  const raw = await res.json()

  const interpreted = interpretReading(raw)

  return {
    props: {
      reading: interpreted
    }
  }
}

export default function ReadingPage({ reading }) {
  if (!reading || reading.status !== "ok") {
    return (
      <div style={{ padding: 40 }}>
        <h2>Reading unavailable</h2>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Reading v2</h1>
      <p>Status: {reading.status}</p>
      <p>Summary: {reading.summary}</p>
      <p>Metrics Count: {reading.metricsCount}</p>
    </div>
  )
}
