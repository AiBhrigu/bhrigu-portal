# BHRIGU private intake — Neon/Auth0/Resend contract v0.1

## State

- `AXIS`: reviewed private intake
- `PURPOSE`: make durable storage, private retrieval, delivery, and idempotency reviewable before public reopening
- `SOURCE_OF_TRUTH`: this contract, migration `20260809_access_private_intake_v1.sql`, local acceptance fixture, draft PR
- `BOUNDARY`: no provider provisioning, no production environment mutation, no public form restoration, no deployment
- `CURRENT_GATE`: production provider provisioning and public E2E proof are not part of this node

## Fail-closed activation

Public `/access` remains the containment surface and is unchanged. `/api/access/submit` returns `503` before reading the body unless every intake gate below is present:

```dotenv
ACCESS_PRIVATE_INTAKE_MODE=neon_auth0_resend_v1
ACCESS_RESEND_DOMAIN_VERIFIED=true
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_...
```

`ACCESS_RESEND_DOMAIN_VERIFIED=true` is an explicit proof gate. It must be set only after Resend verifies `bhrigu.io`; the sender contract is fixed to `BHRIGU Access <access@bhrigu.io>`.

Private `/access-review` remains a `404` unless every review gate below is present:

```dotenv
ACCESS_PRIVATE_REVIEW_MODE=auth0_neon_v1
DATABASE_URL=postgresql://...
AUTH0_DOMAIN=tenant.example.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...
AUTH0_SECRET=<32-byte hex secret>
APP_BASE_URL=https://www.bhrigu.io
```

The only authorized operator email is `aibhrigu@gmail.com`. Unauthorized and provider-error states return `404` with private no-store/noindex headers.

## Durable request and delivery contract

1. Client supplies an `Idempotency-Key` header (16–128 safe ASCII characters).
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
- Auth0 email allowlist is exact and case-normalized;
- storage occurs before delivery claims;
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
