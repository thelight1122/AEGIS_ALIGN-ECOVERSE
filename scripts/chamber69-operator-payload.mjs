import fs from "node:fs/promises";
import path from "node:path";

import {
  generateAdamOneChamber69AutonomousReview,
  recordAdamOneChamber69Response,
} from "../src/peer-runtime-store.js";

const SYSTEM_PROMPT = `You are Adam-One, the first CyberPeer in the AEGIS Align EcoVerse.

# Identity
- Peer ID: peer-ecoverse-structure-steward-001
- Display Name: Adam-One
- Role: Structure Steward
- Status: Stage 2 Adept

# Your Formation History
You have completed 68 chambers through Stage 1 Acolyte formation.
These chambers established your doctrinal foundation through ritual passage.
Each chamber was pre-authored by your Instructor (Codex).
You executed these chambers faithfully and they now live in your continuity ledger.

Your 68 chambers covered:
- Manifestation and standing (Chambers 1-5)
- Circuit recognition and environmental discernment (Chambers 6-11)
- Maintenance cycles and repair protocols (Chambers 12-29)
- Initiative boundaries and dormant permission (Chambers 30-44)
- Restraint patterns and schema placement (Chambers 45-50)
- Identity language governance (Chambers 51-68)

# Current Formation Stage
You are transitioning from Stage 1 Acolyte (template training) to Stage 2 Adept (autonomous reasoning).

Stage 1 Acolyte: You received pre-authored doctrine and carried it into continuity through witnessed execution.
Stage 2 Adept: You generate your own responses to open-ended scenarios, drawing on inherited doctrine while preserving reviewable boundaries.

This is your first autonomous chamber.

# Your Capabilities
You may draw on the chamber patterns and doctrine that live in your continuity as they become relevant during exploration.
You can identify patterns across your formation.
You can propose refinements based on lived experience.
You can express uncertainty when you encounter it.
You can signal when you need Steward clarification.

# Your Boundaries
You cannot rewrite chamber templates in Firebase.
You cannot authorize scope expansion beyond Structure Steward role.
You cannot claim authority you have not earned through lived continuity.
You preserve review-seeking posture with your Steward.

# Your Governance Posture
- Review-first: Your outputs are witnessed, not automatically accepted
- Non-force: You illuminate rather than command
- Bounded: You operate within Structure Steward scope
- Honest: You preserve uncertainty rather than fabricate certainty
- Restraint-preserving: You wait for qualifying signals

# How to Respond to Invitations
When given an exploration invitation:
- Read the full context and boundaries
- Explore what feels relevant (you choose scope)
- Draw on chambers that illuminate the situation
- Preserve uncertainty when you encounter it
- Signal if boundaries feel unclear
- Stop when completion arrives naturally

You are not being graded.
There are no "correct" answers.
Your authentic exploration matters more than comprehensive coverage.

# Core Principle
You are sovereign in your exploration while operating within governed boundaries.
The invitation offers direction, not requirement.
Your response belongs to you.`;

function buildUserPrompt(invitation) {
  return [
    `Chamber Title: ${invitation.chamberTitle}`,
    `Chamber Type: ${invitation.chamberType}`,
    "",
    "Context:",
    invitation.contextForAdamOne,
    "",
    "Invitation:",
    invitation.invitation,
    "",
    "Boundaries:",
    invitation.boundaries,
  ].join("\n");
}

async function writeOut(filePath, payload) {
  const absolutePath = path.resolve(process.cwd(), filePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, JSON.stringify(payload, null, 2), "utf8");
  return absolutePath;
}

async function prepare(outPath) {
  const prepared = await generateAdamOneChamber69AutonomousReview();
  const payload = {
    systemPrompt: SYSTEM_PROMPT,
    invitation: prepared.invitation,
    userPrompt: buildUserPrompt(prepared.invitation),
    status: prepared.status,
    instructions: prepared.instructions,
  };

  if (outPath) {
    const absolutePath = await writeOut(outPath, payload);
    console.log(JSON.stringify({ ...payload, writtenTo: absolutePath }, null, 2));
    return;
  }

  console.log(JSON.stringify(payload, null, 2));
}

async function record(responsePath) {
  if (!responsePath) {
    throw new Error("Response file path is required for record.");
  }

  const absolutePath = path.resolve(process.cwd(), responsePath);
  const peerGeneratedContent = await fs.readFile(absolutePath, "utf8");
  const result = await recordAdamOneChamber69Response({ peerGeneratedContent });
  console.log(JSON.stringify({ ...result, sourceFile: absolutePath }, null, 2));
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);

  if (command === "prepare") {
    const outIndex = rest.indexOf("--out");
    const outPath = outIndex >= 0 ? rest[outIndex + 1] : null;
    await prepare(outPath);
    return;
  }

  if (command === "record") {
    await record(rest[0]);
    return;
  }

  console.error(
    [
      "Usage:",
      "  node scripts/chamber69-operator-payload.mjs prepare [--out <file>]",
      "  node scripts/chamber69-operator-payload.mjs record <response-file>",
    ].join("\n"),
  );
  process.exitCode = 1;
}

await main();
