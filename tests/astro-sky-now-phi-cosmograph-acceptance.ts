import assert from "node:assert/strict";
import fs from "node:fs";
import {
  BHRIGU_PHI_COSMOGRAPH_LAW,
  bhriguPhiGeometry,
  cosmographDegreeInSign,
  cosmographScreenAngleDeg,
  normalizeCosmographLongitude,
} from "../components/astro/BhriguPhiCosmograph";
import { loadPublicEphemeridesToday } from "../lib/public-ephemerides-live";

const wheel=fs.readFileSync("components/astro/BhriguPhiCosmograph.tsx","utf8");
const today=fs.readFileSync("components/astro/PublicEphemeridesToday.tsx","utf8");
const loader=fs.readFileSync("lib/public-ephemerides-live.ts","utf8");

function unit(longitude:number){const a=cosmographScreenAngleDeg(longitude)*Math.PI/180;return {x:Math.cos(a),y:Math.sin(a)};}

const aries=unit(0),cancer=unit(90),libra=unit(180),capricorn=unit(270);
assert.ok(aries.x<-0.999999&&Math.abs(aries.y)<1e-9);
assert.ok(cancer.y>0.999999&&Math.abs(cancer.x)<1e-9);
assert.ok(libra.x>0.999999&&Math.abs(libra.y)<1e-9);
assert.ok(capricorn.y<-0.999999&&Math.abs(capricorn.x)<1e-9);
assert.deepEqual(BHRIGU_PHI_COSMOGRAPH_LAW.orientation,{zeroAries:"LEFT",ninetyCancer:"BOTTOM",oneEightyLibra:"RIGHT",twoSeventyCapricorn:"TOP"});
assert.equal(BHRIGU_PHI_COSMOGRAPH_LAW.houseCount,12);
assert.equal(BHRIGU_PHI_COSMOGRAPH_LAW.equalHouseDegrees,30);
assert.equal(12*BHRIGU_PHI_COSMOGRAPH_LAW.equalHouseDegrees,360);

assert.equal(normalizeCosmographLongitude(-1),359);
assert.ok(Math.abs(cosmographDegreeInSign(161.9816)-11.9816)<1e-9);
const bodyType=wheel.match(/type Body = \{[\s\S]*?\};/)?.[0]??"";
assert.doesNotMatch(bodyType,/\bdegree\s*:/);
assert.match(bodyType,/\blongitude\s*:/);

const geometry=bhriguPhiGeometry(1200);
const PHI=(1+Math.sqrt(5))/2;
assert.ok(Math.abs(geometry.aspect-geometry.outer/PHI)<1e-9);
assert.ok(Math.abs(geometry.planetInner-geometry.aspect)<1e-9);
assert.ok(geometry.planetWidth>geometry.zodiacWidth);
assert.ok(geometry.zodiacWidth>geometry.houseWidth);
assert.ok(geometry.houseWidth>geometry.scaleWidth);

assert.match(wheel,/data-radial-order="houses-zodiac-degree-scale-planets-aspects-phi"/);
assert.match(wheel,/width="100%"/);
assert.match(wheel,/height="auto"/);
assert.match(wheel,/preserveAspectRatio="xMidYMid meet"/);
assert.match(wheel,/data-observer-origin="EARTH_PHI"/);
assert.match(wheel,/EARTH_AXIAL_TILT_DEG = 23\.44/);
assert.doesNotMatch(wheel,/\bASC\b|\bDSC\b|\bMC\b|\bIC\b/);

const planetBlock=wheel.split("Planet glyphs only.")[1]?.split("Aspects are anchored")[0]??"";
assert.match(planetBlock,/data-planet-glyph/);
assert.doesNotMatch(planetBlock,/<circle\b/);
const aspectBlock=wheel.split("Aspects are anchored")[1]?.split("Φ = symbolic")[0]??"";
assert.match(aspectBlock,/data-aspect-phase/);
assert.doesNotMatch(aspectBlock,/<circle\b/);

const houseBlock=wheel.split("Equal 30° cosmographic houses")[1]?.split("Zodiac:")[0]??"";
assert.match(houseBlock,/stroke=\{palette\.ivory\}/);
assert.doesNotMatch(houseBlock,/stroke=\{palette\.gold(?:High)?\}/);
const degreeBlock=wheel.split("degree scale sits inside")[1]?.split("Exact longitude")[0]??"";
assert.match(degreeBlock,/stroke=\{palette\.blue\}/);

const en=loadPublicEphemeridesToday("en",new Date("2026-09-04T12:01:00Z")) as any;
const ru=loadPublicEphemeridesToday("ru",new Date("2026-09-04T12:01:00Z")) as any;
assert.equal(en.live,true);
assert.equal(en.observationTime,"2026-09-04T12:00:00Z");
assert.equal(en.source.authority,"CANONICAL_PUBLIC_SAFE_DAILY_EXPORT");
assert.equal(en.source.commit,"0b9998c669b9b50e926b1891604b1969c642e046");
assert.equal(en.source.dataset_sha256,"28bfad7e2d12617757e4f742e1722f2965b6a2f6369b50973e4890f1f8f6781a");
assert.equal(en.nextPublishedTurningPoint?.date,"2026-09-11");
assert.equal(en.nextPublishedTurningPoint?.kind,"station");
assert.equal(en.nextPublishedTurningPoint?.body,"uranus");
assert.equal(en.nextPublishedTurningPoint?.motion,"retrograde");
assert.equal(en.nextPublishedTurningPoint?.source?.authority,"PUBLISHED_MONTHLY_ASTRO_EVIDENCE");
assert.equal(ru.nextPublishedTurningPoint?.date,"2026-09-11");

assert.match(today,/The Sky Now\./);
assert.match(today,/Небо сейчас\./);
assert.match(today,/BHRIGU_SKY_NOW_PHI_V0_1/);
assert.match(today,/No Bitcoin causality and no trading signal/);
assert.match(today,/Без причинности Bitcoin и без торгового сигнала/);
assert.doesNotMatch(today,/\bbuy\b|\bsell\b|bullish|bearish|price target/i);

assert.doesNotMatch(loader,/loadBtcAstroField|BHRIGU_ASTRO_FIELD_URL|process\.env|fetch\(/);
assert.match(loader,/PUBLISHED_MONTHLY_ASTRO_EVIDENCE/);
assert.match(loader,/CONTEXT_ONLY_NOT_DAILY_DERIVATION/);

console.log("ASTRO_SKY_NOW_PHI_COSMOGRAPH_ACCEPTANCE=PASS");
console.log("CARDINAL_GEOMETRY=PASS");
console.log("EQUAL_HOUSES_12X30=PASS");
console.log("PHI_RADIAL_GEOMETRY=PASS");
console.log("SINGLE_LONGITUDE_TRUTH=PASS");
console.log("NEXT_PUBLISHED_TURN_2026_09_11_URANUS=PASS");
console.log("RESPONSIVE_SVG=PASS");
console.log("PLANET_DISKS=ZERO");
console.log("ASPECT_ENDPOINT_DOTS=ZERO");
console.log("PRODUCTION_MUTATION=ZERO");
