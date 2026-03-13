import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const generatedDir = path.resolve(__dirname, "generated");

function gatherHtmlEntries(dirPath, entries = {}) {
  if (!fs.existsSync(dirPath)) {
    return entries;
  }

  const walk = (currentDir) => {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      if (item.isDirectory()) {
        walk(fullPath);
      } else if (item.isFile() && item.name.toLowerCase() === "index.html") {
        const rel = path.relative(generatedDir, fullPath).replace(/\\/g, "/");
        const key = rel.replace(/\/index\.html$/i, "").replace(/\//g, "_") || "root";
        entries[key] = fullPath;
      }
    }
  };

  walk(dirPath);
  return entries;
}

export default defineConfig({
  root: "generated",
  publicDir: path.resolve(__dirname, "public"),
  resolve: {
    alias: {
      "/src": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: gatherHtmlEntries(generatedDir),
    },
  },
});