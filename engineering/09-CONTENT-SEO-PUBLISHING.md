# 09 — Content, SEO and publishing contract

Owner: frontend junior implements; Ryan/designated owner approves business facts. No facts are approved merely because this pack proposes their presentation.

## Company and service source of truth

Confirmed: name Nextgen Tech Sdn Bhd; consulting; application development; AI agent deployment/integration; AI training. Pending: domain, email/phone/WhatsApp, registration details, address, founding story, staffing, actual delivery commitments, capabilities beyond those categories, project evidence, fees, accreditations and training dates.

Do not publish `hello@nextgen.tech` from the parent prototype as a verified address. Temporary text wordmark is acceptable in development; approved production identity may also be text if Ryan chooses it. No case studies/testimonials is a valid launch condition; fake ones are not.

## Content model to implement

```ts
type Approval = {
  state: 'draft' | 'in_review' | 'approved';
  approvedBy?: string;
  approvedAt?: string;
  sourceNote?: string; // private editorial provenance, not exported by default
};

type ServicePage = {
  id: 'consulting' | 'application_development'
    | 'ai_agents_integration' | 'ai_training';
  path: string;
  title: string;
  summary: string;
  audience: string[];
  problems: string[];
  possibleDeliverables: string[];
  clientInputs: string[];
  process: Array<{ title: string; description: string }>;
  faqs: Array<{ question: string; answer: string }>;
  ctaLabel: string;
  seo: { title: string; description: string };
  approval: Approval;
};
```

Validate missing/duplicate paths, empty required sections, unsupported service enums, missing image rights/alt text and unapproved public facts. Keep provenance/approver metadata out of public exports where private. Separate public projection from editor records. Render plain text/sanitised Markdown, not arbitrary executable HTML or MDX from untrusted editors.

## Page content direction

Draft Home headline: “Build the systems your business needs next.” Supporting text: explain the four confirmed services in plain language and ask what the visitor wants to improve. CTA: “Discuss your project.” This is proposed copy, not approved marketing or a guaranteed outcome.

| Service | Questions the page must answer | Suitable draft engagement examples, pending scope approval |
| --- | --- | --- |
| Consulting | What is unclear? What evidence/inputs are needed? What decision will the client be able to make? | Workflow assessment, scope/architecture review, implementation roadmap |
| Application development | What workflow will software support? What gets designed, tested, deployed and handed over? | Business web app/internal tool/portal; platform scope confirmed case by case |
| AI agents/integration | What information/tools can it access? Which actions require human review? How are failures evaluated/escalated? | Knowledge retrieval, triage, document processing with explicit limitations |
| AI training | Who attends? What prerequisites/outcomes? Which format and enquiry details are useful? | Business essentials, prompting/verification, workflow use, technical workshops |

For each use case state input, output, client responsibility and limitation. AI demonstrations use synthetic data and “Illustrative example” caption. Do not simulate live connector access/streaming to imply operational deployment. No model accuracy, compliance or ROI guarantee.

Training cards state audience/outcomes/format subject to actual offering; no seat count, paid registration, certification, HRD Corp eligibility or calendar date without approved evidence. Enquiry acknowledgement is not enrolment.

## Evidence/content gates

Every published testimonial has permission, exact approved wording, identity/publication consent and provenance. Every metric has definition, period, measurement method and approval. Every work image is permission-approved and scrubbed of private data. Makanlah is a case study only if Ryan approves its relationship/status; a design/specification is not a shipped client project.

Images: store source/licence/consent record, public alt/caption, dimensions/crops and approval state. Do not hotlink or invent client logos. Remove optional unready sections from production navigation rather than showing blank pages. Mandatory privacy notice/business contact must be ready before enquiry intake is public.

## SEO implementation

- Unique descriptive title/description, canonical URL from approved domain, meaningful h1/headings, descriptive links and social image per relevant route.
- Generate sitemap from the same approved public manifest as pre-render paths, excluding thank-you/admin/error/drafts. Robots describes crawl policy, not security.
- Organisation/service structured data contains only verified facts; no invented address, awards or AggregateRating. Do not claim a physical office/local opening hours without evidence.
- Unknown paths return HTTP 404; moved content gets reviewed permanent redirects. Avoid duplicate slash/case/domain canonicals.
- English launch; `/ms/...` routes/hreflang only when matching reviewed BM pages exist. Set real language attributes. Do not create empty locale routes or auto-publish legal translations.
- Social metadata must not contain private enquiry/reference details. Thank-you/admin private responses are not cacheable/indexable as appropriate.

## Publication workflow

Source-controlled launch: edit branch → content schema/link checks → owner review → approved public projection → pre-render/build checks → staging content/interaction review → atomic approved release. Failed build never replaces the working release. Keep content version and deployed build identifier traceable.

If a CMS is later selected: draft → in_review → approved → published → archived; signed publish trigger selects an approved immutable revision, not whatever draft the CMS returns. Preview authenticated/expiring; token server-only; build trigger bounded/deduplicated. Content approval and successful deployment remain separate states. A content editor role never grants lead access.

## Owner checklist before release

Approve identity/contact/domain and actual service scope; approve legal/retention notice and staff access; confirm mail sender/recipient and incident owner; review all claims/assets; remove placeholders; test a real staging enquiry and staff follow-up; confirm no unapproved dates/prices/logos; sign the public release content manifest. Engineering may not substitute plausible invented values for any missing item.
