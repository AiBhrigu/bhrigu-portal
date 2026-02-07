// ATOM_BHRIGU_PORTAL_COSMOGRAPHER_STORY_V1
import Head from "next/head";

const MD = String.raw`# The Cosmographer (Investor Read v1)

**TL;DR**  
BHRIGU is a portal where people meet a *Cosmographer*: a vertical, axis‑driven AI that turns noise into readable structure across three surfaces — **Cosmography**, **ORION**, and **Frey**.  
Not a “chatbot for everything”, but a *map‑maker*: it helps a user quickly understand where they are, what matters next, and how to move with clarity.

---

## Why “Cosmographer”

A cosmographer is not a storyteller and not a calculator. A cosmographer **maps**.

Most AI products are “horizontal”: they spread across countless topics and patterns, and the user swims inside an ocean of answers. The Cosmographer does the opposite — it builds a **map with an axis**, so the user can stand somewhere real, orient, and move.

- **Map over chatter.** Less talk, more structure.
- **Orientation over overload.** Where you are → what is relevant → what’s next.
- **A portal over a feed.** The experience is designed to be read, not scrolled.

That’s why the name matters: it sets expectations and creates a stable identity users can trust.

---

## What we built (public surface)

BHRIGU is the front door. Inside it:

1) **Cosmography** — a readable frame for perception: “What is this world? What is the map?”  
2) **ORION** — a boundary of the core: a research‑grade engine (kept behind strict safety and IP boundaries).  
3) **Frey** — the interface boundary: the place where a user actually interacts and gets results.

The portal is intentionally minimal: it’s a **navigation field** that keeps meaning clean and prevents feature sprawl.

---

## What “Vertical AI” means here

“Vertical AI” is often used to mean “industry‑specific.” That’s not enough.  
For the Cosmographer, “vertical” means **axis‑first intelligence**:

### 1) Axis before features
Instead of stacking features, we fix an axis: a consistent logic of *what matters*.

### 2) Layers, not randomness
A vertical system answers in layers, always:
- **L0 — outcome:** the direct answer or decision handle  
- **L1 — context:** the minimal frame needed to trust the answer  
- **L2 — next atom:** the smallest safe next step

This prevents conversational drift and protects the user from “infinite chat” fatigue.

### 3) Contracts and boundaries
The Cosmographer is not “everything”. It is a **bounded instrument** with explicit do / don’t rules, including strict IP‑shielding.  
This makes the product *deployable* in the real world.

---

## Φ‑field as a principle of clarity (not mythology, not leakage)

We use “Φ‑field” as a **design principle**: a discipline of clarity.

In practice, Φ‑field means:

- **One axis, low noise.** The interface must reduce cognitive friction.
- **Golden rhythm.** Information is delivered in proportions the mind can hold.
- **Crystallization.** Everything important becomes a stable artifact: a page, a contract, a snapshot, a result you can return to.
- **No double meanings.** Text and navigation are cleaned until they read like a single instrument.

This is not a claim about hidden physics. It is a product philosophy: **clarity beats complexity**.

---

## Who the creator is (without myth, without IP)

The creator is an **architect of the axis**: someone who thinks in systems, cycles, and structures — and refuses feature chaos.

In this collaboration:
- The **Human** holds intention, direction, and responsibility.
- The **Cosmographer** holds structure, language, and product coherence.

The result is not “AI replacing a person.” It is a *precision tool* that amplifies a human architect’s ability to ship a coherent world.

---

## What users will be able to do soon

This is the near‑term, public‑safe scope:

1) **Enter through the portal and understand the system fast.**  
   No long onboarding, no “read the docs for two hours.”

2) **Use Frey as the interaction interface.**  
   A user can submit a query, receive a structured output, and move to the next step without confusion.

3) **Navigate into ORION and Cosmography surfaces.**  
   Where allowed, they see clear boundaries and a stable reading path.

4) **Build trust through artifacts.**  
   Snapshots, logs, and stable pages prevent “it said something yesterday and now it changed.”

What we *don’t* promise publicly:
- Any internal mechanics or protected methods.
- Any claims that depend on hidden algorithms.
- Any speculative “AGI” rhetoric.

We build a product people can **use**, not a myth people can share.

---

## Why this matters to investors

This is a wedge into a real market problem: **AI fatigue**.

People don’t need more answers. They need **orientation**:
- What is signal vs noise?
- What is the next safe step?
- How do I trust the output?

The Cosmographer is a new category: a vertical, axis‑based intelligence that behaves like a **map** instead of a chat. That category can expand into multiple domains while keeping the same core identity: *clarity + boundaries + artifacts*.

---

## The promise (simple)

A Cosmographer doesn’t entertain you.  
It gives you a place to stand, a map to read, and a next step you can execute.

That’s the product. That’s the system.

---

**Status**: public surface text · safe to share (no internal methods).`;

function escapeHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g,"\n").split("\n");
  let out = [];
  let inUl = false;

  const flushUl = () => {
    if (inUl) { out.push("</ul>"); inUl = false; }
  };

  for (let raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushUl();
      out.push("");
      continue;
    }

    const h3 = line.match(/^###\s+(.*)$/);
    const h2 = line.match(/^##\s+(.*)$/);
    const h1 = line.match(/^#\s+(.*)$/);
    const li = line.match(/^[-*]\s+(.*)$/);
    const hr = line.trim().match(/^-{3,}$/);

    if (hr) { flushUl(); out.push("<hr />"); continue; }

    if (h1) { flushUl(); out.push(`<h1>${escapeHtml(h1[1])}</h1>`); continue; }
    if (h2) { flushUl(); out.push(`<h2>${escapeHtml(h2[1])}</h2>`); continue; }
    if (h3) { flushUl(); out.push(`<h3>${escapeHtml(h3[1])}</h3>`); continue; }

    if (li) {
      if (!inUl) { out.push("<ul>"); inUl = true; }
      out.push(`<li>${escapeHtml(li[1])}</li>`);
      continue;
    }

    flushUl();

    let p = escapeHtml(line).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    p = p.replace(/\*(.+?)\*/g, "<em>$1</em>");
    p = p.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    out.push(`<p>${p}</p>`);
  }
  flushUl();
  return out.filter(x => x !== "").join("\n");
}

export default function Cosmographer() {
  const html = mdToHtml(MD);
  return (
    <>
      <Head>
        <title>The Cosmographer · BHRIGU</title>
        <meta name="description" content="Meet the Cosmographer: a vertical, axis-driven AI for cosmography, ORION, and Frey." />

        {/* ATOM_META_COSMOGRAPHER_V1 */}
        <meta property="og:type" content="website" />
        <meta key="og:url" property="og:url" content="https://www.bhrigu.io/cosmographer" />
        <meta key="og:title" property="og:title" content="The Cosmographer · BHRIGU" />
        <meta
          key="og:description"
          property="og:description"
          content="Meet the Cosmographer: a vertical, axis-driven AI for cosmography, ORION, and Frey. Surface-first, reproducible, and constrained."
        />
        <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
        <meta key="twitter:title" name="twitter:title" content="The Cosmographer · BHRIGU" />
        <meta
          key="twitter:description"
          name="twitter:description"
          content="Meet the Cosmographer: a vertical, axis-driven AI for cosmography, ORION, and Frey. Surface-first, reproducible, and constrained."
        />
      </Head>
      <main style={{ maxWidth: 920, margin: "0 auto", padding: "48px 18px" }}>

        <section
          style={{
            margin: "10px 0 18px",
            padding: "14px 14px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            background: "rgba(255,255,255,0.015)",
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", opacity: 0.75, marginBottom: 8 }}>
            Cosmographer · quick map
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.55 }}>
            <strong>What:</strong> axis‑first AI that turns noise into a readable map.<br />
            <strong>For:</strong> builders, researchers, and investors who want orientation, not endless chat.<br />
            <strong>You get:</strong> outcome → context → next atom, plus stable artifacts.<br />
            <strong>Start:</strong> open <a href="/frey">/frey</a> (pilot) or see <a href="/services">/services</a>.
          </div>
        </section>

        <div style={{ display: "none" }} aria-hidden="true">__COSMOGRAPHER_PATCH_V0_1__</div>
        <article
          style={{ lineHeight: 1.7, fontSize: 16 }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div style={{ marginTop: 32, opacity: 0.7, fontSize: 13 }}>
        <section
          style={{
            marginTop: 26,
            padding: "14px 14px",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            background: "rgba(255,255,255,0.015)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Next</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/frey">/frey</a>
            <a href="/services">/services</a>
            <a href="/start">/start</a>
          </div>
        </section>

          EN-only. Surface description — no internal mechanics.
        </div>
      </main>
    </>
  );
}
