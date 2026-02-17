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

      <div className="freyPage" data-frey-qrow-stack="FREY_QROW_STACK_V0_14" data-frey-flow={FLOW_MARK}>
        <div data-frey-root="FREY_ROOT_V0_1" data-frey-mobile="FREY_MOBILE_WIDTH_V0_1" aria-hidden="true" data-frey-mark={BG_MARK} className="freyPhiSpaceBg" data-frey-vibe="FREY_VIBE_BREATH_V0_1" />
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
  <div className="qRow" data-frey-qrow="FREY_QROW_STACK_V0_11">
              <input
                ref={inputRef}
                className="qInput"
                data-frey-q="1"
               
                aria-label="Frey query"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
               data-frey-qinput="FREY_QINPUT_V0_11" />
              <button type="button" className="btn btnCta" onClick={() => go()} data-frey-qcta="FREY_QCTA_V0_11" disabled={!canGo}>
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
          
  </section>
        </main>
      </div>

      <style jsx>{`
/* __FREY_QUERYROW_MOBILE_STACK_V0_14__ */
@media (max-width: 760px){
  .qRow{ flex-direction: column; align-items: stretch; gap: 10px; width: 100%; min-width: 0; }
  .qInput{ width: 100%; min-width: 0; }
  .btnCta{ width: 100%; }
}


/* __FREY_VIBE_LAYER_STACKING_V0_3__ */
.freyPhiSpaceBg{
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(1000px 420px at 50% 20%, rgba(30,140,255,0.18), transparent 62%),
    radial-gradient(760px 360px at 72% 58%, rgba(120,70,255,0.14), transparent 64%),
    radial-gradient(820px 380px at 28% 62%, rgba(20,180,160,0.10), transparent 66%),
    linear-gradient(180deg, #050608 0%, #06070a 40%, #050608 100%);
}

.freyPhiSpaceBg::before{
  content: "";
  position: absolute;
  inset: -18% -10%;
  background:
    radial-gradient(70% 65% at 35% 22%, rgba(56,112,235,0.22), rgba(0,0,0,0) 60%),
    radial-gradient(65% 60% at 72% 60%, rgba(137,87,210,0.18), rgba(0,0,0,0) 62%),
    radial-gradient(70% 70% at 40% 85%, rgba(46,206,255,0.10), rgba(0,0,0,0) 68%);
  opacity: 0.10;
  filter: blur(58px) saturate(1.03) brightness(1.04);
  transform: translate3d(0,0,0) scale(1.02);
  animation: freyVibeBreath 14.4s ease-in-out infinite;
  pointer-events: none;
  border-radius: 42px;
  z-index: 0;
  will-change: transform, opacity, filter;
}
/* __FREY_VIBE_BREATH_TUNE_V0_6__ */


@keyframes freyVibeBreath{
  0%{ transform: translate3d(-1.5%, -1.0%, 0) scale(1.015); opacity:0.09; filter: blur(56px) saturate(1.02) brightness(1.04); }
  50%{ transform: translate3d( 1.2%,  1.1%, 0) scale(1.030); opacity:0.11; filter: blur(60px) saturate(1.05) brightness(1.06); }
  100%{ transform: translate3d(-1.5%, -1.0%, 0) scale(1.015); opacity:0.09; filter: blur(56px) saturate(1.02) brightness(1.04); }
}

#_next{position:relative;z-index:1;}
@media (max-width:760px){.freyPhiSpaceBg:after{bottom:-28vh;height:66vh;filter:blur(26px);opacity:1;}}

`}</style>
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

        
        
        .domainLink:hover{ opacity: 1; text-decoration: underline; }
        

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
/* __FREY_AIR_SPACING_V0_1__ */
.wrap{
  max-width: 1040px;
  padding-top: clamp(52px, 7vh, 92px);
  padding-bottom: clamp(110px, 12vh, 170px);
}
.hero{ margin-bottom: clamp(30px, 4vh, 58px); }
.card{
  max-width: 920px;
  margin-left: auto;
  margin-right: auto;
  padding: clamp(24px, 3vw, 36px);
}
.qRow{ gap: 14px; margin-top: 18px; }
.qInput{ min-height: 56px; font-size: 18px; }
.btnCta{ min-height: 56px; padding: 0 22px; }
.chips{ margin-top: 18px; gap: 12px; }
/* __FREY_QUERYROW_MOBILE_STACK_V0_7__ */
@media (max-width: 720px){
  .qRow{ flex-direction: column; align-items: stretch; }
  .btnCta{ width: 100%; }
}
/* __FREY_NOISE_MOBILE_TUNE_V0_1__ */
.hero{ margin-bottom: var(--phi-55); }
.askFreyBox{
  max-width: 860px;
  margin-left: auto;
  margin-right: auto;
  background: rgba(0,0,0,0.44) !important;
  border-color: rgba(255,255,255,0.14) !important;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}
