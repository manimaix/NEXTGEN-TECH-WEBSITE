import { useCallback, useEffect, useRef, useState } from "react";
import {
  publicTrainingCoursesSchema,
  type PublicTrainingCourse,
} from "../../../../packages/contracts/src/training-courses";

export function usePublishedTrainingCourses() {
  const [courses, setCourses] = useState<PublicTrainingCourse[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/training-courses", {
        signal: next.signal,
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Catalogue unavailable");
      const body = await response.json();
      const fresh = publicTrainingCoursesSchema.parse(body.data);
      if (!next.signal.aborted) setCourses(fresh);
    } catch {
      if (!next.signal.aborted) {
        setCourses(null);
        setError(
          "The course catalogue is temporarily unavailable. Try again or ask us about training for your team.",
        );
      }
    } finally {
      if (!next.signal.aborted) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      controller.current?.abort();
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);
  return { courses, loading, error, refresh };
}
