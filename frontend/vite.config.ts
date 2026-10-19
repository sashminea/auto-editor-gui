import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // './' makes asset URLs relative, so the packaged app can load them from disk (file://)
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // main.ts loads frontend/dist/index.html, so build straight into frontend/dist.
    // No custom rollupOptions.input: Vite must use index.html as the entry,
    // otherwise it emits JS only and no index.html at all.
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
