import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Database } from "./db";
import {
  edges,
  type EnquiryInput,
  type Lead,
  type LeadStatus,
} from "../../../packages/contracts/src/index";

export class DomainError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const hash = (v: string) => createHash("sha256").update(v).digest("hex");
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export async function intake(
  db: Database,
  input: EnquiryInput,
  scope: string,
  key: string,
) {
  const { submissionToken: _, ...payload } = input;
  const payloadHash = hash(stable(payload));
  return db.transaction(async (q) => {
    await q(
      "INSERT INTO submission_keys(scope_hash,key_hash,payload_hash,expires_at) VALUES($1,$2,$3,now()+interval '7 days') ON CONFLICT DO NOTHING",
      [hash(scope), hash(key), payloadHash],
    );
    const existing = (
      await q<{ payload_hash: string; reference: string | null }>(
        "SELECT payload_hash,reference FROM submission_keys WHERE scope_hash=$1 AND key_hash=$2 FOR UPDATE",
        [hash(scope), hash(key)],
      )
    ).rows[0];
    if (existing.payload_hash !== payloadHash)
      throw new DomainError(
        409,
        "IDEMPOTENCY_CONFLICT",
        "This submission key belongs to different details. Resolve the previous attempt first.",
      );
    if (existing.reference)
      return { reference: existing.reference, replayed: true };
    if (input.privacyNoticeVersion !== "development-v1")
      throw new DomainError(
        422,
        "NOTICE_CHANGED",
        "Refresh the privacy information before submitting.",
      );
    const id = randomUUID(),
      reference = `NG-${randomBytes(7).toString("hex").toUpperCase()}`;
    const { name, email, service, message, ...details } = payload;
    await q(
      "INSERT INTO leads(id,reference,name,email,service,message,details) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [id, reference, name, email, service, message, JSON.stringify(details)],
    );
    for (const [purpose, value] of [
      ["privacy_acknowledgement", true],
      ["marketing", input.marketingConsent],
    ])
      await q(
        "INSERT INTO lead_consents(id,lead_id,purpose,notice_version,value) VALUES($1,$2,$3,$4,$5)",
        [randomUUID(), id, purpose, input.privacyNoticeVersion, value],
      );
    await q(
      "INSERT INTO lead_events(id,lead_id,to_status,reason,actor,version) VALUES($1,$2,$3,$4,$5,1)",
      [randomUUID(), id, "new", "Enquiry received", "system"],
    );
    await q(
      "INSERT INTO notification_jobs(id,lead_id,kind,dedupe_key,status,safe_error_code) VALUES($1,$2,$3,$4,$5,$6)",
      [
        randomUUID(),
        id,
        "staff",
        `${id}:staff:v1`,
        "failed",
        "MAIL_NOT_CONFIGURED",
      ],
    );
    await q(
      "UPDATE submission_keys SET reference=$3 WHERE scope_hash=$1 AND key_hash=$2",
      [hash(scope), hash(key), reference],
    );
    return { reference, replayed: false };
  });
}
export async function updateLead(
  db: Database,
  id: string,
  change: {
    expectedVersion: number;
    status?: LeadStatus;
    reason: string;
    nextAction?: string;
    followUpAt?: string | null;
  },
) {
  return db.transaction(async (q) => {
    const lead = (
      await q<Lead>("SELECT * FROM leads WHERE id=$1 FOR UPDATE", [id])
    ).rows[0];
    if (!lead) throw new DomainError(404, "NOT_FOUND", "Enquiry not found.");
    if (lead.version !== change.expectedVersion)
      throw new DomainError(
        409,
        "VERSION_CONFLICT",
        "This enquiry changed. Refresh before saving.",
      );
    if (
      change.status &&
      change.status !== lead.status &&
      !edges[lead.status].includes(change.status)
    )
      throw new DomainError(
        409,
        "INVALID_TRANSITION",
        "That stage change is not available.",
      );
    const next = change.status ?? lead.status;
    const result = (
      await q<Lead>(
        "UPDATE leads SET status=$2,next_action=$3,follow_up_at=$4,version=version+1,updated_at=now() WHERE id=$1 RETURNING *",
        [
          id,
          next,
          change.nextAction ?? lead.next_action,
          change.followUpAt === undefined
            ? lead.follow_up_at
            : change.followUpAt,
        ],
      )
    ).rows[0];
    await q(
      "INSERT INTO lead_events(id,lead_id,from_status,to_status,reason,actor,version) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [
        randomUUID(),
        id,
        lead.status,
        next,
        change.reason,
        "local-owner",
        result.version,
      ],
    );
    return result;
  });
}
