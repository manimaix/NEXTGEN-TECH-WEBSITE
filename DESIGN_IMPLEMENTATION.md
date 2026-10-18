# Nextgen Tech design implementation record

Source review: 22 September 2026. Scope: documentation of the completed local-development implementation, extending the existing approved visual world. This record is descriptive; `DESIGN.md` remains the design authority. It does not approve the deviations below or replace the engineering requirements.

Only this file was written during the documentation pass. `PRODUCT.md`, `DESIGN.md`, `.impeccable/surface-brief.md`, application code, README and verification records were preserved. No `.impeccable/design.json` was present in the inspected directory; none was created. No schema migration was performed.

## Evidence and verification boundary

The evidence is the current source: `apps/web/app/styles/tokens.css`, `global.css`, `root.tsx`, the shared components listed below, and home/contact/acknowledgement route code. Product constraints come from `PRODUCT.md`; composition comes from `.impeccable/surface-brief.md`; the comparison baseline is the incumbent `DESIGN.md`.

This pass did not run a browser, render pages, execute tests or build the application. CSS and event handlers establish implementation intent, not demonstrated accessibility, contrast, layout or runtime correctness. `VERIFICATION.md` records earlier local tests and browser checks; those results were not independently repeated here, and should not be interpreted as fresh validation of the three finish edits. The Impeccable context launcher failed because engine 0.1.5 was unavailable and its cache could not be created; its documentation guidance and project files were read directly. No detector pass is claimed.

## Design-to-code mapping

The implementation retains the warm editorial technology identity: paper-coloured canvas, violet actions, restrained surfaces, Manrope, numbered service rows and a practical service finder. The homepage keeps the headline/action before the finder in document order, followed by service rows, process, illustrative AI workflow, delivery questions, training, FAQ and closing enquiry action (`routes/home.tsx`).

Paths in the following tables are relative to `apps/web/app/` unless stated otherwise.

| Approved design | Actual source and values | Assessment |
| --- | --- | --- |
| Warm neutral foundation | `styles/tokens.css`: `--canvas: #f4f3ef`, `--surface: #fff`, `--text: #22212b`, `--muted: #605e69`; body and surface sections consume them in `global.css` | Matches canvas, surface, text and textMuted values; `--muted` is the implementation name for textMuted. |
| Violet action hierarchy | `--action: #5145cd`, `--action-hover: #4036a8`, `--action-soft: #eeebff`; buttons, selected finder option, links and training band consume these | Matches. White action text is literal `white`, rather than a dedicated onAction token. |
| Borders and honest status | `--border: #d8d5e0`, `--control-border: #777380`, `--danger: #b42318`, `--success: #216344`; field borders, invalid fields and notice variants use these | Matches primitive values; status backgrounds are additional literals. |
| Sparse inverse section | `--inverse: #252334`, `--on-inverse: #fff`; `.ai-section` applies them, with a light `#e5e1ff` focus outline | Preserves the limited inverse-band idea. Supporting inverse shades are not centralised tokens. |
| Manrope, weights 400–700 | `root.tsx` imports Fontsource Latin 400/500/600/700; `--font` supplies Manrope/system fallback. Imported font CSS declares local WOFF2/WOFF and `font-display: swap` | Matches font family and weights. No font-shift measurement was performed. DM Mono is not loaded. |
| Body and headline hierarchy | Body 16px/1.6; h1 `clamp(46px, 5.2vw, 74px)`/1.08/-0.035em; h2 `clamp(30px, 3vw, 42px)`/1.15/-0.03em; `.prose` 68ch | Main hierarchy follows the contract. Smaller component copy and exact hero composition differ; see deviations. |
| Shared content width and gutters | `.container`: max 1200px with 48px side gutters; at ≤1023px, 24px; at ≤650px, 20px | Matches the shared container and responsive gutter values. Hero uses this same container; the allowed 1280px maximum is not required. |
| Spacing and rounded boundaries | `--space-1/2/3/4/6/8/12/16/20/28`: 4/8/12/16/24/32/48/64/80/112px; `--radius-control: 8px`, `--radius-panel: 12px` | Exact foundational scale exists. Much layout still uses literals; small badges use 4px corners. |
| Quiet depth | Finder is a flat white panel. Dropdown uses `--overlay-shadow: 0 12px 32px rgb(34 33 43 / 0.13)`; dialog backdrop is translucent | Tonal section separation and one overlay shadow retain the restrained material language. |
| Short, purposeful motion | `.button` explicitly transitions background and transform at 120ms; pointer press scales to 0.98. Service arrow uses 160ms and `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` | Press/easing match. Reduced-motion CSS disables animation/transitions and removes button/arrow motion. Finder and menu currently switch immediately. |

