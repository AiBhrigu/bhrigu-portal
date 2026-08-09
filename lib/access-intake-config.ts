export const ACCESS_INTAKE_MODE = "neon_auth0_resend_v1";
export const ACCESS_REVIEW_MODE = "auth0_neon_v1";
export const ACCESS_OPERATOR_EMAIL = "aibhrigu@gmail.com";
export const ACCESS_FROM_EMAIL = "BHRIGU Access <access@bhrigu.io>";
export const ACCESS_SITE_NAME = "BHRIGU";
export const ACCESS_SITE_URL = "https://www.bhrigu.io";

type AccessRuntimeEnv = Partial<NodeJS.ProcessEnv>;

export type AccessIntakeRuntimeConfig =
  | {
      enabled: false;
      reason: "closed" | "provider_contract_incomplete" | "sender_domain_unverified";
    }
  | {
      enabled: true;
      databaseUrl: string;
      resendApiKey: string;
      operatorEmail: typeof ACCESS_OPERATOR_EMAIL;
      fromEmail: typeof ACCESS_FROM_EMAIL;
      replyToEmail: typeof ACCESS_OPERATOR_EMAIL;
      siteName: typeof ACCESS_SITE_NAME;
      siteUrl: typeof ACCESS_SITE_URL;
    };

export function getAccessIntakeRuntimeConfig(
  env: AccessRuntimeEnv = process.env
): AccessIntakeRuntimeConfig {
  if (env.ACCESS_PRIVATE_INTAKE_MODE !== ACCESS_INTAKE_MODE) {
    return { enabled: false, reason: "closed" };
  }

  if (env.ACCESS_RESEND_DOMAIN_VERIFIED !== "true") {
    return { enabled: false, reason: "sender_domain_unverified" };
  }

  if (!env.DATABASE_URL?.trim() || !env.RESEND_API_KEY?.trim()) {
    return { enabled: false, reason: "provider_contract_incomplete" };
  }

  return {
    enabled: true,
    databaseUrl: env.DATABASE_URL.trim(),
    resendApiKey: env.RESEND_API_KEY.trim(),
    operatorEmail: ACCESS_OPERATOR_EMAIL,
    fromEmail: ACCESS_FROM_EMAIL,
    replyToEmail: ACCESS_OPERATOR_EMAIL,
    siteName: ACCESS_SITE_NAME,
    siteUrl: ACCESS_SITE_URL,
  };
}

export type AccessReviewRuntimeConfig =
  | { enabled: false }
  | {
      enabled: true;
      databaseUrl: string;
      operatorEmail: typeof ACCESS_OPERATOR_EMAIL;
    };

export function getAccessReviewRuntimeConfig(
  env: AccessRuntimeEnv = process.env
): AccessReviewRuntimeConfig {
  const auth0Complete = Boolean(
    env.AUTH0_DOMAIN?.trim() &&
      env.AUTH0_CLIENT_ID?.trim() &&
      env.AUTH0_CLIENT_SECRET?.trim() &&
      env.AUTH0_SECRET?.trim() &&
      env.APP_BASE_URL?.trim()
  );

  if (
    env.ACCESS_PRIVATE_REVIEW_MODE !== ACCESS_REVIEW_MODE ||
    !env.DATABASE_URL?.trim() ||
    !auth0Complete
  ) {
    return { enabled: false };
  }

  return {
    enabled: true,
    databaseUrl: env.DATABASE_URL.trim(),
    operatorEmail: ACCESS_OPERATOR_EMAIL,
  };
}
