# Workflow comparison revamp — 25 September 2026

Scope: replaced WorkflowComparison.tsx and workflow-comparison.css only. Approved home typography, palette, services, training, header/footer, routes and backend implementation were preserved. The existing component filename remains because its role is still comparison.

## Visual changes

| Before | After | Why |
| --- | --- | --- |
| Two overlapping paper panels with clipped sentences | Two complete scroll-snapped diagrams | Each workflow can be read without reconstructing split text. |
| Three step tabs, reveal slider, next-step buttons and review action | Before/After selection and one next-scene action | One interaction model; the three-stage story remains in the connected diagram. |
| Repeated message and result cards | Routing lines, source branches and distinct process stops | The relationship between request, context, draft and human decision is the focal content. |
| Mobile-only decorative connector fragments | Shared responsive source paths | The small-screen branches connect to their actual destinations. |

## Verified

- TypeScript passed before the browser pass; final check run after the connector/resize fixes.
- Production build passed: 12 prerendered public routes plus SPA fallback. Existing dependency-annotation and React Router future-option warnings remain.
- Captured and inspected complete scenes at 320, 390, 768, 1440, 1920 and 2560px. Document scrollWidth equals viewport width at all six sizes. The generic bounds scan reported the closed mobile menu's hidden SVG descendants; no comparison or document overflow was found.
- Before/After tabs and Home/End/arrow keys select complete scenes immediately.
- Mouse drag, horizontal wheel, next-scene buttons, Chromium-emulated touch swipe, vertical touch page scrolling and responsive snap alignment passed. No physical phone test is claimed.
- No uncaught page errors in the final interaction run. The initial headed test browser closed unexpectedly after the viewport captures; the full confirmation ran successfully in a fresh browser session.
- Reduced-motion captures and control paths tested. The diagram has no autoplay or looping motion. No new dependency or raster asset was introduced.

## Evidence

- output/playwright/verify-flow-revamp.js
- output/playwright/revamp-wide-viewport.png
- output/playwright/revamp-desktop.png and revamp-mobile.png
- output/playwright/revamp-before-wide.png and revamp-before-small.png
- Other revamp- captures cover tablet, narrow phone and ultrawide.

The older comparison- captures and verification scripts describe the rejected implementation. Current scope and interaction decisions are in .impeccable/landing-green-brief.md. Global design-document drift remains outside this focused revamp.

This is a visual/interaction revision for Ryan to judge, not independent aesthetic approval. No enquiry API or live-AI verification was performed; the prior backend limitation was not addressed.
