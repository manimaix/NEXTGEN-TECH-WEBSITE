import { z } from "zod";

export const imageSlots = [
  {
    id: "about-workplace",
    label: "About us · workplace",
    page: "/about",
    ratio: "21 / 9",
    hint: "A wide photo of your workplace or your team at work.",
    placeholder: {
      src: "/images/placeholders/about.webp",
      width: 1536,
      height: 1024,
    },
    alt: "AI-generated illustration of a light-filled technology studio.",
  },
  {
    id: "about-team",
    label: "About us · team photo",
    page: "/about#team",
    ratio: "16 / 9",
    hint: "A landscape group photograph of your team.",
    placeholder: {
      src: "/images/placeholders/team.webp",
      width: 1536,
      height: 1024,
    },
    alt: "AI-generated placeholder showing a fictional team working together.",
  },
  {
    id: "team-1",
    label: "Team member 1",
    page: "/about#team",
    ratio: "4 / 5",
    hint: "A portrait, with space around the person's head and shoulders.",
    placeholder: {
      src: "/images/placeholders/portrait-1.webp",
      width: 800,
      height: 1000,
    },
    alt: "AI-generated portrait placeholder; not an actual team member.",
  },
  {
    id: "team-2",
    label: "Team member 2",
    page: "/about#team",
    ratio: "4 / 5",
    hint: "A portrait, with space around the person's head and shoulders.",
    placeholder: {
      src: "/images/placeholders/portrait-2.webp",
      width: 800,
      height: 1000,
    },
    alt: "AI-generated portrait placeholder; not an actual team member.",
  },
  {
    id: "team-3",
    label: "Team member 3",
    page: "/about#team",
    ratio: "4 / 5",
    hint: "A portrait, with space around the person's head and shoulders.",
    placeholder: {
      src: "/images/placeholders/portrait-3.webp",
      width: 800,
      height: 1000,
    },
    alt: "AI-generated portrait placeholder; not an actual team member.",
  },
  {
    id: "training-workshop",
    label: "Training · workshop",
    page: "/training",
    ratio: "3 / 2",
    hint: "A landscape photo of a training session, with participants' permission.",
    placeholder: {
      src: "/images/placeholders/training.webp",
      width: 1536,
      height: 1024,
    },
    alt: "AI-generated illustration of a fictional technology workshop.",
  },
  {
    id: "service-consulting",
    label: "Services · technology consulting",
    page: "/services/consulting",
    ratio: "16 / 9",
    hint: "A landscape image about technology planning. Also appears on What we do. Use the crop controls to keep the subject in view.",
    placeholder: {
      src: "/images/services/consulting.png",
      width: 1536,
      height: 1024,
    },
    alt: "AI-generated illustration of a planning desk with workflow diagrams and a green notebook.",
  },
  {
    id: "service-development",
    label: "Services · application development",
    page: "/services/application-development",
    ratio: "16 / 9",
    hint: "A landscape image about building software. Also appears on What we do. Use the crop controls to keep the subject in view.",
    placeholder: {
      src: "/images/services/development.png",
      width: 1536,
      height: 1024,
    },
    alt: "AI-generated illustration of a laptop and tablet displaying a fictional business application.",
  },
  {
    id: "service-integration",
    label: "Services · AI agents & integration",
    page: "/services/ai-agents-integration",
    ratio: "16 / 9",
    hint: "A landscape image about connected AI workflows. Also appears on What we do. Use the crop controls to keep the subject in view.",
    placeholder: {
      src: "/images/services/integration.png",
      width: 1536,
      height: 1024,
    },
    alt: "AI-generated illustration of a connected laptop and document scanner beside workflow sheets.",
  },
] as const;
export type ImageSlotId = (typeof imageSlots)[number]["id"];
export const serviceImageSlots = {
  consulting: "service-consulting",
  application_development: "service-development",
  ai_agents_integration: "service-integration",
  ai_training: "training-workshop",
} as const satisfies Record<string, ImageSlotId>;
export const imageSlotSchema = z.enum(
  imageSlots.map((slot) => slot.id) as [ImageSlotId, ...ImageSlotId[]],
);
export const imageDetailsSchema = z
  .object({
    alt: z.string().trim().min(3).max(250),
    caption: z.string().trim().max(300),
    name: z.string().trim().max(100),
    role: z.string().trim().max(120),
    focalX: z.number().int().min(0).max(100),
    focalY: z.number().int().min(0).max(100),
    isPlaceholder: z.boolean(),
  })
  .strict();
export type ImageDetails = z.infer<typeof imageDetailsSchema>;
export type SiteImage = ImageDetails & {
  slot: ImageSlotId;
  src: string;
  version: number;
  uploaded: boolean;
  width: number;
  height: number;
  updatedAt: string | null;
};
export const maxImageBytes = 5 * 1024 * 1024;
export const imageUpdateSchema = imageDetailsSchema
  .extend({
    expectedVersion: z.number().int().min(0),
    image: z
      .object({
        type: z.enum(["image/jpeg", "image/png", "image/webp"]),
        base64: z
          .string()
          .min(4)
          .max(Math.ceil(maxImageBytes / 3) * 4)
          // A repeated four-character group can exhaust the regexp stack on large photos.
          .regex(/^[A-Za-z0-9+/]*={0,2}$/)
          .refine((value) => value.length % 4 === 0, "Invalid base64 length"),
      })
      .strict()
      .optional(),
  })
  .strict();

export function defaultImage(id: ImageSlotId): SiteImage {
  const slot = imageSlots.find((item) => item.id === id)!;
  const portrait = id.startsWith("team-");
  return {
    slot: id,
    src: slot.placeholder.src,
    alt: slot.alt,
    caption: "",
    name: portrait ? "Placeholder" : "",
    role: portrait ? "Role to be added" : "",
    focalX: 50,
    focalY: 50,
    isPlaceholder: true,
    uploaded: false,
    version: 0,
    width: slot.placeholder.width,
    height: slot.placeholder.height,
    updatedAt: null,
  };
}
