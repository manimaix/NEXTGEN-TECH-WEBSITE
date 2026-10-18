# Public pages — verification and handoff

Implemented 27 September 2026; final correction and build checks completed 28 September 2026.

## Scope

The approved green homepage identity now covers the services directory, consulting, application development, AI agents and integration, training, About, contact, acknowledgement, privacy, website information and not-found pages. The homepage composition and the existing enquiry logic were preserved; staff screens remain outside the public style wrapper.

Reference inspection used City Museum's About, Groups and Contact pages for confident typography, distinct coloured regions and clear wayfinding. No reference imagery, commercial proof, staff photographs or client claims were copied or invented. Anybody and Manrope remain the approved fonts. Impeccable guided page differentiation and the bounded review; Emil's guidance informed focus, press feedback, restrained motion and touch-safe states.

Ryan confirmed the courses are already registered as HRD Corp-claimable and requested “Placeholder” for missing official catalogue information. Course name, audience, duration, format and outline are therefore explicitly Placeholder. No course IDs, durations, certification numbers or guaranteed claims were fabricated.

## Checks

| Check | Result | Scope |
| --- | --- | --- |
| TypeScript check | Passed, 28 Sep | npm run typecheck |
| Production build and prerender | Passed, 28 Sep | npm run build; public routes emitted successfully |
| Responsive route batch | Passed, 27 Sep | 11 routes at 320, 390, 768, 1440 and 1920px; 55 checks; no overflow, duplicate h1 or page errors |
| Disclosure/navigation | Passed, 27 Sep | Course outline opens; mobile menu closes on route selection and Escape, with restored focus |
| Contact selection and states | Passed with browser simulations, 27 Sep | Service preselection, conditional training/AI fields, offline send disabled, reconnect retains values, invalid-submit focus, uncertain-send retry, stable idempotency key, synthetic acknowledgement |
| Final heading correction | Passed, 28 Sep | Both AI demonstration headings retain authored line breaks at all five widths; no horizontal overflow |
| Review verdict | ship, scoped to the scored visual fix | Inline fallback; independent reviewer could not run due its usage limit |

Build emitted existing dependency annotation and React Router future-flag warnings, not build failures. The final browser console check contained React DevTools informational messages only.

## Evidence

Browser scripts: output/playwright/verify-public-pages.js and output/playwright/verify-public-headings.js.

Desktop/mobile full-page captures: output/playwright/public-{services,consulting,development,ai,training,about,contact,privacy,terms,acknowledgement,not-found}-{1440,390}.png. The AI pair was refreshed after the final correction. First-viewport captures additionally cover services, training, About, contact and AI. public-acknowledgement-simulated.png contains a synthetic browser-only reference, not a stored enquiry.

Review records: .impeccable/review/public-pages-finish.md, public-pages-verdict.md and public-pages-documenter.md. Global DESIGN.md and PRODUCT.md brand guidance are stale and were not overwritten without a separate request; the green surface briefs document the approved scoped authority.

## Final correction

| Before | After | Why |
| --- | --- | --- |
| Mobile demonstration CSS hid all h2 line breaks, producing “See thedivision” and “groundwork.People”. | Removed that broad rule; original authored line breaks are visible. | Preserve readable words and the intended human-versus-AI message without changing the shared workflow component. |

## Limits and release gates

- The local enquiry API was unavailable during the preceding UI checks. Browser mocks exercised UI behavior only; no real enquiries were submitted and no email delivery was tested. The frontend preview was restarted on port 5174 on 28 September; this does not restore the backend.
- Final business contact details, official course information and approved public legal wording are still owner-supplied release gates. Existing local-development notices remain visible.
- Automated reflow checks and an inline review do not constitute independent accessibility certification or Ryan's aesthetic approval. Real-device touch behavior was not tested.
- No new raster assets were shipped. Existing self-hosted fonts and code-native UI were reused.
