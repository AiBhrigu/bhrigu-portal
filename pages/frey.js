// __FREY_CANON_MINIMAL_FIX_V0_2__
//
// UI-only. No network calls. No sensitive strings.
// Query Bar -> /reading?q=...

import Head from "next/head";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

const BG_MARK = "__FREY_PHI_SPACE_BG_V0_3__";
const FLOW_MARK = "__FREY_QUERY_FLOW_UI_ONLY_V0_4__";

const CHIPS = [
  "human ↔ project: where are we now and what is the next step?",
  "human ↔ asset: what is the risk/support tone for the next 30 days?",
  "human ↔ human: what is the friction point and how to navigate it?",
];

export default function FreyPage() {
  const router = useRouter();
  const inputRef = useRef(null);
  const [q, setQ] = useState("");

  const canGo = useMemo(() => q.trim().length > 0, [q]);

  const go = (raw) => {
    const s = (raw ?? q).trim();
    if (!s) return;
    try {
      router.push(`/reading?q=${encodeURIComponent(s)}`);
    } catch (_) {
      if (typeof window !== "undefined") window.location.assign(`/reading?q=${encodeURIComponent(s)}`);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      go();
    }
  };

  const onChip = (t) => {
    setQ(t);
    go(t);
  };

  return (
    <>
      <Head>
        <title>Frey · BHRIGU</title>
        <meta name="description" content="Frey: query-first navigation through cosmography." />
      </Head>

      <div className="freyPage" data-frey-flow={FLOW_MARK}>
        <div aria-hidden="true" data-frey-mark={BG_MARK} className="freyPhiSpaceBg" />
        <main className="wrap">
          <header className="hero">
            <div id="phi-frey-entry" className="kicker">
              <span>BHRIGU</span> · <span>Frey</span> · <span>ORION</span>
            </div>
            <p className="subtitle">
              Dialog interface for cosmography: query-first navigation through time, cycles, links and scenarios.
            </p>
          </header>

          <section className="card askFreyBox" aria-label="Frey query bar">
            <h2 className="h2">Query Bar (pilot) · PHI surface v0.3</h2>
            <p className="muted">UI-only v1. Your question stays in your browser — we just open the next route.</p>

            <div className="qRow">
              <input
                ref={inputRef}
                className="qInput"
                placeholder="Ask Frey… (signals, cycles, assets)"
                aria-label="Frey query"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
              />
              <button type="button" className="btn btnCta" onClick={() => go()} disabled={!canGo}>
                Continue → Reading
              </button>
            </div>

            <div className="domainsWrap" aria-label="Frey quick domains">
              <a href="/start" className="domainLink">Start</a>
              <span className="domainSep">·</span>
              <a href="/reading" className="domainLink">Reading</a>
              <span className="domainSep">·</span>
              <a href="/access" className="domainLink">Access</a>
              <span className="domainSep">·</span>
              <a href="/github" className="domainLink">GitHub</a>
            </div>

            <div className="chips" aria-label="Frey example queries">
              {CHIPS.map((t) => (
                <button key={t} type="button" className="chip" onClick={() => onChip(t)}>
                  {t}
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>

      <style jsx global>{`
        :root{
          --phi-8: 8px;
          --phi-13: 13px;
          --phi-21: 21px;
          --phi-34: 34px;
          --phi-55: 55px;
        }

        html, body { height: 100%; }
        body { background: #000; color: rgba(255,255,255,0.92); }

        .freyPage { position: relative; min-height: 100vh; }
        .freyPhiSpaceBg{
          position: fixed; inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(1200px 800px at 30% 20%, rgba(120,190,255,0.16), transparent 60%),
            radial-gradient(900px 600px at 80% 40%, rgba(255,190,140,0.10), transparent 60%),
            radial-gradient(700px 700px at 50% 85%, rgba(160,120,255,0.10), transparent 60%),
            linear-gradient(180deg, rgba(0,0,0,0.92), rgba(0,0,0,0.98));
          filter: saturate(1.05) contrast(1.05);
        }

        .wrap{
          position: relative;
          z-index: 1;
          max-width: 980px;
          margin: 0 auto;
          padding: 28px 18px 80px;
        }

        .hero { padding: 10px 0 18px; }
        .kicker { letter-spacing: 0.02em; opacity: 0.92; font-size: 13px; }
        .subtitle { margin: 10px 0 0; opacity: 0.82; max-width: 60ch; }

        .card{
          margin-top: 18px;
          border-radius: 18px;
          padding: 18px;
          background: rgba(0,0,0,0.46);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
        }

        .h2{ margin: 0 0 6px; font-size: 16px; letter-spacing: 0.01em; }
        .muted{ margin: 0 0 14px; opacity: 0.75; }

        .qRow{
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .qInput{
          flex: 1 1 360px;
          width: 100%;
          min-height: var(--phi-55);
          padding: var(--phi-13) var(--phi-21);
          border-radius: var(--phi-13);
          border: 1px solid rgba(255,255,255,0.28);
          background: rgba(0,0,0,0.52);
          color: inherit;
          outline: none;
        }
        .qInput:focus{
          border-color: rgba(160,220,255,0.65);
          box-shadow: 0 0 0 3px rgba(120,190,255,0.18);
        }

        .btn{
          min-height: var(--phi-55);
          border-radius: var(--phi-13);
          padding: 0 18px;
          border: 1px solid rgba(255,255,255,0.24);
          background: rgba(255,255,255,0.08);
          color: inherit;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn:disabled{
          opacity: 0.45;
          cursor: not-allowed;
        }
        .btnCta{
          border-color: rgba(160,220,255,0.45);
          background: rgba(120,190,255,0.14);
        }

        .domainsWrap{
          margin-top: 14px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          opacity: 0.9;
        }
        .domainLink{ text-decoration: none; color: inherit; opacity: 0.86; }
        .domainLink:hover{ opacity: 1; text-decoration: underline; }
        .domainSep{ opacity: 0.42; }

        .chips{
          margin-top: 14px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .chip{
          border-radius: 999px;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.06);
          color: inherit;
          cursor: pointer;
          text-align: left;
          max-width: 100%;
        }
        .chip:hover{ background: rgba(255,255,255,0.10); }

        @media (max-width: 520px){
          .wrap{ padding: 22px 14px 72px; }
          .btn{ width: 100%; }
        }
      `}</style>
    </>
  );
}

export async function getServerSideProps(ctx) {
  try {
    ctx?.res?.setHeader("Cache-Control", "no-store, max-age=0");
  } catch (_) {}
  return { props: {} };
}

