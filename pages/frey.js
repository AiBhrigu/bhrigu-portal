import Head from "next/head";

export default function Frey() {
  return (
    <>
      <Head>
        <title>Frey</title>
      </Head>

      <div className="phiScene" data-frey-hero="FREY_PHI_CORE_V4_FOCAL_DEPTH">
        <div className="phiField" />
        <div className="phiMembrane" />
        <div className="phiAxis" />
        <div className="phiContent">
          <h1>Frey</h1>
          <p>Depth Interface</p>
        </div>
      </div>

      <style jsx>{`
        .phiScene {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #040404;
          overflow: hidden;
        }

        .phiField {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse at center,
            rgba(210,170,90,0.035) 0%,
            rgba(210,170,90,0.015) 30%,
            rgba(0,0,0,0.94) 65%,
            #000 100%
          );
          pointer-events: none;
        }

        .phiMembrane {
          position: absolute;
          width: min(900px, 94vw);
          aspect-ratio: 1.618 / 1;
          border-radius: 50%;
          border: 1px solid rgba(210,170,90,0.14);
          animation: phiBreath 18s ease-in-out infinite;
        }

        .phiAxis {
          position: absolute;
          width: 1px;
          height: 75%;
          background: linear-gradient(
            to bottom,
            rgba(210,170,90,0.25),
            rgba(210,170,90,0.18),
            rgba(210,170,90,0.05),
            transparent
          );
        }

        .phiContent {
          position: relative;
          text-align: center;
          color: #e2d5b0;
          z-index: 2;
        }

        h1 {
          font-weight: 400;
          letter-spacing: 0.12em;
          opacity: 0.92;
        }

        p {
          margin-top: 0.8rem;
          font-size: 0.82rem;
          letter-spacing: 0.18em;
          opacity: 0.55;
        }

        @keyframes phiBreath {
          0%   { transform: scale(1); opacity: 0.96; }
          50%  { transform: scale(1.006); opacity: 1; }
          100% { transform: scale(1); opacity: 0.96; }
        }
      `}</style>
    </>
  );
}
