import Link from "next/link";

export default function Investors() {
  return (
    <main className="page" data-mark="INVESTORS_SURFACE_V0_1">
      <span aria-hidden="true" style={{ display: "none" }} data-mark="IA" />
      <div className="hero">
        <div className="kicker">Investors &amp; Partners</div>
        <h1>BHRIGU × Frey</h1>
        <p className="sub">
          Cosmographer-grade guidance with an AI interface layer. Public surface is UI-only. Access is invite-based.
        </p>

        <div className="highlights">
          <div><b>Shipped:</b> stable public surfaces + invite-based access loop</div>
          <div><b>Next:</b> engine integration behind gates + trust + observability</div>
          <div><b>Partners:</b> pilots, strategic integrations, and service contracts</div>
        </div>

        <div className="ctaRow">
          <a className="btn primary" href="/access">Request invite</a>
          <a className="btn secondary" href="mailto:aibhrigu@gmail.com?subject=BHRIGU%20Partner%20%2F%20Investor%20%E2%80%94%20intro">Partner intro</a>
        </div>

        <div className="marker" style={{display:"none"}}>__ </div>
      </div>

      <section className="section" data-mark="INVESTORS_SURFACE_V0_1">
        <h2>What it is</h2>
        <p>
          BHRIGU is a cosmography-first product surface. Frey is the interface layer that turns structured meaning into guided,
          high-trust interaction flows. We ship surfaces first, then expand capability behind gates.
        </p>
        <div className="grid3">
          <div><b>Cosmographer layer</b><div className="muted">structured meaning, maps, narratives</div></div>
          <div><b>Frey interface</b><div className="muted">query → guided route → controlled response loop</div></div>
          <div><b>Access model</b><div className="muted">invite-based pilots with explicit boundaries</div></div>
        </div>
      </section>

      <section className="section">
        <h2>Shipped (S0)</h2>
        <ul>
          <li>/frey — public UI-only surface</li>
          <li><a href="/access">/access</a> — invite-based entry (manual onboarding)</li>
          <li>Production posture: minimal exposure, stability-first, controlled rollout</li>
          <li>L0 loop: gated response contour for approved users</li>
        </ul>
      </section>

      <section className="section">
        <h2>Next (S1–S4)</h2>
        <h3>S1 — Engine integration (private)</h3>
        <ul>
          <li>private coupling behind gates</li>
          <li>deterministic guardrails + safe defaults</li>
          <li>internal evaluation harness</li>
        </ul>

        <h3>S2 — Trust gates</h3>
        <ul>
          <li>tiered access + invite policy</li>
          <li>abuse prevention + rate limits</li>
          <li>safe failure modes</li>
        </ul>

        <h3>S3 — Observability</h3>
        <ul>
          <li>high-level traceability of decisions</li>
          <li>reliability monitoring (uptime, errors, tail latency)</li>
          <li>audit-friendly event logs (without sensitive disclosure)</li>
        </ul>

        <h3>S4 — IP &amp; epistemic shield</h3>
        <ul>
          <li>strict separation: public UI vs private capability</li>
          <li>leakage prevention posture</li>
          <li>partner-safe interface contracts</li>
        </ul>
      </section>

      <section className="section">
        <h2>Moat</h2>
        <ul>
          <li>proprietary engine (patent-boundary posture)</li>
          <li>public presence stays surface-only by design</li>
          <li>controlled pilots via invite-based access</li>
          <li>system-grade meaning layer (not “just prompts”)</li>
        </ul>
      </section>

      <section className="section">
        <h2>Signals (now) + Metrics (next)</h2>
        <h3>Now</h3>
        <ul>
          <li>live surfaces in production</li>
          <li>invite-based access loop functioning</li>
          <li>capability exposure intentionally kept closed</li>
        </ul>
        <h3>Metrics we track next</h3>
        <ul>
          <li>invite requests → accepted → activated conversion</li>
          <li>time-to-first-useful outcome (TTFU) for approved users</li>
          <li>retention by cohort (7/30 days)</li>
          <li>reliability: uptime, error rate, tail latency</li>
          <li>abuse attempts blocked (count + class, no operational details)</li>
        </ul>
      </section>

      <section className="section">
        <h2>The ask</h2>
        <p>We’re raising / partnering to accelerate gated rollout without widening public exposure.</p>
        <h3>Formats</h3>
        <ul>
          <li><b>Grant / research support</b> — evaluation + safety + instrumentation</li>
          <li><b>Strategic partner</b> — invite-based pilots + distribution + domain access</li>
          <li><b>Service contract</b> — paid pilots, integration, custom surfaces</li>
        </ul>
        <div className="callout">
          <div><b>Runway</b></div>
          <div className="muted">target runway: <b></b> · budget: <b></b> (team, infra, evaluation, operations, legal/IP)</div>
        </div>
      </section>

      <section className="section">
        <h2>Terms &amp; boundaries</h2>
        <h3>We do NOT provide</h3>
        <ul>
          <li>engine internals, formulas, or architecture disclosure</li>
          <li>unrestricted public access</li>
          <li>open demos exposing the capability loop</li>
        </ul>
        <h3>We CAN provide</h3>
        <ul>
          <li>invite-based pilots for approved partners</li>
          <li>private evaluation access under clear boundaries</li>
          <li>surface integrations (UI + controlled flows)</li>
          <li>paid service contracts with defined interfaces</li>
        </ul>
        <p className="muted"><b>Boundary:</b> We partner on outcomes, not on extracting the engine.</p>
      </section>

      <section className="section">
        <h2>Contact</h2>
        <div className="grid2">
          <div>
            <div className="muted">Email</div>
            <div><a href="mailto:aibhrigu@gmail.com">aibhrigu@gmail.com</a></div>
          </div>
          <div>
            <div className="muted">Suggested subject</div>
            <div><code>BHRIGU Partner / Investor — intro</code></div>
          </div>
        </div>

        <div className="muted" style={{ marginTop: 12 }}>Include:</div>
        <ul>
          <li>who you are</li>
          <li>why BHRIGU</li>
          <li>what pilot you want</li>
          <li>timeframe + constraints</li>
        </ul>

        <div className="ctaRow" style={{ marginTop: 12 }}>
          <a className="btn primary" href="/access">Request invite</a>
          <a className="btn secondary" href="mailto:aibhrigu@gmail.com?subject=BHRIGU%20Partner%20%2F%20Investor%20%E2%80%94%20intro">Partner intro</a>
        </div>
      </section>

      <div className="footerNav">
        /start
        <span>·</span>
        /cosmographer
        <span>·</span>
        /frey
      </div>

      <style jsx>{`
        .page { max-width: 980px; margin: 0 auto; padding: 28px 20px 48px; }
        .hero { padding: 18px 0 10px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .kicker { letter-spacing: 0.16em; text-transform: uppercase; font-size: 12px; opacity: 0.7; }
        h1 { font-size: 42px; margin: 10px 0 8px; }
        .sub { font-size: 16px; opacity: 0.78; margin: 0 0 14px; max-width: 56ch; }
        .highlights { display: grid; gap: 8px; margin: 14px 0 16px; }
        .highlights b { font-weight: 650; }
        .ctaRow { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0 0; }
        .btn { border-radius: 12px; padding: 10px 14px; text-decoration: none; border: 1px solid rgba(255,255,255,0.14); }
        .primary { background: rgba(255,255,255,0.10); }
        .secondary { background: rgba(255,255,255,0.06); }
        .ghost { background: transparent; opacity: 0.9; }
        .section { padding: 22px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .section h2 { margin: 0 0 10px; font-size: 18px; letter-spacing: 0.02em; }
        .section h3 { margin: 14px 0 6px; font-size: 14px; opacity: 0.9; }
        ul { margin: 8px 0 0; padding-left: 18px; }
        li { margin: 6px 0; }
        .muted { opacity: 0.72; }
        .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
        .grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px; }
        .callout { margin-top: 12px; padding: 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.10); background: rgba(0,0,0,0.18); }
        .marker { margin-top: 10px; font-size: 12px; opacity: 0.55; }
        .footerNav { display: flex; gap: 10px; justify-content: center; align-items: center; margin-top: 18px; opacity: 0.8; font-size: 12px; }
        .footerNav a { text-decoration: none; }
        @media (max-width: 820px){
          h1 { font-size: 34px; }
          .grid3 { grid-template-columns: 1fr; }
          .grid2 { grid-template-columns: 1fr; }
        }
      `}</style>
          {/*  */}
</main>
  );
}
