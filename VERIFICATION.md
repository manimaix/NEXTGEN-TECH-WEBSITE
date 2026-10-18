# Local implementation verification

Verified on 22 September 2026 with Node 22.13.1, React Router 7.18.4 and Vite 7.3.6. This records a local development milestone, not production certification.

## Automated checks

- Strict TypeScript: `node node_modules/typescript/bin/tsc --noEmit` passed.
- API/database integration: `node node_modules/tsx/dist/cli.mjs --test tests/api.test.ts` — 13 tests passed. Real HTTP requests and isolated PGlite transactions cover validation, privileged-field rejection, origin/token/CSRF enforcement, concurrent intake idempotency, token-refresh replay, explicit mail unavailability, version conflicts, legal stage transitions, append-only notes, changed-note retry conflicts, missing leads, rollback, malformed JSON and payload limits.
- Build: `node scripts/build.mjs` passed, generating 12 prerendered routes plus the staff SPA fallback. Dependency annotation warnings from Zod are non-fatal.
- Content model check passed for four services.
- Release check intentionally fails for domain, email, content approval and privacy approval. Do not bypass it to publish.

## Browser checks

Isolated Chrome via Playwright CLI against the built local server at `http://127.0.0.1:5174`:

- Desktop 1440px and mobile 390px captures inspected for homepage, contact, services and training. Evidence is in `output/playwright/`; review copies are in `.impeccable/review/` (both ignored).
- Mobile menu opens and dismisses with Escape. Service finder selection changes the recommendation and passes the selected service into the contact form.
- Empty form displays an error summary and field errors; editing a field clears its stale error. Narrow-screen training form measured 360px document width at a 360px viewport. Reduced-motion media emulation enabled successfully; this is not an exhaustive accessibility audit.
- Synthetic enquiry `NG-DEA0FDDAC531F1` was saved through the UI. Staff saw the same reference, changed its stage to `triaged`, set a next action and added an internal note. The record survived an API restart. Only synthetic details were used; no email was sent.
- Fresh page-error capture over home, three service detail routes, training, about, service-prefilled contact, privacy, website information, acknowledgement and an unknown URL reported no JavaScript errors.
- Unknown route returned HTTP 404. Direct acknowledgement without this browser's saved reference does not claim a new enquiry was received.
- Fixed an initial hydration mismatch on query-prefilled contact routes by applying the query selection after hydration.

## Scope and remaining work

The PostgreSQL server adapter has not been exercised against an external server. The embedded database was tested. No production identity provider, mail worker/provider, shared rate limiter/session store, audited export system, backup restore drill or public deployment is included. See README.md and the original engineering pack for these remaining items.

Impeccable's detector was attempted once but could not start because engine 0.1.5 was unavailable and its cache directory could not be created. Direct guidance and screenshot review are used instead; this is not a detector pass.

## Independent design review

The independent Impeccable reviewer returned `fix` for three items: the finder's extra kicker, a text-glyph FAQ icon, and overly tight wordmark tracking. These were corrected in one batch, rebuilt, typechecked and recaptured across the same six views. The verdict pass returned `ship`: all three listed fixes resolved, no introduced regressions observed. This verdict covers those scored fixes, not production certification. Final review captures are in `.impeccable/review/`; earlier `output/playwright/` images are pre-review evidence.

## Polish corrections

| Before | After | Why |
|---|---|---|
| Field errors remained while the corrected value was entered | The edited field's stale error clears; submission validates again | Avoid contradictory feedback |
| Query-prefilled contact HTML differed during hydration | Stable initial HTML, then service-specific fields | Avoid React hydration errors |
| Hidden skip link could appear in full-page capture | Clipped until focused, still keyboard accessible | Preserve a clean surface without removing navigation support |
| Note operation keys silently accepted changed payloads | Conflicting lead/text reuse returns 409 | Keep retry semantics truthful |
