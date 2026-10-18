# 04 — Database stack: leads and operational history

Use a dedicated PostgreSQL database and role. `pg` repositories use parameterised SQL and one transaction client. UUID IDs, UTC `timestamptz`, explicit constraints/FKs, integer version. Raw access tokens, API secrets and public content drafts do not belong in lead JSON.

## Launch data dictionary

| Table | Key columns | Constraints and lifecycle |
| --- | --- | --- |
| staff_users | id, issuer, provider_subject, display_name, email, active | Unique issuer+subject; invitation/provisioning controlled by owner |
| staff_roles | user_id, role | owner/admin or lead_manager; no user-controlled grant |
| staff_sessions | token_hash, user_id, expiry, last_seen, MFA assurance | Hashed token; revoke/expire; never log bearer value |
| leads | id, reference, name, email, service, message, optional company/role/phone/budget/timeframe, qualification_json, source_route, status, owner_id, next_action, follow_up_at, version, created_at, updated_at | Unique random reference; service/status checks; owner FK; bounded strings; no public lookup by email |
| lead_consents | id, lead_id, purpose, notice_version, value, recorded_at | Separate privacy acknowledgement and marketing choice, including false; not bundled inferred consent |
| lead_notes | id, lead_id, author_id, text, correction_of_id, created_at | Internal plain text; append/correct, not silent history rewrite |
| lead_status_events | id, lead_id, from_status, to_status, actor_id nullable for initial system event, reason, version, created_at | Unique lead+version for transitions; reason required for outcome/reopen |
| submission_keys | scope_hash, operation, key_hash, payload_hash, lead_id, response_json, expires_at | Composite unique scope+operation+key; minimal safe response only |
| notification_jobs | id, lead_id, kind, template_version, dedupe_key, status, attempts, run_after, lease_owner, lease_expires_at, provider_operation_key, safe_error_code | Unique dedupe key; worker restart-safe; no whole request duplicate |
| notification_deliveries | id, job_id, provider, provider_message_id, status, event_at | Provider IDs unique when present; append state evidence |
| export_jobs | id, actor_id, filters_json, status, private_object_key, expires_at | Owner permission, reauth, audited bounded scope; no public URL |
| audit_events | id, actor_id, action, object_type, object_id, request_id, change_summary, created_at | Append-only in app; no raw contact/message copy in summary |

Anonymous scope is a random cookie value verified server-side; persist only its hash in key mappings as needed. Do not derive scope/reference from email. Retention/deletion must cover references, job payloads, backups, exports and logs as well as the main lead row.

## Canonical field limits

Name 2–120 chars; email max 254 with normal email validation; message 30–5000; company/role max 160; phone max 40 (do not reject valid international formatting); notes 1–5000. Source route max 200 from known site paths, no full query string/PII. Training/AI qualification fields use enumerated structure, not arbitrary nested JSON. DB CHECKs enforce defensible bounds; application schemas handle semantics.

Service values: `consulting | application_development | ai_agents_integration | ai_training | not_sure`. Lead status comes from [backend state machine](03-BACKEND-NODE-EXPRESS.md). Public `received` is an acknowledgement, **not** an internal lead status enum.

Recommended indexes:

```sql
CREATE INDEX leads_queue ON leads (status, created_at DESC, id DESC);
CREATE INDEX leads_owner_follow_up ON leads (owner_id, follow_up_at, id);
CREATE INDEX leads_service_created ON leads (service, created_at DESC, id DESC);
CREATE INDEX lead_notes_timeline ON lead_notes (lead_id, created_at, id);
CREATE UNIQUE INDEX submission_key_once
  ON submission_keys (scope_hash, operation, key_hash);
CREATE UNIQUE INDEX notification_intention_once ON notification_jobs (dedupe_key);
CREATE INDEX notification_due ON notification_jobs (run_after, id)
  WHERE status IN ('pending', 'retry');
```

These fragments assume tables exist. Search starts with bounded authorised SQL queries; add text indexes only after inspecting actual plans. User-supplied sort/filter strings map to an allowlist, never string-interpolated SQL.

## Atomic persistence rules

Intake inserts key, lead, consent records, initial event and jobs in one transaction. On concurrent unique-key conflict, wait/read the stored result and compare payload hashes. Do not leave a committed placeholder key with no result unless implementing an explicit recoverable state machine. A transaction rollback must leave neither phantom success nor orphan lead.

Staff mutation locks/updates only a lead the actor may access and checks `version`. Increment version, insert required history/audit and commit together. Lead claiming is atomic: a manager cannot steal an already claimed lead by racing a stale queue view. Owner can reassign with reason.

Worker leasing uses a DB claim transaction and an expiry, not an in-memory boolean. Reclaiming a stale lease must reconcile uncertain external effects before resending. Successful jobs stay completed through backup restoration; external delivery evidence is checked before replay after disaster recovery.

## Migrations and seeds

Migration order: staff/roles/sessions → leads/consents → history/keys → notification jobs/deliveries → exports/audit. Track applied migrations with checksum/version; run via reviewed tooling with deployment identity. Application user lacks schema-changing privileges. Test blank DB and upgrade from previous release.

Seeds use `example.test` addresses and explicit synthetic markers: consulting, training, not-sure, invalid-input rejection, long text, no optional fields, duplicate key, failed mail, overdue follow-up. Never email real contacts from tests. No real account password in a seed. Initial owner is provisioned out of band through the selected identity provider and a reviewed server-side grant.

Retention policy awaiting Ryan/qualified review: purpose/duration for leads, notes, marketing consent, audit, session hashes, submission keys, provider records, export artifacts and backup expiry. Delete expired temporary exports/keys by job; do not assume removing a lead automatically erases all lawful-retention records. Audit deletion without duplicating removed PII.

Future CMS tables are not required now. If added, separate content versions/approvals/publication jobs from lead storage permissions; a content editor must not gain access to enquiries simply by sharing a database.
