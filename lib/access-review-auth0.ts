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
  session: { user?: { email?: unknown } } | null | undefined,
  operatorEmail: string
): boolean {
  const email = session?.user?.email;
  return (
    typeof email === "string" &&
    email.trim().toLowerCase() === operatorEmail.trim().toLowerCase()
  );
}
