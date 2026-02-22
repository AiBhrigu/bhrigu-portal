import styles from "./reading.module.css";
import PortalFooterNav from "../components/PortalFooterNav";

export async function getServerSideProps(context) {
  const raw = context.query.q || "";
  const q = Array.isArray(raw) ? raw[0] : raw;
  return { props: { q } };
}

export default function Reading({ q }) {
  return (
    <main
      style={{ padding: "4rem", fontFamily: "monospace", lineHeight: "1.6", maxWidth: "820px" }}
      data-frey-reading-surface="FREY_READING_SSR_V0_1"
    >
      <nav className={styles.rail} aria-label="Route rail" data-phi-rail>
        ← /start
        <span className={styles.railSep}>/</span>
        <span className={styles.railHere}>/reading</span>
        <span className={styles.railSep}>/</span>
        /signal →
      </nav>

      <h1 style={{ margin: "1.2rem 0 0.8rem 0" }}>Reading</h1>

      {q && (
        <div style={{ margin: "0 0 1.2rem 0", fontWeight: "bold" }}>
          {q}
        </div>
      )}

      <p>Next: /signal or /map.</p>

      <PortalFooterNav
        termsHref="/faq"
        next={[
          { href: "/signal", label: "/signal" },
          { href: "/map", label: "/map" }
        ]}
        note="Canon: reading → signal."
      />

      <p className="muted">Glossary: /faq.</p>
      <p className="muted">Archive: /archive.</p>
    </main>
  );
}
