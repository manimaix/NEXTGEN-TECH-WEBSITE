# Site images verification handoff

Prepared 8 October 2026. Historical execution results below were supplied by the coordinator and confirmed through 2 October; they were **not rerun on 8 October**. This agent's current checks were limited to reading the brief, source, tests, manifest and capture script, and checking artifact presence/metadata. The coordinator's 8 October runtime smoke is recorded separately below.

## Scope and current contract

The scoped UI/source finish received **SHIP on 2 October**, not a production-readiness verdict. The authority is `.impeccable/site-images-brief.md`: choose a placement, preview the crop, explicitly publish inside the existing staff workspace. Preserve the approved green identity, native file upload, draft/error retention, crop preview, confirmed reset and visible AI/fictional-staff disclosures.

- Six fixed placements: `about-workplace`, `about-team`, `team-1`, `team-2`, `team-3`, `training-workshop`. Alt text, caption, portrait name/role and focal coordinates are editable.
- Public reads: `GET /api/v1/site-images` and `GET /api/v1/site-images/:slot/file`. Staff list/update/reset: `GET /api/v1/admin/site-images`, `PUT` / `DELETE /api/v1/admin/site-images/:slot`.
- Uploads accept non-animated JPEG/PNG/WebP, at most 5 MiB (5 × 1024 × 1024 bytes) and 25 megapixels. The server checks decoded format against MIME, re-encodes to WebP, strips metadata and fits within 2400 × 2400 without enlargement.
- Staff sessions, origin and CSRF protect writes. Photo bytes, details, version increments and audit events are persisted transactionally; stale expected versions return 409. Metadata-only edits preserve bytes.
- Reset removes the current uploaded bytes/details and restores the labelled default while advancing the version. There is no image history or recovery of the removed upload.

Source anchors: `packages/contracts/src/site-images.ts`, `apps/api/src/site-images.ts`, `apps/api/src/app.ts`, `apps/api/src/db.ts`, `database/migrations/002-site-images.sql`, `apps/web/app/components/{ImageManager,SiteImages}.tsx`.

## Historical verification

| Date | Evidence and result |
| --- | --- |
| 28 September | Real browser flow uploaded a generated photo to `about-workplace`, edited crop/alt/caption, aborted one PUT and retained the draft, then published, reloaded and checked the public About view. Reset removed only that QA upload. |
| 28 September | All 20 responsive checks passed: admin editor, portrait editor, About and Training at 320, 390, 768, 1440 and 1920 px. No horizontal overflow, broken images or page errors were reported. |
| 2 October | Pascal fixed the repeated-group base64 regex that exhausted the stack on valid large uploads. The current contract uses a simple alphabet/padding regex plus a multiple-of-four length check. |
| 2 October | `npm run typecheck` PASS; `npm test` **25/25 PASS**; `npm run content:check` PASS; `npm run build` PASS once. React Router future/dependency-annotation warnings were nonblocking. |
| 2 October | The main app restarted against its existing database without deletion. Six placements loaded; draft edit/discard, portrait selection and public About/Training with AI disclosures were checked. A cold Vite `504 OutdatedOptimizeDep` cleared on reload; no repeated source fix was required. |

`tests/site-images-contract.test.ts` covers the full 5 MiB base64 boundary, over-limit input, alphabet, padding, length and malformed input. `tests/site-images-persistence.test.ts` uploads a real PNG larger than 4 MiB and verifies WebP bytes, metadata, versions, audit events, conflicts and reset across **three disk-backed PGlite reopenings**. It uses its own temporary directory, validates its exact location before cleanup and never deletes the application's database. `tests/site-images.test.ts` also covers protected writes, forged formats, metadata stripping, resize, concurrent version conflicts and reset. Reading these tests on 8 October does not establish a new pass.

## 8 October coordinator runtime smoke

The coordinator restarted the local development preview using the existing persistent database without reset. `/admin?section=images` loaded and the local staff shortcut succeeded. Snapshot `.playwright-cli/page-2026-10-08T09-53-22-581Z.yml` contains all six placements and the editor; no initial 504 occurred this run. No saved images changed. The coordinator reports unchanged source and no test rerun; automated test/build passes remain dated 2 October. This entry records coordinator-supplied evidence, not an independent browser check by this agent.

## Design finish and evidence

The fresh Impeccable finish review on 2 October explicitly opened all eight full captures and recorded five review sections, including persistence PASS. Its disposition was **SHIP**: TYPE/MATERIAL/GROUND and THESIS/OWN-WORLD/STORY/FIRST-VIEWPORT/FORM matched the brief and visible behavior; responsive reflow was adaptation. The review recorded the ceiling reached and no material fixes.

The 2 October detector reported only two advisory undocumented colors, `#e1f47c` and `#143b2d`, at `apps/web/app/styles/site-images.css:397–398`, compared with the obsolete global `DESIGN.md`. These selection colors remain present; the approved green direction is unchanged. Global documentation drift is reported, not repaired by this handoff.

Eight full-page captures remain in `output/playwright/`, with file modification dates of 28 September (metadata corroborates artifact age, not an execution pass):

| View | 1440 px | 390 px |
| --- | --- | --- |
| Admin | `images-admin-1440.png` | `images-admin-390.png` |
| Portrait | `images-portrait-1440.png` | `images-portrait-390.png` |
| About | `images-about-1440.png` | `images-about-390.png` |
| Training | `images-training-1440.png` | `images-training-390.png` |

The retained browser workflow is `output/playwright/verify-site-images.js`; it was read, not executed, for this handoff. The captures were not visually re-reviewed here.

Provenance: `design/placeholder-images.json` records prompts, generated-image sources and the 28 September fictional-placeholder origin. All **six rasters, zero missing**, and their `.webp.json` sidecars exist in `apps/web/public/images/placeholders/`: `about.webp`, `team.webp`, `portrait-1.webp`, `portrait-2.webp`, `portrait-3.webp`, `training.webp`. These are illustrative AI assets, not evidence of actual staff, premises or training.

## Boundaries

Current source inspection found no obvious contradiction to the supplied historical behavior. This agent ran no tests, build, browser flow, detector or new finish review. Existing authentication is **local development only**; external PostgreSQL was not verified. This document does not certify production readiness, deployment, accessibility compliance or behavior of the complete 8 October site. Only this new handoff file was written; all other source/docs, including the separately owned README, were preserved.
