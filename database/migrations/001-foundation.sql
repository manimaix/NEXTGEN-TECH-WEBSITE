CREATE TABLE IF NOT EXISTS leads (
 id uuid PRIMARY KEY, reference text NOT NULL UNIQUE, name text NOT NULL CHECK(length(name) BETWEEN 2 AND 120),
 email text NOT NULL, service text NOT NULL CHECK(service IN ('consulting','application_development','ai_agents_integration','ai_training','not_sure')),
 message text NOT NULL CHECK(length(message) BETWEEN 30 AND 5000), details jsonb NOT NULL DEFAULT '{}',
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','triaged','contacted','qualified','proposal','won','lost','closed','disqualified','spam')),
 version integer NOT NULL DEFAULT 1, next_action text, follow_up_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lead_consents (id uuid PRIMARY KEY,lead_id uuid NOT NULL REFERENCES leads(id),purpose text NOT NULL,notice_version text NOT NULL,value boolean NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS submission_keys (scope_hash text NOT NULL,key_hash text NOT NULL,payload_hash text NOT NULL,reference text,expires_at timestamptz NOT NULL,PRIMARY KEY(scope_hash,key_hash));
CREATE TABLE IF NOT EXISTS lead_notes (id uuid PRIMARY KEY,lead_id uuid NOT NULL REFERENCES leads(id),text text NOT NULL CHECK(length(text) BETWEEN 1 AND 5000),actor text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS lead_events (id uuid PRIMARY KEY,lead_id uuid NOT NULL REFERENCES leads(id),from_status text,to_status text NOT NULL,reason text NOT NULL,actor text NOT NULL,version integer NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS notification_jobs (id uuid PRIMARY KEY,lead_id uuid NOT NULL REFERENCES leads(id),kind text NOT NULL,dedupe_key text NOT NULL UNIQUE,status text NOT NULL DEFAULT 'pending',attempts integer NOT NULL DEFAULT 0,safe_error_code text,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS audit_events (id uuid PRIMARY KEY,action text NOT NULL,object_id text,actor text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS leads_queue ON leads(status,created_at DESC,id);
CREATE INDEX IF NOT EXISTS lead_notes_timeline ON lead_notes(lead_id,created_at);
