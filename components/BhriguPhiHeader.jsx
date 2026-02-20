import React from "react"; export default function BhriguPhiHeader() { const css = ` /* HDR_CANON_GOLDENPATH_V0_1 */ .bh-header { position: sticky; top: 0; z-index: 60; width: 100%; background: rgba(6, 6, 10, 0.70); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.10); } .bh-shell { max-width: 1120px; margin: 0 auto; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; } .bh-brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: rgba(255,255,255,0.92); } .bh-plaque { display: inline-flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.14); background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)); box-shadow: 0 14px 40px rgba(0,0,0,0.35); } .bh-word { font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; font-size: 12px; line-height: 1; } .bh-sub { font-size: 11px; letter-spacing: 0.08em; color: rgba(255,255,255,0.55); line-height: 1; white-space: nowrap; } .bh-ctas { display: inline-flex; gap: 10px; align-items: center; } .bh-btn { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; border-radius: 999px; padding: 10px 14px; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.90); background: rgba(255,255,255,0.03); } .bh-btn:hover { border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.05); } .bh-btn-primary { background: rgba(255,255,255,0.92); color: rgba(8,8,10,0.95); border-color: rgba(255,255,255,0.40); font-weight: 700; } .bh-btn-primary:hover { background: rgba(255,255,255,0.98); } @media (max-width: 520px) { .bh-shell { padding: 12px 12px; } .bh-sub { display: none; } .bh-btn { padding: 9px 12px; } }\n/* HDR_LOGO_GUTTER_ALIGN_V0_1: mobile gutter unify for header root */\n@media (max-width: 560px){\n  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_5"]{ padding-left: 16px !important; padding-right: 16px !important; }\n}\n@media (max-width: 520px){\n  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_5"]{ padding-left: 12px !important; padding-right: 12px !important; }\n}\n@media (max-width: 420px){\n  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_5"]{ padding-left: 10px !important; padding-right: 10px !important; }\n}\n\n
/* HDR_LOGO_GUTTER_ALIGN_V0_2: mobile gutter unify for header root */
@media (max-width: 560px){
  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_2"]{ padding-left: 16px !important; padding-right: 16px !important; }
}
@media (max-width: 520px){
  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_2"]{ padding-left: 12px !important; padding-right: 12px !important; }
}
@media (max-width: 420px){
  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_2"]{ padding-left: 10px !important; padding-right: 10px !important; }
}
/* HDR_LOGO_GUTTER_ALIGN_V0_4: mobile gutter unify for header root */
@media (max-width: 560px){
  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_4"]{ padding-left: 16px !important; padding-right: 16px !important; }
}
@media (max-width: 520px){
  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_4"]{ padding-left: 12px !important; padding-right: 12px !important; }
}
@media (max-width: 420px){
  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_4"]{ padding-left: 10px !important; padding-right: 10px !important; }
}

 /* HDR_CANON_GOLDENPATH_V0_1 */ .bh-header { position: sticky; top: 0; z-index: 60; width: 100%; background: rgba(6, 6, 10, 0.70); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.10); } .bh-shell { max-width: 1120px; margin: 0 auto; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; } .bh-brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: rgba(255,255,255,0.92); } .bh-plaque { display: inline-flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.14); background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)); box-shadow: 0 14px 40px rgba(0,0,0,0.35); } .bh-word { font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; font-size: 12px; line-height: 1; } .bh-sub { font-size: 11px; letter-spacing: 0.08em; color: rgba(255,255,255,0.55); line-height: 1; white-space: nowrap; } .bh-ctas { display: inline-flex; gap: 10px; align-items: center; } .bh-btn { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; border-radius: 999px; padding: 10px 14px; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; border: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.90); background: rgba(255,255,255,0.03); } .bh-btn:hover { border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.05); } .bh-btn-primary { background: rgba(255,255,255,0.92); color: rgba(8,8,10,0.95); border-color: rgba(255,255,255,0.40); font-weight: 700; } .bh-btn-primary:hover { background: rgba(255,255,255,0.98); } @media (max-width: 520px) { .bh-shell { padding: 12px 12px; } .bh-sub { display: none; } .bh-btn { padding: 9px 12px; } }\n/* HDR_LOGO_GUTTER_ALIGN_V0_1: mobile gutter unify for header root */\n@media (max-width: 560px){\n  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_5"]{ padding-left: 16px !important; padding-right: 16px !important; }\n}\n@media (max-width: 520px){\n  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_5"]{ padding-left: 12px !important; padding-right: 12px !important; }\n}\n@media (max-width: 420px){\n  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_5"]{ padding-left: 10px !important; padding-right: 10px !important; }\n}\n\n
/* HDR_LOGO_GUTTER_ALIGN_V0_2: mobile gutter unify for header root */
@media (max-width: 560px){
  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_2"]{ padding-left: 16px !important; padding-right: 16px !important; }
}
@media (max-width: 520px){
  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_2"]{ padding-left: 12px !important; padding-right: 12px !important; }
}
@media (max-width: 420px){
  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_2"]{ padding-left: 10px !important; padding-right: 10px !important; }
}
/* HDR_LOGO_GUTTER_ALIGN_V0_4: mobile gutter unify for header root */
@media (max-width: 560px){
  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_4"]{ padding-left: 16px !important; padding-right: 16px !important; }
}
@media (max-width: 520px){
  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_4"]{ padding-left: 12px !important; padding-right: 12px !important; }
}
@media (max-width: 420px){
  [data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_4"]{ padding-left: 10px !important; padding-right: 10px !important; }
}



/* HDR_LOGO_GUTTER_ALIGN_V0_5 */
.bh-shell{
  max-width: 1120px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  padding-left: clamp(16px, 4vw, 44px);
  padding-right: clamp(16px, 4vw, 44px);
}

/* HDR_PLAQUE_PREMIUM_V0_3 */
.bh-brand .bh-plaque{
  background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03));
  border: 1px solid rgba(233,189,93,0.22);
  box-shadow: 0 10px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10);
  backdrop-filter: blur(8px);
}
.bh-brand .bh-word{
  letter-spacing: 0.24em;
  font-weight: 600;
}
.bh-brand .bh-sub:empty{ display:none; }
`; return ( <header className="bh-header" data-hdr="HDR_CANON_GOLDENPATH_V0_1 HDR_LOGO_GUTTER_ALIGN_V0_5 HDR_PLAQUE_PREMIUM_V0_3 HDR_SCROLL_GUTTER_STABLE_V0_1 HDR_SCROLL_GUTTER_V0_2" data-hdr-logo="HDR_LOGO_GUTTER_ALIGN_V0_5" data-ops="OPS_MARKERS_DATA_ATTRS_V0_2"> <div className="bh-shell"> <a className="bh-brand" href="/" aria-label="BHRIGU home"> <span className="bh-plaque"> <span className="bh-word">BHRIGU</span> <span className="bh-sub"></span> </span> </a> <div className="bh-ctas"> <a className="bh-btn bh-btn-primary" href="/frey" data-bh="FREY_CTA_PRIMARY_V0_6">Open Frey</a> <a className="bh-btn" href="/orion">ORION</a> </div> </div> <style>{css}</style> </header> );
}
