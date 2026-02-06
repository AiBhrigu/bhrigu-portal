import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

// UI-only guard: local no-op (build-safe)
const freyUiOnlyAssert = () => {};
export default function FreyPage() {
  // Local query queue (UI-only, persisted in browser storage)
  const FREY_QUEUE_KEY = "frey_queue_v0_5";
  const [freyQueue, setFreyQueue] = useState([]);
  const qQueueRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FREY_QUEUE_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) setFreyQueue(arr.slice(0, 12));
    } catch (_) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FREY_QUEUE_KEY, JSON.stringify(freyQueue.slice(0, 12)));
    } catch (_) {}
  }, [freyQueue]);

  const freyQueueAdd = (raw) => {
    const t = String(raw || "").trim();
    if (!t) return;
    const text = t.length > 240 ? t.slice(0, 240) + "…" : t;
    const now = new Date();
    const item = {
      id: now.getTime().toString(36) + "-" + Math.random().toString(36).slice(2, 8),
      when: now.toISOString().replace("T", " ").slice(0, 19) + "Z",
      text,
    };
    setFreyQueue((prev) => {
      const p = Array.isArray(prev) ? prev : [];
      if (p.length && p[0] && p[0].text === text) return p;
      return [item, ...p].slice(0, 12);
    });
  };

  const freyQueueAddFromRef = () => {
    const el = qQueueRef.current;
    const v = el && el.value ? el.value : "";
    freyQueueAdd(v);
    if (el) el.value = "";
  };

  const freyQueueClear = () => setFreyQueue([]);

  freyUiOnlyAssert();


  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState("");
  // __FREY_RUNQUERY_DEFINED_FIX_V0_1__
  const runQuery = () => {
    // UI-only: route to /reading with q param (no network, no public routes)
    if (typeof window === "undefined") return;
    const q = String(query || "").trim();
    if (!q) return;
    window.location.href = `/reading?q=${encodeURIComponent(q)}`;
  };

  // alias for build safety: legacy JSX expects (query,setQuery)
  

  const EXAMPLES = [
    "human ↔ project: where are we now and what is the next step?",
    "human ↔ asset: what is the risk/support tone for the next 30 days?",
    "human ↔ human: what is the friction point and how to navigate it?",
  ];

  const submit = () => {
    const s = (query || "").trim();
    if (!s) return;
    router.push(`/reading?query=${encodeURIComponent(s)}`);
  };

  const copy = async () => {
    const text =
`FREY · Query template

GOAL: …
CONTEXT: …
CONSTRAINTS: …
EXIT: …`;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert("Copied");
      } else {
        alert("Copy not supported in this browser");
      }
    } catch {
      alert("Copy failed");
    }
  };

  
  // Φ-QUERYBAR: local-only query drafting (no network)
  const [freyQuery, setFreyQuery] = useState("");
  const [freyDraft, setFreyDraft] = useState("");
  const [freyCopied, setFreyCopied] = useState(false);

  const freyTemplates = [
    
    { label: "Протокол Φ", value: "Напомни Protocol: UI-only v0.1, гейты, STOP-условия и как правильно работать через АТОМы." },
{ label: "Что такое Frey?", value: "Что такое Frey? Дай коротко: что он делает и где границы v0.1." },
    { label: "Как получить доступ?", value: "Как получить доступ к Frey? Какие шаги и ограничения v0.1?" },
    { label: "Маршрут", value: "Дай маршрут для новичка: /start → /reading → /access. Что читать и в каком порядке?" },
  ];

  const onFreyTemplate = (v) => {
    setFreyQuery(v);
    setFreyCopied(false);
  };

  const onFreyClear = () => {
    setFreyQuery("");
    setFreyDraft("");
    setFreyCopied(false);
  };

  const onFreyQuerySubmit = (e) => {
    e.preventDefault();
    const v = (freyQuery || "").trim();
    setFreyDraft(v);
    setFreyCopied(false);
  };

  const onFreyCopy = async () => {
    const v = (freyQuery || "").trim();
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
      setFreyCopied(true);
    } catch (_) {
      setFreyCopied(false);
    }
  };
  return (
    <>
      <Head>
        <title>Frey · BHRIGU</title>
        <meta
          name="description"
          content="Frey — dialog interface for cosmography. Query-first navigation through time, cycles and scenarios."
        />
      </Head>

      {/*__FREY_ASKFREY_PREMIUM_V1_0_3__*/}

      {/*__FREY_COPY_TEMPLATE_REMOVE_V1_1__*/}

      <main className="wrap">
        <header className="hero">
          <div id="phi-frey-entry" className="kicker"><span>BHRIGU</span> · <span>Frey</span> · <span>ORION</span></div>
          <p className="subtitle">
            Dialog interface for cosmography: query-first navigation through time, cycles, links and scenarios.
          </p>
        </header>

        {/*__FREY_QUERY_LINE_V1__*/}
        {/*__FREY_QUERY_LINE_V1_CONTRAST__*/}
        <section className="card askFreyBox">
          <h2>Ask Frey (pilot)</h2>
          <p className="muted">
            UI-only v1. Your question stays in your browser — we just open the next route.
          </p>

          <div className="qRow">
            <input
              className="qInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="Type a question…"
              aria-label="Frey query"
            />
            <button className="btn btnCta" onClick={submit} disabled={!query.trim()}>Continue → Reading</button>
          </div>

          
            {/* __FREY_DOMAIN_ROW_V0_1__ */}
            <div className="domainsWrap" aria-label="Frey quick domains">
              <a className="domainLink" href="/start">Start</a>
              <span className="domainSep">·</span>
              <a className="domainLink" href="/reading">Reading</a>
              <span className="domainSep">·</span>
              <a className="domainLink" href="/access">Access</a>
              <span className="domainSep">·</span>
              <a className="domainLink" href="/github">GitHub</a>
            </div>
<div className="chips">
            {EXAMPLES.map((t) => (
              <button
                key={t}
                className="chip"
                onClick={() => setQuery(t)}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>

          
          <div className="mt-6 w-full max-w-2xl">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Ask Frey… (signals, cycles, assets)"
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/20"
                        />
                        <button
                          onClick={runQuery}
                          className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/15"
                        >
                          Ask
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-white/50">
                        
                      </div>
                      {error ? (
                        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                          {error}
                        </div>
                      ) : null}
                      {answer ? (
                        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white/90">
                          {answer}
                        </div>
                      ) : null}
                    </div>
                  </div>


          <p className="micro">
            Not ready? <a href="/start">Start</a> · <a href="/reading">Reading</a> · <a href="/faq">FAQ</a>
          </p>
        </section>

        
        <details className="fold" open={false}>
          <summary className="foldSummary">More (optional)</summary>
          <div className="foldBody">


          <section className="card">
            <h2>Optional: compact schema (AI-ready)</h2>
            <pre className="pre">human ↔ human → resonance / dynamics / tendencies
human ↔ project → phases / entry-exit windows / friction points
human ↔ asset → timing / risk-support tone / cycles
author ↔ style → amplification vs dilution / peaks
user ↔ scenario → relevance / maturity / decision nodes</pre>

            <div className="nav">
              <a className="btn" href="/start">Start</a>
              <span>Frey</span>
              <a className="btn" href="/faq">FAQ</a>
              <a className="btn" href="/reading">Reading</a>
            </div>
          </section>


          <section className="card">
            <h2>Start in 1 minute</h2>
            <ol className="ol">
              <li><strong>Open Frey</strong> → ask one link (human↔human / human↔project / human↔asset).</li>
              <li><strong>Add time</strong> (date / month / window).</li>
              <li><strong>Read it as</strong>: phases → windows → support/tension → next step.</li>
            </ol>
          </section>


        <section className="card">
          <h2>What Frey is</h2>
          <ul>
            <li>Query-first: one request → one structured output.</li>
            <li>Navigation in time: phases, windows, transitions.</li>
            <li>Works with links: human ↔ human, human ↔ project, human ↔ asset, author ↔ style, user ↔ scenario.</li>
          </ul>
        </section>
      {/*__FREY_COPY_TEMPLATE_REMOVED_V1__*/}
<section className="card">
          <h2>Public surface</h2>
          <p>
            This page is UI-only. API routes can be disabled on the public portal by design.
          </p>
        </section>
          </div>
        </details>


      

      
      {/* Φ-QUERYBAR: UI-only query drafting (pilot) */}
      <section style={{ marginTop: 28, padding: 18, border: "1px solid rgba(255,255,255,0.10)", borderRadius: 14, color: "rgba(255,255,255,0.92)", caretColor: "rgba(255,255,255,0.92)"}}>
        <h2 style={{ margin: 0, display: "flex", alignItems: "baseline", gap: 10 }}><span>Query Bar (pilot)</span><span style={{ fontSize: 12, opacity: 0.65 }}>PHI surface v0.3</span></h2>
        <p style={{ marginTop: 10, opacity: 0.85 }}>
          UI-only v0.1: локальный черновик запроса. Никаких сетевых вызовов, никаких API, никаких токенов.
        </p>


        <span data-phi-marker="FREY_SURFACE_CANON_V0_3" style={{ display: "none" }}>FREY_SURFACE_CANON_V0_3</span>
        <span style={{ display: "none" }}>PHI_SURFACE_V0_3</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {freyTemplates.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => onFreyTemplate(t.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "transparent",
                fontSize: 13,
                opacity: 0.9,
              }}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onFreyClear}
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "transparent",
              fontSize: 13,
              opacity: 0.75,
            }}
          >
            Clear
          </button>
        </div>
        <form onSubmit={onFreyQuerySubmit} style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <input
            value={freyQuery}
            onChange={(e) => setFreyQuery(e.target.value)}
            placeholder="Спроси про /reading, /access, ORION, правила…"
            style={{ flex: "1 1 320px", minWidth: 240, padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "transparent",
            color: "rgba(255,255,255,0.92)",
            caretColor: "rgba(255,255,255,0.92)" }}
          />
          <button type="submit" disabled={!freyQuery.trim()} style={{ padding: "12px 14px", borderRadius: 12 }}>
            Draft
          </button>
          <button type="button" onClick={onFreyCopy} disabled={!freyQuery.trim()} style={{ padding: "12px 14px", borderRadius: 12 }}>
            {freyCopied ? "Copied" : "Copy"}
          </button>
        </form>

        {(freyDraft || freyQuery) ? (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)" }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Draft</div>
            <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, marginBottom: 0, fontSize: 14 }}>{freyDraft || freyQuery}</pre>
          </div>
        ) : null}

        <details className="fold" style={{ marginTop: 14 }}>
          <summary className="foldSummary">Boundaries</summary>
          <ul style={{ marginTop: 10, lineHeight: 1.45, opacity: 0.9 }}>
            <li>UI-only v0.1 — <b>нет</b> сетевых вызовов, <b>нет</b> публичных public routes.</li>
            <li>Поле ввода локальное: текст остаётся в браузере.</li>
            <li>Когда появятся реальные ответы — они будут за гейтами Trust/epistemic/IP.</li>
          </ul>
        </details>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <a href="/start" style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)" }}>Start</a>
          <a href="/access" style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)" }}>Access</a>
        </div>
      </section>

