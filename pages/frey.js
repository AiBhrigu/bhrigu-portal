import Head from "next/head";

export default function Frey() {
  return (
    <>
      <Head>
        <title>Frey</title>
      </Head>

      <div className="phiScene" data-frey-hero="FREY_PHI_CORE_V3_CONTROLLED_FIELD">
        <div className="phiField" />
        <div className="phiMembrane" />
        <div className="phiAxis" />
        <div className="phiContent">
          <h1>Frey</h1>
          <p>Epistemic Navigation Layer</p>
        </div>
      </div>

      <style jsx>{`
        .phiScene {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #050505;
          overflow: hidden;
        }

        .phiField {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse at center,
            rgba(210,170,90,0.04) 0%,
            rgba(210,170,90,0.02) 35%,
            rgba(0,0,0,0.92) 70%,
            #000 100%
          );
          pointer-events: none;
        }

        .phiMembrane {
          position: absolute;
          width: min(860px, 92vw);
          aspect-ratio: 1.618 / 1;
          border-radius: 50%;
          border: 1px solid rgba(210,170,90,0.18);
          animation: phiBreath 16s ease-in-out infinite;
        }

        .phiAxis {
          position: absolute;
          width: 1px;
          height: 72%;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(210,170,90,0.35),
            transparent
          );
        }

        .phiContent {
          position: relative;
          text-align: center;
          color: #e7d9b5;
          z-index: 2;
        }

        h1 {
          font-weight: 400;
          letter-spacing: 0.1em;
        }

        p {
          margin-top: 0.7rem;
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          opacity: 0.6;
        }

        @keyframes phiBreath {
          0%   { transform: scale(1); opacity: 0.95; }
          50%  { transform: scale(1.008); opacity: 1; }
          100% { transform: scale(1); opacity: 0.95; }
        }
      `}</style>
    </>
  );
}
