import { useRouter } from "next/router";

// ATOM_PORTAL_HEADER_META_DEDUP_V0_1
// HDR_HIERARCHY_GRID_V0_4
export default function BhriguPhiHeader() {
  const router = useRouter();
  const path = (router?.asPath || router?.pathname || "/").split("?")[0];

  const isActive = (href) => path === href;

  const css = `
    /* ATOM_PORTAL_HEADER_SUITE_LABEL_OFF_V0_1 */
    :root{
      --bh-gold: rgba(215,181,90,0.92);
      --bh-w3: rgba(255,255,255,0.58);
    }

    .bh-header{
      position: sticky;
      top: 0;
      z-index: 50;
      background:
        radial-gradient(900px 240px at 12% -20%, rgba(215,181,90,0.09), rgba(0,0,0,0) 60%),
        linear-gradient(180deg, rgba(0,0,0,0.74), rgba(0,0,0,0.56));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255,255,255,0.075);
    }

    .bh-shell{
      max-width: 1180px;
      margin: 0 auto;
      padding: 10px 18px 12px;
    }

    .bh-meta{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 2px 2px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 10px;
    }

    .bh-meta-left{
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--bh-w3);
      white-space: nowrap;
    }

    .bh-meta-strong{
      color: var(--bh-gold);
      letter-spacing: 0.22em;
    }

    .bh-meta-right{
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .bh-meta-link{
      color: rgba(255,255,255,0.60) !important;
      text-decoration: none !important;
      border-bottom: 1px solid rgba(255,255,255,0);
      padding-bottom: 2px;
      transition: color 160ms ease, border-color 160ms ease;
    }
    .bh-meta-link:hover{
      color: rgba(255,255,255,0.86) !important;
      border-color: rgba(215,181,90,0.26);
    }

    .bh-row{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    /* Brand cluster: Φ anchor + BHRIGU wordmark */
    .bh-brandwrap{
      display: inline-flex;
      align-items: center;
      gap: 10px;
      white-space: nowrap;
    }


    .:hover{
      transform: translateY(-1px);
      box-shadow:
        0 18px 42px rgba(0,0,0,0.52),
        0 0 30px rgba(215,181,90,0.22),
        inset 0 0 0 1px rgba(255,255,255,0.16);
    }
    .:focus-visible{
      outline: none;
      box-shadow:
        0 0 0 4px rgba(215,181,90,0.18),
        0 0 0 1px rgba(215,181,90,0.42) inset,
        0 16px 38px rgba(0,0,0,0.46);
    }

    .bh-word{
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none !important;
      padding: 6px 10px;
      border-radius: 12px;
      transition: background 160ms ease, box-shadow 160ms ease;
      color: rgba(255,255,255,0.88) !important;
      font-weight: 760;
      letter-spacing: 0.10em;
    }
    .bh-word:hover{
      background: rgba(255,255,255,0.03);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
    }

    .bh-nav{
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }

    .bh-link{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 12px;
      border-radius: 999px;
      text-decoration: none !important;
      color: rgba(255,255,255,0.74) !important;
      border: 1px solid rgba(255,255,255,0);
      transition: color 160ms ease, border-color 160ms ease, background 160ms ease;
      white-space: nowrap;
    }
    .bh-link:hover{
      color: rgba(255,255,255,0.90) !important;
      border-color: rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.02);
    }

    .bh-active{
      color: rgba(255,255,255,0.94) !important;
      border-color: rgba(215,181,90,0.34);
      background:
        radial-gradient(140px 48px at 20% 10%, rgba(215,181,90,0.10), rgba(0,0,0,0) 60%),
        linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.10));
      box-shadow:
        inset 0 0 0 1px rgba(255,255,255,0.04),
        0 10px 26px rgba(0,0,0,0.34);
    }

    .bh-cta{
      display: inline-flex;
      gap: 10px;
      align-items: center;
      white-space: nowrap;
    }

    .bh-btn{
      position: relative;
      overflow: hidden;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      padding: 0 14px;
      border-radius: 999px;
      text-decoration: none !important;
      font-weight: 720;
      letter-spacing: 0.04em;
      transition: transform 120ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease, opacity 160ms ease;
      transform: translateZ(0);
      opacity: 1 !important;
    }

    .bh-btn-primary{
      color: rgba(8,10,14,0.92) !important;
      background: linear-gradient(180deg, rgba(215,181,90,0.96), rgba(215,181,90,0.72)) !important;
      border-color: rgba(215,181,90,0.55) !important;
      box-shadow: 0 10px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(215,181,90,0.10) inset;
      text-shadow: none;
}
    .bh-btn-primary::before{
      content: "";
      position: absolute;
      inset: -2px;
      background: radial-gradient(180px 60px at 20% 18%, rgba(255,255,255,0.26), rgba(0,0,0,0) 60%);
      opacity: 0.65;
      pointer-events: none;
      mix-blend-mode: screen;
    }
    .bh-btn-primary:hover{
      transform: translateY(-1px);
      box-shadow: 0 14px 34px rgba(0,0,0,0.55), 0 0 0 1px rgba(215,181,90,0.14) inset;
}
    .bh-btn:focus-visible{
      outline: none;
      box-shadow: 0 0 0 3px rgba(215,181,90,0.22), 0 10px 28px rgba(0,0,0,0.45);
}

    .bh-btn-secondary{
      color: rgba(255,255,255,0.80) !important;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.14);
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.10);
    }
    .bh-btn-secondary:hover{
      color: rgba(255,255,255,0.92) !important;
      border-color: rgba(215,181,90,0.22);
      background: rgba(255,255,255,0.03);
    }

    @media (max-width: 980px){
      .bh-nav{ justify-content: flex-end; overflow-x: auto; scrollbar-width: none; }
      .bh-nav::-webkit-scrollbar{ display:none; }
    }
    @media (max-width: 760px){
      .bh-meta{ display:none; }
      .bh-shell{ padding: 10px 14px 12px; }
      .bh-link{ padding: 7px 10px; }
      .bh-btn{ padding: 0 12px; }
    }



/* HDR_BRAND_CTA_POLISH_V0_3 */
/* Wordmark: make BHRIGU read like a logo, not a nav button */
.bh-word{
  display:inline-flex;
  align-items:center;
  font-weight:800;
  letter-spacing:0.24em;
  text-transform:uppercase;
  font-size:18px;
  line-height:1;
  text-decoration:none;
  position:relative;
  top:-1px; /* optical lift */
}

/* Primary CTA: Open Frey */
.bh-btn.bh-btn-primary{
  background:linear-gradient(180deg, rgba(220,188,118,0.96), rgba(176,132,58,0.96)) !important;
  color:#0b0b0b !important;
  border:1px solid rgba(250,230,170,0.55) !important;
  box-shadow:0 8px 24px rgba(196,160,88,0.20) !important;
}
.bh-btn.bh-btn-primary:hover{
  filter:brightness(1.06) !important;
  box-shadow:0 10px 28px rgba(196,160,88,0.26) !important;
}

/* Secondary CTA: ORION */
.bh-btn.bh-btn-secondary{
  color:rgba(220,188,118,0.92) !important;
  border:1px solid rgba(220,188,118,0.35) !important;
}
.bh-btn.bh-btn-secondary:hover{
  border-color:rgba(220,188,118,0.55) !important;
  filter:brightness(1.04) !important;
}
/* === HDR_HIERARCHY_GRID_V0_4 (desktop-only) === */
.bh-header { padding-top: 18px; padding-bottom: 18px; }
.bh-shell { align-items: center; }

/* Brand dominance */
.bh-word {
  font-size: 18px;
  letter-spacing: 0.38em;
  opacity: 0.92;
  position: relative;
  top: -1px; /* optical lift */
}

/* Primary nav slightly quieter than brand */
.bh-nav a { opacity: 0.82; }
.bh-nav a:hover { opacity: 0.92; }

/* CTA hierarchy */
.bh-btn-primary { filter: saturate(1.08) contrast(1.05); }
.bh-btn-secondary {
  opacity: 0.92;
  border-color: rgba(180,140,70,0.55);
}
.bh-btn-secondary:hover { border-color: rgba(200,160,90,0.75); }

/* Meta row slightly lighter */
.bh-meta { opacity: 0.80; }
/* === /HDR_HIERARCHY_GRID_V0_4 === */

/* HDR_MOBILE_PASS_V0_1 */
/* Mobile tightening: keep hierarchy, avoid CTA overflow */
 (max-width: 520px) {
  .bh-word { letter-spacing: 0.18em; font-size: 16px; }
  .bh-btn { padding: 8px 12px; font-size: 12px; border-radius: 999px; }
  .bh-btn.bh-btn-primary { padding: 9px 14px; font-size: 12px; }
}
 (max-width: 420px) {
  .bh-header { padding-left: 14px; padding-right: 14px; }
  .bh-nav { gap: 14px; }
  .bh-btn { padding: 7px 10px; font-size: 12px; }
  .bh-btn.bh-btn-primary { padding: 8px 12px; }
}

/* HDR_BRAND_PREMIUM_V0_1 */
/* Brand plaque + CTA hierarchy: keep Open Frey primary, demote others */
.bh-brandwrap{position:relative;display:inline-flex;align-items:center;padding:10px 14px;border-radius:999px;}
.bh-brandwrap:before{content:"";position:absolute;inset:0;border-radius:999px;border:1px solid rgba(220,180,80,0.12);background:radial-gradient(120px 44px at 18% 55%, rgba(220,180,80,0.10), transparent 62%);}
.bh-brandwrap *{position:relative;z-index:1;}
.bh-word{letter-spacing:0.30em;font-weight:600;}

/* Secondary CTA quiet */
.bh-btn-secondary{opacity:0.86;filter:saturate(0.92) contrast(0.98);}
.bh-btn-secondary:hover{opacity:1;}

 (max-width:520px){
  .bh-brandwrap{padding:8px 12px;}
  .bh-word{letter-spacing:0.22em;}
}

/* HDR_BRAND_PREMIUM_V0_2 */
/* Single brand plaque (avoid double ring) + quiet ORION */
.bh-brandwrap{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;}
.bh-word{position:relative;display:inline-flex;align-items:center;padding:10px 14px;border-radius:999px;}
.bh-word:before{content:;position:absolute;inset:0;border-radius:999px;border:1px solid rgba(220,180,80,0.14);
  background:radial-gradient(140px 48px at 18% 55%, rgba(220,180,80,0.10), transparent 62%);}
.bh-word > *{position:relative;z-index:1;}
.bh-word{letter-spacing:0.28em;font-weight:600;}

.bh-btn-secondary{background:rgba(0,0,0,0.14);border-color:rgba(220,180,80,0.18);color:rgba(220,180,80,0.78);box-shadow:none;}
.bh-btn-secondary:hover{background:rgba(0,0,0,0.26);border-color:rgba(220,180,80,0.30);color:rgba(220,180,80,0.92);}

@media (max-width:520px){
  .bh-word{padding:8px 12px;letter-spacing:0.22em;}
}
`;

  return (
    <header  data-hdr="HDR_HIERARCHY_GRID_V0_4" className="bh-header" data-hdr-premium="HDR_BRAND_PREMIUM_V0_3" role="banner" data-bh="HEADER_SUITE_LABEL_OFF_V0_1 HDR_BRAND_CTA_V0_3">
      <style>{css}</style>

      <div className="bh-shell">
        <div className="bh-meta" aria-label="Header meta">
          <div className="bh-meta-left" aria-hidden="true"></div>
<div className="bh-meta-right">
            <a className="bh-meta-link" href="/investors">Investors</a><a className="bh-meta-link" href="/cosmographer">Cosmographer</a>
            <a className="bh-meta-link" href="/faq">FAQ</a>
          </div>
        </div>

        <div className="bh-row">
          <div className="bh-brandwrap" aria-label="Brand">
<a className="bh-word" href="/" aria-label="BHRIGU Home">
              BHRIGU
            </a>
          </div>

          <nav className="bh-nav" aria-label="Primary">
            <a className="bh-link" href="/start">Start</a>
            <a className={"bh-link" + (isActive("/reading") ? " bh-active" : "")} href="/reading" aria-current={isActive("/reading") ? "page" : undefined}>Reading</a>
            <a className={"bh-link" + (isActive("/services") ? " bh-active" : "")} href="/services" aria-current={isActive("/services") ? "page" : undefined}>Services</a>
            <a className={"bh-link" + (isActive("/cosmography") ? " bh-active" : "")} href="/cosmography" aria-current={isActive("/cosmography") ? "page" : undefined}>Cosmography</a>
          </nav>

          <div className="bh-cta" aria-label="Calls to action">


            <a className="bh-btn bh-btn-primary" href="/frey" data-bh="FREY_CTA_PRIMARY_V0_4">Open Frey</a>
<a className="bh-btn bh-btn-secondary" href="/orion">ORION</a>
</div>
        </div>
      </div>
    </header>
  );
}
