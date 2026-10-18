# 07 — Nextgen verification, deployment and recovery

All checks below are required implementation work, not checks already performed on an application.

## Acceptance matrix

| Test | Scenario / expected result | Evidence |
| --- | --- | --- |
| NQ-01 | First screen names company, four services, action; long headings fit phone | 390/1440 screenshots and owner content review |
| NQ-02 | Finder/menu keyboard, Escape/focus restore; static service links without JS | Component + manual browser |
| NQ-03 | Every CTA sets correct editable service; unknown query rejected/defaulted | Route tests |
| NQ-04 | Form validation/conditional fields/privacy/marketing false preserve meaning | Schema + browser |
| NQ-05 | Duplicate concurrent POST/timeout retry creates one lead/reference/job intention | Real DB integration |
| NQ-06 | Token refresh retains scope/key/hash; different payload/key conflict explicit | API integration |
| NQ-07 | Mail provider unavailable after commit: received shown, lead accessible, retry visible | Worker fault injection + staff UI |
| NQ-08 | DB failure before commit: no success/phantom lead; partial transaction rolls back | DB fault injection |
| NQ-09 | Crash after provider acceptance: reconcile/uncertain, no blind resend | Adapter + worker tests |
| NQ-10 | Visitor denied staff records; manager denied other assignment/export; revoked session/MFA enforced | Real HTTP permission matrix |
| NQ-11 | Stale staff version conflicts; stage history immutable; terminal reopen requires admin reason | DB + browser |
| NQ-12 | Source/generated HTML contain content/metadata but no drafts, leads or secrets | Build inspection |
| NQ-13 | Every public deep link works; unknown paths return 404; noindex thank-you/admin; direct thank-you is generic | HTTP tests against production-like host |
| NQ-14 | Analytics/logs/URLs contain no form PII; CSV injection neutralised; export expires | Security checks |
| NQ-15 | No unapproved email/logo/client/metric/accreditation/placeholder published | Content-schema validation + Ryan review |
| NQ-16 | Keyboard, screen-reader errors, 200% zoom/320px reflow, reduced motion, contrast | Manual record; automated a11y supplementary |
| NQ-17 | Backup restore preserves leads/history and reconciles mail jobs before restart | Restore rehearsal |
| NQ-18 | Failed content build leaves prior valid site live; dynamic draft slug absent | Deployment test |

Maps to original N01–N20 scenarios. A mock proves the UI handled its fixture, not that the real API stored an enquiry. A Lighthouse score does not establish accessibility compliance or conversion success.

## Environment and infrastructure

Static host/CDN, API runtime, worker runtime, managed PostgreSQL, selected mail and staff identity providers. Same-origin reverse proxy preferred. Separate staging/production origins, databases, secrets and sender destinations. Production browser variables only contain public API base/origin/build metadata; all provider credentials/database URL/session secrets stay server-side.

Config to implement: `APP_ENV`, `PUBLIC_ORIGIN`, `DATABASE_URL`, OIDC issuer/client configuration, session secret, submission-token signing secret, mail adapter/provider key, verified From address, approved staff destination, notice version and acknowledgement toggle. Production startup refuses missing mandatory values and test adapters. Never populate unknown contact destinations from the parent prototype.

Enforce TLS, security headers/CSP tailored to actual assets, exact origin checks, CSRF on staff mutations, session expiry/revocation, body bounds, parameterised SQL, shared rate-limit backing when scaled and correct proxy trust. Host private previews behind authentication; noindex/robots are not access controls.

## Build and deployment contract

1. Clean lockfile install → lint/typecheck → content validation → unit/contract/integration tests.
2. Pre-render/build → inspect HTML and route-data files for drafts/PII/secrets → production-like HTTP/keyboard/browser checks.
3. Apply reviewed additive migrations using deployment credentials; smoke compatible API and worker.
4. Upload immutable static build, then atomically switch release only when validation passes. Keep previous release if generation fails.
5. Route `/api/v1/*` to API before static fallback. Serve existing HTML/assets/data at correct paths; fallback only under known `/admin/*`; unknown public paths return custom content with status 404.
6. Confirm approved canonical domain, TLS, sender DNS/account, recipient inbox, real enquiry persistence, staff access, notification operations and rollback.
7. Ryan signs public content and operational ownership before separate authorised publication.

No Vite dev server in production; static hosting cannot execute Express or server route actions. Check platform rewrite/header support before choosing a host. Use backward-compatible API changes while old static clients may be cached. Cache hashed assets long; public HTML per release; private API `no-store`.

## Performance targets

Aim public-route initial JavaScript ≤180KB gzip, LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at the 75th percentile where field data exists. Before traffic, document lab profile and measurements, not fictitious field metrics. Reserve media dimensions; prioritise actual hero only; lazy-load below-fold content; subset fonts; code-split admin/demo code. No analytics/chat/scheduler waterfall blocking core content.

## Monitoring and incident handling

Measure intake error/latency, committed leads vs notification jobs, oldest due job, failed/uncertain mail, staff auth failures and public uptime. Logs carry request/job IDs and error codes, not contact/message data. Disable contact/admin session replay. Deduplicate conversion from accepted submission, not every thank-you visit.

Mail outage: continue durable intake if DB is healthy; staff work from lead list; retry known failures, reconcile unknowns; don't falsely promise delivery. DB outage: form reports unavailable/uncertain, retains page-memory values, reuses key. Spam spike: tighten bounded rate/challenge rules without silently losing real enquiries. Bad content release: switch back static artifact, preserve leads. Auth compromise: revoke sessions/identity access, audit affected lead access, follow approved incident procedure.

Backups: encrypted snapshots/PITR where available, owner-approved retention; proposed pilot RPO ≤1h/RTO ≤4h only after tested. Restore into isolation, verify lead/consent/history, then reconcile external mail before enabling workers. Record incident owner and support contact in private operations docs, not public frontend.

Privacy/retention/legal wording must match actual Malaysian business processing and selected providers; qualified review is a launch gate, not a claim this document certifies compliance.
