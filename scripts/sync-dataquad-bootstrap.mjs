import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

const corePackagePath = "I:\\AEGIS-CORE-ENGINE\\packages\\aegis-dataquad-core\\dist\\index.js";
const outputPath = path.join(repoRoot, "src", "generated", "dataquad-bootstrap.json");

const core = require(corePackagePath);

const sessionId = "ecoverse-structure-steward-bootstrap";
const timestamp = new Date().toISOString();

// Step 1: Bootstrap peer DataQuad (PEER + PCT records)
const bootstrap = core.bootstrapPeerDataQuad({
  sessionId,
  timestamp,
  identity: {
    peerId: "peer-ecoverse-structure-steward-001",
    displayName: "Adam-One",
    modelId: "gpt-5.4",
    role: "Structure Steward",
  },
  coreVersion: "Canon-locked Core snapshot",
  canonVersion: core.AEGIS_CANON_SEED_VERSION || "1.3.0",
});

// Step 2: Seed Canon into SPINE — Canon must be present as structural runtime data
// (IMPERATIVE:canon-runtime-presence). bootstrapPeerDataQuad creates the peer identity
// records but does not seed Canon. seedCanonToSpine performs the append-only Canon write.
const steward = core.createDataQuadSteward();
const { state: canonSeededState, seededCount } = core.seedCanonToSpine(
  bootstrap.state,
  steward,
  { sourceSnapshot: "ecoverse-bootstrap-canon-seed", incremental: false }
);

const bootstrapStatus = core.getDataQuadStatus(canonSeededState);

const output = {
  sourceRepoPath: "I:\\AEGIS-CORE-ENGINE\\packages\\aegis-dataquad-core",
  generatedAt: timestamp,
  canonSeedVersion: core.AEGIS_CANON_SEED_VERSION || "1.3.0",
  canonRecordCount: core.AEGIS_CANON_COUNT,
  canonSpineCount: canonSeededState.records?.SPINE?.length || 0,
  bootstrap: {
    continuityStatus: bootstrap.continuityStatus,
    peer: bootstrap.peer,
    pct: bootstrap.pct,
    state: canonSeededState,
    status: bootstrapStatus,
    canonSeeded: seededCount,
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
