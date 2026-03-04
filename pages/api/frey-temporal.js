import { freyTemporalAnalysis } from "../../lib/frey_temporal_analysis.js";
import { computeTemporalSnapshot } from "../../lib/frey_temporal_snapshot";

export default function handler(req, res) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "date required" });
  }

  // ===== CCI GATEWAY BOUNDARY =====
  // Future integration point:
  // - ephemerides_core
  // - aspects_engine
  // - eclipse_layer
  // Currently: deterministic L3 compute only

  const result = computeTemporalSnapshot(date);
  const analysis = freyTemporalAnalysis(result);

  return res.status(200).json({
    engine: "frey-temporal-core-v0.1",
    ...result,
    analysis,
    meta: {
      engine_version: "frey-temporal-core-v0.1",
      cci_version: "1.0",
      layer: "L3_Gateway",
      timestamp: new Date().toISOString()
    }
  });
}
