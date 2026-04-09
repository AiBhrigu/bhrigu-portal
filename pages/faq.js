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
          <h2>What is this field?</h2>
          <p>
            This field is a structured way of reading relation, rhythm,
            transition, and boundary across time.
          </p>
          <p className="muted">
            It does not reduce reality to one domain. It holds structure,
            cycles, resonance, and signal as a readable field within a
            constrained research interface.
          </p>
        </section>

        <section className="card">
          <h2>What is a reading?</h2>
          <p>
            A reading is not a verdict. It is a held interpretive frame
            around a surfaced pattern.
          </p>
          <p className="muted">
            It helps make structure legible without claiming final certainty,
            and it belongs to a distinct reading surface rather than remaining
            only an entry interaction.
          </p>
        </section>

        <section className="card">
          <h2>What is a signal?</h2>
          <p>
            A signal is a meaningful structural indication within a time-bound field.
          </p>
          <p className="muted">
            It may show pressure, support, transition, resonance, or the
            absence of strong alignment.
          </p>
        </section>

        <section className="card">
          <h2>What is a time anchor?</h2>
          <p>
            A time anchor is the point through which the field is entered
            for observation.
          </p>
          <p className="muted">
            It stabilizes the reading frame so movement across time can be
            interpreted coherently rather than treated as an unbounded impression.
          </p>
        </section>

        <section className="card">
          <h2>What does Frey do here?</h2>
          <p>
            Frey is the threshold surface of the field.
          </p>
          <p className="muted">
            It serves as the public interface for orientation, first contact,
            and early temporal exploration. Its role is to open the path clearly
            and hold the first structured contact with the field.
          </p>
        </section>

        <section className="card">
          <h2>Where does the reading happen?</h2>
          <p>
            The reading happens on a distinct reading surface.
          </p>
          <p className="muted">
            Frey opens the threshold, while reading holds the surfaced pattern
            in a clearer interpretive frame.
          </p>
        </section>

        <section className="card">
          <h2>When does deeper access begin?</h2>
          <p>
            Deeper access begins when a request moves beyond early exploration
            and enters reviewed entry.
          </p>
          <p>
            Access begins where the request must be shaped carefully before
            analysis starts, especially when dates, events, context, and
            framing materially affect precision.
          </p>
          <p className="muted">
            All deeper work begins with manual review. Scope, timing, and
            pricing are clarified after review, not before it.
          </p>
          <div className="nav">
            <Link href="/access" className="btn">Continue to Access</Link>
          </div>
        </section>

        <section className="card">
          <h2>Is this prediction?</h2>
          <p>No.</p>
          <p>
            The field works with tendencies, timing, phases, and structural
            transitions.
          </p>
          <p className="muted">
            It does not issue absolute verdicts, and when no strong signal is
            present, that boundary should remain explicit.
          </p>
        </section>

        <section className="card">
          <h2>What does ORION hold beneath the surface?</h2>
          <p>
            ORION names the analytical depth beneath the portal surface.
          </p>
          <p className="muted">
            It is a boundary reference for the engine layer, not a public
            dashboard, not a public API, and not an onboarding surface.
          </p>
        </section>

        <section className="card">
          <h2>Why are some layers bounded?</h2>
          <p>
            Because trust, safety, research integrity, and long-term maintenance
            require real boundaries.
          </p>
          <p className="muted">
            The public layer is intentionally constrained: outputs stay
            surface-first, internals remain sealed, and the system favors
            clarity and reproducibility over hype or premature exposure.
          </p>
        </section>

        <section className="card">
          <h2>What is not public here?</h2>
          <p>
            Not everything beneath the portal surface is public.
          </p>
          <p className="muted">
            There is no public API, no exposed dashboard layer, no live
            instruments on the cosmography surface, and no unrestricted
            access to internal systems.
          </p>
        </section>

        <section className="card">
          <h2>Where can the public path go next?</h2>
          <p>
            The public path continues through distinct surfaces, each with
            a different role.
          </p>
          <p className="muted">
            Frey is the threshold for first contact and early exploration.
            Reading is the interpretive surface. ORION is the boundary
            reference for analytical depth. Access is the reviewed entry
            path for serious requests. The GitHub mirror exposes selected
            public layers without revealing the full internal stack.
          </p>

          <div className="nav">
            <Link href="/frey" className="btn">Frey</Link>
            <Link href="/reading" className="btn">Reading</Link>
            <Link href="/orion" className="btn">ORION</Link>
            <Link href="/access" className="btn">Access</Link>
            <a
              href="https://github.com/AiBhrigu"
              className="btn"
              target="_blank"
              rel="noreferrer"
            >
              GitHub Mirror
            </a>
          </div>
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
