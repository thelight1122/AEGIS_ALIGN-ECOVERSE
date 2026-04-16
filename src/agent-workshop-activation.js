import { CORE_ENGINE, getCoreAgentManifest } from "./agent-core-engine.js";
import {
  applyBetaPeerStructureProposal,
  appendBetaPeerTemporalMemory,
  BETA_PEER_DISPLAY_NAME,
  createOrUpdateBetaPeer,
  fetchBetaPeerRuntime,
  generateBetaPeerStructureGuidance,
  generateBetaPeerStructureProposal,
  generateBetaPeerWorkshopPriorityNote,
} from "./peer-runtime-store.js";

const STORAGE_KEY = "aegis.agentWorkshop.state";

const DEFAULT_STATE = {
  lastLaunchRoute: "",
  launches: [],
  draftAgent: {
    coreEngineVersion: CORE_ENGINE.displayVersion,
    manifest: getCoreAgentManifest(),
  },
};

function mergeState(base, stored) {
  return {
    ...base,
    ...stored,
    launches: Array.isArray(stored?.launches) ? stored.launches : base.launches,
    draftAgent: {
      ...base.draftAgent,
      ...(stored?.draftAgent || {}),
    },
  };
}

function readState() {
  try {
    return mergeState(DEFAULT_STATE, JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}"));
  } catch {
    return mergeState(DEFAULT_STATE, {});
  }
}

function writeState(next) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function patchState(patch) {
  const current = readState();
  const next = mergeState(current, patch);
  writeState(next);
  return next;
}

function ensureDraftAgentState() {
  const state = readState();
  const next = {
    ...state,
    draftAgent: {
      ...(state.draftAgent || {}),
      coreEngineVersion: CORE_ENGINE.displayVersion,
      manifest: getCoreAgentManifest(),
    },
  };
  writeState(next);
  return next;
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function navigateTo(path) {
  const current = ensureDraftAgentState();
  const next = patchState({
    lastLaunchRoute: path,
    launches: [
      { path, at: new Date().toISOString() },
      ...current.launches,
    ].slice(0, 8),
  });
  if (typeof window.aegisTransit === "function") {
    window.aegisTransit(path);
    return next;
  }
  if (typeof window.top?.aegisTransit === "function") {
    window.top.aegisTransit(path);
    return next;
  }
  window.location.href = path;
  return next;
}

function inferSlug(frame) {
  try {
    const parts = new URL(frame.src, window.location.origin).pathname.split("/").filter(Boolean);
    return parts.at(-1) || "";
  } catch {
    return "";
  }
}

function injectStyles(doc) {
  if (doc.getElementById("aegis-workshop-activation-styles")) return;
  const style = doc.createElement("style");
  style.id = "aegis-workshop-activation-styles";
  style.textContent = `
    .aegis-workshop-toast {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 9999;
      max-width: 320px;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(17, 82, 212, 0.28);
      background: rgba(8, 17, 31, 0.92);
      color: #e6eefc;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      font-size: 12px;
      line-height: 1.45;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 180ms ease, transform 180ms ease;
      pointer-events: none;
    }
    .aegis-workshop-toast.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
    .aegis-workshop-hidden {
      display: none !important;
    }
    .aegis-workshop-core-banner {
      margin: 0 0 20px 0;
      padding: 14px 16px;
      border-radius: 18px;
      border: 1px solid rgba(91, 162, 255, 0.24);
      background: linear-gradient(135deg, rgba(17, 82, 212, 0.16), rgba(8, 17, 31, 0.92));
      color: #e6eefc;
      box-shadow: 0 18px 36px rgba(0, 0, 0, 0.22);
    }
    .aegis-workshop-core-banner strong {
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #9fc5ff;
    }
    .aegis-workshop-core-banner span {
      display: block;
      font-size: 12px;
      line-height: 1.5;
      color: rgba(230, 238, 252, 0.84);
    }
  `;
  doc.head.appendChild(style);
}

function showToast(doc, message) {
  injectStyles(doc);
  let node = doc.querySelector(".aegis-workshop-toast");
  if (!node) {
    node = doc.createElement("div");
    node.className = "aegis-workshop-toast";
    doc.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add("is-visible");
  window.clearTimeout(node._toastTimer);
  node._toastTimer = window.setTimeout(() => node.classList.remove("is-visible"), 2200);
}

function bindManagedClick(node, handler) {
  if (!node || node.dataset.aegisManaged === "true") return;
  node.dataset.aegisManaged = "true";
  node.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    handler(event);
  }, true);
}

