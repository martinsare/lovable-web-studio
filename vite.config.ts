import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  define: {
    process: JSON.stringify({
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "development",
      },
    }),
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "development"),
    "process.env": JSON.stringify({
      NODE_ENV: process.env.NODE_ENV ?? "development",
    }),
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    hmr: {
      host: "localhost",
      clientPort: 5000,
      protocol: "ws",
    },
    allowedHosts: true,
  },
});
