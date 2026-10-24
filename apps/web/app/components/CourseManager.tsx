import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useBeforeUnload, useBlocker } from "react-router";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  courseInputSchema,
  editableCourse,
  emptyCourse,
  trainingCatalogueSchema,
  type CourseInput,
  type TrainingCatalogue,
  type TrainingCourse,
} from "../../../../packages/contracts/src/training-courses";
import "../styles/training-courses.css";

type Props = {
  request: (path: string, method?: string, body?: unknown) => Promise<any>;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
};
type RequestError = Error & {
  code?: string;
  status?: number;
  fields?: Record<string, string>;
};
const labels = { draft: "Draft", published: "Published", archived: "Archived" };
const fields = [
  { key: "title", label: "Course title", max: 160 },
  { key: "audience", label: "Who it’s for", max: 250 },
  {
    key: "duration",
    label: "Duration",
    max: 120,
    help: "Use “To be confirmed” until the duration is agreed.",
  },
  {
    key: "format",
    label: "Delivery format",
    max: 120,
    help: "Use “To be confirmed” until the format is agreed.",
  },
  {
    key: "summary",
    label: "Short summary",
    max: 500,
    multiline: true,
    optional: true,
  },
  {
    key: "outline",
    label: "Course outline",
    max: 4000,
    multiline: true,
    help: "Plain text. Line breaks will appear on the website.",
  },
] as const;

