import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const viteCli = path.join(repoRoot, "node_modules", "vite", "bin", "vite.js");
const distRoot = path.join(repoRoot, "dist");
const generatedDist = path.join(distRoot, "generated");

function run(bin, args) {
  const result = spawnSync(bin, args, { stdio: "inherit" });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function moveDirContents(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  try {
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
      const fromPath = path.join(sourceDir, entry.name);
      const toPath = path.join(targetDir, entry.name);

      if (entry.isDirectory()) {
        fs.mkdirSync(toPath, { recursive: true });
        moveDirContents(fromPath, toPath);
        fs.rmSync(fromPath, { recursive: true, force: true });
      } else {
        fs.mkdirSync(path.dirname(toPath), { recursive: true });
        if (fs.existsSync(toPath)) {
          fs.rmSync(toPath, { force: true });
        }
        fs.renameSync(fromPath, toPath);
      }
    }
  } catch (err) {
    console.warn(`[moveDirContents] Skipping error for ${sourceDir}:`, err.message);
  }
}

run(process.execPath, [path.join(repoRoot, "scripts", "sync-stitch.mjs")]);
run(process.execPath, [path.join(repoRoot, "scripts", "generate_upgraded_shells.mjs")]);
run(process.execPath, [path.join(repoRoot, "scripts", "generate_custodian_shells.mjs")]);
run(process.execPath, [path.join(repoRoot, "scripts", "generate_profile_shells.mjs")]);
run(process.execPath, [path.join(repoRoot, "scripts", "check-routes.mjs")]);
run(process.execPath, [path.join(repoRoot, "scripts", "export-sitemap.mjs")]);
run(process.execPath, [viteCli, "build"]);

if (fs.existsSync(generatedDist)) {
  moveDirContents(generatedDist, distRoot);
  fs.rmSync(generatedDist, { recursive: true, force: true });
  console.log("Flattened dist/generated/* to dist/* for canonical route paths.");
}
