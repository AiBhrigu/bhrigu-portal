export const BTC_LIVE_DIALOGUE_CSS = String.raw`
body:has(.liveDialoguePage) nav[aria-label="Portal navigation"],.liveDialoguePage~nav[aria-label="Portal navigation"]{display:none}
.liveDialoguePage{--phi-major:61.803398875%;--phi-minor:38.196601125%;width:min(1240px,100%);padding:0 clamp(16px,3vw,42px) 96px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.liveDialogueTopbar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;min-height:64px;margin-top:12px;border-bottom:1px solid var(--bl);color:var(--t2);font-size:11px;letter-spacing:.09em;text-transform:uppercase}
.liveBackLink,.liveLocaleLink{text-decoration:none}.liveBackLink:hover,.liveLocaleLink:hover{color:var(--t)}
.liveLocaleLink{justify-self:end;border:1px solid rgba(106,168,255,.28);border-radius:999px;padding:8px 12px}
.liveIdentity{display:flex;align-items:center;gap:10px;color:var(--t)}.liveIdentityGlyph{width:30px;height:30px}
.liveDialogueShell{width:min(920px,100%);margin:0 auto;padding:clamp(32px,5vw,58px) 0 0}.liveDialogueShell:not(:has(.liveThread)){padding-top:clamp(28px,4vw,44px)}
.liveDialogueIntro{display:grid;gap:12px;margin-bottom:clamp(24px,3.6vw,34px)}.liveDialogueShell:not(:has(.liveThread)) .liveDialogueIntro{margin-bottom:22px}
.liveDialogueIntro h1{max-width:780px;margin:0;font-size:clamp(46px,6vw,72px);line-height:.98;letter-spacing:-.055em;text-wrap:balance}
.liveDialogueIntro>p:not(.eyebrow):not(.liveCompactionNotice){max-width:720px;margin:0;color:var(--t2);font-size:clamp(17px,2vw,21px);line-height:1.55}
.liveTrustLine{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:8px;color:var(--m);font-size:10px;letter-spacing:.07em;text-transform:uppercase}
.liveTrustLine span{display:flex;align-items:center;gap:8px}.liveTrustLine span+span:before{content:"";width:3px;height:3px;border-radius:50%;background:var(--blue)}
.liveSessionLine{display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin-top:8px;padding-top:13px;border-top:1px solid rgba(106,168,255,.14);color:var(--m);font-size:10px;letter-spacing:.055em;text-transform:uppercase}
.liveSessionLine span+span:before{content:"·";margin-right:14px;color:var(--blue)}
.liveNewConversation{margin-left:auto;min-height:34px;padding:7px 12px;border:1px solid rgba(210,164,95,.28);border-radius:999px;background:rgba(210,164,95,.045);color:var(--t2);font:inherit;letter-spacing:.06em;text-transform:uppercase}
.liveNewConversation:hover{border-color:rgba(210,164,95,.6);color:var(--t)}
.liveCompactionNotice{margin:2px 0 0;padding:10px 12px;border-left:2px solid rgba(210,164,95,.5);color:var(--m);font-size:12px;line-height:1.5}
.activeContextLine{display:flex;flex-wrap:wrap;gap:7px 16px;margin:0 0 10px;padding:10px 2px;border-top:1px solid rgba(106,168,255,.13);color:var(--m);font-size:10px;line-height:1.45;letter-spacing:.045em;text-transform:uppercase}
.activeContextLine span{min-width:0;overflow-wrap:anywhere}.activeContextLine span+span:before{content:"·";margin-right:16px;color:var(--blue)}.activeContextLine b{color:var(--t2);font-weight:650}
.liveThread{display:grid;gap:34px;margin-bottom:30px}
.olderTurnsDisclosure{border:1px solid rgba(106,168,255,.16);border-radius:16px;background:rgba(5,10,18,.55)}
.olderTurnsDisclosure>summary{cursor:pointer;padding:14px 18px;color:var(--t2);font-size:12px;letter-spacing:.05em;text-transform:uppercase}
.olderTurnsDisclosure>div{display:grid;gap:24px;padding:0 16px 18px}
.dialogueExchange{display:grid;gap:14px}
.dialogueTurn{display:grid;gap:8px;outline:none;scroll-margin-top:18px}.turnRole{display:flex;align-items:center;gap:8px;color:var(--m);font-size:9px;letter-spacing:.1em;text-transform:uppercase}.turnGlyph{width:28px;height:28px}
.turnBody{position:relative;padding:clamp(22px,3.4vw,38px);border:1px solid rgba(106,168,255,.22);border-radius:22px;background:linear-gradient(145deg,rgba(9,19,33,.94),rgba(5,11,20,.96));box-shadow:0 24px 70px rgba(0,0,0,.24)}
.userTurn{justify-items:end}.userTurn .turnRole{padding-right:4px}.userTurn .turnBody{width:min(82%,680px);padding:16px 20px;border-color:rgba(210,164,95,.2);border-radius:18px;background:rgba(210,164,95,.045);box-shadow:none}.userTurn .turnBody p{margin:0;color:var(--t);font-size:clamp(15px,1.8vw,18px);line-height:1.5;overflow-wrap:anywhere}
.cosmographerTurn .turnBody:before,.cosmographerHistoryTurn .turnBody:before{content:"";position:absolute;top:-1px;left:0;width:var(--phi-major);height:1px;background:linear-gradient(90deg,var(--blue),var(--b),transparent)}
.cosmographerHistoryTurn{opacity:.87}.cosmographerHistoryTurn .turnBody{box-shadow:none}
.answerHeader{display:grid;gap:8px}.answerHeader h2{max-width:760px;margin:0;font-size:clamp(30px,4vw,48px);line-height:1.05;letter-spacing:-.035em;text-wrap:balance}
.answerLead{margin:22px 0 0;padding:18px 20px;border-left:3px solid var(--b);background:rgba(210,164,95,.055);color:var(--t);font-size:clamp(18px,2vw,22px);line-height:1.58;overflow-wrap:anywhere}
.answerNarrative{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:20px}
.answerSection{min-width:0;padding:16px 18px;border:1px solid rgba(106,168,255,.16);border-radius:15px;background:rgba(5,13,23,.58)}
.answerSection h3{margin:0 0 9px;color:var(--t);font-size:13px;letter-spacing:.035em;text-transform:uppercase}.answerSection p{margin:0;color:var(--t2);font-size:14px;line-height:1.62}.answerSection ul{display:grid;gap:8px;margin:0;padding-left:19px;color:var(--t2)}.answerSection li{font-size:14px;line-height:1.55;overflow-wrap:anywhere}
.answerSection-market_layer,.answerSection-market_evidence{border-color:rgba(210,164,95,.32);background:rgba(210,164,95,.05)}
.answerSection-timeline,.answerSection-monthly_anchors,.answerSection-motion_brackets,.answerWindows{grid-column:1/-1}
.answerSection-timeline li,.answerSection-monthly_anchors li,.answerSection-motion_brackets li{font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace;font-size:13px;color:#c7d8ee}
.astroWindowGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.astroWindowCard{display:grid;grid-template-columns:auto minmax(0,1fr);gap:13px;margin:0;padding:15px;border:1px solid rgba(106,168,255,.22);border-radius:14px;background:rgba(10,22,38,.72)}
.astroWindowPrimary{grid-column:1/-1;border-color:rgba(210,164,95,.55);background:linear-gradient(135deg,rgba(210,164,95,.09),rgba(10,22,38,.78))}
.astroWindowRank{display:grid;align-content:start;justify-items:center;min-width:52px;padding:9px 7px;border:1px solid rgba(106,168,255,.34);border-radius:12px;background:rgba(106,168,255,.055);color:var(--t)}
.astroWindowPrimary .astroWindowRank{border-color:rgba(210,164,95,.5);background:rgba(210,164,95,.08)}
.astroWindowRank span{font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--m)}.astroWindowRank strong{font-size:22px;line-height:1.1}
.astroWindowBody{min-width:0}.astroWindowRange{color:var(--t);font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace;font-size:12px;line-height:1.4}.astroWindowPeak{margin-top:3px;color:var(--gold,var(--b));font-size:10px;letter-spacing:.06em;text-transform:uppercase}
.astroWindowBody h4{margin:10px 0 7px;color:var(--t);font-size:17px;line-height:1.25}.astroWindowBody p{margin:0;color:var(--t2);font-size:13px;line-height:1.5}
.answerDisclosure{border:0}.answerDisclosure summary{cursor:pointer;color:var(--t);font-weight:600}.answerDisclosure[open] summary{margin-bottom:10px}.answerDisclosure ul{padding-left:19px}
.answerNextStep{display:grid;gap:5px;margin-top:18px;padding:14px 16px;border:1px solid rgba(143,124,244,.25);border-radius:14px;background:rgba(143,124,244,.055)}
.answerNextStep span{color:var(--m);font-size:9px;letter-spacing:.09em;text-transform:uppercase}.answerNextStep strong{color:var(--t);font-size:14px;line-height:1.45;font-weight:600}
.answerSource,.answerSourceHistory{margin-top:18px;padding-top:14px;border-top:1px solid var(--bl);color:var(--t2);font-size:12px}
.answerSource summary,.answerSourceHistory summary{cursor:pointer;color:var(--t2);letter-spacing:.035em;text-transform:uppercase}.answerSource>div,.answerSourceHistory>div{display:grid;gap:8px;margin-top:11px}.answerSource span,.answerSourceHistory span{display:block;line-height:1.55;overflow-wrap:anywhere}.answerSource span:nth-child(2),.answerSource span:nth-child(3),.answerSourceHistory span:nth-child(2),.answerSourceHistory span:nth-child(3){font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace}
.answerEvidenceMeta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:2px 0 4px}.answerEvidenceMeta>div{min-width:0;padding:9px 10px;border-left:1px solid rgba(106,168,255,.18);background:rgba(106,168,255,.025)}.answerEvidenceMeta dt{color:var(--m);font-size:8px;line-height:1.35;letter-spacing:.075em;text-transform:uppercase}.answerEvidenceMeta dd{margin:5px 0 0;color:var(--t2);font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace;font-size:10px;line-height:1.5;overflow-wrap:anywhere}
.sourceChangedNote{margin:18px 0 0;padding:11px 13px;border:1px solid rgba(106,168,255,.22);border-radius:12px;background:rgba(106,168,255,.055);color:var(--t2);font-size:12px;line-height:1.55}
.dialogueStateFAILURE .turnBody,.dialogueStateCLARIFICATION .turnBody{border-color:rgba(215,134,127,.45)}
.dialogueStateCLARIFICATION .turnBody:before{background:linear-gradient(90deg,rgba(215,134,127,.8),rgba(210,164,95,.5),transparent)}
.dialogueStateLIMITED .turnBody,.dialogueStateBOUNDED .turnBody{border-color:rgba(210,164,95,.32)}
.liveComposer{display:grid;grid-template-columns:minmax(0,1fr);align-items:stretch;gap:12px;padding:20px;border:1px solid rgba(106,168,255,.3);border-radius:20px;background:linear-gradient(145deg,rgba(9,20,35,.95),rgba(5,10,18,.97));box-shadow:0 18px 56px rgba(0,0,0,.24)}
.liveComposer>label,.liveComposerControls,.liveComposerControls>label,.liveComposerControls>button{min-width:0}
.liveComposer label{display:grid;gap:8px;color:var(--t2);font-size:12px}.liveComposer textarea{min-height:84px;resize:vertical;background:rgba(2,7,14,.66);font-family:inherit;font-size:16px;line-height:1.5}
.liveComposerControls{display:grid;grid-template-columns:minmax(180px,.38fr) minmax(220px,.62fr);gap:12px;align-items:end}
.liveComposer button{width:100%;min-height:50px;border-color:rgba(210,164,95,.68);background:linear-gradient(110deg,rgba(210,164,95,.24),rgba(106,168,255,.18));font-family:inherit;font-weight:700}
.liveComposerAfterAnswer{margin-top:4px}.liveComposerPrimary{margin-top:0}.liveBoundary{max-width:720px;margin:12px auto 0;color:var(--m);font-size:10px;line-height:1.55;letter-spacing:.03em;text-align:center}
.dialogueFailure{margin-bottom:20px;padding:16px;border:1px solid rgba(215,134,127,.45);border-radius:14px;background:rgba(215,134,127,.06)}
@media(max-width:760px){
.liveDialoguePage{padding-inline:14px}.liveDialogueTopbar{grid-template-columns:1fr auto}.liveIdentity{display:none}.liveDialogueShell{padding-top:24px}.liveDialogueIntro{margin-bottom:20px}.liveDialogueIntro h1{font-size:clamp(38px,12vw,52px)}.liveTrustLine{gap:7px 12px}
.liveDialogueShell:has(.liveThread){padding-top:18px}.liveDialogueShell:has(.liveThread) .liveDialogueIntro{gap:6px;margin-bottom:16px}.liveDialogueShell:has(.liveThread) .liveDialogueIntro>.eyebrow,.liveDialogueShell:has(.liveThread) .liveDialogueIntro>p:not(.eyebrow):not(.liveCompactionNotice){display:none}.liveDialogueShell:has(.liveThread) .liveDialogueIntro h1{font-size:30px;line-height:1}.liveDialogueShell:has(.liveThread) .liveTrustLine{margin-top:5px;font-size:8px}
.liveSessionLine{gap:7px 10px;font-size:8px}.liveSessionLine span+span:before{margin-right:10px}.liveNewConversation{width:100%;margin-left:0}
.liveThread{gap:24px}.dialogueExchange{gap:11px}.userTurn .turnBody{width:94%;padding:13px 15px}.turnBody{padding:20px 16px;border-radius:17px}.answerHeader h2{font-size:clamp(27px,8.4vw,36px)}.answerLead{margin-top:16px;padding:14px 14px;font-size:17px}.answerNarrative{grid-template-columns:1fr;gap:10px;margin-top:14px}.answerSection{padding:14px}.astroWindowGrid{grid-template-columns:1fr}.astroWindowPrimary{grid-column:auto}.astroWindowCard{grid-template-columns:46px minmax(0,1fr);padding:12px}.answerEvidenceMeta{grid-template-columns:1fr}.activeContextLine{display:grid;grid-template-columns:1fr;gap:4px;padding-inline:1px}.activeContextLine span+span:before{content:none}.liveComposer{padding:16px}.liveComposerControls{grid-template-columns:1fr}.liveBoundary{text-align:left}
}
.answerClarification,.answerRouteStop{display:grid;gap:5px;margin-top:18px;padding:14px 16px;border-radius:14px}.answerClarification{border:1px solid rgba(210,164,95,.34);background:rgba(210,164,95,.065)}.answerRouteStop{border:1px solid rgba(135,151,171,.24);background:rgba(135,151,171,.045)}
.answerClarification span,.answerRouteStop span{color:var(--m);font-size:9px;letter-spacing:.09em;text-transform:uppercase}.answerClarification strong,.answerRouteStop strong{color:var(--t);font-size:14px;line-height:1.45;font-weight:600;overflow-wrap:anywhere}.answerAuthority{color:var(--t2);font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace;font-size:10px}
.answerSection-btc_side_state{order:-8;border-color:rgba(210,164,95,.4);background:rgba(210,164,95,.055)}.answerSection-astro_window{order:-7}.answerSection-relation{order:-6}.answerSection-confirmation_or_divergence{order:-5}.answerSection-conditions{order:-4}.answerSection-dual_proof{order:-3}.answerSection-non_causal_boundary{order:-2}.answerSection-non_trading_boundary{order:-1}

`;