export function CourseManager({ request, onDirtyChange, onBusyChange }: Props) {
  const [catalogue, setCatalogue] = useState<TrainingCatalogue | null>(null);
  const [selected, setSelected] = useState<string>("new");
  const [draft, setDraft] = useState<CourseInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState(false);
  const [message, setMessage] = useState("");
  const errorBox = useRef<HTMLDivElement>(null);
  const requestRef = useRef(request);
  requestRef.current = request;
  const loadSequence = useRef(0);
  const current = catalogue?.courses.find((course) => course.id === selected);
  const dirty = Boolean(
    draft &&
    JSON.stringify(draft) !==
      JSON.stringify(current ? editableCourse(current) : emptyCourse),
  );
  const busy = loading || pending;

  useEffect(() => {
    onDirtyChange(dirty || pending);
  }, [dirty, pending, onDirtyChange]);
  useEffect(() => {
    onBusyChange(pending);
  }, [pending, onBusyChange]);
  useEffect(
    () => () => {
      loadSequence.current++;
      onDirtyChange(false);
      onBusyChange(false);
    },
    [onDirtyChange, onBusyChange],
  );
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (dirty || pending) {
          event.preventDefault();
          event.returnValue = "";
        }
      },
      [dirty, pending],
    ),
  );
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (dirty || pending) &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );
  useEffect(() => {
    if (blocker.state === "blocked") {
      if (!pending && window.confirm("Discard your unsaved course changes?"))
        blocker.proceed();
      else blocker.reset();
    }
  }, [blocker, pending]);
  useEffect(() => {
    if (error) errorBox.current?.focus();
  }, [error]);

  function clearFeedback() {
    setError("");
    setFieldErrors({});
    setConflict(false);
    setMessage("");
  }
  function accept(next: TrainingCatalogue, id?: string) {
    setCatalogue(next);
    const course =
      next.courses.find((item) => item.id === id) ??
      (id === "new" ? undefined : next.courses[0]);
    setSelected(course?.id ?? "new");
    setDraft(course ? editableCourse(course) : { ...emptyCourse });
    clearFeedback();
  }
  function fail(cause: unknown) {
    const failure = cause as RequestError;
    setError(
      failure.status === 401
        ? "Your staff session ended. Your edits are still here. Copy any unsaved changes before signing out and opening the workspace again."
        : failure.message || "The catalogue could not be saved. Try again.",
    );
    setConflict(failure.code === "CATALOGUE_CONFLICT");
    setFieldErrors(
      Object.fromEntries(
        Object.entries(failure.fields ?? {}).map(([key, value]) => [
          key.replace(/^course\./, ""),
          value,
        ]),
      ),
    );
  }
  const load = useCallback(async (id?: string) => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setError("");
    try {
      const body = await requestRef.current("/admin/training-courses");
      const fresh = trainingCatalogueSchema.parse(body.data);
      if (sequence === loadSequence.current) accept(fresh, id);
    } catch (cause) {
      if (sequence === loadSequence.current) fail(cause);
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  function reload() {
    if (
      busy ||
      (dirty &&
        !window.confirm(
          "Discard your unsaved course changes and reload the catalogue?",
        ))
    )
      return;
    void load(selected);
  }
  function choose(course?: TrainingCourse) {
    if (busy || course?.id === selected) return;
    if (dirty && !window.confirm("Discard your unsaved course changes?"))
      return;
    setSelected(course?.id ?? "new");
    setDraft(course ? editableCourse(course) : { ...emptyCourse });
    clearFeedback();
  }
  function update<K extends keyof CourseInput>(key: K, value: CourseInput[K]) {
    setDraft((previous) => previous && { ...previous, [key]: value });
    setFieldErrors((previous) => {
      const next = { ...previous };
      delete next[key];
      return next;
    });
    setMessage("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!catalogue || !draft || busy || conflict) return;
    clearFeedback();
    const parsed = courseInputSchema.safeParse(draft);
    if (!parsed.success) {
      setFieldErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ]),
        ),
      );
      setError("Check the highlighted course details. Nothing has been saved.");
      return;
    }
    setPending(true);
    try {
      const body = await request(
        "/admin/training-courses" + (current ? `/${current.id}` : ""),
        current ? "PUT" : "POST",
        {
          expectedVersion: catalogue.version,
          course: parsed.data,
        },
      );
      const next = trainingCatalogueSchema.parse(body.data);
      const savedId =
        current?.id ??
        next.courses.find(
          (course) => !catalogue.courses.some((old) => old.id === course.id),
        )?.id;
      accept(next, savedId);
      setMessage(
        parsed.data.status === "published"
          ? "Published. This course is now visible in the website catalogue."
          : parsed.data.status === "archived"
            ? "Saved. This archived course stays off the website."
            : "Draft saved. This course is not visible on the website.",
      );
    } catch (cause) {
      fail(cause);
    } finally {
      setPending(false);
    }
  }
  async function archive() {
    if (
      !catalogue ||
      !current ||
      busy ||
      dirty ||
      conflict ||
      !window.confirm(
        `Archive “${current.title}”? It will be removed from the website. You can restore it later.`,
      )
    )
      return;
    clearFeedback();
    setPending(true);
    try {
      const body = await request(
        `/admin/training-courses/${current.id}`,
        "DELETE",
        { expectedVersion: catalogue.version },
      );
      accept(trainingCatalogueSchema.parse(body.data), current.id);
      setMessage(
        "Course archived and removed from the website. Choose Draft or Published below to restore it.",
      );
    } catch (cause) {
      fail(cause);
    } finally {
      setPending(false);
    }
  }
  const active =
    catalogue?.courses.filter((course) => course.status !== "archived") ?? [];
  const archived =
    catalogue?.courses.filter((course) => course.status === "archived") ?? [];
  async function move(id: string, delta: number) {
    if (!catalogue || busy || dirty || conflict) return;
    const order = [...active];
    const index = order.findIndex((course) => course.id === id);
    if (index < 0 || index + delta < 0 || index + delta >= order.length) return;
    [order[index], order[index + delta]] = [order[index + delta], order[index]];
    clearFeedback();
    setPending(true);
    try {
      const body = await request("/admin/training-courses/reorder", "POST", {
        expectedVersion: catalogue.version,
        courseIds: [...order, ...archived].map((course) => course.id),
      });
      accept(trainingCatalogueSchema.parse(body.data), selected);
      setMessage(
        `Order saved. “${active[index].title}” moved ${delta < 0 ? "up" : "down"}.`,
      );
    } catch (cause) {
      fail(cause);
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      className="course-manager"
      aria-label="Team training editor"
      aria-busy={busy}
    >
      <div className="course-toolbar">
        <p>
          Save course details, choose what goes live, and set the catalogue
          order.
        </p>
        <div>
          <Link
            className="text-link"
            to="/training#courses"
            target="_blank"
            rel="noreferrer"
          >
            View catalogue <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="text-link"
            onClick={reload}
            disabled={busy}
          >
            <RefreshCw size={16} aria-hidden="true" /> Reload catalogue
          </button>
        </div>
      </div>
      {error && (
        <div
          className="notice error course-feedback"
          role="alert"
          tabIndex={-1}
          ref={errorBox}
        >
          <p>{error}</p>
          {conflict && (
            <p>
              Your unsaved edits have been kept. Copy them if needed, then{" "}
              <button type="button" disabled={busy} onClick={reload}>
                reload the catalogue
              </button>{" "}
              to see the latest saved version.
            </p>
          )}
          {!catalogue && !loading && (
            <button type="button" onClick={reload}>
              Try loading again
            </button>
          )}
        </div>
      )}
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
      {loading && (
        <div className="course-loading" role="status">
          <p>Loading course catalogue…</p>
          <span />
          <span />
        </div>
      )}
      {catalogue && !loading && (
        <div className="course-manager-layout">
          <aside className="course-list">
            <div className="course-list-heading">
              <h2>Courses ({active.length})</h2>
              <button
                type="button"
                className="text-link"
                onClick={() => choose()}
                disabled={busy}
              >
                <Plus size={16} aria-hidden="true" /> Add course
              </button>
            </div>
            {!active.length && (
              <p className="course-help">
                No active courses. Add a course or restore one from the archive.
              </p>
            )}
            <ol aria-label="Course order">
              {active.map((course, index) => (
                <li key={course.id}>
                  <button
                    type="button"
                    className="course-select"
                    aria-pressed={selected === course.id}
                    onClick={() => choose(course)}
                    disabled={busy}
                  >
                    <strong>{course.title}</strong>
                    <span
                      className={`course-state course-state-${course.status}`}
                    >
                      {labels[course.status]}
                    </span>
                  </button>
                  <div className="course-order-actions">
                    <button
                      type="button"
                      aria-label={`Move ${course.title} up`}
                      title="Move up"
                      disabled={busy || dirty || conflict || index === 0}
                      onClick={() => void move(course.id, -1)}
                    >
                      <ArrowUp size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${course.title} down`}
                      title="Move down"
                      disabled={
                        busy || dirty || conflict || index === active.length - 1
                      }
                      onClick={() => void move(course.id, 1)}
                    >
                      <ArrowDown size={16} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
            <p className="course-help">
              Drafts stay private. Published courses appear in this order.
              Moving a course saves the order immediately.
            </p>
            {!!archived.length && (
              <>
                <h2 className="course-archive-heading">
                  Archived ({archived.length})
                </h2>
                <ul aria-label="Archived courses">
                  {archived.map((course) => (
                    <li key={course.id}>
                      <button
                        type="button"
                        className="course-select"
                        aria-pressed={selected === course.id}
                        onClick={() => choose(course)}
                        disabled={busy}
                      >
                        <strong>{course.title}</strong>
                        <span className="course-state">Archived</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>
          {draft && (
            <form className="course-editor" onSubmit={save} noValidate>
              <div className="course-editor-heading">
                <h2>{current ? "Edit course" : "New course"}</h2>
                <span role="status">
                  {dirty
                    ? "Unsaved changes"
                    : current
                      ? labels[current.status]
                      : "Not saved yet"}
                </span>
              </div>
              <fieldset disabled={busy}>
                <legend className="sr-only">Course information</legend>
                <div className="course-fields">
                  {fields.map((field) => {
                    const id = `course-${field.key}`;
                    const required = !("optional" in field && field.optional);
                    const help = "help" in field ? field.help : undefined;
                    const attributes = {
                      id,
                      name: field.key,
                      value: draft[field.key],
                      required,
                      maxLength: field.max,
                      onChange: (
                        event: ChangeEvent<
                          HTMLInputElement | HTMLTextAreaElement
                        >,
                      ) => update(field.key, event.target.value),
                      "aria-invalid": !!fieldErrors[field.key],
                      "aria-describedby":
                        [
                          help ? `${id}-help` : "",
                          fieldErrors[field.key] ? `${id}-error` : "",
                        ]
                          .filter(Boolean)
                          .join(" ") || undefined,
                    };
                    return (
                      <div
                        className={`field ${field.key === "title" || "multiline" in field ? "course-field-wide" : ""}`}
                        key={field.key}
                      >
                        <label htmlFor={id}>
                          {field.label}
                          {required ? " *" : " (optional)"}
                        </label>
                        {"multiline" in field ? (
                          <textarea
                            {...attributes}
                            rows={field.key === "outline" ? 6 : 3}
                          />
                        ) : (
                          <input {...attributes} type="text" />
                        )}
                        {help && (
                          <p className="course-help" id={`${id}-help`}>
                            {help}
                          </p>
                        )}
                        {fieldErrors[field.key] && (
                          <p className="field-error" id={`${id}-error`}>
                            {fieldErrors[field.key]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <label className="course-checkbox">
                  <input
                    type="checkbox"
                    checked={draft.isPlaceholder}
                    onChange={(event) =>
                      update("isPlaceholder", event.target.checked)
                    }
                  />{" "}
                  Show a placeholder disclosure for this course
                </label>
                <div className="course-publishing">
                  <div className="field">
                    <label htmlFor="course-status">Visibility</label>
                    <select
                      id="course-status"
                      value={draft.status}
                      onChange={(event) =>
                        update(
                          "status",
                          event.target.value as CourseInput["status"],
                        )
                      }
                      aria-describedby="course-visibility-help"
                    >
                      <option value="draft">Draft — private</option>
                      <option value="published">
                        Published — on the website
                      </option>
                      <option value="archived">
                        Archived — off the website
                      </option>
                    </select>
                  </div>
                  <p className="course-help" id="course-visibility-help">
                    {draft.status === "published"
                      ? "Saving publishes all the details above to the website."
                      : draft.status === "draft"
                        ? "Saving keeps this course private. If it is currently published, it will leave the public catalogue."
                        : "Saving removes this course from the website and keeps its details here. To restore it, choose Draft or Published and save."}
                  </p>
                </div>
              </fieldset>
              <div className="course-editor-actions">
                <button
                  className="button"
                  type="submit"
                  disabled={busy || conflict || (!!current && !dirty)}
                >
                  {pending
                    ? "Saving…"
                    : draft.status === "published"
                      ? "Save & publish"
                      : draft.status === "draft"
                        ? "Save draft"
                        : "Save archived course"}
                </button>
                <button
                  className="button button-outline"
                  type="button"
                  disabled={busy || !dirty}
                  onClick={() => {
                    if (
                      window.confirm("Discard your unsaved course changes?")
                    ) {
                      setDraft(
                        current ? editableCourse(current) : { ...emptyCourse },
                      );
                      clearFeedback();
                    }
                  }}
                >
                  Discard changes
                </button>
                {current && current.status !== "archived" && (
                  <button
                    className="text-link course-archive-action"
                    type="button"
                    disabled={busy || dirty || conflict}
                    onClick={() => void archive()}
                  >
                    Archive course
                  </button>
                )}
              </div>
              {dirty && (
                <p className="course-help">
                  Save or discard your edits before reordering or archiving a
                  course.
                </p>
              )}
            </form>
          )}
        </div>
      )}
    </section>
  );
}
