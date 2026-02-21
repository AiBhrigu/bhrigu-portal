import Link from "next/link";
import { getPrevNextUp } from "../lib/routeTruth";

export default function PrevNextBlock({ route }) {
  const { prev, next, up } = getPrevNextUp(route || "");
  if (!prev && !next && !up) return null;

  return (
    <nav data-prevnext="FREY_NAV_SINGLE_V0_2" className="pn" data-pn-root="PORTAL_PREVNEXT_V0_2" aria-label="Portal navigation">
      <div className="pnInner">
        {prev ? <Link className="pnLink" href={prev}>Prev</Link> : <span className="pnGhost">Prev</span>}
        {up ? <Link className="pnLink pnUp" href={up}>Up</Link> : null}
        {next ? <Link className="pnLink" href={next}>Next</Link> : <span className="pnGhost">Next</span>}
      </div>

      <style jsx>{`
        .pn {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 12px;
          display: flex;
          justify-content: center;
          pointer-events: none;
          z-index: 80;
        }
        .pnInner {
          pointer-events: auto;
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(10,10,12,0.72);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.35);
        }
        .pnLink {
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          color: rgba(255,255,255,0.88);
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.10);
        }
        .pnLink:hover { border-color: rgba(255,255,255,0.22); }
        .pnUp { font-weight: 600; }
        .pnGhost {
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        @media (max-width: 520px) {
          .pnInner { gap: 8px; padding: 9px 10px; }
          .pnLink, .pnGhost { padding: 7px 9px; }
        }
      `}</style>
    </nav>
  );
}
