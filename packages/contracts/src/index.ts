import { z } from "zod";

export const serviceIds = [
  "consulting",
  "application_development",
  "ai_agents_integration",
  "ai_training",
  "not_sure",
] as const;
export const serviceSchema = z.enum(serviceIds);
export const serviceNames: Record<(typeof serviceIds)[number], string> = {
  consulting: "Technology consulting",
  application_development: "Application development",
  ai_agents_integration: "AI agents & integration",
  ai_training: "AI training",
  not_sure: "Help me find the right starting point",
};
const optionalText = (max: number) => z.string().trim().max(max).optional();
export const enquirySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter your name (at least 2 characters).")
      .max(120),
    email: z.string().trim().email("Enter a valid email address.").max(254),
    service: serviceSchema,
    message: z
      .string()
      .trim()
      .min(30, "Tell us a little more — at least 30 characters.")
      .max(5000),
    company: optionalText(160),
    role: optionalText(160),
    phone: optionalText(40),
    budget: z
      .enum(["not_sure", "under_5k", "5k_20k", "20k_50k", "over_50k"])
      .optional(),
    timeframe: z
      .enum(["exploring", "within_3_months", "3_6_months", "later"])
      .optional(),
    training: z
      .object({
        teamSize: z
          .enum(["1_5", "6_20", "21_50", "over_50", "not_sure"])
          .optional(),
        experience: z.enum(["beginner", "mixed", "technical"]).optional(),
        topics: optionalText(1000),
        delivery: z.enum(["remote", "in_person", "not_sure"]).optional(),
        location: optionalText(160),
        preferredDates: optionalText(200),
      })
      .strict()
      .optional(),
    ai: z
      .object({
        existingSystems: optionalText(1000),
        dataSensitivity: z
          .enum(["public", "internal", "sensitive", "not_sure"])
          .optional(),
      })
      .strict()
      .optional(),
    privacyAcknowledged: z.literal(true, {
      error: "Please acknowledge the privacy information.",
    }),
    privacyNoticeVersion: z.string().min(1).max(80),
    marketingConsent: z.boolean(),
    sourceRoute: z
      .string()
      .max(200)
      .regex(/^\/[a-z0-9/-]*$/)
      .optional(),
    submissionToken: z.string().min(1).max(4096),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.training && value.service !== "ai_training")
      context.addIssue({
        code: "custom",
        path: ["training"],
        message: "Training details need a training enquiry.",
      });
    if (value.ai && value.service !== "ai_agents_integration")
      context.addIssue({
        code: "custom",
        path: ["ai"],
        message: "AI details need an AI enquiry.",
      });
  });
export type EnquiryInput = z.infer<typeof enquirySchema>;
export const resultSchema = z.object({
  data: z.object({ reference: z.string(), status: z.literal("received") }),
  meta: z.object({ requestId: z.string(), replayed: z.boolean() }),
});
export type EnquiryResult = z.infer<typeof resultSchema>;
export const statuses = [
  "new",
  "triaged",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
  "closed",
  "disqualified",
  "spam",
] as const;
export type LeadStatus = (typeof statuses)[number];
export const edges: Record<LeadStatus, readonly LeadStatus[]> = {
  new: ["triaged", "disqualified", "spam", "closed"],
  triaged: ["contacted", "disqualified", "spam", "closed"],
  contacted: ["qualified", "lost", "closed", "disqualified"],
  qualified: ["proposal", "lost", "closed"],
  proposal: ["won", "lost", "closed"],
  won: ["triaged"],
  lost: ["triaged"],
  closed: ["triaged"],
  disqualified: ["triaged"],
  spam: ["triaged"],
};
export const leadPatchSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    status: z.enum(statuses).optional(),
    reason: z.string().trim().min(3).max(1000),
    nextAction: optionalText(1000),
    followUpAt: z.string().datetime().nullable().optional(),
  })
  .strict();
export interface Lead {
  id: string;
  reference: string;
  name: string;
  email: string;
  service: (typeof serviceIds)[number];
  message: string;
  status: LeadStatus;
  version: number;
  created_at: string;
  next_action: string | null;
  follow_up_at: string | null;
  details: Record<string, unknown>;
}
