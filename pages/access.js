export default function Access() {
  const email = "aibhrigu@gmail.com";

  return (
    <main style={{ padding: "4rem", fontFamily: "monospace", lineHeight: "1.6", maxWidth: "820px" }}>
      Φ · Access

      <p>
        Access exists.<br />
        It is not automated.<br />
        It is not instant.
      </p>

      <hr />

      <p>
        Contact is established via email only.<br />
        No onboarding flows.
      </p>

      <p>
        <strong>{email}</strong><br />
        <a href={`mailto:${email}`}>mailto</a>
      </p>

      <hr />
<p>
        Access is via email only.<br />
        No automated sign-in or onboarding.
      </p>

      <p>
        <strong>{email}</strong><br />
        <a href={`mailto:${email}`}>mailto</a>
      </p>
    </main>
  );
}
