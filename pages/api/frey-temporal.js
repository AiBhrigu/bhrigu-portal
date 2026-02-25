import { freyTemporalAnalysis } from "../../lib/frey_temporal_analysis.js";
import { computeTemporalSnapshot } from "../../lib/frey_temporal_snapshot";

export default function handler(req, res) {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: "date required" });
  }
  const result = computeTemporalSnapshot(date);
  res.status(200).json(result);
}
