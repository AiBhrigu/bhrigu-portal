/* ATOM_BHRIGU_PORTAL_LANDING_CANON_V2 */
import Head from "next/head";

export default function Start() {
  return (
    <>
      <Head>
        <title>Start · BHRIGU</title>
        <meta
          name="description"
          content="Start here: what BHRIGU is, how to navigate the portal, and where Frey/ORION fits — with intentional constraints for trust."
        />
        <link rel="canonical" href="https://www.bhrigu.io/start" />
        <meta property="og:site_name" content="BHRIGU" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Start · BHRIGU" />
        <meta
          property="og:description"
          content="A short onboarding path: reading, signals, maps, and Frey/ORION — with trust-first constraints."
        />
        <meta property="og:image" content="https://www.bhrigu.io/og.svg" />
      </Head>

      <main className="wrap">
        <div className="hero">
          <div className="kicker">Onboarding</div>
          <h1 className="title">Start</h1>
          <p className="subtitle">
            BHRIGU is a structural portal for cosmography and the Frey/ORION interface layer.
            The public surface is intentionally constrained to keep trust and clarity.
          </p>

          <div className="nav">
            <a className="btn" href="/reading">Reading</a>
            <a className="btn" href="/signal">Signal</a>
            <a className="btn" href="/map">Map</a>
            <a className="btn" href="/services">Services</a>
          </div>
        </div>

        <section className="card">
          <h2>Recommended path (10 minutes)</h2>
          <ol className="ol">
            <li>
              <strong>Read</strong> the framing: <a href="/reading">/reading</a>
            </li>
            <li>
              <strong>See the structure</strong>: <a href="/map">/map</a> and <a href="/cosmography">/cosmography</a>
            </li>
            <li>
              <strong>Explore the interface layer</strong>: <a href="/frey">/frey</a> and <a href="/orion">/orion</a>
            </li>
          </ol>
        </section>

        <section className="card">
          <h2>Trust-first constraints</h2>
          <ul>
            <li>No “magic claims”. This is a research and interface surface.</li>
            <li>Public pages are read-first. Private features require explicit access.</li>
            <li>The API is intentionally disabled on this domain.</li>
          </ul>
          <pre className="pre">
{`/api → 410 (disabled on purpose)
Public surface: docs + maps + signals
Private surface: access-gated`}
          </pre>
        </section>

        <section className="card">
          <h2>If you are an investor or grant reviewer</h2>
          <p className="muted">
            You should see a stable surface, clean narrative, and a long-horizon research posture.
            If you want a short deck or access notes, use the access page.
          </p>
          <div className="nav">
            <a className="btn" href="/access">Request access</a>
            <a className="btn" href="/chronicle">Chronicle</a>
            <a className="btn" href="/faq">FAQ</a>
          </div>
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
          p { margin: 8px 0; line-height: 1.55; }
          ul {
            margin: 10px 0 0;
            padding-left: 18px;
          }
          li {
            margin: 6px 0;
            line-height: 1.45;
          }
          .ol { margin: 10px 0 0; padding-left: 18px; }
          .ol li { margin: 8px 0; line-height: 1.45; }
          .pre {
            padding: 10px 12px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.10);
            background: rgba(0, 0, 0, 0.25);
            overflow-x: auto;
            margin: 10px 0 0;
            white-space: pre-wrap;
          }
          .muted { opacity: 0.75; }
          .footer {
            margin-top: 18px;
            padding-top: 14px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }
          @media (max-width: 760px) {
            .title { font-size: 34px; }
          }
        `}</style>
      </main>
    </>
  );
}
