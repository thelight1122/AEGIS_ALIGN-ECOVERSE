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

  const title = "Surface Adam-One Review Path in EcoVerse Orientation";
  const summary = `Proposed a bounded EcoVerse structure change from ${appendCount} Steward-reviewed continuity append${appendCount === 1 ? "" : "s"}.`;
  const content = [
    `Proposal: ${title}`,
    `Peer: ${peer.displayName || BETA_PEER_DISPLAY_NAME}`,
    `Role: ${peer.role || "Structure Steward"}`,
    `Continuity Mode: ${continuityMode}`,
    `Persisted Event Count: ${eventCount}`,
    "",
    "Requested bounded change:",
    "- Establish a lightweight EcoVerse orientation cue that introduces Adam-One's bounded contribution path as reviewable evidence.",
    "- Place the cue in one or two existing orientation surfaces above the visual billboard layer rather than creating a new autonomous dashboard.",
    "- Preferred review surfaces for this cue:",
    "  - /home/",
    "  - /agent-workshop/agentic-workshop-entrance/",
    "- Keep these Workshop surfaces explicitly grouped as the originating evidence chain:",
    "  - Active Agents Monitor",
    "  - Detailed Agent View",
    "  - Workshop Map",
    "- Present only bounded truth in the cue:",
    "  - display name: Adam-One",
    "  - role: Structure Steward",
    "  - continuity mode",
    "  - latest bounded artifact title",
    "  - human-review-required posture",
    "",
    "Reasoning:",
    "- The Workshop proof lane is now clean, truthful, and already functioning as Adam-One's evidence chain.",
    "- The next meaningful proof step is not another internal cleanup page but a bounded outward-facing cue that shows how governed Peer contributions enter EcoVerse review.",
    `- Latest bounded artifact available for review seed: ${latestArtifact?.title || "Workshop Runtime Priority Note"}.`,
    "- Using existing orientation surfaces keeps the proof legible without broadening authority or inventing a new control surface.",
    "- This keeps the review-before-broadening rule intact while making Adam-One's contribution path visible to the broader EcoVerse.",
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
    "- Review and integrate the incoming Antigravity replacements for the Workshop monitoring pages so the visual layer matches the truth-first runtime now in place.",
    "- Keep the global-anomaly-heatmap aligned with the same bounded Workshop truth until a real backend telemetry source exists.",
    "- Preserve the completed proof lane and governed archive lane as the visible evidence chain for Adam-One's bounded contribution history.",
    "- Prepare the next bounded EcoVerse-facing structure proposal from the cleaned Workshop state instead of extending more stitched mock telemetry pages.",
    "",
    "Reasoning:",
    "- The highest-value Workshop cleanup slice has now been completed in-code, so the next leverage comes from aligning replacement visuals and extending bounded contribution rather than repeating finished rewrites.",
    "- This keeps Adam-One focused on reviewable structure work without broadening authority or fabricating new runtime claims.",
    "- The next meaningful proof step is an outward-facing, governed EcoVerse contribution built from the now-clean Workshop foundation.",
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
