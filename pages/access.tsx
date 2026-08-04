import Head from "next/head";
import Link from "next/link";

export default function AccessPage() {
  return (
    <>
      <Head>
        <title>Access · Guided AI Analysis · BHRIGU</title>
        <meta
          name="description"
          content="Guided entry into deep AI analysis under the Φ-contour."
        />
      </Head>

      <main className="accessPage">
        <div className="shell">
          <section className="heroFrame" data-access-section="hero">
            <div className="heroEyebrow">Structured Access</div>

            <div className="heroSplit">
              <div className="heroColumn">
                <h1 className="heroTitle">A guided entry into deep AI analysis</h1>
                <p className="heroText">
                  Access is the reviewed entry surface for serious requests that need stronger
                  context, temporal precision, and deeper analytical work.
                </p>
              </div>

              <div className="heroRail">
                <div className="heroCard">
                  <span className="heroCardLabel">Role model</span>
                  <span className="heroCardValue">
                    Operator-held contour. AI-performed core work.
                  </span>
                  <p className="heroCardText">
                    The operator protects entry quality and process integrity. The analytical core
                    remains inside the AI contour.
                  </p>
                </div>

                <div className="heroCard">
                  <span className="heroCardLabel">Best fit</span>
                  <span className="heroCardValue">
                    Requests where dates, events, context, and framing matter.
                  </span>
                  <p className="heroCardText">
                    Access is designed for requests that should become structured analytical
                    objects rather than casual prompts.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="panel stack" data-access-section="entry-model">
            <p className="sectionTitle">Entry model</p>
            <div className="introGrid">
              <div className="introCard">
                <span className="introCardTitle">Frey</span>
                <p className="introCardBody">
                  Public launch surface for orientation, first contact, and early exploration.
                </p>
              </div>

              <div className="introCard">
                <span className="introCardTitle">Access</span>
                <p className="introCardBody">
                  Guided entry layer for reviewed deep work where the request must be shaped
                  carefully before analysis begins.
                </p>
              </div>

              <div className="introCard">
                <span className="introCardTitle">Process</span>
                <p className="introCardBody">
                  Secure intake, private operator retrieval, and delivery integrity must be proven
                  before reviewed requests reopen.
                </p>
              </div>
            </div>

            <p className="tiny">
              The informational architecture remains available while the private intake path is
              repaired and independently verified.
            </p>
          </section>

          <section
            className="panel stack"
            data-access-section="crypto-astro-research"
            aria-labelledby="crypto-astro-research-surface"
          >
            <p className="sectionTitle" id="crypto-astro-research-surface">
              Crypto-Astro Research Surface
            </p>
            <p className="muted">
              Crypto-Astro remains available as a public-safe, source-bound research surface. It
              provides a verified static market snapshot, visible source proof, accepted change
              memory, and the BTC Field Read corridor.
            </p>
            <p className="muted">
              This is not a live trading product, prediction service, automated crypto system,
              backend service, or financial-advice route.
            </p>

            <div className="actions">
              <a
                className="btnSecondary"
                href="https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/index.html"
                rel="noopener noreferrer"
                target="_blank"
              >
                Open Crypto-Astro proof route
              </a>
              <Link className="btnSecondary" href="/crypto-astro/btc">
                Run BTC Field Read
              </Link>
            </div>

            <div className="accessBridgeNote" data-crypto-astro-proof-base="btc-eth-sol">
              <div className="eyebrow">Public proof boundary</div>
              <div>
                The public BTC corridor remains live and verified. Reviewed private delivery is not
                available through this page during containment.
              </div>
              <div>
                Do not send personal, confidential, wallet, exchange, or account information through
                public research surfaces.
              </div>
            </div>
          </section>

          <section className="panel stack" data-access-section="sample">
            <p className="sectionTitle">Reading sample</p>
            <p className="muted">
              The existing one-page sample remains available as a public explanation of the
              structural reading format.
            </p>
            <div className="actions">
              <a
                className="btnSecondary"
                href="/access-private-structural-reading-sample-v0-1.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                View sample PDF
              </a>
              <Link className="btnGhost" href="/frey">
                Open Frey first
              </Link>
            </div>
          </section>

          <section
            className="panel stack containmentPanel"
            data-access-section="intake-closed"
            data-access-intake-status="temporarily-closed"
            aria-labelledby="access-intake-closed-title"
          >
            <p className="sectionTitle">Reviewed intake status</p>
            <h2 className="formTitle" id="access-intake-closed-title">
              Reviewed requests are temporarily closed
            </h2>
            <p className="formLead">
              Reviewed requests are temporarily closed while secure private intake is being upgraded
              and verified. This page does not accept, retain, or transmit request details.
            </p>
            <p className="muted">
              The closure is fail-closed: no public submission action, no public operator review,
              and no temporary filesystem persistence are active.
            </p>

            <div className="actions">
              <button
                type="button"
                className="btnDisabled"
                disabled
                aria-disabled="true"
                data-access-submit-disabled="true"
              >
                Reviewed intake unavailable
              </button>
            </div>

            <p className="tiny">
              The public Access explanation remains visible. The private request path will reopen
              only after durable storage, private retrieval, delivery, and idempotency are proven on
              the current production architecture.
            </p>
          </section>

          <section
            className="clarityPanel"
            data-access-section="clarity-infographic"
            data-access-clarity-infographic="deeptech_v0_2"
            aria-label="Private Structural Reading clarity infographic"
          >
            <img
              src="/access-clarity-infographic-deeptech-v0-2.png"
              alt="Private Structural Reading access clarity infographic: what to send, what happens next, what you receive, and what this is not."
            />
          </section>
        </div>

        <style jsx>{`
          .accessPage {
            min-height: 100vh;
            overflow-x: clip;
            padding: 32px 18px 64px;
            background:
              radial-gradient(circle at top, rgba(255, 255, 255, 0.06), transparent 32%),
              linear-gradient(180deg, #07111b 0%, #091522 100%);
            color: #eaf1f7;
          }

          .shell {
            width: 100%;
            max-width: 980px;
            min-width: 0;
            margin: 0 auto;
            padding: 14px 0 40px;
            box-sizing: border-box;
          }

          .heroFrame,
          .panel,
          .clarityPanel {
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }

          .heroFrame {
            display: grid;
            gap: 24px;
            padding: 28px;
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 24px;
            background:
              radial-gradient(circle at top left, rgba(216, 173, 98, 0.1), transparent 34%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.025));
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.24);
          }

          .heroEyebrow,
          .sectionTitle,
          .heroCardLabel,
          .eyebrow {
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          .heroEyebrow,
          .eyebrow {
            color: #d8ad62;
          }

          .sectionTitle,
          .heroCardLabel {
            margin: 0;
            color: rgba(234, 241, 247, 0.58);
          }

          .heroSplit {
            display: grid;
            grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
            gap: 24px;
            align-items: start;
          }

          .heroColumn,
          .heroRail,
          .stack,
          .introCard,
          .accessBridgeNote {
            display: grid;
            min-width: 0;
          }

          .heroColumn {
            gap: 16px;
          }

          .heroRail {
            gap: 14px;
          }

          .heroTitle {
            max-width: 720px;
            margin: 0;
            font-size: clamp(38px, 5vw, 58px);
            line-height: 0.98;
            letter-spacing: -0.058em;
            overflow-wrap: anywhere;
          }

          .heroText,
          .muted,
          .formLead,
          .heroCardText,
          .introCardBody,
          .tiny {
            margin: 0;
            overflow-wrap: anywhere;
          }

          .heroText {
            max-width: 700px;
            font-size: 17px;
            line-height: 1.74;
            color: rgba(234, 241, 247, 0.76);
          }

          .heroCard,
          .introCard {
            min-width: 0;
            padding: 18px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.035);
          }

          .heroCard {
            display: grid;
            gap: 9px;
          }

          .heroCardValue,
          .introCardTitle {
            color: #f5f8fc;
            font-weight: 700;
          }

          .heroCardText,
          .introCardBody {
            font-size: 13px;
            line-height: 1.62;
            color: rgba(234, 241, 247, 0.7);
          }

          .panel {
            margin-top: 18px;
            padding: 28px;
            border: 1px solid rgba(255, 255, 255, 0.14);
            border-radius: 22px;
            background:
              radial-gradient(circle at top left, rgba(255, 255, 255, 0.065), transparent 34%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.03));
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
          }

          .stack {
            gap: 22px;
          }

          .introGrid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 18px;
            min-width: 0;
          }

          .introCard {
            gap: 10px;
          }

          .muted {
            color: rgba(234, 241, 247, 0.72);
            line-height: 1.68;
          }

          .tiny {
            font-size: 12px;
            line-height: 1.58;
            color: rgba(234, 241, 247, 0.6);
          }

          .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            align-items: center;
          }

          .btnSecondary,
          .btnGhost,
          .btnDisabled {
            min-height: 50px;
            max-width: 100%;
            box-sizing: border-box;
            border-radius: 999px;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: 0.02em;
            text-align: center;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            overflow-wrap: anywhere;
          }

          .btnSecondary {
            border: 1px solid rgba(255, 255, 255, 0.15);
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.08),
              rgba(255, 255, 255, 0.045)
            );
            color: #eef4f9;
          }

          .btnGhost {
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(255, 255, 255, 0.03);
            color: rgba(234, 241, 247, 0.82);
          }

          .btnDisabled {
            cursor: not-allowed;
            border: 1px solid rgba(216, 173, 98, 0.24);
            background: rgba(216, 173, 98, 0.08);
            color: rgba(234, 241, 247, 0.58);
            opacity: 1;
          }

          .accessBridgeNote {
            gap: 10px;
            padding: 18px 20px;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.055),
              rgba(255, 255, 255, 0.028)
            );
            color: rgba(234, 241, 247, 0.78);
            font-size: 13px;
            line-height: 1.62;
          }

          .containmentPanel {
            border-color: rgba(216, 173, 98, 0.3);
            background:
              radial-gradient(circle at top left, rgba(216, 173, 98, 0.12), transparent 38%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.028));
          }

          .formTitle {
            max-width: 760px;
            margin: 0;
            font-size: clamp(28px, 4vw, 42px);
            line-height: 1.03;
            letter-spacing: -0.045em;
            overflow-wrap: anywhere;
          }

          .formLead {
            max-width: 760px;
            font-size: 16px;
            line-height: 1.74;
            color: rgba(234, 241, 247, 0.8);
          }

          .clarityPanel {
            margin-top: 32px;
            overflow: hidden;
            border: 1px solid rgba(230, 196, 120, 0.22);
            border-radius: 24px;
            background: rgba(7, 10, 18, 0.72);
            box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
          }

          .clarityPanel img {
            display: block;
            width: 100%;
            max-width: 100%;
            height: auto;
          }

          @media (max-width: 760px) {
            .accessPage {
              padding: 22px 14px 42px;
            }

            .heroFrame,
            .panel {
              padding: 20px;
              border-radius: 18px;
            }

            .heroSplit,
            .introGrid {
              grid-template-columns: 1fr;
            }

            .heroTitle {
              font-size: clamp(36px, 12vw, 48px);
            }

            .actions {
              flex-direction: column;
              align-items: stretch;
            }

            .btnSecondary,
            .btnGhost,
            .btnDisabled {
              width: 100%;
            }
          }
        `}</style>
      </main>
    </>
  );
}
