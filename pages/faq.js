import Head from "next/head";
import Link from "next/link";

export default function FAQ() {
  return (
    <>
      <Head>
        <title>FAQ · Frey / ORION · BHRIGU</title>
        <meta
          name="description"
          content="Frey / ORION FAQ — structure, roles, layers, limits and operational model."
        />
      </Head>

      <main className="wrap">
        <header className="hero">
          <div className="kicker">BHRIGU · Frey / ORION</div>
          <p className="subtitle">
            BHRIGU is the surface portal. Frey is the execution interface.
            Orion is the core engine. Cosmography is the structural method behind them.
          </p>
        </header>

        <section className="card">
          <h2>Start in 1 minute</h2>
          <ol className="ol">
            <li><strong>Open Frey</strong> → ask one link (human↔human / human↔project / human↔asset).</li>
            <li><strong>Add time</strong> (date / month / window).</li>
            <li><strong>Read the output</strong> as: phases → windows → support/tension → next step.</li>
          </ol>

          <div className="nav">
            <Link href="/frey" className="btn">Open Frey</Link>
            <Link href="/reading" className="btn">Reading</Link>
            <Link href="/map" className="btn">Map</Link>
            <Link href="/services" className="btn">Services</Link>
            <Link href="/cosmography" className="btn">Cosmography</Link>
          </div>

          <p className="muted">
            If unsure where to begin — start with “me ↔ project” and a 3–12 month window.
          </p>
        </section>

        <section className="card">
          <h2>What is cosmography?</h2>
          <p>
            Cosmography is a structural method for describing reality through
            position, rhythm, cycles and correlation across layers of experience.
          </p>
          <p className="muted">
            It is not a belief system or a discipline. It may use inputs from different
            domains without being reduced to any single one of them.
          </p>
        </section>

        <section className="card">
          <h2>What is Frey?</h2>
          <p>
            Frey is the operational interface to the cosmographic engine.
            It maps how entities relate across time and phases.
          </p>
          <ul>
            <li>Provides structured period maps — not isolated answers.</li>
            <li>Supports research, navigation and decision-making.</li>
            <li>Works through a query-first interaction model.</li>
          </ul>
        </section>

        <section className="card">
          <h2>What can Frey analyze?</h2>
          <p>
            Any process involving time, interaction or choice:
            relationships, projects, capital, creativity, systems, cycles.
          </p>
          <p className="muted">
            Frey structures inquiry. Interpretation remains human.
          </p>
        </section>

        <section className="card">
          <h2>Core interaction pattern</h2>
          <pre className="pre">
(Entity A) × (Entity B) × (Time context) → structured interaction map
          </pre>
        </section>

        <section className="card">
          <h2>Is this prediction?</h2>
          <p>
            Frey works with tendencies, windows and transitions in time.
            It does not issue absolute verdicts.
          </p>
          <ul>
            <li>Shows supportive / tense / neutral phases.</li>
            <li>Highlights natural vs costly action windows.</li>
            <li>If no strong signal exists — it states that explicitly.</li>
          </ul>
        </section>

        <section className="card">
          <h2>Access layers</h2>

          <div className="table">
            <div className="row head">
              <div>Layer</div>
              <div>Capability</div>
              <div>Typical use</div>
            </div>

            <div className="row">
              <div className="tag">Free</div>
              <div>
                Observation mode: structured outputs, period maps,
                readable explanations and baseline analytics.
              </div>
              <div>exploration, research, learning</div>
            </div>

            <div className="row">
              <div className="tag">Pro</div>
              <div>
                Operational mode: deeper comparisons, parameter control,
                repeated scenario analysis.
              </div>
              <div>ongoing work, decision cycles</div>
            </div>

            <div className="row">
              <div className="tag">API</div>
              <div>
                Programmatic integration, automation, scaling and embedding.
              </div>
              <div>systems, applications, pipelines</div>
            </div>

            <div className="row">
              <div className="tag">Research</div>
              <div>
                Experimental layers and controlled R&D access.
              </div>
              <div>validation, deep testing</div>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>What is intentionally restricted?</h2>
          <p>
            X₄-SEED — Deep-Space Harmonic Line.
            This contour remains protected as core research infrastructure.
          </p>
          <p className="muted">
            All practical user-facing capabilities remain available through public layers.
          </p>
        </section>

        <footer className="footer">
          <div className="muted">
            Direct access: <code>/faq</code>
          </div>
        </footer>
      </main>

      <style jsx>{`
        .wrap {
          max-width: 980px;
          margin: 0 auto;
          padding: 40px 18px 70px;
        }

        .hero {
          padding: 18px 0 8px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 18px;
        }

        .kicker {
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          opacity: 0.7;
          margin-bottom: 8px;
        }

        .subtitle {
          font-size: 16px;
          opacity: 0.85;
          max-width: 70ch;
        }

        .card {
          padding: 18px 16px;
          margin: 14px 0;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          background: rgba(255,255,255,0.02);
        }

        h2 {
          margin: 0 0 10px;
          font-size: 18px;
        }

        p {
          margin: 8px 0;
          line-height: 1.55;
        }

        ul {
          margin: 10px 0 0;
          padding-left: 18px;
        }

        li {
          margin: 6px 0;
          line-height: 1.45;
        }

        .muted {
          opacity: 0.75;
        }

        .pre {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.25);
          overflow-x: auto;
        }

        .nav {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 14px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.03);
          transition: all .12s ease;
        }

        .btn:hover {
          border-color: rgba(215,181,90,.6);
          transform: translateY(-1px);
        }

        .table {
          margin-top: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          overflow: hidden;
        }

        .row {
          display: grid;
          grid-template-columns: 110px minmax(280px, 1.3fr) minmax(200px, 1fr);
          gap: 18px;
          padding: 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
          align-items: start;
        }

        .row.head {
          border-top: none;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.75;
          background: rgba(255,255,255,0.02);
        }

        .tag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.03);
          font-size: 12px;
          width: fit-content;
        }

        .footer {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        code {
          padding: 2px 6px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.22);
        }

        @media (max-width: 768px) {
          .row {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
      `}</style>
    </>
  );
}
