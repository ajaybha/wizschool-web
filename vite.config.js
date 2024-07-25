import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default ({mode}) => {
  // Load app-level env vars to node-level env vars.
  process.env = {...process.env, ...loadEnv(mode, process.cwd())};
  return defineConfig({
    build: {
      sourcemap: true,
    },
    plugins: [
      react( {
        include: "**/*.tsx",
      }),
      nodePolyfills({
        global: true,
      }),
    ],
    
    base: "./",
    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_WIZSCHOOL_API_BASEURL ? process.env.VITE_WIZSCHOOL_API_BASEURL : "" ,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
      watch: {
        usePolling: true
      }
    }
  });
}

