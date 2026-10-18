# AI and human work story — 27 September 2026

Scope: homepage workflow component and homepage sizing only. Replaces the 25 September comparison described in FLOW_REVAMP_VERIFICATION.md. Other route designs, enquiry destinations and API code are unchanged.

## What changed

- One customer enquiry follows five actual tasks. Without AI, a person does all five. With AI assistance, AI handles reading, policy retrieval and drafting; people check the facts and approve/send.
- Both responsibility columns remain visible. Selecting a task reveals the illustrative output or human decision. The initial draft is explicitly not sent.
- Keyboard arrows, Home/End, previous/next, touch swipes and reduced-motion behavior are supported. Native vertical touch scrolling is preserved. The live region remains mounted when details change.
- Removed the old before/after carousel and its diagram styles. Retained the existing exported component name and homepage integration.
- Removed wide-screen text inflation. At 1920px the headline is 84px and header 80px (formerly about 129px and 120px). Hero ends at approximately 877px, exposing Technical services at 1920 × 1080. Content width caps at 1600px; background bands stay full-width.
- Impeccable informed hierarchy, task ownership and page density. Emil's guidance informed immediate keyboard changes, subtle pointer-only feedback and the stable detail area.

## Checks performed

Final commands: `npm run typecheck` and `npm run build` both passed. The build retains third-party Zod annotation and React Router future-flag warnings.

Browser script: `output/playwright/verify-work-story.js`, Chromium through Playwright CLI at `http://127.0.0.1:5174/`.

Tested viewport widths: 320, 390, 768, 1440, 1920 and 2560px. No horizontal document overflow at any tested width. Headline sizes: 38, 42.12, 46, 79.2, 84 and 84px respectively.

All five ownership mappings and selected-state changes passed. Draft disclosure, the human edit/reject handoff, keyboard focus, Home/End, previous-at-start disabled state, reset from last step, normal/reduced-motion behavior, mobile menu Escape, services disclosure, FAQ disclosure and HRD training copy checks passed.

All five details preserve panel height at desktop, 390px and 320px. Emulated touch horizontal swipe selects the next task; vertical touch swipe scrolls the page without changing the task. Browser page errors: none. Final layout detector: no findings.

Visual review: desktop viewport, tablet/full-page layout, phone/full-page layout and phone detail were inspected. A single adjustment batch aligned the example to the outer grid, made every desktop task target at least 44px tall and kept the live region persistent. Final captures were inspected without a further polish loop.

## Current captures

- `output/playwright/work-story-desktop-viewport.png`
- `output/playwright/work-story-1440.png`
- `output/playwright/work-story-1920.png`
- `output/playwright/work-story-768.png`
- `output/playwright/work-story-390.png`
- `output/playwright/work-story-mobile-demo.png`
- `output/playwright/work-story-human-check.png`

## Limits

This is an illustrative frontend interaction, not live AI, a policy repository, order lookup or email integration. No speed/savings figures or client performance claims were invented. The existing local API startup issue is outside this change; no enquiry submission was tested. Touch was emulated in Chromium, not checked on a physical phone; Safari/Firefox and an actual screen reader were not tested. No new raster assets were created. Technical checks do not substitute for Ryan's visual approval.
