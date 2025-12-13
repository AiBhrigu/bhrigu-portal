export default function Home() {
  const links = [
    ["/start", "Start"],
    ["/reading", "Reading"],
    ["/map", "Map"],
    ["/services", "Services"],
    ["/cosmography", "Cosmography"],
    ["/orion", "ORION"],
    ["/frey", "Frey"],
    ["/dao", "DAO"],
    ["/access", "Access"],
    ["/chronicle", "Chronicle"],
    ["/github", "GitHub"],
  ];

  return (
    <main style={{ padding: "4rem", fontFamily: "monospace", lineHeight: "1.7", maxWidth: "820px" }}>
      <h1>BHRIGU</h1>

      <p>
        Structural portal.<br />
        Gateway layer.<br />
        Read-only field.
      </p>

      <hr />

      <p>
        This is not a landing page.<br />
        This is an axis.
      </p>

      <p>
        Begin with <a href="/start">/start</a><br />
        Follow with <a href="/reading">/reading</a>
      </p>

      <hr />

      <p><strong>Continue reading:</strong></p>

      <ul style={{ paddingLeft: "1.2rem" }}>
        {links.map(([href, label]) => (
          <li key={href}>
            <a href={href}>{href}</a> — {label}
          </li>
        ))}
      </ul>

      <hr />

      <p>
        Nothing here asks for action.<br />
        Presence precedes interaction.
      </p>
    </main>
  );
}
