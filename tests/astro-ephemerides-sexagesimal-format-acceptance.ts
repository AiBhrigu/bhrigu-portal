import assert from "node:assert/strict";
import fs from "node:fs";
import dailyJson from "../data/public_daily_ephemerides_2026_v0_1.json";
import monthlyJson from "../data/btc_public_astro_evidence_v0_1.json";
import {
  formatSexagesimalPosition,
  formatZodiacPosition,
  projectZodiacPosition,
} from "../lib/public-zodiac-position";
import { loadPublicEphemeridesToday } from "../lib/public-ephemerides-live";
import { buildPublicEphemeridesMonth } from "../lib/public-ephemerides-v1";

const dms = (degree:number, minute:number, second:number) =>
  degree + minute / 60 + second / 3600;

assert.equal(formatZodiacPosition(137.830921, "en"), "Leo 17°49′51″");
assert.equal(formatZodiacPosition(137.830921, "ru"), "Лев 17°49′51″");

assert.equal(
  formatZodiacPosition(dms(29, 59, 59.49), "en"),
  "Aries 29°59′59″",
);
assert.equal(
  formatZodiacPosition(dms(29, 59, 59.50), "en"),
  "Taurus 0°00′00″",
);
assert.equal(
  formatZodiacPosition(dms(359, 59, 59.50), "en"),
  "Aries 0°00′00″",
);
assert.equal(formatZodiacPosition(0, "en"), "Aries 0°00′00″");
assert.equal(formatZodiacPosition(360, "en"), "Aries 0°00′00″");
assert.equal(formatZodiacPosition(-0.25, "en"), "Pisces 29°45′00″");

for (const value of [0, 29.999, 30, 137.830921, 359.999, 360, -0.25, 721.25]) {
  const projected = projectZodiacPosition(value);
  assert.ok(projected.signIndex >= 0 && projected.signIndex < 12);
  assert.ok(projected.degree >= 0 && projected.degree < 30);
  assert.ok(projected.minute >= 0 && projected.minute < 60);
  assert.ok(projected.second >= 0 && projected.second < 60);
}

const daily:any = dailyJson;
for (const row of daily.rows) {
  for (const state of Object.values(row.bodies) as any[]) {
    const projected = projectZodiacPosition(Number(state.longitude_deg));
    assert.ok(projected.degree < 30);
    assert.ok(projected.minute < 60);
    assert.ok(projected.second < 60);
  }
}

const enToday:any = loadPublicEphemeridesToday("en", new Date("2026-09-21T12:00:00Z"));
const ruToday:any = loadPublicEphemeridesToday("ru", new Date("2026-09-21T12:00:00Z"));
const enJupiter = enToday.bodies.find((body:any) => body.key === "jupiter");
const ruJupiter = ruToday.bodies.find((body:any) => body.key === "jupiter");
assert.equal(enJupiter.position, "Leo 17°49′51″");
assert.equal(ruJupiter.position, "Лев 17°49′51″");
assert.equal(enJupiter.longitude, 137.8309);
assert.equal(ruJupiter.longitude, 137.8309);
assert.equal("degree" in enJupiter, false);

const monthly:any = monthlyJson;
for (const locale of ["en", "ru"] as const) {
  for (let month = 1; month <= 12; month += 1) {
    const output:any = buildPublicEphemeridesMonth(locale, month);
    const anchor = monthly.anchors.find((item:any) => item.date === output.anchorDate);
    assert.ok(anchor);
    for (const body of output.bodies) {
      assert.equal(
        body.position,
        formatZodiacPosition(Number(anchor.b[body.key][0]), locale),
      );
      assert.equal("degree" in body, false);
    }
  }
}

const todaySource = fs.readFileSync("components/astro/PublicEphemeridesToday.tsx", "utf8");
const monthSource = fs.readFileSync("components/astro/PublicEphemeridesV1.tsx", "utf8");
const wheelSource = fs.readFileSync("components/astro/BhriguPhiCosmograph.tsx", "utf8");
const btcSource = fs.readFileSync("lib/btc-public-astro-evidence.ts", "utf8");

assert.doesNotMatch(todaySource, /prettySign\(/);
assert.doesNotMatch(todaySource, /b\.degree/);
assert.match(todaySource, /\{b\.position\}/);

assert.doesNotMatch(monthSource, /prettySign\(/);
assert.doesNotMatch(monthSource, /b\.degree/);
assert.match(monthSource, /\{b\.position\}/);

assert.match(wheelSource, /formatSexagesimalPosition\(body\.exactLongitude\)/);
assert.doesNotMatch(wheelSource, /degree\.toFixed\(2\)/);

assert.match(btcSource, /formatSexagesimalPosition\(longitude\)/);
assert.match(btcSource, /projectZodiacPosition\(longitude\)/);
assert.doesNotMatch(btcSource, /degree\.toFixed\(1\)/);

assert.equal(formatSexagesimalPosition(137.830921), "17°49′51″");

console.log("EPHEMERIDES_SEXAGESIMAL_FORMATTER=PASS");
console.log("EPHEMERIDES_BOUNDARY_CARRIES=PASS");
console.log("EPHEMERIDES_3650_BODY_POSITIONS=PASS");
console.log("EPHEMERIDES_TODAY_MONTHLY_PARITY=PASS");
console.log("BTC_ASTRO_POSITION_SEMANTICS=PASS");
