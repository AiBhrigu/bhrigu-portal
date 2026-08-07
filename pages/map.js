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

      <h1>Public Relationship Map</h1>

      <p>
        This map describes public relationships and routes. It does not define ownership or governance.
        It orients across the public surface without exposing internal systems.
      </p>

      <h2>Market Path</h2>
      <ul>
        <li><Link href="/">BHRIGU</Link> — public access and ecosystem surface</li>
        <li><Link href="/">Market Cosmographer</Link> — market intelligence product surface</li>
        <li><Link href="/crypto-astro/btc">BTC Field</Link> — first proven public market corridor</li>
      </ul>

      <h2>Temporal Path</h2>
      <ul>
        <li><Link href="/frey">Frey</Link> — dialogue and temporal interface</li>
        <li><Link href="/reading">Reading</Link> — critical temporal meaning surface</li>
        <li><Link href="/access">Access</Link> — reviewed deeper entry</li>
      </ul>

      <h2>Intelligence & Foundation</h2>
      <ul>
        <li><Link href="/cosmographer">Cosmographer</Link> — independent intelligence and orientation contour</li>
        <li><Link href="/cosmography">Cosmography</Link> — method-language field</li>
        <li><Link href="/orion">ORION</Link> — protected analytical depth and research foundation</li>
      </ul>

      <h2>Future Economic Path</h2>
      <ul>
        <li><Link href="/dao">Possible future BHRIGU DAO</Link> — economics and incentives only; no authority over the analytical core</li>
      </ul>

      <h2>Public Support & Access</h2>
      <ul>
        <li><Link href="/support">Support</Link></li>
        <li><Link href="/investors">Investors</Link></li>
        <li><Link href="/services">Services</Link></li>
      </ul>

      <p>
        Public navigation hierarchy, technology genealogy, authorship, IP ownership and governance are distinct relationships.
      </p>
    </main>
  );
}
