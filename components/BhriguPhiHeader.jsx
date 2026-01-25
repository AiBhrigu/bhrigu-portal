// ATOM_BHRIGU_PORTAL_UX_UNIFY_V1
export default function BhriguPhiHeader() {
  const css = `
    /* ATOM_BHRIGU_PORTAL_UX_UNIFY_V1 */
    .bh-header {
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      background: rgba(10, 10, 14, 0.72);
      border-bottom: 1px solid rgba(255, 215, 128, 0.18);
    }
    .bh-inner {
      max-width: 1100px;
      margin: 0 auto;
      padding: 12px 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px 14px;
    }
    .bh-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
    }
    .bh-phi {
      width: 34px;
      height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      border: 1px solid rgba(255, 215, 128, 0.30);
      box-shadow: 0 0 0 1px rgba(255, 215, 128, 0.10) inset;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .bh-name {
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .bh-kicker {
      flex: 1 1 220px;
      opacity: 0.82;
      font-size: 12px;
      letter-spacing: 0.06em;
    }
    .bh-nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 10px;
      font-size: 13px;
    }
    .bh-nav a {
      text-decoration: none;
      opacity: 0.86;
      padding: 6px 8px;
      border-radius: 10px;
      border: 1px solid rgba(255, 215, 128, 0.0);
    }
    .bh-nav a:hover {
      opacity: 1;
      border-color: rgba(255, 215, 128, 0.22);
      background: rgba(255, 215, 128, 0.06);
    }
    .bh-cta {
      margin-left: auto;
      display: inline-flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .phi-btn {
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 14px;
      border: 1px solid rgba(255, 215, 128, 0.34);
      background: rgba(255, 215, 128, 0.07);
      box-shadow: 0 0 18px rgba(255, 215, 128, 0.12);
      font-size: 13px;
      letter-spacing: 0.04em;
      white-space: nowrap;
      display: inline-block;
    }
    .phi-btn:hover {
      background: rgba(255, 215, 128, 0.11);
      box-shadow: 0 0 26px rgba(255, 215, 128, 0.18);
    }
    @media (max-width: 720px) {
      .bh-kicker { flex: 1 1 100%; order: 3; }
      .bh-cta { width: 100%; order: 4; justify-content: flex-start; }
    }
  `;

  return (
    <header className="bh-header" role="banner">
      <style>{css}</style>
      <div className="bh-inner">
        <a className="bh-brand" href="/" aria-label="BHRIGU Home">
          <span className="bh-phi" aria-hidden="true">Φ</span>
          <span className="bh-name">BHRIGU</span>
        </a>

        <div className="bh-kicker">Phi cosmography · Frey interface · ORION engine</div>

        <nav className="bh-nav" aria-label="Primary">
          <a href="/start">Start</a>
          <a href="/reading">Reading</a>
          <a href="/signal">Signal</a>
          <a href="/map">Map</a>
          <a href="/services">Services</a>
          <a href="/cosmography">Cosmography</a>
        <a href="/cosmographer">Cosmographer</a>
          <a href="/faq">FAQ</a>
        </nav>

        <div className="bh-cta" aria-label="Quick links">
          <a className="phi-btn" href="/frey">Frey</a>
          <a className="phi-btn" href="/orion">ORION</a>
        </div>
      </div>
    </header>
  );
}
