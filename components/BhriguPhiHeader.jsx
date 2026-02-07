import { useRouter } from "next/router";

// ATOM_PORTAL_HEADER_IA_MINIMAL_V0_2
export default function BhriguPhiHeader() {
  const router = useRouter();
  const path = (router?.asPath || router?.pathname || "/").split("?")[0];

  const isActive = (href) => path === href;

  const css = `
    /* ATOM_PORTAL_HEADER_IA_MINIMAL_V0_2 */
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

    .bh-mark{
      width: 38px;
      height: 38px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none !important;
      color: rgba(0,0,0,0.90) !important;
      background: linear-gradient(180deg, rgba(229,200,112,0.96), rgba(171,132,36,0.96));
      border: 1px solid rgba(215,181,90,0.58);
      box-shadow:
        0 14px 34px rgba(0,0,0,0.46),
        0 0 24px rgba(215,181,90,0.16),
        inset 0 0 0 1px rgba(255,255,255,0.14);
      transition: transform 120ms ease, box-shadow 160ms ease;
    }
    .bh-mark:hover{
      transform: translateY(-1px);
      box-shadow:
        0 18px 42px rgba(0,0,0,0.52),
        0 0 30px rgba(215,181,90,0.22),
        inset 0 0 0 1px rgba(255,255,255,0.16);
    }
    .bh-mark:focus-visible{
      outline: none;
      box-shadow:
        0 0 0 4px rgba(215,181,90,0.18),
        0 0 0 1px rgba(215,181,90,0.42) inset,
        0 16px 38px rgba(0,0,0,0.46);
    }
    .bh-phi{
      font-size: 18px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: 0.02em;
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
      .bh-mark{ width: 36px; height: 36px; }
    }
  

.bh-meta-inline{
      display: inline-flex;
      align-items: center;
      gap: 14px;
      margin-right: 10px;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.60);
}

`;

  return (
    <header className="bh-header" role="banner" data-bh="HEADER_IA_MINIMAL_V0_2">
      <style>{css}</style>

      <div className="bh-shell">
        <div className="bh-meta" aria-label="Header meta">
          <div className="bh-meta-left">
            <span className="bh-meta-strong">ORION</span> · Φ-COSMOGRAPHY · SOLAR SUITE
          </div>
          <div className="bh-meta-right">
            <a className="bh-meta-link" href="/cosmographer">Cosmographer</a>
            <a className="bh-meta-link" href="/faq">FAQ</a>
          </div>
        </div>

        <div className="bh-row">
          <div className="bh-brandwrap" aria-label="Brand">
            <a className="bh-mark" href="/frey" aria-label="Phi anchor" data-bh="PHI_ANCHOR_V0_1">
              <span className="bh-phi" aria-hidden="true">Φ</span>
            </a>
            <a className="bh-word" href="/" aria-label="BHRIGU Home">
              BHRIGU
            </a>
          </div>

          <nav className="bh-nav" aria-label="Primary">
            <a className={"bh-link" + (isActive("/reading") ? " bh-active" : "")} href="/reading" aria-current={isActive("/reading") ? "page" : undefined}>Reading</a>
            <a className={"bh-link" + (isActive("/services") ? " bh-active" : "")} href="/services" aria-current={isActive("/services") ? "page" : undefined}>Services</a>
            <a className={"bh-link" + (isActive("/cosmography") ? " bh-active" : "")} href="/cosmography" aria-current={isActive("/cosmography") ? "page" : undefined}>Cosmography</a>
          </nav>

          <div className="bh-cta" aria-label="Calls to action">
            <div className="bh-meta-inline" aria-label="Meta">
              <a className="bh-meta-link" href="/start">Investors / Partners</a>
              <a className="bh-meta-link" href="/cosmographer">Cosmographer</a>
              <a className="bh-meta-link" href="/faq">FAQ</a>
            </div>

            <a className="bh-btn bh-btn-primary" href="/frey" data-bh="FREY_CTA_PRIMARY_V0_4">Open Frey</a>
            <a className="bh-btn bh-btn-secondary" href="/orion">ORION</a>
</div>
        </div>
      </div>
    </header>
  );
}
