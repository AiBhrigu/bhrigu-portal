import PortalFooterNav from "../components/PortalFooterNav";

// ATOM_BHRIGU_PORTAL_TRUST_INVESTOR_V1
import Head from "next/head";
import Link from "next/link";

export default function Services() {
  return (
    <>
      <Head>
        <title>Services · BHRIGU</title>
        <meta name="description" content="What BHRIGU offers today: a stable portal surface, Frey-facing interfaces, and structured research presentation." />
<meta property="og:title" content="Services · BHRIGU" />
        <meta property="og:description" content="What BHRIGU offers today: a stable portal surface, Frey-facing interfaces, and structured research presentation." />
        <meta property="og:url" content="https://www.bhrigu.io/services" />
        <meta name="twitter:title" content="Services · BHRIGU" />
        <meta name="twitter:description" content="What BHRIGU offers today: a stable portal surface, Frey-facing interfaces, and structured research presentation." />
      </Head>
      <main className="wrap">
        <section className="hero">
          <div className="kicker">Services</div>
          <h1 className="title">A clean surface for Frey / ORION outputs.</h1>
          <p className="subtitle">No hype. Clear boundaries. Designed for trust and long-term maintenance.</p>

          <div className="cta">
            <Link className="btn" href="/frey">Frey</Link>
            <Link className="btn" href="/orion">ORION</Link>
            <Link className="btn" href="/faq">FAQ</Link>
          </div>
        </section>

        <section className="grid">
          <div className="card">
            <h2>Portal surface (public)</h2>
            <p>Stable pages with consistent navigation and a single visual canon.</p>
            <div className="tags"><span className="tag">UX</span><span className="tag">SEO</span><span className="tag">Trust</span></div>
          </div>
          <div className="card">
            <h2>Frey interface (constrained)</h2>
            <p>Surface-only interaction layer. Internals remain sealed.</p>
            <div className="tags"><span className="tag">Boundaries</span><span className="tag">Safety</span><span className="tag">IP</span></div>
          </div>
          <div className="card">
            <h2>Research presentation</h2>
            <p>Structured outputs for reading, not “demo chaos”.</p>
            <div className="tags"><span className="tag">Rigor</span><span className="tag">Repro</span><span className="tag">Docs</span></div>
          </div>
          <div className="card">
            <h2>Pilot / partnership</h2>
            <p>For grants and aligned investors: fund the surface expansion, not the hype.</p>
            <div className="tags"><span className="tag">Grant-fit</span><span className="tag">Investor</span><span className="tag">Roadmap</span></div>
          </div>
        </section>

        <section className="road">
          <h2>What we build next (surface-only)</h2>
          <ol>
            <li>Sharper onboarding and a single “golden” reading path.</li>
            <li>More verified pages with consistent SEO metadata.</li>
            <li>Safer distribution and clearer access boundaries.</li>
          </ol>
          <p className="muted">Start with <Link href="/start">/start</Link>. Read constraints in <Link href="/faq">/faq</Link>.</p>
        </section>
      
            <PortalFooterNav termsHref="/faq" next={[{href:"/access",label:"/access"},{href:"/dao",label:"/dao"}]} note="Canon: services → access." />
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
        .card p { margin: 0; opacity: .82; line-height: 1.55; }
        .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .tag { display: inline-flex; align-items: center; height: 28px; padding: 0 10px; border-radius: 999px;
               border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.03); font-size: 12px; opacity: .9; }
        .road { margin-top: 18px; padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.015); }
        .road h2 { margin: 0 0 10px; font-size: 18px; }
        .road ol { margin: 0; padding-left: 18px; }
        .road li { margin: 8px 0; line-height: 1.5; }
        .muted { opacity: .78; margin-top: 10px; }
        @media (max-width: 860px) {
          .title { font-size: 34px; }
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
