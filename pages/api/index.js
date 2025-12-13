export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(410).json({
    status: "disabled",
    route: "/api",
    message: "No public API is exposed by this portal. See /orion and /access.",
  });
}
