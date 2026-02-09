import styles from "./reading.module.css";
import PortalFooterNav from "../components/PortalFooterNav";

export default function Reading() {
  return (
    <main style={{ padding: "4rem", fontFamily: "monospace", lineHeight: "1.6", maxWidth: "820px" }} data-frey-reading-surface="__FREY_READING_QUERY_CANON_V0_4__">
      <nav className={styles.rail} aria-label="Route rail" data-phi-rail>
        <a className={styles.railLink} href="/start">← /start</a>
        <span className={styles.railSep}>/</span>
        <span className={styles.railHere}>/reading</span>
        <span className={styles.railSep}>/</span>
        <a className={styles.railLink} href="/signal">/signal →</a>
      </nav>

      <h1 style={{ margin: "1.2rem 0 0.8rem 0" }}>Reading</h1>

      <p>
  Next: <a href="/signal">/signal</a> or <a href="/map">/map</a>.
</p>
    
            <PortalFooterNav termsHref="/faq" next={[{href:"/signal",label:"/signal"},{href:"/map",label:"/map"}]} note="Canon: reading → signal." />

        <p className="muted">If you need terms: <a href="/faq">/faq</a>.</p>
<p className="muted">Archive: <a href="/archive">/archive</a>.</p>
      </main>
  );
}
