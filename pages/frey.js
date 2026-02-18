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

      <div className="freyPage" data-frey-qrow-stack="FREY_QROW_STACK_V0_14" data-frey-flow={FLOW_MARK} data-frey-deload="FREY_DELOAD_WINDOW_V0_3" data-frey-ui="FREY_UI_CONTROLS_V0_1">
        <div data-frey-root="FREY_ROOT_V0_1" data-frey-mobile="FREY_MOBILE_WIDTH_V0_1" aria-hidden="true" data-frey-mark={BG_MARK} className="freyPhiSpaceBg" data-frey-vibe="FREY_VIBE_BREATH_TUNE_V0_6" />
        <main className="wrap">
          <header className="hero">
            <div id="phi-frey-entry" className="kicker">
              <span>BHRIGU</span> · <span>Frey</span> · <span>ORION</span>
            </div>
            <p className="subtitle">
              Dialog interface for cosmography: query-first navigation through time, cycles, links and scenarios.
            </p>
          </header>

          <section className="card askFreyBox" data-frey-tight="FREY_TIGHTEN_V0_4" aria-label="Frey query bar">
  <div className="qRow" data-frey-qrow="FREY_QROW_STACK_V0_11">
              <input
                ref={inputRef}
                className="qInput askFreyInput"
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
  position:fixed;
  inset:-6vh -6vw;
  z-index:0;
  pointer-events:none;
  background:
    radial-gradient(980px 660px at 38% 28%, rgba(14,58,162,0.18), rgba(0,0,0,0) 66%),
    radial-gradient(1020px 720px at 72% 62%, rgba(3,214,255,0.06), rgba(0,0,0,0) 72%),
    radial-gradient(1240px 860px at 55% 75%, rgba(140,40,255,0.045), rgba(0,0,0,0) 76%),
    radial-gradient(1600px 1200px at 50% 50%, rgba(255,255,255,0.04), rgba(0,0,0,0) 80%);
}

.freyPhiSpaceBg::before{
  content:"";
  position:absolute;
  inset:-36vh -36vw;
  background:
    radial-gradient(820px 560px at 38% 34%, rgba(14,58,162,0.20), rgba(0,0,0,0) 64%),
    radial-gradient(980px 660px at 66% 62%, rgba(3,214,255,0.07), rgba(0,0,0,0) 70%),
    radial-gradient(1180px 820px at 52% 72%, rgba(140,40,255,0.055), rgba(0,0,0,0) 74%);
  filter: blur(58px) saturate(1.03) brightness(1.04);
  opacity:0.085;
  transform: translate3d(0,0,0);
  animation: freyVibeBreath 26s ease-in-out infinite;
}
/* __FREY_VIBE_BREATH_TUNE_V0_6__ */


@keyframes freyVibeBreath{
  0%{ transform: translate3d(-1.2%, -0.9%, 0) scale(1.012); opacity:0.08; filter: blur(56px) saturate(1.02) brightness(1.03); }
  50%{ transform: translate3d( 1.0%,  0.9%, 0) scale(1.026); opacity:0.10; filter: blur(60px) saturate(1.04) brightness(1.05); }
  100%{ transform: translate3d(-1.2%, -0.9%, 0) scale(1.012); opacity:0.08; filter: blur(56px) saturate(1.02) brightness(1.03); }
}

#_next{position:relative;z-index:1;}
@media (max-width:760px){.freyPhiSpaceBg::after{
  content:"";
  position:absolute;
  inset:-34vh -34vw;
  background:
    radial-gradient(900px 620px at 46% 70%, rgba(14,58,162,0.14), rgba(0,0,0,0) 68%),
    radial-gradient(1100px 740px at 58% 58%, rgba(3,214,255,0.05), rgba(0,0,0,0) 74%);
  filter: blur(52px) saturate(1.02) brightness(1.03);
  opacity:0.06;
  transform: translate3d(0,0,0);
  animation: freyVibeBreath 34s ease-in-out infinite;
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
  max-width: 780px;
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

/* __FREY_DELOAD_WINDOW_V0_1__ */
/* Hide any placeholder blocks inside the ask box. Keep only query row + chips. */
.askFreyBox > :not(.qRow):not(.chips) {
  display: none !important;
}


/* __FREY_DELOAD_WINDOW_V0_2__ */
[data-frey-deload="FREY_DELOAD_WINDOW_V0_2"]{
  max-width: 720px !important;
  margin-left: auto !important;
  margin-right: auto !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}
[data-frey-deload="FREY_DELOAD_WINDOW_V0_2"] h2,
[data-frey-deload="FREY_DELOAD_WINDOW_V0_2"] .muted{ display: none !important; }

[data-frey-deload="FREY_DELOAD_WINDOW_V0_2"] .qRow{
  max-width: 720px !important;
  margin: 0 auto 14px auto !important;
  padding: 16px !important;
  border-radius: 22px !important;
  border: 1px solid rgba(255,255,255,0.10) !important;
  background: rgba(0,0,0,0.20) !important;
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
[data-frey-deload="FREY_DELOAD_WINDOW_V0_2"] .chips{
  max-width: 720px !important;
  margin-left: auto !important;
  margin-right: auto !important;
  margin-top: 10px !important;
}

.wrap{ padding-top: clamp(32px, 4vh, 56px) !important; padding-bottom: clamp(78px, 9vh, 120px) !important; }
.hero{ margin-bottom: clamp(18px, 3vh, 36px) !important; }

@media (max-width: 640px){
  [data-frey-deload="FREY_DELOAD_WINDOW_V0_2"] .qRow{ padding: 14px !important; border-radius: 20px !important; }
}

/* FREY_UI_CONTROLS_V0_1 */
.askFreyInput {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  color: rgba(233, 238, 247, 0.95);
  background: rgba(10, 14, 20, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  outline: none;
}
.askFreyInput::placeholder {
  color: rgba(233, 238, 247, 0.55);
}
.askFreyInput:focus {
  border-color: rgba(233, 184, 93, 0.55);
  box-shadow: 0 0 0 3px rgba(233, 184, 93, 0.12);
}

.askFreyCta {
  width: 100%;
  height: 44px;
  margin-top: 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(10, 14, 20, 0.40);
  color: rgba(233, 238, 247, 0.92);
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, transform 120ms ease;
}
.askFreyCta:hover {
  background: rgba(10, 14, 20, 0.52);
  border-color: rgba(233, 184, 93, 0.35);
}
.askFreyCta:active {
  transform: translateY(1px);
}
.askFreyCta:disabled {
  opacity: 0.38;
  cursor: default;
}

.askFreyChip {
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(10, 14, 20, 0.38);
  color: rgba(233, 238, 247, 0.90);
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease;
}
.askFreyChip:hover {
  background: rgba(10, 14, 20, 0.52);
  border-color: rgba(233, 184, 93, 0.32);
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