## Shared components and interaction contracts

| Component/source | Implemented pattern to retain |
| --- | --- |
| `components/SiteShell.tsx`: `SiteHeader`, `Wordmark`, `SiteFooter` | Real route links, native desktop services disclosure, mobile modal dialog at ≤1023px, Escape dismissal, explicit close/selection focus restoration and route-change closure. Footer identifies the local development preview. Browser focus behaviour remains a runtime verification concern. |
| `components/UI.tsx`: `CTA`, `SectionTitle`, `PageIntro`, `ClosingCTA` | CTA is a React Router link for navigation; secondary variant is a text link. Primary button styling has 8px corners, 48px minimum height, violet/white colours and visible focus. Shared headings and closing CTA maintain continuity between routes. |
| `components/ServiceFinder.tsx` and `ServiceFinder.module.css` | Four native radios in a labelled fieldset; selected need updates service title/output and service-prefilled contact link immediately. White 12px panel, violet selection, action-soft result band and label-level focus outline. Ordinary service links are provided inside `noscript`. |
| `components/ServiceRows.tsx` | Data-driven numbered editorial links from `apps/web/content/services.ts`, with title, possible output and arrow. Mobile CSS moves the output below the title. Reuse this pattern instead of converting the four services to generic icon cards. |
| `components/ServicePage.tsx` | Shared service introduction, audience, problem, possible deliverables, client inputs, FAQ and closing CTA; AI detail additionally uses the illustrative workflow. Scope is expressly subject to agreement. |
| `components/WorkflowDemo.tsx` | Three button tabs with selected state, roving tab index and Left/Right keyboard handlers. Input, bounded assistance and human review are explicit. Caption states “Illustrative workflow · Synthetic example · No live AI connection”. |
| `components/UI.tsx`: `FAQ` | Native `details`/`summary` gives a disclosure without a JavaScript dependency. Decorative Lucide `Plus` is hidden from assistive technology and rotates 45 degrees in the open state. |
| `routes/contact.tsx` and form rules in `styles/global.css` | Persistent labels, 16px controls with 48px minimum height, conditional training/AI fields, full-width message and single-column phone form. Error summary is focusable and links errors to fields through buttons. Pending/uncertain state and same-attempt retry preserve the distinction between sending and confirmed receipt. |
| `routes/thank-you.tsx` | Displays the reference saved after a parsed successful API response; direct access without a saved reference gives a neutral next-step message. Copy explicitly avoids email-delivery or meeting-booking promises. This source inspection does not verify database durability. |

## Deviations and unresolved design drift

These findings are reported, not repaired or silently promoted into new design rules.

| Contract or intent | Source difference | Maintenance implication |
| --- | --- | --- |
| Text wordmark until an approved logo exists | `SiteShell.tsx` includes a custom SVG N-shaped symbol alongside the text; `PRODUCT.md` says no approved logo was supplied | Treat the symbol as provisional, not an approved brand asset. |
| Exact 7/5 opening; surface brief specifies 72px desktop headline | `.hero` uses `1.3fr 1fr` (not 1.4:1), 68px gap and global h1 capped at 74px. Overrides are 59px at ≤1150px, 64px at ≤1023px and 44px at ≤650px | Overall split/stack concept is preserved; exact proportions and headline sizing differ. |
| Body 16–18px, labels 14–16px, prose 55–75ch | Numerous component paragraphs are 13–15px; field labels are 13px, help/errors 12px, footer bottom 10px. Hero copy is 45ch and several summaries are narrower | This is a denser implementation than the written baseline. Readability needs explicit review rather than an assumed AA pass. |
| Desktop section rhythm 80–112px | Hero top is 76px, services top 45px and training band 76px; many values are off the declared spacing scale | Preserve current composition during unrelated changes; reconcile only in an authorised design maintenance change. |
| Central semantic tokens | White action text, inverse supporting shades, notice backgrounds and many spacing/radius values are literal CSS. DM Mono is absent; the reference uses tabular Manrope numerals | Future reuse should prefer existing tokens. Do not introduce a new font or token migration merely to normalise this report. |
| FAQ specified as button with expanded state | Native `summary` inside `details` is used instead of a custom button/`aria-expanded` implementation | Semantic implementation variation; retain native behaviour unless an actual requirement calls for replacement. |
| Error summary focuses first invalid field | `contact.tsx` focuses the summary when errors change; individual summary buttons then focus the matching field | Automatic focus does not match the literal contract. Nested conditional error keys such as `training.teamSize` also differ from input IDs such as `teamSize`; these fields lack the shared per-field error helper wiring. Record as an accessibility gap requiring targeted verification/fix. |
| Service rows include business problem and possible outputs | `ServiceRows.tsx` renders `s.output`, but not `s.problem`; problem detail appears in `ServicePage.tsx` | Row copy is compressed compared with the component specification. |
| Finder/menu motion ranges | Neither finder result nor mobile dialog has the specified opacity/transform transition | Immediate switching is the current implementation; no missing-animation repair was made. |
| Current design-tool schema | Incumbent DESIGN frontmatter uses `spacingPx`, `radiiPx`, `layout` and `motion`, and noncanonical section headings. Its text still calls the contract a proposed baseline | Preserve this approved authority as instructed. Do not infer permission to migrate to the document playbook's schema or generate a sidecar. |

