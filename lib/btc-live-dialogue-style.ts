export const BTC_LIVE_DIALOGUE_CSS = String.raw`
body:has(.liveDialoguePage) nav[aria-label="Portal navigation"],.liveDialoguePage~nav[aria-label="Portal navigation"]{display:none}
.liveDialoguePage{--phi-major:61.803398875%;--phi-minor:38.196601125%;width:min(1180px,100%);padding:0 clamp(16px,3vw,42px) 96px}
.liveDialogueTopbar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;min-height:58px;margin-top:18px;border-bottom:1px solid var(--bl);color:var(--t2);font-size:11px;letter-spacing:.1em;text-transform:uppercase}
.liveBackLink,.liveLocaleLink{text-decoration:none}.liveBackLink:hover,.liveLocaleLink:hover{color:var(--t)}
.liveLocaleLink{justify-self:end;border:1px solid rgba(106,168,255,.28);border-radius:999px;padding:8px 12px}
.liveIdentity{display:flex;align-items:center;gap:10px;color:var(--t)}.liveIdentityGlyph{width:30px;height:30px}
.liveDialogueShell{width:min(760px,100%);margin:0 auto;padding:clamp(42px,7vw,88px) 0 0}
.liveDialogueIntro{display:grid;gap:10px;margin-bottom:clamp(30px,5vw,52px)}
.liveDialogueIntro h1{margin:0;font-size:clamp(42px,6vw,72px);line-height:.95;letter-spacing:-.055em}
.liveDialogueIntro>p:not(.eyebrow):not(.liveCompactionNotice){margin:0;color:var(--t2);font-size:clamp(17px,2vw,21px);line-height:1.5}
.liveTrustLine{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:8px;color:var(--m);font-size:10px;letter-spacing:.07em;text-transform:uppercase}
.liveTrustLine span{display:flex;align-items:center;gap:8px}.liveTrustLine span+span:before{content:"";width:3px;height:3px;border-radius:50%;background:var(--blue)}
.liveSessionLine{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin-top:10px;padding-top:12px;border-top:1px solid rgba(106,168,255,.14);color:var(--m);font-size:10px;letter-spacing:.055em;text-transform:uppercase}
.liveSessionLine span+span:before{content:"·";margin-right:14px;color:var(--blue)}
.liveNewConversation{margin-left:auto;min-height:34px;padding:7px 12px;border:1px solid rgba(210,164,95,.28);border-radius:999px;background:rgba(210,164,95,.045);color:var(--t2);font-size:10px;letter-spacing:.06em;text-transform:uppercase}
.liveNewConversation:hover{border-color:rgba(210,164,95,.6);color:var(--t)}
.liveCompactionNotice{margin:2px 0 0;padding:10px 12px;border-left:2px solid rgba(210,164,95,.5);color:var(--m);font-size:12px;line-height:1.5}
.liveThread{display:grid;gap:28px;margin-bottom:30px}
.dialogueExchange{display:grid;gap:18px}
.dialogueTurn{display:grid;gap:8px;outline:none;scroll-margin-top:18px}.turnRole{display:flex;align-items:center;gap:8px;color:var(--m);font-size:9px;letter-spacing:.1em;text-transform:uppercase}.turnGlyph{width:28px;height:28px}
.turnBody{position:relative;padding:clamp(20px,3vw,30px);border:1px solid rgba(106,168,255,.2);border-radius:18px;background:rgba(8,16,28,.72)}
.userTurn{justify-items:end}.userTurn .turnRole{padding-right:4px}.userTurn .turnBody{width:min(86%,650px);border-color:rgba(210,164,95,.18);background:rgba(210,164,95,.045)}.userTurn .turnBody p{margin:0;font-size:clamp(16px,2vw,19px);line-height:1.55;overflow-wrap:anywhere}
.cosmographerTurn .turnBody:before,.cosmographerHistoryTurn .turnBody:before{content:"";position:absolute;top:-1px;left:0;width:var(--phi-major);height:1px;background:linear-gradient(90deg,var(--blue),var(--b),transparent)}
.cosmographerHistoryTurn{opacity:.94}
.answerHeader{display:grid;gap:5px}.answerHeader h2{margin:0;font-size:clamp(30px,4.5vw,48px);line-height:1}
.answerLead{margin:18px 0 0;color:var(--t);font-size:clamp(18px,2.2vw,22px);line-height:1.55;overflow-wrap:anywhere}
.answerNarrative{display:grid;gap:14px;margin-top:22px}.answerNarrative p{margin:0;color:var(--t2);line-height:1.65}.answerNarrative strong{color:var(--t);font-weight:600}.answerNarrative ul{display:grid;gap:8px;margin:10px 0 0;padding-left:20px;color:var(--t2)}.answerNarrative li{line-height:1.55;overflow-wrap:anywhere}
.astroWindowGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.astroWindowCard{display:grid;grid-template-columns:auto minmax(0,1fr);gap:13px;margin:0;padding:15px;border:1px solid rgba(106,168,255,.22);border-radius:14px;background:rgba(10,22,38,.72)}
.astroWindowRank{display:grid;align-content:start;justify-items:center;min-width:52px;padding:9px 7px;border:1px solid rgba(106,168,255,.34);border-radius:12px;background:rgba(106,168,255,.055);color:var(--t)}
.astroWindowRank span{font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--m)}.astroWindowRank strong{font-size:22px;line-height:1.1}
.astroWindowBody{min-width:0}.astroWindowRange{color:var(--t);font-size:12px;line-height:1.4}.astroWindowPeak{margin-top:3px;color:var(--gold);font-size:10px;letter-spacing:.06em;text-transform:uppercase}
.astroWindowTitle{margin:10px 0 7px;color:var(--t);font-size:17px;line-height:1.25}.astroWindowBasis{margin:0!important;color:var(--t2)!important;font-size:13px;line-height:1.5!important}
.answerNarrative [data-semantic-answer-section="market_layer"]{order:-1;padding:15px;border:1px solid rgba(210,164,95,.28);border-radius:14px;background:rgba(210,164,95,.045)}
.answerDisclosure{border:1px solid rgba(106,168,255,.2);border-radius:14px;background:rgba(5,12,21,.62)}
.answerDisclosure summary{cursor:pointer;padding:13px 15px;color:var(--t);font-weight:600}.answerDisclosure[open] summary{border-bottom:1px solid var(--bl)}.answerDisclosure ul{padding:13px 30px 16px}
.answerSource,.answerSourceHistory{display:grid;gap:7px;margin-top:24px;padding-top:14px;border-top:1px solid var(--bl);color:var(--m);font-size:10px;letter-spacing:.05em;text-transform:uppercase;overflow-wrap:anywhere}
.answerSource span,.answerSourceHistory span{display:block;line-height:1.55;text-transform:none;letter-spacing:0}
.sourceChangedNote{margin:18px 0 0;padding:11px 13px;border:1px solid rgba(106,168,255,.22);border-radius:12px;background:rgba(106,168,255,.055);color:var(--t2);font-size:12px;line-height:1.55}
.dialogueStateFAILURE .turnBody,.dialogueStateCLARIFICATION .turnBody{border-color:rgba(215,134,127,.45)}
.dialogueStateCLARIFICATION .turnBody:before{background:linear-gradient(90deg,rgba(215,134,127,.8),rgba(210,164,95,.5),transparent)}
.dialogueStateBOUNDED .turnBody{border-color:rgba(210,164,95,.32)}
.liveComposer{display:grid;grid-template-columns:minmax(0,1fr);align-items:stretch;gap:12px;padding:18px;border:1px solid rgba(106,168,255,.28);border-radius:18px;background:linear-gradient(145deg,rgba(9,20,35,.94),rgba(5,10,18,.96))}
.liveComposer>label,.liveComposerControls,.liveComposerControls>label,.liveComposerControls>button{min-width:0}
.liveComposer label{display:grid;gap:8px}.liveComposer textarea{min-height:86px;resize:vertical;background:rgba(2,7,14,.66)}
.liveComposerControls{display:grid;grid-template-columns:minmax(180px,.61803398875fr) minmax(220px,1fr);gap:12px;align-items:end}
.liveComposer button{width:100%;min-height:48px;border-color:rgba(106,168,255,.72);background:linear-gradient(110deg,rgba(106,168,255,.3),rgba(143,124,244,.17))}
.liveComposerAfterAnswer{margin-top:12px;box-shadow:0 14px 40px rgba(0,0,0,.18)}
.liveBoundary{margin:12px 0 0;color:var(--m);font-size:10px;letter-spacing:.04em;text-align:center}
@media(max-width:760px){
.liveDialoguePage{padding-inline:14px}.liveDialogueTopbar{grid-template-columns:1fr auto}.liveIdentity{display:none}.liveDialogueShell{padding-top:34px}.liveDialogueIntro{margin-bottom:28px}.liveDialogueIntro h1{font-size:clamp(38px,12vw,52px)}.liveTrustLine{gap:7px 12px}
.liveDialogueShell:has(.liveThread){padding-top:20px}.liveDialogueShell:has(.liveThread) .liveDialogueIntro{gap:5px;margin-bottom:18px}.liveDialogueShell:has(.liveThread) .liveDialogueIntro>.eyebrow,.liveDialogueShell:has(.liveThread) .liveDialogueIntro>p:not(.eyebrow):not(.liveCompactionNotice){display:none}.liveDialogueShell:has(.liveThread) .liveDialogueIntro h1{font-size:30px;line-height:1}.liveDialogueShell:has(.liveThread) .liveTrustLine{margin-top:5px;font-size:8px}
.liveSessionLine{gap:7px 10px;font-size:8px}.liveSessionLine span+span:before{margin-right:10px}.liveNewConversation{width:100%;margin-left:0}
.liveDialogueShell:has(.liveThread) .liveThread{gap:22px}.dialogueExchange{gap:14px}.liveDialogueShell:has(.liveThread) .userTurn .turnBody{padding:15px 16px}.userTurn .turnBody{width:94%}.turnBody{padding:19px 17px}.answerHeader h2{font-size:clamp(27px,8.5vw,36px)}.answerLead{font-size:18px}.astroWindowGrid{grid-template-columns:1fr}.astroWindowCard{grid-template-columns:48px minmax(0,1fr);padding:13px}.liveComposerControls{grid-template-columns:1fr}.liveBoundary{text-align:left}
}
`;
