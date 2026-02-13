import Link from "next/link";
import { getPrevNextUp } from "../lib/routeTruth";

export default function PrevNextBlock({ route }) {
  const { prev, next, up } = getPrevNextUp(route);
  if (!prev && !next && !up) return null;

  return (
    <nav className="pn" aria-label="Prev / Next" data-pn-root="PORTAL_PREVNEXT_V0_1">
      <div className="pnRow">
        {prev ? (
          <Link className="pnBtn" href={prev} data-pn="prev">
            Prev
          </Link>
        ) : (
          <span />
        )}

        {up ? (
          <Link className="pnBtn pnBtnGhost" href={up} data-pn="up">
            Up
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link className="pnBtn" href={next} data-pn="next">
            Next
          </Link>
        ) : (
          <span />
        )}
      </div>

      <style jsx>{`
        .pn {
          margin-top: 28px;
          padding-top: 18px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .pnRow {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          align-items: center;
        }
        .pnBtn {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          height: 38px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: inherit;
          text-decoration: none;
          font-size: 14px;
          line-height: 1;
          user-select: none;
        }
        .pnBtn:hover {
          background: rgba(255, 255, 255, 0.09);
        }
        .pnBtnGhost {
          background: transparent;
        }
      `}</style>
    </nav>
  );
}
