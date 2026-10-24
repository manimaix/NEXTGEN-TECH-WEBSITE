import assert from "node:assert/strict";
import type { Server } from "node:http";
import { createApp } from "../../apps/api/src/app";
import { openDatabase } from "../../apps/api/src/db";
import {
  trainingCatalogueSchema,
  publicTrainingCoursesSchema,
  type CourseInput,
} from "../../packages/contracts/src/training-courses";

export const syntheticCourse: CourseInput = {
  title: "Synthetic catalogue fixture",
  audience: "Synthetic test team",
  duration: "To be confirmed",
  format: "To be confirmed",
  summary: "Test content only",
  outline: "Synthetic first line\nSynthetic second line",
  isPlaceholder: false,
  status: "draft",
};
export async function startTrainingTestApp(
  location = "memory://",
  local = true,
) {
  // Always supply an isolated location. Never use the live default store.
  const db = await openDatabase(location);
  const origin = "http://127.0.0.1:5174";
  let server: Server | undefined;
  try {
    server = createApp(db, {
      origin,
      secret: "training-test-only-secret",
      local,
    }).listen(0, "127.0.0.1");
    await new Promise<void>((resolve, reject) => {
      server!.once("listening", resolve);
      server!.once("error", reject);
    });
  } catch (cause) {
    await db.close();
    throw cause;
  }
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const base = `http://127.0.0.1:${address.port}/api/v1`;
  let cookie = "",
    csrf = "";
  const call = (
    path: string,
    method = "GET",
    body?: unknown,
    headers: Record<string, string> = {},
  ) =>
    fetch(base + path, {
      method,
      headers: {
        origin,
        cookie,
        "X-CSRF-Token": csrf,
        "Content-Type": "application/json",
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const login = async () => {
    const response = await call("/auth/local", "POST");
    assert.equal(response.status, 200);
    cookie = response.headers.getSetCookie()[0].split(";")[0];
    csrf = (await response.json()).data.csrf;
  };
  return {
    db,
    base,
    call,
    login,
    catalogue: async () => {
      const response = await call("/admin/training-courses");
      assert.equal(response.status, 200);
      return trainingCatalogueSchema.parse((await response.json()).data);
    },
    published: async () => {
      const response = await fetch(base + "/training-courses");
      assert.equal(response.status, 200);
      return publicTrainingCoursesSchema.parse((await response.json()).data);
    },
    close: async () => {
      try {
        await new Promise<void>((resolve, reject) =>
          server!.close((error) => (error ? reject(error) : resolve())),
        );
      } finally {
        await db.close();
      }
    },
  };
}
