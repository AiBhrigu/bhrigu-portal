import Document, { Html, Head, Main, NextScript } from "next/document";

export default class BhriguDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    const raw = Array.isArray(ctx.query?.lang) ? ctx.query.lang[0] : ctx.query?.lang;
    const lang = raw === "ru" ? "ru" : "en";
    return { ...initialProps, lang };
  }

  render() {
    const lang = this.props.lang === "ru" ? "ru" : "en";
    return (
      <Html lang={lang}>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}