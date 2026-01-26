import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

export default function FreyPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const EXAMPLES = [
    "human ↔ project: where are we now and what is the next step?",
    "human ↔ asset: what is the risk/support tone for the next 30 days?",
    "human ↔ human: what is the friction point and how to navigate it?",
  ];

  const submit = () => {
    const s = (q || "").trim();
    if (!s) return;
    router.push(`/reading?q=${encodeURIComponent(s)}`);
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

  return (
    <>
      <Head>
        <title>Frey · BHRIGU</title>
        <meta
          name="description"
          content="Frey — dialog interface for cosmography. Query-first navigation through time, cycles and scenarios."
        />
      </Head>

      <main className="wrap">
        <header className="hero">
          <div className="kicker"><span>BHRIGU</span> · <span>Frey</span> · <span>ORION</span></div>
          \1Φ · \2\3
          <p className="subtitle">
            Dialog interface for cosmography: query-first navigation through time, cycles, links and scenarios.
          </p>
        </header>

        {/*__FREY_QUERY_LINE_V1__*/}
        {/*__FREY_QUERY_LINE_V1_CONTRAST__*/}
        <section className="card">
          <h2>Ask Frey (pilot)</h2>
          <p className="muted">
            UI-only v1. Your question stays in your browser — we just open the next route.
          </p>

          <div className="queryRow">
            <input
              className="qInput"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="Type a question…"
              aria-label="Frey query"
            />
            <button className="btn btnCta" onClick={submit} disabled={!q.trim()}>Continue → Reading</button>
          </div>

          <div className="chips">
            {EXAMPLES.map((t) => (
              <button
                key={t}
                className="chip"
                onClick={() => setQ(t)}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>

          <p className="micro">
            Not ready? <a href="/start">Start</a> · <a href="/reading">Reading</a> · <a href="/faq">FAQ</a>
          </p>
        </section>

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

        <section className="card">
          <h2>Copy template (start here)</h2>
          <p className="muted">Copy & paste into Frey/chat:</p>
          <pre className="pre">
{`GOAL: …
CONTEXT: …
CONSTRAINTS: …
EXIT: …`}
          </pre>
          <button className="btn" onClick={copy}>Copy template</button>
        </section>

        <section className="card">
          <h2>Public surface</h2>
          <p>
            This page is UI-only. API routes can be disabled on the public portal by design.
          </p>
        </section>
      </main>

      <style jsx>{`\n          /*__LINK_CANON__*/\n          a{color:inherit;text-decoration:none;border-bottom:1px solid rgba(215,181,90,.55);padding-bottom:1px}\n          a:hover{border-bottom-color:rgba(215,181,90,.95)}\n          a:focus-visible{outline:2px solid rgba(215,181,90,.85);outline-offset:3px;border-bottom-color:transparent}\n
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

`}</style>
    </>
  );
}