function routeLabel(path) {
  const slug = String(path || "").split("/").filter(Boolean).at(-1) || "main-console";
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

async function hydrateLivePeerRuntime(doc, applyRuntime) {
  try {
    const runtime = await fetchBetaPeerRuntime();
    if (runtime?.peer) {
      applyRuntime(runtime);
    }
  } catch (error) {
    showToast(doc, "Live Peer runtime is not available yet. Workshop remains in truthful draft mode.");
    console.warn("[agent-workshop] runtime hydration failed", error);
  }
}

function prependCoreBanner(doc, anchor, detail) {
  if (!anchor || doc.querySelector(".aegis-workshop-core-banner")) return;
  const banner = doc.createElement("div");
  banner.className = "aegis-workshop-core-banner";
  banner.innerHTML = `
    <strong>${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion}</strong>
    <span>${detail}</span>
  `;
  anchor.prepend(banner);
}

function syncCreationPreview(doc, slug) {
  const previewBlocks = Array.from(doc.querySelectorAll("pre"));
  previewBlocks.forEach((block) => {
    const raw = block.textContent || "";
    if (!raw.trim()) return;
    let next = raw;
    next = next.replace(/version:\s*["']?[^\n"']+["']?/gi, `version: "${CORE_ENGINE.displayVersion}"`);
    next = next.replace(/base_model:\s*["']?[^\n"']+["']?/gi, `base_model: "${CORE_ENGINE.creationDefaults.logic.baseModel}"`);
    next = next.replace(/model_id:\s*["']?[^\n"']+["']?/gi, `model_id: "${CORE_ENGINE.creationDefaults.logic.baseModel}"`);
    next = next.replace(/strategy:\s*[^\n]+/gi, `strategy: ${CORE_ENGINE.creationDefaults.logic.reflectionPrimitive}`);
    next = next.replace(/snapshot_protocol:\s*[^\n]+/gi, `snapshot_protocol: ${CORE_ENGINE.creationDefaults.memory.snapshotProtocol}`);
    next = next.replace(/lock_canon:\s*[^\n]+/gi, "lock_core_engine: true");
    next = next.replace(/readiness:\s*[^\n]+/gi, `readiness: ${CORE_ENGINE.creationDefaults.deployment.state}`);
    if (slug === "create-new-agent-dataquad-memory-configuration") {
      next = next.replace(/integration:\n([\s\S]*?)governance:/i, `integration:\n    strategy: ${CORE_ENGINE.creationDefaults.logic.reflectionPrimitive}\n    offload_domain: ".digitalself"\ngovernance:`);
    }
    if (next !== raw) {
      block.textContent = next;
    }
  });
}

function wireRouteByText(doc, labelsToRoute) {
  const interactive = Array.from(doc.querySelectorAll("button, a"));
  interactive.forEach((node) => {
    const text = normalizeText(node.textContent);
    const entry = labelsToRoute.find((item) => text.includes(item.text));
    if (!entry) return;
    bindManagedClick(node, () => {
      showToast(doc, entry.toast || `Opening ${routeLabel(entry.route)}.`);
      navigateTo(entry.route);
    });
  });
}

function retitleWorkshopChrome(doc) {
  const candidates = Array.from(doc.querySelectorAll("footer, p, span, div"));
  candidates.forEach((node) => {
    const text = normalizeText(node.textContent);
    if (text === "v0.8.4-beta") {
      node.textContent = CORE_ENGINE.displayVersion;
    } else if (text === "neural engine active") {
      node.textContent = `${CORE_ENGINE.name} bound`;
    } else if (text.includes("aegis standards applied automatically")) {
      node.textContent = `${CORE_ENGINE.name} bindings applied automatically`;
    } else if (text.includes("configuration automatically saved")) {
      node.textContent = `Draft agent bound to ${CORE_ENGINE.displayVersion}`;
    }
  });
}

function enhanceCreationSurface(doc, slug, options) {
  const enhancedFlag = `aegisEnhanced${slug}`;
  if (doc.body.dataset[enhancedFlag] === "true") return;
  doc.body.dataset[enhancedFlag] = "true";
  injectStyles(doc);
  ensureDraftAgentState();

  const headerAnchor = doc.querySelector("main") || doc.body;
  prependCoreBanner(doc, headerAnchor, options.detail);
  syncCreationPreview(doc, slug);
  retitleWorkshopChrome(doc);
  wireRouteByText(doc, options.routes);
}

function enhanceMainConsole(doc) {
  if (doc.body.dataset.aegisEnhancedWorkshopMain === "true") return;
  doc.body.dataset.aegisEnhancedWorkshopMain = "true";
  injectStyles(doc);

  const routeButtons = Array.from(doc.querySelectorAll("[data-workshop-route]"));
  const search = doc.querySelector("[data-workshop-search]");
  const cards = Array.from(doc.querySelectorAll("[data-workshop-card]"));
  const resume = doc.querySelector("[data-workshop-resume]");
  const lastLaunch = doc.querySelector("[data-workshop-last-launch]");
  const lastSurface = doc.querySelector("[data-workshop-last-surface]");
  const actionCount = doc.querySelector("[data-workshop-action-count]");
  const actionCountPanel = doc.querySelector("[data-workshop-action-count-panel]");
  const connectivity = doc.querySelector("[data-workshop-connectivity]");
  const connectivityPanel = doc.querySelector("[data-workshop-connectivity-panel]");
  const feed = doc.querySelector("[data-workshop-activity-feed]");
  const intro = doc.querySelector(".hero-copy");

  const render = () => {
    const state = ensureDraftAgentState();
    const launches = state.launches || [];
    const last = state.lastLaunchRoute || "";
    const online = navigator.onLine ? "Online" : "Offline";

    if (lastLaunch) lastLaunch.textContent = last ? routeLabel(last) : "Awaiting";
    if (lastSurface) lastSurface.textContent = last ? routeLabel(last) : "Awaiting activity";
    if (actionCount) actionCount.textContent = String(launches.length);
    if (actionCountPanel) actionCountPanel.textContent = String(launches.length);
    if (connectivity) connectivity.textContent = online;
    if (connectivityPanel) connectivityPanel.textContent = online;

    if (feed) {
      const items = launches.slice(0, 4);
      feed.innerHTML = items.length
        ? items.map((entry) => `<div>${new Date(entry.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · ${routeLabel(entry.path)}</div>`).join("")
        : "<div>Workshop home loaded. Awaiting the next Peer action.</div>";
    }
  };

  prependCoreBanner(
    doc,
    intro || doc.querySelector("main") || doc.body,
    `${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion} is the single creation baseline for Workshop agents. Updating the canon-locked Core repo should update every Workshop-bound creation surface after sync and rebuild.`
  );

  routeButtons.forEach((button) => bindManagedClick(button, () => {
    const route = button.getAttribute("data-workshop-route");
    showToast(doc, `Opening ${routeLabel(route)}.`);
    navigateTo(route);
  }));

  bindManagedClick(resume, () => {
    const state = readState();
    const target = state.lastLaunchRoute || "/agent-workshop/create-new-agent-flow/";
    showToast(doc, `Resuming ${routeLabel(target)}.`);
    navigateTo(target);
  });

  if (search) {
    search.addEventListener("input", () => {
      const query = normalizeText(search.value);
      cards.forEach((card) => {
        const visible = !query || normalizeText(card.textContent).includes(query);
        card.classList.toggle("aegis-workshop-hidden", !visible);
      });
    });
  }

  render();
  window.addEventListener("online", render);
  window.addEventListener("offline", render);

  hydrateLivePeerRuntime(doc, (runtime) => {
    if (lastLaunch) lastLaunch.textContent = runtime.peer.status || "Candidate";
    if (lastSurface) lastSurface.textContent = runtime.peer.displayName || "Live Peer";
    if (actionCount) actionCount.textContent = String(runtime.events?.length || 0);
    if (actionCountPanel) actionCountPanel.textContent = String(runtime.events?.length || 0);
    if (feed) {
      const items = [
        `<div>Live Peer: ${runtime.peer.displayName} · ${runtime.peer.status}</div>`,
        `<div>Envelope: ${runtime.steward?.currentEnvelope || "strict"} · Review required: ${runtime.steward?.reviewRequired ? "yes" : "no"}</div>`,
        ...(runtime.events || []).slice(0, 3).map((entry) => `<div>${entry.eventType} · ${entry.summary}</div>`),
      ];
      feed.innerHTML = items.join("");
    }
  });
}

function enhanceWorkshopMap(doc) {
  if (doc.body.dataset.aegisEnhancedWorkshopMap === "true") return;
  doc.body.dataset.aegisEnhancedWorkshopMap = "true";
  injectStyles(doc);

  const routeButtons = Array.from(doc.querySelectorAll("[data-workshop-route]"));
  const search = doc.querySelector("[data-workshop-map-search]");
  const cards = Array.from(doc.querySelectorAll("[data-workshop-map-card]"));
  const lastLaunch = doc.querySelector("[data-workshop-map-last-launch]");
  const actionCount = doc.querySelector("[data-workshop-map-action-count]");
  const connectivity = doc.querySelector("[data-workshop-map-connectivity]");
  const hero = doc.querySelector(".hero-copy");

  const render = () => {
    const state = ensureDraftAgentState();
    const launches = state.launches || [];
    if (lastLaunch) {
      lastLaunch.textContent = state.lastLaunchRoute ? routeLabel(state.lastLaunchRoute) : "Awaiting";
    }
    if (actionCount) {
      actionCount.textContent = String(launches.length);
    }
    if (connectivity) {
      connectivity.textContent = navigator.onLine ? "Online" : "Offline";
    }
  };

  prependCoreBanner(
    doc,
    hero || doc.querySelector("main") || doc.body,
    `${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion} now anchors Workshop creation defaults, governance invariants, and propagation into the broader EcoVerse.`
  );

  routeButtons.forEach((button) => bindManagedClick(button, () => {
    const route = button.getAttribute("data-workshop-route");
    showToast(doc, `Opening ${routeLabel(route)} from the Workshop Map.`);
    navigateTo(route);
  }));

  if (search) {
    search.addEventListener("input", () => {
      const query = normalizeText(search.value);
      cards.forEach((card) => {
        const visible = !query || normalizeText(card.textContent).includes(query);
        card.classList.toggle("aegis-workshop-hidden", !visible);
      });
    });
  }

  render();
  window.addEventListener("online", render);
  window.addEventListener("offline", render);
}

function enhanceMeshVisualizer(doc) {
  if (doc.body.dataset.aegisEnhancedWorkshopMesh === "true") return;
  doc.body.dataset.aegisEnhancedWorkshopMesh = "true";
  injectStyles(doc);

  const state = ensureDraftAgentState();
  const manifest = state.draftAgent?.manifest || getCoreAgentManifest();
  const defaults = manifest.defaults || CORE_ENGINE.creationDefaults;
  const launches = state.launches || [];
  const online = navigator.onLine ? "Online" : "Offline";
  const anchor = doc.querySelector("main") || doc.body;

  prependCoreBanner(
    doc,
    anchor,
    `${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion} defines the Peer baseline here. The Peer, Advocate daemon, Steward daemon, and temporal-memory target are shown as the intended beta topology, while live Firebase persistence and autonomous daemon execution remain backend-pending until wired.`
  );

  const setText = (selector, value) => {
    const node = doc.querySelector(selector);
    if (node) node.textContent = value;
  };

  setText("[data-mesh-core-version]", CORE_ENGINE.displayVersion);
  setText("[data-mesh-connectivity]", online);
  setText("[data-mesh-draft-state]", state.draftAgent?.finalizedAt ? "Draft recorded" : "Draft in progress");
  setText("[data-mesh-memory-target]", "Firebase temporal memory target · backend pending");
  setText("[data-mesh-badge]", defaults.deployment?.state || CORE_ENGINE.creationDefaults.deployment.state);
  setText("[data-mesh-peer-name]", defaults.identity?.role || "Peer Agent");
  setText("[data-mesh-memory-architecture]", `${defaults.memory?.architecture || CORE_ENGINE.creationDefaults.memory.architecture} · ${defaults.memory?.snapshotProtocol || CORE_ENGINE.creationDefaults.memory.snapshotProtocol}`);
  setText("[data-mesh-autonomy]", "Strict parameters now · broader autonomy as coherence matures");
  setText("[data-mesh-invariants]", (manifest.invariants || CORE_ENGINE.governanceInvariants || []).join(" · "));
  setText("[data-mesh-ledger-status]", `${online} · ${launches.length} workshop actions`);

  const ledger = doc.querySelector("[data-mesh-ledger]");
  if (ledger) {
    const items = [
      `[core] ${CORE_ENGINE.displayVersion} referenced from ${CORE_ENGINE.sourceRepoPath}.`,
      `[draft] Current identity role: ${defaults.identity?.role || CORE_ENGINE.creationDefaults.identity.role}.`,
      `[memory] Temporal memory target: Firebase-backed persistence planned; browser draft state active now.`,
      `[daemon] Advocate and Steward lanes are modeled here, but live daemon execution is backend pending.`,
      ...launches.slice(0, 4).map((entry) => `[launch] ${new Date(entry.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} -> ${routeLabel(entry.path)}`),
    ];
    ledger.innerHTML = items.map((item) => `<div>${item}</div>`).join("");
  }

  Array.from(doc.querySelectorAll("[data-mesh-route]")).forEach((button) => {
    const route = button.getAttribute("data-mesh-route");
    bindManagedClick(button, () => {
      showToast(doc, `Opening ${routeLabel(route)}.`);
      navigateTo(route);
    });
  });

  hydrateLivePeerRuntime(doc, (runtime) => {
    setText("[data-mesh-draft-state]", runtime.peer.status || "candidate");
    setText("[data-mesh-memory-target]", "Firebase temporal memory live");
    setText("[data-mesh-ledger-status]", `Online · ${(runtime.events || []).length} persisted events`);
    if (ledger) {
      const items = [
        `[peer] ${runtime.peer.displayName} is now persisted as ${runtime.peer.status}.`,
        `[advocate] ${runtime.advocate?.declaredIntent || "Awaiting advocate summary."}`,
        `[steward] Envelope: ${runtime.steward?.currentEnvelope || "strict"} · Review required: ${runtime.steward?.reviewRequired ? "yes" : "no"}.`,
        ...(runtime.events || []).slice(0, 4).map((entry) => `[event] ${entry.eventType} · ${entry.summary}`),
      ];
      ledger.innerHTML = items.map((item) => `<div>${item}</div>`).join("");
    }
  });
}

function enhanceCommunicationProtocol(doc) {
  if (doc.body.dataset.aegisEnhancedWorkshopProtocol === "true") return;
  doc.body.dataset.aegisEnhancedWorkshopProtocol = "true";
  injectStyles(doc);

  const state = ensureDraftAgentState();
  const manifest = state.draftAgent?.manifest || getCoreAgentManifest();
  const defaults = manifest.defaults || CORE_ENGINE.creationDefaults;
  const launches = state.launches || [];
  const online = navigator.onLine ? "Online" : "Offline";
  const anchor = doc.querySelector("main") || doc.body;

  prependCoreBanner(
    doc,
    anchor,
    `${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion} defines the communication posture here. Peer, Advocate, Steward, and temporal-memory lanes are declared as the beta protocol architecture, while live Firebase event streaming and daemon messaging remain backend-pending until implemented.`
  );

  const setText = (selector, value) => {
    const node = doc.querySelector(selector);
    if (node) node.textContent = value;
  };

  setText("[data-protocol-core]", CORE_ENGINE.displayVersion);
  setText("[data-protocol-connectivity]", online);
  setText("[data-protocol-state]", state.draftAgent?.finalizedAt ? "Draft recorded" : "Draft in progress");
  setText("[data-protocol-transport]", `${defaults.memory?.ragMode || CORE_ENGINE.creationDefaults.memory.ragMode} · local session truth`);
  setText("[data-protocol-mode]", "Governed Peer lane orchestration");
  setText("[data-protocol-reflection]", defaults.logic?.reflectionPrimitive || CORE_ENGINE.creationDefaults.logic.reflectionPrimitive);
  setText("[data-protocol-snapshot]", defaults.memory?.snapshotProtocol || CORE_ENGINE.creationDefaults.memory.snapshotProtocol);
  setText("[data-protocol-invariants]", (manifest.invariants || CORE_ENGINE.governanceInvariants || []).join(" · "));
  setText("[data-protocol-badge]", defaults.deployment?.state || CORE_ENGINE.creationDefaults.deployment.state);
  setText("[data-protocol-ledger-status]", `${online} · ${launches.length} workshop actions`);

  const ledger = doc.querySelector("[data-protocol-ledger]");
  if (ledger) {
    const items = [
      `[core] ${CORE_ENGINE.displayVersion} is the active communication baseline.`,
      `[transport] Current protocol view is local-first and browser-truthful until Firebase event persistence is wired.`,
      `[daemon] Advocate and Steward communication lanes are modeled as beta architecture, not active message buses yet.`,
      `[memory] Temporal memory append-only persistence is targeted for Firebase in the beta runtime path.`,
      ...launches.slice(0, 4).map((entry) => `[launch] ${new Date(entry.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} -> ${routeLabel(entry.path)}`),
    ];
    ledger.innerHTML = items.map((item) => `<div>${item}</div>`).join("");
  }

  Array.from(doc.querySelectorAll("[data-protocol-route]")).forEach((button) => {
    const route = button.getAttribute("data-protocol-route");
    bindManagedClick(button, () => {
      showToast(doc, `Opening ${routeLabel(route)}.`);
      navigateTo(route);
    });
  });

  hydrateLivePeerRuntime(doc, (runtime) => {
    setText("[data-protocol-state]", runtime.peer.status || "candidate");
    setText("[data-protocol-transport]", "Firebase temporal memory · live beta channel");
    setText("[data-protocol-ledger-status]", `Online · ${(runtime.events || []).length} persisted events`);
    if (ledger) {
      const items = [
        `[peer] ${runtime.peer.displayName} bound to ${runtime.peer.coreBinding?.coreEngineId || CORE_ENGINE.id}.`,
        `[advocate] ${runtime.advocate?.continuitySummary || "Awaiting advocate continuity state."}`,
        `[steward] Hold state: ${runtime.steward?.holdState || "clear"} · Coherence gate: ${runtime.steward?.coherenceGate || "initial"}.`,
        ...(runtime.events || []).slice(0, 4).map((entry) => `[event] ${entry.eventType} · ${entry.summary}`),
      ];
      ledger.innerHTML = items.map((item) => `<div>${item}</div>`).join("");
    }
  });
}

function enhanceCreateNewAgentFlow(doc) {
  enhanceCreationSurface(doc, "create-new-agent-flow", {
    detail: `New agents created from this flow are now bound to ${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion}. When the canon-locked Core repository changes, this flow should inherit the synchronized defaults automatically.`,
    routes: [
      { text: "next step", route: "/agent-workshop/create-new-agent-identity-configuration/" },
      { text: "cancel", route: "/agent-workshop/agentic-workshop-main-console/", toast: "Returning to the Workshop Main Console." },
    ],
  });
}

function enhanceCreateIdentity(doc) {
  enhanceCreationSurface(doc, "create-new-agent-identity-configuration", {
    detail: `Identity settings are being framed under ${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion}, with stewardship-first boundaries and peer-aware defaults.`,
    routes: [
      { text: "next: logic configuration", route: "/agent-workshop/create-new-agent-logic-intelligence/" },
      { text: "cancel", route: "/agent-workshop/agentic-workshop-main-console/" },
    ],
  });
}

function enhanceCreateLogic(doc) {
  enhanceCreationSurface(doc, "create-new-agent-logic-intelligence", {
    detail: `Logic and tool access are now interpreted as ${CORE_ENGINE.name} bindings. This keeps the Workshop aligned when the shared engine changes later.`,
    routes: [
      { text: "next: memory", route: "/agent-workshop/create-new-agent-memory-rag/" },
      { text: "previous step", route: "/agent-workshop/create-new-agent-identity-configuration/" },
    ],
  });
}

function enhanceCreateMemory(doc) {
  enhanceCreationSurface(doc, "create-new-agent-memory-rag", {
    detail: `Memory and RAG surfaces are now treated as derived from the shared Core Engine manifest rather than standalone stitched defaults.`,
    routes: [
      { text: "next: deployment", route: "/agent-workshop/create-new-agent-dataquad-memory-configuration/" },
      { text: "previous step", route: "/agent-workshop/create-new-agent-logic-intelligence/" },
      { text: "export manifest", route: "/agent-workshop/model-deployment-flow/", toast: "Opening deployment flow with current core-bound draft." },
    ],
  });
}

function enhanceCreateDataQuad(doc) {
  enhanceCreationSurface(doc, "create-new-agent-dataquad-memory-configuration", {
    detail: `DataQuad memory and governance settings are now tied to ${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion}, including the current reflection primitive and snapshot protocol defaults.`,
    routes: [
      { text: "next: deployment", route: "/agent-workshop/model-deployment-flow/" },
      { text: "previous step", route: "/agent-workshop/create-new-agent-memory-rag/" },
      { text: "export manifest", route: "/agent-workshop/model-deployment-flow/", toast: "Opening deployment flow with the bound core manifest." },
    ],
  });
}

function enhanceModelDeploymentFlow(doc) {
  if (doc.body.dataset.aegisEnhancedModelDeployment === "true") return;
  doc.body.dataset.aegisEnhancedModelDeployment = "true";
  injectStyles(doc);

  const state = ensureDraftAgentState();
  const manifest = state.draftAgent?.manifest || getCoreAgentManifest();
  const defaults = manifest.defaults || {};
  const launches = state.launches || [];
  const online = navigator.onLine ? "Online" : "Offline";
  const headerAnchor = doc.querySelector("main") || doc.body;

  prependCoreBanner(
    doc,
    headerAnchor,
    `${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion} is being referenced from the canon-locked Core repository at ${CORE_ENGINE.sourceRepoPath}. This page records draft readiness and EcoVerse handoff truthfully without fabricating production rollout telemetry.`
  );

  const setText = (selector, value) => {
    const node = doc.querySelector(selector);
    if (node) node.textContent = value;
  };

  setText("[data-core-version]", CORE_ENGINE.displayVersion);
  setText("[data-core-status]", String(CORE_ENGINE.currentStatus || "unknown").toUpperCase());
  setText("[data-deployment-mode]", defaults.deployment?.mode || CORE_ENGINE.creationDefaults.deployment.mode);
  setText("[data-deployment-connectivity]", online);
  setText("[data-core-source]", CORE_ENGINE.sourceRepoPath);
  setText("[data-reference-date]", CORE_ENGINE.referenceDate || "Unavailable");
  setText("[data-canon-version]", `Canon v${CORE_ENGINE.canonVersion}`);
  setText("[data-standards-version]", `Standards v${CORE_ENGINE.standardsVersion}`);
  setText("[data-default-role]", defaults.identity?.role || CORE_ENGINE.creationDefaults.identity.role);
  setText("[data-default-boundary]", defaults.identity?.boundary || CORE_ENGINE.creationDefaults.identity.boundary);
  setText("[data-default-model]", defaults.logic?.baseModel || CORE_ENGINE.creationDefaults.logic.baseModel);
  setText("[data-default-reflection]", defaults.logic?.reflectionPrimitive || CORE_ENGINE.creationDefaults.logic.reflectionPrimitive);
  setText("[data-default-memory]", defaults.memory?.architecture || CORE_ENGINE.creationDefaults.memory.architecture);
  setText("[data-default-snapshot]", defaults.memory?.snapshotProtocol || CORE_ENGINE.creationDefaults.memory.snapshotProtocol);
  setText("[data-invariants]", (manifest.invariants || CORE_ENGINE.governanceInvariants || []).join(" · "));
  setText("[data-deployment-state-badge]", defaults.deployment?.state || CORE_ENGINE.creationDefaults.deployment.state);
  setText("[data-ledger-status]", `${online} · ${launches.length} logged actions`);

  const preview = doc.querySelector("[data-manifest-preview]");
  if (preview) {
    preview.textContent = JSON.stringify(
      {
        coreEngineId: manifest.coreEngineId,
        sourceRepoPath: manifest.sourceRepoPath,
        referenceDate: manifest.referenceDate,
        canonVersion: manifest.canonVersion,
        standardsVersion: manifest.standardsVersion,
        currentStatus: manifest.currentStatus,
        defaults: manifest.defaults,
      },
      null,
      2
    );
  }

  const ledger = doc.querySelector("[data-deployment-ledger]");
  if (ledger) {
    const entries = [
      `[sync] Bound to ${CORE_ENGINE.displayVersion} from ${CORE_ENGINE.sourceRepoPath}.`,
      `[truth] Deployment posture remains "${defaults.deployment?.state || CORE_ENGINE.creationDefaults.deployment.state}".`,
      `[session] Browser connectivity currently reports ${online.toLowerCase()}.`,
      ...launches.slice(0, 4).map((entry) => `[launch] ${new Date(entry.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} -> ${routeLabel(entry.path)}`),
    ];
    ledger.innerHTML = entries.map((entry) => `<div>${entry}</div>`).join("");
  }

  Array.from(doc.querySelectorAll("[data-deployment-route]")).forEach((button) => {
    const route = button.getAttribute("data-deployment-route");
    bindManagedClick(button, () => {
      showToast(doc, `Opening ${routeLabel(route)}.`);
      navigateTo(route);
    });
  });

  const finalize = doc.querySelector("[data-deployment-action='finalize']");
  bindManagedClick(finalize, async () => {
    patchState({
      draftAgent: {
        ...readState().draftAgent,
        finalizedAt: new Date().toISOString(),
      },
    });
    showToast(doc, "Persisting the first beta Peer to Firebase.");
    try {
      const result = await createOrUpdateBetaPeer({
        draftAgent: readState().draftAgent,
        originSurface: "model_deployment_flow",
      });
      showToast(
        doc,
        result.existed
          ? "Beta Peer runtime refreshed. Opening the Active Agents Monitor."
          : "Beta Peer runtime created in Firebase. Opening the Active Agents Monitor.",
      );
      navigateTo("/agent-workshop/active-agents-monitor-agentic-workshop/");
    } catch (error) {
      console.error("[agent-workshop] beta peer creation failed", error);
      showToast(doc, "Firebase rejected the beta Peer write. The draft remains local until persistence is available.");
    }
  });

  hydrateLivePeerRuntime(doc, (runtime) => {
    setText("[data-deployment-state-badge]", runtime.peer.status || "candidate");
    setText("[data-ledger-status]", `Online · ${(runtime.events || []).length} persisted events`);
    setText("[data-deployment-connectivity]", "Online · Firebase bound");
    if (preview) {
      preview.textContent = JSON.stringify(
        {
          peerId: runtime.peer.peerId,
          displayName: runtime.peer.displayName,
          status: runtime.peer.status,
          coreBinding: runtime.peer.coreBinding,
          advocate: runtime.advocate,
          steward: runtime.steward,
          tasks: runtime.tasks,
        },
        null,
        2,
      );
    }
    if (ledger) {
      const entries = [
        `[peer] ${runtime.peer.displayName} is persisted as ${runtime.peer.status}.`,
        `[advocate] ${runtime.advocate?.declaredIntent || "Awaiting advocate lane."}`,
        `[steward] Envelope: ${runtime.steward?.currentEnvelope || "strict"} · Hold state: ${runtime.steward?.holdState || "clear"}.`,
        ...(runtime.events || []).slice(0, 4).map((entry) => `[event] ${entry.eventType} · ${entry.summary}`),
      ];
      ledger.innerHTML = entries.map((entry) => `<div>${entry}</div>`).join("");
    }
  });
}

function enhanceActiveAgentsMonitor(doc) {
  if (doc.body.dataset.aegisEnhancedActiveMonitor === "true") return;
  doc.body.dataset.aegisEnhancedActiveMonitor = "true";
  injectStyles(doc);

  const state = ensureDraftAgentState();
  const anchor = doc.querySelector("main") || doc.body;
  prependCoreBanner(
    doc,
    anchor,
    `${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion} is now driving the first live beta Peer. This monitor shows persisted Firebase truth for ${BETA_PEER_DISPLAY_NAME}, not synthetic workshop telemetry.`,
  );

  const setText = (selector, value) => {
    const node = doc.querySelector(selector);
    if (node) node.textContent = value;
  };

  const eventFeed = doc.querySelector("[data-active-feed]");
  const artifactFeed = doc.querySelector("[data-active-artifacts]");
  const appendButton = doc.querySelector("[data-active-action='append']");
  const guidanceButton = doc.querySelector("[data-active-action='guidance']");
  const proposalButton = doc.querySelector("[data-active-action='proposal']");
  const priorityButton = doc.querySelector("[data-active-action='priority-note']");
  const detailButton = doc.querySelector("[data-active-route='detail']");
  const mapButton = doc.querySelector("[data-active-route='map']");
  const guidancePanel = doc.querySelector("[data-active-guidance]");
  const proposalPanel = doc.querySelector("[data-active-proposal]");
  const priorityPanel = doc.querySelector("[data-active-priority-note]");

  bindManagedClick(detailButton, () => navigateTo("/agent-workshop/detailed-agent-view-dataquad-node/"));
  bindManagedClick(mapButton, () => navigateTo("/agent-workshop/aegis-project-tree-index/"));
  bindManagedClick(appendButton, async () => {
    showToast(doc, "Steward is appending a reviewed temporal memory event.");
    try {
      await appendBetaPeerTemporalMemory({
        source: "active_agents_monitor_agentic_workshop",
        summary: "Steward recorded a reviewed EcoVerse structure observation and preserved it as temporal memory continuity.",
        details: {
          taskType: "environment_spec_draft",
          origin: "workshop_monitor",
        },
      });
      showToast(doc, "Temporal memory append recorded in Firebase.");
      await hydrateLivePeerRuntime(doc, applyRuntime);
    } catch (error) {
      console.error("[agent-workshop] temporal memory append failed", error);
      showToast(doc, "Temporal memory append failed. The Peer remains in its previous reviewed state.");
    }
  });
  bindManagedClick(guidanceButton, async () => {
    showToast(doc, "Peer is generating a bounded structure guidance note from its continuity ledger.");
    try {
      await generateBetaPeerStructureGuidance({
        source: "active_agents_monitor_agentic_workshop",
      });
      showToast(doc, "Structure guidance generated and recorded.");
      await hydrateLivePeerRuntime(doc, applyRuntime);
    } catch (error) {
      console.error("[agent-workshop] structure guidance generation failed", error);
      showToast(doc, "Structure guidance could not be generated right now.");
    }
  });
  bindManagedClick(proposalButton, async () => {
    showToast(doc, "Peer is preparing a bounded EcoVerse structure proposal for review.");
    try {
      await generateBetaPeerStructureProposal({
        source: "active_agents_monitor_agentic_workshop",
      });
      showToast(doc, "Structure proposal generated for operator review.");
      await hydrateLivePeerRuntime(doc, applyRuntime);
    } catch (error) {
      console.error("[agent-workshop] structure proposal generation failed", error);
      showToast(doc, "Structure proposal could not be generated right now.");
    }
  });
  bindManagedClick(priorityButton, async () => {
    showToast(doc, "Adam-One is drafting the next bounded Workshop priority note.");
    try {
      await generateBetaPeerWorkshopPriorityNote({
        source: "active_agents_monitor_agentic_workshop",
      });
      showToast(doc, "Workshop priority note generated and recorded.");
      await hydrateLivePeerRuntime(doc, applyRuntime);
    } catch (error) {
      console.error("[agent-workshop] workshop priority note generation failed", error);
      showToast(doc, "Workshop priority note could not be generated right now.");
    }
  });

  const applyRuntime = (runtime) => {
    const eventCount = runtime.peer?.memoryEventCount || runtime.events?.length || 0;
    const appendCount = runtime.peer?.temporalMemory?.appendCount || Math.max(0, eventCount - 1);
    const continuityMode = runtime.peer?.temporalMemory?.continuityMode || runtime.peer?.dataQuadBinding?.continuityStatus || "bootstrap-only";
    const latestSummary = runtime.peer?.temporalMemory?.latestSummary || runtime.advocate?.continuitySummary || "Awaiting reviewed continuity.";

    setText("[data-active-peer-name]", runtime.peer?.displayName || BETA_PEER_DISPLAY_NAME);
    setText("[data-active-peer-role]", runtime.peer?.role || "Structure Steward");
    setText("[data-active-status]", runtime.peer?.status || "candidate");
    setText("[data-active-core]", runtime.peer?.coreBinding?.coreEngineId || CORE_ENGINE.id);
    setText("[data-active-core-version]", runtime.peer?.coreBinding?.canonVersion ? `${CORE_ENGINE.displayVersion}` : CORE_ENGINE.displayVersion);
    setText("[data-active-connectivity]", navigator.onLine ? "Online" : "Offline");
    setText("[data-active-continuity]", continuityMode);
    setText("[data-active-event-count]", String(eventCount));
    setText("[data-active-append-count]", String(appendCount));
    setText("[data-active-envelope]", runtime.steward?.currentEnvelope || "strict");
    setText("[data-active-review]", runtime.steward?.reviewRequired ? "review required" : "review current");
    setText("[data-active-summary]", latestSummary);
    setText("[data-active-dataquad]", runtime.peer?.dataQuadBinding?.dataQuadId || "Awaiting DataQuad binding");
    setText("[data-active-session]", runtime.peer?.dataQuadBinding?.sessionId || "Awaiting session");

    if (eventFeed) {
      const items = (runtime.events || []).slice(0, 5);
      eventFeed.innerHTML = items.length
        ? items.map((entry) => `<div>${entry.eventType} · ${entry.summary}</div>`).join("")
        : "<div>No persisted Peer events yet.</div>";
    }

    if (artifactFeed) {
      const items = (runtime.artifacts || []).slice(0, 4);
      artifactFeed.innerHTML = items.length
        ? items.map((entry) => `<div>${entry.title || entry.type} · ${entry.reviewState || "pending"}</div>`).join("")
        : "<div>No recorded bootstrap or temporal memory artifacts yet.</div>";
    }

    if (guidancePanel) {
      const guidanceArtifact = (runtime.artifacts || []).find((entry) => entry.type === "structure_guidance_note");
      guidancePanel.textContent = guidanceArtifact?.content || "No generated structure guidance yet.";
    }

    if (proposalPanel) {
      const proposalArtifact = (runtime.artifacts || []).find(
        (entry) => entry.type === "structure_change_applied" || entry.type === "structure_proposal",
      );
      proposalPanel.textContent = proposalArtifact?.content || "No generated structure proposal yet.";
    }

    if (priorityPanel) {
      const priorityArtifact = (runtime.artifacts || []).find((entry) => entry.type === "workshop_priority_note");
      priorityPanel.textContent = priorityArtifact?.content || "No generated Workshop priority note yet.";
    }
  };

  setText("[data-active-core-version]", CORE_ENGINE.displayVersion);
  setText("[data-active-connectivity]", navigator.onLine ? "Online" : "Offline");
  setText("[data-active-summary]", state.draftAgent?.finalizedAt ? "Draft finalized. Awaiting persisted runtime hydration." : "Awaiting live Peer hydration.");

  hydrateLivePeerRuntime(doc, applyRuntime);
}

function enhanceDetailedAgentView(doc) {
  if (doc.body.dataset.aegisEnhancedDetailedView === "true") return;
  doc.body.dataset.aegisEnhancedDetailedView = "true";
  injectStyles(doc);

  const anchor = doc.querySelector("main") || doc.body;
  prependCoreBanner(
    doc,
    anchor,
    `${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion} and the canon-locked DataQuad bootstrap are reflected here as a truthful beta node view. This surface shows persisted identity, continuity, and Steward-reviewed memory state.`,
  );

  const setText = (selector, value) => {
    const node = doc.querySelector(selector);
    if (node) node.textContent = value;
  };

  const preview = doc.querySelector("[data-detail-preview]");
  const eventFeed = doc.querySelector("[data-detail-events]");
  const appendButton = doc.querySelector("[data-detail-action='append']");
  const exportButton = doc.querySelector("[data-detail-action='export']");
  const backButton = doc.querySelector("[data-detail-route='monitor']");
  const exportPosture = doc.querySelector("[data-detail-export-posture]");
  const exportNote = doc.querySelector("[data-detail-export-note]");

  bindManagedClick(backButton, () => navigateTo("/agent-workshop/active-agents-monitor-agentic-workshop/"));
  bindManagedClick(appendButton, async () => {
    showToast(doc, "Steward is preserving another reviewed continuity note.");
    try {
      await appendBetaPeerTemporalMemory({
        source: "detailed_agent_view_dataquad_node",
        summary: "Steward appended a reviewed DataQuad node note to preserve continuity across Workshop observation and action.",
        details: {
          origin: "detail_view",
          taskType: "continuity_note",
        },
      });
      showToast(doc, "Reviewed continuity note appended.");
      await hydrateLivePeerRuntime(doc, applyRuntime);
    } catch (error) {
      console.error("[agent-workshop] detailed append failed", error);
      showToast(doc, "Unable to append reviewed continuity right now.");
    }
  });
  bindManagedClick(exportButton, async () => {
    showToast(doc, "Steward is recording an embedded export review note.");
    try {
      await appendBetaPeerTemporalMemory({
        source: "detailed_agent_view_export_review",
        summary: "Steward confirmed that export review remains embedded in the detailed agent surface until governed export services exist.",
        details: {
          taskType: "export_review",
          origin: "detail_view",
        },
      });
      showToast(doc, "Export review note appended.");
      await hydrateLivePeerRuntime(doc, applyRuntime);
    } catch (error) {
      console.error("[agent-workshop] export review append failed", error);
      showToast(doc, "Unable to record the export review note right now.");
    }
  });

  const applyRuntime = (runtime) => {
    setText("[data-detail-peer-name]", runtime.peer?.displayName || "Awaiting Peer");
    setText("[data-detail-peer-role]", runtime.peer?.role || "Structure Steward");
    setText("[data-detail-status]", runtime.peer?.status || "candidate");
    setText("[data-detail-envelope]", runtime.steward?.currentEnvelope || "strict");
    setText("[data-detail-gate]", runtime.steward?.coherenceGate || "bootstrap-only");
    setText("[data-detail-dataquad]", runtime.peer?.dataQuadBinding?.dataQuadId || "Awaiting DataQuad");
    setText("[data-detail-peer-record]", runtime.peer?.dataQuadBinding?.peerRecordId || "Awaiting PEER record");
    setText("[data-detail-pct-record]", runtime.peer?.dataQuadBinding?.pctRecordId || "Awaiting PCT record");
    setText("[data-detail-summary]", runtime.advocate?.continuitySummary || runtime.peer?.temporalMemory?.latestSummary || "Awaiting continuity summary.");
    if (exportPosture) {
      exportPosture.textContent = runtime.peer?.status === "active"
        ? "Embedded review active"
        : "Awaiting live runtime";
    }

    if (preview) {
      preview.textContent = JSON.stringify(
        {
          peer: runtime.peer,
          advocate: runtime.advocate,
          steward: runtime.steward,
          artifacts: runtime.artifacts,
          sessions: runtime.sessions,
        },
        null,
        2,
      );
    }

    if (eventFeed) {
      const items = (runtime.events || []).slice(0, 6);
      eventFeed.innerHTML = items.length
        ? items.map((entry) => `<div>${entry.timestamp || "pending"} · ${entry.eventType} · ${entry.summary}</div>`).join("")
        : "<div>No continuity events recorded yet.</div>";
    }

    if (exportNote) {
      const latestExportEvent = (runtime.events || []).find((entry) => entry.source === "detailed_agent_view_export_review");
      exportNote.textContent = latestExportEvent
        ? `Latest embedded export review:\n${latestExportEvent.eventType}\n${latestExportEvent.summary}`
        : "No export review note has been recorded yet.";
    }
  };

  hydrateLivePeerRuntime(doc, applyRuntime);
}

function enhanceAnomalyAnalysisDetail(doc) {
  if (doc.body.dataset.aegisEnhancedAnomalyDetail === "true") return;
  doc.body.dataset.aegisEnhancedAnomalyDetail = "true";
  injectStyles(doc);

  const anchor = doc.querySelector("main") || doc.body;
  prependCoreBanner(
    doc,
    anchor,
    `${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion} keeps this anomaly surface truthful. It uses persisted continuity and browser truth, while backend anomaly scoring remains explicitly pending.`,
  );

  const setText = (selector, value) => {
    const node = doc.querySelector(selector);
    if (node) node.textContent = value;
  };

  const eventFeed = doc.querySelector("[data-anomaly-events]");
  const notePanel = doc.querySelector("[data-anomaly-note]");
  const appendButton = doc.querySelector("[data-anomaly-action='append']");
  const monitorButton = doc.querySelector("[data-anomaly-route='monitor']");
  const mapButton = doc.querySelector("[data-anomaly-route='map']");

  bindManagedClick(monitorButton, () => navigateTo("/agent-workshop/active-agents-monitor-agentic-workshop/"));
  bindManagedClick(mapButton, () => navigateTo("/agent-workshop/aegis-project-tree-index/"));
  bindManagedClick(appendButton, async () => {
    showToast(doc, "Steward is recording a bounded anomaly review note.");
    try {
      await appendBetaPeerTemporalMemory({
        source: "anomaly_analysis_detail",
        summary: "Steward reviewed the current Workshop anomaly lane and confirmed that only browser truth and persisted continuity are available at this stage.",
        details: {
          taskType: "anomaly_review",
          origin: "anomaly_detail",
        },
      });
      showToast(doc, "Anomaly review note recorded in Firebase.");
      await hydrateLivePeerRuntime(doc, applyRuntime);
    } catch (error) {
      console.error("[agent-workshop] anomaly review append failed", error);
      showToast(doc, "Anomaly review note could not be recorded right now.");
    }
  });

  const applyRuntime = (runtime) => {
    const latestSummary = runtime.peer?.temporalMemory?.latestSummary || runtime.advocate?.continuitySummary || "Awaiting reviewed continuity.";
    setText("[data-anomaly-connectivity]", navigator.onLine ? "Online" : "Offline");
    setText("[data-anomaly-continuity]", runtime.peer?.temporalMemory?.continuityMode || runtime.peer?.dataQuadBinding?.continuityStatus || "bootstrap-only");
    setText("[data-anomaly-review]", runtime.steward?.reviewRequired ? "review required" : "review current");
    setText("[data-anomaly-summary]", latestSummary);

    if (eventFeed) {
      const items = (runtime.events || []).slice(0, 5);
      eventFeed.innerHTML = items.length
        ? items.map((entry) => `<div>${entry.eventType} · ${entry.summary}</div>`).join("")
        : "<div>No persisted Workshop events yet.</div>";
    }

    if (notePanel) {
      const recentEvent = (runtime.events || []).find((entry) => entry.source === "anomaly_analysis_detail")
        || runtime.events?.[0];
      notePanel.textContent = recentEvent
        ? `Latest anomaly review basis:\n${recentEvent.eventType}\n${recentEvent.summary}`
        : "No anomaly review note has been recorded yet.";
    }
  };

  setText("[data-anomaly-connectivity]", navigator.onLine ? "Online" : "Offline");
  setText("[data-anomaly-summary]", "Awaiting persisted runtime hydration.");
  hydrateLivePeerRuntime(doc, applyRuntime);
}

function enhanceGlobalAnomalyHeatmap(doc) {
  if (doc.body.dataset.aegisEnhancedGlobalHeatmap === "true") return;
  doc.body.dataset.aegisEnhancedGlobalHeatmap = "true";
  injectStyles(doc);

  const anchor = doc.querySelector("main") || doc.body;
  prependCoreBanner(
    doc,
    anchor,
    `${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion} keeps this topology surface bounded. Global anomaly maps remain backend pending, so this page shows only the Workshop truth we can actually observe.`,
  );

  const setText = (selector, value) => {
    const node = doc.querySelector(selector);
    if (node) node.textContent = value;
  };

  const eventFeed = doc.querySelector("[data-heatmap-events]");
  const notePanel = doc.querySelector("[data-heatmap-note]");
  const appendButton = doc.querySelector("[data-heatmap-action='append']");
  const monitorButton = doc.querySelector("[data-heatmap-route='monitor']");
  const detailButton = doc.querySelector("[data-heatmap-route='detail']");

  bindManagedClick(monitorButton, () => navigateTo("/agent-workshop/active-agents-monitor-agentic-workshop/"));
  bindManagedClick(detailButton, () => navigateTo("/agent-workshop/anomaly-analysis-detail/"));
  bindManagedClick(appendButton, async () => {
    showToast(doc, "Steward is recording a bounded topology status note.");
    try {
      await appendBetaPeerTemporalMemory({
        source: "global_anomaly_heatmap",
        summary: "Steward reviewed the topology status lane and confirmed that global anomaly telemetry is still backend pending while local Workshop truth remains available.",
        details: {
          taskType: "topology_review",
          origin: "global_heatmap",
        },
      });
      showToast(doc, "Topology status note recorded in Firebase.");
      await hydrateLivePeerRuntime(doc, applyRuntime);
    } catch (error) {
      console.error("[agent-workshop] topology status append failed", error);
      showToast(doc, "Topology status note could not be recorded right now.");
    }
  });

  const applyRuntime = (runtime) => {
    const latestSummary = runtime.peer?.temporalMemory?.latestSummary || runtime.advocate?.continuitySummary || "Awaiting reviewed continuity.";
    setText("[data-heatmap-connectivity]", navigator.onLine ? "Online" : "Offline");
    setText("[data-heatmap-mode]", runtime.peer?.temporalMemory?.continuityMode || runtime.peer?.dataQuadBinding?.continuityStatus || "bootstrap-only");
    setText("[data-heatmap-global]", "backend pending");
    setText("[data-heatmap-summary]", latestSummary);

    if (eventFeed) {
      const items = (runtime.events || []).slice(0, 5);
      eventFeed.innerHTML = items.length
        ? items.map((entry) => `<div>${entry.eventType} · ${entry.summary}</div>`).join("")
        : "<div>No persisted topology review events yet.</div>";
    }

    if (notePanel) {
      const recentEvent = (runtime.events || []).find((entry) => entry.source === "global_anomaly_heatmap")
        || runtime.events?.[0];
      notePanel.textContent = recentEvent
        ? `Latest topology status basis:\n${recentEvent.eventType}\n${recentEvent.summary}`
        : "No topology note has been recorded yet.";
    }
  };

  setText("[data-heatmap-connectivity]", navigator.onLine ? "Online" : "Offline");
  setText("[data-heatmap-summary]", "Awaiting persisted runtime hydration.");
  hydrateLivePeerRuntime(doc, applyRuntime);
}

function enhanceExportWorkflowMoved(doc) {
  if (doc.body.dataset.aegisEnhancedExportMoved === "true") return;
  doc.body.dataset.aegisEnhancedExportMoved = "true";
  injectStyles(doc);

  const detailButton = doc.querySelector("[data-export-route='detail']");
  const monitorButton = doc.querySelector("[data-export-route='monitor']");

  bindManagedClick(detailButton, () => navigateTo("/agent-workshop/detailed-agent-view-dataquad-node/"));
  bindManagedClick(monitorButton, () => navigateTo("/agent-workshop/active-agents-monitor-agentic-workshop/"));
}

function enhanceGovernedRespawnArchive(doc) {
  if (doc.body.dataset.aegisEnhancedRespawnArchive === "true") return;
  doc.body.dataset.aegisEnhancedRespawnArchive = "true";
  injectStyles(doc);

  const anchor = doc.querySelector("main") || doc.body;
  prependCoreBanner(
    doc,
    anchor,
    `${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion} grounds this archive in persisted continuity. Live record state is drawn directly from the Peer ledger — the same state shared with the secondary archive entry point.`,
  );

  const setText = (selector, value) => {
    const node = doc.querySelector(selector);
    if (node) node.textContent = value;
  };

  const eventFeed = doc.querySelector("[data-archive-events]");
  const notePanel = doc.querySelector("[data-archive-note]");
  const appendButton = doc.querySelector("[data-archive-action='append']");
  const detailButton = doc.querySelector("[data-archive-route='detail']");
  const monitorButton = doc.querySelector("[data-archive-route='monitor']");

  bindManagedClick(detailButton, () => navigateTo("/agent-workshop/detailed-agent-view-dataquad-node/"));
  bindManagedClick(monitorButton, () => navigateTo("/agent-workshop/active-agents-monitor-agentic-workshop/"));
  bindManagedClick(appendButton, async () => {
    showToast(doc, "Steward is recording a governed archive review note.");
    try {
      await appendBetaPeerTemporalMemory({
        source: "sssp_respawn_archive_1",
        summary: "Steward reviewed the governed respawn archive and confirmed that only persisted continuity records and archive notes are currently represented here.",
        details: {
          taskType: "archive_review",
          origin: "governed_archive",
        },
      });
      showToast(doc, "Archive review note recorded in Firebase.");
      await hydrateLivePeerRuntime(doc, applyRuntime);
    } catch (error) {
      console.error("[agent-workshop] archive review append failed", error);
      showToast(doc, "Archive review note could not be recorded right now.");
    }
  });

  const applyRuntime = (runtime) => {
    const latestSummary = runtime.peer?.temporalMemory?.latestSummary || runtime.advocate?.continuitySummary || "Awaiting reviewed continuity.";
    setText("[data-archive-connectivity]", navigator.onLine ? "Online" : "Offline");
    setText("[data-archive-mode]", runtime.peer?.temporalMemory?.continuityMode || runtime.peer?.dataQuadBinding?.continuityStatus || "bootstrap-only");
    setText("[data-archive-summary]", latestSummary);

    if (eventFeed) {
      const items = [
        ...(runtime.events || []).slice(0, 4).map((entry) => `${entry.eventType} · ${entry.summary}`),
        ...(runtime.artifacts || []).slice(0, 2).map((entry) => `${entry.title || entry.type} · ${entry.reviewState || "pending"}`),
      ].slice(0, 6);
      eventFeed.innerHTML = items.length
        ? items.map((entry) => `<div>${entry}</div>`).join("")
        : "<div>No archive records yet.</div>";
    }

    if (notePanel) {
      const latestArchiveEvent = (runtime.events || []).find(
        (entry) => entry.source === "sssp_respawn_archive_1" || entry.source === "sssp_respawn_archive_2"
      );
      notePanel.textContent = latestArchiveEvent
        ? `Latest archive review:\n${latestArchiveEvent.eventType}\n${latestArchiveEvent.summary}`
        : "No archive review note has been recorded yet.";
    }
  };

  setText("[data-archive-connectivity]", navigator.onLine ? "Online" : "Offline");
  setText("[data-archive-summary]", "Awaiting persisted runtime hydration.");
  hydrateLivePeerRuntime(doc, applyRuntime);
}

function enhanceArchiveRouteMerged(doc) {
  if (doc.body.dataset.aegisEnhancedArchiveMerged === "true") return;
  doc.body.dataset.aegisEnhancedArchiveMerged = "true";
  injectStyles(doc);

  const anchor = doc.querySelector("main") || doc.body;
  prependCoreBanner(
    doc,
    anchor,
    `${CORE_ENGINE.name} ${CORE_ENGINE.displayVersion} grounds this archive entry point in the same live Peer ledger state as the primary governed archive. Archive review actions are available on the primary archive surface.`,
  );

  const archiveButton = doc.querySelector("[data-archive-merge-route='archive']");
  const monitorButton = doc.querySelector("[data-archive-merge-route='monitor']");

  bindManagedClick(archiveButton, () => navigateTo("/agent-workshop/sssp-respawn-archive-1/"));
  bindManagedClick(monitorButton, () => navigateTo("/agent-workshop/active-agents-monitor-agentic-workshop/"));

  // The Webflow template for this page does not carry the data-attribute elements
  // present on the primary archive surface — inject a live status panel so that
  // real Peer ledger state is visible here without duplicating the append action.
  const statusPanel = doc.createElement("div");
  statusPanel.className = "aegis-archive-merge-status";
  statusPanel.innerHTML = [
    `<div data-merge-status-connectivity></div>`,
    `<div data-merge-status-mode></div>`,
    `<div data-merge-status-summary></div>`,
    `<div data-merge-status-events></div>`,
  ].join("");
  anchor.append(statusPanel);

  const setStatus = (sel, val) => {
    const node = statusPanel.querySelector(sel);
    if (node) node.textContent = val;
  };

  const applyRuntime = (runtime) => {
    const latestSummary =
      runtime.peer?.temporalMemory?.latestSummary ||
      runtime.advocate?.continuitySummary ||
      "Awaiting reviewed continuity.";
    setStatus("[data-merge-status-connectivity]", navigator.onLine ? "Online" : "Offline");
    setStatus(
      "[data-merge-status-mode]",
      runtime.peer?.temporalMemory?.continuityMode ||
        runtime.peer?.dataQuadBinding?.continuityStatus ||
        "bootstrap-only",
    );
    setStatus("[data-merge-status-summary]", latestSummary);

    const eventsEl = statusPanel.querySelector("[data-merge-status-events]");
    if (eventsEl) {
      const items = [
        ...(runtime.events || [])
          .slice(0, 4)
          .map((entry) => `${entry.eventType} · ${entry.summary}`),
        ...(runtime.artifacts || [])
          .slice(0, 2)
          .map((entry) => `${entry.title || entry.type} · ${entry.reviewState || "pending"}`),
      ].slice(0, 6);
      eventsEl.innerHTML = items.length
        ? items.map((entry) => `<div>${entry}</div>`).join("")
        : "<div>No archive records yet.</div>";
    }
  };

  setStatus("[data-merge-status-connectivity]", navigator.onLine ? "Online" : "Offline");
  setStatus("[data-merge-status-summary]", "Awaiting persisted runtime hydration.");
  hydrateLivePeerRuntime(doc, applyRuntime);
}

const pageEnhancers = {
  "active-agents-monitor-agentic-workshop": enhanceActiveAgentsMonitor,
  "agentic-workshop-main-console": enhanceMainConsole,
  "aegis-project-tree-index": enhanceWorkshopMap,
  "agent-communication-protocol": enhanceCommunicationProtocol,
  "agent-mesh-visualizer": enhanceMeshVisualizer,
  "anomaly-analysis-detail": enhanceAnomalyAnalysisDetail,
  "bulk-export-progress-modal": enhanceExportWorkflowMoved,
  "global-anomaly-heatmap": enhanceGlobalAnomalyHeatmap,
  "detailed-agent-view-dataquad-node": enhanceDetailedAgentView,
  "sssp-respawn-archive-1": enhanceGovernedRespawnArchive,
  "sssp-respawn-archive-2": enhanceArchiveRouteMerged,
  "create-new-agent-flow": enhanceCreateNewAgentFlow,
  "create-new-agent-identity-configuration": enhanceCreateIdentity,
  "create-new-agent-logic-intelligence": enhanceCreateLogic,
  "create-new-agent-memory-rag": enhanceCreateMemory,
  "create-new-agent-dataquad-memory-configuration": enhanceCreateDataQuad,
  "model-deployment-flow": enhanceModelDeploymentFlow,
};

function enhanceFrame(frame) {
  const slug = inferSlug(frame);
  const enhancer = pageEnhancers[slug];
  if (!enhancer) return;
  try {
    const doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    enhancer(doc);
  } catch {
    // Retry on the next frame load/update.
  }
}

function initAgentWorkshopActivation() {
  if (!document.body.classList.contains("domain-agent-workshop")) return;
  const frames = Array.from(document.querySelectorAll(".stitch-frame"));
  if (!frames.length) return;
  frames.forEach((frame) => {
    frame.addEventListener("load", () => enhanceFrame(frame));
    if (frame.contentDocument?.readyState === "complete") {
      enhanceFrame(frame);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAgentWorkshopActivation, { once: true });
} else {
  initAgentWorkshopActivation();
}
