import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const API = "/api/btc/research-field/v1";
type StatePayload = any;
type Turn = { question: string; result: any };

export default function BtcResearchFieldPreviewPage() {
  const router = useRouter();
  const [state, setState] = useState<StatePayload | null>(null);
  const [status, setStatus] = useState("Opening private field…");
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const fieldId = typeof router.query.fieldId === "string" ? router.query.fieldId : "";
  const loadState = useCallback(async () => {
    const response = await fetch(`${API}/state`, { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("PRIVATE_FIELD_UNAVAILABLE");
    const payload = await response.json();
    setState(payload);
    setStatus("");
    return payload;
  }, []);

  useEffect(() => {
    if (!router.isReady || !fieldId) return;
    let cancelled = false;
    (async () => {
      try {
        const secret = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
        if (secret) {
          const session = await fetch(`${API}/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ fieldId, secret }),
          });
          if (!session.ok) throw new Error("PRIVATE_FIELD_UNAVAILABLE");
          history.replaceState(null, "", `${location.pathname}${location.search}`);
        }
        if (!cancelled) await loadState();
      } catch {
        if (!cancelled) setStatus("Private Research Field unavailable. Open it from the original private link.");
      }
    })();
    return () => { cancelled = true; };
  }, [router.isReady, fieldId, loadState]);

  const priorTurns = useMemo(() => turns.slice(-12).map((turn) => ({
    user: turn.question,
    assistant: turn.result.answer,
    topic: turn.result.topic,
  })), [turns]);

  async function activatePreview() {
    setBusy(true);
    try {
      const response = await fetch(`${API}/activate-preview`, { method: "POST", credentials: "same-origin" });
      if (!response.ok) throw new Error("ACTIVATION_FAILED");
      await loadState();
    } catch {
      setStatus("Preview activation failed.");
    } finally { setBusy(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const clean = question.trim();
    if (!clean || busy) return;
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ question: clean, priorTurns }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.code || "CHAT_FAILED");
      setTurns((current) => [...current, { question: clean, result: payload }]);
      setLastResult({ question: clean, result: payload });
      setQuestion("");
      await loadState();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Research Field runtime unavailable.");
    } finally { setBusy(false); }
  }

  async function keep(role: "BASELINE" | "CHECKPOINT") {
    if (!lastResult || busy) return;
    setBusy(true);
    try {
      const response = await fetch(`${API}/checkpoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ role, question: lastResult.question, result: lastResult.result }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.code || "CHECKPOINT_FAILED");
      setStatus(role === "BASELINE" ? "Accepted as field baseline." : "Checkpoint kept.");
      await loadState();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Checkpoint unavailable.");
    } finally { setBusy(false); }
  }

  const field = state?.field;
  return <>
    <Head>
      <title>BTC Research Field · Preview · BHRIGU</title>
      <meta name="robots" content="noindex,nofollow,noarchive" />
    </Head>
    <main className="page">
      <section className="shell">
        <div className="eyebrow">BTC RESEARCH FIELD · PRIVATE PREVIEW</div>
        <h1>{field?.title || "Private Bitcoin research continuity"}</h1>
        <p className="lead">Same BTC Cosmographer intelligence. Durable accepted baseline and checkpoints across sessions.</p>
        <div className="boundary">No account · private link is the key · fake Preview entitlement only · real BTC payment is disabled</div>

        {status && <div className="notice">{status}</div>}
        {field && <div className="stateGrid">
          <div><small>Status</small><strong>{field.status}</strong></div>
          <div><small>Turns</small><strong>{field.completedTurns} / 120</strong></div>
          <div><small>Baseline</small><strong>{state.baseline ? "accepted" : "not set"}</strong></div>
          <div><small>Service end</small><strong>{field.serviceEnd ? new Date(field.serviceEnd).toLocaleString() : "after activation"}</strong></div>
        </div>}

        {field?.status === "PENDING_PAYMENT" && <section className="panel">
          <h2>Payment gate simulation</h2>
          <p>This Preview action simulates confirmed entitlement. It creates no quote, address, transaction, or real Bitcoin movement.</p>
          <button disabled={busy} onClick={activatePreview}>Activate fake 30-day Preview</button>
        </section>}

        {field?.active && <>
          <section className="panel fieldFrame">
            <div><small>Primary question</small><p>{field.primaryQuestion}</p></div>
            {field.timeHorizon && <div><small>Time horizon</small><p>{field.timeHorizon}</p></div>}
            <div><small>Evidence preferences</small><p>{field.evidencePreferences.join(" · ") || "Cosmographer default"}</p></div>
          </section>

          <section className="dialogue">
            {turns.map((turn, index) => <div className="turn" key={`${index}-${turn.question}`}>
              <div className="user">{turn.question}</div>
              <div className="assistant"><span>Φ</span><div>{turn.result.answer}</div></div>
            </div>)}
          </section>

          {lastResult && <div className="checkpointActions">
            {!state.baseline && <button disabled={busy} onClick={() => keep("BASELINE")}>Accept as baseline</button>}
            {state.baseline && <button disabled={busy} onClick={() => keep("CHECKPOINT")}>Keep checkpoint</button>}
          </div>}

          <form onSubmit={submit} className="composer">
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500} placeholder="Ask what changed…" rows={3} />
            <button disabled={busy || !question.trim()}>{busy ? "Working…" : "Ask Cosmographer"}</button>
          </form>
        </>}
      </section>
      <style jsx>{`
        .page{min-height:100vh;background:#07111b;color:#eaf1f7;padding:32px 18px 64px;font-family:Inter,system-ui,sans-serif}.shell{max-width:900px;margin:0 auto}.eyebrow,small{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#d8ad62}h1{font-size:clamp(34px,6vw,58px);line-height:1;margin:14px 0}.lead{max-width:720px;color:#afbcc7;font-size:17px;line-height:1.6}.boundary,.notice,.panel,.stateGrid,.composer{border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.035);border-radius:16px}.boundary,.notice{padding:12px 15px;margin:18px 0;color:#b8c5cf}.notice{border-color:rgba(216,173,98,.4)}.stateGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;overflow:hidden;margin:18px 0}.stateGrid>div{padding:16px;background:#0a1723;display:grid;gap:7px}.stateGrid strong{font-size:14px}.panel{padding:20px;margin:18px 0}.panel h2{margin-top:0}.panel p{color:#afbcc7;line-height:1.55}.fieldFrame{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.fieldFrame p{margin:7px 0 0}.dialogue{display:grid;gap:18px;margin:26px 0}.turn{display:grid;gap:12px}.user{justify-self:end;max-width:80%;padding:11px 14px;border-radius:14px;background:#152536}.assistant{display:flex;gap:12px;line-height:1.6;white-space:pre-wrap}.assistant span{color:#d8ad62;font-size:22px}.checkpointActions{display:flex;gap:10px;margin:18px 0}.composer{padding:12px;display:grid;grid-template-columns:1fr auto;gap:10px}.composer textarea{resize:vertical;min-height:72px;background:transparent;border:0;color:#eef4f8;padding:10px;font:inherit;outline:0}button{border:1px solid rgba(216,173,98,.6);background:#172536;color:#f3dfb7;border-radius:12px;padding:11px 15px;font-weight:650;cursor:pointer}button:disabled{opacity:.45;cursor:default}@media(max-width:700px){.stateGrid,.fieldFrame{grid-template-columns:1fr 1fr}.composer{grid-template-columns:1fr}.user{max-width:92%}}@media(max-width:440px){.stateGrid,.fieldFrame{grid-template-columns:1fr}}
      `}</style>
    </main>
  </>;
}