.askFreyBox h2{
  margin: 0 0 var(--phi-13) 0;
  padding: 0 0 var(--phi-8) 0;
  border-bottom: 0 !important;
}
.askFreyBox .muted{
  margin-top: 0;
  opacity: 0.72;
  max-width: 62ch;
}
.qRow{
  gap: var(--phi-13);
  margin-top: var(--phi-13);
  margin-bottom: var(--phi-21);
  max-width: 760px;
  margin-left: auto;
  margin-right: auto;
}
.qInput{
  background: rgba(0,0,0,0.38) !important;
  border-color: rgba(255,255,255,0.22) !important;
}
.btnCta{ min-width: 240px; }
.chips{ margin-top: var(--phi-8); gap: var(--phi-13); }

@media (max-width: 640px){
  .wrap{ padding-left: var(--phi-21); padding-right: var(--phi-21); }
  .askFreyBox{ padding: var(--phi-21); }
  .qRow{ flex-direction: column; max-width: 100%; }
  .btnCta{ width: 100%; min-height: var(--phi-55); }
  .qInput{ width: 100%; }
  .chips{ flex-direction: column; }
  .chip{ width: 100%; text-align: left; }
}

/* frey: a11y + footnote */
.srOnly{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
.fineprint{margin-top:var(--phi-21);font-size:14px;line-height:1.4;opacity:.75;}
@media (max-width: 640px){.fineprint{font-size:13px;margin-top:var(--phi-13);}}

/* frey quiet/mobile tune v0.1 */
.askFreyBox{max-width:760px;margin-left:auto;margin-right:auto;}
.qRow{max-width:660px;margin-left:auto;margin-right:auto;}
.chips{max-width:660px;margin-left:auto;margin-right:auto;}
@media (max-width:560px){
  .qRow{display:flex;flex-direction:column;gap:var(--phi-13);}
  .qInput{width:100%;}
  .btnCta{width:100%;}
}
/* __FREY_INPUT_CHIPS_TONE_V0_3__ */

/* query input: kill double ring; keep single subtle border */
:global([data-frey-q]){
  outline: none !important;
  box-shadow: none !important;
  border: 1px solid rgba(255,255,255,0.14) !important;
  background: rgba(0,0,0,0.10) !important;
}
:global([data-frey-q]::placeholder){
  color: rgba(255,255,255,0.34) !important;
}
:global([data-frey-q]:focus),
:global([data-frey-q]:focus-visible){
  outline: none !important;
  box-shadow: none !important;
  border-color: rgba(255,255,255,0.18) !important;
}

/* chips: quieter text + softer surface */
:global([data-frey-chip="1"]){
  color: rgba(255,255,255,0.62) !important;
  background: rgba(255,255,255,0.028) !important;
  border-color: rgba(255,255,255,0.11) !important;
}
:global([data-frey-chip="1"]:hover){
  color: rgba(255,255,255,0.70) !important;
  background: rgba(255,255,255,0.040) !important;
  border-color: rgba(255,255,255,0.14) !important;
}

/* __FREY_MOBILE_WIDTH_V0_1__ */
[data-frey-mobile="FREY_MOBILE_WIDTH_V0_1"] { width: 100%; max-width: 860px; margin: 0 auto; padding-left: 16px; padding-right: 16px; }
[data-frey-mobile="FREY_MOBILE_WIDTH_V0_1"] input, [data-frey-mobile="FREY_MOBILE_WIDTH_V0_1"] textarea { width: 100%; max-width: 100%; }
@media (max-width: 520px) { [data-frey-mobile="FREY_MOBILE_WIDTH_V0_1"] { padding-left: 12px; padding-right: 12px; } }
@media (max-width: 420px) { [data-frey-mobile="FREY_MOBILE_WIDTH_V0_1"] { padding-left: 10px; padding-right: 10px; } }

[data-frey-qrow="FREY_QROW_STACK_V0_6"] [data-frey-qinput="FREY_QINPUT_V0_6"] {
    width: 100%;
  }
  [data-frey-qrow="FREY_QROW_STACK_V0_6"] [data-frey-qcta="FREY_QCTA_V0_6"] {
    width: 100%;
  }
}
  [data-frey-qinput="FREY_QINPUT_V0_11"]{ width:100%; min-width:0; }
  [data-frey-qcta="FREY_QCTA_V0_11"]{ width:100%; }
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
