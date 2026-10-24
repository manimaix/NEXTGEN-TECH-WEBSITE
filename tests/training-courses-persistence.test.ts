import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { editableCourse } from "../packages/contracts/src/training-courses";
import {
  startTrainingTestApp,
  syntheticCourse,
} from "./helpers/training-catalogue";

test("course content, draft visibility, ordering, archive, revision and audit survive three disk reopenings", async () => {
  const temporaryRoot = await realpath(tmpdir());
  const directory = await mkdtemp(
    join(temporaryRoot, "nextgen-training-courses-"),
  );
  const location = join(directory, "postgres");
  let app: Awaited<ReturnType<typeof startTrainingTestApp>> | undefined;
  const start = async () => {
    app = await startTrainingTestApp(location);
    await app.login();
    return app;
  };
  const stop = async () => {
    const running = app;
    app = undefined;
    await running?.close();
  };
  try {
    let running = await start();
    const original = await running.catalogue();
    const firstId = original.courses[0].id,
      secondId = original.courses[1].id;
    const edited = {
      ...syntheticCourse,
      title: "Edited synthetic persistence record",
      summary: "",
      status: "published" as const,
    };
    assert.equal(
      (
        await running.call(`/admin/training-courses/${firstId}`, "PUT", {
          expectedVersion: 1,
          course: edited,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await running.call("/admin/training-courses", "POST", {
          expectedVersion: 2,
          course: syntheticCourse,
        })
      ).status,
      201,
    );
    const added = (await running.catalogue()).courses.find(
      (course) => course.title === syntheticCourse.title,
    )!;
    assert.ok(added);
    const courseIds = [added.id, secondId, firstId];
    assert.equal(
      (
        await running.call("/admin/training-courses/reorder", "POST", {
          expectedVersion: 3,
          courseIds,
        })
      ).status,
      200,
    );
    const saved = await running.catalogue();
    assert.equal(saved.version, 4);
    assert.deepEqual(
      (await running.published()).map((course) => course.id),
      [secondId, firstId],
    );

    await stop();
    running = await start();
    assert.deepEqual(await running.catalogue(), saved);
    const publicCourses = await running.published();
    assert.deepEqual(
      publicCourses.map((course) => course.id),
      [secondId, firstId],
    );
    assert.equal(publicCourses[1].title, edited.title);
    assert.equal(publicCourses[1].summary, "");
    assert.equal(publicCourses[1].outline, syntheticCourse.outline);
    assert.ok(!publicCourses.some((course) => course.title === "Vibe Coding"));
    const stale = await running.call(
      `/admin/training-courses/${firstId}`,
      "PUT",
      { expectedVersion: 3, course: syntheticCourse },
    );
    assert.equal(stale.status, 409);
    assert.equal((await stale.json()).error.code, "CATALOGUE_CONFLICT");
    assert.deepEqual(await running.catalogue(), saved);

    for (const course of saved.courses) {
      const latest = await running.catalogue();
      assert.equal(
        (
          await running.call(`/admin/training-courses/${course.id}`, "DELETE", {
            expectedVersion: latest.version,
          })
        ).status,
        200,
      );
    }
    const archived = await running.catalogue();
    assert.equal(archived.version, 7);
    assert.deepEqual(await running.published(), []);

    await stop();
    running = await start();
    assert.deepEqual(await running.catalogue(), archived);
    assert.deepEqual(await running.published(), []);
    assert.equal(archived.courses.length, 3);
    const restore = {
      ...editableCourse(
        archived.courses.find((course) => course.id === firstId)!,
      ),
      status: "published",
    };
    assert.equal(
      (
        await running.call(`/admin/training-courses/${firstId}`, "PUT", {
          expectedVersion: 7,
          course: restore,
        })
      ).status,
      200,
    );
    const restored = await running.catalogue();
    assert.equal(restored.version, 8);

    await stop();
    running = await start();
    assert.deepEqual(await running.catalogue(), restored);
    assert.deepEqual(
      (await running.published()).map((course) => course.id),
      [firstId],
    );
    const audit = (
      await running.db.query<{ action: string; actor: string }>(
        "SELECT action,actor FROM audit_events",
      )
    ).rows;
    assert.equal(audit.length, 7);
    assert.equal(
      audit.filter((event) => event.action === "training_course_created")
        .length,
      1,
    );
    assert.equal(
      audit.filter((event) => event.action === "training_course_archived")
        .length,
      3,
    );
    assert.ok(audit.every((event) => event.actor === "local-owner"));
  } finally {
    await stop();
    // Resolve and validate the exact freshly created directory before deletion.
    assert.equal(await realpath(directory), directory);
    assert.equal(dirname(directory), temporaryRoot);
    assert.ok(basename(directory).startsWith("nextgen-training-courses-"));
    await rm(directory, { recursive: true, force: true });
  }
});
