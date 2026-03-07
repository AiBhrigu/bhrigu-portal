import { freyTemporalAnalysis } from "../../lib/frey_temporal_analysis.js";
import { computeEphemeris } from "../../lib/ephemerides_service.js";
import { mapEphemerisToMetrics } from "../../lib/metric_mapper.js";
const USE_EPHEMERIDES_CORE = true;
import { computeTemporalSnapshot } from "../../lib/frey_temporal_snapshot";

export default function handler(req, res) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "date required" });
  }

  let result;

  if (USE_EPHEMERIDES_CORE) {
    const eph = computeEphemeris(date);
    result = mapEphemerisToMetrics(eph);
  } else {
    result = computeTemporalSnapshot(date);
  }

  const analysis = freyTemporalAnalysis(result);

  return res.status(200).json({
    engine: "frey-temporal-core-v0.1",
    date,
    ...result,
    analysis,
    meta: {
      engine_version: "frey-temporal-core-v0.1",
      cci_version: "1.0",
      layer: "L3_Gateway"
    }
  });
}
