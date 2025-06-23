import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const host = process.env.TAURI_DEV_HOST;

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
const config = await (async () => ({
  plugins: [react(), tsconfigPaths(), tailwindcss()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/pages/index/index.html"),
        login: resolve(__dirname, "src/pages/login/login.html"),
        error: resolve(__dirname, "src/pages/404/404.html"),
      },
    },
  },
}))();

export default defineConfig(config);