</main>
      
        <section className="freyQueue" data-mark="FREY_QUERY_QUEUE_LOCAL_V0_6" data-phi-mark="FREY_QUERY_QUEUE_STUB_V0_2" aria-label="Local query queue">
          <div className="qTop">
            <div className="qTitle">Local Query Queue</div>
            <div className="qSub">UI-only: saved in this browser (local storage). No network.</div>
          </div>

          <div className="qComposer">
            <input
              ref={qQueueRef}
              className="qQueueInput"
              type="text"
              placeholder="Save a query locally (no network)"
            />
            <button type="button" className="qBtn" onClick={freyQueueAddFromRef}>
              Add
            </button>
            <button type="button" className="qBtn qBtnGhost" onClick={freyQueueClear}>
              Clear
            </button>
            <span className="qMarkLocal" aria-hidden="true">FREY_QUERY_QUEUE_LOCAL_V0_5</span>
          </div>

          <div className="qList" role="list">
            {freyQueue.length === 0 ? (
              <div className="qEmpty">Queue is empty.</div>
            ) : (
              freyQueue.map((it) => (
                <div key={it.id} className="qItem" role="listitem">
                  <div className="qWhen">{it.when}</div>
                  <div className="qText">{it.text}</div>
                </div>
              ))
            )}
          </div>
        </section>

