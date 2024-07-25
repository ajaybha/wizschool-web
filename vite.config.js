import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react( {
      include: "**/*.tsx",
    }),
    nodePolyfills({
      global: true,
    }),
  ],
  define: {
    "process.env": {},
  },
  base: "./",
  server: {
    watch: {
      usePolling: true
    }
  }
});
