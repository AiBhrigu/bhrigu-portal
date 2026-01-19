import Head from "next/head";

export default function FreyPage() {
  const copy = async () => {
    const text =
`FREY · Query template

ЦЕЛЬ: …
КОНТЕКСТ: …
ОГРАНИЧЕНИЯ: …
ВЫХОД: …`;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert("Copied");
      } else {
        alert("Copy not supported in this browser");
      }
    } catch {
      alert("Copy failed");
    }
  };

  return (
    <>
      <Head>
        <title>Frey · BHRIGU</title>
        <meta
          name="description"
          content="Frey — dialog interface for cosmography. Query-first navigation through time, cycles and scenarios."
        />
      </Head>

      <main className="wrap">
        <header className="hero">
          <div className="kicker">BHRIGU · Frey</div>
          <h1 className="title">Frey</h1>
          <p className="subtitle">
            Dialog interface for cosmography: query-first navigation through time, cycles, links and scenarios.
          </p>
        </header>

        <section className="card">
          <h2>What Frey is</h2>
          <ul>
            <li>Query-first: one request → one structured output.</li>
            <li>Navigation in time: phases, windows, transitions.</li>
            <li>Works with links: human ↔ human, human ↔ project, human ↔ asset, author ↔ style, user ↔ scenario.</li>
          </ul>
        </section>

        <section className="card">
          <h2>Try a query template</h2>
          <p className="muted">Copy and paste into Frey/chat:</p>
          <pre className="pre">
{`ЦЕЛЬ: …
КОНТЕКСТ: …
ОГРАНИЧЕНИЯ: …
ВЫХОД: …`}
          </pre>
          <button className="btn" onClick={copy}>Copy template</button>
        </section>

        <section className="card">
          <h2>Public surface</h2>
          <p>
            This page is UI-only. API routes can be disabled on the public portal by design.
          </p>
        </section>
      </main>

      <style jsx>{`
        .wrap { max-width: 980px; margin: 0 auto; padding: 40px 18px 70px; }
        .hero { padding: 18px 0 8px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 18px; }
        .kicker { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; opacity: .7; margin-bottom: 8px; }
        .title { font-size: 42px; line-height: 1.08; margin: 0 0 10px; }
        .subtitle { font-size: 16px; opacity: .85; margin: 0 0 10px; max-width: 70ch; }
        .card { padding: 18px 16px; margin: 14px 0; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; background: rgba(255,255,255,0.02); }
        h2 { margin: 0 0 10px; font-size: 18px; }
        ul { margin: 10px 0 0; padding-left: 18px; }
        li { margin: 6px 0; line-height: 1.45; }
        p { margin: 8px 0; line-height: 1.55; }
        .muted { opacity: .75; }
        .pre { padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.10); background: rgba(0,0,0,0.25); overflow-x: auto; margin: 10px 0 0; }
        .btn { margin-top: 10px; height: 36px; padding: 0 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.04); cursor: pointer; }
        .btn:hover { background: rgba(255,255,255,0.06); }
        @media (max-width: 760px) { .title { font-size: 34px; } }
      `}</style>
    </>
  );
}
