import "../styles/globals.css";
import Head from "next/head";
import { useRouter } from "next/router";
import BhriguPhiHeader from "../components/BhriguPhiHeader"; // ATOM_BHRIGU_PORTAL_UX_UNIFY_V1

export default function App({ Component, pageProps }) {
  // ATOM_BHRIGU_PORTAL_SEO_SURFACE_V3
  const router = useRouter();
  const path = (router.asPath || "/").split("?")[0].split("#")[0];
  const canonical = `https://www.bhrigu.io${path === "/" ? "/" : path}`;
  const DEFAULT_TITLE = "BHRIGU · Frey / ORION";
  const DEFAULT_DESC = "A structural portal for Frey / ORION: cosmography, signals, and carefully constrained research interfaces.";
  return (
    <>
      <Head>
        <meta property="og:site_name" content="BHRIGU" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.bhrigu.io/og.svg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://www.bhrigu.io/og.svg" />
      </Head>

      <Head>
        <title>BHRIGU</title>
      </Head>
      <style jsx global>{`a{color:inherit;text-decoration:underline;text-decoration-color:rgba(215,181,90,0.55);text-underline-offset:3px;word-break:break-word}a:hover{text-decoration-color:rgba(215,181,90,0.95)}`}</style>
      <BhriguPhiHeader />
      <Component {...pageProps} />
    </>
  );
}
