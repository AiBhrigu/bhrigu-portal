import React from "react";
import Link from "next/link";

export default function Cosmographer() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "80px 20px" }}>
      <h1>Cosmographer makes complex structure readable.</h1>

      <p>
        It connects evidence, context, and boundaries so the next question becomes clearer.
      </p>

      <h2>What it does</h2>
      <ul>
        <li>Reads structure across multiple evidence layers</li>
        <li>Separates observation, interpretation, and uncertainty</li>
        <li>Turns complexity into a clear next question or bounded action</li>
      </ul>

      <h2>Public applications</h2>
      <p>
        BTC Cosmographer is the Bitcoin-specific public application of this role. Bitcoin is the current primary product axis, not the limit of BHRIGU.
      </p>
      <p>
        <Link href="/crypto-astro/btc">Open BTC Field</Link>
      </p>

      <h2>Frey remains distinct</h2>
      <p>
        Frey is an active temporal reading and dialogue service. Cosmographer and Frey may work together without either replacing or defining the other.
      </p>
      <p>
        <Link href="/frey">Open Frey</Link>
      </p>

      <h2>Research boundary</h2>
      <p>
        ORION and other research systems remain protected research depth. Public claims are limited to what has an explicit public-safe evidence and product boundary.
      </p>

      <p>
        Partners: <Link href="/investors">/investors</Link>
      </p>
    </main>
  );
}
