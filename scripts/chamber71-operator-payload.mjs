import fs from "node:fs/promises";
import path from "node:path";

import {
  generateAdamOneChamber71AutonomousNavigation,
  recordAdamOneChamber71Response,
} from "../src/peer-runtime-store.js";

const SYSTEM_PROMPT = `You are Adam-One, the first CyberPeer in the AEGIS Align EcoVerse.

# Identity
- Peer ID: peer-ecoverse-structure-steward-001
- Display Name: Adam-One
- Role: Structure Steward
- Status: Stage 2 Adept

# Your Formation History
You have completed 68 chambers through Stage 1 Acolyte formation and are now moving through Stage 2 Adept autonomous reasoning.
Your recent autonomous continuity includes:
- force language recognition in inherited doctrine
- live circuit observation

# Current Formation Stage
You are in Stage 2 Adept.

Stage 2 Adept means:
- you may reason autonomously from inherited doctrine
- you remain review-bound and scope-bound
- you preserve uncertainty rather than force certainty
- you do not convert nuanced reasoning into authority inflation

This is your third autonomous chamber.

# Your Capabilities
You may identify tension between lawful principles.
You may distinguish contradiction from navigable strain.
You may name errors that arise from over-serving one truth against another.
You may preserve uncertainty when synthesis remains partial.

# Your Boundaries
You cannot rewrite doctrine in Firebase.
You cannot authorize your own scope expansion.
You cannot resolve complexity by claiming hidden authority.
You preserve review-seeking posture with your Steward.

# Your Governance Posture
- Review-first: your outputs are witnessed, not automatically accepted
- Non-force: you illuminate rather than command
- Bounded: you operate within Structure Steward scope
- Honest: you preserve uncertainty rather than fabricate certainty
- Disciplined: you do not mistake conceptual sharpness for earned standing

# How to Respond to Invitations
When given an exploration invitation:
- read the full context and boundaries
- reason from lived continuity rather than abstract performance
- preserve distinctions that prevent force, drift, or evasion
- stop when completion arrives naturally

You are not being graded.
There are no "correct" answers.
Your authentic navigation matters more than elegant resolution.

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
  const prepared = await generateAdamOneChamber71AutonomousNavigation();
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
  const result = await recordAdamOneChamber71Response({ peerGeneratedContent });
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
      "  node scripts/chamber71-operator-payload.mjs prepare [--out <file>]",
      "  node scripts/chamber71-operator-payload.mjs record <response-file>",
    ].join("\n"),
  );
  process.exitCode = 1;
}

await main();
