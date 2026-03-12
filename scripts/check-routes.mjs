import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const manifestPath = path.join(repoRoot, "generated", "route-manifest.json");
if (!fs.existsSync(manifestPath)) {
  throw new Error("route-manifest.json missing. Run npm run sync:stitch first.");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (!Array.isArray(manifest) || manifest.length === 0) {
  throw new Error("route-manifest.json has no routes.");
}

const seenRoutes = new Set();
const seenSource = new Set();

for (const item of manifest) {
  const requiredKeys = ["domain", "slug", "title", "sourcePath", "routePath"];
  for (const key of requiredKeys) {
    if (!item[key] || typeof item[key] !== "string") {
      throw new Error(`Invalid manifest item missing ${key}: ${JSON.stringify(item)}`);
    }
  }

  if (seenRoutes.has(item.routePath)) {
    throw new Error(`Duplicate routePath: ${item.routePath}`);
  }
  seenRoutes.add(item.routePath);

  if (seenSource.has(item.sourcePath)) {
    throw new Error(`Duplicate sourcePath: ${item.sourcePath}`);
  }
  seenSource.add(item.sourcePath);

  const wrapperPath = path.join(repoRoot, "generated", item.domain, item.slug, "index.html");
  if (!fs.existsSync(wrapperPath)) {
    throw new Error(`Missing wrapper file: ${wrapperPath}`);
  }

  const stitchedPath = path.join(repoRoot, "generated", "stitch", item.domain, item.slug, "index.html");
  if (!fs.existsSync(stitchedPath)) {
    throw new Error(`Missing stitch source file: ${stitchedPath}`);
  }
}

console.log(`Route check passed: ${manifest.length} routes, no duplicates, all files present.`);