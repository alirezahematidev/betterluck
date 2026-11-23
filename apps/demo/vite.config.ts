import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The demo builds against the library's source, so edits hot-reload without a library build.
const librarySource = fileURLToPath(
  new URL("../../packages/react-physics-wheel/src/index.ts", import.meta.url),
);

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; CI sets BASE_PATH accordingly.
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
  resolve: {
    alias: { "react-physics-wheel": librarySource },
  },
});
