import React, { useMemo, useState, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

const __PHI_FREY_CENTER_V0_13 = "FREY_CENTER_LAYOUT_V0_13";

const CHIPS = [
  "human <-> project: where are we now and what is the next step?",
  "human <-> asset: what is the risk/support tone for the next 30 days?",
];

export default function Frey() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const canGo = useMemo(() => q.trim().length > 0, [q]);

  const go = useCallback(() => {
    const v = q.trim();
    if (!v) return;
    router.push(`/reading?q=${encodeURIComponent(v)}`);
  }, [q, router]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        go();
      }
    },
    [go]
  );

  const onChip = useCallback(
    (t) => {
      setQ(t);
      router.push(`/reading?q=${encodeURIComponent(t)}`);
    },
    [router]
  );

  return (
    <>
      <Head>
        <title>FREY - BHRIGU</title>
        <meta name="robots" content="index,follow" />
      </Head>

      <div
        className="freyRoot"
        data-frey-shell="FREY_SHELL_MAXWIDTH_ALIGN_V0_1"
        data-frey-vibe="FREY_VIBE_BREATH_TUNE_V0_6"
        data-frey-flow="FREY_QUERY_FLOW_UI_ONLY_V0_4"
        data-frey-inp="FREY_INPUT_STABILITY_V0_1"
      >

        <main className="freyMain" data-frey-ui="FREY_UI_CENTER_V0_6">
<div data-phi-frey-center={__PHI_FREY_CENTER_V0_13} style={{ width: "min(980px, calc(100vw - 48px))", margin: "0 auto" }}>

          <section className="freyHero">
            <div className="copy">
              <div className="kicker">FREY</div>
              <h1 className="h1">
                Dialog interface for cosmography: query-first navigation through time, cycles, links and scenarios.
              </h1>
            </div>

            <div className="cardWrap">
              <div className="card" data-frey-card="1">
                <div className="ask">
                  <input
                    className="qInput askFreyInput"
                    data-frey-q="1"
                    aria-label="Frey query"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={onKeyDown}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-frey-qinput="FREY_QINPUT_V0_12"
                  />
                  <button
                    type="button"
                    className="btn btnCta"
                    data-frey-cta="FREY_CTA_PHI_CANON_V0_3"
                    onClick={go}
                    disabled={!canGo}
                  >
                    Continue → Reading
                  </button>
                </div>

                <div className="chips" aria-label="Frey example queries">
                  {CHIPS.map((t) => (
                    <button key={t} type="button" className="chip" onClick={() => onChip(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            
          </section>
        
</div>
</main>

        <style jsx>{`
          .freyRoot {
            min-height: 100vh;
            background: radial-gradient(60% 70% at 45% 40%, rgba(50, 90, 160, 0.35), rgba(0, 0, 0, 0.95));
          }

          .freyMain {
            max-width: 1100px;
            margin: 0 auto;
            padding: 72px 18px 64px;
          }

          .freyHero {
            display: grid;
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .kicker {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            letter-spacing: 0.14em;
            opacity: 0.85;
            font-size: 14px;
          }

          .h1 {
            margin: 14px 0 0;
            font-weight: 500;
            font-size: 18px;
            line-height: 1.7;
            color: rgba(255, 255, 255, 0.9);
            max-width: 720px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          }

          .cardWrap {
            max-width: 760px;
          }

          .card {
            border-radius: 18px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(10, 16, 28, 0.55);
            backdrop-filter: blur(10px);
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
            padding: 18px;
          }

          .ask {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .qInput {
            height: 44px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.14);
            background: rgba(0, 0, 0, 0.35);
            color: rgba(255, 255, 255, 0.92);
            padding: 0 14px;
            font-size: 14px;
            outline: none;
          }

          .qInput:focus {
            border-color: rgba(255, 255, 255, 0.26);
            box-shadow: 0 0 0 3px rgba(120, 170, 255, 0.12);
          }

          .btn {
            height: 44px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.14);
            background: rgba(255, 255, 255, 0.06);
            color: rgba(255, 255, 255, 0.9);
            cursor: pointer;
          }

          .btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }

          .chips {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 14px;
          }

          .chip {
            height: 36px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(0, 0, 0, 0.26);
            color: rgba(255, 255, 255, 0.86);
            padding: 0 14px;
            font-size: 13px;
            text-align: left;
            cursor: pointer;
          }

          .chip:hover {
            background: rgba(255, 255, 255, 0.06);
          }

          .navLift {
            display: inline-flex;
            gap: 12px;
            align-items: center;
            justify-content: center;
            margin-top: 8px;
          }

          .lift {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 8px 14px;
            border-radius: 999px;
            border: 1px solid rgba(212, 160, 90, 0.42);
            color: rgba(212, 160, 90, 0.95);
            text-decoration: none;
            background: rgba(0, 0, 0, 0.28);
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          }

          @media (min-width: 860px) {
            .ask {
              grid-template-columns: 1fr 260px;
              align-items: center;
            }
            .chips {
              grid-template-columns: 1fr 1fr;
            }
          }

.k, .h, .p {
  width: 100%;
  text-align: center;
}

.card {
  margin-left: auto;
  margin-right: auto;
  text-align: left;
}
`}</style>
      </div>
    </>
  );
}
