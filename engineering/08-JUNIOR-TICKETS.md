# 08 — Nextgen junior assignment board

FE = frontend, BE = backend, DATA = database, QA = verification, CONTENT = Ryan/designated content owner. Dependency order is not a promised calendar schedule.

| ID / owner | Depends on | Deliverables / target modules | Acceptance |
| --- | --- | --- | --- |
| N-01 / Lead+BE | None | Workspace/scaffold/version matrix, API/worker/config, contract package, CI | Clean checkout documented; production refuses test auth/mail; no parent starter overwrite |
| N-02 / FE+CONTENT | N-01 | Typed company/service/legal models, approval metadata, content manifest/checker | Unknown facts marked not approved; production fails missing mandatory content |
| N-03 / FE | N-01,N-02 | Tokens, Container/Button/Field, header/mobile menu/footer, component gallery | Uses DESIGN; full state coverage; keyboard/mobile/zoom evidence |
| N-04 / FE+CONTENT | N-02,N-03 | Home, Services, 3 details, Training, About, approved legal/error templates | Four services clear; approved or development-labelled copy; no invented proof |
| N-05 / FE+BE | N-01,N-02 | Enquiry schemas/OpenAPI, token/session endpoint, idempotency/error fixtures | Frontend/backend agree enums/limits; expired token and replay contract covered |
| N-06 / FE | N-03,N-04,N-05 | ServiceFinder, contextual Contact, conditional fields, submission state machine, thank-you | 422/409/429/offline/uncertain handled; same attempt reused; direct thank-you generic |
| N-07 / DATA+BE | N-01,N-05 | Lead/consent/key/history/outbox migrations, atomic intake service | Concurrent duplicates → one lead; outbox failure rolls back; no success before commit |
| N-08 / BE | N-07 | Mail adapter, leased worker, backoff, failure/uncertainty records | Provider outage doesn't lose leads; crash after acceptance reconciles; no false delivered claim |
| N-09 / Lead+BE | N-01,N-07 | Staff OIDC/MFA/session, role/scope policy, initial owner provisioning runbook | Visitors denied; managers scoped; no shared password/test bypass; lead reviewer approval |
| N-10 / FE+BE | N-08,N-09 | Lead list/detail/claim/status/notes/follow-up; failure queue; audited export | Version conflict, controlled reopen, scope and CSV-injection tests; leads usable when mail is down |
| N-11 / FE+QA | N-04,N-06 | Pre-render manifest, metadata/sitemap/robots/social, production host routes/404 | Meaningful HTML without JS; no draft/admin PII; deep links and real 404 verified |
| N-12 / QA+Lead+CONTENT | N-07–N-11 | NQ matrix, performance report, restore/runbooks, content/contact/sender review | Real staging enquiry+staff path; no unapproved facts; named incident owner; Ryan release sign-off |

First demonstrable slice: N-01 → N-03/N-04 → N-05/N-06 → N-07/N-08/N-09/N-10 → N-11/N-12. FE works against agreed fixtures while BE implements persistence, but the slice is not complete until wired to the real API.

## Deferred tickets — require separate scope approval

N-X1 approved work/case-study publishing; N-X2 insights/blog; N-X3 CMS and build approval workflow; N-X4 reviewed BM locale; N-X5 booking adapter; N-X6 training registration/payment; N-X7 bounded website assistant. None is a prerequisite for the core enquiry launch, and no junior should implement them just to fill a navigation menu.

## PR acceptance template

```text
Ticket / user outcome:
Pages, modules and shared contracts changed:
Data migration / content approval impact:
States tested (happy, empty, error, permission, retry):
Commands actually run / results:
Screenshots, generated-HTML or API evidence:
Unverified business inputs / limitations:
Reviewer / release dependency:
```

FE PR reviewer checks token reuse, page hierarchy, content truth and keyboard/mobile behaviour. BE reviewer checks atomicity, replay scope, permissions, safe logging and real DB tests. CONTENT approval is separate from compilation. Lead must approve auth/export/migration/production changes. “Email API returned 200” is not proof that an enquiry is stored or that the staff received it.
