# 01 — Nextgen Tech website architecture

Baseline: [README](README.md). Implement a service website with a real enquiry path, not a SaaS platform.

## Scope and stack

| Layer | Decision | Boundary |
| --- | --- | --- |
| Public frontend | React + TypeScript, React Router framework mode, Vite integration | Pre-render approved public pages to HTML; no server runtime needed for marketing reads |
| Presentation | CSS tokens + CSS Modules; Manrope, optional DM Mono | Shared editorial templates; product DESIGN is visual source |
| Content | Validated source-controlled TypeScript/JSON/Markdown | One source/type; owner-approved facts; no CMS at launch |
| Backend | Node.js + Express + TypeScript | Enquiry intake and protected staff operations only |
| Persistence | Separate PostgreSQL, `pg`, reviewed migrations | Leads/consents/history/outbox; no shared Makanlah data |
| Worker | Separate Node process with durable DB jobs | Staff notification, optional acknowledgement, export tasks |
| Staff auth | Maintained OIDC integration + server session + MFA | No public registration or customer account requirement |

Use npm workspaces inside this product folder: `apps/web`, `apps/api`, `apps/worker`, `packages/contracts`, `packages/server-core`. Tests/migrations/content remain product-local. Choose compatible stable package versions at bootstrap and pin them; don't convert the root prototype in place.

Proposed same-origin production routing: static public assets/pages at `/`, protected shell at `/admin/*`, reverse proxy `/api/v1/*` to Express. API session cookies are HttpOnly/Secure with appropriate SameSite/CSRF controls. Staff records never appear in build-time route loaders or generated static data.

## Public/operational boundaries

Launch public routes: Home, Services, Consulting, Application development, AI agents/integration, Training, About, Contact, Privacy, Terms when applicable, thank-you and error page. Launch staff scope: login, lead list/detail, notes/status/follow-up, notification failures and audited export restricted to owner/admin.

Four confirmed service categories do not authorise claims about every technology, accredited training, certified partnerships, cost savings, or completed deployments. The AI service page is explanatory; it does not require a live AI backend.

Defer case studies until approved content exists. Defer articles, CMS, BM publication, calendar integration, training seats/payments, public chatbot, LMS and client portal. CMS is not a prerequisite for a credible launch. Do not create fake work to fill a template.

## End-to-end responsibility

1. Static page explains offer; service CTA passes editable service context to Contact.
2. Contact gets a short-lived submission token and sends validated input with a stable idempotency key.
3. API checks bounds/abuse/token, commits lead + consent/notice record + notification job + replay result atomically.
4. API responds “received” with safe reference after commit, even if email is down.
5. Worker sends configured notifications using a verified sender, records provider state and retries safely.
6. Authorised staff can find the lead independent of email, assign follow-up and record stage changes.

The database is the lead source of truth. Browser success, provider email acceptance, mailbox delivery and a staff reply are different events.

## Architecture decisions to record

- Static rendering chosen for meaningful service HTML/SEO; API remains separate for dynamic actions. With `ssr:false`, React Router server `action`/`headers` exports are unavailable; use client interaction with Express and host configuration for HTTP headers. [React Router reference](https://reactrouter.com/how-to/pre-rendering).
- Source content chosen for low operational overhead; content model/approval metadata keeps a future CMS migration possible.
- PostgreSQL outbox chosen to avoid losing enquiries during mail outages without adding Redis/queue infrastructure initially.
- OIDC staff identity selected/reviewed at foundation; no custom password hashing or shared admin password.
- No coupling to Makanlah authentication, contact database, assets or published case-study status. Refer to Makanlah publicly only after Ryan approves its relationship and maturity.

## Launch dependencies

Ryan supplies approved business domain/contact destination, required company details, actual service/training scope, privacy/terms and retention wording, staff access owner, logo/image permissions, and sender/hosting accounts. Unknown optional content is omitted; unknown mandatory identity/legal/contact configuration blocks publication. Engineers may build with conspicuous development fixtures meanwhile.

Milestones: N0 foundations/content inventory → N1 public routes/design → N2 contract-driven enquiry UI → N3 durable intake/staff workflow → N4 verified content, staging QA, restore and release approval. Publication is a separate authorised action, not an implicit step in this handoff.
