import { useRouter } from "next/router";

// ATOM_PORTAL_HEADER_PREMIUM_V0_2
export default function BhriguPhiHeader() {
  const router = useRouter();
  const path = (router?.asPath || router?.pathname || "/").split("?")[0];

  const isActive = (href) => path === href;

  const css = `
    /* ATOM_PORTAL_HEADER_PREMIUM_V0_2 */
    :root{
      --bh-gold: rgba(215,181,90,0.92);
      --bh-gold-2: rgba(215,181,90,0.58);
      --bh-ink: rgba(8,10,14,0.88);
      --bh-w: rgba(255,255,255,0.90);
      --bh-w2: rgba(255,255,255,0.74);
      --bh-w3: rgba(255,255,255,0.58);
      --bh-line: rgba(255,255,255,0.09);
      --bh-line2: rgba(215,181,90,0.18);
      --bh-r: 14px;
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
      color: rgba(255,255,255,0.60);
      text-decoration: none;
      border-bottom: 1px solid rgba(255,255,255,0);
      padding-bottom: 2px;
      transition: color 160ms ease, border-color 160ms ease;
    }
    .bh-meta-link:hover{
      color: rgba(255,255,255,0.82);
      border-color: rgba(215,181,90,0.26);
    }

    .bh-row{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .bh-brand{
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      white-space: nowrap;
      padding: 6px 10px;
      border-radius: 12px;
      transition: background 160ms ease, box-shadow 160ms ease;
    }
    .bh-brand:hover{
      background: rgba(255,255,255,0.03);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
    }

    .bh-phi{
      font-size: 18px;
      line-height: 1;
      color: var(--bh-gold);
      opacity: 0.95;
    }

    .bh-name{
      font-weight: 700;
      letter-spacing: 0.10em;
      color: rgba(255,255,255,0.88);
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
      text-decoration: none;
      color: rgba(255,255,255,0.74);
      border: 1px solid rgba(255,255,255,0);
      transition: color 160ms ease, border-color 160ms ease, background 160ms ease;
      white-space: nowrap;
    }
    .bh-link:hover{
      color: rgba(255,255,255,0.88);
      border-color: rgba(255,255,255,0.10);
      background: rgba(255,255,255,0.02);
    }

    .bh-active{
      color: rgba(255,255,255,0.92);
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
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      padding: 0 14px;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 650;
      letter-spacing: 0.04em;
      transition: transform 120ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease;
      transform: translateZ(0);
    }

    .bh-btn-primary{
      color: rgba(0,0,0,0.88);
      background: linear-gradient(180deg, rgba(215,181,90,0.98), rgba(215,181,90,0.78));
      border: 1px solid rgba(215,181,90,0.44);
      box-shadow: 0 12px 28px rgba(0,0,0,0.38), inset 0 0 0 1px rgba(255,255,255,0.10);
    }
    .bh-btn-primary:hover{
      box-shadow: 0 14px 34px rgba(0,0,0,0.44), inset 0 0 0 1px rgba(255,255,255,0.14);
      transform: translateY(-1px);
    }

    .bh-btn-secondary{
      color: rgba(255,255,255,0.78);
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.14);
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.10);
    }
    .bh-btn-secondary:hover{
      color: rgba(255,255,255,0.88);
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
  `;

  return (
    <header className="bh-header" role="banner" data-bh="HEADER_PREMIUM_V0_2">
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
          <a className="bh-brand" href="/" aria-label="BHRIGU Home">
            <span className="bh-phi" aria-hidden="true">Φ</span>
            <span className="bh-name">BHRIGU</span>
          </a>

          <nav className="bh-nav" aria-label="Primary">
            <a className={"bh-link" + (isActive("/reading") ? " bh-active" : "")} href="/reading" aria-current={isActive("/reading") ? "page" : undefined}>Reading</a>
            <a className={"bh-link" + (isActive("/signal") ? " bh-active" : "")} href="/signal" aria-current={isActive("/signal") ? "page" : undefined}>Signal</a>
            <a className={"bh-link" + (isActive("/map") ? " bh-active" : "")} href="/map" aria-current={isActive("/map") ? "page" : undefined}>Map</a>
            <a className={"bh-link" + (isActive("/services") ? " bh-active" : "")} href="/services" aria-current={isActive("/services") ? "page" : undefined}>Services</a>
            <a className={"bh-link" + (isActive("/cosmography") ? " bh-active" : "")} href="/cosmography" aria-current={isActive("/cosmography") ? "page" : undefined}>Cosmography</a>
          </nav>

          <div className="bh-cta" aria-label="Calls to action">
            <a className="bh-btn bh-btn-primary" href="/frey">Open Frey</a>
            <a className="bh-btn bh-btn-secondary" href="/orion">ORION</a>
          </div>
        </div>
      </div>
    </header>
  );
}
