import "../styles/globals.css";
import BhriguPhiHeader from "../components/BhriguPhiHeader"; // ATOM_BHRIGU_PORTAL_UX_UNIFY_V1

import Head from "next/head";

export default function App({ Component, pageProps }) {
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