<style jsx>{`
          /*__FREY_ASKFREY_PREMIUM_V1_0_3__*/
          
/*__PHI_marks_V1_0__*/
:root{ --phi-1:1px;--phi-8:8px; --phi-13:13px; --phi-21:21px; --phi-34:34px; --phi-55:55px; --phi-line:1px; --phi-r-13:13px; --phi-r-21:21px; --phi-v1:1;}
/*__FREY_PHI_marks_V1_0__*/
.askFreyBox{--frey_query_mode_stub_prod_v0_1_1:1;/*__FREY_QUERY_MODE_STUB_V0_1__*/--frey_query_mode_stub:1;gap:var(--phi-13);--phi_gap_v2:1;border:var(--phi-1) solid rgba(215,181,90,0.36);background:linear-gradient(180deg, rgba(255,255,255,0.055), rgba(0,0,0,0.26));box-shadow:inset 0 0 0 1px rgba(255,255,255,0.065),0 14px 44px rgba(0,0,0,0.42),0 0 0 1px rgba(215,181,90,0.12);border-radius:var(--phi-21);padding:var(--phi-13) var(--phi-21);--phi_pad_v2:1;--frey_phi_marks_v1_0:1;--frey_askfrey_air2_v1_0_5:1;}
          .askFreyBox h2{color:rgba(255,255,255,0.93)}
          .askFreyBox p{color:rgba(255,255,255,0.74)}
          .askFreyBox .qInput{background:rgba(0,0,0,0.52);border-color:rgba(255,255,255,0.28);box-shadow:inset 0 0 0 1px rgba(255,255,255,0.055), 0 12px 34px rgba(0,0,0,0.34);padding:var(--phi-13) var(--phi-21);--phi_qpad_v2:1;--phi_pad_v1:1;min-height:var(--phi-55);--phi_qh_v2:1;--phi_h_v1:1;line-height:1.25;cursor:text;--frey_qinput_hitbox_v1_4:1;box-sizing:border-box;--frey_qinput_hitbox_v1_4_1:1;flex:1;max-width:none;width:100%;--frey_qinput_wider_v1_4_2:1;--frey_phi_marks_v1_0:1;}
          .askFreyBox .qInput::placeholder{color:rgba(255,255,255,0.56)}
\n          /*__LINK_CANON__*/\n          a{color:inherit;text-decoration:none;border-bottom:1px solid rgba(215,181,90,.55);padding-bottom:1px}\n          a:hover{border-bottom-color:rgba(215,181,90,.95)}\n          a:focus-visible{outline:2px solid rgba(215,181,90,.85);outline-offset:3px;border-bottom-color:transparent}\n
        .wrap { max-width: 980px; margin: 0 auto; padding: 40px 18px 70px; }
        .hero { padding: 18px 0 8px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 18px; }
        .kicker { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; opacity: .7; margin-bottom: 8px; }
        .title { font-size: 42px; line-height: 1.08; margin: 0 0 10px; }
        .subtitle { font-size: 16px; opacity: .85; margin: 0 0 10px; max-width: 70ch; }
        .card { padding: 18px 16px; margin: 14px 0; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; background: rgba(255,255,255,0.02); }
        h2 { margin: 0 0 10px; font-size: 18px; }
        ul { margin: 10px 0 0; padding-left: 18px; }
        li { margin: 6px 0; line-height: 1.45; }
        p { margin: 8px 0; line-height: 1.55; }
        .muted { opacity: .75; }
        .pre { padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.10); background: rgba(0,0,0,0.25); overflow-x: auto; margin: 10px 0 0; }
        .btn { margin-top: 10px; height: 36px; padding: 0 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); cursor: pointer; }
        .btn:hover { background: rgba(255,255,255,0.06); }
        .queryRow{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:10px}
        .qInput{flex:1;min-width:240px;height:36px;padding:0 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(0,0,0,0.18);color:inherit}
        .qInput:focus{outline:none;border-color:rgba(215,181,90,.55);box-shadow:0 0 0 6px rgba(215,181,90,.08)}
        .btnCta{border:1px solid rgba(215,181,90,.55);background:rgba(255,255,255,0.04);color:rgba(255,255,255,.90)}
        .btnCta:hover{background:rgba(255,255,255,0.06)}
        .btnCta:disabled{opacity:1;color:rgba(255,255,255,.38);border-color:rgba(255,255,255,0.14);background:rgba(255,255,255,0.02);cursor:not-allowed}

        
          
/*__FREY_ASKFREY_AIR_V1_0_4__*/
/*__FREY_ASKFREY_AIR2_V1_0_5__*/
.askFreyBox{padding:var(--phi-13) var(--phi-21);--phi_pad_v2:1;display:flex;flex-direction:column;gap:var(--phi-13);--phi_gap_v2:1;--frey_phi_gap_align_v0_3_1:1;--phi_gap_v1:1;--frey_askfrey_air2_v1_0_5:1;}
.askFreyBox button:not(.btnCta){margin:10px 10px 0 0;}

.askFreyBox>*+*{margin-top:14px;}
.askFreyBox .qRow{margin-top:2px;}
/*__FREY_FIRST_SCREEN_CANON_PATCH_V0_1__*/

        
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask Frey… (signals, cycles, assets)"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/20"
              />
                onClick={runQuery}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white hover:bg-white/15"
              >
                Ask
              
            {error ? (
                {error}
            ) : null}
            {answer ? (
                {answer}
            ) : null}
/* Fix double vertical spacing: keep gap, remove extra margins */
.askFreyBox>*+*{margin-top:0!important;}
/* Ensure the row styling applies (we use className=qRow now) */
.askFreyBox .qRow{margin-top:0!important;}
/* Fold styling: keep first screen tight, rest accessible */
details.fold{margin-top:var(--phi-21);border:1px solid rgba(255,255,255,0.10);border-radius:var(--phi-r-21);background:rgba(255,255,255,0.012);}
summary.foldSummary{list-style:none;cursor:pointer;padding:12px 14px;opacity:.9;}
summary.foldSummary::-webkit-details-marker{display:none;}
details.fold[open] summary.foldSummary{opacity:1;}
.foldBody{padding:0 14px 14px;}

.askFreyBox .pillRow,.askFreyBox .suggRow,.askFreyBox .chipsRow{gap:10px;}
.askFreyBox .notReady{margin-top:2px;}
/*__FREY_QUERY_INPUT_HALO_V1_3__*/
          .qInput{background:rgba(0,0,0,0.44);border:1px solid rgba(255,255,255,0.24);box-shadow:0 0 0 1px rgba(215,181,90,0.18), 0 10px 30px rgba(0,0,0,0.35);color:rgba(255,255,255,0.92);}
          .qInput::placeholder{color:rgba(255,255,255,0.44)}
          .qInput:focus,.qInput:focus-visible{outline:none;border-color:rgba(215,181,90,0.72);box-shadow:0 0 0 3px rgba(215,181,90,0.22), 0 14px 36px rgba(0,0,0,0.38);}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
        .chip{border-radius:999px;padding:6px 10px;border:1px solid rgba(255,255,255,0.16);background:rgba(255,255,255,0.04);color:rgba(255,255,255,.78);cursor:pointer;opacity:1}
        .chip:hover{border-color:rgba(215,181,90,.55);background:rgba(255,255,255,0.06)}
        .micro{margin-top:10px;font-size:13px;opacity:.85}

        @media (max-width: 760px) { .title { font-size: 34px; } }

          /*__BHRIGU_UI_CANON__*/
          a{color:inherit;text-decoration:none;border-bottom:1px solid rgba(215,181,90,.55);padding-bottom:1px}
          a:hover{border-bottom-color:rgba(215,181,90,.95)}
          a:focus-visible{outline:2px solid rgba(215,181,90,.85);outline-offset:3px;border-bottom-color:transparent}
          .nav{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
          .btn{
            display:inline-flex;align-items:center;justify-content:center;
            height:34px;padding:0 12px;border-radius:999px;
            border:1px solid rgba(255,255,255,.12);
            background:rgba(255,255,255,.03);
            box-shadow:0 0 0 rgba(0,0,0,0);
            transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease;
            -webkit-tap-highlight-color: transparent;
          }
          .btn:hover{transform:translateY(-1px);border-color:rgba(215,181,90,.55);box-shadow:0 0 0 6px rgba(215,181,90,.08)}
          .btn:active{transform:translateY(0px)}
          .prewrap{white-space:pre-wrap;overflow-x:hidden}

/* Φ MOBILE CANON v0.2 */
@media (max-width: 640px) {
  :global(html), :global(body) {
    height: 100%;
    overflow: hidden;
    overscroll-behavior: none;
  }

  :global(body) {
    min-height: 100dvh;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }

  main {
    min-height: 100dvh;
    max-height: 100dvh;
    overflow: hidden;
  }

  .freyNoScroll, .page, .container, .wrap {
    min-height: 100dvh;
    max-height: 100dvh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 16px;
    padding-right: 16px;
  }

  .queryBox, .box, .card, .panel {
    border-radius: 14px !important;
    padding: 16px !important;
  }

  input[type="text"], textarea, .queryInput {
    width: 100% !important;
    min-height: 48px !important;
    font-size: 16px !important;
    line-height: 24px !important;
  }

  .queryRow, .queryControls, .row, .controls, form {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
    align-items: stretch !important;
  }

  button, .btn {
    width: 100% !important;
    min-height: 48px !important;
    font-size: 14px !important;
    letter-spacing: 0.02em;
  }

  .chip, .pill, .quick, .suggestion {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 10px 12px;
    opacity: 0.64 !important;
  }

  a { opacity: 0.72; }
  a:hover { opacity: 0.9; }

  .freyNoise { opacity: 0.01618 !important; }
}


          /*__FREY_QUERY_QUEUE_STUB_V0_2__*/
          .freyQueue .qMark{display:none;}

          .freyQueue{margin-top:var(--phi-34);border:1px solid rgba(215,181,90,0.22);border-radius:var(--phi-21);padding:var(--phi-21);background:linear-gradient(180deg, rgba(255,255,255,0.045), rgba(0,0,0,0.22));box-shadow:inset 0 0 0 1px rgba(255,255,255,0.055), 0 18px 54px rgba(0,0,0,0.42);}
          .freyQueue .qTop{display:flex;flex-direction:column;gap:var(--phi-8);}
          .freyQueue .qTitle{font-weight:650;letter-spacing:0.02em;}
          .freyQueue .qSub{opacity:0.78;font-size:0.95rem;line-height:1.35;}
          .freyQueue .qList{margin-top:var(--phi-13);display:flex;flex-direction:column;gap:var(--phi-8);}
          .freyQueue .qItem{opacity:0.72;border:1px dashed rgba(255,255,255,0.18);border-radius:var(--phi-13);padding:var(--phi-13);}



          /*__FREY_QUERY_QUEUE_LOCAL_V0_5__*/
          .freyQueue{margin-top:var(--phi-21);}
          .freyQueue .qTop{margin-bottom:var(--phi-13);}
          .freyQueue .qTitle{font-weight:600;letter-spacing:0.02em;}
          .freyQueue .qSub{opacity:0.8;margin-top:6px;}
          .freyQueue .qComposer{margin-top:var(--phi-13);display:flex;flex-wrap:wrap;gap:var(--phi-8);align-items:center;}
          .freyQueue .qQueueInput{flex:1;min-width:220px;background:rgba(0,0,0,0.52);border:1px solid rgba(255,255,255,0.22);border-radius:var(--phi-13);padding:var(--phi-8) var(--phi-13);line-height:1.25;outline:none;}
          .freyQueue .qQueueInput:focus{border-color:rgba(215,181,90,0.55);box-shadow:0 0 0 1px rgba(215,181,90,0.22), 0 18px 44px rgba(0,0,0,0.38);}
          .freyQueue .qBtn{border:1px solid rgba(215,181,90,0.28);background:rgba(0,0,0,0.28);border-radius:var(--phi-13);padding:var(--phi-8) var(--phi-13);cursor:pointer;transition:transform 120ms ease, border-color 120ms ease, background 120ms ease;}
          .freyQueue .qBtn:hover{transform:translateY(-1px);border-color:rgba(215,181,90,0.42);background:rgba(0,0,0,0.34);}
          .freyQueue .qBtnGhost{border-color:rgba(255,255,255,0.18);color:rgba(255,255,255,0.84);}
          .freyQueue .qList{margin-top:var(--phi-13);display:flex;flex-direction:column;gap:var(--phi-8);}
          .freyQueue .qItem{padding:var(--phi-13);border:1px solid rgba(255,255,255,0.12);border-radius:var(--phi-13);background:rgba(0,0,0,0.22);}
          .freyQueue .qEmpty{opacity:0.75;padding:var(--phi-13) 0;}
          .freyQueue .qWhen{opacity:0.7;font-size:0.9rem;margin-bottom:2px;}
          .freyQueue .qText{white-space:pre-wrap;word-break:break-word;}
          .freyQueue .qMarkLocal{display:none;}
`}</style>
    </>
  );
}
// Φ-GUARD: force SSR to avoid edge/ISR stale HTML on /frey
export async function getServerSideProps(ctx) {
  const res = ctx && ctx.res;
  if (res && typeof res.setHeader === "function") {
    res.setHeader("Cache-Control", "no-store, max-age=0");
  }
  return { props: {} };
}
