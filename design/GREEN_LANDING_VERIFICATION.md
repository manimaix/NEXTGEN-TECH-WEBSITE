# Green landing-page verification — 25 September 2026

Scope: home route, with its own header and footer. Other routes and API source were not redesigned.

## Checked

- TypeScript: `npm run typecheck` passed.
- Production build: `npm run build` passed; 12 public routes prerendered plus SPA fallback. Existing React Router future warnings and dependency annotation warnings remain.
- Playwright: desktop 1440, wide 1920, ultrawide 2560, tablet 768, phone 390 and narrow phone 320 pixels. No document overflow or out-of-bounds landing elements in the measured set. Screenshots exclude the browser's 15px scrollbar.
- Self-hosted Anybody display font loaded. Manrope supplied from the installed font package.
- Comparison: full Before/After reveals, native slider ArrowRight/Home/End, pointer capture beyond both edges, horizontal trackpad scrolling, and unchanged value on vertical wheel passed. Request/draft/review tabs, arrow navigation, local review acknowledgement and reset on stage change passed. The example uses static illustrative content and sends no requests.
- Chromium touch emulation: horizontal swipe changed the reveal to 25%; a vertical swipe scrolled the page and kept the reveal at 50%. This is browser emulation, not a physical-device test.
- Service and FAQ disclosures passed.
- Mobile menu opens and closes with Escape.
- Main contact link navigated to /contact and the existing SiteHeader rendered after the route settled. The initial automated check was too early; a settled follow-up confirmed the header and no landing-world wrapper.
- Reduced-motion captures passed. The comparison follows input directly without autoplay or an entrance animation.
- No page errors in the final landing interaction run.
- The earlier landing detector returned [] before the comparison refinement. It was not rerun as an additional polish loop. The new comparison received a manual scoped craft review against the explicit home brief.

## Scaling correction

Ryan reported that the page did not scale to the browser. The first implementation capped content at 1328px, creating approximately 289px margins at a 1920px viewport. The cap has been removed. The container now uses fluid gutters, and desktop type/components scale above 1440px. The preview was restored from the phone test width to 1920 × 1080.

The independent finish review requested two additional responsive fixes. The service links now precede the example in mobile reading order and layout. On ultrawide screens the example is start-aligned in a more balanced two-column grid, keeping it closer to the headline without stretching its text measure. Build, typecheck and all six viewport/interaction checks passed again after both changes.

## Limits

This is a landing-page design trial, not Ryan's approval of a new site-wide system. The website's local PGlite API failed startup with a WASM unreachable error before design work. The frontend preview runs independently at http://127.0.0.1:5174/. Enquiry submission was not retested and is not claimed to work in this session. No database files or API implementation were changed.

No new raster asset is shipped by this landing page. Fonts are locally hosted; Anybody licence is in apps/web/public/fonts/anybody-LICENSE.txt.

## Evidence

Screenshots and executable Playwright CLI checks are under output/playwright/. Current screenshots have comparison- prefixes; green-home- files show the previous version. Current verification script: output/playwright/verify-workflow-comparison.js. The 1920 × 1080 viewport capture is comparison-wide-viewport.png. Whole-page desktop/mobile captures are comparison-desktop.png and comparison-mobile.png.

## Comparison refinement review

- Batched initial screenshots exposed a legacy workflow connector class collision and excessive desktop diagram height. A single fix batch renamed the colliding classes, tightened the panel, added a complete screen-reader description, shortened the visible instruction caption, and preserved vertical touch scrolling.
- Confirmation across 320, 390, 768, 1440, 1920 and 2560 pixels: no document overflow, no out-of-bounds landing elements, and neither comparison layer extends below its viewport. Both full-reveal endpoints were captured and inspected.
- Final TypeScript and production build passed. The build prerendered 12 public routes and the SPA fallback. Dependency annotation and future-option warnings are pre-existing.
- No uncaught page errors in the final interaction run. The first test had a screenshot-induced caret-style hydration warning; the final capture run used caret: initial and did not repeat it. Contact navigation still reports API session failures because the existing local API is unavailable; this is not a claim of successful enquiry submission.
- HRD Corp registration is based on Ryan's explicit confirmation. Wording follows the official Claimable Courses terminology: https://hrdcorp.gov.my/program-registration-hrd-corp-claimable-course . No external verification of Nextgen's course register was performed.
- Independent finishing agents were unavailable due to their usage limit. The final review and documentation pass were performed inline, not independently. Global legacy design documents were preserved; scoped changes are recorded in .impeccable/landing-green-brief.md.
