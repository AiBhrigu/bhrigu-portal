import Head from "next/head";

export default function Frey() {
  return (
    <>
      <Head>
        <title>Frey</title>
      </Head>

      <div
        className="phiPageFrame freyRoot heroScene"
        data-frey-hero="FREY_PHI_CORE_V1"
      >
        <div className="phiMembrane">
          <div className="phiAxis" />
          <div className="phiContent">
            <h1>Frey</h1>
            <p>Epistemic Navigation Layer</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .heroScene {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(
              ellipse at center,
              rgba(200, 160, 80, 0.08) 0%,
              rgba(0, 0, 0, 0.85) 60%,
              #000 100%
            );
        }

        .phiMembrane {
          position: relative;
          width: min(780px, 92vw);
          aspect-ratio: 1.8 / 1;
          border-radius: 50%;
          border: 1px solid rgba(200, 160, 80, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(6px);
        }

        .phiAxis {
          position: absolute;
          width: 1px;
          height: 80%;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(200, 160, 80, 0.4),
            transparent
          );
        }

        .phiContent {
          text-align: center;
          color: #e6d8b4;
        }

        h1 {
          font-weight: 400;
          letter-spacing: 0.08em;
        }

        p {
          margin-top: 0.6rem;
          opacity: 0.6;
          font-size: 0.9rem;
          letter-spacing: 0.12em;
        }
      `}</style>
    </>
  );
}
