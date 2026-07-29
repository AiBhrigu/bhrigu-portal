export const BTC_PRODUCT_REBALANCE_CSS = String.raw`
:root{
  --f:#05070c;
  --s:#09111d;
  --e:#0d1828;
  --t:#edf2f7;
  --t2:#b6c1cf;
  --m:#7f8fa2;
  --b:#d2a45f;
  --bh:#e7bf7e;
  --bl:rgba(106,168,255,.22);
  --bf:rgba(210,164,95,.075);
  --blue:#6aa8ff;
  --sup:#8f7cf4;
  --red:#d7867f;
  --g:#5d6978;
  --phi-major:61.803398875%;
  --phi-minor:38.196601125%;
}
html,body{
  background:
    radial-gradient(circle at 78% 12%,rgba(106,168,255,.08),transparent 31%),
    radial-gradient(circle at 16% 86%,rgba(143,124,244,.045),transparent 34%),
    var(--f);
}
main{width:min(1360px,100%);padding-inline:clamp(18px,3.2vw,42px)}
.heroProductEntry{
  display:grid;
  grid-template-columns:minmax(0,38.196601125fr) minmax(420px,61.803398875fr);
  gap:clamp(34px,5vw,78px);
  align-items:center;
  min-height:min(700px,calc(100svh - 132px));
  padding:clamp(24px,3.6vw,48px) 0;
  border-bottom:1px solid var(--bl);
}
.heroProductCopy{align-self:center;max-width:34rem}
.heroProductCopy h1{
  margin:.28em 0 .18em;
  font-size:clamp(48px,6.4vw,88px);
  line-height:.92;
  letter-spacing:-.065em;
  text-wrap:balance;
}
.heroProductCopy>p:last-child{max-width:31rem;color:var(--t2);font-size:clamp(16px,1.7vw,20px);line-height:1.65}
.heroQuestionCard{
  position:relative;
  isolation:isolate;
  overflow:hidden;
  min-height:clamp(390px,52svh,510px);
  display:grid;
  align-content:center;
  gap:14px;
  padding:clamp(24px,3.2vw,42px);
  border:1px solid rgba(106,168,255,.34);
  border-radius:21px 34px;
  background:
    linear-gradient(90deg,transparent calc(var(--phi-major) - .08%),rgba(210,164,95,.28) var(--phi-major),transparent calc(var(--phi-major) + .08%)),
    linear-gradient(180deg,transparent calc(var(--phi-minor) - .08%),rgba(106,168,255,.28) var(--phi-minor),transparent calc(var(--phi-minor) + .08%)),
    radial-gradient(circle at var(--phi-major) var(--phi-minor),rgba(106,168,255,.14),transparent 24%),
    linear-gradient(145deg,rgba(12,25,44,.98),rgba(5,10,18,.98));
  box-shadow:0 30px 90px rgba(0,0,0,.38),inset 0 1px 0 rgba(255,255,255,.04);
}
.heroQuestionCard:before{
  content:"";
  position:absolute;
  inset:18px;
  border:1px solid rgba(255,255,255,.035);
  border-radius:13px 21px;
  pointer-events:none;
}
.heroQuestionHeader{position:relative;display:flex;gap:15px;align-items:center}
.heroQuestionHeader h2{margin:5px 0 0;font-size:clamp(27px,3.1vw,42px);line-height:1.05;letter-spacing:-.035em}
.heroQuestionGlyph{width:46px;height:46px;border-color:rgba(106,168,255,.65)}
.heroQuestionGlyph b{color:var(--t)}
.heroQuestionLead{position:relative;max-width:46rem;margin:0;color:var(--t2);font-size:14px;line-height:1.5}
.heroQuestionForm{position:relative;display:grid;grid-template-columns:1fr;gap:13px}
.heroQuestionInput{display:grid;gap:8px}
.heroQuestionInput textarea{min-height:94px;border-color:rgba(106,168,255,.3);background:rgba(2,7,14,.72);line-height:1.5}
.heroQuestionControls{display:grid;grid-template-columns:minmax(170px,.62fr) minmax(190px,.38fr);gap:13px;align-items:end}
.heroQuestionControls button{
  width:100%;
  min-height:48px;
  justify-self:stretch;
  border-color:rgba(106,168,255,.72);
  background:linear-gradient(110deg,rgba(106,168,255,.28),rgba(143,124,244,.16));
  box-shadow:0 10px 30px rgba(35,82,145,.18);
}
.heroQuestionControls button:hover{background:linear-gradient(110deg,rgba(106,168,255,.4),rgba(143,124,244,.22))}
.heroQuestionBoundary{position:relative;margin:0;color:var(--m);font-size:11px;letter-spacing:.04em}
.fieldNav{background:rgba(5,7,12,.92);border-color:var(--bl)}
.questionPanel,.readingZone{border-color:var(--bl)}
.questionMembrane,.readingHeader,.executiveField,.phiPlane{grid-template-columns:minmax(0,61.803398875fr) minmax(280px,38.196601125fr)}
.exampleRoutes,.executiveContext,.supportBand{border-color:var(--bl)}
textarea,input{border-color:rgba(106,168,255,.2);background:rgba(9,17,29,.88)}
textarea:focus,input:focus{border-color:rgba(106,168,255,.66);box-shadow:0 0 0 3px rgba(106,168,255,.08);outline:0}
button{border-color:rgba(210,164,95,.58)}
.eyebrow{color:var(--b)}
.fieldAnchorGlyph{border-color:rgba(106,168,255,.48);background:radial-gradient(circle,rgba(106,168,255,.1),transparent 68%)}
.fieldAnchorGlyph:after{border-color:rgba(210,164,95,.16)}
.fieldAnchorGlyph b{color:var(--bh)}
.metricRibbon,.phiPlane,.memoryAxis,.evidenceStack{border-color:var(--bl)}
.btcAxis:before{background:linear-gradient(90deg,var(--blue),rgba(210,164,95,.42),rgba(237,242,247,.1))}
.closingField span{background:linear-gradient(90deg,transparent,rgba(106,168,255,.32),rgba(210,164,95,.2),transparent)}
@media(max-width:1080px){
  .heroProductEntry{grid-template-columns:1fr;min-height:auto;padding-top:42px}
  .heroProductCopy{max-width:48rem}
  .heroQuestionCard{min-height:0}
}
@media(max-width:680px){
  main{padding-inline:16px}
  .heroProductEntry{gap:26px;padding:30px 0 34px}
  .heroProductCopy h1{font-size:clamp(44px,16vw,68px)}
  .heroQuestionCard{padding:24px 18px;border-radius:18px 28px}
  .heroQuestionControls{grid-template-columns:1fr}
}
`;
