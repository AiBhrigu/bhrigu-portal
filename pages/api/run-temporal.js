export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const engineRes = await fetch("http://127.0.0.1:8811/run-temporal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    })

    if (!engineRes.ok) {
      return res.status(503).json({ error: "Engine unavailable" })
    }

    const data = await engineRes.json()
    return res.status(200).json(data)

  } catch (e) {
    return res.status(503).json({ error: "Engine unreachable" })
  }
}
