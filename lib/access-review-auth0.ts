import { Auth0Client } from "@auth0/nextjs-auth0/server";

let auth0Client: Auth0Client | null = null;

export function getAccessReviewAuth0Client(): Auth0Client {
  if (!auth0Client) {
    auth0Client = new Auth0Client({
      enableAccessTokenEndpoint: false,
      signInReturnToPath: "/access-review",
      session: { rolling: false },
    });
  }
  return auth0Client;
}

export function isAuthorizedAccessOperator(
  session:
    | { user?: { email?: unknown; email_verified?: unknown } }
    | null
    | undefined,
  operatorEmail: string
): boolean {
  const email = session?.user?.email;
  return (
    typeof email === "string" &&
    session?.user?.email_verified === true &&
    email.trim().toLowerCase() === operatorEmail.trim().toLowerCase()
  );
}
