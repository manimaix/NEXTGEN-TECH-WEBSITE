import { index, route, type RouteConfig } from "@react-router/dev/routes";
export default [
  index("routes/home.tsx"),
  route("services", "routes/services.tsx"),
  route("services/:slug", "routes/service.tsx"),
  route("training", "routes/training.tsx"),
  route("about", "routes/about.tsx"),
  route("contact", "routes/contact.tsx"),
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  route("thank-you", "routes/thank-you.tsx"),
  route("admin/*", "routes/admin.tsx"),
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
