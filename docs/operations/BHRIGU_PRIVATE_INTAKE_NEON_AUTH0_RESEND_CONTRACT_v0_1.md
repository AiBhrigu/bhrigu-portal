# BHRIGU private intake — Neon/Auth0/Resend contract v0.1

## State

- `AXIS`: reviewed private intake
- `PURPOSE`: make durable storage, private retrieval, delivery, and idempotency reviewable before public reopening
- `SOURCE_OF_TRUTH`: this contract, migration `20260809_access_private_intake_v1.sql`, local acceptance fixture, draft PR
- `BOUNDARY`: no provider provisioning, no production environment mutation, no public form restoration, no deployment
- `CURRENT_GATE`: production provider provisioning and public E2E proof are not part of this node

## Fail-closed activation

Public `/access` remains the containment surface and is unchanged. `/api/access/submit` returns `503` before reading the body unless the complete intake and private-review gates below are present together. Intake cannot activate while authenticated private retrieval is unavailable:

```dotenv
ACCESS_PRIVATE_INTAKE_MODE=neon_auth0_resend_v1
ACCESS_RESEND_DOMAIN_VERIFIED=true
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_...
ACCESS_PRIVATE_REVIEW_MODE=auth0_neon_v1
AUTH0_DOMAIN=tenant.example.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_SECRET=<32-byte hex secret>
APP_BASE_URL=<environment-specific absolute app URL>
```

`APP_BASE_URL` remains a required fail-closed review gate and must be bound to the exact application authority of the environment being exercised. For the accepted Preview corridor it is:

```dotenv
APP_BASE_URL=https://bhrigu-portal-git-main-aibhrigus-projects.vercel.app
```

The future Production value remains `https://www.bhrigu.io`; it must not be installed into Preview. Dynamic host inference by omitting `APP_BASE_URL` is intentionally not used for this private-review contract.

`ACCESS_RESEND_DOMAIN_VERIFIED=true` is an explicit proof gate. It must be set only after Resend verifies `bhrigu.io`; the sender contract is fixed to `BHRIGU Access <access@bhrigu.io>`.

Private `/access-review` remains a `404` unless its review gates are complete. The only authorized operator identity is a verified Auth0 email claim (`email_verified=true`) matching `aibhrigu@gmail.com`. Unverified, unauthorized, and provider-error states return `404` with private no-store/noindex headers.

## Durable request and delivery contract

1. Client creates an `Idempotency-Key` (16–128 safe ASCII characters), persists it alongside the recoverable draft before the request, and reuses it after reload until the request succeeds or the draft changes.
2. The server validates and canonicalizes the request, then hashes the sanitized payload with SHA-256.
3. Neon reserves one request row under the unique idempotency key and creates two delivery rows in one transaction.
4. Reuse of a key with the same payload returns the original request; reuse with a different payload returns `409`.
5. Delivery can begin only after the durable reservation succeeds.
6. Operator and client deliveries have deterministic Resend idempotency keys and independent database states.
7. A delivery failure returns an accepted/pending-retry state; it never erases the canonical request.
8. A replay claims only pending or failed deliveries. A delivered email is not sent again.

## Fixed mail identities

- From: `BHRIGU Access <access@bhrigu.io>`
- Operator: `aibhrigu@gmail.com`
- Reply-To: `aibhrigu@gmail.com`

## Local acceptance

`npm run verify:access-private-intake` proves:

- default and incomplete configurations fail closed;
- intake activation requires the complete private-retrieval gate;
- Auth0 email allowlist is exact, case-normalized, and requires `email_verified=true`;
- storage occurs before delivery claims;
- the client idempotency key survives a reload fixture and is cleared after resolution;
- busy delivery claims remain `pending_retry` and are never reported as delivered;
- equal-key/equal-payload replay returns the original request without duplicate email;
- equal-key/different-payload returns `409`;
- failed delivery leaves the request durable and retries only the failed leg;
- intake and review routes remain closed with no provider configuration;
- migration contains the unique request and delivery constraints;
- `pages/access.tsx` is unchanged from `origin/master`.

## Production gates intentionally left closed

- Neon Marketplace resource provisioned and migration applied
- Auth0 application provisioned with exact callback/logout/origin allowlists
- Resend domain `bhrigu.io` verified
- production environment variables installed in the exact Vercel project
- authenticated private retrieval proof
- real submission proof, durable row proof, and both delivery proofs
- retry/replay proof against the production providers

No public reopening is authorized until those gates pass as one bounded E2E proof node.
