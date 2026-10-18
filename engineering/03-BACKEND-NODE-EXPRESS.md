# 03 — Backend stack: enquiry API and staff workflow

Owner: backend junior. This is a small operational backend, not a CRM platform. Read [database](04-DATABASE-POSTGRESQL.md) and [API](05-API-CONTRACTS.md).

## Modules

`submission` issues anonymous submission tokens and checks abuse controls. `leads` validates/stores enquiries and owns stage transitions. `staff` manages authenticated permissions and assignments. `notifications` owns durable provider delivery and failure recovery. `exports` handles authorised, expiring downloads. `audit` records administrative actions. Content remains source-controlled at launch; there is no public arbitrary content-write API.

Module layout: `routes.ts`, `service.ts`, `repository.ts`, `policy.ts`, tests. Shared contracts contain only public schemas and types. Use a single transaction client, dependency-injected clock/mail adapter and pure transition policy.

## Public intake transaction

1. Bound body size (proposed 32KB JSON), validate content type/schema and exact allowed origin. Apply shared rate limits plus accessible abuse checks. Never return fake success for a rejected submission.
2. Verify signed submission token matches the anonymous HttpOnly cookie scope. Token is anti-abuse/CSRF context, not permission to read leads. Reject invalid token with actionable error.
3. Canonicalise validated fields and hash the payload excluding short-lived token/CSRF fields. Preserve meaning; do not aggressively rewrite names/messages. Stable operation key belongs to cookie scope + `create-enquiry`.
4. In one DB transaction acquire the unique key; matching replay returns stored reference, mismatch returns 409. Insert lead (`new`, owner null), privacy/marketing records, initial stage event, notification jobs and replay result.
5. Commit before returning 201 `{reference,status:'received'}`. No external email call within this transaction.

Anonymous scope cookie proposal: 7 days; submission token 24 hours, refreshed in same scope; key mapping 7 days. Exact durations need retention review. A refreshed token must not change the payload hash. Replays return existing result even if service copy/notice version later changes; new submissions must use currently accepted notice versions. Loss of cookie/scope means no public recovery of private records by reference/email; show honest uncertainty and support route rather than exposing a lookup.

No file upload at launch. Honeypot/time checks are signals; handle suspicious traffic with explicit validation/challenge/rate limit rather than quietly discarding a potentially real lead. A shared office IP alone is not proof of abuse. Optional challenge provider is a later configured adapter with an accessible alternative.

## Lead workflow and permissions

Canonical status: `new | triaged | contacted | qualified | proposal | won | lost | closed | disqualified | spam`.

| Current | Allowed next | Requirement |
| --- | --- | --- |
| new | triaged/disqualified/spam/closed | Authorised staff; reason for terminal/exclusion |
| triaged | contacted/disqualified/spam/closed | Assigned owner; reason where closing |
| contacted | qualified/lost/closed/disqualified | Human follow-up; no automated worth score |
| qualified | proposal/lost/closed | Recorded next action |
| proposal | won/lost/closed | Outcome reason; not a public revenue claim |
| won/lost/closed/disqualified/spam | triaged | Owner/admin only; explicit reopen reason |

Every mutation requires expected version, row lock/conditional update and audit/status event; return 409 on stale edits. Notes are separate append-only staff entries; correcting a note adds a correction linked to it. Assignment, follow-up date and safe contact corrections are allowlisted changes; don't permit generic arbitrary JSON patches.

Owner/admin: all leads, assignment/reassignment, controlled reopening, staff access, restricted audited export and notification retries. Lead manager: own assigned leads only; may triage from a minimal unassigned queue and atomically claim a lead; no bulk export or role changes. Content editor later has no lead access by default. MFA is required for staff. Do not infer access from hiding `/admin` in navigation.

## Notification/outbox policy

One lead produces one staff-notification intention, plus optional acknowledgement if the owner enables it. Dedupe key = `leadId:kind:templateVersion`. Job references lead ID rather than storing a second permanent raw message. Use a verified server-owned From address; validated visitor email may be Reply-To. Escape template text and reject header injection. Do not automatically send follow-up campaigns.

Worker leases due DB jobs, sends outside transaction, records provider ID/state, completes conditionally, and retries transient failures with backoff/jitter. Preserve provider idempotency key. If provider accepted mail but local process crashed, query/reconcile when supported; without provider idempotency/status lookup, mark uncertain for operator review rather than promise exactly-once delivery. Retries do not create another lead.

States: pending, leased, retry, sent (provider accepted), failed, uncertain; optional signed delivery events later track delivered/bounced separately. “Sent” is not proof of inbox delivery. Permanent failure visible in staff operations, with authorised retry that first checks existing success/uncertainty. Email outage must leave committed enquiry accessible.

## Staff authentication/security

Use a maintained OIDC SDK; server sessions validate provider subject, active staff record and MFA. CSRF for cookie mutations, Secure/HttpOnly session, revocation, safe recovery through identity provider. Development stub explicitly disabled in production. Validate origin/host and trusted proxy configuration. Parameterised SQL, body bounds, restrictive CORS/security headers, allowlisted update fields.

Logs/analytics never contain name/email/phone/message/credentials. Redact validation errors to field codes, not submitted content. Notes and exports are private. CSV exports neutralise formula-leading characters and use expiring audited downloads; owner reauthentication required. No public `GET /enquiries/:reference` exposing records.

## Operational acceptance

Test duplicate simultaneous intake, rollback on outbox failure, DB outage with no success, mail outage with durable success, signature/token errors, manager cross-assignment denial, stale version, controlled reopening, CSV injection and worker crash uncertainty. External integrations must have staging/test accounts and an approved production owner.
