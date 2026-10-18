import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router";
import {
  defaultImage,
  imageSlots,
  type ImageSlotId,
  type SiteImage,
} from "../../../../packages/contracts/src/site-images";

const defaults = imageSlots.map((slot) => defaultImage(slot.id));
const ImagesContext = createContext<SiteImage[]>(defaults);
export function SiteImagesProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState(defaults);
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const response = await fetch("/api/v1/site-images", {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const body = await response.json();
        if (Array.isArray(body.data)) setImages(body.data);
      } catch {
        /* The built-in labelled placeholders remain usable offline. */
      }
    };
    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
    };
  }, [pathname]);
  return (
    <ImagesContext.Provider value={images}>{children}</ImagesContext.Provider>
  );
}
export function useSiteImage(slot: ImageSlotId) {
  return (
    useContext(ImagesContext).find((image) => image.slot === slot) ??
    defaultImage(slot)
  );
}
export function SitePhoto({
  slot,
  className = "",
  eager = false,
}: {
  slot: ImageSlotId;
  className?: string;
  eager?: boolean;
}) {
  const photo = useSiteImage(slot);
  const definition = imageSlots.find((item) => item.id === slot)!;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo.src]);
  return (
    <figure className={`site-photo ${className}`}>
      <div
        className="site-photo-frame"
        style={{ aspectRatio: definition.ratio }}
      >
        {failed ? (
          <span className="site-photo-unavailable">
            Photo temporarily unavailable
          </span>
        ) : (
          <img
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            style={{ objectPosition: `${photo.focalX}% ${photo.focalY}%` }}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      {(photo.isPlaceholder || photo.caption) && (
        <figcaption>
          {photo.isPlaceholder && (
            <span>
              AI-generated placeholder
              {slot.startsWith("team-") || slot === "about-team"
                ? " · not our actual team"
                : " · illustrative only"}
            </span>
          )}
          {photo.caption && <span>{photo.caption}</span>}
        </figcaption>
      )}
    </figure>
  );
}
function TeamMember({ slot }: { slot: ImageSlotId }) {
  const image = useSiteImage(slot);
  return (
    <article className="site-team-member">
      <SitePhoto slot={slot} />
      <h3>{image.name || "Placeholder"}</h3>
      <p>{image.role || "Role to be added"}</p>
    </article>
  );
}
export function TeamSection() {
  return (
    <section
      id="team"
      className="public-wrap public-section site-team-section"
      aria-labelledby="team-heading"
    >
      <div className="site-team-intro">
        <h2 id="team-heading">
          The people
          <br />
          behind the work.
        </h2>
        <SitePhoto slot="about-team" />
      </div>
      <div className="site-team-portraits">
        <TeamMember slot="team-1" />
        <TeamMember slot="team-2" />
        <TeamMember slot="team-3" />
      </div>
    </section>
  );
}
