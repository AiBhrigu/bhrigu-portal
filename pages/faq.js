import Head from "next/head";
import Link from "next/link";

export default function FAQ() {
  return (
    <>
      <Head>
        <title>FAQ · Frey / ORION · BHRIGU</title>
        <meta
          name="description"
          content="Frey / ORION FAQ — what it is, what it can do, what is intentionally restricted, and how cosmography is defined."
        />
      </Head>

      <main className="wrap">
        <header className="hero">
          <div className="kicker">BHRIGU · Frey / ORION</div>
          <p className="subtitle">
            Frey is a dialog interface for cosmography: navigation through time, cycles, links and scenarios.
          </p>
        </header>

        <section className="card">
          <h2>Start in 1 minute</h2>
          <ol className="ol">
            <li><strong>Open Frey</strong> → ask one link (human↔human / human↔project / human↔asset).</li>
            <li><strong>Add time</strong> (date / month / window).</li>
            <li><strong>Read it as</strong>: phases → windows → support/tension → next step.</li>
          </ol>

          <div className="nav">
            <Link href="/frey" className="btn">Open Frey</Link>
            <Link href="/reading" className="btn">Reading</Link>
            <Link href="/map" className="btn">Map</Link>
            <Link href="/services" className="btn">Services</Link>
            <Link href="/cosmography" className="btn">Cosmography</Link>
          </div>

          <p className="muted">
            Tip: if you don’t know what to ask — start with “me ↔ project” and a 3–12 month window.
          </p>
        </section>

        <section className="card">
          <h2>What is cosmography?</h2>
          <p>
            Cosmography is not disciplinary knowledge. It is a way to describe reality through position, rhythm,
            cycles and correlations — across different layers of experience.
          </p>
          <p className="muted">
            It is not: astrology, astronomy, physics, philosophy, psychology, metaphysics.
            It can use elements from many domains as inputs, without being reduced to any one of them.
          </p>
        </section>

        <section className="card">
          <h2>What is Frey?</h2>
          <p>
            Frey is a cosmographer: it helps a human (or a system) see how a moment is structured in time —
            and how entities relate to each other across phases.
          </p>
          <ul>
            <li>Not “just answers” — it gives a structured map of a period.</li>
            <li>Not dogma — it supports research, sensemaking and decision navigation.</li>
            <li>Query-first interface — scalable for humans and systems.</li>
          </ul>
        </section>

        <section className="card">
          <h2>What links does Frey work with?</h2>
          <pre className="pre">
(Entity A) × (Entity B) × (Time context) → structured interaction map
          </pre>
        </section>

        <section className="card">
          <h2>Is this predictions?</h2>
          <p>
            Frey works with tendencies, windows and transitions.
            It provides structure and time-coordinates — not absolute verdicts.
          </p>
          <ul>
            <li>Shows support / tension / neutral phases.</li>
            <li>Highlights windows where action is natural vs costly.</li>
            <li>If no signal exists — it says so.</li>
          </ul>
        </section>

        <section className="card">
          <h2>What is intentionally restricted?</h2>
          <p>
            Only one area is closed: <strong>X₄-SEED — Deep-Space Harmonic Line</strong>.
            This is a protected R&amp;D contour.
          </p>
        </section>

        <footer className="footer">
          <div className="muted">
            Open directly at <code>/faq</code>.
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
      `}</style>
    </>
  );
}
