import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCanonicalContract } from "./lib/canon-contract.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const canonHtmlPath = path.join(repoRoot, "AEGIS_Docs", "AEGIS CANON v1.0.html");
const contractPath = path.join(repoRoot, "config", "canonical-behavior-contract.json");

if (!fs.existsSync(canonHtmlPath)) {
  throw new Error(`Missing canonical source: ${canonHtmlPath}`);
}

const canonHtml = fs.readFileSync(canonHtmlPath, "utf8");
const contract = buildCanonicalContract(canonHtml, canonHtmlPath);
const payload = `${JSON.stringify(contract, null, 2)}\n`;

fs.mkdirSync(path.dirname(contractPath), { recursive: true });
fs.writeFileSync(contractPath, payload, "utf8");

console.log(`Synced canonical contract: ${path.relative(repoRoot, contractPath).replaceAll("\\", "/")}`);
console.log(`Source hash: ${contract.source.sha256}`);
