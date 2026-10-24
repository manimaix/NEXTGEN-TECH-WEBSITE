import { z } from "zod";

export const maxTrainingCourses = 200;
const version = z.number().int().min(1).max(2147483646);
const text = (max: number, required = true) =>
  z
    .string()
    .trim()
    .min(required ? 1 : 0, "Enter this course detail.")
    .max(max)
    .refine(
      (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value),
      "Remove unsupported control characters.",
    );

export const courseDetailsSchema = z
  .object({
    title: text(160),
    audience: text(250),
    duration: text(120),
    format: text(120),
    summary: text(500, false),
    outline: text(4000),
    isPlaceholder: z.boolean(),
  })
  .strict();
export type CourseDetails = z.infer<typeof courseDetailsSchema>;
export const courseStatusSchema = z.enum(["draft", "published", "archived"]);
export const courseInputSchema = courseDetailsSchema
  .extend({
    status: courseStatusSchema,
  })
  .strict();
export type CourseInput = z.infer<typeof courseInputSchema>;
export const trainingCourseSchema = courseInputSchema
  .extend({
    id: z.string().uuid(),
    sortOrder: z.number().int().min(0),
    updatedAt: z.string().datetime(),
  })
  .strict();
export type TrainingCourse = z.infer<typeof trainingCourseSchema>;
export const publicTrainingCourseSchema = courseDetailsSchema
  .extend({
    id: z.string().uuid(),
  })
  .strict();
export type PublicTrainingCourse = z.infer<typeof publicTrainingCourseSchema>;
export const publicTrainingCoursesSchema = z
  .array(publicTrainingCourseSchema)
  .max(maxTrainingCourses);
export const trainingCatalogueSchema = z
  .object({
    // One revision guards edits, membership, and order together.
    version,
    courses: z.array(trainingCourseSchema).max(maxTrainingCourses),
  })
  .strict();
export type TrainingCatalogue = z.infer<typeof trainingCatalogueSchema>;
export const courseSaveSchema = z
  .object({
    expectedVersion: version,
    course: courseInputSchema,
  })
  .strict();
export const catalogueVersionSchema = z
  .object({ expectedVersion: version })
  .strict();
export const courseReorderSchema = catalogueVersionSchema
  .extend({
    courseIds: z
      .array(z.string().uuid())
      .max(maxTrainingCourses)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Include each course only once.",
      ),
  })
  .strict();

export const emptyCourse: CourseInput = {
  title: "",
  audience: "",
  duration: "",
  format: "",
  summary: "",
  outline: "",
  isPlaceholder: false,
  status: "draft",
};

export function editableCourse(course: CourseInput): CourseInput {
  const {
    title,
    audience,
    duration,
    format,
    summary,
    outline,
    isPlaceholder,
    status,
  } = course;
  return {
    title,
    audience,
    duration,
    format,
    summary,
    outline,
    isPlaceholder,
    status,
  };
}
