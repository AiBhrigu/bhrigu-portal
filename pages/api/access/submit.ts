import type { NextApiRequest, NextApiResponse } from "next";

type AccessContainmentResponse = {
  ok: false;
  errorCode: "method_not_allowed" | "intake_temporarily_closed";
  errorMessage: string;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccessContainmentResponse>
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      errorCode: "method_not_allowed",
      errorMessage: "Method not allowed.",
    });
  }

  return res.status(503).json({
    ok: false,
    errorCode: "intake_temporarily_closed",
    errorMessage:
      "Reviewed requests are temporarily closed while secure private intake is being upgraded.",
  });
}
