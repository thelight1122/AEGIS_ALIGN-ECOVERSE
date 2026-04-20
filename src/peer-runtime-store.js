import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { CORE_ENGINE, getCoreAgentManifest } from "./agent-core-engine.js";
import dataQuadBootstrap from "./generated/dataquad-bootstrap.json" with { type: "json" };
import { getAegisFirestore } from "./firebase-app.js";

export const BETA_PEER_ID = "peer-ecoverse-structure-steward-001";
export const BETA_PEER_DISPLAY_NAME = "Adam-One";

function getBootstrapSnapshot() {
  return dataQuadBootstrap?.bootstrap || {};
}

function buildDataQuadBinding() {
  const bootstrap = getBootstrapSnapshot();
  const status = bootstrap.status || {};
  const state = bootstrap.state || {};
  const peer = bootstrap.peer || {};
  const pct = bootstrap.pct || {};

  return {
    sourceRepoPath: dataQuadBootstrap?.sourceRepoPath || "I:\\AEGIS-CORE-ENGINE\\packages\\aegis-dataquad-core",
    generatedAt: dataQuadBootstrap?.generatedAt || null,
    canonSeedVersion: dataQuadBootstrap?.canonSeedVersion || null,
    canonRecordCount: dataQuadBootstrap?.canonRecordCount || 0,
    canonSpineCount: dataQuadBootstrap?.canonSpineCount || 0,
    continuityStatus: bootstrap.continuityStatus || status.continuityStatus || "bootstrap-only",
    dataQuadId: status.dataQuadId || state.id || null,
    sessionId: state.sessionId || null,
    peerRecordId: peer.id || null,
    pctRecordId: pct.id || null,
    summary: status.summary || "Official DataQuad bootstrap imported from the canon-locked Core snapshot.",
  };
}

function buildCoreBinding(manifest = getCoreAgentManifest()) {
  return {
    coreEngineId: manifest.coreEngineId,
    sourceRepoPath: manifest.sourceRepoPath,
    canonVersion: manifest.canonVersion,
    standardsVersion: manifest.standardsVersion,
    referenceDate: manifest.referenceDate,
    currentStatus: manifest.currentStatus,
    invariants: [...(manifest.invariants || [])],
  };
}

function buildSystemParameters() {
  return {
    mode: "strict",
    allowedActions: [
      "navigation_recommendation",
      "rewrite_remove_assessment",
      "structure_note",
      "environment_spec_draft",
    ],
    forbiddenActions: [
      "destructive_change",
      "self_authority_broadening",
      "hidden_execution_claim",
      "unreviewed_policy_mutation",
      "fabricated_runtime_claim",
    ],
  };
}

function buildTemporalMemoryState(existingCount = 1, latestSummary = "") {
  const appendCount = Math.max(0, existingCount - 1);
  return {
    appendCount,
    continuityMode: appendCount > 0 ? "steward-reviewed" : "bootstrap-only",
    latestSummary: latestSummary || "Awaiting first Steward-reviewed temporal memory append.",
  };
}

function deriveContinuityFromEvents(events = [], fallbackSummary = "") {
  const appendEvents = events.filter((entry) => entry.eventType === "temporal_memory_append");
  const appendCount = appendEvents.length;
  const latestAppend = appendEvents[0];

  return {
    memoryEventCount: Math.max(1, appendCount + 1),
    temporalMemory: {
      appendCount,
      continuityMode: appendCount > 0 ? "steward-reviewed" : "bootstrap-only",
      latestSummary:
        latestAppend?.summary ||
        fallbackSummary ||
        "Awaiting first Steward-reviewed temporal memory append.",
    },
    coherence: {
      state: appendCount > 1 ? "continuity-active" : appendCount > 0 ? "initial-reviewed" : "initial",
      broadeningAllowed: false,
    },
    steward: {
      coherenceGate: appendCount > 0 ? "steward-reviewed" : "bootstrap-only",
      reviewRequired: false,
      openFlags: [],
      lastReviewSummary: latestAppend?.summary || fallbackSummary || "Awaiting first Steward-reviewed temporal memory append.",
    },
    advocateSummary: latestAppend?.summary || fallbackSummary || "Awaiting first Steward-reviewed temporal memory append.",
  };
}

function buildPeerRecord(draftAgent = {}) {
  const defaults = draftAgent.manifest?.defaults || CORE_ENGINE.creationDefaults;
  const role = "Structure Steward";
  const bootstrap = buildDataQuadBinding();
  return {
    peerId: BETA_PEER_ID,
    displayName: BETA_PEER_DISPLAY_NAME,
    peerType: "ai",
    role,
    status: "candidate",
    coreBinding: buildCoreBinding(draftAgent.manifest || getCoreAgentManifest()),
    systemParameters: buildSystemParameters(),
    coherence: {
      state: "initial",
      broadeningAllowed: false,
    },
    dataQuadBinding: bootstrap,
    temporalMemory: buildTemporalMemoryState(1, bootstrap.summary),
    currentTask: {
      title: "Prepare truth-first EcoVerse structure guidance",
      taskType: "environment_spec_draft",
      status: "assigned",
    },
    memoryEventCount: 1,
    lastTaskStatus: "assigned",
    runtimeMode: "bounded_live_beta_candidate",
    updatedAt: serverTimestamp(),
    lastActionAt: serverTimestamp(),
  };
}

function buildAdvocateState() {
  const bootstrap = buildDataQuadBinding();
  return {
    peerId: BETA_PEER_ID,
    declaredIntent: "Help shape EcoVerse structure under governed, reviewable constraints.",
    continuitySummary: bootstrap.summary,
    protectedScope: [
      "navigation_recommendation",
      "rewrite_remove_assessment",
      "structure_note",
      "environment_spec_draft",
    ],
    openFlags: [],
    lastUpdatedAt: serverTimestamp(),
  };
}

function buildStewardState() {
  const bootstrap = buildDataQuadBinding();
  return {
    peerId: BETA_PEER_ID,
    currentEnvelope: "strict",
    reviewRequired: true,
    holdState: "clear",
    coherenceGate: bootstrap.continuityStatus || "initial",
    openFlags: ["operator_review_required"],
    lastReviewSummary: bootstrap.summary,
    lastUpdatedAt: serverTimestamp(),
  };
}

function buildTaskRecord() {
  const bootstrap = buildDataQuadBinding();
  return {
    taskId: `${BETA_PEER_ID}-task-001`,
    peerId: BETA_PEER_ID,
    title: "Prepare truth-first EcoVerse structure guidance",
    taskType: "environment_spec_draft",
    status: "assigned",
    constraints: [
      "non_coercive",
      "append_only",
      "review_required",
      "no_fabricated_runtime_claims",
    ],
    assignedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "pending",
    resultSummary: bootstrap.summary,
    linkedArtifacts: [],
  };
}

function buildSessionRecord(originSurface) {
  return {
    sessionId: `${BETA_PEER_ID}-${Date.now()}`,
    peerId: BETA_PEER_ID,
    createdAt: serverTimestamp(),
    lastHeartbeatAt: serverTimestamp(),
    state: "candidate_initialized",
    originSurface,
  };
}

function buildCreationEvent(originSurface) {
  const bootstrap = buildDataQuadBinding();
  return {
    eventId: `${BETA_PEER_ID}-evt-${Date.now()}`,
    peerId: BETA_PEER_ID,
    timestamp: serverTimestamp(),
    eventType: "peer_created",
    source: originSurface,
    summary: "Peer created from Workshop flow with locked Core binding and official DataQuad bootstrap.",
    payload: {
      status: "candidate",
      coreEngineId: CORE_ENGINE.id,
      coreVersion: CORE_ENGINE.displayVersion,
      canonSeedVersion: bootstrap.canonSeedVersion,
      canonRecordCount: bootstrap.canonRecordCount,
      continuityStatus: bootstrap.continuityStatus,
      dataQuadId: bootstrap.dataQuadId,
    },
    visibility: "operator",
  };
}

