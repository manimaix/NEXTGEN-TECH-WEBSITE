# 06 — Code blueprints and developer setup

Reference fragments below are assignments, not a compiled application. Complete the named modules, validate against pinned packages, and test the real intake transaction before claiming functionality.

## Bootstrap and file ownership

Create workspace manifests within `nextgen tech website`, preserving the TXT/design/engineering files. Use a React Router framework scaffold for `apps/web`; don't create a plain SPA and call it pre-rendered. Confirm the destination is absent before scaffolding:

```powershell
Set-Location -LiteralPath 'C:\WORK\WEBSITE - NEXTGEN TECH\nextgen tech website'
npx create-react-router@latest apps/web
```

Review generated runtime/dependency requirements; record and pin tested versions. Use current supported Node LTS; create API/worker/contracts packages deliberately. Root scripts to implement: `dev`, `dev:web`, `dev:api`, `dev:worker`, `typecheck`, `lint`, `content:check`, `test:unit`, `test:integration`, `test:e2e`, `build`, `db:migrate`, `db:seed:test`. Proposed local ports: web 5174/API 4102 so Makanlah can run independently. No scripts listed here are claimed to exist yet.

```text
packages/contracts/src/      enquiry.ts, lead.ts, errors.ts
packages/server-core/src/    db/transaction.ts, clock.ts, jobs/, audit/
apps/api/src/                app.ts, server.ts, config.ts, middleware/, modules/
apps/worker/src/             main.ts, mailAdapter.ts, handlers/
database/migrations/         ordered SQL and schema-version ledger
tests/                      contract, integration, e2e
```

`app.ts` constructs Express; `server.ts` listens and manages shutdown. API and worker import server-only shared services. Frontend imports contracts, never `pg`, database rows, mail templates containing secrets, or server config.

## Pre-render configuration example

Target `apps/web/react-router.config.ts`. Initial development route list; production content check must approve every included page:

```ts
import type { Config } from '@react-router/dev/config';

export default {
  ssr: false,
  prerender: [
    '/', '/services', '/services/consulting',
    '/services/application-development', '/services/ai-agents-integration',
    '/training', '/about', '/contact', '/privacy', '/terms',
    '/thank-you', '/404',
  ],
} satisfies Config;
```

Configure real route modules separately. Add dynamic slugs only from approved published content. Keep `/admin/*` out of pre-render data; configure a known-prefix client fallback and real unknown-path 404 at the host. Add noindex metadata to thank-you/error/admin and exclude these from sitemap. Remove `/terms` only if owner/legal review determines it is not applicable and navigation/config stay consistent.

## Shared schema example

Target `packages/contracts/src/enquiry.ts`; abbreviated foundation, to expand with all bounded optional fields in [API](05-API-CONTRACTS.md):

```ts
import { z } from 'zod';

export const ServiceSchema = z.enum([
  'consulting', 'application_development', 'ai_agents_integration',
  'ai_training', 'not_sure',
]);

export const EnquiryCoreSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  service: ServiceSchema,
  message: z.string().trim().min(30).max(5000),
  privacyAcknowledged: z.literal(true),
  privacyNoticeVersion: z.string().min(1).max(80),
  marketingConsent: z.boolean(),
  submissionToken: z.string().min(1).max(4096),
}).strict();

export const EnquiryResultSchema = z.object({
  data: z.object({ reference: z.string().min(1), status: z.literal('received') }),
  meta: z.object({ requestId: z.string(), replayed: z.boolean() }),
});
```

Final schema must add optional fields, service-conditional refinements, source-route allowlist and limits, not discard them accidentally with `.strict()`. Server separately verifies notice version/token, abuse controls and canonical hash. Shared schemas do not turn client validation into trusted input.

## Reliable intake transaction — pseudocode

Target `apps/api/src/modules/leads/intake.service.ts`:

```text
receiveEnquiry(validatedInput, scope, idempotencyKey):
  canonicalPayload = public business fields, excluding rotating token
  hash = canonical deterministic hash(canonicalPayload)
  transaction using one checked-out pg client:
    insert/acquire unique scope + create-enquiry + key record
    if committed existing record:
      reject different hash; otherwise return recorded safe response
    insert lead with server status=new, owner=null, version=1
    insert privacy acknowledgement and separate marketing true/false records
    insert initial stage event
    insert staff notification job; optional acknowledgement job
    save reference + safe response + hash in key record
  return only after COMMIT
```

Every repository in that block receives the same transaction client. Do not use separate `pool.query()` calls inside a transaction, call email before commit, or implement idempotency as “SELECT then INSERT” without a unique constraint. On conflict wait/read the committed mapping. On DB failure no success response. API may time out after commit, so replay must recover its result.

## Frontend stable-attempt example

Target `apps/web/app/features/contact/attempt.ts`:

```ts
type Attempt<T> = Readonly<{ key: string; payload: T }>;

export function newAttempt<T>(validatedPayload: T): Attempt<T> {
  return { key: crypto.randomUUID(), payload: structuredClone(validatedPayload) };
}

export async function sendAttempt<T>(attempt: Attempt<T>, token: string) {
  return fetch('/api/v1/enquiries', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': attempt.key,
    },
    body: JSON.stringify({ ...attempt.payload, submissionToken: token }),
  });
}
```

Create an attempt only after client validation, on intentional submission, not on each render/retry. Keep in page memory. The controller checks status and parses success through `EnquiryResultSchema`; non-2xx is not success. Refreshing an expired token keeps the same scope/key/business payload. Changing content after a known rejection creates a new intentional attempt; after an uncertain result resolve/replay the original first. Never log payloads in catch handlers.

## Lead transition policy exercise

Target `modules/leads/status.policy.ts`: model allowed edges from the backend document as a typed mapping; validate current status/target/role/reason before persistence. Unit-test all allowed edges and all absent edges, terminal reopen privilege, and reason-required cases. Integration-test expected-version conflict and append-only history, not only the pure mapping.

## Code review requirements

Strict TypeScript; runtime schemas at boundaries; DTOs separate from DB rows; parameterised SQL; injected mail adapter/clock; safe rich-content rendering with raw HTML disabled/sanitised. No invented generic CRM engine. Functions should own one domain operation and errors have stable codes. PR includes ticket, actual commands/results, content approval changes, screenshots for UI, data impact and limitations.
