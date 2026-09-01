import assert from "node:assert/strict";
import fs from "node:fs";

const app=fs.readFileSync("pages/_app.js","utf8");
const archive=fs.readFileSync("components/astro/PublicEphemeridesV1.tsx","utf8");
const today=fs.readFileSync("components/astro/PublicEphemeridesToday.tsx","utf8");

assert.match(app,/routeOverride=\{ephemeridesPath\|\|path==="\/astro"/);
assert.match(app,/function ephemeridesMonthIdentity\(/);
assert.match(app,/const monthIdentity=ephemeridesMonthIdentity\(path,lang\)/);
assert.match(app,/temporalCoverage:`\$\{monthIdentity\.start\}\/\$\{monthIdentity\.end\}`/);
assert.match(app,/const pair=monthIdentity\?\[monthIdentity\.title,monthIdentity\.description\]/);
assert.match(archive,/const h1=mode==="month"/);
assert.match(archive,/const coverage=mode==="month"\?monthCoverage\(data\.month\):data\.range/);
assert.match(archive,/temporalCoverage:`\$\{coverage\.start\}\/\$\{coverage\.end\}`/);
for(const marker of ["data.schema","data.source.repository","data.source.commit","data.source.engine","data.source.mode","data.source.authority","data.source.dataset_sha256"]) assert.match(today,new RegExp(marker.replaceAll(".","\\.")));
assert.match(today,/Источник и проверяемость/);
assert.match(today,/Source & proof/);
console.log("ASTRO_EPHEMERIDES_P1_INTEGRITY_STATIC=PASS");
