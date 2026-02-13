import PortalFooterNav from "../components/PortalFooterNav";

// ATOM_BHRIGU_PORTAL_TRUST_INVESTOR_V1
import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Start() {
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
    const item = { id: now.toString(36), when: now, text: q, src: "start" };
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
        <title>Start · BHRIGU</title>
        <meta name="description" content="A fast path through BHRIGU: what to read first, how Frey is constrained, and what support enables next." />
<meta property="og:title" content="Start · BHRIGU" />
        <meta property="og:description" content="A fast path through BHRIGU: what to read first, how Frey is constrained, and what support enables next." />
        <meta property="og:url" content="https://www.bhrigu.io/start" />
        <meta name="twitter:title" content="Start · BHRIGU" />
        <meta name="twitter:description" content="A fast path through BHRIGU: what to read first, how Frey is constrained, and what support enables next." />
      <meta name="phi-surface" content="PHI_SURFACE_V0_3" />
      </Head>
      <main className="wrap">
        {/*__FREY_QUERY_BAR_STUB_V0_1__*/}
<section className="hero">
          <div className="kicker">Start</div>
          <h1 className="title">Understand the portal in minutes.</h1>
          <p className="subtitle">This is a surface-first site: we show what you can trust, and we state what is intentionally restricted.</p>

          <div className="cta">
            Read FAQ
            Open Frey
            See Services
          </div>
        </section>

        <section className="grid">
          <div className="card">
            <h2>1) Read the boundaries</h2>
            <p>Constraints are not a weakness — they are the trust layer.</p>
            <ul>
              <li>/api is disabled by design.</li>
              <li>No financial advice.</li>
              <li>Internals are sealed (IP + safety).</li>
            </ul>
          </div>
          <div className="card">
            <h2>2) Explore the surface</h2>
            <p>Use the portal to navigate what exists today.</p>
            <ul>
              <li>Cosmography — definitions.</li>
              <li>Signal — how we speak about observations.</li>
              <li>Map — structured navigation.</li>
            </ul>
          </div>
        </section>

        
<section className="trust">
  <h2>Investors / partners</h2>
  <p className="muted">Investors / partners overview: /investors.</p>
  <div style={{ display: "none" }} aria-hidden="true"></div>
</section>

      
                  {/*  */}
      

<PortalFooterNav termsHref="/faq" next={[{href:"/reading",label:"/reading"}]} note="Canon: start → reading." />
      

<p className="muted">For investors / partners: /investors. <span style={{display:"none"}}>__IA_START_TO_INVESTORS_V0_2__</span></p>
</main>

      <style jsx>{`
        .wrap { max-width: 1100px; margin: 0 auto; padding: 36px 18px 76px; }
        .hero { padding: 10px 0 18px; border-bottom: 1px solid rgba(255,255,255,.08); }
        .kicker { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; opacity: .75; margin-bottom: 10px; }
        .title { font-size: 42px; line-height: 1.08; margin: 0 0 12px; }
        .subtitle { font-size: 16px; line-height: 1.6; opacity: .86; margin: 0 0 16px; max-width: 72ch; }
        .cta { display: flex; flex-wrap: wrap; gap: 18px; margin: 10px 0 0; }
        .btn { display: inline-flex; align-items: center; justify-content: center; height: 36px; padding: 0 14px; border-radius: 999px;
               border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.03); text-decoration: none; }
        .btn:hover { border-color: rgba(215,181,90,.55); box-shadow: 0 0 0 6px rgba(215,181,90,.08); transform: translateY(-1px); }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-top: 18px; }
        .card { padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.02); }
        .card h2 { margin: 0 0 8px; font-size: 18px; text-decoration: underline; text-decoration-color: rgba(215, 181, 90, 0.55); text-underline-offset: 0.22em; text-decoration-thickness: 1px; }
        .card p { margin: 0 0 10px; opacity: .82; line-height: 1.55; }
        .card ul { margin: 0; padding-left: 18px; }
        .card li { margin: 6px 0; line-height: 1.45; }
        .support { margin-top: 18px; padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.015); }
        .support h2 { margin: 0 0 10px; font-size: 18px; }
        .row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 12px; }
        .chip { padding: 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.015); }
        .label { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; opacity: .7; margin-bottom: 6px; }
        .value { opacity: .9; line-height: 1.45; }
        .muted { opacity: .78; margin-top: 10px; }
        @media (max-width: 860px) {
          .title { font-size: 34px; }
          .grid { grid-template-columns: 1fr; }
          .row { grid-template-columns: 1fr; }
        }

/* __FREY_HOME_QUERY_INPUT_CANON_V0_2__ */
.qInput{
  flex: 1;
  width: 100%;
  min-height: var(--phi-55);
  padding: var(--phi-13) var(--phi-21);
  border-radius: var(--phi-13);
  border: 1px solid rgba(255,255,255,0.28);
  background: rgba(0,0,0,0.52);
  color: inherit;
}
`}</style>
    </>
  );
}
