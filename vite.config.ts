import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    allowedHosts: ["john-cameo-ebook.ngrok-free.dev"],
    // Serve the API from this origin too, so the Rails session cookie is
    // first-party. Reaching the API on its own origin makes every XHR
    // cross-site, and a SameSite=Lax cookie is not sent on those — the OAuth
    // redirects would still carry it, so the login appears to work right up
    // until the first fetch. `changeOrigin` keeps Rails' host authorization
    // happy; OAUTH_PUBLIC_URL is what tells OmniAuth the public origin.
    proxy: {
      "/auth": { target: "http://127.0.0.1:3000", changeOrigin: true },
      "/api": { target: "http://127.0.0.1:3000", changeOrigin: true },
    },
  },
});
