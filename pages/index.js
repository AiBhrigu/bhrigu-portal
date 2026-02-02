// ATOM_BHRIGU_PORTAL_TRUST_INVESTOR_V1
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Home() {
  // UI-only: Frey Query Bar wiring (local only, no network)
  const FREY_QUEUE_KEY = "frey_queue_v0_5";
  const router = useRouter();
  const [freyQ, setFreyQ] = useState("");
  const [freyCount, setFreyCount] = useState(0);

  const freyQueueRead = () => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(FREY_QUEUE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  };

  const freyQueueWrite = (arr) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(FREY_QUEUE_KEY, JSON.stringify(arr));
    } catch (_) {}
  };

  useEffect(() => {
    const sync = () => setFreyCount(freyQueueRead().length);
    sync();
    const onStorage = (e) => {
      if (!e || e.key === FREY_QUEUE_KEY) sync();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }
  }, []);

  const onFreySubmit = (e) => {
    e.preventDefault();
    const q = (freyQ || "").trim();
    if (!q) return;
    const now = Date.now();
    const item = { id: now.toString(36), when: now, text: q, src: "root" };
    const prev = freyQueueRead();
    const next = [item, ...prev].slice(0, 24);
    freyQueueWrite(next);
    setFreyQ("");
    setFreyCount(next.length);
    router.push("/frey");
  };

  return (
    <>
      <Head>
        <title>BHRIGU · Frey / ORION</title>
        <meta name="description" content="A structural portal for Frey / ORION: cosmography, signals, and carefully constrained research interfaces." />
<meta property="og:title" content="BHRIGU · Frey / ORION" />
        <meta property="og:description" content="A structural portal for Frey / ORION: cosmography, signals, and carefully constrained research interfaces." />
        <meta property="og:url" content="https://www.bhrigu.io/" />
        <meta name="twitter:title" content="BHRIGU · Frey / ORION" />
        <meta name="twitter:description" content="A structural portal for Frey / ORION: cosmography, signals, and carefully constrained research interfaces." />
      </Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"WebSite\", \"name\": \"BHRIGU\", \"url\": \"https://www.bhrigu.io/\", \"description\": \"Structural portal and gateway layer for Frey / ORION \\u2014 cosmography, signals, and constrained research interfaces.\", \"publisher\": {\"@type\": \"Organization\", \"name\": \"BHRIGU\"}}" }} />

      <main className="wrap">
        {/*__FREY_QUERY_BAR_STUB_V0_1__*/}
        <section aria-label="Frey Query Bar" data-mark="FREY_QUERY_BAR_STUB_V0_1" style={{ marginTop: "var(--phi-34)", border: "1px solid rgba(215,181,90,0.22)", borderRadius: "var(--phi-21)", padding: "var(--phi-21)", background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(0,0,0,0.22))", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.055), 0 18px 54px rgba(0,0,0,0.42)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--phi-8)" }}>
            <div style={{ fontWeight: 650, letterSpacing: "0.02em" }}>Frey Query Bar</div>
            <div style={{ opacity: 0.78, fontSize: "0.95rem", lineHeight: 1.35 }}>UI-only: saved locally, no network.</div>
          </div>

          <form onSubmit={onFreySubmit} style={{ marginTop: "var(--phi-13)", display: "flex", gap: "var(--phi-13)", alignItems: "stretch" }}>
            <input value={freyQ} onChange={(e) => setFreyQ(e.target.value)} placeholder="Type a query…" style={{ flex: 1, width: "100%", minHeight: "var(--phi-55)", padding: "var(--phi-13) var(--phi-21)", borderRadius: "var(--phi-13)", border: "1px solid rgba(255,255,255,0.28)", background: "rgba(0,0,0,0.52)", color: "inherit" }} />
            <button type="submit" style={{ padding: "0 var(--phi-21)", borderRadius: "var(--phi-13)", border: "1px solid rgba(215,181,90,0.36)", background: "rgba(0,0,0,0.12)", color: "inherit" }}>Queue</button>
            <button type="button" onClick={() => router.push("/frey")} style={{ padding: "0 var(--phi-21)", borderRadius: "var(--phi-13)", border: "1px solid rgba(255,255,255,0.22)", background: "rgba(0,0,0,0.06)", color: "inherit" }}>Open</button>
          </form>

          <div style={{ marginTop: "var(--phi-13)", opacity: 0.8, fontSize: "0.92rem" }}>
            <span>{freyCount} queued</span>
          </div>

          <span style={{ display: "none" }}>FREY_QUERY_BAR_STUB_V0_1</span>
        </section>

        <section className="hero">
          <div className="kicker">BHRIGU · Frey / ORION</div>
          <h1 className="title">Cosmography, signals, and a constrained research interface.</h1>
          <p className="subtitle">
            AI cosmography interface (domain of an AI cosmographer). Built for clarity and trust: explicit limits, reproducible surfaces, and a clean path from exploration → understanding.
          </p>

          <div className="cta">
            <Link className="btn" href="/start">Start</Link>
            <Link className="btn" href="/frey">Frey</Link>
            <Link className="btn" href="/services">Services</Link>
          </div>

          <div className="proof">
            <div className="chip">
              <div className="label">Live</div>
              <div className="value">Portal pages are public and stable.</div>
            </div>
            <div className="chip">
              <div className="label">Boundaries</div>
              <div className="value">/api is intentionally disabled (safety & IP).</div>
            </div>
            <div className="chip">
              <div className="label">Method</div>
              <div className="value">Surface-first UX; internals stay sealed.</div>
            </div>
          </div>
        </section>

        <section className="grid">
          <Link className="card" href="/cosmography">
            <h2>Cosmography</h2>
            <p>Definitions, boundaries, and what we mean by “structure”.</p>
          </Link>
          <Link className="card" href="/signal">
            <h2>Signal</h2>
            <p>How we talk about observations without hype.</p>
          </Link>
          <Link className="card" href="/map">
            <h2>Map</h2>
            <p>Navigation layer for exploring the surface outputs.</p>
          </Link>
          <Link className="card" href="/faq">
            <h2>FAQ</h2>
            <p>What this is, what it is not, and why constraints matter.</p>
          </Link>
        </section>

        <section className="trust">
          <h2>Trust model</h2>
          <ul>
            <li><b>Explicit limits.</b> We say “no” when a boundary is required.</li>
            <li><b>Surface-only public outputs.</b> Internals are not exposed.</li>
            <li><b>No financial advice.</b> This is a research interface, not a trading product.</li>
          </ul>
          <p className="muted">If you are evaluating support (grant/investor), start at <Link href="/start">/start</Link>.</p>
        </section>
      </main>

      <style jsx>{`
        .wrap { max-width: 1100px; margin: 0 auto; padding: 36px 18px 76px; }
        .hero { padding: 10px 0 18px; border-bottom: 1px solid rgba(255,255,255,.08); }
        .kicker { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; opacity: .75; margin-bottom: 10px; }
        .title { font-size: 46px; line-height: 1.06; margin: 0 0 12px; }
        .subtitle { font-size: 16px; line-height: 1.6; opacity: .86; margin: 0 0 16px; max-width: 72ch; }
        .cta { display: flex; flex-wrap: wrap; gap: 18px; margin: 10px 0 14px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; height: 36px; padding: 0 14px; border-radius: 999px;
               border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.03); text-decoration: none; }
        .btn:hover { border-color: rgba(215,181,90,.55); box-shadow: 0 0 0 6px rgba(215,181,90,.08); transform: translateY(-1px); }
        .proof { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 14px; }
        .chip { padding: 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.015); }
        .label { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; opacity: .7; margin-bottom: 6px; }
        .value { opacity: .9; line-height: 1.45; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-top: 18px; }
        .card { padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.02); text-decoration: none; }
        .card:hover { border-color: rgba(215,181,90,.55); box-shadow: 0 0 0 6px rgba(215,181,90,.06); }
        .card h2 { margin: 0 0 8px; font-size: 18px; text-decoration: underline; text-decoration-color: rgba(215, 181, 90, 0.55); text-underline-offset: 0.22em; text-decoration-thickness: 1px; }
        .card p { margin: 0; opacity: .82; line-height: 1.55; }
        .trust { margin-top: 18px; padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.015); }
        .trust h2 { margin: 0 0 10px; font-size: 18px; }
        .trust ul { margin: 0; padding-left: 18px; }
        .trust li { margin: 8px 0; line-height: 1.5; }
        .muted { opacity: .78; margin-top: 10px; }
        @media (max-width: 860px) {
          .title { font-size: 36px; }
          .proof { grid-template-columns: 1fr; }
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
