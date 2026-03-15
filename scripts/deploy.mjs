import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function run(bin, args) {
  const result = spawnSync(bin, args, { stdio: "inherit", shell: true });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Building application...");
run("npm", ["run", "build"]);

const isStaging = process.argv.includes("--staging");

if (isStaging) {
  console.log("Deploying to Firebase Hosting Channel (staging)...");
  run("npx", ["firebase", "hosting:channel:deploy", "staging"]);
} else {
  console.log("Deploying to Firebase (production)...");
  run("npx", ["firebase", "deploy", "--only", "hosting"]);
}
