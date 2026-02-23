import Head from "next/head";

export default function Frey() {
  return (
    <>
      <Head>
        <title>Frey</title>
      </Head>

      <div className="phiScene" data-frey-hero="FREY_PHI_CORE_V2_BREATH">
        <div className="phiDepth" />
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

        .phiDepth {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse at center,
            rgba(210,170,90,0.06) 0%,
            rgba(0,0,0,0.85) 65%,
            #000 100%
          );
        }

        .phiMembrane {
          position: absolute;
          width: min(820px, 90vw);
          aspect-ratio: 1.618 / 1;
          border-radius: 50%;
          border: 1px solid rgba(210,170,90,0.22);
          animation: phiBreath 14s ease-in-out infinite;
        }

        .phiAxis {
          position: absolute;
          width: 1px;
          height: 70%;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(210,170,90,0.45),
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
          0%   { transform: scale(1); opacity: 0.9; }
          50%  { transform: scale(1.015); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
      `}</style>
    </>
  );
}
