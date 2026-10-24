import type express from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  catalogueVersionSchema,
  courseReorderSchema,
  courseSaveSchema,
  maxTrainingCourses,
  type CourseInput,
  type TrainingCatalogue,
  type TrainingCourse,
} from "../../../packages/contracts/src/training-courses";
import type { Database, Query } from "./db";
import { DomainError } from "./leads";

type CourseRow = {
  id: string;
  title: string;
  audience: string;
  duration: string;
  format: string;
  summary: string;
  outline: string;
  is_placeholder: boolean;
  status: TrainingCourse["status"];
  sort_order: number;
  updated_at: string | Date;
};
const present = (row: CourseRow): TrainingCourse => ({
  id: row.id,
  title: row.title,
  audience: row.audience,
  duration: row.duration,
  format: row.format,
  summary: row.summary,
  outline: row.outline,
  isPlaceholder: row.is_placeholder,
  status: row.status,
  sortOrder: row.sort_order,
  updatedAt: new Date(row.updated_at).toISOString(),
});
const rows = async (query: Query) =>
  (
    await query<CourseRow>(
      "SELECT * FROM training_courses ORDER BY sort_order,id",
    )
  ).rows.map(present);
const respond = (res: express.Response, value: unknown) =>
  res.json({ data: value, meta: { requestId: res.locals.requestId } });

// Every writer takes the same lock. The catalogue revision also guards concurrent
// additions and reorders, which cannot be protected by an individual course version.
export function registerTrainingCourses(app: express.Express, db: Database) {
  const mutate = (
    expectedVersion: number,
    action: string,
    objectId: string,
    write: (query: Query) => Promise<void>,
  ) =>
    db.transaction(async (query) => {
      const current = (
        await query<{ version: number }>(
          "SELECT version FROM training_catalogue WHERE id='main' FOR UPDATE",
        )
      ).rows[0];
      if (current.version !== expectedVersion)
        throw new DomainError(
          409,
          "CATALOGUE_CONFLICT",
          "The course catalogue changed in another staff session. Reload the catalogue before saving.",
        );
      await write(query);
      await query(
        "UPDATE training_catalogue SET version=version+1 WHERE id='main'",
      );
      await query(
        "INSERT INTO audit_events(id,action,object_id,actor) VALUES($1,$2,$3,$4)",
        [randomUUID(), action, objectId, "local-owner"],
      );
      return {
        version: current.version + 1,
        courses: await rows(query),
      } satisfies TrainingCatalogue;
    });

  app.get("/api/v1/training-courses", async (_req, res) => {
    const courses = (
      await db.query<CourseRow>(
        "SELECT * FROM training_courses WHERE status='published' ORDER BY sort_order,id",
      )
    ).rows.map(present);
    respond(
      res,
      courses.map(
        ({
          id,
          title,
          audience,
          duration,
          format,
          summary,
          outline,
          isPlaceholder,
        }) => ({
          id,
          title,
          audience,
          duration,
          format,
          summary,
          outline,
          isPlaceholder,
        }),
      ),
    );
  });
  app.get("/api/v1/admin/training-courses", async (_req, res) => {
    const catalogue = await db.transaction(async (query) => {
      const { version } = (
        await query<{ version: number }>(
          "SELECT version FROM training_catalogue WHERE id='main' FOR SHARE",
        )
      ).rows[0];
      return {
        version,
        courses: await rows(query),
      } satisfies TrainingCatalogue;
    });
    respond(res, catalogue);
  });
  const values = (course: CourseInput) => [
    course.title,
    course.audience,
    course.duration,
    course.format,
    course.summary,
    course.outline,
    course.isPlaceholder,
    course.status,
  ];

  app.post("/api/v1/admin/training-courses", async (req, res) => {
    const { expectedVersion, course } = courseSaveSchema.parse(req.body);
    const id = randomUUID();
    const saved = await mutate(
      expectedVersion,
      "training_course_created",
      id,
      async (query) => {
        const courses = await rows(query);
        if (courses.length >= maxTrainingCourses)
          throw new DomainError(
            422,
            "CATALOGUE_FULL",
            `The catalogue supports up to ${maxTrainingCourses} courses, including archived courses.`,
          );
        const order = courses.length
          ? Math.max(...courses.map((item) => item.sortOrder)) + 1
          : 0;
        await query(
          `INSERT INTO training_courses(id,title,audience,duration,format,summary,outline,is_placeholder,status,sort_order)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [id, ...values(course), order],
        );
      },
    );
    res.status(201);
    respond(res, saved);
  });
  app.put("/api/v1/admin/training-courses/:id", async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const { expectedVersion, course } = courseSaveSchema.parse(req.body);
    respond(
      res,
      await mutate(
        expectedVersion,
        "training_course_updated",
        id,
        async (query) => {
          const updated = await query(
            `UPDATE training_courses SET title=$2,audience=$3,duration=$4,format=$5,
        summary=$6,outline=$7,is_placeholder=$8,status=$9,updated_at=now() WHERE id=$1 RETURNING id`,
            [id, ...values(course)],
          );
          if (!updated.rows.length)
            throw new DomainError(
              404,
              "COURSE_NOT_FOUND",
              "This course could not be found. Reload the catalogue.",
            );
        },
      ),
    );
  });
  // Removal is reversible: the complete content stays available to staff.
  app.delete("/api/v1/admin/training-courses/:id", async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const { expectedVersion } = catalogueVersionSchema.parse(req.body);
    respond(
      res,
      await mutate(
        expectedVersion,
        "training_course_archived",
        id,
        async (query) => {
          const updated = await query(
            "UPDATE training_courses SET status='archived',updated_at=now() WHERE id=$1 RETURNING id",
            [id],
          );
          if (!updated.rows.length)
            throw new DomainError(
              404,
              "COURSE_NOT_FOUND",
              "This course could not be found. Reload the catalogue.",
            );
        },
      ),
    );
  });
  app.post("/api/v1/admin/training-courses/reorder", async (req, res) => {
    const { expectedVersion, courseIds } = courseReorderSchema.parse(req.body);
    respond(
      res,
      await mutate(
        expectedVersion,
        "training_courses_reordered",
        "main",
        async (query) => {
          const courses = await rows(query);
          const ids = new Set(courses.map((course) => course.id));
          if (
            courseIds.length !== ids.size ||
            courseIds.some((id) => !ids.has(id))
          )
            throw new DomainError(
              422,
              "INVALID_COURSE_ORDER",
              "Include every course exactly once. Reload the catalogue and try again.",
            );
          for (const [order, id] of courseIds.entries())
            await query(
              "UPDATE training_courses SET sort_order=$2 WHERE id=$1",
              [id, order],
            );
        },
      ),
    );
  });
}
