import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowLeft, ArrowUpRight, RefreshCw, LogOut } from "lucide-react";
import { Wordmark } from "../components/SiteShell";
import { ImageManager } from "../components/ImageManager";
import { CourseManager } from "../components/CourseManager";
import {
  edges,
  serviceNames,
  type Lead,
} from "../../../../packages/contracts/src/index";

export const meta = () => [
  { title: "Local staff workspace — Nextgen Tech" },
  { name: "robots", content: "noindex" },
];
type Staff = { name: string; csrf: string; local: boolean };
type Detail = Lead & {
  notes: { id: string; text: string; created_at: string }[];
  history: {
    id: string;
    to_status: string;
    reason: string;
    created_at: string;
  }[];
};
type Failure = {
  id: string;
  reference: string;
  safe_error_code: string;
  status: string;
};
export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("section") ?? "enquiries";
  const [imageDirty, setImageDirty] = useState(false);
  const [courseDirty, setCourseDirty] = useState(false);
  const [courseBusy, setCourseBusy] = useState(false);
  function setTab(value: string) {
    setSearchParams(value === "enquiries" ? {} : { section: value });
  }
  const [staff, setStaff] = useState<Staff | null>(null),
    [loading, setLoading] = useState(true),
    [leads, setLeads] = useState<Lead[]>([]),
    [detail, setDetail] = useState<Detail | null>(null),
    [error, setError] = useState(""),
    [failures, setFailures] = useState<Failure[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [pending, setPending] = useState(false);
  async function request(
    path: string,
    method = "GET",
    body?: unknown,
    key?: string,
  ) {
    const r = await fetch(`/api/v1${path}`, {
      method,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(staff ? { "X-CSRF-Token": staff.csrf } : {}),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const b = await r.json();
    if (!r.ok) {
      // Keep unsaved course content visible if the session expires during a save.
      if (r.status === 401 && !path.startsWith("/admin/training-courses"))
        setStaff(null);
      throw Object.assign(
        Error(b.error?.message ?? "The request could not be completed."),
        {
          status: r.status,
          code: b.error?.code,
          fields: b.error?.fields,
        },
      );
    }
    return b;
  }
  async function list(append = false) {
    setError("");
    try {
      const b = await request(
        `/admin/leads${append && cursor ? `?cursor=${cursor}` : ""}`,
      );
      setLeads((v) => (append ? [...v, ...b.data] : b.data));
      setCursor(b.meta.nextCursor);
      setFailures((await request("/admin/notifications/failures")).data);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    request("/auth/session")
      .then((b) => setStaff(b.data))
      .catch(() => setError("Start the API to use the staff workspace."))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (staff) void list();
  }, [staff]);
  async function open(id: string) {
    setPending(true);
    setError("");
    try {
      setDetail((await request(`/admin/leads/${id}`)).data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!detail) return;
    const fd = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    try {
      await request(`/admin/leads/${detail.id}`, "PATCH", {
        expectedVersion: detail.version,
        status: fd.get("status"),
        reason: fd.get("reason"),
        nextAction: fd.get("nextAction"),
        followUpAt: fd.get("followUpAt")
          ? new Date(String(fd.get("followUpAt"))).toISOString()
          : null,
      });
      await open(detail.id);
      await list();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  async function addNote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!detail) return;
    const form = e.currentTarget,
      text = String(new FormData(form).get("note") ?? "");
    setPending(true);
    try {
      await request(
        `/admin/leads/${detail.id}/notes`,
        "POST",
        { text },
        crypto.randomUUID(),
      );
      form.reset();
      await open(detail.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link to="/" aria-label="Back to website">
          <Wordmark />
        </Link>
        <Link className="text-link" to="/">
          View website
          <ArrowUpRight size={16} />
        </Link>
        {staff && (
          <button
            className="icon-button"
            aria-label="Sign out"
            disabled={courseBusy}
            onClick={async () => {
              if (
                (imageDirty || courseDirty) &&
                !window.confirm(
                  courseDirty
                    ? "Discard your unsaved course changes and sign out?"
                    : "Discard your unsaved image changes and sign out?",
                )
              )
                return;
              try {
                await request("/auth/logout", "POST");
                setStaff(null);
                setDetail(null);
                setLeads([]);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <LogOut size={19} />
          </button>
        )}
      </header>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {loading ? (
        <p role="status">Loading staff session…</p>
      ) : !staff ? (
        <div className="local-login">
          <h1>
            Your local
            <br />
            staff workspace.
          </h1>
          <p>
            Manage training courses and website images, review test enquiries
            and keep track of follow-ups.
          </p>
          <div className="notice">
            Development access only. This shortcut is restricted to loopback
            requests and is disabled outside local mode. It is not production
            authentication.
          </div>
          <button
            className="button"
            onClick={async () => {
              try {
                setStaff((await request("/auth/local", "POST")).data);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Open local staff workspace
            <ArrowUpRight size={18} />
          </button>
        </div>
      ) : (
        <>
          <div className="admin-title">
            <div>
              <h1>
                {detail
                  ? detail.reference
                  : tab === "images"
                    ? "Site images"
                    : tab === "training"
                      ? "Team training"
                      : "Enquiry workspace"}
              </h1>
              <p>
                {detail
                  ? "Private enquiry details and follow-up history."
                  : tab === "images"
                    ? "Your photos, in the right places. Preview and publish each change."
                    : tab === "training"
                      ? "Your courses, kept current. Draft, publish and organise the catalogue."
                      : "Local records. No external email provider connected."}
              </p>
            </div>
            {tab !== "images" && tab !== "training" && (
              <button
                className="text-link icon-button"
                onClick={() => (detail ? void open(detail.id) : void list())}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            )}
          </div>
          {detail ? (
            <>
              <button className="text-link" onClick={() => setDetail(null)}>
                <ArrowLeft size={16} />
                All enquiries
              </button>
              <div className="lead-detail">
                <div>
                  <h2>{detail.name}</h2>
                  <p>{detail.email}</p>
                  <p>
                    {serviceNames[detail.service]} ·{" "}
                    {new Date(detail.created_at).toLocaleString("en-MY")}
                  </p>
                  <p className="lead-message">{detail.message}</p>
                  <h3>Additional details</h3>
                  <dl>
                    {Object.entries(detail.details)
                      .filter(
                        ([k]) =>
                          ![
                            "privacyAcknowledged",
                            "privacyNoticeVersion",
                            "sourceRoute",
                          ].includes(k),
                      )
                      .map(([key, value]) => (
                        <div key={key} style={{ marginTop: 10 }}>
                          <dt className="field-help">{key}</dt>
                          <dd
                            style={{
                              margin: 0,
                              fontSize: 14,
                              overflowWrap: "anywhere",
                            }}
                          >
                            {typeof value === "object"
                              ? Object.entries(value as Record<string, unknown>)
                                  .map(([k, v]) => `${k}: ${String(v)}`)
                                  .join(" · ")
                              : String(value)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                  <h3 style={{ marginTop: 32 }}>History</h3>
                  <ol className="timeline">
                    {detail.history.map((h) => (
                      <li key={h.id}>
                        <strong>{h.to_status}</strong> — {h.reason}
                        <br />
                        <span className="field-help">
                          {new Date(h.created_at).toLocaleString("en-MY")}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <form
                    key={detail.version}
                    className="admin-form"
                    onSubmit={save}
                  >
                    <h2>Next steps</h2>
                    <div className="field">
                      <label htmlFor="lead-status">Stage</label>
                      <select
                        id="lead-status"
                        name="status"
                        defaultValue={detail.status}
                      >
                        {[detail.status, ...edges[detail.status]].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="next-action">Next action</label>
                      <textarea
                        id="next-action"
                        name="nextAction"
                        maxLength={1000}
                        defaultValue={detail.next_action ?? ""}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="follow-up">Follow up on</label>
                      <input
                        id="follow-up"
                        name="followUpAt"
                        type="datetime-local"
                        defaultValue={
                          detail.follow_up_at
                            ? new Date(
                                new Date(detail.follow_up_at).getTime() -
                                  new Date().getTimezoneOffset() * 60000,
                              )
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="reason">Reason for this update *</label>
                      <input
                        id="reason"
                        name="reason"
                        required
                        minLength={3}
                        maxLength={1000}
                      />
                    </div>
                    <button className="button" disabled={pending}>
                      Save update
                    </button>
                  </form>
                  <h3 style={{ marginTop: 36 }}>Internal notes</h3>
                  {detail.notes.map((n) => (
                    <div key={n.id} className="lead-message">
                      <p
                        style={{ color: "var(--text)", whiteSpace: "pre-wrap" }}
                      >
                        {n.text}
                      </p>
                      <span className="field-help">
                        {new Date(n.created_at).toLocaleString("en-MY")}
                      </span>
                    </div>
                  ))}
                  <form className="admin-form" onSubmit={addNote}>
                    <div className="field">
                      <label htmlFor="note">Add a note</label>
                      <textarea
                        id="note"
                        name="note"
                        required
                        maxLength={5000}
                      />
                    </div>
                    <button
                      className="button button-outline"
                      disabled={pending}
                    >
                      Save note
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <>
              <nav className="admin-tabs" aria-label="Workspace sections">
                <button
                  aria-pressed={tab === "images"}
                  onClick={() => setTab("images")}
                >
                  Site images
                </button>
                <button
                  aria-pressed={tab === "training"}
                  onClick={() => setTab("training")}
                >
                  Team training
                </button>
                <button
                  aria-pressed={tab === "enquiries"}
                  onClick={() => setTab("enquiries")}
                >
                  Enquiries
                </button>
                <button
                  aria-pressed={tab === "notifications"}
                  onClick={() => setTab("notifications")}
                >
                  Notification issues ({failures.length})
                </button>
              </nav>
              {tab === "images" ? (
                <ImageManager request={request} onDirtyChange={setImageDirty} />
              ) : tab === "training" ? (
                <CourseManager
                  request={request}
                  onDirtyChange={setCourseDirty}
                  onBusyChange={setCourseBusy}
                />
              ) : tab === "enquiries" ? (
                leads.length ? (
                  <>
                    <div className="table-scroll">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Reference / name</th>
                            <th>Service</th>
                            <th>Stage</th>
                            <th>Received</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads.map((l) => (
                            <tr key={l.id}>
                              <td>
                                <button
                                  onClick={() => void open(l.id)}
                                  disabled={pending}
                                >
                                  {l.reference}
                                </button>
                                <br />
                                {l.name}
                              </td>
                              <td>{serviceNames[l.service]}</td>
                              <td>
                                <span className="badge">{l.status}</span>
                              </td>
                              <td>
                                {new Date(l.created_at).toLocaleDateString(
                                  "en-MY",
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {cursor && (
                      <button
                        className="text-link"
                        onClick={() => void list(true)}
                      >
                        Load more
                      </button>
                    )}
                  </>
                ) : (
                  <div className="admin-empty">
                    <h2>No enquiries yet.</h2>
                    <p>
                      Send a synthetic enquiry from the contact page to test the
                      complete flow.
                    </p>
                    <Link className="text-link" to="/contact">
                      Open enquiry form
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                )
              ) : (
                <>
                  <div className="notice">
                    Enquiries are safely stored. No notification can be sent
                    until an email provider is configured; no delivery is
                    implied.
                  </div>
                  {failures.length ? (
                    <div className="table-scroll">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Enquiry</th>
                            <th>Status</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {failures.map((f) => (
                            <tr key={f.id}>
                              <td>{f.reference}</td>
                              <td>{f.status}</td>
                              <td>{f.safe_error_code}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p>No notification issues.</p>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
