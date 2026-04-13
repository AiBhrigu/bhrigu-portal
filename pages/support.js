import Head from "next/head";
import Link from "next/link";

export default function Support() {
  return (
    <>
      <Head>
        <title>Support · BHRIGU</title>
        <meta
          name="description"
          content="Quiet public support for the research, architecture, infrastructure, and public surface of BHRIGU."
        />
        <meta property="og:title" content="Support · BHRIGU" />
        <meta
          property="og:description"
          content="Quiet public support for the research, architecture, infrastructure, and public surface of BHRIGU."
        />
        <meta property="og:url" content="https://www.bhrigu.io/support" />
        <meta name="twitter:title" content="Support · BHRIGU" />
        <meta
          name="twitter:description"
          content="Quiet public support for the research, architecture, infrastructure, and public surface of BHRIGU."
        />
      </Head>

      <main className="wrap" data-support-surface="SUPPORT_SURFACE_V0_1">
        <section className="panel">
          <div className="kicker">Support</div>
          <h1 className="title">Support BHRIGU</h1>
          <p className="role">
            A quiet way to support the research, architecture, infrastructure, and public surface of BHRIGU.
          </p>

          <div className="line">Research · Architecture · Infrastructure · Continuity</div>

          <p className="body">Support helps maintain the public surface and the work behind it.</p>

          <p className="boundary">
            Not reviewed entry, not capital routing, not strategic advisory, not private engine access.
          </p>

          <p className="body">This page exists for quiet public support only.</p>
          <p className="body">It does not unlock deeper layers, faster review, or internal systems.</p>
          <p className="body">No perks, no priority handling, and no hidden program sit behind support.</p>

          <div className="routes">
            <p>
              For reviewed analytical work, go to <Link href="/access">/access</Link>.
            </p>
            <p>
              For capital or partner context, use <Link href="/investors">/investors</Link>.
            </p>
          </div>

          <div className="action" aria-hidden="true">Support the public surface</div>

          <p className="footer">Public support does not alter the system boundary.</p>
        </section>
      </main>

      <style jsx>{`
        .wrap { max-width: 760px; margin: 0 auto; padding: 36px 18px 76px; }
        .panel {
          padding: 22px 20px 24px;
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.018);
        }
        .kicker {
          font-size: 12px;
          letter-spacing: .12em;
          text-transform: uppercase;
          opacity: .72;
          margin-bottom: 10px;
        }
        .title {
          margin: 0 0 12px;
          font-size: 40px;
          line-height: 1.08;
        }
        .role, .body, .footer, .routes p {
          margin: 0 0 12px;
          line-height: 1.6;
          opacity: .88;
        }
        .line {
          margin: 4px 0 14px;
          font-size: 13px;
          letter-spacing: .08em;
          text-transform: uppercase;
          opacity: .78;
        }
        .boundary {
          margin: 14px 0 14px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.08);
          background: rgba(255,255,255,.02);
          line-height: 1.55;
        }
        .routes {
          margin-top: 8px;
          padding-top: 8px;
        }
        .action {
          margin-top: 14px;
          display: inline-flex;
          align-items: center;
          min-height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.02);
          opacity: .88;
        }
        .footer {
          margin-top: 14px;
          opacity: .72;
        }
        @media (max-width: 860px) {
          .title { font-size: 34px; }
        }
      `}</style>
    </>
  );
}
