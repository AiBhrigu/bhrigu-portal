import Head from "next/head";
import { useEffect, useState } from "react";

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
  };
  const btnPrimary = {
    ...btn,
    background: "linear-gradient(135deg, rgba(255,215,0,0.22), rgba(255,255,255,0.06))",
    border: "1px solid rgba(255,215,0,0.35)",
  };
  const small = { opacity: 0.78, fontSize: 13 };

  const [localStatus, setLocalStatus] = useState("CHECKING");
    const [promptText, setPromptText] = useState("");

  
    // Copy helper (SSR-safe: defined during prerender; clipboard runs only on click in browser)
    const buildFreyLine = (t) => {
      const v = (t || "").trim();
      return v || `ЦЕЛЬ: ...
КОНТЕКСТ: ...
ОГРАНИЧЕНИЯ: ...
ВЫХОД: ...`;
    };

    const copyFreyLine = async () => {
      const text = buildFreyLine(promptText);
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return;
        }
        if (typeof document === "undefined") return;
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch (e) {}
    };
useEffect(() => {
    const ctrl = new AbortController();
    fetch("http://127.0.0.1:8811/ping", { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => setLocalStatus("GREEN"))
      .catch(() => setLocalStatus("RED"));
    const copyLine = async () => {
      const text = promptText || "";
      try { await navigator.clipboard.writeText(text); return; } catch (e) {}
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      } catch (e) {}
    };

    return () => ctrl.abort();
  }, []);

  return (
    <>
      <Head>
        <title>Frey · Release v0.1</title>
        <meta name="description" content="Frey — публичный интерфейс Φ-системы ORION (portal / local), Release v0.1" />
      </Head>

      <main style={box}>
        <div style={{ marginBottom: 18 }}>
          <div style={small}><span style={kbd}>/frey</span> · Release v0.1 · Φ</div>
          <h1 style={h1}>Frey</h1>
          <p style={lead}>
              Frey — публичная навигация: 3 шага + стоп-условия. Без раскрытия внутренних методов.
            </p>

            <div style={{ margin: "10px 0 18px 0" }}>
              <div style={small}><span style={kbd}>СТРОКА</span></div>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
placeholder={`ЦЕЛЬ: ...\nКОНТЕКСТ: ...\nОГРАНИЧЕНИЯ: ...\nВЫХОД: ...`}
                style={{
                  width: "100%",
                  minHeight: 120,
                  margin: "8px 0 0 0",
                  padding: "12px 14px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(0,0,0,0.25)",
                  color: "inherit",
                  resize: "vertical",
                  whiteSpace: "pre-wrap",
                  fontFamily: kbd.fontFamily,
                  fontSize: 13,
                }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                <button onClick={copyFreyLine} style={{ ...btn, cursor: "pointer" }}>Copy</button>
                <button onClick={() => setPromptText("")} style={{ ...btn, cursor: "pointer", opacity: 0.85 }}>Clear</button>
                <div style={{ ...small, opacity: 0.72, alignSelf: "center" }}>Вводи здесь → Copy → вставь в чат.</div>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <a href="#docs" style={btnPrimary}>Details</a>
            </div>
        </div>

        <details id="docs" style={card}>
          <summary>Как пользоваться</summary>
          <ol>
            <li>Открой <span style={kbd}>/frey</span> на портале.</li>
            <li>Прочитай Docs (публичный режим).</li>
            <li>Если Frey запущен локально — нажми <b>Open Local</b>.</li>
          </ol>

            <div style={{ marginTop: 12 }}>
              <a href="http://127.0.0.1:8811/docs" target="_blank" rel="noreferrer" style={btn}>
                Open Local
              </a>
            </div>

            <div style={{ ...small, marginTop: 10 }}>
              Local Mode (optional):&nbsp;
              <b style={{ color: localStatus === "GREEN" ? "#6f6" : localStatus === "RED" ? "#f66" : "#ccc" }}>
                {localStatus}
              </b>
              &nbsp;· работает только если Frey запущен локально (127.0.0.1).
            </div>
        </details>

        <details style={card}>
          <summary>Safety / IP</summary>
          <p>
            Публичный Frey не раскрывает формулы, алгоритмы и приватные пайплайны.
            Любые вопросы “как считается” — RED и получают безопасный фоллбек.
          </p>
        </details>

        <div style={{ ...small, marginTop: 18 }}>
          /api на портале выключен (410). Публичная поверхность — только навигация и правила.
        </div>
      </main>
    </>
  );
}
