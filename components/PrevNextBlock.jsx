import { useEffect, useState } from "react";
import Link from "next/link";
import { getPrevNextUp } from "../lib/routeTruth";
import {
  normalizePublicLocale,
  resolvePublicLocale,
  withPublicLocale,
} from "../lib/public-locale-transport";

function getBrowserRoute() {
  if (typeof window === "undefined") return null;
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export default function PrevNextBlock({ route, localeHint = null }) {
  const stableRoute = String(route || "").split("?")[0].split("#")[0];
  const [clientRoute, setClientRoute] = useState(null);

  useEffect(() => {
    const sync = () => setClientRoute(getBrowserRoute());
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, [route]);

  const graphRoute = clientRoute || stableRoute;
  const { prev, next, up } = getPrevNextUp(graphRoute);
  if (!prev && !next && !up) return null;

  const hintedLocale = localeHint === "ru" || localeHint === "en"
    ? normalizePublicLocale(localeHint)
    : "en";
  const locale = clientRoute ? resolvePublicLocale(clientRoute) : hintedLocale;
  const localize = (href) => withPublicLocale(href, locale);

  return (
    <nav data-prevnext="FREY_NAV_SINGLE_V0_4" className="pn" data-pn-root="PORTAL_PREVNEXT_V0_2" data-pn-optical="__FREY_C1_5_3_BOTTOM_NAV_OPTICAL_POLISH_V0_1__" aria-label="Portal navigation">
      <div className="pnInner">
        {prev ? <Link className="pnLink" href={localize(prev)}>Prev</Link> : <span className="pnGhost">Prev</span>}
        {up ? <Link className="pnLink pnUp" href={localize(up)}>Up</Link> : null}
        {next ? <Link className="pnLink" href={localize(next)}>Next</Link> : <span className="pnGhost">Next</span>}
      </div>

      <style jsx>{`
        .pn {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 14px;
          display: flex;
          justify-content: center;
          pointer-events: none;
          z-index: 80;
        }
        .pnInner {
          pointer-events: auto;
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 6px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(10,10,12,0.62);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.24);
        }
        .pnLink {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          color: rgba(255,255,255,0.82);
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.10);
        }
        .pnLink:hover { border-color: rgba(255,255,255,0.16); }
        .pnUp { font-weight: 560; }
        .pnGhost {
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.28);
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.04);
        }
        @media (max-width: 520px) {
          .pnInner { gap: 7px; padding: 8px 9px; }
          .pnLink, .pnGhost { padding: 7px 9px; }
        }
      `}</style>
    </nav>
  );
}
