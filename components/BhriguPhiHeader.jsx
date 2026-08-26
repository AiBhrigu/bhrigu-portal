import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  normalizePublicLocale,
  resolvePublicLocale,
  switchPublicLocale,
  withPublicLocale,
} from "../lib/public-locale-transport";

function getBrowserRoute() {
  if (typeof window === "undefined") return null;
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export default function BhriguPhiHeader({ localeHint = null }) {
  const router = useRouter();
  const stablePath = String(router.pathname || "/");
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
  }, [router.asPath]);

  const activeRoute = clientRoute || stablePath;
  const path = activeRoute.split("?")[0].split("#")[0];
  const home = path === "/";
  const btc = path.startsWith("/crypto-astro/btc");
  const hintedLocale = localeHint === "ru" || localeHint === "en"
    ? normalizePublicLocale(localeHint)
    : "en";
  const locale = clientRoute ? resolvePublicLocale(clientRoute) : hintedLocale;
  const ru = locale === "ru";
  const targetLocale = ru ? "en" : "ru";
  const languageHref = switchPublicLocale(activeRoute, targetLocale);
  const homeHref = withPublicLocale("/", locale);
  const freyHref = withPublicLocale("/frey", locale);
  const orionHref = withPublicLocale("/orion", locale);
  const btcHref = withPublicLocale("/crypto-astro/btc", locale);

  const handleLanguageSwitch = (event) => {
    const currentBrowserRoute = getBrowserRoute();
    if (!currentBrowserRoute) return;
    event.preventDefault();
    window.location.assign(switchPublicLocale(currentBrowserRoute, targetLocale));
  };

  return (
    <header
      className={`bh-header${home ? " bh-header-home" : ""}${btc ? " bh-header-btc" : ""}`}
      data-hdr={home
        ? "BHRIGU_PUBLIC_HOME_HEADER_V0_1"
        : btc
? "BHRIGU_BTC_FIELD_HEADER_V0_1"
: "HDR_CANON_GOLDENPATH_V0_1 HDR_LOGO_GUTTER_ALIGN_V0_5 HDR_PLAQUE_PREMIUM_V0_3"}
      data-ops="OPS_MARKERS_DATA_ATTRS_V0_2"
    >
      <div className="bh-shell">
        <a className="bh-brand" href={homeHref} aria-label="BHRIGU home">
{home ? (
  <span className="bh-word">BHRIGU</span>
) : (
  <span className="bh-plaque">
    <span className="bh-word">BHRIGU</span>
    <span className="bh-sub" />
  </span>
)}
        </a>
        <nav className="bh-ctas" aria-label="Primary navigation">
{home || btc ? (
  <>
    {btc && <a className="bh-btc-route" href={btcHref}>BTC Field</a>}
    <a
      className="bh-language"
      href={languageHref}
      onClick={handleLanguageSwitch}
      aria-label={ru ? "Открыть страницу на английском" : "View this page in Russian"}
    >
      {ru ? "EN" : "RU"}
    </a>
  </>
) : (
  <>
    <a className="bh-btn bh-btn-primary" href={freyHref} data-bh="FREY_CTA_PRIMARY_V0_6">Open Frey</a>
    <a className="bh-btn" href={orionHref}>ORION</a>
    <a
      className="bh-language"
      href={languageHref}
      onClick={handleLanguageSwitch}
      aria-label={ru ? "Открыть страницу на английском" : "View this page in Russian"}
    >
      {ru ? "EN" : "RU"}
    </a>
  </>
)}
        </nav>
      </div>
      <style jsx>{`
        .bh-header {
position: sticky;
top: 0;
z-index: 60;
width: 100%;
padding: 0;
border-bottom: 1px solid rgba(255,255,255,0.09);
background: rgba(6,7,10,0.9);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
        }
        .bh-shell {
width: 100%;
max-width: 1120px;
margin: 0 auto;
padding: 14px 18px;
display: flex;
align-items: center;
justify-content: space-between;
gap: 20px;
        }
        .bh-brand,
        .bh-btn,
        .bh-language,
        .bh-btc-route {
text-decoration: none !important;
        }
        .bh-brand {
display: inline-flex;
align-items: center;
gap: 10px;
color: rgba(255,255,255,0.92) !important;
        }
        .bh-plaque {
display: inline-flex;
align-items: center;
gap: 10px;
padding: 10px 12px;
border: 1px solid rgba(233,189,93,0.22);
border-radius: 14px;
background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03));
box-shadow: 0 10px 28px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.10);
backdrop-filter: blur(8px);
        }
        .bh-word {
position: relative;
top: -1px;
color: inherit;
font-size: 12px;
font-weight: 600;
letter-spacing: 0.24em;
line-height: 1;
        }
        .bh-sub {
font-size: 11px;
letter-spacing: 0.08em;
color: rgba(255,255,255,0.55);
line-height: 1;
white-space: nowrap;
        }
        .bh-sub:empty {
display: none;
        }
        .bh-ctas {
display: inline-flex;
align-items: center;
gap: 10px;
        }
        .bh-btn,
        .bh-language,
        .bh-btc-route {
display: inline-flex;
align-items: center;
justify-content: center;
min-height: 38px;
padding: 0 14px;
border: 1px solid rgba(255,255,255,0.13);
border-radius: 999px;
color: rgba(255,255,255,0.72) !important;
background: rgba(255,255,255,0.025);
font-size: 10px;
font-weight: 650;
letter-spacing: 0.12em;
text-transform: uppercase;
        }
        .bh-language {
min-width: 40px;
padding: 0 10px;
        }
        .bh-btc-route {
border-color: rgba(222,194,125,0.38);
color: #dec27d !important;
        }
        .bh-btn-primary {
border-color: rgba(255,255,255,0.4);
color: rgba(8,8,10,0.95) !important;
background: rgba(255,255,255,0.92);
        }
        .bh-header-home .bh-shell {
max-width: 1180px;
min-height: 68px;
padding: 0 32px;
        }
        .bh-header-home .bh-brand,
        .bh-header-btc .bh-brand {
color: #dec27d !important;
        }
        .bh-header-home .bh-word {
position: static;
font-weight: 700;
letter-spacing: 0.31em;
        }
        .bh-header-home .bh-language {
border-radius: 0;
        }
        .bh-btn:hover,
        .bh-language:hover,
        .bh-btc-route:hover {
border-color: rgba(255,255,255,0.26);
text-decoration: none !important;
        }
        @media (max-width: 620px) {
.bh-header-home .bh-shell {
  min-height: 62px;
  padding: 0 18px;
}
.bh-header-home .bh-word {
  font-size: 11px;
}
.bh-btn,
.bh-btc-route {
  min-height: 36px;
  padding: 0 10px;
  font-size: 9px;
}
        }
      `}</style>
    </header>
  );
}
