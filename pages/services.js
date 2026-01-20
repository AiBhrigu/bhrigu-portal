/* ATOM_BHRIGU_PORTAL_LANDING_CANON_V2 */
import Head from "next/head";

export default function Services() {
  const buckets = [
    {
      title: "Public surfaces (read-first)",
      items: [
        ["Reading", "/reading", "Framing, definitions, and how to navigate."],
        ["Signal", "/signal", "Signal surfaces (research posture, not advice)."],
        ["Map", "/map", "Maps and navigation surfaces."],
        ["FAQ", "/faq", "What it is, what it is not, and why constraints exist."],
      ],
    },
    {
      title: "Interface layer",
      items: [
        ["Frey", "/frey", "User-facing interface layer (access-gated features may appear later)."],
        ["ORION", "/orion", "Core research surface and system framing."],
        ["Cosmography", "/cosmography", "Definitions and worldview layer."],
      ],
    },
    {
      title: "For partners (investors / grants)",
      items: [
        ["Access", "/access", "Request access, context, or a short deck."],
        ["Chronicle", "/chronicle", "Evolution log: what changed and why."],
        ["GitHub", "/github", "Public artifacts and transparent surface."],
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>Services · BHRIGU</title>
        <meta
          name="description"
          content="BHRIGU services and surfaces: reading, signal, map, and the Frey/ORION interface layer — designed for trust, stability, and long-horizon research."
        />
        <link rel="canonical" href="https://www.bhrigu.io/services" />
        <meta property="og:site_name" content="BHRIGU" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Services · BHRIGU" />
        <meta
          property="og:description"
          content="A structured set of surfaces: public reading/maps/signals and the Frey/ORION interface layer."
        />
        <meta property="og:image" content="https://www.bhrigu.io/og.svg" />
      </Head>

      <main className="wrap">
        <div className="hero">
          <div className="kicker">Surfaces</div>
          <h1 className="title">Services</h1>
          <p className="subtitle">
            BHRIGU is built as a stable set of surfaces. Public pages stay simple; deeper layers are intentionally gated.
          </p>
          <div className="nav">
            <a className="btn" href="/start">Start</a>
            <a className="btn" href="/reading">Reading</a>
            <a className="btn" href="/frey">Frey</a>
            <a className="btn" href="/access">Access</a>
          </div>
        </div>

        {buckets.map((b) => (
          <section key={b.title} className="card">
            <h2>{b.title}</h2>
            <div className="grid">
              {b.items.map(([label, href, note]) => (
                <a key={href} href={href} className="item">
                  <div className="itemTop">
                    <span className="itemLabel">{label}</span>
                    <span className="itemHref">{href}</span>
                  </div>
                  <div className="muted">{note}</div>
                </a>
              ))}
            </div>
          </section>
        ))}

        <section className="card">
          <h2>What we optimize for</h2>
          <ul>
            <li><strong>Trust</strong>: clear constraints, no hype-only claims.</li>
            <li><strong>Stability</strong>: a 2026–2027 UI posture — consistent, not constantly rebuilt.</li>
            <li><strong>Clarity</strong>: readable structure, minimal friction, and honest scope.</li>
          </ul>
        </section>

        <footer className="footer muted">
          Not financial advice. No guarantees. Research surface only.
        </footer>

        <style jsx>{`
          .wrap {
            max-width: 980px;
            margin: 0 auto;
            padding: 40px 18px 70px;
          }
          .hero {
            padding: 18px 0 8px;
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
            font-size: 40px;
            line-height: 1.08;
            margin: 0 0 10px;
          }
          .subtitle {
            font-size: 16px;
            opacity: 0.88;
            margin: 0 0 10px;
            max-width: 70ch;
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
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 12px;
          }
          .item {
            padding: 12px 12px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(255, 255, 255, 0.01);
            text-decoration: none;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .item:hover {
            border-color: rgba(215, 181, 90, 0.55);
            box-shadow: 0 0 0 6px rgba(215, 181, 90, 0.08);
            transform: translateY(-1px);
          }
          .itemTop {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            align-items: baseline;
          }
          .itemLabel { font-size: 14px; }
          .itemHref { font-size: 12px; opacity: 0.65; }
          ul { margin: 10px 0 0; padding-left: 18px; }
          li { margin: 6px 0; line-height: 1.45; }
          .muted { opacity: 0.75; line-height: 1.45; }
          .footer {
            margin-top: 18px;
            padding-top: 14px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }
          @media (max-width: 760px) {
            .grid { grid-template-columns: 1fr; }
            .title { font-size: 34px; }
          }
        `}</style>
      </main>
    </>
  );
}
