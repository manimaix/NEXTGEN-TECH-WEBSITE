import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  courseInputSchema,
  courseReorderSchema,
  courseSaveSchema,
  emptyCourse,
  type CourseInput,
} from "../packages/contracts/src/training-courses";

const fixture: CourseInput = {
  title: "Synthetic course",
  audience: "Test teams",
  duration: "To be confirmed",
  format: "To be confirmed",
  summary: "Synthetic summary",
  outline: "First line\nSecond line",
  isPlaceholder: false,
  status: "draft",
};
test("course contract trims supplied details, preserves outline line breaks and accepts unconfirmed logistics", () => {
  const parsed = courseInputSchema.parse({
    ...fixture,
    title: "  Synthetic course  ",
  });
  assert.equal(parsed.title, "Synthetic course");
  assert.equal(parsed.duration, "To be confirmed");
  assert.equal(parsed.format, "To be confirmed");
  assert.equal(parsed.outline, "First line\nSecond line");
  assert.equal(
    courseInputSchema.safeParse({ ...fixture, summary: "" }).success,
    true,
  );
  assert.equal(courseInputSchema.safeParse(emptyCourse).success, false);
});
test("course contract bounds plain text and rejects privileged, missing or malformed fields", () => {
  for (const [key, max] of Object.entries({
    title: 160,
    audience: 250,
    duration: 120,
    format: 120,
    summary: 500,
    outline: 4000,
  })) {
    assert.equal(
      courseInputSchema.safeParse({ ...fixture, [key]: "x".repeat(max) })
        .success,
      true,
      key,
    );
    assert.equal(
      courseInputSchema.safeParse({ ...fixture, [key]: "x".repeat(max + 1) })
        .success,
      false,
      key,
    );
    if (key !== "summary")
      assert.equal(
        courseInputSchema.safeParse({ ...fixture, [key]: " \n " }).success,
        false,
        key,
      );
  }
  for (const extra of [
    { actor: "attacker" },
    { id: randomUUID() },
    { sortOrder: 0 },
    { updatedAt: new Date().toISOString() },
  ])
    assert.equal(
      courseInputSchema.safeParse({ ...fixture, ...extra }).success,
      false,
    );
  for (const extra of [
    { title: "bad\u0000text" },
    { status: "visible" },
    { isPlaceholder: "false" },
    { duration: 2 },
  ])
    assert.equal(
      courseInputSchema.safeParse({ ...fixture, ...extra }).success,
      false,
    );
  assert.equal(
    courseSaveSchema.safeParse({ expectedVersion: 1, course: fixture }).success,
    true,
  );
  for (const expectedVersion of [0, -1, 1.5, "1", null, undefined])
    assert.equal(
      courseSaveSchema.safeParse({ expectedVersion, course: fixture }).success,
      false,
    );
});
test("course order contract rejects duplicate IDs, unbounded lists and hidden fields", () => {
  const id = randomUUID();
  assert.equal(
    courseReorderSchema.safeParse({ expectedVersion: 1, courseIds: [id] })
      .success,
    true,
  );
  for (const value of [
    { expectedVersion: 1, courseIds: [id, id] },
    { expectedVersion: 1, courseIds: ["not-a-course-id"] },
    {
      expectedVersion: 1,
      courseIds: Array.from({ length: 201 }, () => randomUUID()),
    },
    { expectedVersion: 1, courseIds: [id], actor: "attacker" },
  ])
    assert.equal(courseReorderSchema.safeParse(value).success, false);
});
