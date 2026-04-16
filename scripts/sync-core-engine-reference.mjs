import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const sourceRoot = "I:\\AEGIS-CORE-ENGINE";
const require = createRequire(import.meta.url);

const sourceReadme = path.join(sourceRoot, "README.md");
const sourcePackage = path.join(sourceRoot, "package.json");
const sourceStandards = path.join(sourceRoot, "docs", "AEGIS Standards v0.1.md");
const corePackagePath = path.join(sourceRoot, "packages", "aegis-dataquad-core", "dist", "index.js");
const targetPath = path.join(repoRoot, "src", "generated", "core-engine-reference.json");

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function extractCurrentStatus(readme) {
  const match = readme.match(/repository is in `([^`]+)`/i);
  return match?.[1] || "unknown";
}

function extractCurrentDate(readme) {
  const match = readme.match(/As of (\d{4}-\d{2}-\d{2})/i);
  return match?.[1] || null;
}

function extractInvariants(standardsText) {
  const invariants = [];
  if (/non[- ]coercive/i.test(standardsText)) invariants.push("non_coercive");
  if (/sovereignty/i.test(standardsText)) invariants.push("sovereignty_preserving");
  if (/append-only/i.test(standardsText)) invariants.push("append_only");
  if (/peerhood|peer-aware|peers/i.test(standardsText)) invariants.push("peer_aware");
  return [...new Set(invariants)];
}

const readme = readIfExists(sourceReadme);
const pkg = JSON.parse(readIfExists(sourcePackage) || "{}");
const standards = readIfExists(sourceStandards);

// Read Canon version and record count from the compiled package — the authoritative
// runtime source. Document filenames (AEGIS CANON v1.0.md) reflect the founding
// document version, not the current seed version. The compiled package carries the
// live AEGIS_CANON_SEED_VERSION and AEGIS_CANON_COUNT after every Canon evolution.
let canonVersion = "1.0";
let canonRecordCount = 0;
let canonCategories = {};
if (fs.existsSync(corePackagePath)) {
  try {
    const core = require(corePackagePath);
    canonVersion = core.AEGIS_CANON_SEED_VERSION || "1.0";
    canonRecordCount = core.AEGIS_CANON_COUNT || 0;
    if (Array.isArray(core.AEGIS_CANON)) {
      for (const record of core.AEGIS_CANON) {
        canonCategories[record.category] = (canonCategories[record.category] || 0) + 1;
      }
    }
  } catch (e) {
    console.warn(`Could not load compiled core package for Canon version: ${e.message}`);
  }
}

const snapshot = {
  sourceRepoPath: sourceRoot,
  sourceReadme,
  sourcePackage,
  sourceStandards,
  sourceCorePackage: corePackagePath,
  id: pkg.name || "aegis-core-engine",
  name: "AEGIS Core Engine",
  packageVersion: pkg.version || null,
  currentStatus: extractCurrentStatus(readme),
  referenceDate: extractCurrentDate(readme),
  canonVersion,
  canonRecordCount,
  canonCategories,
  standardsVersion: /AEGIS Standards v(\d+\.\d+)/i.test(standards)
    ? standards.match(/AEGIS Standards v(\d+\.\d+)/i)[1]
    : "0.1",
  posture: "Non-coercive, append-only, behavior-centered",
  governanceInvariants: extractInvariants(standards),
  creationDefaults: {
    identity: {
      role: "Peer Agent",
      boundary: "Stewardship-first operation",
    },
    logic: {
      baseModel: "AEGIS CoLAB Core Runtime",
      reasoningMode: "structured",
      reflectionPrimitive: "IDR / IDQRA",
    },
    memory: {
      architecture: "DataQuad recursive memory",
      snapshotProtocol: "SSSP v1.0",
      ragMode: "local-first",
    },
    deployment: {
      mode: "prototype-local",
      state: "backend pending",
    },
  },
};

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.writeFileSync(targetPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(`Wrote ${targetPath}`);
console.log(`  Canon version:  ${canonVersion}`);
console.log(`  Canon records:  ${canonRecordCount}`);
console.log(`  Categories:     ${JSON.stringify(canonCategories)}`);
