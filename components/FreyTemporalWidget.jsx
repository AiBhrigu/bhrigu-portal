import { useState } from "react";

export default function FreyTemporalWidget() {
  const [date, setDate] = useState("");
  const [result, setResult] = useState(null);

  async function handleRun() {
    if (!date) return;
    const res = await fetch(`/api/frey-temporal?date=${date}`);
    const data = await res.json();
    setResult(data);
  }

  return (
    <div style={{ marginTop: "32px" }}>
      <h3>Temporal Snapshot</h3>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{ padding: "6px", marginRight: "8px" }}
      />
      <button onClick={handleRun} style={{ padding: "6px 10px" }}>
        Run
      </button>
      {result && (
        <pre style={{ marginTop: "16px" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
