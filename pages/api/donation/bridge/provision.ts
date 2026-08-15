import type { NextApiRequest, NextApiResponse } from "next";
import { DonationBridgeError, DONATION_BRIDGE_KEY_ID_HEADER, DONATION_BRIDGE_SIGNATURE_HEADER, getDonationBridgeRuntimeConfig, parseDonationAddressProvisionPayload, verifyDonationBridgeEnvelope } from "../../../../lib/btc-donation-bridge";
import { createNeonBtcDonationBridgeStore } from "../../../../lib/btc-donation-bridge-neon";

const PATH = "/api/donation/bridge/provision";
export default async function handler(req: NextApiRequest,res: NextApiResponse) {
  privateHeaders(res);
  if (req.method !== "POST") { res.setHeader("Allow","POST"); return res.status(405).json({ok:false,errorCode:"method_not_allowed"}); }
  const config=getDonationBridgeRuntimeConfig();
  if (!config.enabled) return res.status(404).json({ok:false,errorCode:"not_found"});
  try {
    const envelope=verifyDonationBridgeEnvelope({
      envelope:req.body,signatureBase64:req.headers[DONATION_BRIDGE_SIGNATURE_HEADER],suppliedKeyId:req.headers[DONATION_BRIDGE_KEY_ID_HEADER],
      expectedMethod:"POST",expectedPath:PATH,expectedKind:"address_provision",config
    });
    const payload=parseDonationAddressProvisionPayload(envelope.payload);
    const store=createNeonBtcDonationBridgeStore(config.databaseUrl);
    const message=await store.recordMessage(envelope);
    if (message==="conflict") return res.status(409).json({ok:false,errorCode:"message_conflict"});
    const address=await store.provisionAddress(payload);
    if (address==="conflict") return res.status(409).json({ok:false,errorCode:"address_conflict"});
    await store.markMessageProcessed(envelope.messageId,new Date().toISOString());
    return res.status(200).json({ok:true,messageDisposition:message,addressDisposition:address});
  } catch (error) {
    if (error instanceof DonationBridgeError) return res.status(404).json({ok:false,errorCode:"not_found"});
    return res.status(503).json({ok:false,errorCode:"donation_bridge_unavailable"});
  }
}
function privateHeaders(res:NextApiResponse){res.setHeader("Cache-Control","private, no-store, max-age=0");res.setHeader("Pragma","no-cache");res.setHeader("X-Robots-Tag","noindex, nofollow, noarchive");res.setHeader("X-Content-Type-Options","nosniff");}
