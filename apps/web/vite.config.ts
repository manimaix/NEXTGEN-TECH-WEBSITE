import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";

const githubPagesBase = process.env.GITHUB_PAGES_BASE;
const base = githubPagesBase
  ? `${githubPagesBase.replace(/\/+$/, "")}/`
  : "/";

export default defineConfig({
  base,
  plugins: [reactRouter()],
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
    proxy: { "/api": { target: "http://127.0.0.1:4102", changeOrigin: false } },
  },
});
