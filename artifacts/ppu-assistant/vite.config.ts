import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs/promises";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT || "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const packageJson = JSON.parse(
  await fs.readFile(path.resolve(import.meta.dirname, "package.json"), "utf-8"),
);
const homepage = packageJson.homepage ?? "";
const homepagePath = (() => {
  if (!homepage) return "/";
  try {
    return new URL(homepage).pathname;
  } catch {
    return homepage;
  }
})();
const basePath =
  process.env.BASE_PATH ||
  process.env.VITE_BASE_PATH ||
  (process.env.NODE_ENV === "production" ? homepagePath : "/");
const normalizedBasePath = basePath.endsWith("/") ? basePath : `${basePath}/`;

function githubPagesFallbackPlugin(): Plugin {
  return {
    name: "github-pages-fallback",
    closeBundle: async () => {
      const outputDir = path.resolve(import.meta.dirname, "dist/public");
      await fs.copyFile(
        path.join(outputDir, "index.html"),
        path.join(outputDir, "404.html"),
      );
    },
  };
}

export default defineConfig({
  base: normalizedBasePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    githubPagesFallbackPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
