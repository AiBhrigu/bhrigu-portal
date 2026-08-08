import "../styles/globals.css";
import Head from "next/head";
import { useRouter } from "next/router";
import PrevNextBlock from "../components/PrevNextBlock";

import BhriguPhiHeader from "../components/BhriguPhiHeader"; // ATOM_BHRIGU_PORTAL_UX_UNIFY_V1
import BtcFreeCorridorSurfaceAdapter from "../components/btc/BtcFreeCorridorSurfaceAdapter";

// ATOM_BHRIGU_PORTAL_SEO_SURFACE_V4
const BASE_URL = "https://www.bhrigu.io";

const ROUTE_META = {
  "/": {
    "title": "Market Cosmographer · AI Market Intelligence | BHRIGU",
    "desc": "Verified market data, field context and explicit forward conditions combined into one evidence-linked read — starting with Bitcoin."
  },
  "/start": {
    "title": "Start · BHRIGU",
    "desc": "Start here: what to read first, how Frey is constrained, and what support unlocks the next layer."
  },
  "/services": {
    "title": "Services · BHRIGU",
    "desc": "What exists today: a stable portal surface, Frey-facing interfaces, and structured research presentation."
  },
  "/reading": {
    "title": "Reading · BHRIGU",
    "desc": "Reading layer: curated pages, definitions, and entry points to understand the surface without noise."
  },
  "/signal": {
    "title": "Signal · BHRIGU",
    "desc": "Signal layer: how we talk about observations without hype — constraints, proof, and clean language."
  },
  "/map": {
    "title": "Map · BHRIGU",
    "desc": "Map layer: navigation across the public surface outputs — routes, layers, and structure."
  },
  "/cosmography": {
    "title": "Cosmography · BHRIGU",
    "desc": "Cosmography: boundaries, terms, and what we mean by structure — surface-first, internals sealed."
  },
  "/orion": {
    "title": "ORION · BHRIGU",
    "desc": "ORION engine overview: scope, boundaries, and the public-facing surface layer."
  },
  "/frey": {
    "title": "Frey · BHRIGU",
    "desc": "Frey: a dialog interface for cosmography — query-first navigation across time, cycles, and scenarios (surface-only)."
  },
  "/faq": {
    "title": "FAQ · BHRIGU",
    "desc": "FAQ: what this is, what it is not, and why constraints and boundaries matter."
  },
  "/dao": {
    "title": "DAO · BHRIGU",
    "desc": "DAO layer: access, support, and public governance surface (high-level)."
  },
  "/access": {
    "title": "Access · BHRIGU",
    "desc": "Access: how to enter the surface safely, where API is disabled, and what is intentionally restricted."
  },
  "/chronicle": {
    "title": "Chronicle · BHRIGU",
    "desc": "Chronicle: evolution of the system — milestones, releases, and surface changes over time."
  },
  "/github": {
    "title": "GitHub · BHRIGU",
    "desc": "Open repositories and public artifacts — links, status, and surface documentation."
  },
  "/archive": {
    "title": "Archive · BHRIGU",
    "desc": "Archive: preserved snapshots, milestone references, and stable surface artifacts."
  },
  "/crypto-astro/btc": {
    "title": "BTC Field · Evidence-Linked Bitcoin Intelligence | BHRIGU",
    "desc": "Market Cosmographer's first public corridor for Bitcoin investors and researchers: current BTC state, accepted change memory, sources, and explicit conditions."
  },
  "/crypto-astro/btc/live": {
    "title": "BTC Field Dialogue · Market Cosmographer | BHRIGU",
    "desc": "A bounded analytical dialogue about Bitcoin protocol, BTC market state, Snapshot memory, astronomical data, and evidence boundaries."
  }
};

function normalizePath(asPath) {
  if (!asPath) return "/";
  const noHash = asPath.split("#")[0];
  const noQuery = noHash.split("?")[0];
  return noQuery || "/";
}

function buildCanonical(pathname) {
  const p = pathname === "/" ? "/" : pathname;
  return `${BASE_URL}${p}`;
}

function getMeta(pathname) {
  const hit = ROUTE_META[pathname] || null;
  const title = (hit && hit.title) ? hit.title : "BHRIGU";
  const desc  = (hit && hit.desc)  ? hit.desc  : "BHRIGU public product and research surfaces.";
  const canonical = buildCanonical(pathname);
  return { title, desc, canonical };
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const path = normalizePath(router?.asPath || router?.pathname || '/');
  const meta = getMeta(path);
  const rawLang = Array.isArray(router?.query?.lang) ? router.query.lang[0] : router?.query?.lang;
  const lang = rawLang === "ru" ? "ru" : "en";
  const isBtc = path === "/crypto-astro/btc" || path === "/crypto-astro/btc/live";
  const canonicalPath = path === "/crypto-astro/btc/live" ? "/crypto-astro/btc" : path;
  const canonical = 'https://www.bhrigu.io' + (canonicalPath === '/' ? '/' : canonicalPath) + (isBtc ? `?lang=${lang}` : "");

  return (
    <>
      <Head>
        <link rel="canonical" href={canonical} key="canonical" />
      {isBtc && <link rel="alternate" hrefLang="en" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>}
      {isBtc && <link rel="alternate" hrefLang="ru" href="https://www.bhrigu.io/crypto-astro/btc?lang=ru"/>}
      {isBtc && <link rel="alternate" hrefLang="x-default" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>}
      {path === "/crypto-astro/btc/live" && <meta name="robots" content="noindex,follow"/>}

      <title>{meta.title}</title>
        <meta name="description" content={meta.desc} />
<meta property="og:type" content="website" />
        <meta key="og:title" property="og:title" content={meta.title} />
        <meta key="og:description" property="og:description" content={meta.desc} />
        <meta key="og:url" property="og:url" content={canonical} />

        <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
        <meta key="twitter:title" name="twitter:title" content={meta.title} />
        <meta key="twitter:description" name="twitter:description" content={meta.desc} />
      </Head>

      <BhriguPhiHeader />
      <Component {...pageProps} />
      <BtcFreeCorridorSurfaceAdapter />
      {path !== "/" ? <PrevNextBlock route={router.asPath} /> : null}
    </>
  );
}
