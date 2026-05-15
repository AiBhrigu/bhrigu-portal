import React from "react";
import Link from "next/link";

export default function Map() {
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "80px 20px" }}>
        <section
          data-frey-guide-link="FREY_GUIDE_LINK_PLACEMENT_V0_3"
          style={{
            width: 'min(1040px, 100%)',
            margin: '18px auto',
            border: '1px solid rgba(226, 180, 92, 0.28)',
            borderRadius: '20px',
            padding: '16px 18px',
            background: 'rgba(9, 12, 20, 0.68)',
            boxShadow: '0 18px 42px rgba(0, 0, 0, 0.18)',
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              color: '#d8ad62',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}
          >
            Guide
          </p>
          <a
            href="/guide/frey"
            style={{
              color: '#f7d08a',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Guide: /frey → /reading → /access.
          </a>
        </section>

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

      <h2>Quiet Support</h2>
      <ul>
        <li><Link href="/support">Support</Link></li>
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
