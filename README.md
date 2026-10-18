# Nextgen Tech website

Implemented local development website following the product engineering pack. Public routes are pre-rendered React pages with self-hosted Manrope, semantic design tokens, responsive navigation, service finder, workflow demonstration, training and contextual enquiry form. Enquiries persist in a local PostgreSQL-compatible PGlite database; a `pg` adapter supports an external PostgreSQL database.

## Run on this computer

Clone the repository, then install dependencies and start the website and API:

```powershell
git clone https://github.com/manimaix/NEXTGEN-TECH-WEBSITE.git
Set-Location -LiteralPath 'NEXTGEN-TECH-WEBSITE'
npm install
npm run dev
```

If you already have the project, open its root folder and run the last two commands.

Open `http://127.0.0.1:5174`. API listens on loopback port 4102. The root parent prototype is unchanged. This machine has a broken user-level npm shim; use the bundled CLI if `npm` reports a missing npm-cli.js:

```powershell
& 'C:\Program Files\nodejs\node.exe' 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run dev
```

Stop the dev process with Ctrl+C. Do not run two API processes against the same PGlite `.data/postgres` directory. No global dependency repair is needed.

## Commands

`npm run typecheck` — strict TypeScript check.

`npm test` — embedded-PostgreSQL HTTP/transaction tests using isolated in-memory and temporary disk databases, including site-image restart persistence.

`npm run content:check` — validates the four service content models.

`npm run build` — pre-renders public routes and builds the client bundle.

`npm start` — serves the built website and API together on loopback 5174 (stop dev first).

`npm run release:check` — intentionally fails until mandatory business content is approved; not a production readiness certificate.

## Working features

- Home, service overview, three service details, training, about, contact, development privacy/website information, acknowledgement, true static-host 404 and local staff workspace.
- Keyboard-operable navigation/finder, reduced-motion rules, responsive layouts and shared tokens.
- Conditional training/AI fields, server/client validation, origin/token checks, rate limit, stable retry key, separate marketing choice, durable lead/consent/event/notification-intention transaction.
- Local staff session, CSRF protection, stored enquiry list/detail, valid stage transitions, version conflict handling, next action/follow-up, append-only notes/history and visible notification issues.
- Site image editor for six fixed placements, with upload preview, crop position, accessible descriptions, captions, portrait names/roles, explicit publishing and placeholder reset.
- No fabricated clients, testimonials, contact addresses, accreditation, live AI responses or delivery claims.

## Important development boundaries

This is **not ready for public production deployment**. The server refuses `APP_ENV=production`. All pages are noindex. A visible preview label and development contact/privacy notices are intentional.

The staff login is a loopback-only development shortcut, not OIDC/MFA. Sessions and rate buckets are process-local. No external email is sent: notification intentions explicitly record `MAIL_NOT_CONFIGURED`, rather than falsely reporting success. There is no live worker/mail adapter yet. PostgreSQL-server adapter is present but not verified against a separately running PostgreSQL service here.

Live release requires maintained OIDC/MFA integration and staff/assignment permissions; durable shared sessions/rate limits; mail adapter/worker with failure reconciliation; production migration runner; approved company contact/domain/legal/retention content; deployment security/headers/backup restore validation. Audited asynchronous exports, owner provisioning, CRM, a general-purpose CMS, booking and advanced staff filtering are not implemented; the fixed-placement site image editor is implemented. No silent public launch is performed.

The local API list currently uses bounded offset cursors, not the proposed opaque snapshot cursor. Notes use client operation UUIDs and reject reuse for a different lead or text. These are explicit development-scope deviations, not claims the full engineering backlog is complete.

## Data and editing

Local enquiries are stored under `.data/postgres`, gitignored. Use only synthetic details. Restarting preserves leads; restarting revokes local staff sessions. Tests use isolated in-memory and temporary disk databases and do not send emails.

Edit public service copy in `apps/web/content/services.ts`; tokens in `apps/web/app/styles/tokens.css`; layout in reusable components and route modules. Keep `DESIGN.md` and the engineering contracts aligned. `company.contentApproved` and `privacyApproved` deliberately remain false; do not flip them to bypass review.

Known design-document drift: `DESIGN.md` still describes the rejected violet scheme and `PRODUCT.md` still describes Apple-blue branding. The approved green Anybody/Manrope direction is recorded in the [landing brief](.impeccable/landing-green-brief.md), [public-page brief](.impeccable/public-pages-green-brief.md) and [site-images brief](.impeccable/site-images-brief.md). The global documents remain unchanged by this ordinary extension.

## Manage site images

1. Open [Site images](http://127.0.0.1:5174/admin?section=images), choose **Open local staff workspace** if prompted, then select a placement. There are six fixed slots: About workplace, About team group, three team portraits and Training workshop.
2. Choose a static JPG, PNG or WebP up to **5 MB / 25 megapixels**. Preview the placement and use the Horizontal and Vertical sliders to adjust the crop position.
3. Fill in **Image description** (required alt text), an optional caption, and the name/role for a portrait. Keep **Label this as an AI-generated placeholder** checked for generated imagery; remove it only after uploading a genuine replacement and updating its description. Keep unknown staff identities as placeholders.
4. Select **Publish changes** and wait for the published confirmation. The existing public image stays in place until saving succeeds.

Published images and details are stored in `.data/postgres` and survive restart; reopen the local staff workspace after restarting. **Discard changes** returns unsaved edits to the saved version. **Restore AI placeholder** asks for confirmation and resets the selected placement's image, crop and text. Publishing a replacement overwrites its stored upload, and restoring the placeholder removes it, so keep your original file. There is no recoverable image history or dynamic staff-count editor.

See the [site-image verification record](design/SITE_IMAGES_VERIFICATION.md) and [generated placeholder prompt manifest](design/placeholder-images.json). Confirmed checks from **2 October 2026**: all 25 tests passed, including a PNG larger than 4 MB and persistence across three disk-database reopenings; typecheck, content validation and build passed. Impeccable's finish review returned `ship` after reviewing all eight captures and source, with provenance for six shipping rasters and zero missing records. These are historical checks, not 8 October reruns.

See [engineering index](engineering/README.md) for the complete original requirements and deferred implementation work.

See [verification record](VERIFICATION.md) for the checks actually performed, browser evidence and test boundaries.
