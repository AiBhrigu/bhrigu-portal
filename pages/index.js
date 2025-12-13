export default function Home() {
  const linkStyle = {
    color: "inherit",
    textDecoration: "underline"
  };

  return (
    <main
      style={{
        padding: "4rem",
        fontFamily: "monospace",
        lineHeight: "1.6",
        maxWidth: "820px"
      }}
    >
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
        Begin with <a href="/start" style={linkStyle}>/start</a><br />
        Follow with <a href="/reading" style={linkStyle}>/reading</a>
      </p>

      <hr />

      <p>
        Continue reading:
      </p>

      <p>
        <a href="/map" style={linkStyle}>/map</a><br />
        <a href="/services" style={linkStyle}>/services</a><br />
        <a href="/access" style={linkStyle}>/access</a><br />
        <a href="/chronicle" style={linkStyle}>/chronicle</a>
      </p>

      <hr />

      <p>
        Nothing here asks for action.<br />
        Presence precedes interaction.
      </p>
    </main>
  );
}
