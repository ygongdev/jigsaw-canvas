import { defineConfig } from "vite";

export default defineConfig({
  base: "/jigsaw-canvas/",
  build: {
    emptyOutDir: true,
    outDir: "demo-dist/single-player",
    rollupOptions: {
      input: "demo.html",
    },
  },
  server: {
    open: "/demo.html",
    port: 5173,
    strictPort: true,
  },
});
