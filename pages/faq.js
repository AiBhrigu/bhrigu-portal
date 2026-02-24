export default function FAQ() {
  return (
    <main style={{ maxWidth: "720px", margin: "0 auto", padding: "80px 24px" }}>
      <h1 style={{ marginBottom: "40px" }}>FAQ</h1>

      <section style={{ marginBottom: "48px" }}>
        <h3 style={{ marginBottom: "12px" }}>What is BHRIGU?</h3>
        <p style={{ lineHeight: "1.7" }}>
          BHRIGU is a surface-first system. Public layers remain minimal by design.
        </p>
      </section>

      <section style={{ marginBottom: "48px" }}>
        <h3 style={{ marginBottom: "12px" }}>What is Frey?</h3>
        <p style={{ lineHeight: "1.7" }}>
          Frey is the execution interface. It reads structure and defines the next move.
        </p>
      </section>

      <section style={{ marginBottom: "48px" }}>
        <h3 style={{ marginBottom: "12px" }}>Is access public?</h3>
        <p style={{ lineHeight: "1.7" }}>
          Access is invite-based. Core internals remain gated.
        </p>
      </section>

      <section style={{ marginBottom: "48px" }}>
        <h3 style={{ marginBottom: "12px" }}>Do you disclose internals?</h3>
        <p style={{ lineHeight: "1.7" }}>
          No. Architecture boundaries are intentional.
        </p>
      </section>

      <section>
        <h3 style={{ marginBottom: "12px" }}>How to engage?</h3>
        <p style={{ lineHeight: "1.7" }}>
          Use the relevant surface layer: /start, /cosmographer, or /investors.
        </p>
      </section>
    </main>
  );
}
