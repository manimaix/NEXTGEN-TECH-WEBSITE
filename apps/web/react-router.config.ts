import type { Config } from "@react-router/dev/config";
export default {
  ssr: false,
  prerender: [
    "/",
    "/services",
    "/services/consulting",
    "/services/application-development",
    "/services/ai-agents-integration",
    "/training",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/thank-you",
    "/404",
  ],
} satisfies Config;
