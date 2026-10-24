# Team training catalogue extension

Development direction contract, 23 October 2026. Scope: `/training#courses` and
`/admin?section=training`. Existing green Anybody/Manrope public pages and the
staff image editor are the visual authority; older PRODUCT/DESIGN directions
do not replace them. Context was loaded by the coordinating agent.

Public mode: Persuade. Keep the existing course rows, disclosure, enquiry links,
HRD Corp wording and image placement. Load only published records, in staff order.
Seed the owner-supplied Vibe Coding and Workflow Automation & AI Agents for Daily
Work topics on first migration, with duration and format "To be confirmed". Do not
invent codes, schedules, delivery commitments, certifications or registration details. Show a specific
loading state, an honest unavailable state with retry, and a useful empty state.

Staff mode: Operate. Extend the existing workspace with a Team training tab,
an ordered course list and a labelled inline editor. Use the existing restrained
green actions, neutral surfaces and familiar form controls; no decorative motion.
Support add, edit, explicit draft/publish, move up/down, reversible archive and
restore. Keep title, audience, duration, format, short summary and outline editable.

All changes require the existing staff session and CSRF checks. Persist content
and order in the existing database. A catalogue revision protects edits and order
against concurrent saves. Keep edits on errors and conflicts; require a deliberate
reload to discard them. Warn on unsaved selection/navigation/reload/sign-out.
Disable conflicting actions while saving. Label controls, focus errors, provide
keyboard focus and readable feedback, and stack the list/editor on narrow screens.
Keep image-manager dirty protection and enquiry handling intact. Component-owned
CSS only. Tests use isolated memory or temporary databases; never the live store.

## Final handoff — 23 October 2026

The completed independent [finish review](../.impeccable/review/extension-2026-10-23-review.md) records `disposition: ship` for this scoped extension, with no material fixes; its visual/source review relies on lead-supplied runtime checks. The [website update guide](WEBSITE_UPDATE_GUIDE.md) documents the implemented editor and public paths. The [documentation handoff](../.impeccable/review/extension-2026-10-23-documentation.md) records integrated QA, persistence and access boundaries. Current owner-supplied topics are retained; only duration and delivery format remain to be confirmed. Global DESIGN/PRODUCT are unchanged.