The surface brief's “green-free violet action palette” is interpreted as action styling: the incumbent DESIGN explicitly includes green for success, and `--success` retains that semantic role.

## Finish-review edits present in source

These edits were supplied by the implementation/finish pass; the documenter did not make them.

- Finder kicker removed: the result block in `ServiceFinder.tsx` starts directly with the service `h3`; no result kicker element or kicker rule remains in the inspected component/module stylesheet. The separate “Find your fit” heading aid remains.
- FAQ icon uses Lucide `Plus`: imported in `UI.tsx`, rendered at 20px with `aria-hidden="true"`; `global.css` styles and rotates `.faq-icon` when open.
- Wordmark tracking: `.wordmark` in `global.css` is `-0.04em`. The lighter “tech” span retains its separate `-0.035em` rule.

## Junior-engineer maintenance guide

1. Read `PRODUCT.md` for truthful product boundaries, then `DESIGN.md` for visual authority and the surface brief for homepage composition. This report records implementation differences; it is not permission to copy every deviation.
2. Edit shared colour/radius/spacing primitives in `styles/tokens.css`. Check existing selectors in `global.css` before adding route-specific styles. Use the finder CSS module for finder-only layout. Avoid broad global changes to solve one local issue.
3. Reuse `SiteShell`, `CTA`, `PageIntro`, `ServiceRows`, `ServicePage` and `FAQ`. Edit shared service content in `apps/web/content/services.ts` so the finder, navigation and service pages remain consistent.
4. Keep links for navigation and buttons for actions. Preserve native radio/disclosure/dialog semantics, visible focus and reduced-motion rules. Do not replace labels with placeholders or remove error/status copy for visual tidiness.
5. Keep violet for actions, green/red for semantic status, and inverse backgrounds limited to the existing illustrative section. Do not add invented client proof, live AI claims or production branding. Preserve illustrative captions and local-development notices.
6. When UI changes are authorised, check the contract's 390/768/1024/1440px widths, 320px reflow, 200% zoom, long/BM sample copy, keyboard paths, reduced motion, contrast and no-JS reading. Record what was actually checked. These are future maintenance checks, not results of this documentation pass.
7. Reconcile intentional design changes with the contract and evidence together in a separately authorised change. Do not rewrite DESIGN or create a schema sidecar simply because tooling expects a newer format.

## Local-development and release boundary

`README.md` and `VERIFICATION.md` explicitly describe a local-development milestone, not production readiness. They record a production-environment refusal, noindex pages, local staff login, process-local sessions/rate limits, missing external mail delivery and an externally unverified PostgreSQL adapter. `root.tsx` independently confirms the noindex metadata, and the footer/form/acknowledgement confirm the preview messaging.

Their stated release blockers include OIDC/MFA and staff permissions, shared durable sessions/rate limits, mail adapter/worker and failure reconciliation, production migration runner, approved contact/domain/legal/retention content, deployment security and backup-restore validation. Audited exports and several advanced staff capabilities remain unimplemented. This report neither re-tests those backend claims nor removes their release gates.

Outcome: the incumbent design files and visual direction are preserved; implementation variations are explicitly recorded. The only deliverable changed by this pass is `DESIGN_IMPLEMENTATION.md`.
