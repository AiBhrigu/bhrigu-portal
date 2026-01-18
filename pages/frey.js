import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

export default function Frey() {
  const box = { maxWidth: 920, margin: "0 auto", padding: "48px 20px", lineHeight: 1.6 };
  const h1 = { fontSize: "40px", margin: "0 0 12px 0" };
  const lead = { opacity: 0.88, margin: "0 0 22px 0" };
  const card = {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 18,
    margin: "14px 0",
    background: "rgba(0,0,0,0.25)",
  };
  const kbd = {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 13,
    padding: "2px 8px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.05)",
    display: "inline-block",
  };
  const btn = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.18)",
    textDecoration: "none",
    background: "rgba(255,255,255,0.06)",
    marginRight: 10,
    cursor: "pointer",
  };
  const taStyle = {
    width: "100%",
    minHeight: 164,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.30)",
    color: "#fff",
    padding: 14,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 13,
    outline: "none",
  };

  const [localStatus, setLocalStatus] = useState({ ok: null, ms: null });
  const [promptText, setPromptText] = useState("");
  const [preview, setPreview] = useState("");

  const defaultLine = useMemo(() => {
    return (
      "FREY_FREE_LINE v1.0\n" +
      "GOAL: <1 sentence>.\n" +
      "CONTEXT: <2-4 facts>.\n" +
      "CONSTRAINTS: <limits / what not to do>.\n" +
      "OUTPUT: <format: 3 steps + one stop condition>."
    );
  }, []);

  useEffect(() => {
    // init textarea once
    setPromptText((v) => (v && v.trim() ? v : defaultLine));

    // lightweight local probe (optional) — does NOT call any core logic
    const ctrl = new AbortController();
    const t0 = performance.now();
    fetch("http://127.0.0.1:8811/ping", { signal: ctrl.signal })
      .then((r) => r.ok)
      .then((ok) => setLocalStatus({ ok, ms: Math.round(performance.now() - t0) }))
      .catch(() => setLocalStatus({ ok: false, ms: null }));
    return () => ctrl.abort();
  }, [defaultLine]);

  const copyToClipboard = async (text) => {
    const t = (text || "").trim();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      return;
    } catch (_) {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

  const parseLine = (raw) => {
    const lines = String(raw || "")
      .split("\n")
      .map((s) => s.trim());
    const get = (key) => {
      const hit = lines.find((l) => l.toUpperCase().startsWith(key + ":"));
      return hit ? hit.slice(key.length + 1).trim() : "";
    };
    return {
      goal: get("GOAL"),
      context: get("CONTEXT"),
      constraints: get("CONSTRAINTS"),
      output: get("OUTPUT"),
    };
  };

  const buildDemoAnswer = () => {
    const p = parseLine(promptText);
    const goal = p.goal || "(goal missing)";
    const ctx = p.context || "(context missing)";
    const cons = p.constraints || "(constraints missing)";
    const out = p.output || "3 steps + 1 stop condition";

    return [
      "L0 — Result:",
      `Align to GOAL: ${goal}.`,
      "",
      "L1 — Context & constraints:",
      `Context accepted: ${ctx}.`,
      `Constraints respected: ${cons}.`,
      "",
      "L2 — Next steps (demo skeleton):",
      "• Step 1: Clarify the smallest executable action for today.",
      "• Step 2: Run one safe check / deliver one artifact.",
      "• Step 3: Publish / share / test with a real user.",
      `STOP: if you cannot meet the requested OUTPUT (${out}) without adding hidden assumptions.`,
    ].join("\n");
  };

  return (
    <>
      <Head>
        <title>Frey</title>
      </Head>
      <main style={box}>
        <div style={{ ...kbd, marginBottom: 10 }}>
          /frey · Release v0.1 · {localStatus.ok === null ? "local: …" : localStatus.ok ? `local: OK (${localStatus.ms}ms)` : "local: OFF"}
        </div>

        <h1 style={h1}>Frey</h1>
        <p style={lead}>
          Structure your request. Get usable answers. <span style={{ opacity: 0.7 }}>(Frey = public surface + API orbit + safety rules.)</span>
        </p>

        <div style={card}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>FREE LINE</div>
          <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} style={taStyle} spellCheck={false} />

          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button style={btn} onClick={() => copyToClipboard(promptText)}>
              Copy
            </button>
            <button style={btn} onClick={() => setPromptText(defaultLine)}>
              Reset
            </button>
            <button
              style={{ ...btn, borderColor: "rgba(255,215,0,0.35)", background: "rgba(255,215,0,0.08)" }}
              onClick={() => setPreview(buildDemoAnswer())}
            >
              Preview answer
            </button>
            <button style={btn} onClick={() => copyToClipboard(preview)}>
              Copy preview
            </button>
          </div>

          <div style={{ marginTop: 10, opacity: 0.7, fontSize: 13 }}>
            Flow: fill → copy → paste into any AI chat. (Preview is a demo skeleton, no API call.)
          </div>
        </div>

        {preview ? (
          <div style={card}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>PREVIEW (Demo)</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{preview}</pre>
          </div>
        ) : null}

        <details style={card}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>How to use (30s)</summary>
          <div style={{ marginTop: 12 }}>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              <li>
                Write <b>GOAL</b> in 1 sentence.
              </li>
              <li>
                Add <b>CONTEXT</b> (2–4 facts).
              </li>
              <li>
                Set <b>CONSTRAINTS</b> (what not to do).
              </li>
              <li>
                Specify <b>OUTPUT</b> (format).
              </li>
              <li>
                Copy → paste into your AI chat → get the real answer.
              </li>
            </ol>
          </div>
        </details>

        <details style={card}>
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Safety / IP</summary>
          <div style={{ marginTop: 12, opacity: 0.88 }}>
            Frey is a boundary: it shows <b>structure and rules</b>, not internal methods. Public layer stays clean.
          </div>
        </details>

        <details style={card} id="docs">
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>API (dev)</summary>
          <div style={{ marginTop: 12, opacity: 0.88 }}>
            Local API docs: <a href="http://127.0.0.1:8811/docs">http://127.0.0.1:8811/docs</a>
            <div style={{ marginTop: 8, opacity: 0.75, fontSize: 13 }}>
              Endpoints (local): <span style={kbd}>/ping</span> · <span style={kbd}>/phi-passport</span> · <span style={kbd}>/match-user-asset</span> · <span style={kbd}>/event-log</span>
            </div>
          </div>
        </details>

        <div style={{ marginTop: 18, opacity: 0.75, fontSize: 13 }}>
          GitHub: <a href="https://github.com/AiBhrigu">github.com/AiBhrigu</a>
        </div>
      </main>
    </>
  );
}
