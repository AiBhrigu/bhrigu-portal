import { buildTemporalSnapshot } from "../../lib/frey_temporal_snapshot";

export default function handler(req, res) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "date required" });
  }

  const positions = {}; 
  const aspects = []; 

  const snapshot = buildTemporalSnapshot({ positions, aspects });

  res.status(200).json(snapshot);
}
