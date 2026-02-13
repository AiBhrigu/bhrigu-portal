import Head from "next/head";

export default function Signal() {
  return (
    <>
      <Head>
        <title>Signal Φ · BHRIGU</title>
        <meta
          name="description"
          content="System signal is present. No action required. Reading continues."
        />
      </Head>

      <main style={{ maxWidth: 920, margin: "0 auto", padding: "48px 18px" }}>
        <div style={{ marginBottom: 18, opacity: 0.85, fontSize: 14 }}>
          ← /reading
          <span style={{ margin: "0 10px", opacity: 0.5 }}>/</span>
          <span style={{ opacity: 0.8 }}>/signal</span>
          <span style={{ margin: "0 10px", opacity: 0.5 }}>/</span>
          /map →
        </div>

        <h1 style={{ fontSize: 32, margin: "18px 0 18px", letterSpacing: 1.2 }}>
          Signal Φ
        </h1>

        <div style={{ lineHeight: 1.7, fontSize: 16 }}>
          <p>
            System signal is present.
            <br />
            No action is required.
          </p>

          <p>
            Reading continues.
            <br />
            Structure remains stable.
          </p>

          <p>
            This page confirms continuity.
            <br />
            It does not request interaction.
          </p>
        </div>
      </main>
    </>
  );
}
