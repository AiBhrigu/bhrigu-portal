import BhriguPhiHeader from "../components/BhriguPhiHeader"
import { deriveReading } from "../lib/reading-derive"

export async function getServerSideProps(context) {
  const { date } = context.query || {}
  const qs = date ? `?date=${date}` : ""
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "https://www.bhrigu.io"}/api/frey-temporal${qs}`)
  const core = await res.json()
  const derived = deriveReading(core)

  return {
    props: {
      core,
      derived
    }
  }
}

export default function Reading({ core, derived }) {
  return (
    <>
      <BhriguPhiHeader />
      <main style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
        <h1>Reading</h1>

        <section>
          <h2>Core Metrics</h2>
          <pre>{JSON.stringify(core, null, 2)}</pre>
        </section>

        <section style={{ marginTop: "32px" }}>
          <h2>Derived State</h2>
          <pre>{JSON.stringify(derived, null, 2)}</pre>
        </section>

        <section style={{ marginTop: "32px" }}>
          <button disabled>Export (coming soon)</button>
        </section>
      </main>
    </>
  )
}