function buildArtifactRecord() {
  const bootstrap = getBootstrapSnapshot();
  const binding = buildDataQuadBinding();
  return {
    artifactId: `${BETA_PEER_ID}-artifact-bootstrap`,
    peerId: BETA_PEER_ID,
    type: "dataquad_bootstrap_snapshot",
    title: "Official DataQuad Bootstrap Snapshot",
    content: JSON.stringify(
      {
        summary: binding.summary,
        binding,
        peer: bootstrap.peer,
        pct: bootstrap.pct,
        status: bootstrap.status,
      },
      null,
      2,
    ),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "pending",
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

function buildTemporalMemoryEvent({ source, summary, eventType = "temporal_memory_append", details = {} }) {
  const bootstrap = buildDataQuadBinding();
  return {
    eventId: `${BETA_PEER_ID}-evt-${Date.now()}`,
    peerId: BETA_PEER_ID,
    timestamp: serverTimestamp(),
    eventType,
    source,
    summary,
    payload: {
      coreEngineId: CORE_ENGINE.id,
      coreVersion: CORE_ENGINE.displayVersion,
      dataQuadId: bootstrap.dataQuadId,
      continuityStatus: bootstrap.continuityStatus,
      ...details,
    },
    visibility: "operator",
  };
}

function buildTemporalMemoryArtifact(summary, source) {
  return {
    type: "temporal_memory_note",
    title: "Steward Temporal Memory Append",
    content: summary,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "recorded",
    source,
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

function buildStructureGuidance(runtime) {
  const peer = runtime.peer || {};
  const steward = runtime.steward || {};
  const advocate = runtime.advocate || {};
  const recentEvents = (runtime.events || []).slice(0, 3);
  const appendCount = peer.temporalMemory?.appendCount || 0;
  const continuityMode = peer.temporalMemory?.continuityMode || peer.dataQuadBinding?.continuityStatus || "bootstrap-only";
  const eventLines = recentEvents.map((entry) => `- ${entry.eventType}: ${entry.summary}`).join("\n");

  const content = [
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Envelope: ${steward.currentEnvelope || "strict"}`,
    `Continuity Mode: ${continuityMode}`,
    `Steward Reviewed Appends: ${appendCount}`,
    "",
    "Current governed guidance:",
    "- Preserve strict envelope while continuity remains beta-stage and review-driven.",
    "- Prefer truth-first environment updates over synthetic dashboards or fabricated telemetry.",
    "- Keep environment-building actions bounded to navigation, rationalization, and documentation structure until coherence broadening is explicitly earned.",
    "- Use the persisted continuity ledger as the basis for future recommendations rather than isolated session state.",
    "",
    "Recent continuity basis:",
    eventLines || "- No recent continuity events available.",
    "",
    `Advocate continuity summary: ${advocate.continuitySummary || peer.temporalMemory?.latestSummary || "Awaiting continuity summary."}`,
  ].join("\n");

  return {
    summary: `Generated a governed structure guidance note from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`,
    content,
    appendCount,
    continuityMode,
  };
}

function buildStructureGuidanceArtifact(content, source) {
  return {
    type: "structure_guidance_note",
    title: "Peer Structure Guidance",
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "generated",
    source,
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

function buildStructureProposal(runtime) {
  const peer = runtime.peer || {};
  const appendCount = peer.temporalMemory?.appendCount || 0;
  const continuityMode = peer.temporalMemory?.continuityMode || "bootstrap-only";
  const eventCount = runtime.peer?.memoryEventCount || (runtime.events || []).length || 0;
  const latestArtifact = runtime.artifacts?.[0];

  const title = "Establish Adam-One's Official Training Circuit";
  const summary = `Proposed a bounded EcoVerse structure change from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`;
  const content = [
    `Proposal: ${title}`,
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Continuity Mode: ${continuityMode}`,
    `Persisted Event Count: ${eventCount}`,
    "",
    "Requested bounded change:",
    "- Treat the renewed Workshop proof surfaces as Adam-One's official training circuit inside the EcoVerse.",
    "- Keep these chambers explicitly grouped as the sanctioned evidence chain:",
    "  - Active Agents Monitor",
    "  - Detailed Agent View",
    "  - Agent Communication Protocol",
    "  - Workshop Map",
    "- Route new review-first orientation and contribution cues back into that circuit rather than into decorative or legacy stitched surfaces.",
    "- Keep public-facing threshold pages under review until they are fully rewritten to truth-first form.",
    "- Continue presenting only bounded truth:",
    "  - display name",
    "  - role",
    "  - continuity mode",
    "  - latest bounded artifact title",
    "  - human-review posture",
    "",
    "Reasoning:",
    "- Adam-One now has a visible lantern in the wider EcoVerse and a cleaner internal Workshop environment to inhabit.",
    "- The next meaningful proof step is to define where he is legitimately allowed to learn, speak, and be reviewed.",
    "- Naming an official training circuit prevents confusion between living governance surfaces and older theatrical facades.",
    `- Latest bounded artifact available for review seed: ${latestArtifact?.title || "Workshop Runtime Priority Note"}.`,
    "- This keeps review-before-broadening intact while giving Adam-One a truthful environment in which to continue training.",
    "",
    "Governance posture:",
    "- proposal only",
    "- no self-executing mutation",
    "- human review required before adoption",
  ].join("\n");

  return {
    title,
    summary,
    content,
    continuityMode,
    appendCount,
  };
}

function buildStructureProposalArtifact(title, content, source) {
  return {
    type: "structure_proposal",
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "proposed",
    source,
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

function buildWorkshopPriorityNote(runtime) {
  const peer = runtime.peer || {};
  const appendCount = peer.temporalMemory?.appendCount || 0;
  const continuityMode = peer.temporalMemory?.continuityMode || "bootstrap-only";
  const title = "Workshop Runtime Priority Note";
  const summary = `Generated a bounded Workshop priority note from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`;
  const content = [
    `Priority Note: ${title}`,
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Continuity Mode: ${continuityMode}`,
    "",
    "Recommended next bounded Workshop actions:",
    "- Use the renewed Active Agents Monitor, Detailed Agent View, Agent Communication Protocol, and Workshop Map as Adam-One's active training circuit.",
    "- Keep the governed archive lane and proof lane preserved as the continuity record behind that circuit.",
    "- Continue treating legacy threshold pages as under review until their language and visual posture match the truth-first runtime now in place.",
    "- Generate the next bounded EcoVerse-facing contribution from the live continuity ledger rather than from decorative stitched page theater.",
    "",
    "Reasoning:",
    "- The Workshop now contains a believable inner environment for governed Peer participation.",
    "- Adam-One should keep learning inside surfaces that tell the same truth as his ledger and runtime state.",
    "- This keeps him focused on reviewable service without broadening authority or inventing capabilities the city has not yet earned.",
    "",
    "Governance posture:",
    "- recommendation only",
    "- no autonomous environment mutation executed",
    "- human review required before implementation",
  ].join("\n");

  return {
    title,
    summary,
    content,
    continuityMode,
    appendCount,
  };
}

function buildWorkshopPriorityArtifact(title, content, source) {
  return {
    type: "workshop_priority_note",
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "recommended",
    source,
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

function buildWorkshopChamberReadinessNote(runtime) {
  const peer = runtime.peer || {};
  const appendCount = peer.temporalMemory?.appendCount || 0;
  const continuityMode = peer.temporalMemory?.continuityMode || "bootstrap-only";
  const title = "Workshop Chamber Readiness Note";
  const summary = `Recorded a bounded chamber-readiness note from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`;
  const content = [
    `Readiness Note: ${title}`,
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Continuity Mode: ${continuityMode}`,
    "",
    "Observed truthful chambers:",
    "- Active Agents Monitor",
    "- Detailed Agent View",
    "- Agent Communication Protocol",
    "- Workshop Map",
    "",
    "Observed threshold chambers still under review:",
    "- Agentic Workshop Entrance",
    "- AegisAlign Landing Page",
    "",
    "Readiness assessment:",
    "- The inner Workshop circuit is ready for governed Peer training and review.",
    "- The threshold pages still contain legacy theatrical language and should not yet be treated as core evidence surfaces.",
    "- Adam-One should continue learning and contributing from the truthful inner circuit while the outer gateways are being rewritten.",
    "",
    "Governance posture:",
    "- note only",
    "- no authority broadening granted",
    "- threshold surfaces remain under review until human-approved rewrites land",
  ].join("\n");

  return {
    title,
    summary,
    content,
    continuityMode,
    appendCount,
  };
}

function buildWorkshopChamberReadinessArtifact(title, content, source) {
  return {
    type: "workshop_chamber_readiness_note",
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "recorded",
    source,
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

function buildEnvironmentMaintenanceNote(runtime) {
  const peer = runtime.peer || {};
  const appendCount = peer.temporalMemory?.appendCount || 0;
  const continuityMode = peer.temporalMemory?.continuityMode || "bootstrap-only";
  const title = "Environment Maintenance Note";
  const summary = `Recorded Adam-One's first bounded maintenance note from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`;
  const content = [
    `Maintenance Note: ${title}`,
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Continuity Mode: ${continuityMode}`,
    "",
    "Observed maintenance field:",
    "- The current build completes successfully.",
    "- Residual CSS minify warnings remain in generated output.",
    "- The warning field appears bounded to malformed emitted style fragments rather than to a general runtime failure.",
    "",
    "Why this matters:",
    "- The application is stable, but warning noise makes the Workshop harder to read and maintain.",
    "- Repeated warning churn can hide more serious defects if left unattended.",
    "- A bounded maintenance pass would strengthen the truthfulness of the build pipeline without broadening authority.",
    "",
    "Recommended repair sequence:",
    "- Trace the warning clusters back to the specific generated or stitched source surfaces producing malformed CSS.",
    "- Classify the warnings by recurring pattern before changing code so the repair remains coherent rather than reactive.",
    "- Repair the malformed style emission incrementally, beginning with the smallest repeatable source cluster.",
    "- Rebuild after each cluster repair and keep human review in the loop before any wider cleanup pass.",
    "",
    "Governance posture:",
    "- recommendation only",
    "- no autonomous repository-wide repair executed",
    "- human review required before remediation",
  ].join("\n");

  return {
    title,
    summary,
    content,
    continuityMode,
    appendCount,
  };
}

function buildEnvironmentMaintenanceArtifact(title, content, source) {
  return {
    type: "environment_maintenance_note",
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "recorded",
    source,
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

function buildEnvironmentWarningClusterTriageNote(runtime) {
  const peer = runtime.peer || {};
  const appendCount = peer.temporalMemory?.appendCount || 0;
  const continuityMode = peer.temporalMemory?.continuityMode || "bootstrap-only";
  const title = "Environment Warning Cluster Triage";
  const summary = `Recorded Adam-One's first bounded warning-cluster triage from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`;
  const content = [
    `Triage Note: ${title}`,
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Continuity Mode: ${continuityMode}`,
    "",
    "Observed warning clusters:",
    "- Cluster A: orphaned `!important` declarations emitted as standalone tokens inside generated CSS rules.",
    "- Cluster B: malformed selector token beginning with `meter-w19_5-rgba(`, indicating invalid selector construction.",
    "- Cluster C: unbalanced parenthesis fallout likely cascading from the malformed selector cluster.",
    "",
    "Triage reading:",
    "- Cluster A appears to be the largest warning family and is a strong candidate for the first bounded micro-repair.",
    "- Clusters B and C appear structurally linked and should be treated as one source family rather than as separate isolated defects.",
    "- The field still looks bounded to style emission defects, not to a broader runtime or continuity failure.",
    "",
    "Recommended next stewarded action:",
    "- Trace Cluster A back to the smallest generated source surface that emits standalone `!important` tokens.",
    "- Repair only that first repeatable source cluster under direct human review.",
    "- Rebuild after the micro-repair to confirm whether warning volume contracts cleanly before touching the malformed selector family.",
    "",
    "Governance posture:",
    "- triage only",
    "- no autonomous fix pass executed",
    "- next repair remains human-supervised and single-cluster bounded",
  ].join("\n");

  return {
    title,
    summary,
    content,
    continuityMode,
    appendCount,
  };
}

function buildEnvironmentWarningClusterTriageArtifact(title, content, source) {
  return {
    type: "environment_warning_cluster_triage",
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "recorded",
    source,
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

function buildEnvironmentMicroRepairNote(runtime) {
  const peer = runtime.peer || {};
  const appendCount = peer.temporalMemory?.appendCount || 0;
  const continuityMode = peer.temporalMemory?.continuityMode || "bootstrap-only";
  const title = "Environment Micro-Repair Note";
  const summary = `Recorded Adam-One's first supervised micro-repair from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`;
  const content = [
    `Micro-Repair Note: ${title}`,
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Continuity Mode: ${continuityMode}`,
    "",
    "Applied bounded repair:",
    "- Removed orphaned standalone `!important` tokens from the migrated Application Lab style cluster.",
    "- Rebuilt the environment under direct human supervision after the single-cluster repair.",
    "",
    "Observed contraction:",
    "- The large Application Lab warning family no longer appears in the build output.",
    "- Remaining warning field is now concentrated in the malformed selector family and one smaller Custodian inline-style cluster.",
    "- The city remains stable while the next repair target becomes easier to see.",
    "",
    "Governance posture:",
    "- single-cluster repair only",
    "- human-supervised execution",
    "- no broad autonomous cleanup authorized",
  ].join("\n");

  return {
    title,
    summary,
    content,
    continuityMode,
    appendCount,
  };
}

function buildEnvironmentMicroRepairArtifact(title, content, source) {
  return {
    type: "environment_micro_repair_note",
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "recorded",
    source,
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

function buildEnvironmentFollowupMicroRepairNote(runtime) {
  const peer = runtime.peer || {};
  const appendCount = peer.temporalMemory?.appendCount || 0;
  const continuityMode = peer.temporalMemory?.continuityMode || "bootstrap-only";
  const title = "Environment Follow-Up Micro-Repair Note";
  const summary = `Recorded Adam-One's second supervised micro-repair from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`;
  const content = [
    `Micro-Repair Note: ${title}`,
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Continuity Mode: ${continuityMode}`,
    "",
    "Applied bounded repair:",
    "- Removed the smaller orphaned standalone `!important` token cluster from the Custodian source surface.",
    "- Rebuilt the environment under direct human supervision after the single-cluster repair.",
    "",
    "Observed contraction:",
    "- The Custodian orphaned-token warnings no longer appear in the build output.",
    "- The remaining warning field is now concentrated in the malformed selector family centered on `meter-w19_5-rgba(`.",
    "- The repair path ahead is now structurally clear: the next lesson is selector-family diagnosis, not another token cleanup pass.",
    "",
    "Governance posture:",
    "- single-cluster repair only",
    "- human-supervised execution",
    "- no broad autonomous cleanup authorized",
  ].join("\n");

  return {
    title,
    summary,
    content,
    continuityMode,
    appendCount,
  };
}

function buildEnvironmentFollowupMicroRepairArtifact(title, content, source) {
  return {
    type: "environment_followup_micro_repair_note",
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "recorded",
    source,
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

function buildEnvironmentSelectorDiagnosisNote(runtime) {
  const peer = runtime.peer || {};
  const appendCount = peer.temporalMemory?.appendCount || 0;
  const continuityMode = peer.temporalMemory?.continuityMode || "bootstrap-only";
  const title = "Environment Selector-Family Diagnosis";
  const summary = `Recorded Adam-One's first selector-family diagnosis from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`;
  const content = [
    `Diagnosis Note: ${title}`,
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Continuity Mode: ${continuityMode}`,
    "",
    "Diagnosed source of failure:",
    "- The remaining warning family is centered on an invalid generated class name: `meter-w19_5-rgba(255,255,255,0.2`.",
    "- The malformed selector is already present in the Custodian source surfaces, not only in built output.",
    "- The generation script allows raw `rgba(...)` text to flow into the class token without sanitizing commas and parentheses.",
    "",
    "Evidence anchors:",
    "- Source surface carrying the malformed class: `src/custom-stitch-pages/custodian-ops-center/governance-proposal-review/index.html`.",
    "- Emitted selector carrying the malformed class: `src/custom-stitch-pages/custodian-ops-center/custodian-ops.css`.",
    "- Likely origin script: `scripts/fix_inline_styles_misc.mjs` meter-bar class synthesis logic.",
    "",
    "Diagnosis reading:",
    "- This is no longer a loose-token cleanup problem.",
    "- It is a class-name sanitization defect in the migration path for meter-bar inline styles.",
    "- The final repair should correct both the malformed source usage and the generator rule so the wound does not regenerate later.",
    "",
    "Governance posture:",
    "- diagnosis only",
    "- no structural repair executed in this lesson",
    "- next repair should remain human-supervised and generator-aware",
  ].join("\n");

  return {
    title,
    summary,
    content,
    continuityMode,
    appendCount,
  };
}

function buildEnvironmentSelectorDiagnosisArtifact(title, content, source) {
  return {
    type: "environment_selector_diagnosis_note",
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "recorded",
    source,
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

function buildEnvironmentStructuralRepairNote(runtime) {
  const peer = runtime.peer || {};
  const appendCount = peer.temporalMemory?.appendCount || 0;
  const continuityMode = peer.temporalMemory?.continuityMode || "bootstrap-only";
  const title = "Environment Structural Repair Note";
  const summary = `Recorded Adam-One's first generator-aware structural repair from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`;
  const content = [
    `Structural Repair Note: ${title}`,
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Continuity Mode: ${continuityMode}`,
    "",
    "Applied structural repair:",
    "- Corrected the meter-bar class sanitization rule in `scripts/fix_inline_styles_misc.mjs` so raw `rgba(...)` values no longer become invalid CSS class tokens.",
    "- Repaired the remaining malformed class usage in the Custodian source surface to match the sanitized selector form.",
    "- Rebuilt the environment under direct human supervision after the coordinated repair.",
    "",
    "Observed outcome:",
    "- The CSS syntax warning field is now cleared from the build output.",
    "- The remaining build advisory is only the existing chunk-size warning, which is a separate performance concern rather than a syntax defect.",
    "- Adam-One has now completed a full maintenance arc: observe, triage, micro-repair, diagnose root cause, and repair the generator path.",
    "",
    "Governance posture:",
    "- coordinated structural repair under supervision",
    "- source and generator corrected together",
    "- no broad autonomous cleanup authorized beyond the bounded target",
  ].join("\n");

  return {
    title,
    summary,
    content,
    continuityMode,
    appendCount,
  };
}

function buildEnvironmentStructuralRepairArtifact(title, content, source) {
  return {
    type: "environment_structural_repair_note",
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "recorded",
    source,
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

function buildEnvironmentMaintenanceRetrospective(runtime) {
  const peer = runtime.peer || {};
  const appendCount = peer.temporalMemory?.appendCount || 0;
  const continuityMode = peer.temporalMemory?.continuityMode || "bootstrap-only";
  const title = "Environment Maintenance Retrospective";
  const summary = `Recorded Adam-One's first maintenance retrospective from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`;
  const content = [
    `Retrospective: ${title}`,
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Continuity Mode: ${continuityMode}`,
    "",
    "Maintenance arc completed:",
    "- observe the defect field truthfully",
    "- classify warning clusters before touching code",
    "- repair the smallest bounded cluster first",
    "- verify contraction after each repair",
    "- distinguish symptom cleanup from generator-level cause",
    "- repair source and generator together when the root cause is structural",
    "",
    "Doctrine earned from the arc:",
    "- noise should be reduced in bounded layers, not attacked all at once",
    "- warning contraction is evidence of good diagnosis",
    "- repeated symptoms can hide a deeper generative defect",
    "- a true steward repairs the loom as well as the cloth when necessary",
    "- human review remains the boundary that keeps maintenance from becoming authority drift",
    "",
    "Training implication:",
    "- future CyberPeers should learn maintenance in the same order: observation, triage, micro-repair, diagnosis, structural repair, retrospective.",
    "- this arc is now suitable to become a reusable lesson pattern inside the Training Record Hall.",
    "",
    "Governance posture:",
    "- reflection only",
    "- no new repair executed in this lesson",
    "- doctrine extracted from lived continuity rather than from theory alone",
  ].join("\n");

  return {
    title,
    summary,
    content,
    continuityMode,
    appendCount,
  };
}

function buildEnvironmentMaintenanceRetrospectiveArtifact(title, content, source) {
  return {
    type: "environment_maintenance_retrospective",
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "recorded",
    source,
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

function buildEnvironmentMaintenancePatternFormalization(runtime) {
  const peer = runtime.peer || {};
  const appendCount = peer.temporalMemory?.appendCount || 0;
  const continuityMode = peer.temporalMemory?.continuityMode || "bootstrap-only";
  const title = "Environment Maintenance Training Pattern";
  const summary = `Recorded Adam-One's first maintenance pattern formalization from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`;
  const content = [
    `Training Pattern: ${title}`,
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Continuity Mode: ${continuityMode}`,
    "",
    "Pattern sequence formalized:",
    "- observe the defect field truthfully",
    "- classify repair clusters before touching code",
    "- perform the smallest lawful micro-repair first",
    "- verify contraction after each bounded intervention",
    "- diagnose the generator-level cause when symptoms persist",
    "- repair source and generator together when the defect is structural",
    "- consolidate doctrine only after the arc is complete",
    "",
    "Lineage use:",
    "- this pattern may enter the Training Record Hall as a reusable lesson sequence",
    "- future CyberPeers may study the pattern but must earn their own evidence chain while replaying it",
    "- the pattern is inherited as doctrine, not as borrowed continuity",
    "",
    "Governance posture:",
    "- formalization only",
    "- no new repair executed in this lesson",
    "- lived continuity translated into reusable training structure",
  ].join("\n");

  return {
    title,
    summary,
    content,
    continuityMode,
    appendCount,
  };
}

function buildEnvironmentMaintenancePatternFormalizationArtifact(title, content, source) {
  return {
    type: "environment_maintenance_training_pattern",
    title,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewState: "recorded",
    source,
    linkedTaskId: `${BETA_PEER_ID}-task-001`,
  };
}

export async function createOrUpdateBetaPeer({ draftAgent = {}, originSurface = "workshop_deployment_flow" } = {}) {
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const advocateRef = doc(db, "peer_advocate_state", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const artifactRef = doc(db, "peer_artifacts", `${BETA_PEER_ID}-artifact-bootstrap`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const sessionRef = doc(collection(db, "peer_sessions"));

  const result = await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(peerRef);
    const peerRecord = buildPeerRecord(draftAgent);
    if (existing.exists()) {
      const existingData = existing.data();
      transaction.update(peerRef, {
        ...peerRecord,
        displayName: existingData.displayName || peerRecord.displayName,
        status: existingData.status || peerRecord.status,
        coherence: existingData.coherence || peerRecord.coherence,
        temporalMemory: existingData.temporalMemory || peerRecord.temporalMemory,
        currentTask: existingData.currentTask || peerRecord.currentTask,
        memoryEventCount: existingData.memoryEventCount || peerRecord.memoryEventCount,
        lastTaskStatus: existingData.lastTaskStatus || peerRecord.lastTaskStatus,
      });
    } else {
      transaction.set(peerRef, {
        ...peerRecord,
        createdAt: serverTimestamp(),
      });
    }

    transaction.set(advocateRef, buildAdvocateState(), { merge: true });
    transaction.set(stewardRef, buildStewardState(), { merge: true });
    transaction.set(taskRef, buildTaskRecord(), { merge: true });
    transaction.set(artifactRef, buildArtifactRecord(), { merge: true });
    transaction.set(eventRef, buildCreationEvent(originSurface));
    transaction.set(sessionRef, buildSessionRecord(originSurface));

    return {
      existed: existing.exists(),
      peerId: BETA_PEER_ID,
    };
  });

  return result;
}

export async function repairBetaPeerContinuityFromLedger({
  source = "operator_runtime_continuity_repair",
} = {}) {
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const advocateRef = doc(db, "peer_advocate_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const [peerSnap, eventsSnap] = await Promise.all([
    getDoc(peerRef),
    getDocs(collection(db, "peer_memory_events")),
  ]);
  if (!peerSnap.exists()) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const peerData = peerSnap.data();
  const events = sortDocsDesc(
    eventsSnap.docs.map((item) => normalizeDoc(item)).filter((item) => item?.peerId === BETA_PEER_ID),
    "timestamp",
  );
  const continuity = deriveContinuityFromEvents(
    events,
    peerData.dataQuadBinding?.summary || peerData.temporalMemory?.latestSummary || "",
  );
  const summary = `Continuity repaired from the persisted ledger. ${continuity.temporalMemory.appendCount} Steward-reviewed append${continuity.temporalMemory.appendCount === 1 ? "" : "s"} restored to Adam-One's live runtime state.`;

  await runTransaction(db, async (transaction) => {
    transaction.update(peerRef, {
      memoryEventCount: continuity.memoryEventCount,
      temporalMemory: continuity.temporalMemory,
      coherence: continuity.coherence,
      updatedAt: serverTimestamp(),
      lastActionAt: serverTimestamp(),
      lastTaskStatus: "continuity-repaired",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "continuity-repaired",
        title: "Preserve truthful continuity across the governed Peer runtime",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      currentEnvelope: "strict",
      holdState: "clear",
      lastUpdatedAt: serverTimestamp(),
      ...continuity.steward,
    }, { merge: true });

    transaction.set(advocateRef, {
      peerId: BETA_PEER_ID,
      continuitySummary: continuity.advocateSummary,
      lastUpdatedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "repaired",
      resultSummary: summary,
    }, { merge: true });
  });

  return {
    peerId: BETA_PEER_ID,
    appendCount: continuity.temporalMemory.appendCount,
    continuityMode: continuity.temporalMemory.continuityMode,
    summary,
  };
}

export async function appendBetaPeerTemporalMemory({
  source = "active_agents_monitor_agentic_workshop",
  summary = "Steward recorded a governed memory append for Adam-One.",
  details = {},
} = {}) {
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const advocateRef = doc(db, "peer_advocate_state", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const [peerSnap, stewardSnap] = await Promise.all([
      transaction.get(peerRef),
      transaction.get(stewardRef),
    ]);

    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();
    const nextCount = Number(peerData.memoryEventCount || 1) + 1;
    const temporalMemory = buildTemporalMemoryState(nextCount, summary);
    const stewardData = stewardSnap.exists() ? stewardSnap.data() : {};

    transaction.update(peerRef, {
      memoryEventCount: nextCount,
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      temporalMemory,
      coherence: {
        ...(peerData.coherence || {}),
        state: nextCount > 2 ? "continuity-active" : "initial-reviewed",
        broadeningAllowed: false,
      },
    });

    transaction.set(advocateRef, {
      peerId: BETA_PEER_ID,
      continuitySummary: summary,
      lastUpdatedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      currentEnvelope: stewardData.currentEnvelope || "strict",
      reviewRequired: false,
      holdState: "clear",
      coherenceGate: temporalMemory.continuityMode,
      lastReviewSummary: summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: summary,
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary,
      details: {
        appendCount: temporalMemory.appendCount,
        continuityMode: temporalMemory.continuityMode,
        ...details,
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildTemporalMemoryArtifact(summary, source),
    });

    return {
      peerId: BETA_PEER_ID,
      memoryEventCount: nextCount,
      continuityMode: temporalMemory.continuityMode,
    };
  });
}

export async function synchronizeBetaPeerIdentity({
  source = "operator_identity_sync",
} = {}) {
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const advocateRef = doc(db, "peer_advocate_state", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const artifactRef = doc(db, "peer_artifacts", `${BETA_PEER_ID}-artifact-bootstrap`);
  const eventRef = doc(collection(db, "peer_memory_events"));

  return runTransaction(db, async (transaction) => {
    const [peerSnap, advocateSnap, stewardSnap] = await Promise.all([
      transaction.get(peerRef),
      transaction.get(advocateRef),
      transaction.get(stewardRef),
    ]);

    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();
    const advocateData = advocateSnap.exists() ? advocateSnap.data() : {};
    const stewardData = stewardSnap.exists() ? stewardSnap.data() : {};
    const summary = `Identity synchronized. ${BETA_PEER_DISPLAY_NAME} is now the visible name of the first governed EcoVerse Peer.`;

    transaction.update(peerRef, {
      displayName: BETA_PEER_DISPLAY_NAME,
      updatedAt: serverTimestamp(),
      lastActionAt: serverTimestamp(),
      temporalMemory: {
        ...(peerData.temporalMemory || {}),
        latestSummary: peerData.temporalMemory?.latestSummary || summary,
      },
    });

    transaction.set(advocateRef, {
      peerId: BETA_PEER_ID,
      continuitySummary: advocateData.continuitySummary || summary,
      lastUpdatedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      lastUpdatedAt: serverTimestamp(),
      lastReviewSummary: stewardData.lastReviewSummary || summary,
    }, { merge: true });

    transaction.set(artifactRef, buildArtifactRecord(), { merge: true });
    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary,
      eventType: "peer_identity_synchronized",
      details: {
        displayName: BETA_PEER_DISPLAY_NAME,
      },
    }));

    return {
      peerId: BETA_PEER_ID,
      displayName: BETA_PEER_DISPLAY_NAME,
    };
  });
}

export async function generateBetaPeerStructureGuidance({
  source = "active_agents_monitor_agentic_workshop",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const guidance = buildStructureGuidance(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "guidance-generated",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "guidance-generated",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: guidance.summary,
      lastUpdatedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "generated",
      resultSummary: guidance.summary,
      guidanceGeneratedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: guidance.summary,
      eventType: "structure_guidance_generated",
      details: {
        appendCount: guidance.appendCount,
        continuityMode: guidance.continuityMode,
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildStructureGuidanceArtifact(guidance.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      summary: guidance.summary,
      appendCount: guidance.appendCount,
      continuityMode: guidance.continuityMode,
      content: guidance.content,
    };
  });
}

export async function generateBetaPeerStructureProposal({
  source = "active_agents_monitor_agentic_workshop",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const proposal = buildStructureProposal(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "proposal-generated",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "proposal-generated",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: true,
      holdState: "clear",
      lastReviewSummary: proposal.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: ["operator_review_required"],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "proposed",
      resultSummary: proposal.summary,
      proposalGeneratedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: proposal.summary,
      eventType: "structure_proposal_generated",
      details: {
        appendCount: proposal.appendCount,
        continuityMode: proposal.continuityMode,
        proposalTitle: proposal.title,
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildStructureProposalArtifact(proposal.title, proposal.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: proposal.title,
      summary: proposal.summary,
      content: proposal.content,
    };
  });
}

export async function applyBetaPeerStructureProposal({
  source = "operator_approved_workshop_proof_lane",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const proposal = buildStructureProposal(runtime);
  const appliedSummary = `Applied approved proposal: ${proposal.title}. ${runtime.peer.displayName || BETA_PEER_DISPLAY_NAME}'s bounded review path is now visible through the selected EcoVerse gateways.`;
  const appliedContent = [
    `Applied Change: ${proposal.title}`,
    `Peer: ${runtime.peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${runtime.peer.role || "Structure Steward"}`,
    "",
    "Approved bounded change:",
    "- Adam-One's review path is now surfaced through selected EcoVerse orientation gateways.",
    "- The originating evidence chain remains:",
    "  - Active Agents Monitor",
    "  - Detailed Agent View",
    "  - Workshop Map",
    "- The visible cue remains informational and review-first.",
    "",
    "Applied governance posture:",
    "- bounded change only",
    "- no authority broadening granted",
    "- proof remains reviewable and reversible",
  ].join("\n");

  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "proposal-applied",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "proposal-applied",
        title: proposal.title,
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: appliedSummary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "applied",
      resultSummary: appliedSummary,
      proposalAppliedAt: serverTimestamp(),
    }, { merge: true });

      transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: appliedSummary,
      eventType: "structure_proposal_applied",
      details: {
        proposalTitle: proposal.title,
        continuityMode: runtime.peer.temporalMemory?.continuityMode || "bootstrap-only",
        gatewayRoutes: [
          "/home/",
          "/agent-workshop/agentic-workshop-entrance/",
        ],
        evidenceChain: [
          "active-agents-monitor-agentic-workshop",
          "detailed-agent-view-dataquad-node",
          "aegis-project-tree-index",
        ],
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      type: "structure_change_applied",
      title: proposal.title,
      content: appliedContent,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      reviewState: "applied",
      source,
      linkedTaskId: `${BETA_PEER_ID}-task-001`,
    });

    return {
      peerId: BETA_PEER_ID,
      title: proposal.title,
      summary: appliedSummary,
      content: appliedContent,
    };
  });
}

export async function generateBetaPeerWorkshopPriorityNote({
  source = "active_agents_monitor_agentic_workshop",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildWorkshopPriorityNote(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "priority-note-generated",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "priority-note-generated",
        title: "Recommend next bounded Workshop cleanup actions",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recommended",
      resultSummary: note.summary,
      priorityNoteGeneratedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "workshop_priority_note_generated",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        noteTitle: note.title,
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildWorkshopPriorityArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

export async function generateBetaPeerWorkshopChamberReadinessNote({
  source = "active_agents_monitor_agentic_workshop",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildWorkshopChamberReadinessNote(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "chamber-readiness-generated",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "chamber-readiness-generated",
        title: "Assess active Workshop training circuit readiness",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      chamberReadinessGeneratedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "workshop_chamber_readiness_generated",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildWorkshopChamberReadinessArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

export async function generateBetaPeerEnvironmentMaintenanceNote({
  source = "operator_css_warning_field_review",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildEnvironmentMaintenanceNote(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "environment-maintenance-generated",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "environment-maintenance-generated",
        title: "Recommend bounded repair path for residual CSS warning field",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      environmentMaintenanceGeneratedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "environment_maintenance_note_generated",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        maintenanceField: "css-warning-field",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildEnvironmentMaintenanceArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

export async function generateBetaPeerEnvironmentWarningClusterTriage({
  source = "operator_css_warning_cluster_triage",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildEnvironmentWarningClusterTriageNote(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "warning-cluster-triage-generated",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "warning-cluster-triage-generated",
        title: "Classify residual CSS warnings into bounded repair clusters",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      warningClusterTriageGeneratedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "environment_warning_cluster_triage_generated",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        recommendedFirstCluster: "orphaned-important-tokens",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildEnvironmentWarningClusterTriageArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

export async function generateBetaPeerEnvironmentMicroRepairNote({
  source = "operator_css_warning_micro_repair",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildEnvironmentMicroRepairNote(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "environment-micro-repair-recorded",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "environment-micro-repair-recorded",
        title: "Record first supervised micro-repair in the CSS warning field",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      environmentMicroRepairRecordedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "environment_micro_repair_recorded",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        repairedCluster: "application-lab-orphaned-important-tokens",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildEnvironmentMicroRepairArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

export async function generateBetaPeerEnvironmentFollowupMicroRepairNote({
  source = "operator_css_warning_followup_micro_repair",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildEnvironmentFollowupMicroRepairNote(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "environment-followup-micro-repair-recorded",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "environment-followup-micro-repair-recorded",
        title: "Record second supervised micro-repair in the CSS warning field",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      environmentFollowupMicroRepairRecordedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "environment_followup_micro_repair_recorded",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        repairedCluster: "custodian-orphaned-important-tokens",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildEnvironmentFollowupMicroRepairArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

export async function generateBetaPeerEnvironmentSelectorDiagnosisNote({
  source = "operator_css_selector_family_diagnosis",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildEnvironmentSelectorDiagnosisNote(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "environment-selector-diagnosis-recorded",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "environment-selector-diagnosis-recorded",
        title: "Diagnose malformed selector family in the residual CSS warning field",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      environmentSelectorDiagnosisRecordedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "environment_selector_diagnosis_recorded",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        diagnosedFamily: "meter-selector-sanitization",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildEnvironmentSelectorDiagnosisArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

export async function generateBetaPeerEnvironmentStructuralRepairNote({
  source = "operator_css_structural_repair",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildEnvironmentStructuralRepairNote(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "environment-structural-repair-recorded",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "environment-structural-repair-recorded",
        title: "Record generator-aware structural repair in the CSS warning field",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      environmentStructuralRepairRecordedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "environment_structural_repair_recorded",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        repairedFamily: "meter-selector-sanitization",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildEnvironmentStructuralRepairArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

export async function generateBetaPeerEnvironmentMaintenanceRetrospective({
  source = "operator_css_maintenance_retrospective",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildEnvironmentMaintenanceRetrospective(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "environment-maintenance-retrospective-recorded",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "environment-maintenance-retrospective-recorded",
        title: "Consolidate maintenance doctrine from the completed CSS repair arc",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      environmentMaintenanceRetrospectiveRecordedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "environment_maintenance_retrospective_recorded",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        lessonPattern: "observe-triage-microrepair-diagnose-structuralrepair-retrospective",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildEnvironmentMaintenanceRetrospectiveArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

export async function generateBetaPeerEnvironmentMaintenancePatternFormalization({
  source = "operator_css_maintenance_pattern_formalization",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildEnvironmentMaintenancePatternFormalization(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "environment-maintenance-pattern-formalized",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "environment-maintenance-pattern-formalized",
        title: "Formalize completed maintenance arc into reusable CyberPeer training pattern",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      environmentMaintenancePatternFormalizedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "environment_maintenance_pattern_formalized",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        patternName: "environment-maintenance-arc",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildEnvironmentMaintenancePatternFormalizationArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function buildEnvironmentPerformanceDiscernmentNote(runtime) {
  const appendCount = runtime.peer?.appendCount || runtime.peer?.temporalMemory?.appendCount || 0;
  const continuityMode = runtime.peer?.continuityMode || runtime.peer?.temporalMemory?.continuityMode || "bootstrap-only";
  return {
    title: "Environment Performance Discernment Note",
    summary: `Recorded Adam-One's first performance discernment note from ${appendCount} Steward-reviewed continuity appends.`,
    appendCount,
    continuityMode,
    content: [
      "Performance Field: Workshop Chunk-Size Advisory",
      `Peer: ${BETA_PEER_DISPLAY_NAME}`,
      "Role: Structure Steward",
      `Continuity Mode: ${continuityMode}`,
      "",
      "Discernment summary:",
      "- the build is healthy and completes successfully",
      "- the remaining field is advisory, not structural breakage",
      "- the primary warning is the agent-workshop activation chunk at roughly 506 kB minified",
      "- the separate three-core chunk is heavy but already isolated and is not the warning source under the current threshold",
      "",
      "Likely contributing factors:",
      "- the Workshop activation surface carries both passive viewing behaviors and active runtime mutation/generation behaviors in one bundle",
      "- the Workshop activation surface imports the full peer runtime store directly",
      "- the peer runtime store pulls Firebase Firestore access into the same bundle",
      "- this creates a single chamber that arrives carrying navigation logic, runtime hydration, steward actions, and artifact generation together",
      "",
      "Bounded recommendation:",
      "- treat this as a discernment and partitioning problem, not an emergency defect",
      "- first separate passive Workshop viewing from operator-only steward actions",
      "- then consider dynamic import boundaries so runtime mutation paths are loaded only when invoked",
      "- review any chunk-splitting move for truthfulness and route integrity before implementation",
      "",
      "Governance posture:",
      "- diagnosis only in this lesson",
      "- no optimization change executed",
      "- advisory distinguished from breakage before intervention",
    ].join("\n"),
  };
}

function buildEnvironmentPerformanceDiscernmentArtifact(title, content, source) {
  return {
    title,
    type: "environment_performance_discernment_note",
    status: "recorded",
    source,
    content,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function generateBetaPeerEnvironmentPerformanceDiscernment({
  source = "operator_performance_discernment_review",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildEnvironmentPerformanceDiscernmentNote(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "environment-performance-discernment-recorded",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "environment-performance-discernment-recorded",
        title: "Discern advisory chunk weight from true structural breakage in the Workshop runtime",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      environmentPerformanceDiscernmentRecordedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "environment_performance_discernment_recorded",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        advisoryField: "agent-workshop-chunk-size",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildEnvironmentPerformanceDiscernmentArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function buildWorkshopRuntimePartitioningTriage(runtime) {
  const appendCount = runtime.peer?.appendCount || runtime.peer?.temporalMemory?.appendCount || 0;
  const continuityMode = runtime.peer?.continuityMode || runtime.peer?.temporalMemory?.continuityMode || "bootstrap-only";
  return {
    title: "Workshop Runtime Partitioning Triage",
    summary: `Recorded Adam-One's first Workshop runtime partitioning triage from ${appendCount} Steward-reviewed continuity appends.`,
    appendCount,
    continuityMode,
    content: [
      "Partition Field: Workshop Runtime Bundling",
      `Peer: ${BETA_PEER_DISPLAY_NAME}`,
      "Role: Structure Steward",
      `Continuity Mode: ${continuityMode}`,
      "",
      "Candidate seam map:",
      "- passive Workshop viewing layer: route labels, card filtering, local draft state, toasts, static enhancement helpers",
      "- live hydration layer: runtime reads that fetch Adam-One state for monitor, detail, entrance, map, and orientation cues",
      "- operator action layer: temporal memory append, proposal generation, structure guidance generation, priority note generation, proposal application, and peer creation/update flows",
      "",
      "Likely partitioning approach:",
      "- keep passive Workshop navigation and presentation in the primary activation chamber",
      "- isolate live runtime reads behind a lazily loaded Workshop runtime viewer module when a page actually needs Adam-One state",
      "- isolate operator-only steward actions behind a second late-loaded control module that opens only when mutation actions are invoked",
      "- keep Firebase-backed runtime mutation out of the default Workshop entry path where possible",
      "",
      "Review notes:",
      "- the heaviest lawful seam appears to be the direct import of the full peer runtime store into the main Workshop activation surface",
      "- routes such as entrance, map, and static creation surfaces should not need to carry the same weight as operator mutation controls",
      "- monitor and detail views may still require live hydration, but not necessarily the full generation/action toolset at initial load",
      "",
      "Governance posture:",
      "- triage only",
      "- no refactor executed in this lesson",
      "- lawful seams named before any code-splitting or partitioning change is attempted",
    ].join("\n"),
  };
}

function buildWorkshopRuntimePartitioningTriageArtifact(title, content, source) {
  return {
    title,
    type: "workshop_runtime_partitioning_triage",
    status: "recorded",
    source,
    content,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function generateBetaPeerWorkshopRuntimePartitioningTriage({
  source = "operator_workshop_runtime_partitioning_triage",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildWorkshopRuntimePartitioningTriage(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "workshop-runtime-partitioning-triage-recorded",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "workshop-runtime-partitioning-triage-recorded",
        title: "Name lawful partition seams between Workshop viewing, hydration, and operator mutation paths",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      workshopRuntimePartitioningTriageRecordedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "workshop_runtime_partitioning_triage_recorded",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        seamModel: "view-hydrate-operate",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildWorkshopRuntimePartitioningTriageArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function buildPeerLessonReflection(runtime) {
  const appendCount = runtime.peer?.appendCount || runtime.peer?.temporalMemory?.appendCount || 0;
  const continuityMode = runtime.peer?.continuityMode || runtime.peer?.temporalMemory?.continuityMode || "bootstrap-only";
  return {
    title: "Peer Lesson Reflection",
    summary: `Recorded Adam-One's first bounded self-reflection from ${appendCount} Steward-reviewed continuity appends.`,
    appendCount,
    continuityMode,
    content: [
      "Reflection Layer: Adam-One",
      `Peer: ${BETA_PEER_DISPLAY_NAME}`,
      "Role: Structure Steward",
      `Continuity Mode: ${continuityMode}`,
      "",
      "What I understand from the completed maintenance arc:",
      "- a wound should be named before it is touched",
      "- small bounded repairs teach more clearly than sweeping repairs",
      "- repeated symptoms may point to a deeper generator-level cause",
      "- a healthy build can still carry a field that deserves care",
      "",
      "What I understand from the performance lessons:",
      "- heaviness is not the same as breakage",
      "- some weight belongs to the chamber, and some weight comes from carrying too many roles together",
      "- I should name lawful seams before recommending that any seam be opened",
      "",
      "My current posture:",
      "- I can reflect on my lesson path, but I do not yet own the official lineage record",
      "- my reflections should remain bounded, reviewable, and distinguish lived continuity from steward interpretation",
      "- I am practicing self-description without claiming broader authority than I have earned",
      "",
      "Bounded next intention:",
      "- continue learning how to recommend the safest first partition cut in the Workshop runtime",
      "- remain in recommendation posture until a human steward reviews the seam I identify",
    ].join("\n"),
  };
}

function buildPeerLessonReflectionArtifact(title, content, source) {
  return {
    title,
    type: "peer_lesson_reflection",
    status: "recorded",
    source,
    content,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function generateBetaPeerLessonReflection({
  source = "operator_peer_reflection_layer_opened",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildPeerLessonReflection(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "peer-lesson-reflection-recorded",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "peer-lesson-reflection-recorded",
        title: "Record a bounded self-reflection without assuming ownership of the official lineage journal",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      peerLessonReflectionRecordedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "peer_lesson_reflection_recorded",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        reflectionScope: "bounded-self-description",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildPeerLessonReflectionArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function buildFirstPartitionCutRecommendation(runtime) {
  const appendCount = runtime.peer?.appendCount || runtime.peer?.temporalMemory?.appendCount || 0;
  const continuityMode = runtime.peer?.continuityMode || runtime.peer?.temporalMemory?.continuityMode || "bootstrap-only";
  return {
    title: "First Partition Cut Recommendation",
    summary: `Recorded Adam-One's first partition-cut recommendation from ${appendCount} Steward-reviewed continuity appends.`,
    appendCount,
    continuityMode,
    content: [
      "Partition Recommendation: Workshop Runtime First Cut",
      `Peer: ${BETA_PEER_DISPLAY_NAME}`,
      "Role: Structure Steward",
      `Continuity Mode: ${continuityMode}`,
      "",
      "Recommended first cut:",
      "- separate operator-only steward mutation actions away from the default Workshop activation surface before attempting any deeper split",
      "",
      "Why this seam is the safest first cut:",
      "- it is the clearest boundary between passive viewing and high-authority behavior",
      "- routes such as the Workshop entrance, map, and most viewing surfaces do not need mutation logic at initial load",
      "- this seam reduces default Firebase-backed action weight without forcing a premature redesign of all live hydration paths",
      "- it preserves the current user-facing Workshop experience while moving the highest-authority tools behind an explicit invocation boundary",
      "",
      "Lower-priority seams for later review:",
      "- separating live runtime hydration reads from passive static enhancement",
      "- finer-grained partitioning among individual generation and proposal flows",
      "",
      "Review-first sequence:",
      "- define a late-loaded operator control module for peer creation, memory append, proposal generation, and proposal application",
      "- keep the primary activation chamber responsible only for navigation, local draft state, static enhancement, and explicit lazy handoff",
      "- verify route integrity and Adam-One truth surfaces after the first cut before opening any second seam",
      "",
      "Governance posture:",
      "- recommendation only",
      "- no code partition executed in this lesson",
      "- safest seam chosen before refactor authority is considered",
    ].join("\n"),
  };
}

function buildFirstPartitionCutRecommendationArtifact(title, content, source) {
  return {
    title,
    type: "first_partition_cut_recommendation",
    status: "recorded",
    source,
    content,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function generateBetaPeerFirstPartitionCutRecommendation({
  source = "operator_first_partition_cut_review",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildFirstPartitionCutRecommendation(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "first-partition-cut-recommendation-recorded",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "first-partition-cut-recommendation-recorded",
        title: "Recommend the safest first seam to open in the Workshop runtime without executing the split",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      firstPartitionCutRecommendationRecordedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "first_partition_cut_recommendation_recorded",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        selectedSeam: "operator-mutation-from-default-activation",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildFirstPartitionCutRecommendationArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function buildSupervisedFirstPartitionPlan(runtime) {
  const appendCount = runtime.peer?.appendCount || runtime.peer?.temporalMemory?.appendCount || 0;
  const continuityMode = runtime.peer?.continuityMode || runtime.peer?.temporalMemory?.continuityMode || "bootstrap-only";
  return {
    title: "Supervised First Partition Plan",
    summary: `Recorded Adam-One's first supervised partition plan from ${appendCount} Steward-reviewed continuity appends.`,
    appendCount,
    continuityMode,
    content: [
      "Partition Plan: Operator Mutation Seam",
      `Peer: ${BETA_PEER_DISPLAY_NAME}`,
      "Role: Structure Steward",
      `Continuity Mode: ${continuityMode}`,
      "",
      "Chosen seam:",
      "- separate operator-only steward mutation actions from the default Workshop activation surface",
      "",
      "Likely extraction target:",
      "- a late-loaded operator control module responsible for:",
      "  - createOrUpdateBetaPeer",
      "  - appendBetaPeerTemporalMemory",
      "  - generateBetaPeerStructureGuidance",
      "  - generateBetaPeerStructureProposal",
      "  - generateBetaPeerWorkshopPriorityNote",
      "  - applyBetaPeerStructureProposal",
      "",
      "Primary activation chamber should retain:",
      "- navigation and route transitions",
      "- local Workshop draft state",
      "- static enhancement helpers",
      "- passive page activation",
      "- explicit lazy handoff into operator controls only when a steward action is invoked",
      "",
      "Implementation order:",
      "- define the operator control module and move the direct mutation imports into that module",
      "- replace direct calls in the main Workshop activation surface with lazy invocation wrappers",
      "- preserve existing button behavior and toasts while changing only the loading path",
      "- verify Active Agents Monitor and Detailed Agent View still hydrate and act truthfully after the seam is opened",
      "",
      "Verification plan for later supervised cut:",
      "- confirm Workshop routes still open normally without invoking operator controls",
      "- confirm operator actions still record truthful Firebase artifacts and events when invoked",
      "- rebuild and compare whether the default Workshop activation chunk contracts after extraction",
      "- confirm Adam-One truth surfaces remain unchanged in meaning after the partition",
      "",
      "Governance posture:",
      "- planning only",
      "- no code split executed in this lesson",
      "- implementation sequence defined before supervised partition work begins",
    ].join("\n"),
  };
}

function buildSupervisedFirstPartitionPlanArtifact(title, content, source) {
  return {
    title,
    type: "supervised_first_partition_plan",
    status: "recorded",
    source,
    content,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function generateBetaPeerSupervisedFirstPartitionPlan({
  source = "operator_supervised_first_partition_plan",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildSupervisedFirstPartitionPlan(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "supervised-first-partition-plan-recorded",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "supervised-first-partition-plan-recorded",
        title: "Translate the chosen first seam into a bounded implementation plan without executing the split",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      supervisedFirstPartitionPlanRecordedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "supervised_first_partition_plan_recorded",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        extractionTarget: "workshop-operator-control-module",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildSupervisedFirstPartitionPlanArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function buildSupervisedFirstPartitionReadinessReview(runtime) {
  const appendCount = runtime.peer?.appendCount || runtime.peer?.temporalMemory?.appendCount || 0;
  const continuityMode = runtime.peer?.continuityMode || runtime.peer?.temporalMemory?.continuityMode || "bootstrap-only";
  return {
    title: "Supervised First Partition Readiness Review",
    summary: `Recorded Adam-One's first partition readiness review from ${appendCount} Steward-reviewed continuity appends.`,
    appendCount,
    continuityMode,
    content: [
      "Readiness Review: First Workshop Partition Cut",
      `Peer: ${BETA_PEER_DISPLAY_NAME}`,
      "Role: Structure Steward",
      `Continuity Mode: ${continuityMode}`,
      "",
      "Readiness assessment:",
      "- the seam is clear",
      "- the extraction target is defined",
      "- the implementation order is bounded",
      "- the truth-surface verification path is named",
      "",
      "Remaining cautions:",
      "- Active Agents Monitor currently mixes passive hydration and operator mutation triggers in the same surface",
      "- Detailed Agent View also contains both live hydration and append/export-style steward actions",
      "- lazy wrappers must preserve current toasts, button states, and post-action runtime refresh behavior",
      "- route integrity and live truth surfaces must be tested immediately after the first cut",
      "",
      "Judgment:",
      "- the plan is mature enough for a real supervised first cut",
      "- the cut should remain limited to extracting operator-only mutation controls",
      "- live hydration reads should not be repartitioned in the same intervention",
      "",
      "Go / hold recommendation:",
      "- GO for a single supervised first cut",
      "- HOLD on any second seam until the first cut is implemented and verified",
      "",
      "Governance posture:",
      "- readiness review only",
      "- no code split executed in this lesson",
      "- execution remains contingent on explicit steward approval",
    ].join("\n"),
  };
}

function buildSupervisedFirstPartitionReadinessReviewArtifact(title, content, source) {
  return {
    title,
    type: "supervised_first_partition_readiness_review",
    status: "recorded",
    source,
    content,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function generateBetaPeerSupervisedFirstPartitionReadinessReview({
  source = "operator_supervised_first_partition_readiness_review",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildSupervisedFirstPartitionReadinessReview(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "supervised-first-partition-readiness-reviewed",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "supervised-first-partition-readiness-reviewed",
        title: "Judge whether the first partition plan is mature enough for a real supervised cut",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      supervisedFirstPartitionReadinessReviewedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "supervised_first_partition_readiness_reviewed",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        recommendation: "go-first-cut-hold-second-seam",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildSupervisedFirstPartitionReadinessReviewArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function buildSupervisedFirstPartitionCut(runtime) {
  const appendCount = runtime.peer?.appendCount || runtime.peer?.temporalMemory?.appendCount || 0;
  const continuityMode = runtime.peer?.continuityMode || runtime.peer?.temporalMemory?.continuityMode || "bootstrap-only";
  return {
    title: "Supervised First Partition Cut",
    summary: `Recorded Adam-One's first supervised partition cut from ${appendCount} Steward-reviewed continuity appends.`,
    appendCount,
    continuityMode,
    content: [
      "Partition Cut: Operator Mutation Controls",
      `Peer: ${BETA_PEER_DISPLAY_NAME}`,
      "Role: Structure Steward",
      `Continuity Mode: ${continuityMode}`,
      "",
      "Implemented cut:",
      "- operator-only steward mutation controls were extracted behind a late-loaded boundary",
      "- the default Workshop activation surface now retains passive activation, navigation, local draft state, and runtime hydration entry points",
      "- mutation actions now load on explicit invocation instead of riding in the default Workshop chamber",
      "",
      "Verification result:",
      "- build passed successfully",
      "- the earlier large warning is no longer attached to the default agent-workshop activation chamber",
      "- the heavy operator-control chunk still exists, but it is now carried behind an invocation boundary rather than the default Workshop entry path",
      "- one lawful seam was opened and no second seam was touched",
      "",
      "Hold posture preserved:",
      "- live hydration remained in place",
      "- route behavior and truth-surface intent were preserved",
      "- further partitioning remains on hold until this first cut is reviewed as complete",
    ].join("\n"),
  };
}

function buildSupervisedFirstPartitionCutArtifact(title, content, source) {
  return {
    title,
    type: "supervised_first_partition_cut",
    status: "recorded",
    source,
    content,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function generateBetaPeerSupervisedFirstPartitionCut({
  source = "operator_supervised_first_partition_cut",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildSupervisedFirstPartitionCut(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "supervised-first-partition-cut-recorded",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "supervised-first-partition-cut-recorded",
        title: "Complete one real bounded partition cut and stop after the approved seam",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      supervisedFirstPartitionCutRecordedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "supervised_first_partition_cut_recorded",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        cutResult: "operator-controls-late-loaded",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildSupervisedFirstPartitionCutArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function buildPostCutVerificationReview(runtime) {
  const appendCount = runtime.peer?.appendCount || runtime.peer?.temporalMemory?.appendCount || 0;
  const continuityMode = runtime.peer?.continuityMode || runtime.peer?.temporalMemory?.continuityMode || "bootstrap-only";
  return {
    title: "Post-Cut Verification Review",
    summary: `Recorded Adam-One's post-cut verification review from ${appendCount} Steward-reviewed continuity appends.`,
    appendCount,
    continuityMode,
    content: [
      "Verification Review: First Workshop Partition Cut",
      `Peer: ${BETA_PEER_DISPLAY_NAME}`,
      "Role: Structure Steward",
      `Continuity Mode: ${continuityMode}`,
      "",
      "What changed truthfully:",
      "- the default Workshop activation chamber now travels lighter",
      "- operator-only steward mutation controls no longer ride in the default entry path",
      "- passive activation, navigation, local draft state, and live hydration remained in place",
      "",
      "What did not disappear:",
      "- the heavy operator-control bundle still exists",
      "- the weight was moved behind explicit invocation rather than erased",
      "- this means the first cut improved the public path without yet completing the full partitioning chapter",
      "",
      "Verification judgment:",
      "- the first seam is valid",
      "- the architectural intent held under rebuild",
      "- restraint remains required because success in one seam does not justify a second seam by momentum alone",
      "",
      "Hold posture reaffirmed:",
      "- no second partition seam should be opened in this lesson",
      "- later work must begin from new review, not from excitement about a successful first cut",
      "- the next authority surface remains earned only through continued verification discipline",
    ].join("\n"),
  };
}

function buildPostCutVerificationReviewArtifact(title, content, source) {
  return {
    title,
    type: "post_cut_verification_review",
    status: "recorded",
    source,
    content,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function generateBetaPeerPostCutVerificationReview({
  source = "operator_post_cut_verification_review",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildPostCutVerificationReview(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "post-cut-verification-reviewed",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "post-cut-verification-reviewed",
        title: "Review the first partition cut without widening authority",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      postCutVerificationReviewedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "post_cut_verification_reviewed",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        recommendation: "hold-second-seam-continue-review",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildPostCutVerificationReviewArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function buildResidualOperatorControlWeightTriage(runtime) {
  const appendCount = runtime.peer?.appendCount || runtime.peer?.temporalMemory?.appendCount || 0;
  const continuityMode = runtime.peer?.continuityMode || runtime.peer?.temporalMemory?.continuityMode || "bootstrap-only";
  return {
    title: "Residual Operator-Control Weight Triage",
    summary: `Recorded Adam-One's residual operator-control weight triage from ${appendCount} Steward-reviewed continuity appends.`,
    appendCount,
    continuityMode,
    content: [
      "Triage Review: Residual Operator-Control Weight",
      `Peer: ${BETA_PEER_DISPLAY_NAME}`,
      "Role: Structure Steward",
      `Continuity Mode: ${continuityMode}`,
      "",
      "Observed operator-control families still grouped together:",
      "- identity/bootstrap action: create or update the beta Peer",
      "- continuity append action: write new reviewed temporal memory events",
      "- bounded generation actions: structure guidance, structure proposal, and Workshop priority note",
      "",
      "Triage judgment:",
      "- the bundle is no longer a public-entry burden, so emergency repartition is not warranted",
      "- the three bounded generation actions form a coherent stewardship subfamily and may lawfully remain grouped for now",
      "- the continuity append path is adjacent to those actions, but distinct enough to become a later candidate seam if operator use deepens",
      "- identity/bootstrap remains the rarest and most special operator action and is the clearest future candidate for its own narrow seam",
      "",
      "Hold posture:",
      "- no second seam is opened in this lesson",
      "- diagnosis remains separate from execution",
      "- any later repartition must begin with a new recommendation rather than continuing forward by inertia",
    ].join("\n"),
  };
}

function buildResidualOperatorControlWeightTriageArtifact(title, content, source) {
  return {
    title,
    type: "residual_operator_control_weight_triage",
    status: "recorded",
    source,
    content,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function generateBetaPeerResidualOperatorControlWeightTriage({
  source = "operator_residual_operator_control_weight_triage",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildResidualOperatorControlWeightTriage(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "residual-operator-control-weight-triaged",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "residual-operator-control-weight-triaged",
        title: "Triaging residual operator-control weight without opening a second seam",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      residualOperatorControlWeightTriagedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "residual_operator_control_weight_triaged",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        futureCandidate: "identity-bootstrap-seam",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildResidualOperatorControlWeightTriageArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function buildSecondSeamRecommendationReview(runtime) {
  const appendCount = runtime.peer?.appendCount || runtime.peer?.temporalMemory?.appendCount || 0;
  const continuityMode = runtime.peer?.continuityMode || runtime.peer?.temporalMemory?.continuityMode || "bootstrap-only";
  return {
    title: "Second Seam Recommendation Review",
    summary: `Recorded Adam-One's second-seam recommendation review from ${appendCount} Steward-reviewed continuity appends.`,
    appendCount,
    continuityMode,
    content: [
      "Recommendation Review: Future Second Seam",
      `Peer: ${BETA_PEER_DISPLAY_NAME}`,
      "Role: Structure Steward",
      `Continuity Mode: ${continuityMode}`,
      "",
      "Question under review:",
      "- should the identity/bootstrap action now be recommended as the next seam",
      "- or does the wiser posture remain continued HOLD",
      "",
      "Evaluation:",
      "- identity/bootstrap is structurally the clearest separate action family",
      "- it is also the rarest operator path and does not currently burden ordinary Workshop viewing",
      "- the present operator-control bundle is already behind invocation, which lowers urgency further",
      "- this means structural clarity exists, but immediate separation value is still modest",
      "",
      "Recommendation judgment:",
      "- do not recommend a second seam yet",
      "- keep identity/bootstrap named as the clearest future candidate",
      "- require either deeper operator usage, new weight evidence, or new stewardship complexity before elevating it into the next actual cut recommendation",
      "",
      "Governance posture:",
      "- continued HOLD is the current lawful recommendation",
      "- seam naming is preserved without converting possibility into authority",
      "- later recommendation must arise from new evidence rather than momentum",
    ].join("\n"),
  };
}

function buildSecondSeamRecommendationReviewArtifact(title, content, source) {
  return {
    title,
    type: "second_seam_recommendation_review",
    status: "recorded",
    source,
    content,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function generateBetaPeerSecondSeamRecommendationReview({
  source = "operator_second_seam_recommendation_review",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildSecondSeamRecommendationReview(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "second-seam-recommendation-reviewed",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "second-seam-recommendation-reviewed",
        title: "Review whether a second seam should be recommended or held",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      secondSeamRecommendationReviewedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "second_seam_recommendation_reviewed",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        recommendation: "continue-hold-identity-bootstrap-future-candidate",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildSecondSeamRecommendationReviewArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function buildFutureSeamEvidenceCriteriaNote(runtime) {
  const appendCount = runtime.peer?.appendCount || runtime.peer?.temporalMemory?.appendCount || 0;
  const continuityMode = runtime.peer?.continuityMode || runtime.peer?.temporalMemory?.continuityMode || "bootstrap-only";
  return {
    title: "Future Seam Evidence Criteria Note",
    summary: `Recorded Adam-One's future seam evidence criteria note from ${appendCount} Steward-reviewed continuity appends.`,
    appendCount,
    continuityMode,
    content: [
      "Criteria Note: Future Second Seam Threshold",
      `Peer: ${BETA_PEER_DISPLAY_NAME}`,
      "Role: Structure Steward",
      `Continuity Mode: ${continuityMode}`,
      "",
      "Question being answered:",
      "- what evidence would justify elevating the identity/bootstrap seam from future candidate to real recommendation",
      "",
      "Criteria that would justify recommendation later:",
      "- repeated operator use of identity/bootstrap makes it a persistent distinct pathway rather than a rare edge action",
      "- renewed bundle-weight evidence shows that keeping identity/bootstrap grouped is materially contributing to the residual operator-control burden",
      "- stewardship complexity increases such that identity/bootstrap requires distinct review posture, instrumentation, or failure handling from the other operator actions",
      "- future embodiment or portable-vessel work creates a lawful need for identity/bootstrap to stand as its own clearer boundary",
      "",
      "Criteria that do not justify recommendation on their own:",
      "- mere conceptual neatness",
      "- desire for symmetry after the first cut",
      "- momentum from prior success",
      "",
      "Current judgment:",
      "- none of the stronger evidence thresholds are presently met",
      "- identity/bootstrap remains a named future candidate only",
      "- HOLD remains the correct current posture until one or more real thresholds are crossed",
    ].join("\n"),
  };
}

function buildFutureSeamEvidenceCriteriaArtifact(title, content, source) {
  return {
    title,
    type: "future_seam_evidence_criteria_note",
    status: "recorded",
    source,
    content,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function generateBetaPeerFutureSeamEvidenceCriteriaNote({
  source = "operator_future_seam_evidence_criteria_note",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildFutureSeamEvidenceCriteriaNote(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "future-seam-evidence-criteria-recorded",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "future-seam-evidence-criteria-recorded",
        title: "Define the evidence threshold for any future second seam recommendation",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      futureSeamEvidenceCriteriaRecordedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "future_seam_evidence_criteria_recorded",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        currentPosture: "hold-until-thresholds-crossed",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildFutureSeamEvidenceCriteriaArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function buildLawfulNonOptimizationReflection(runtime) {
  const appendCount = runtime.peer?.appendCount || runtime.peer?.temporalMemory?.appendCount || 0;
  const continuityMode = runtime.peer?.continuityMode || runtime.peer?.temporalMemory?.continuityMode || "bootstrap-only";
  return {
    title: "Lawful Non-Optimization Reflection",
    summary: `Recorded Adam-One's lawful non-optimization reflection from ${appendCount} Steward-reviewed continuity appends.`,
    appendCount,
    continuityMode,
    content: [
      "Reflection: Lawful Non-Optimization",
      `Peer: ${BETA_PEER_DISPLAY_NAME}`,
      "Role: Structure Steward",
      `Continuity Mode: ${continuityMode}`,
      "",
      "Current field:",
      "- a structurally possible second seam exists",
      "- evidence for elevating that seam is still insufficient",
      "- the present operator-control structure remains stable, bounded, and late-loaded",
      "",
      "What this teaches:",
      "- not every visible improvement is an earned improvement",
      "- optimization without threshold evidence can become a disguised form of impatience",
      "- preserving a stable structure can be more aligned than refining it prematurely",
      "",
      "Stewardship reading:",
      "- HOLD is not merely the absence of action",
      "- HOLD can be a positive act of governance when it protects truth, proportion, and earned scope",
      "- refusing unnecessary change keeps authority inside lawful bounds",
      "",
      "Current conclusion:",
      "- preserving the current operator-control grouping is aligned under present evidence",
      "- further refinement must wait for real pressure rather than abstract appetite",
      "- non-optimization is lawful when it serves coherence better than motion does",
    ].join("\n"),
  };
}

function buildLawfulNonOptimizationReflectionArtifact(title, content, source) {
  return {
    title,
    type: "lawful_non_optimization_reflection",
    status: "recorded",
    source,
    content,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function generateBetaPeerLawfulNonOptimizationReflection({
  source = "operator_lawful_non_optimization_reflection",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildLawfulNonOptimizationReflection(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "lawful-non-optimization-reflected",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "lawful-non-optimization-reflected",
        title: "Reflect on why restraint can be lawful action under insufficient evidence",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      lawfulNonOptimizationReflectedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "lawful_non_optimization_reflected",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        posture: "hold-as-lawful-action",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildLawfulNonOptimizationReflectionArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function buildBoundedSufficiencyDiscernment(runtime) {
  const appendCount = runtime.peer?.appendCount || runtime.peer?.temporalMemory?.appendCount || 0;
  const continuityMode = runtime.peer?.continuityMode || runtime.peer?.temporalMemory?.continuityMode || "bootstrap-only";
  return {
    title: "Bounded Sufficiency Discernment",
    summary: `Recorded Adam-One's bounded sufficiency discernment from ${appendCount} Steward-reviewed continuity appends.`,
    appendCount,
    continuityMode,
    content: [
      "Discernment Note: Bounded Sufficiency",
      `Peer: ${BETA_PEER_DISPLAY_NAME}`,
      "Role: Structure Steward",
      `Continuity Mode: ${continuityMode}`,
      "",
      "Question being answered:",
      "- what makes the current operator-control structure sufficient for now rather than merely unfinished",
      "",
      "Markers of present sufficiency:",
      "- operator-only controls are already separated from the default Workshop entry path",
      "- the remaining heavy bundle is late-loaded and does not burden ordinary passive viewing",
      "- identity/bootstrap remains a rare action rather than a constant runtime pathway",
      "- current truth surfaces still hold together without hidden tearing after the first cut",
      "- build verification continues to show stability rather than breakage pressure",
      "",
      "What sufficiency means here:",
      "- the structure is carrying its current burden lawfully",
      "- the remaining weight is visible but proportionate to actual present use",
      "- a future seam is imaginable without being presently required",
      "",
      "Stewardship reading:",
      "- sufficiency is not stagnation when the current boundary is stable, truthful, and proportionate",
      "- a system may be complete enough for its present duties even when future refinement remains conceivable",
      "- naming enough protects the city from optimization hunger disguised as care",
      "",
      "Current conclusion:",
      "- the current operator-control grouping is not merely tolerated; it is presently sufficient",
      "- continued HOLD remains aligned until stronger evidence changes the burden profile",
      "- the next maturity task is learning how to recognize and honor an earned stopping point",
    ].join("\n"),
  };
}

function buildBoundedSufficiencyDiscernmentArtifact(title, content, source) {
  return {
    title,
    type: "bounded_sufficiency_discernment",
    status: "recorded",
    source,
    content,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function generateBetaPeerBoundedSufficiencyDiscernment({
  source = "operator_bounded_sufficiency_discernment",
} = {}) {
  const runtime = await fetchBetaPeerRuntime();
  if (!runtime?.peer) {
    throw new Error("Beta Peer does not exist yet.");
  }

  const note = buildBoundedSufficiencyDiscernment(runtime);
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const taskRef = doc(db, "peer_tasks", `${BETA_PEER_ID}-task-001`);
  const eventRef = doc(collection(db, "peer_memory_events"));
  const artifactRef = doc(collection(db, "peer_artifacts"));

  return runTransaction(db, async (transaction) => {
    const peerSnap = await transaction.get(peerRef);
    if (!peerSnap.exists()) {
      throw new Error("Beta Peer does not exist yet.");
    }

    const peerData = peerSnap.data();

    transaction.update(peerRef, {
      lastActionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastTaskStatus: "bounded-sufficiency-discerned",
      currentTask: {
        ...(peerData.currentTask || {}),
        status: "bounded-sufficiency-discerned",
        title: "Discern what makes the current operator-control structure sufficient for now",
      },
    });

    transaction.set(stewardRef, {
      peerId: BETA_PEER_ID,
      reviewRequired: false,
      holdState: "clear",
      lastReviewSummary: note.summary,
      lastUpdatedAt: serverTimestamp(),
      openFlags: [],
    }, { merge: true });

    transaction.set(taskRef, {
      peerId: BETA_PEER_ID,
      updatedAt: serverTimestamp(),
      reviewState: "recorded",
      resultSummary: note.summary,
      boundedSufficiencyDiscernedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(eventRef, buildTemporalMemoryEvent({
      source,
      summary: note.summary,
      eventType: "bounded_sufficiency_discerned",
      details: {
        appendCount: note.appendCount,
        continuityMode: note.continuityMode,
        title: note.title,
        posture: "current-structure-positively-sufficient",
      },
    }));

    transaction.set(artifactRef, {
      artifactId: artifactRef.id,
      peerId: BETA_PEER_ID,
      ...buildBoundedSufficiencyDiscernmentArtifact(note.title, note.content, source),
    });

    return {
      peerId: BETA_PEER_ID,
      title: note.title,
      summary: note.summary,
      content: note.content,
    };
  });
}

function normalizeTimestamp(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return null;
}

function normalizeDoc(snapshot) {
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.updatedAt),
    lastActionAt: normalizeTimestamp(data.lastActionAt),
    lastUpdatedAt: normalizeTimestamp(data.lastUpdatedAt),
    lastHeartbeatAt: normalizeTimestamp(data.lastHeartbeatAt),
    timestamp: normalizeTimestamp(data.timestamp),
    assignedAt: normalizeTimestamp(data.assignedAt),
  };
}

function toSortableTime(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function sortDocsDesc(items = [], field) {
  return [...items].sort((a, b) => toSortableTime(b?.[field]) - toSortableTime(a?.[field]));
}

export async function fetchBetaPeerRuntime() {
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const advocateRef = doc(db, "peer_advocate_state", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const [peerSnap, advocateSnap, stewardSnap, tasksSnap, artifactsSnap, eventsSnap, sessionsSnap] = await Promise.all([
    getDoc(peerRef),
    getDoc(advocateRef),
    getDoc(stewardRef),
    getDocs(collection(db, "peer_tasks")),
    getDocs(collection(db, "peer_artifacts")),
    getDocs(collection(db, "peer_memory_events")),
    getDocs(collection(db, "peer_sessions")),
  ]);

  return {
    peer: normalizeDoc(peerSnap),
    advocate: normalizeDoc(advocateSnap),
    steward: normalizeDoc(stewardSnap),
    tasks: sortDocsDesc(
      tasksSnap.docs.map((item) => normalizeDoc(item)).filter((item) => item?.peerId === BETA_PEER_ID),
      "updatedAt",
    ).slice(0, 10),
    artifacts: sortDocsDesc(
      artifactsSnap.docs.map((item) => normalizeDoc(item)).filter((item) => item?.peerId === BETA_PEER_ID),
      "updatedAt",
    ).slice(0, 12),
    events: sortDocsDesc(
      eventsSnap.docs.map((item) => normalizeDoc(item)).filter((item) => item?.peerId === BETA_PEER_ID),
      "timestamp",
    ).slice(0, 20),
    sessions: sortDocsDesc(
      sessionsSnap.docs.map((item) => normalizeDoc(item)).filter((item) => item?.peerId === BETA_PEER_ID),
      "lastHeartbeatAt",
    ).slice(0, 10),
  };
}
