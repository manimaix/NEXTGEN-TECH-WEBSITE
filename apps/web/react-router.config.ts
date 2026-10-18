import type { Config } from "@react-router/dev/config";

const basename = process.env.GITHUB_PAGES_BASE ?? "/";

export default {
  ssr: false,
  basename,
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
