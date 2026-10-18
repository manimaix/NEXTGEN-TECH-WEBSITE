# 02 — Frontend stack: React Router framework mode and Vite

Owner: frontend junior. Read [DESIGN.md](../DESIGN.md), [content/SEO](09-CONTENT-SEO-PUBLISHING.md), [API](05-API-CONTRACTS.md).

## Target structure

```text
apps/web/
  app/root.tsx                 document, metadata defaults, providers
  app/routes.ts                explicit route configuration
  app/routes/                  page modules and route boundaries
  app/components/              SiteHeader, MobileNav, Footer, UI primitives
  app/features/contact/        form, conditional fields, API, state machine
  app/features/service-finder/ selector and panel
  app/features/admin/          leads, notes, follow-up, notifications
  app/styles/                  tokens.css, global.css, component modules
  content/                     company, services, training, legal, content schema
  public/                      approved assets only
  react-router.config.ts       pre-render allowlist
```

Prefer typed content + page templates. Reuse ServicePage, ContactCTA, ProcessSteps, DeliverableList and FAQDisclosure rather than copying markup for each service. Keep small menus/tab state local; URL holds service context. Admin uses a scoped API cache if needed; marketing content needs no global store.

## Page build instructions

| Route | Content order/components | Completion criterion |
| --- | --- | --- |
| `/` | Header; headline/service finder; four numbered service rows; process; approved work or labelled demo; delivery topics; training; FAQ/CTA; footer | First screen identifies company, services and next action without animation |
| `/services` | Intro; four service comparisons; inputs/possible outputs; unsure-where-to-start CTA | Understandable without technical background; all real detail links |
| `/services/consulting` | Business problem; assessment/discovery options; agreed deliverables; client inputs; process; evidence/FAQ; CTA | No invented savings, guaranteed timelines or fixed packages |
| `/services/application-development` | Needs; discovery/prototype/build/test/deploy/handover; agreed scope; evidence/FAQ; CTA | Native/mobile/platform capabilities not asserted without approval |
| `/services/ai-agents-integration` | Defined workflow; bounded use cases; input/output/integration/human review; evaluation/monitoring; CTA | Illustrative selector is labelled, not fake live AI output |
| `/training` | Audience; proposed approved tracks; prerequisites/outcomes; format; contextual enquiry | No fake dates/seats/accreditation or payment implication |
| `/about` | Legal name; approved story/approach; consented imagery; CTA | No invented founding date, office, team size or certifications |
| `/contact` | Service context; labelled form; privacy notice; real alternate contact if approved | Durable acknowledgement and every failure state handled |
| `/privacy`, `/terms` | Approved readable legal content and effective date | No placeholder legal page in production |
| `/thank-you` | Safe acknowledgement from current accepted session, otherwise generic contact message | Noindex; no personal data/reference in URL; no false received claim on direct visit |
| `/404` | Clear not-found message and useful links | Unknown URLs served with actual HTTP 404 |
| `/admin/*` | Auth-only shell; lead list/detail/notes/status; failures/export | No private data in pre-render build; server checks every request |

Content-gated `/work`, `/work/:slug`, `/insights`, `/insights/:slug`, `/training/:slug` appear only with approved content and their own tickets. Empty indexes are not launch requirements.

## Static rendering contract

Set `ssr:false` and explicitly enumerate approved public paths in `prerender`. Build outputs public HTML and route data; both must be deployed. Keep top-level browser globals out of pre-rendered modules. Load only approved public content during generation; never staff sessions/leads/CMS drafts.

No runtime server `action` or `headers` export is available with this mode. Contact uses a client submit handler or `clientAction` calling Express; HTTP headers/redirects/404s belong to the host. Normal reading, navigation and service links must work without JS. Form may require JS in MVP: provide an honest `noscript` explanation and an approved contact alternative; never pretend no-JS enquiry intake works unless implemented/tested.

Do not configure catch-all unknown URLs to homepage/200. Serve static paths first; use SPA fallback only for the known admin shell namespace; all other unknown paths return rendered error content with 404. Set admin/thank-you noindex at host/meta level. See [React Router documentation](https://reactrouter.com/how-to/pre-rendering).

## Navigation and service context

Desktop: brand/home, Services, Training, About, Contact, primary enquiry CTA. Services menu links to the three detailed services and Training. On phone use labelled menu button, focus containment/restoration, Escape, scroll lock and route-close behaviour. Links remain native navigation affordances, not click handlers on divs.

`/contact?service=consulting` etc maps the canonical service enum. Unknown query values select `not_sure`, not arbitrary HTML. Selection remains editable and changes conditional fields. Use accessible tabs/radios in service finder with immediate keyboard response; static links underneath preserve no-JS paths.

## Contact form state machine

`idle → validating → submitting → received`; branches to `field_error`, `rate_limited`, `offline`, or `uncertain`. `received` requires a schema-valid committed API result. Pending keeps label/width and prevents duplicate clicks. Uncertain result retains the same payload/key for retry; don't generate a fresh key or claim rejection. Resolve that attempt before submitting edited content under a new key.

Required: name, email, service, description, privacy acknowledgement/notice version. Optional: company, role, phone, budget, timeframe, conditional training/AI fields; marketing unchecked. Client validation mirrors contracts; backend remains authoritative. Hidden irrelevant fields are omitted, not accidentally submitted from a previous service choice.

On 422, show persistent summary and field errors, focus first invalid field. On 429, honour Retry-After. On network failure retain fields only in current page memory; no localStorage/session-replay capture of lead PII. Retain safe reference in session state for thank-you, not entire form. Auth/staff errors must never route a visitor into an admin login.

## Verification requirements

Test all routes in generated production HTML with JS disabled for content/navigation. Test hydration without warnings, correct metadata, keyboard menu/finder/forms, screen-reader errors and mobile/desktop/zoom. Test slow, offline, 422, 409, 429 and uncertain responses with contract fixtures, then real API. Core service explanations cannot depend on analytics, fonts, booking widgets, or third-party scripts loading.
