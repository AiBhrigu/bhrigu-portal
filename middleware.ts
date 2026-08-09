import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getAccessReviewRuntimeConfig } from "./lib/access-intake-config";
import { getAccessReviewAuth0Client } from "./lib/access-review-auth0";

export async function middleware(request: NextRequest) {
  if (!getAccessReviewRuntimeConfig().enabled) {
    return NextResponse.next();
  }

  return getAccessReviewAuth0Client().middleware(request);
}

export const config = {
  matcher: ["/auth/:path*", "/access-review"],
};
