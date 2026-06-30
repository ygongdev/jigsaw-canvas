import { defineConfig } from "vite";

export default defineConfig({
  root: "multiplayer-demo/client",
  build: {
    emptyOutDir: true,
    outDir: "../../demo-dist/multiplayer-client",
  },
  server: {
    port: 8080,
    strictPort: true,
  },
});
