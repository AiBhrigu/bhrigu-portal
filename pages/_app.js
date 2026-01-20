import "../styles/globals.css";
import Head from "next/head";
import { useRouter } from "next/router";

import BhriguPhiHeader from "../components/BhriguPhiHeader"; // ATOM_BHRIGU_PORTAL_UX_UNIFY_V1

// ATOM_BHRIGU_PORTAL_SEO_SURFACE_V4
const BASE_URL = "https://www.bhrigu.io";

const ROUTE_META = {
  "/": {
    "title": "BHRIGU · Frey / ORION",
    "desc": "Cosmography, signals, and a constrained research interface — built for clarity, trust, and reproducible surfaces."
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
  const title = (hit && hit.title) ? hit.title : "BHRIGU · Frey / ORION";
  const desc  = (hit && hit.desc)  ? hit.desc  : "A structural portal for Frey / ORION: cosmography, signals, and carefully constrained research interfaces.";
  const canonical = buildCanonical(pathname);
  return { title, desc, canonical };
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const path = normalizePath(router?.asPath);
  const meta = getMeta(path);

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.desc} />
        <link rel="canonical" href={meta.canonical} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.desc} />
        <meta property="og:url" content={meta.canonical} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.desc} />
      </Head>

      <BhriguPhiHeader />
      <Component {...pageProps} />
    </>
  );
}
