import styles from "./reading.module.css";
import PortalFooterNav from "../components/PortalFooterNav";

export default function Reading() {
  return (
    <main style={{ padding: "4rem", fontFamily: "monospace", lineHeight: "1.6", maxWidth: "820px" }} data-frey-reading-surface="__FREY_READING_QUERY_CANON_V0_4__">
      <nav className={styles.rail} aria-label="Route rail" data-phi-rail>
        ← /start
        <span className={styles.railSep}>/</span>
        <span className={styles.railHere}>/reading</span>
        <span className={styles.railSep}>/</span>
        /signal →
      </nav>

      <h1 style={{ margin: "1.2rem 0 0.8rem 0" }}>Reading</h1>

      <p>
  Next: /signal or /map.
</p>
    
            <PortalFooterNav termsHref="/faq" next={[{href:"/signal",label:"/signal"},{href:"/map",label:"/map"}]} note="Canon: reading → signal." />

        <p className="muted">Terms: /faq.</p>
<p className="muted">Archive: /archive.</p>
      </main>
  );
}
