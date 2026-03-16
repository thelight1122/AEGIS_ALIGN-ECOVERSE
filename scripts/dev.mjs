import { spawnSync, spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const viteCli = path.join(repoRoot, "node_modules", "vite", "bin", "vite.js");

const sync = spawnSync(process.execPath, [path.join(repoRoot, "scripts", "sync-stitch.mjs")], { stdio: "inherit" });
if (sync.error) {
  console.error(sync.error.message);
  process.exit(1);
}
if (sync.status !== 0) {
  process.exit(sync.status ?? 1);
}

spawnSync(process.execPath, [path.join(repoRoot, "scripts", "generate_upgraded_shells.mjs")], { stdio: "inherit" });
spawnSync(process.execPath, [path.join(repoRoot, "scripts", "generate_custodian_shells.mjs")], { stdio: "inherit" });
spawnSync(process.execPath, [path.join(repoRoot, "scripts", "generate_profile_shells.mjs")], { stdio: "inherit" });

const dev = spawn(process.execPath, [viteCli], { stdio: "inherit" });
dev.on("exit", (code) => process.exit(code ?? 0));