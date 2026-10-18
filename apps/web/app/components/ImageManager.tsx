import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useBlocker, useBeforeUnload } from "react-router";
import {
  ArrowUpRight,
  Check,
  ImagePlus,
  RefreshCw,
  RotateCcw,
  Upload,
} from "lucide-react";
import {
  imageSlots,
  maxImageBytes,
  type ImageSlotId,
  type SiteImage,
  type ImageDetails,
} from "../../../../packages/contracts/src/site-images";

type Props = {
  request: (path: string, method?: string, body?: unknown) => Promise<any>;
  onDirtyChange: (dirty: boolean) => void;
};
const details = (image: SiteImage): ImageDetails => ({
  alt: image.alt,
  caption: image.caption,
  name: image.name,
  role: image.role,
  focalX: image.focalX,
  focalY: image.focalY,
  isPlaceholder: image.isPlaceholder,
});
export function ImageManager({ request, onDirtyChange }: Props) {
  const [images, setImages] = useState<SiteImage[]>([]),
    [selected, setSelected] = useState<ImageSlotId>("about-workplace");
  const [draft, setDraft] = useState<ImageDetails | null>(null),
    [file, setFile] = useState<{
      name: string;
      type: string;
      base64: string;
    } | null>(null);
  const [loading, setLoading] = useState(true),
    [pending, setPending] = useState(false),
    [reading, setReading] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null),
    reader = useRef<FileReader | null>(null),
    errorBox = useRef<HTMLDivElement>(null);
  const current = images.find((image) => image.slot === selected);
  const slot = imageSlots.find((item) => item.id === selected)!;
  const dirty = Boolean(
    current &&
    draft &&
    (file || JSON.stringify(draft) !== JSON.stringify(details(current))),
  );
  useEffect(() => {
    onDirtyChange(dirty || pending || reading);
  }, [dirty, pending, reading, onDirtyChange]);
  useEffect(
    () => () => {
      reader.current?.abort();
      onDirtyChange(false);
    },
    [onDirtyChange],
  );
  useBeforeUnload(
    useCallback(
      (event: BeforeUnloadEvent) => {
        if (dirty || pending || reading) {
          event.preventDefault();
          event.returnValue = "";
        }
      },
      [dirty, pending, reading],
    ),
  );
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (dirty || pending || reading) &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );
  useEffect(() => {
    if (blocker.state === "blocked") {
      if (
        !pending &&
        !reading &&
        window.confirm("Discard your unsaved image changes?")
      )
        blocker.proceed();
      else blocker.reset();
    }
  }, [blocker, pending, reading]);
  useEffect(() => {
    if (error) errorBox.current?.focus();
  }, [error]);
  function resetDraft(image: SiteImage) {
    setDraft(details(image));
    setFile(null);
    setError("");
    setMessage("");
    if (input.current) input.current.value = "";
  }
  async function load() {
    setLoading(true);
    setError("");
    try {
      const body = await request("/admin/site-images");
      setImages(body.data);
      const fresh = body.data.find((item: SiteImage) => item.slot === selected);
      resetDraft(fresh);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function choose(id: ImageSlotId) {
    if (pending || reading || id === selected) return;
    if (dirty && !window.confirm("Discard your unsaved image changes?")) return;
    setSelected(id);
    const next = images.find((item) => item.slot === id);
    if (next) resetDraft(next);
  }
  function update<K extends keyof ImageDetails>(
    key: K,
    value: ImageDetails[K],
  ) {
    setDraft((previous) =>
      previous ? { ...previous, [key]: value } : previous,
    );
    setMessage("");
  }
  function pick(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    if (!next) return;
    setError("");
    setMessage("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(next.type) ||
      next.size > maxImageBytes ||
      !next.size
    ) {
      setError("Choose a JPG, PNG or WebP photo under 5 MB.");
      event.target.value = "";
      return;
    }
    reader.current?.abort();
    const fr = new FileReader();
    reader.current = fr;
    setReading(true);
    fr.onload = () => {
      setFile({
        name: next.name,
        type: next.type,
        base64: String(fr.result).split(",")[1],
      });
      setReading(false);
    };
    fr.onerror = () => {
      setError("This file could not be read. Choose it again.");
      setReading(false);
    };
    fr.onabort = () => setReading(false);
    fr.readAsDataURL(next);
  }
  function accept(image: SiteImage) {
    setImages((previous) =>
      previous.map((item) => (item.slot === image.slot ? image : item)),
    );
    resetDraft(image);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!current || !draft || pending || reading) return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const body = await request(`/admin/site-images/${selected}`, "PUT", {
        ...draft,
        expectedVersion: current.version,
        ...(file ? { image: { type: file.type, base64: file.base64 } } : {}),
      });
      accept(body.data);
      setMessage("Published. Your image and details are now on the website.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  async function restore() {
    if (
      !current ||
      pending ||
      reading ||
      !window.confirm(
        "Restore the AI placeholder? The uploaded photo and its details will be removed from this placement. Keep your original file if you want to use it again.",
      )
    )
      return;
    setPending(true);
    setError("");
    setMessage("");
    try {
      const body = await request(`/admin/site-images/${selected}`, "DELETE", {
        expectedVersion: current.version,
      });
      accept(body.data);
      setMessage(
        "AI placeholder restored. The previous upload is no longer stored in this placement.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="image-manager" aria-label="Site image editor">
      {error && (
        <div
          className="notice error image-manager-error"
          role="alert"
          tabIndex={-1}
          ref={errorBox}
        >
          {error}
          <button
            type="button"
            className="text-link"
            disabled={pending || reading}
            onClick={() => {
              if (
                !dirty ||
                window.confirm(
                  "Reload this placement and discard unsaved changes?",
                )
              )
                void load();
            }}
          >
            Reload saved images
          </button>
        </div>
      )}
      {loading ? (
        <div className="image-manager-loading" role="status">
          Loading image placements…
        </div>
      ) : !current || !draft ? (
        <div className="admin-empty">
          <h2>Images couldn’t load.</h2>
          <p>Your saved images have not been changed.</p>
          <button className="button" onClick={() => void load()}>
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      ) : (
        <div className="image-manager-layout">
          <aside className="image-placement-list">
            <h2>Image placements</h2>
            <nav aria-label="Image placements">
              {imageSlots.map((def) => {
                const photo = images.find((item) => item.slot === def.id);
                return (
                  <button
                    key={def.id}
                    type="button"
                    aria-pressed={selected === def.id}
                    disabled={pending || reading}
                    onClick={() => choose(def.id)}
                  >
                    <img src={photo?.src} alt="" width={48} height={48} />
                    <span>
                      <strong>{def.label}</strong>
                      <small>
                        {photo?.uploaded
                          ? photo.isPlaceholder
                            ? "Uploaded · placeholder"
                            : "Your photo"
                          : "AI placeholder"}
                      </small>
                    </span>
                  </button>
                );
              })}
            </nav>
            <p>
              Replace the temporary images with photos you have permission to
              publish.
            </p>
          </aside>
          <form className="image-editor" onSubmit={save}>
            <div className="image-editor-heading">
              <div>
                <h2>{slot.label}</h2>
                <p>{slot.hint}</p>
              </div>
              <a href={slot.page} target="_blank" rel="noreferrer">
                View page <ArrowUpRight size={16} />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
            <div className="image-editor-body">
              <div className="image-editor-visual">
                <div
                  className={`image-editor-preview${selected.startsWith("team-") ? " portrait" : ""}`}
                  style={{ aspectRatio: slot.ratio }}
                >
                  <img
                    src={
                      file
                        ? `data:${file.type};base64,${file.base64}`
                        : current.src
                    }
                    alt={draft.alt}
                    style={{
                      objectPosition: `${draft.focalX}% ${draft.focalY}%`,
                    }}
                  />
                </div>
                <p className="image-preview-label">
                  {file
                    ? "New image · not published"
                    : dirty
                      ? "Unsaved preview"
                      : draft.isPlaceholder
                        ? "AI-generated placeholder"
                        : "Published image"}
                </p>
                <label className="image-upload-label" htmlFor="site-image-file">
                  <ImagePlus size={19} />{" "}
                  {file ? "Choose another photo" : "Choose a photo"}
                </label>
                <input
                  id="site-image-file"
                  ref={input}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={pick}
                  disabled={pending || reading}
                />
                <p className="field-help">
                  JPG, PNG or WebP · up to 5 MB / 25 MP. Images are optimised
                  and location metadata is removed.
                </p>
                <fieldset
                  className="image-position"
                  disabled={pending || reading}
                >
                  <legend>Adjust the crop</legend>
                  <label htmlFor="image-x">
                    Horizontal <output>{draft.focalX}%</output>
                  </label>
                  <input
                    id="image-x"
                    type="range"
                    min="0"
                    max="100"
                    value={draft.focalX}
                    onChange={(e) => update("focalX", Number(e.target.value))}
                  />
                  <label htmlFor="image-y">
                    Vertical <output>{draft.focalY}%</output>
                  </label>
                  <input
                    id="image-y"
                    type="range"
                    min="0"
                    max="100"
                    value={draft.focalY}
                    onChange={(e) => update("focalY", Number(e.target.value))}
                  />
                  <p className="field-help">
                    The frame above matches this placement. A slider only moves
                    the image if that edge is cropped.
                  </p>
                </fieldset>
              </div>
              <fieldset
                className="image-editor-fields"
                disabled={pending || reading}
              >
                <legend className="sr-only">Image details</legend>
                <div className="field">
                  <label htmlFor="image-alt">Image description *</label>
                  <textarea
                    id="image-alt"
                    required
                    minLength={3}
                    maxLength={250}
                    value={draft.alt}
                    onChange={(e) => update("alt", e.target.value)}
                  />
                  <span className="field-help">
                    Describe what’s in the photo for people using screen
                    readers.
                  </span>
                </div>
                <div className="field">
                  <label htmlFor="image-caption">
                    Caption <span>Optional</span>
                  </label>
                  <textarea
                    id="image-caption"
                    maxLength={300}
                    value={draft.caption}
                    onChange={(e) => update("caption", e.target.value)}
                  />
                </div>
                {selected.startsWith("team-") && (
                  <>
                    <div className="field">
                      <label htmlFor="image-name">Team member name</label>
                      <input
                        id="image-name"
                        maxLength={100}
                        value={draft.name}
                        onChange={(e) => update("name", e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="image-role">Role</label>
                      <input
                        id="image-role"
                        maxLength={120}
                        value={draft.role}
                        onChange={(e) => update("role", e.target.value)}
                      />
                    </div>
                  </>
                )}
                <label className="checkbox-field image-placeholder-toggle">
                  <input
                    type="checkbox"
                    checked={draft.isPlaceholder}
                    disabled={!file && !current.uploaded}
                    onChange={(e) => update("isPlaceholder", e.target.checked)}
                  />
                  <span>Label this as an AI-generated placeholder</span>
                </label>
                <p className="field-help">
                  Keep this label for AI imagery. Upload a genuine photo, update
                  its description, then uncheck it when you’re ready.
                </p>
              </fieldset>
            </div>
            <div className="image-editor-actions">
              <button
                type="submit"
                className="button"
                disabled={!dirty || pending || reading}
              >
                {pending
                  ? "Saving…"
                  : reading
                    ? "Reading photo…"
                    : "Publish changes"}
                <Upload size={16} />
              </button>
              <button
                type="button"
                className="text-link"
                disabled={!dirty || pending || reading}
                onClick={() => resetDraft(current)}
              >
                Discard changes
              </button>
              <span>
                {dirty
                  ? "Unsaved changes"
                  : current.updatedAt
                    ? `Saved ${new Date(current.updatedAt).toLocaleDateString("en-MY")}`
                    : "Nothing uploaded yet"}
              </span>
            </div>
            {message && (
              <p className="image-saved" role="status">
                <Check size={18} />
                {message}
              </p>
            )}
            {current.version > 0 && (
              <div className="image-reset">
                <button
                  className="text-link"
                  type="button"
                  disabled={pending || reading}
                  onClick={() => void restore()}
                >
                  <RotateCcw size={16} />
                  Restore AI placeholder
                </button>
                <p>
                  This resets the image, crop and text for this placement only.
                </p>
              </div>
            )}
          </form>
        </div>
      )}
    </section>
  );
}
