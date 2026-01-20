/* ATOM_BHRIGU_PORTAL_LANDING_CANON_V2 */
import Head from "next/head";

export default function Home() {
  const primary = [
    ["/start", "Start"],
    ["/services", "Services"],
    ["/frey", "Frey"],
  ];

  const explore = [
    ["/reading", "Reading"],
    ["/signal", "Signal"],
    ["/map", "Map"],
    ["/cosmography", "Cosmography"],
    ["/orion", "ORION"],
    ["/chronicle", "Chronicle"],
    ["/faq", "FAQ"],
    ["/access", "Access"],
    ["/github", "GitHub"],
  ];

  return (
    <>
      <Head>
        <title>BHRIGU · Φ Portal for Frey & ORION</title>
        <meta
          name="description"
          content="BHRIGU is a structural portal for cosmography and Frey/ORION — a trust-first surface for reading, mapping, and signal exploration."
        />
        <link rel="canonical" href="https://www.bhrigu.io/" />
        <meta property="og:site_name" content="BHRIGU" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="BHRIGU · Φ Portal for Frey & ORION" />
        <meta
          property="og:description"
          content="A trust-first surface for cosmography, maps, signals, and Frey/ORION exploration."
        />
        <meta property="og:image" content="https://www.bhrigu.io/og.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://www.bhrigu.io/og.svg" />
      </Head>

      <main className="wrap">
        <section className="hero">
          <div className="kicker">Φ portal</div>
          <h1 className="title">BHRIGU</h1>
          <p className="subtitle">
            A trust-first surface for cosmography — built to be stable, readable, and worth staying for.
            Explore maps, signals, and the Frey/ORION interface layer.
          </p>

          <div className="nav">
            {primary.map(([href, label]) => (
              <a key={href} href={href} className="btn">
                {label}
              </a>
            ))}
          </div>

          <div className="grid">
            <div className="chip">
              <div className="chipTitle">Read-first UX</div>
              <div className="muted">Clarity over noise. Minimal friction.</div>
            </div>
            <div className="chip">
              <div className="chipTitle">Trust by design</div>
              <div className="muted">No forced sign-up. Public surface stays simple.</div>
            </div>
            <div className="chip">
              <div className="chipTitle">Stability mindset</div>
              <div className="muted">We ship in small, safe increments — no endless redesign loops.</div>
            </div>
            <div className="chip">
              <div className="chipTitle">Research posture</div>
              <div className="muted">Exploration + documentation. No hype-only claims.</div>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Explore</h2>
          <p className="muted">
            Pick a lane. Everything is intentionally structured as a set of stable “surfaces”.
          </p>
          <div className="grid2">
            {explore.map(([href, label]) => (
              <a key={href} href={href} className="link">
                <span className="linkLabel">{label}</span>
                <span className="linkHint">{href}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>For builders, investors, and grants</h2>
          <ul>
            <li>Clear surface → predictable onboarding → lower support cost.</li>
            <li>Security-first and intentionally constrained public scope.</li>
            <li>Long-horizon R&D: cosmography as an interface layer for decision-making.</li>
          </ul>
          <div className="nav">
            <a className="btn" href="/services">See what we offer</a>
            <a className="btn" href="/access">Request access</a>
            <a className="btn" href="/faq">Read the FAQ</a>
          </div>
        </section>

        <footer className="footer">
          <div className="muted">
            Not financial advice. No guarantees. This is a research and interface surface.
          </div>
        </footer>

        <style jsx>{`
          .wrap {
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px 18px 70px;
          }
          .hero {
            padding: 18px 0 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            margin-bottom: 18px;
          }
          .kicker {
            font-size: 12px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            opacity: 0.72;
            margin-bottom: 8px;
          }
          .title {
            font-size: 44px;
            line-height: 1.05;
            margin: 0 0 10px;
          }
          .subtitle {
            font-size: 16px;
            opacity: 0.88;
            margin: 0 0 12px;
            max-width: 72ch;
            line-height: 1.55;
          }
          .nav {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 12px;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 36px;
            padding: 0 14px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.14);
            background: rgba(255, 255, 255, 0.04);
            text-decoration: none;
          }
          .btn:hover {
            background: rgba(255, 255, 255, 0.07);
            border-color: rgba(215, 181, 90, 0.55);
            box-shadow: 0 0 0 6px rgba(215, 181, 90, 0.08);
            transform: translateY(-1px);
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 14px;
          }
          .grid2 {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 12px;
          }
          .chip {
            padding: 12px 12px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.015);
          }
          .chipTitle {
            font-size: 13px;
            letter-spacing: 0.02em;
            margin-bottom: 6px;
          }
          .card {
            padding: 18px 16px;
            margin: 14px 0;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.02);
          }
          h2 {
            margin: 0 0 10px;
            font-size: 18px;
          }
          ul {
            margin: 10px 0 0;
            padding-left: 18px;
          }
          li {
            margin: 6px 0;
            line-height: 1.45;
          }
          .link {
            padding: 12px 12px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.01);
            text-decoration: none;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .link:hover {
            border-color: rgba(215, 181, 90, 0.55);
            box-shadow: 0 0 0 6px rgba(215, 181, 90, 0.08);
            transform: translateY(-1px);
          }
          .linkLabel {
            font-size: 14px;
          }
          .linkHint {
            font-size: 12px;
            opacity: 0.65;
          }
          .muted {
            opacity: 0.75;
          }
          .footer {
            margin-top: 18px;
            padding-top: 14px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }

          @media (max-width: 760px) {
            .grid, .grid2 {
              grid-template-columns: 1fr;
            }
            .title {
              font-size: 36px;
            }
          }
        `}</style>
      </main>
    </>
  );
}
