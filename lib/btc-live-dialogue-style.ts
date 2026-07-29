export const BTC_LIVE_DIALOGUE_CSS = String.raw`
body:has(.liveDialoguePage) nav[aria-label="Portal navigation"]{display:none}
.liveDialoguePage{--phi-major:61.803398875%;--phi-minor:38.196601125%;width:min(1180px,100%);padding:0 clamp(16px,3vw,42px) 96px}
.liveDialogueTopbar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;min-height:58px;margin-top:18px;border-bottom:1px solid var(--bl);color:var(--t2);font-size:11px;letter-spacing:.1em;text-transform:uppercase}
.liveBackLink,.liveLocaleLink{text-decoration:none}.liveBackLink:hover,.liveLocaleLink:hover{color:var(--t)}
.liveLocaleLink{justify-self:end;border:1px solid rgba(106,168,255,.28);border-radius:999px;padding:8px 12px}
.liveIdentity{display:flex;align-items:center;gap:10px;color:var(--t)}.liveIdentityGlyph{width:30px;height:30px}
.liveDialogueShell{width:min(760px,100%);margin:0 auto;padding:clamp(42px,7vw,88px) 0 0}
.liveDialogueIntro{display:grid;gap:10px;margin-bottom:clamp(30px,5vw,52px)}
.liveDialogueIntro h1{margin:0;font-size:clamp(42px,6vw,72px);line-height:.95;letter-spacing:-.055em}
.liveDialogueIntro>p:not(.eyebrow){margin:0;color:var(--t2);font-size:clamp(17px,2vw,21px);line-height:1.5}
.liveTrustLine{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:8px;color:var(--m);font-size:10px;letter-spacing:.07em;text-transform:uppercase}
.liveTrustLine span{display:flex;align-items:center;gap:8px}.liveTrustLine span+span:before{content:"";width:3px;height:3px;border-radius:50%;background:var(--blue)}
.liveThread{display:grid;gap:24px;margin-bottom:30px}
.dialogueTurn{display:grid;gap:8px}.turnRole{display:flex;align-items:center;gap:8px;color:var(--m);font-size:9px;letter-spacing:.1em;text-transform:uppercase}.turnGlyph{width:28px;height:28px}
.turnBody{position:relative;padding:clamp(20px,3vw,30px);border:1px solid rgba(106,168,255,.2);border-radius:18px;background:rgba(8,16,28,.72)}
.userTurn{justify-items:end}.userTurn .turnRole{padding-right:4px}.userTurn .turnBody{width:min(86%,650px);border-color:rgba(210,164,95,.18);background:rgba(210,164,95,.045)}.userTurn .turnBody p{margin:0;font-size:clamp(16px,2vw,19px);line-height:1.55}
.cosmographerTurn .turnBody:before{content:"";position:absolute;top:-1px;left:0;width:var(--phi-major);height:1px;background:linear-gradient(90deg,var(--blue),var(--b),transparent)}
.answerHeader{display:grid;gap:5px}.answerHeader h2{margin:0;font-size:clamp(30px,4.5vw,48px);line-height:1}
.answerLead{margin:18px 0 0;color:var(--t);font-size:clamp(18px,2.2vw,22px);line-height:1.55}
.answerNarrative{display:grid;gap:14px;margin-top:22px}.answerNarrative p{margin:0;color:var(--t2);line-height:1.65}.answerNarrative strong{color:var(--t);font-weight:600}
.answerSource{margin-top:24px;padding-top:14px;border-top:1px solid var(--bl);color:var(--m);font-size:10px;letter-spacing:.05em;text-transform:uppercase}
.dialogueFailure .turnBody{border-color:rgba(215,134,127,.45)}
.liveComposer{display:grid;gap:12px;padding:18px;border:1px solid rgba(106,168,255,.28);border-radius:18px;background:linear-gradient(145deg,rgba(9,20,35,.94),rgba(5,10,18,.96))}
.liveComposer label{display:grid;gap:8px}.liveComposer textarea{min-height:86px;resize:vertical;background:rgba(2,7,14,.66)}
.liveComposerControls{display:grid;grid-template-columns:minmax(180px,var(--phi-minor)) minmax(220px,var(--phi-major));gap:12px;align-items:end}
.liveComposer button{width:100%;min-height:48px;border-color:rgba(106,168,255,.72);background:linear-gradient(110deg,rgba(106,168,255,.3),rgba(143,124,244,.17))}
.liveComposerAfterAnswer{margin-top:12px}.liveBoundary{margin:12px 0 0;color:var(--m);font-size:10px;letter-spacing:.04em;text-align:center}
@media(max-width:760px){.liveDialoguePage{padding-inline:14px}.liveDialogueTopbar{grid-template-columns:1fr auto}.liveIdentity{display:none}.liveDialogueShell{padding-top:34px}.liveDialogueIntro{margin-bottom:28px}.liveDialogueIntro h1{font-size:clamp(38px,12vw,52px)}.liveTrustLine{gap:7px 12px}.userTurn .turnBody{width:94%}.turnBody{padding:19px 17px}.liveComposerControls{grid-template-columns:1fr}.liveBoundary{text-align:left}}
`;
