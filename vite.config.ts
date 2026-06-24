import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { copyFileSync, existsSync } from "node:fs";

// Project pages are served from https://<owner>.github.io/typenator/, so the
// production build must be rooted at that subpath. Dev stays at "/".
const BASE = "/typenator/";

/**
 * GitHub Pages has no SPA rewrite rule, so a deep link like /typenator/progress
 * returns the host's 404 page. Shipping a 404.html that is a copy of index.html
 * lets the app boot on any route; React Router (with the matching basename)
 * then renders the correct view.
 */
function spaFallback(): Plugin {
  return {
    name: "spa-404-fallback",
    apply: "build",
    closeBundle() {
      const dist = fileURLToPath(new URL("./dist", import.meta.url));
      const index = `${dist}/index.html`;
      if (existsSync(index)) {
        copyFileSync(index, `${dist}/404.html`);
      }
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? BASE : "/",
  plugins: [react(), spaFallback()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase is the bulk of the bundle; split it so the app shell and
          // the typing engine load independently of the auth/db code.
          firebase: [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/analytics",
          ],
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
}));
