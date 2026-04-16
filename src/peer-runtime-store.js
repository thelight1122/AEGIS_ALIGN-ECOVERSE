import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
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

  const title = "Promote Workshop Proof Lane";
  const summary = `Proposed a bounded EcoVerse structure change from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`;
  const content = [
    `Proposal: ${title}`,
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Continuity Mode: ${continuityMode}`,
    `Persisted Event Count: ${eventCount}`,
    "",
    "Requested bounded change:",
    "- Treat the Workshop proof lane as a first-class EcoVerse review path.",
    "- Keep these surfaces grouped and visible as the live Peer evidence chain:",
    "  - Active Agents Monitor",
    "  - Detailed Agent View",
    "  - Workshop Map",
    "- Use this lane for reviewable Peer contributions before broader autonomy is considered.",
    "",
    "Reasoning:",
    "- The Peer now has a canon-locked bootstrap, persisted continuity, Steward-reviewed memory appends, and a bounded structure guidance output.",
    "- Elevating this lane makes the proof visible without granting unreviewed authority.",
    "- This keeps the system aligned with truth-first governance and review-before-broadening.",
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
    "- Rewrite anomaly-analysis-detail into a truth-first anomaly review surface with explicit local/runtime limits.",
    "- Rewrite global-anomaly-heatmap to show only live browser/runtime truth until backend topology feeds exist.",
    "- Convert bulk-export-progress-modal from a standalone page into an embedded workflow surface.",
    "- Both sssp-respawn-archive surfaces now share the same live Peer ledger state — archive-2 hydrates the same runtime data and routes review actions to the primary surface.",
    "",
    "Reasoning:",
    "- These pages still carry the highest remaining risk of stitched mock telemetry or modal-artifact drift.",
    "- Cleaning them next improves Workshop coherence without broadening agent authority.",
    "- The changes are reviewable, reversible, and structurally aligned with the current strict envelope.",
    "",
    "Governance posture:",
    "- recommendation only",
    "- no autonomous rewrite executed",
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
      transaction.update(peerRef, peerRecord);
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
  const appliedSummary = `Applied approved proposal: ${proposal.title}. The Workshop proof lane is now a first-class EcoVerse review path for ${runtime.peer.displayName || BETA_PEER_DISPLAY_NAME}.`;
  const appliedContent = [
    `Applied Change: ${proposal.title}`,
    `Peer: ${runtime.peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${runtime.peer.role || "Structure Steward"}`,
    "",
    "Approved proof lane grouping:",
    "- Active Agents Monitor",
    "- Detailed Agent View",
    "- Workshop Map",
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
        title: "Maintain Workshop proof lane as a reviewable Peer evidence chain",
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
        lanePages: [
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
      title: "Workshop Proof Lane Activated",
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

export async function fetchBetaPeerRuntime() {
  const db = getAegisFirestore();
  const peerRef = doc(db, "peers", BETA_PEER_ID);
  const advocateRef = doc(db, "peer_advocate_state", BETA_PEER_ID);
  const stewardRef = doc(db, "peer_steward_state", BETA_PEER_ID);
  const tasksQuery = query(
    collection(db, "peer_tasks"),
    orderBy("updatedAt", "desc"),
    limit(3),
  );
  const artifactsQuery = query(
    collection(db, "peer_artifacts"),
    orderBy("updatedAt", "desc"),
    limit(5),
  );
  const eventsQuery = query(
    collection(db, "peer_memory_events"),
    orderBy("timestamp", "desc"),
    limit(5),
  );
  const sessionsQuery = query(
    collection(db, "peer_sessions"),
    orderBy("lastHeartbeatAt", "desc"),
    limit(3),
  );

  const [peerSnap, advocateSnap, stewardSnap, tasksSnap, artifactsSnap, eventsSnap, sessionsSnap] = await Promise.all([
    getDoc(peerRef),
    getDoc(advocateRef),
    getDoc(stewardRef),
    getDocs(tasksQuery),
    getDocs(artifactsQuery),
    getDocs(eventsQuery),
    getDocs(sessionsQuery),
  ]);

  return {
    peer: normalizeDoc(peerSnap),
    advocate: normalizeDoc(advocateSnap),
    steward: normalizeDoc(stewardSnap),
    tasks: tasksSnap.docs
      .map((item) => normalizeDoc(item))
      .filter((item) => item?.peerId === BETA_PEER_ID),
    artifacts: artifactsSnap.docs
      .map((item) => normalizeDoc(item))
      .filter((item) => item?.peerId === BETA_PEER_ID),
    events: eventsSnap.docs
      .map((item) => normalizeDoc(item))
      .filter((item) => item?.peerId === BETA_PEER_ID),
    sessions: sessionsSnap.docs
      .map((item) => normalizeDoc(item))
      .filter((item) => item?.peerId === BETA_PEER_ID),
  };
}
