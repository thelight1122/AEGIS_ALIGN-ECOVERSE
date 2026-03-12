import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCanonicalContract } from "./lib/canon-contract.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const canonHtmlPath = path.join(repoRoot, "AEGIS_Docs", "AEGIS CANON v1.0.html");
const contractPath = path.join(repoRoot, "config", "canonical-behavior-contract.json");

const { expected, actual } = loadCanonicalContract(canonHtmlPath, contractPath);

const expectedPayload = JSON.stringify(expected);
const actualPayload = JSON.stringify(actual);

if (expectedPayload !== actualPayload) {
  console.error("Canonical contract check failed.");
  console.error("Run: npm run sync:canon");
  process.exit(1);
}

console.log("Canonical contract check passed.");
console.log(`Source hash: ${expected.source.sha256}`);
