import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowUpRight, RotateCw } from "lucide-react";
import {
  enquirySchema,
  resultSchema,
  serviceNames,
  serviceIds,
  type EnquiryInput,
} from "../../../../packages/contracts/src/index";

export const meta = () => [
  { title: "Discuss your project — Nextgen Tech" },
  {
    name: "description",
    content:
      "Tell Nextgen Tech about your consulting, application development, AI integration or training needs.",
  },
];
type FormSession = {
  submissionToken: string;
  privacyNoticeVersion: string;
  mode: string;
};
type Attempt = { key: string; payload: EnquiryInput };
export default function Contact() {
  const [params] = useSearchParams(),
    navigate = useNavigate();
  const selected = params.get("service");
  const [service, setService] = useState<string>("not_sure");
  useEffect(() => {
    setService(
      serviceIds.includes(selected as (typeof serviceIds)[number])
        ? selected!
        : "not_sure",
    );
  }, [selected]);
  const [session, setSession] = useState<FormSession | null>(null),
    [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "pending" | "uncertain">("idle"),
    [notice, setNotice] = useState(""),
    [length, setLength] = useState(0),
    [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const attempt = useRef<Attempt | null>(null);
  const summary = useRef<HTMLDivElement>(null);
  async function connect() {
    try {
      const r = await fetch("/api/v1/enquiry-session", {
        credentials: "same-origin",
      });
      if (!r.ok) throw Error();
      const body = await r.json();
      setSession(body.data);
      return body.data as FormSession;
    } catch {
      setNotice(
        "The enquiry service is unavailable. Your entered details stay on this page. Reconnect when you’re ready.",
      );
      return null;
    }
  }
  useEffect(() => {
    void connect();
  }, []);
  useEffect(() => {
    if (!retryAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [retryAt]);
  useEffect(() => {
    if (Object.keys(errors).length) summary.current?.focus();
  }, [errors]);
  async function send(
    current: Attempt,
    connection: FormSession,
    refreshed = false,
  ) {
    setState("pending");
    setNotice("");
    try {
      const response = await fetch("/api/v1/enquiries", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": current.key,
        },
        body: JSON.stringify({
          ...current.payload,
          submissionToken: connection.submissionToken,
        }),
        signal: AbortSignal.timeout(15000),
      });
      const body = await response.json();
      if (response.ok) {
        const result = resultSchema.parse(body);
        sessionStorage.setItem("ng-received-reference", result.data.reference);
        attempt.current = null;
        navigate("/thank-you");
        return;
      }
      if (body.error?.code === "SUBMISSION_TOKEN_EXPIRED" && !refreshed) {
        const fresh = await connect();
        if (fresh) {
          await send(current, fresh, true);
          return;
        }
      }
      if (response.status === 422) {
        setErrors(body.error.fields ?? {});
        attempt.current = null;
        setState("idle");
        setNotice(body.error.message);
        return;
      }
      if (response.status === 429) {
        setRetryAt(
          Date.now() + Number(response.headers.get("Retry-After") ?? 60) * 1000,
        );
      }
      setNotice(
        body.error?.message ??
          "We could not confirm the result. Retry this same enquiry.",
      );
      setState("uncertain");
    } catch {
      setState("uncertain");
      setNotice(
        "We couldn’t confirm whether your enquiry was received. Retry the same enquiry below; the submission key prevents a duplicate. Keep this page open.",
      );
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || state !== "idle") return;
    const fd = new FormData(event.currentTarget);
    const optional = (name: string) =>
      String(fd.get(name) ?? "").trim() || undefined;
    const raw = {
      name: fd.get("name"),
      email: fd.get("email"),
      service,
      message: fd.get("message"),
      company: optional("company"),
      role: optional("role"),
      phone: optional("phone"),
      budget: optional("budget"),
      timeframe: optional("timeframe"),
      privacyAcknowledged: fd.get("privacyAcknowledged") === "on",
      privacyNoticeVersion: session.privacyNoticeVersion,
      marketingConsent: fd.get("marketingConsent") === "on",
      sourceRoute: "/contact",
      submissionToken: session.submissionToken,
      ...(service === "ai_training"
        ? {
            training: {
              teamSize: optional("teamSize"),
              experience: optional("experience"),
              topics: optional("topics"),
              delivery: optional("delivery"),
              location: optional("location"),
              preferredDates: optional("preferredDates"),
            },
          }
        : {}),
      ...(service === "ai_agents_integration"
        ? {
            ai: {
              existingSystems: optional("existingSystems"),
              dataSensitivity: optional("dataSensitivity"),
            },
          }
        : {}),
    };
    const parsed = enquirySchema.safeParse(raw);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join("."), i.message]),
        ),
      );
      return;
    }
    setErrors({});
    attempt.current = { key: crypto.randomUUID(), payload: parsed.data };
    void send(attempt.current, session);
  }
  const attrs = (id: string) => ({
    id,
    name: id,
    "aria-invalid": Boolean(errors[id]),
    "aria-describedby": errors[id] ? `${id}-error` : undefined,
  });
  const error = (id: string) =>
    errors[id] ? (
      <span className="field-error" id={`${id}-error`}>
        {errors[id]}
      </span>
    ) : null;
  const busy = state !== "idle";
  return (
    <>
      <section className="public-wrap public-contact-head">
        <h1>Let’s talk.</h1>
        <p>
          A few details are enough to start. You don’t need a finished brief or
          the technical answer.
        </p>
      </section>
      <div className="container contact-grid">
        <div>
          <div className="notice">
            Local development form. Use synthetic details for testing. Enquiries
            are stored on this computer; no email is sent.
          </div>
          {!!Object.keys(errors).length && (
            <div
              className="notice error"
              ref={summary}
              tabIndex={-1}
              role="alert"
            >
              <h2>Check a few details</h2>
              <ul>
                {Object.entries(errors).map(([key, message]) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => document.getElementById(key)?.focus()}
                    >
                      {message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {notice && (
            <div className="notice error" role="alert">
              {notice}
            </div>
          )}
          {!session && (
            <button
              className="text-link"
              type="button"
              onClick={() => void connect()}
            >
              <RotateCw size={16} />
              Reconnect enquiry form
            </button>
          )}
          <form
            onSubmit={submit}
            noValidate
            onChange={(event) => {
              const field =
                event.target instanceof Element
                  ? event.target.getAttribute("name")
                  : null;
              setErrors((current) =>
                Object.fromEntries(
                  Object.entries(current).filter(
                    ([key]) =>
                      key !== field &&
                      key !== `training.${field}` &&
                      key !== `ai.${field}`,
                  ),
                ),
              );
            }}
          >
            <fieldset
              disabled={busy}
              style={{ border: 0, padding: 0, margin: 0 }}
            >
              <legend className="sr-only">Your enquiry</legend>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="name">Your name *</label>
                  <input
                    {...attrs("name")}
                    autoComplete="name"
                    required
                    maxLength={120}
                    placeholder="Your name"
                  />
                  {error("name")}
                </div>
                <div className="field">
                  <label htmlFor="email">Email address *</label>
                  <input
                    {...attrs("email")}
                    autoComplete="email"
                    type="email"
                    required
                    maxLength={254}
                    placeholder="you@example.com"
                  />
                  {error("email")}
                </div>
                <div className="field field-wide">
                  <label htmlFor="service">What can we help with? *</label>
                  <select
                    {...attrs("service")}
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                  >
                    {serviceIds.map((id) => (
                      <option value={id} key={id}>
                        {serviceNames[id]}
                      </option>
                    ))}
                  </select>
                  {error("service")}
                </div>
                <div className="field field-wide">
                  <label htmlFor="message">Tell us about the challenge *</label>
                  <textarea
                    {...attrs("message")}
                    required
                    minLength={30}
                    maxLength={5000}
                    onChange={(e) => setLength(e.target.value.length)}
                    placeholder="What would you like to improve? Who is it for, and what would a useful outcome look like?"
                    aria-describedby={`message-help${errors.message ? " message-error" : ""}`}
                  />
                  <span id="message-help" className="field-help">
                    30–5,000 characters · {length.toLocaleString()} entered. Do
                    not include passwords or confidential information.
                  </span>
                  {error("message")}
                </div>
                {service === "ai_training" && (
                  <div className="conditional-fields">
                    <h2>About your team</h2>
                    <div className="field">
                      <label htmlFor="teamSize">
                        Team size <span>Optional</span>
                      </label>
                      <select
                        id="teamSize"
                        name="teamSize"
                        defaultValue="not_sure"
                      >
                        <option value="not_sure">Not sure yet</option>
                        <option value="1_5">1–5 people</option>
                        <option value="6_20">6–20 people</option>
                        <option value="21_50">21–50 people</option>
                        <option value="over_50">More than 50 people</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="experience">
                        Current experience <span>Optional</span>
                      </label>
                      <select id="experience" name="experience">
                        <option value="">Select experience</option>
                        <option value="beginner">Getting started</option>
                        <option value="mixed">Mixed experience</option>
                        <option value="technical">Technical team</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="topics">
                        Topics you want to explore <span>Optional</span>
                      </label>
                      <input id="topics" name="topics" maxLength={1000} />
                    </div>
                    <div className="field">
                      <label htmlFor="delivery">
                        Preferred format <span>Optional</span>
                      </label>
                      <select id="delivery" name="delivery">
                        <option value="not_sure">Let’s discuss</option>
                        <option value="remote">Remote</option>
                        <option value="in_person">In person</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="location">
                        Location <span>Optional</span>
                      </label>
                      <input id="location" name="location" maxLength={160} />
                    </div>
                    <div className="field">
                      <label htmlFor="preferredDates">
                        Preferred dates <span>Optional</span>
                      </label>
                      <input
                        id="preferredDates"
                        name="preferredDates"
                        maxLength={200}
                      />
                    </div>
                  </div>
                )}
                {service === "ai_agents_integration" && (
                  <div className="conditional-fields">
                    <h2>About the workflow</h2>
                    <div className="field">
                      <label htmlFor="existingSystems">
                        Existing systems <span>Optional</span>
                      </label>
                      <input
                        id="existingSystems"
                        name="existingSystems"
                        maxLength={1000}
                        placeholder="System names only — no credentials"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="dataSensitivity">
                        Broad data category <span>Optional</span>
                      </label>
                      <select id="dataSensitivity" name="dataSensitivity">
                        <option value="not_sure">Not sure</option>
                        <option value="public">Public information</option>
                        <option value="internal">
                          Internal business information
                        </option>
                        <option value="sensitive">
                          Sensitive information — discuss privately
                        </option>
                      </select>
                    </div>
                  </div>
                )}
                <div className="field">
                  <label htmlFor="company">
                    Company <span>Optional</span>
                  </label>
                  <input
                    {...attrs("company")}
                    autoComplete="organization"
                    maxLength={160}
                  />
                  {error("company")}
                </div>
                <div className="field">
                  <label htmlFor="role">
                    Your role <span>Optional</span>
                  </label>
                  <input
                    {...attrs("role")}
                    autoComplete="organization-title"
                    maxLength={160}
                  />
                  {error("role")}
                </div>
                <div className="field">
                  <label htmlFor="phone">
                    Phone <span>Optional</span>
                  </label>
                  <input
                    {...attrs("phone")}
                    autoComplete="tel"
                    type="tel"
                    maxLength={40}
                  />
                  {error("phone")}
                </div>
                <div className="field">
                  <label htmlFor="timeframe">
                    Timeframe <span>Optional</span>
                  </label>
                  <select {...attrs("timeframe")}>
                    <option value="">Select a timeframe</option>
                    <option value="exploring">Just exploring</option>
                    <option value="within_3_months">Within 3 months</option>
                    <option value="3_6_months">3–6 months</option>
                    <option value="later">Further ahead</option>
                  </select>
                  {error("timeframe")}
                </div>
                <div className="field field-wide">
                  <label htmlFor="budget">
                    Indicative budget (MYR){" "}
                    <span>Optional · Not a service price</span>
                  </label>
                  <select {...attrs("budget")} defaultValue="not_sure">
                    <option value="not_sure">Not sure — let’s discuss</option>
                    <option value="under_5k">Under RM5,000</option>
                    <option value="5k_20k">RM5,000–RM20,000</option>
                    <option value="20k_50k">RM20,000–RM50,000</option>
                    <option value="over_50k">Over RM50,000</option>
                  </select>
                  {error("budget")}
                </div>
              </div>
              <label className="checkbox-field">
                <input
                  {...attrs("privacyAcknowledged")}
                  type="checkbox"
                  required
                />
                <span>
                  I have read the{" "}
                  <Link to="/privacy" target="_blank" rel="noopener">
                    development privacy information (opens in a new tab)
                  </Link>{" "}
                  and understand this local form stores my submitted details. *
                </span>
              </label>
              {error("privacyAcknowledged")}
              <label className="checkbox-field">
                <input
                  id="marketingConsent"
                  name="marketingConsent"
                  type="checkbox"
                />
                <span>
                  Optionally record my interest in future updates. No marketing
                  service is connected in this preview.
                </span>
              </label>
            </fieldset>
            <div className="submit-row">
              <button
                className="button"
                type="submit"
                disabled={!session || busy}
              >
                {state === "pending" ? "Recording enquiry…" : "Send enquiry"}
                <ArrowUpRight size={19} />
              </button>
              <span>No purchase, meeting or training place is booked.</span>
            </div>
            <div className="sr-only" role="status">
              {state === "pending"
                ? "Recording your enquiry. Please wait."
                : ""}
            </div>
          </form>
          {state === "uncertain" && (
            <button
              type="button"
              className="button button-outline"
              style={{ marginTop: 20 }}
              disabled={retryAt > now}
              onClick={async () => {
                const fresh = await connect();
                if (fresh && attempt.current) void send(attempt.current, fresh);
              }}
            >
              <RotateCw size={16} />
              {retryAt > now
                ? `Retry in ${Math.ceil((retryAt - now) / 1000)}s`
                : "Retry the same enquiry"}
            </button>
          )}
        </div>
        <aside className="contact-aside">
          <h2>What happens next?</h2>
          <p>
            Tell us what isn’t working, what you’re imagining, or where your
            team could use support.
          </p>
          <ol>
            <li>
              Choose a service—or let us help you find the right starting point.
            </li>
            <li>Describe the people, workflow and outcome that matter.</li>
            <li>Keep the enquiry reference once your details are recorded.</li>
          </ol>
          <p className="aside-note">
            Scope, availability and next steps are discussed separately. Please
            don’t send confidential documents or access credentials.
          </p>
          <Link className="text-link" to="/services">
            Still exploring? View our services
            <ArrowUpRight size={16} />
          </Link>
        </aside>
      </div>
    </>
  );
}
