export default function Access() {
  const email = "aibhrigu@gmail.com";

  return (
    <main style={{ padding: "4rem", fontFamily: "monospace", lineHeight: "1.6", maxWidth: "820px" }}>
      \1Φ · \2\3

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

      <p><strong>RU</strong></p>

      <p>
        Доступ — только через email.<br />
        Автоматических входов и онбординга нет.
      </p>

      <p>
        <strong>{email}</strong><br />
        <a href={`mailto:${email}`}>mailto</a>
      </p>
    </main>
  );
}
