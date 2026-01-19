import Head from "next/head";

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
          <h1 className="title">FAQ</h1>
          <p className="subtitle">
            Frey is a dialog interface for cosmography: navigation through time, cycles, links and scenarios.
          </p>
        </header>
          <section className="card">
            <h2>Start in 60 seconds</h2>
            <ol className="ol">
              <li><strong>Open Frey</strong> and copy the query template: <code>/frey</code></li>
              <li><strong>Ask one concrete link</strong>: Human↔Human, Human↔Project, Human↔Asset (add date/period)</li>
              <li><strong>Read the output</strong> as: phases → windows → tensions/support → next action</li>
            </ol>

            <div className="nav">
              <a className="btn" href="/frey">Open Frey</a>
              <a className="btn" href="/reading">Reading</a>
              <a className="btn" href="/map">Map</a>
              <a className="btn" href="/services">Services</a>
              <a className="btn" href="/cosmography">Cosmography</a>
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
            <li>Not “just answers” — it gives a map of a period.</li>
            <li>Not dogma — it supports research, sensemaking and decision navigation.</li>
            <li>Not a UI zoo — the core interface is a query (search-like) flow.</li>
          </ul>
        </section>

        <section className="card">
          <h2>What can I talk to Frey about?</h2>
          <p>
            Anything that has time, process, choice, interaction or meaning:
            life, relationships, projects, money, creativity, philosophy, future, and also space and cycles.
          </p>
          <p className="muted">
            Frey does not “discredit” intuition, mystery or forecasting traditions — it makes the inquiry more
            structured and readable through time.
          </p>
        </section>

        <section className="card">
          <h2>What links does Frey work with?</h2>
          <p className="muted">Core pattern:</p>
          <pre className="pre">(Entity A) × (Entity B) × (Time context) → structured interaction map</pre>

            <p className="muted">Examples:</p>
            <pre className="pre">human ↔ human → resonance / dynamics / tendencies
human ↔ project → phases / entry-exit windows / friction points
human ↔ asset → timing / risk-support tone / cycles
author ↔ style → amplification vs dilution / peaks
user ↔ scenario → relevance / maturity / decision nodes</pre>

          <div className="grid">
            <div className="chip">
              <h3>Human ↔ Human</h3>
              <p>resonant compatibility, relationship dynamics, tendencies across periods</p>
            </div>
            <div className="chip">
              <h3>Human ↔ Project</h3>
              <p>role fit, growth phases, entry/exit windows, stress/support periods</p>
            </div>
            <div className="chip">
              <h3>Human ↔ Asset</h3>
              <p>timing windows, interaction tone, risk/support phases</p>
            </div>
            <div className="chip">
              <h3>Author ↔ Style</h3>
              <p>voice amplification vs dilution, expressive peaks, friction zones</p>
            </div>
            <div className="chip">
              <h3>User ↔ Scenario</h3>
              <p>scenario maturity, relevance timing, decision points</p>
            </div>
            <div className="chip">
              <h3>Team ↔ Team</h3>
              <p>group resonance, coordination stability, phase shifts (extended mode)</p>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Is this “predictions”?</h2>
          <p>
            Frey works with tendencies, windows, phases and transitions. A forecast is always interpretation —
            Frey provides structure and time-coordinates, not absolute verdicts.
          </p>
          <ul>
            <li>It can show support / tension / neutral phases.</li>
            <li>It can highlight windows where action is natural vs costly.</li>
            <li>If no signal exists, it says so — “no strong correlation” is also information.</li>
          </ul>
        </section>

        <section className="card">
          <h2>What is available for Free vs Pro vs API?</h2>

          <div className="table">
            <div className="row head">
              <div>Layer</div>
              <div>What you get</div>
              <div>Typical use</div>
            </div>

            <div className="row">
              <div className="tag">Free</div>
              <div>
                Observation mode: real outputs, time structure, periods, tables/visuals,
                and readable explanations. Enough to learn the system and use it daily.
              </div>
              <div>research, exploration, learning, first value</div>
            </div>

            <div className="row">
              <div className="tag">Pro</div>
              <div>
                Work mode: deeper parameterization, comparisons, saved scenarios, stronger operational use.
              </div>
              <div>daily work, decisions, repeated scenarios</div>
            </div>

            <div className="row">
              <div className="tag">API</div>
              <div>
                Integration mode: programmatic access, scale, automation, exports, product embedding.
              </div>
              <div>systems, apps, research pipelines</div>
            </div>

            <div className="row">
              <div className="tag">Research</div>
              <div>
                Closed experiments: unstable features, testing layers (invite / limited).
              </div>
              <div>validation, experiments</div>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>What is intentionally restricted?</h2>
          <p>
            Only one area is intentionally closed: <strong>X₄-SEED — Deep-Space Harmonic Line</strong>.
            This is a protected R&amp;D contour for deep cosmographic research.
          </p>
          <p className="muted">
            Everything practical and user-valuable remains visible and testable through the public layer.
          </p>
        </section>

        <section className="card">
          <h2>Why a query-first interface?</h2>
          <p>
            Because it scales, stays stable for years, and works for both humans and systems.
            One query → one finished, structured output.
          </p>
        </section>

        <footer className="footer">
          <div className="muted">
            Tip: open this page directly at <code>/faq</code>.
          </div>
        </footer>
      </main>

      <style jsx>{`
          a { color: inherit; text-decoration: underline; text-decoration-color: rgba(215,181,90,0.55); text-underline-offset: 3px; word-break: break-word; }
          a:hover { text-decoration-color: rgba(215,181,90,0.95); }
          .nav { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
          .btn { display: inline-flex; align-items: center; justify-content: center; height: 36px; padding: 0 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); text-decoration: none; }
          .btn:hover { background: rgba(255,255,255,0.07); }
          .ol { margin: 10px 0 0; padding-left: 18px; }
          .ol li { margin: 8px 0; line-height: 1.45; }

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
          opacity: 0.7;
          margin-bottom: 8px;
        }
        .title {
          font-size: 42px;
          line-height: 1.08;
          margin: 0 0 10px;
        }
        .subtitle {
          font-size: 16px;
          opacity: 0.85;
          margin: 0 0 10px;
          max-width: 70ch;
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
        h3 {
          margin: 0 0 6px;
          font-size: 14px;
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
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(0, 0, 0, 0.25);
          overflow-x: auto;
          margin: 10px 0 0;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 12px;
        }
        @media (max-width: 760px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .title {
            font-size: 34px;
          }
        }
        .chip {
          padding: 12px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.01);
        }
        .table {
          margin-top: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          overflow: hidden;
        }
        .row {
          display: grid;
          grid-template-columns: 110px 1fr 220px;
          gap: 12px;
          padding: 12px 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .row.head {
          border-top: none;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          opacity: 0.75;
          background: rgba(255, 255, 255, 0.02);
        }
        @media (max-width: 860px) {
          .row {
            grid-template-columns: 110px 1fr;
          }
          .row > div:nth-child(3) {
            grid-column: 1 / -1;
            opacity: 0.8;
          }
        }
        .tag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 28px;
          padding: 0 10px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.03);
          font-size: 12px;
          width: fit-content;
        }
        .footer {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        code {
          padding: 2px 6px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.10);
          background: rgba(0, 0, 0, 0.22);
        }
      `}</style>
    </>
  );
}
