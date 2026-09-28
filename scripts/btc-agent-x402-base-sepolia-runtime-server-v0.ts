import { createServer } from "node:http";
import { BTC_AGENT_MAX_REQUEST_BODY_BYTES } from "../lib/btc-agent-evidence-answer-v0";
import { handleBtcAgentX402BaseSepoliaRuntime } from "../lib/btc-agent-x402-base-sepolia-runtime-v0";
import { createCdpCliX402BaseSepoliaAdapter } from "../lib/server/btc-agent-x402-cdp-cli-adapter-v0";

if (process.env.VERCEL_ENV === "production") {
  throw new Error("PRODUCTION_ENV_FORBIDDEN");
}

const host = "127.0.0.1";
const port = Number(process.env.BHRIGU_X402_TESTNET_RUNTIME_PORT ?? "4020");
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error("INVALID_TESTNET_RUNTIME_PORT");
}

const adapter = createCdpCliX402BaseSepoliaAdapter();
const path = "/btc-evidence-answer-v0";

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== path) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, code: "NOT_FOUND" }));
    return;
  }

  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += bytes.length;
    if (total > BTC_AGENT_MAX_REQUEST_BODY_BYTES) {
      res.statusCode = 413;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: false, code: "REQUEST_TOO_LARGE" }));
      return;
    }
    chunks.push(bytes);
  }

  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    res.statusCode = 422;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, code: "REQUEST_INVALID" }));
    return;
  }

  const paymentSignature = req.headers["payment-signature"];
  const response = await handleBtcAgentX402BaseSepoliaRuntime(
    {
      body,
      paymentSignatureHeader: Array.isArray(paymentSignature) ? paymentSignature[0] : paymentSignature,
      resourceUrl: `http://${host}:${port}${path}`,
      env: process.env,
    },
    { adapter },
  );

  res.statusCode = response.status;
  res.setHeader("Content-Type", "application/json");
  for (const [name, value] of Object.entries(response.headers)) {
    res.setHeader(name, value);
  }
  res.end(JSON.stringify(response.body));
});

server.listen(port, host, () => {
  console.log(JSON.stringify({
    ok: true,
    runtime: "bhrigu_btc_x402_base_sepolia_receipt_bound_runtime_v0",
    url: `http://${host}:${port}${path}`,
    production: false,
  }));
});
