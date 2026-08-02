export const BTC_PRODUCT_REBALANCE_CSS = String.raw`
:root{
  --f:#05070c;--s:#09111d;--e:#0d1828;--t:#edf2f7;--t2:#b6c1cf;--m:#7f8fa2;
  --b:#d2a45f;--bh:#e7bf7e;--bl:rgba(106,168,255,.22);--bf:rgba(210,164,95,.075);
  --blue:#6aa8ff;--sup:#8f7cf4;--red:#d7867f;--g:#5d6978;
  --phi-major:61.803398875%;--phi-minor:38.196601125%;
}
html,body{background:radial-gradient(circle at 78% 12%,rgba(106,168,255,.08),transparent 31%),radial-gradient(circle at 16% 86%,rgba(143,124,244,.045),transparent 34%),var(--f)}
main{width:min(1360px,100%);padding-inline:clamp(18px,3.2vw,42px)}
body:has(main[data-btc-static-proof="true"]) nav[aria-label="Portal navigation"]{display:none!important}
main[data-btc-static-proof="true"],.heroProductEntry,.questionPanel{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.heroProductEntry{display:grid;grid-template-columns:minmax(0,38.196601125fr) minmax(420px,61.803398875fr);gap:clamp(32px,4.6vw,68px);align-items:center;min-height:min(650px,calc(100svh - 96px));padding:clamp(30px,4vw,54px) 0;border-bottom:1px solid var(--bl)}
.heroProductCopy{align-self:center;max-width:38rem}
.heroProductCopy h1{margin:.25em 0 .2em;font-size:clamp(52px,6.6vw,92px);line-height:.91;letter-spacing:-.067em;text-wrap:balance}
.heroProductCopy>p:last-child{max-width:35rem;color:var(--t2);font-size:clamp(17px,1.75vw,21px);line-height:1.62}
.heroQuestionCard{position:relative;isolation:isolate;overflow:hidden;min-height:clamp(390px,49svh,500px);display:grid;align-content:center;gap:17px;padding:clamp(26px,3.4vw,44px);border:1px solid rgba(106,168,255,.36);border-radius:24px 38px;background:radial-gradient(circle at var(--phi-major) var(--phi-minor),rgba(106,168,255,.13),transparent 25%),linear-gradient(145deg,rgba(12,25,44,.98),rgba(5,10,18,.98));box-shadow:0 30px 90px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.04)}
.heroQuestionCard:before{content:"";position:absolute;inset:18px;border:1px solid rgba(255,255,255,.035);border-radius:15px 24px;pointer-events:none}
.heroQuestionHeader{position:relative;display:flex;gap:15px;align-items:flex-start}.heroQuestionHeader h2{margin:5px 0 0;font-size:clamp(29px,3.2vw,44px);line-height:1.04;letter-spacing:-.04em;text-wrap:balance}
.heroQuestionGlyph{width:48px;height:48px;border-color:rgba(106,168,255,.65)}.heroQuestionGlyph b{color:var(--t)}
.heroQuestionLead{position:relative;max-width:42rem;margin:0;color:var(--t2);font-size:clamp(15px,1.45vw,18px);line-height:1.58}
.heroValuePath{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.heroValuePath span{padding:10px 12px;border:1px solid rgba(106,168,255,.16);border-radius:11px;background:rgba(4,11,20,.52);color:var(--t2);font-size:12px;line-height:1.35}
.heroValuePath span:nth-child(3),.heroValuePath span:nth-child(4){border-color:rgba(143,124,244,.22)}
.heroDialogueCta{position:relative;display:flex;align-items:center;justify-content:space-between;gap:18px;width:100%;padding:18px 21px;border:1px solid rgba(210,164,95,.7);border-radius:999px;background:linear-gradient(110deg,rgba(210,164,95,.25),rgba(106,168,255,.16));color:var(--t);text-decoration:none;font-weight:750}
.heroDialogueCta:hover{background:linear-gradient(110deg,rgba(210,164,95,.35),rgba(106,168,255,.23))}.heroDialogueCta span{color:var(--bh);font-size:20px}
.heroDialogueGateway{min-height:clamp(360px,46svh,470px)}
.heroQuestionBoundary{position:relative;margin:0;color:var(--m);font-size:11px;line-height:1.55;letter-spacing:.025em}
.snapshotTruthStrip{display:grid;grid-template-columns:minmax(190px,.38fr) minmax(0,.62fr);gap:18px;align-items:center;margin:0;padding:19px 0 22px;border-bottom:1px solid var(--bl);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.snapshotTruthStrip>strong{display:flex;align-items:center;gap:10px;font-size:14px;line-height:1.35}.snapshotTruthStrip>strong:before{content:"";width:8px;height:8px;border-radius:50%;background:var(--m);box-shadow:0 0 0 5px rgba(127,143,162,.08)}.snapshotTruthStrip[data-freshness-state="FRESH"]>strong:before{background:var(--blue);box-shadow:0 0 0 5px rgba(106,168,255,.1)}.snapshotTruthStrip[data-freshness-state="STALE_LIMITED"]>strong:before{background:var(--b);box-shadow:0 0 0 5px rgba(210,164,95,.1)}.snapshotTruthStrip[data-freshness-state="UNAVAILABLE"]>strong:before{background:var(--red);box-shadow:0 0 0 5px rgba(215,134,127,.1)}.snapshotTruthStrip>p{margin:0;color:var(--t2);font-size:13px;line-height:1.45}.snapshotTruthStrip>p:has(code){display:none}.snapshotTruthStrip>p:not(:has(code)){justify-self:end}.snapshotTruthStrip>p:not(:has(code))+p:not(:has(code)):before{content:"·";margin-right:14px;color:var(--blue)}
.productOutcomeHeader{display:grid;gap:10px;max-width:760px;padding:clamp(40px,5.6vw,70px) 0 22px}.productOutcomeHeader h2{margin:0;font-size:clamp(35px,5vw,60px);line-height:1;letter-spacing:-.045em;text-wrap:balance}.productOutcomeHeader>p:last-child{margin:0;color:var(--t2);font-size:17px;line-height:1.6}
.productOutcomeGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:clamp(46px,6vw,78px)}
.productOutcomeGrid article{min-height:190px;padding:20px;border:1px solid rgba(106,168,255,.18);border-radius:16px;background:linear-gradient(145deg,rgba(9,19,33,.74),rgba(5,10,18,.78))}.productOutcomeGrid article:nth-child(3){border-color:rgba(143,124,244,.3)}.productOutcomeGrid article:nth-child(4){border-color:rgba(210,164,95,.3)}
.productOutcomeGrid span{color:var(--blue);font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace;font-size:11px}.productOutcomeGrid h3{margin:24px 0 10px;color:var(--t);font-size:19px;line-height:1.2}.productOutcomeGrid p{margin:0;color:var(--t2);font-size:14px;line-height:1.55}
.fieldNav{background:rgba(5,7,12,.92);border-color:var(--bl)}
.questionPanel{border-color:var(--bl)}.proofRouteMembrane{grid-template-columns:minmax(0,38.196601125fr) minmax(0,61.803398875fr);border-top:1px solid var(--bl)}
.staticProofHeader{display:grid;align-content:start;gap:18px;padding:clamp(30px,4vw,54px)}.staticProofHeader>p{margin:0;color:var(--t2);line-height:1.65}.staticExampleRoutes{border-left:1px solid var(--bl)}
.questionPanel,.readingZone{border-color:var(--bl)}
.questionMembrane,.readingHeader,.executiveField,.phiPlane{grid-template-columns:minmax(0,61.803398875fr) minmax(280px,38.196601125fr)}
.exampleRoutes,.executiveContext,.supportBand{border-color:var(--bl)}
textarea,input{border-color:rgba(106,168,255,.2);background:rgba(9,17,29,.88)}textarea:focus,input:focus{border-color:rgba(106,168,255,.66);box-shadow:0 0 0 3px rgba(106,168,255,.08);outline:0}button{border-color:rgba(210,164,95,.58)}
.eyebrow{color:var(--b)}.fieldAnchorGlyph{border-color:rgba(106,168,255,.48);background:radial-gradient(circle,rgba(106,168,255,.1),transparent 68%)}.fieldAnchorGlyph:after{border-color:rgba(210,164,95,.16)}.fieldAnchorGlyph b{color:var(--bh)}
.metricRibbon,.phiPlane,.memoryAxis,.evidenceStack{border-color:var(--bl)}.btcAxis:before{background:linear-gradient(90deg,var(--blue),rgba(210,164,95,.42),rgba(237,242,247,.1))}.closingField span{background:linear-gradient(90deg,transparent,rgba(106,168,255,.32),rgba(210,164,95,.2),transparent)}
@media(max-width:1080px){.heroProductEntry{grid-template-columns:1fr;min-height:auto;padding-top:42px}.heroProductCopy{max-width:50rem}.heroQuestionCard{min-height:0}.productOutcomeGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.snapshotTruthStrip{grid-template-columns:1fr;gap:9px}.snapshotTruthStrip>p:not(:has(code)){justify-self:start}}
@media(max-width:900px){.proofRouteMembrane{grid-template-columns:1fr}.staticExampleRoutes{border-left:0;border-top:1px solid var(--bl)}}
@media(max-width:680px){
main{padding-inline:16px}.heroProductEntry{gap:22px;padding:26px 0 30px}.heroProductCopy h1{margin:.22em 0 .12em;font-size:clamp(42px,12.6vw,56px);line-height:.94}.heroProductCopy>p:last-child{display:block;font-size:15px;line-height:1.55}.heroQuestionCard{min-height:0;gap:13px;padding:22px 17px;border-radius:18px 28px}.heroQuestionCard:before{inset:12px}.heroQuestionHeader{gap:12px}.heroQuestionHeader h2{font-size:clamp(27px,8.2vw,34px)}.heroQuestionGlyph{width:40px;height:40px}.heroQuestionLead{font-size:14px;line-height:1.48}.heroValuePath{grid-template-columns:1fr}.heroValuePath span{padding:9px 10px}.heroDialogueCta{padding:15px 17px}.heroQuestionBoundary{font-size:10px}.snapshotTruthStrip{padding:15px 0 18px}.snapshotTruthStrip>p:not(:has(code))+p:not(:has(code)):before{margin-right:10px}.productOutcomeHeader{padding-top:38px}.productOutcomeHeader h2{font-size:36px}.productOutcomeGrid{grid-template-columns:1fr;gap:9px}.productOutcomeGrid article{min-height:0}.productOutcomeGrid h3{margin-top:16px}.proofRouteMembrane{display:block}.staticProofHeader{gap:14px;padding:26px 0}.staticProofHeader .questionTitleLockup{align-items:flex-start}.staticProofHeader h2{font-size:clamp(27px,8vw,32px);line-height:1.05}.staticProofHeader>p{font-size:14px;line-height:1.55}.staticExampleRoutes{margin:0;padding:26px 0 0}.staticExampleRoutes h3{font-size:23px;line-height:1.1}.exampleRouteList a{grid-template-columns:26px minmax(0,1fr) 18px;gap:8px;padding:15px 0}.exampleRouteList b,.exampleRouteList em{min-width:0;overflow-wrap:anywhere}
}
`;
