import React from "react"

export default function Reading({ engineData, engine_status }) {
  const isUnavailable = engine_status === "unavailable"

  return (
    <main>
      {isUnavailable ? (
        <div>Temporal engine temporarily unavailable.</div>
      ) : (
        <pre>{JSON.stringify(engineData, null, 2)}</pre>
      )}
    </main>
  )
}

export async function getServerSideProps({ req, query }) {
  try {
    const protocol =
      req.headers["x-forwarded-proto"] || "http"

    const host = req.headers.host
    const baseUrl = `${protocol}://${host}`

    const date = query.date || null

    const res = await fetch(
      `${baseUrl}/api/frey-temporal`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date })
      }
    )

    if (!res.ok) {
      return {
        props: { engineData: null, engine_status: "unavailable" }
      }
    }

    const data = await res.json()

    return {
      props: {
        engineData: data,
        engine_status: "live"
      }
    }
  } catch (e) {
    return {
      props: { engineData: null, engine_status: "unavailable" }
    }
  }
}
