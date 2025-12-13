export default function App({ Component, pageProps }) {
  return (
    <>
      <style jsx global>{`
        html, body { margin: 0; padding: 0; }
        a { text-decoration: underline; text-underline-offset: 0.18em; }
        a:hover { opacity: 0.75; }
        ::selection { background: rgba(255, 215, 120, 0.25); }
      `}</style>
      <Component {...pageProps} />
    </>
  );
}
