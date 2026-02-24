import React from "react";
import Link from "next/link";

export default function Map() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "80px 20px" }}>

      <h1>Portal Navigation Surface</h1>

      <p>
        A structured navigation layer to explore the public surfaces of BHRIGU × Frey.
        This map orients — it does not expose internal systems.
      </p>

      <h2>Core Surfaces</h2>
      <ul>
        <li><Link href="/cosmographer">Cosmographer</Link></li>
        <li><Link href="/frey">Frey</Link></li>
        <li><Link href="/reading">Reading</Link></li>
      </ul>

      <h2>System Layers</h2>
      <ul>
        <li><Link href="/cosmography">Cosmography</Link></li>
        <li><Link href="/orion">Orion</Link></li>
        <li><Link href="/dao">DAO</Link></li>
      </ul>

      <h2>Access & Capital</h2>
      <ul>
        <li><Link href="/investors">Investors</Link></li>
        <li><Link href="/access">Access</Link></li>
        <li><Link href="/services">Services</Link></li>
      </ul>

      <p>
        The map maintains structural clarity across the portal.
      </p>

    </main>
  );
}
