import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
                <title>BHRIGU</title>
<meta property="og:type" content="website" />
        <meta property="og:title" content="BHRIGU" />
        <meta property="og:description" content="Structural portal and gateway layer." />
        <meta property="og:image" content="https://bhrigu.io/og/og.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BHRIGU" />
        <meta name="twitter:description" content="Structural portal and gateway layer." />
        <meta name="twitter:image" content="https://bhrigu.io/og/og.png" />
        <meta property="og:site_name" content="BHRIGU" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://www.bhrigu.io/favicon.ico" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:image" content="https://www.bhrigu.io/favicon.ico" />
</Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
