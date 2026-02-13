// ATOM_BHRIGU_PORTAL_DAO_CHRONICLE_V1
import Link from "next/link";

export default function Chronicle() {
  return (
    <main>
      <h1>Chronicle</h1>

      <p style={{ maxWidth: 900, lineHeight: 1.7 }}>
        Surface-only timeline. This is a public ledger of milestones — not a disclosure of the core.
      </p>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Milestones</h2>
        <ul style={{ lineHeight: 1.7, maxWidth: 980 }}>
          <li><strong>Jan 2026</strong> — Portal stabilized; EN-only sweep across key pages.</li>
          <li><strong>Jan 2026</strong> — Signal cleaned: duplicates removed.</li>
          <li><strong>Jan 2026</strong> — Cosmographer shipped with aligned metadata.</li>
          <li><strong>Jan 2026</strong> — Canonical unified: one canonical tag per page.</li>
          <li><strong>Jan 2026</strong> — Public API disabled (<code>/api</code> returns 410) to keep the surface safe.</li>
          <li><strong>Jan 2026</strong> — DAO clarified as an economic shell (peripheral governance).</li>
          <li><strong>Jan 2026</strong> — Frey surface entrypoint stabilized for onboarding.</li>
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 8 }}>Anchors</h2>
        <p style={{ maxWidth: 980, lineHeight: 1.7 }}>
          Explore: Frey · Cosmography · 
          Map · Services · <Link href="/access">Access</Link>
        </p>
      </section>
    
        <p className="muted">Archive: /archive.</p>
      </main>
  );
}
