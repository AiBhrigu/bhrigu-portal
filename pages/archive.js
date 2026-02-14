import Head from "next/head";

export default function Archive() {
  return (
    <main className="page">
      <Head>
        <title>Archive · BHRIGU</title>
        <meta name="description" content="Archive: a public time capsule of signals and chronicle notes." />
      </Head>

      <header className="pageHeader">
        <h1 style={{ margin: 0, letterSpacing: "0.01em" }}>Archive</h1>
        <p className="muted" style={{ marginTop: 10, maxWidth: 760 }}>
          A public time capsule. This branch contains short signals and a compact chronicle.
        </p>
        <p className="muted" style={{ marginTop: 10, maxWidth: 760 }}>
          Navigation is handled by the Golden Path block (no random page-to-page links).
        </p>
      </header>

      <section style={{ marginTop: "var(--phi-34)" }}>
        <div className="card">
          <div style={{ fontWeight: 650, letterSpacing: "0.02em" }}>What lives here</div>
          <ul style={{ marginTop: 12, lineHeight: 1.65, opacity: 0.9 }}>
            <li><strong>Signal</strong>: short observations (public).</li>
            <li><strong>Chronicle</strong>: a minimal history trace (public).</li>
          </ul>
          <div className="muted" style={{ marginTop: 10 }}>
            Use Prev / Next to move along the archive branch.
          </div>
        </div>
      </section>

      <style jsx>{`
        .page { padding: var(--phi-34) var(--phi-21); max-width: 1120px; margin: 0 auto; }
        .pageHeader { margin-top: var(--phi-21); }
        .card { border-radius: var(--phi-21); padding: var(--phi-21);
          background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(0,0,0,0.25));
          border: 1px solid rgba(215,181,90,0.18);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), 0 18px 54px rgba(0,0,0,0.42);
        }
        .muted { opacity: 0.78; }
      `}</style>
    </main>
  );
}
