import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import dailyJson from "../data/public_daily_ephemerides_2026_v0_1.json";
import { loadPublicEphemeridesToday } from "../lib/public-ephemerides-live";

const dataset:any=dailyJson;
const dataset_sha256=dataset.dataset_sha256;
const fileSha=crypto.createHash("sha256").update(fs.readFileSync("data/public_daily_ephemerides_2026_v0_1.json")).digest("hex");
assert.equal(fileSha,"b9d092b585ef07ccf6ebb5bfd5b7129567efb3c23af3e73d371bf4edbf148794");
assert.equal(dataset_sha256,"28bfad7e2d12617757e4f742e1722f2965b6a2f6369b50973e4890f1f8f6781a");
assert.equal(dataset.source.commit,"0b9998c669b9b50e926b1891604b1969c642e046");
assert.equal(dataset.rows.length,365);assert.equal(dataset.rows[0].date,"2026-01-01");assert.equal(dataset.rows.at(-1).date,"2026-12-31");
assert.equal(new Set(dataset.rows.map((row:any)=>row.date)).size,365);
const allowedRow=new Set(["date","observation_time_utc","bodies","aspects","sun_moon_elongation_deg"]);
const allowedBody=new Set(["longitude_deg","longitude_speed_deg_per_day","retrograde"]);
const allowedAspect=new Set(["body_a","body_b","aspect","target_deg","orb_deg","orb_limit_deg","phase"]);
for(const row of dataset.rows){assert.deepEqual(new Set(Object.keys(row)),allowedRow);for(const state of Object.values(row.bodies) as any[])assert.deepEqual(new Set(Object.keys(state)),allowedBody);for(const aspect of row.aspects)assert.deepEqual(new Set(Object.keys(aspect)),allowedAspect);}
const now=new Date("2026-09-01T01:35:00Z");
const en=loadPublicEphemeridesToday("en",now) as any;
const ru=loadPublicEphemeridesToday("ru",now) as any;
assert.equal(en.live,true);assert.equal(en.observationTime,"2026-09-01T12:00:00Z");
assert.equal(en.source.authority,"CANONICAL_PUBLIC_SAFE_DAILY_EXPORT");assert.equal(en.source.dataset_sha256,dataset_sha256);
const js=en.aspects.find((a:any)=>a.a==="Jupiter"&&a.b==="Saturn"&&a.aspectName==="Trine");
assert.ok(js);assert.equal(js.phase,"SEPARATING");assert.equal(js.phaseLabel,"Separating");
const jsRu=ru.aspects.find((a:any)=>a.a==="Jupiter"&&a.b==="Saturn");assert.equal(jsRu.phaseLabel,"Расходящийся");
assert.equal(en.lunarPhase.elongation_deg,233.2);assert.match(en.lunarPhase.derivation,/CANONICAL_DAILY/);
assert.equal(en.eclipses.previous?.maximum_time_utc,"2026-08-28T04:12:58.339036Z");assert.equal(en.eclipses.next?.maximum_time_utc,"2027-02-06T15:59:40.318661Z");
assert.equal(en.eclipses.source.authority,"REFERENCE_CORPUS");assert.match(en.eclipses.source.boundary,/NOT_CANONICAL_ECLIPSE_ADAPTER/);

const liveSource=fs.readFileSync("lib/public-ephemerides-live.ts","utf8");
assert.doesNotMatch(liveSource,/loadBtcAstroField|BHRIGU_ASTRO_FIELD_URL|process\.env|fetch\(/);
const nav=fs.readFileSync("components/PrevNextBlock.jsx","utf8");assert.match(nav,/naturalFlow/);assert.match(nav,/pnFlow/);assert.match(nav,/startsWith\("\/ephemerides\/"\)/);
const app=fs.readFileSync("pages/_app.js","utf8");assert.match(app,/Canonical Public-Safe Daily Export · Today/);assert.match(app,/buildMachineGraph\(path,lang\)/);
console.log("PUBLIC_EPHEMERIDES_V2_ACCEPTANCE=PASS");
console.log("DAILY_DATASET_ROWS=365");console.log(`DAILY_DATASET_SHA256=${dataset_sha256}`);
console.log("TODAY_RUNTIME_SECRET_DEPENDENCY=ZERO");console.log("LIVE_OPENAI_CALLS=ZERO");console.log("FINANCIAL_MUTATION=ZERO");
