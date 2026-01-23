export default function Orion() {
  const railStyle = {
    marginTop: "2.2rem",
    display: "flex",
    gap: "18px",
    fontSize: "14px",
    opacity: 0.85,
  };

  return (
    <main style={{ padding: "4rem", fontFamily: "monospace", lineHeight: "1.6", maxWidth: "820px" }}>
      <h1 style={{ margin: "0 0 1rem 0" }}>ORION</h1>

      <p>
        ORION is the analytical engine beneath this portal.<br />
        The portal does not host it.
      </p>

      <hr />

      <p><strong>What this page is</strong></p>
      <p>
        A boundary and a name.<br />
        A stable surface reference.
      </p>

      <hr />

      <p><strong>What this page is not</strong></p>
      <p>
        No dashboard.<br />
        No public API.<br />
        No onboarding.
      </p>

      <hr />

      <p><strong>Access</strong></p>
      <p>
        Access is manual and contextual.<br />
        Start at <a href="/access">/access</a>.
      </p>

      <hr />

      <p>
        BHRIGU does not govern ORION.<br />
        BHRIGU only records the boundary.
      </p>

      <nav style={railStyle} aria-label="Route rail">
        <a href="/cosmography">← /cosmography</a>
        <a href="/frey">/frey →</a>
      </nav>
    </main>
  );
}
