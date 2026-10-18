# 05 — Nextgen API contracts

Base `/api/v1`; JSON envelope `{data,meta}` and errors `{error:{code,message,fields,requestId}}`. Implement shared runtime schemas and OpenAPI in N-01/N-05. These are specifications, not existing endpoints.

## Shared behaviour

UTC ISO timestamps; UUID internal IDs; random safe enquiry reference. Cursor lists default 20/max 50 with stable ID tie-break and `meta.nextCursor`. `meta.requestId` always present. No client-defined lead status, owner, priority, or staff permissions accepted.

400 malformed JSON; 401 session required; 403 denied action/token; 404 missing/out-of-scope private resource; 409 idempotency/version/state conflict; 413 body too large; 415 wrong content type; 422 field validation; 429 `Retry-After`; 503 temporarily unavailable. Generic 500 includes correlation ID, not SQL/provider details.

Initial create 201; matching idempotent replay 200 with identical reference and `meta.replayed=true`. Both mean durable storage. Same key + different canonical payload = 409 `IDEMPOTENCY_CONFLICT`. Proposed retention 7 days, scoped by anonymous cookie + operation; never deduplicate globally by email. Notice/token refresh is separate from a new submission.

## Public intake

GET `/enquiry-session`: issues/refreshes signed 24h submission token in the current anonymous scope and returns accepted privacy notice version. Set secure HttpOnly same-origin scope cookie with proposed 7-day expiry; limit issuance and do not allow cross-origin credential use. A token is not a lead-access credential.

POST `/enquiries`: require JSON, `Idempotency-Key`, valid submission token/cookie, exact allowed origin and rate limits. Server validates; fields below are canonical:

```ts
type Service = 'consulting' | 'application_development'
  | 'ai_agents_integration' | 'ai_training' | 'not_sure';

type EnquiryInput = {
  name: string; email: string; service: Service; message: string;
  company?: string; role?: string; phone?: string;
  budget?: 'not_sure' | 'under_5k' | '5k_20k' | '20k_50k' | 'over_50k';
  timeframe?: 'exploring' | 'within_3_months' | '3_6_months' | 'later';
  training?: {
    teamSize?: '1_5' | '6_20' | '21_50' | 'over_50' | 'not_sure';
    experience?: 'beginner' | 'mixed' | 'technical';
    topics?: string; // max 1000
    delivery?: 'remote' | 'in_person' | 'not_sure';
    location?: string; // max 160
    preferredDates?: string; // max 200; enquiry, not booking
  };
  ai?: {
    existingSystems?: string; // max 1000; no credentials
    dataSensitivity?: 'public' | 'internal' | 'sensitive' | 'not_sure';
  };
  privacyAcknowledged: true;
  privacyNoticeVersion: string;
  marketingConsent: boolean; // false default, never prechecked
  sourceRoute?: string; // allowlisted route only
  submissionToken: string;
};
```

Budget labels are optional MYR qualification ranges, **not service prices**; Ryan may revise/remove them before launch. `training` only for `ai_training`, `ai` only for `ai_agents_integration`; reject mismatched payloads rather than storing stale hidden fields. Accept personal email domains. Limits and canonical enums shared with frontend. See [database](04-DATABASE-POSTGRESQL.md) for field lengths.

```json
{
  "data": {"reference": "NG-DEMO-7Q4T9P", "status": "received"},
  "meta": {"requestId": "req_example", "replayed": false}
}
```

This is a synthetic response example; production references use a securely generated collision-resistant value and unique DB constraint. Do not include contact details or internal lead ID in public success payload.

Key errors: `VALIDATION_FAILED` with field messages; `SUBMISSION_TOKEN_EXPIRED` → refresh token same scope and retry same key/payload; `IDEMPOTENCY_CONFLICT` → do not silently create another lead; `RATE_LIMITED` → delay per header; `INTAKE_UNAVAILABLE` → retain values and show uncertainty when commit may have occurred. Network timeout is an unknown result, not proof that nothing was stored.

No GET-by-reference/email public endpoint. Contact form never uploads attachments. Direct `/thank-you` navigation does not query the lead database or prove acceptance.

## Staff endpoint inventory

| Method/path | Input/result | Permission |
| --- | --- | --- |
| GET `/auth/login`, GET `/auth/callback` | OIDC flow | State/nonce, approved redirect, staff allowlist |
| GET `/auth/session`, GET `/auth/csrf`, POST `/auth/logout` | Safe staff identity/capabilities, CSRF, session revoke | Active staff/MFA session |
| GET `/admin/leads` | `status,service,owner,dueBefore,q,cursor,limit` → safe list | Owner/admin all; manager assigned leads only |
| GET `/admin/leads/unassigned` | Minimal queue: id, service, receivedAt, summary category | Lead manager/admin; no full contact/message until claim |
| POST `/admin/leads/:id/claim` | `{expectedVersion}` → assigned detail | Manager; atomic only if unassigned |
| GET `/admin/leads/:id` | Authorised details, consent, notes, history | Owner/admin or assigned manager |
| PATCH `/admin/leads/:id` | `expectedVersion`, allowlisted fields, reason for status/reassignment | Scope + transition policy; manager cannot self-grant owner role |
| POST `/admin/leads/:id/notes` | Bounded plain text; optional correctionOfId | Scope, CSRF, idempotency key |
| POST `/admin/leads/export` | Bounded filters → async job ID | Owner/admin, reauth, audit, key |
| GET `/admin/exports/:id` | Job status; expiring private download if ready | Same authorised owner/admin; no public permanent URL |
| GET `/admin/notifications/failures` | Safe provider/job states without secrets | Owner/admin |
| POST `/admin/notifications/:id/retry` | Expected state/version → retry job | Owner/admin, CSRF/key; no resend of confirmed success |
| GET `/admin/audit` | Filtered safe actor/action/resource summaries | Owner/admin |
| GET `/health` | Minimal liveness | Public; detailed readiness internal |

Staff PATCH fields: `status`, `ownerId` (admin only), `nextAction`, `followUpAt`, approved contact corrections with reason. Expected version is mandatory. Stage history and audit committed atomically; legal edges in [backend](03-BACKEND-NODE-EXPRESS.md). Return 404 for another manager's record rather than leaking its existence.

Later email/booking webhook endpoints need selected-provider signature/dedupe specs before implementation. No `/training/enquiries` duplicate path at launch; training uses the same service enum and intake pipeline. No public CMS writes, autonomous AI outreach or scheduling confirmation fabricated from link clicks.

## Contract acceptance

Generate frontend mock fixtures and API tests from the same schema version. Test every required field, unexpected admin fields, incompatible conditional payload, unicode names, 5000-char boundary, false marketing choice, stale notice/token, replay after token refresh, concurrent duplicate, wrong scope, staff MFA/scope failure, stale version and export permissions.
