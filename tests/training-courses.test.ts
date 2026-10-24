import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  startTrainingTestApp,
  syntheticCourse,
} from "./helpers/training-catalogue";

test("training catalogue API boundaries, lifecycle and concurrent saves", async (t) => {
  const app = await startTrainingTestApp();
  try {
    await app.login();
    await t.test(
      "public seed contains only the two supplied topics and unconfirmed logistics",
      async () => {
        const courses = await app.published();
        assert.deepEqual(
          courses.map((course) => course.title),
          ["Vibe Coding", "Workflow Automation & AI Agents for Daily Work"],
        );
        for (const course of courses) {
          assert.equal(course.duration, "To be confirmed");
          assert.equal(course.format, "To be confirmed");
          assert.equal(course.isPlaceholder, false);
          assert.ok(!("status" in course));
          assert.ok(!("updatedAt" in course));
        }
        assert.equal((await app.catalogue()).version, 1);
      },
    );
    await t.test(
      "all administrative reads and mutations require a staff session",
      async () => {
        const first = (await app.catalogue()).courses[0];
        for (const [path, method, body] of [
          ["/admin/training-courses", "GET", undefined],
          [
            "/admin/training-courses",
            "POST",
            { expectedVersion: 1, course: syntheticCourse },
          ],
          [
            `/admin/training-courses/${first.id}`,
            "PUT",
            { expectedVersion: 1, course: syntheticCourse },
          ],
          [
            `/admin/training-courses/${first.id}`,
            "DELETE",
            { expectedVersion: 1 },
          ],
          [
            "/admin/training-courses/reorder",
            "POST",
            { expectedVersion: 1, courseIds: [] },
          ],
        ] as const) {
          const response = await app.call(path, method, body, { cookie: "" });
          assert.equal(response.status, 401, `${method} ${path}`);
          assert.equal((await response.json()).error.code, "AUTH_REQUIRED");
        }
        assert.equal((await app.catalogue()).version, 1);
      },
    );
    await t.test(
      "writes reject missing or invalid CSRF and foreign origins without changing data",
      async () => {
        const first = (await app.catalogue()).courses[0];
        for (const [path, method, body] of [
          [
            "/admin/training-courses",
            "POST",
            { expectedVersion: 1, course: syntheticCourse },
          ],
          [
            `/admin/training-courses/${first.id}`,
            "PUT",
            { expectedVersion: 1, course: syntheticCourse },
          ],
          [
            `/admin/training-courses/${first.id}`,
            "DELETE",
            { expectedVersion: 1 },
          ],
          [
            "/admin/training-courses/reorder",
            "POST",
            { expectedVersion: 1, courseIds: [] },
          ],
        ] as const) {
          for (const token of ["", "wrong-token"]) {
            const response = await app.call(path, method, body, {
              "X-CSRF-Token": token,
            });
            assert.equal(response.status, 403);
            assert.equal((await response.json()).error.code, "CSRF_FAILED");
          }
          for (const origin of ["", "https://foreign.example.test"]) {
            const response = await app.call(path, method, body, { origin });
            assert.equal(response.status, 403);
            assert.equal((await response.json()).error.code, "ORIGIN_DENIED");
          }
        }
        assert.equal((await app.catalogue()).version, 1);
      },
    );
    let fixtureId = "";
    await t.test(
      "create, edit, publish, hide, archive and restore preserve content and visibility",
      async () => {
        const create = await app.call("/admin/training-courses", "POST", {
          expectedVersion: 1,
          course: syntheticCourse,
        });
        assert.equal(create.status, 201);
        const created = (await create.json()).data;
        fixtureId = created.courses.find(
          (course: { title: string }) => course.title === syntheticCourse.title,
        ).id;
        assert.equal((await app.published()).length, 2);
        const publish = await app.call(
          `/admin/training-courses/${fixtureId}`,
          "PUT",
          {
            expectedVersion: 2,
            course: {
              ...syntheticCourse,
              title: "Edited synthetic title",
              status: "published",
            },
          },
        );
        assert.equal(publish.status, 200);
        assert.equal(
          (await app.published())[2].title,
          "Edited synthetic title",
        );
        assert.equal(
          (await app.published())[2].outline,
          syntheticCourse.outline,
        );
        assert.equal(
          (
            await app.call(`/admin/training-courses/${fixtureId}`, "PUT", {
              expectedVersion: 3,
              course: syntheticCourse,
            })
          ).status,
          200,
        );
        assert.equal((await app.published()).length, 2);
        assert.equal(
          (
            await app.call(`/admin/training-courses/${fixtureId}`, "DELETE", {
              expectedVersion: 4,
            })
          ).status,
          200,
        );
        const archived = (await app.catalogue()).courses.find(
          (course) => course.id === fixtureId,
        )!;
        assert.equal(archived.status, "archived");
        assert.equal(archived.outline, syntheticCourse.outline);
        assert.equal(
          (
            await app.call(`/admin/training-courses/${fixtureId}`, "PUT", {
              expectedVersion: 5,
              course: { ...syntheticCourse, status: "published" },
            })
          ).status,
          200,
        );
        assert.equal((await app.published()).length, 3);
      },
    );
    await t.test(
      "reorder is atomic and the public API follows published order",
      async () => {
        const current = await app.catalogue();
        const courseIds = current.courses.map((course) => course.id).reverse();
        assert.equal(
          (
            await app.call("/admin/training-courses/reorder", "POST", {
              expectedVersion: current.version,
              courseIds,
            })
          ).status,
          200,
        );
        assert.deepEqual(
          (await app.published()).map((course) => course.id),
          courseIds,
        );
        assert.deepEqual(
          (await app.catalogue()).courses.map((course) => course.sortOrder),
          [0, 1, 2],
        );
      },
    );
    await t.test(
      "invalid content, missing courses and invalid orders leave revision, content and audit intact",
      async () => {
        const before = await app.catalogue();
        const audits = (await app.db.query("SELECT * FROM audit_events")).rows
          .length;
        const badField = await app.call(
          `/admin/training-courses/${fixtureId}`,
          "PUT",
          {
            expectedVersion: before.version,
            course: { ...syntheticCourse, title: " " },
          },
        );
        assert.equal(badField.status, 422);
        assert.ok((await badField.json()).error.fields["course.title"]);
        for (const courseIds of [
          [],
          [fixtureId, fixtureId],
          before.courses.map((course) =>
            course.id === fixtureId ? randomUUID() : course.id,
          ),
        ])
          assert.equal(
            (
              await app.call("/admin/training-courses/reorder", "POST", {
                expectedVersion: before.version,
                courseIds,
              })
            ).status,
            422,
          );
        assert.equal(
          (
            await app.call(
              `/admin/training-courses/${randomUUID()}`,
              "DELETE",
              { expectedVersion: before.version },
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await app.call(`/admin/training-courses/${randomUUID()}`, "PUT", {
              expectedVersion: before.version,
              course: syntheticCourse,
            })
          ).status,
          404,
        );
        assert.equal(
          (
            await app.call("/admin/training-courses/not-an-id", "PUT", {
              expectedVersion: before.version,
              course: syntheticCourse,
            })
          ).status,
          422,
        );
        assert.equal(
          (
            await app.call("/admin/training-courses", "POST", {
              expectedVersion: before.version,
              course: { ...syntheticCourse, owner: "attacker" },
            })
          ).status,
          422,
        );
        const oversized = await app.call("/admin/training-courses", "POST", {
          payload: "x".repeat(33000),
        });
        assert.equal(oversized.status, 413);
        const invalidJson = await fetch(app.base + "/admin/training-courses", {
          method: "POST",
          headers: {
            origin: "http://127.0.0.1:5174",
            "Content-Type": "application/json",
          },
          body: "{",
        });
        assert.equal(invalidJson.status, 400);
        assert.deepEqual(await app.catalogue(), before);
        assert.equal(
          (await app.db.query("SELECT * FROM audit_events")).rows.length,
          audits,
        );
      },
    );
    await t.test(
      "stale updates, adds, archives and orders cannot overwrite another save",
      async () => {
        const before = await app.catalogue();
        const update = (title: string) =>
          app.call(`/admin/training-courses/${fixtureId}`, "PUT", {
            expectedVersion: before.version,
            course: { ...syntheticCourse, title, status: "published" },
          });
        const responses = await Promise.all([
          update("First concurrent save"),
          update("Second concurrent save"),
        ]);
        assert.deepEqual(
          responses.map((response) => response.status).sort(),
          [200, 409],
        );
        const saved = await app.catalogue();
        assert.equal(saved.version, before.version + 1);
        for (const [path, method, body] of [
          [
            "/admin/training-courses",
            "POST",
            { expectedVersion: before.version, course: syntheticCourse },
          ],
          [
            `/admin/training-courses/${fixtureId}`,
            "DELETE",
            { expectedVersion: before.version },
          ],
          [
            "/admin/training-courses/reorder",
            "POST",
            {
              expectedVersion: before.version,
              courseIds: saved.courses.map((course) => course.id).reverse(),
            },
          ],
        ] as const) {
          const response = await app.call(path, method, body);
          assert.equal(response.status, 409);
          assert.equal(
            (await response.json()).error.code,
            "CATALOGUE_CONFLICT",
          );
        }
        assert.deepEqual(await app.catalogue(), saved);
        assert.equal(
          (
            await app.db.query(
              "SELECT * FROM audit_events WHERE action='training_course_updated'",
            )
          ).rows.length,
          4,
        );
      },
    );
    await t.test(
      "an intentionally empty published catalogue stays empty and logout revokes staff access",
      async () => {
        for (const course of (await app.catalogue()).courses) {
          const latest = await app.catalogue();
          assert.equal(
            (
              await app.call(`/admin/training-courses/${course.id}`, "DELETE", {
                expectedVersion: latest.version,
              })
            ).status,
            200,
          );
        }
        assert.deepEqual(await app.published(), []);
        assert.equal((await app.catalogue()).courses.length, 3);
        assert.equal((await app.call("/auth/logout", "POST")).status, 200);
        assert.equal((await app.call("/admin/training-courses")).status, 401);
        assert.equal(
          (
            await app.call("/admin/training-courses", "POST", {
              expectedVersion: 1,
              course: syntheticCourse,
            })
          ).status,
          401,
        );
      },
    );
  } finally {
    await app.close();
  }
});
test("training mutations remain inaccessible when local development authentication is disabled", async () => {
  const app = await startTrainingTestApp("memory://", false);
  try {
    const response = await app.call("/auth/local", "POST");
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error.code, "LOCAL_ONLY");
    assert.equal((await app.call("/admin/training-courses")).status, 401);
    assert.equal((await app.published()).length, 2);
  } finally {
    await app.close();
  }
});
