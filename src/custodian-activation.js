const STORAGE_KEY = "aegis.custodian.state";

const DEFAULT_STATE = {
  role: "operator",
  incidentFilter: "all",
  selectedIncident: "INC-88942-B",
  lastVote: "",
  governanceFilter: "all",
  queueCounts: {
    activeThreats: 42,
    mitigationMinutes: 12,
    shieldStrength: 98.2,
  },
  recentActions: [],
};

function mergeState(base, stored) {
  return {
    ...base,
    ...stored,
    queueCounts: {
      ...base.queueCounts,
      ...(stored?.queueCounts || {}),
    },
    recentActions: Array.isArray(stored?.recentActions) ? stored.recentActions : base.recentActions,
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

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function navigateTo(path) {
  if (typeof window.aegisTransit === "function") {
    window.aegisTransit(path);
  } else {
    window.location.href = path;
  }
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
  if (doc.getElementById("aegis-custodian-activation-styles")) return;
  const style = doc.createElement("style");
  style.id = "aegis-custodian-activation-styles";
  style.textContent = `
    .aegis-inline-message {
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 12px;
      line-height: 1.4;
      border: 1px solid rgba(14, 165, 233, 0.26);
      background: rgba(14, 165, 233, 0.08);
      color: inherit;
    }
    .aegis-inline-message.is-success {
      border-color: rgba(16, 185, 129, 0.3);
      background: rgba(16, 185, 129, 0.08);
    }
    .aegis-inline-message.is-error {
      border-color: rgba(239, 68, 68, 0.32);
      background: rgba(239, 68, 68, 0.08);
    }
    .aegis-toast {
      position: fixed;
      right: 18px;
      bottom: 18px;
      max-width: 320px;
      z-index: 9999;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(34, 211, 238, 0.26);
      background: rgba(8, 17, 31, 0.9);
      color: #e8f6ff;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.24);
      backdrop-filter: blur(10px);
      font-size: 12px;
      line-height: 1.5;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 180ms ease, transform 180ms ease;
      pointer-events: none;
    }
    .aegis-toast.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
    .aegis-highlight-ring {
      box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.32) inset, 0 0 0 1px rgba(34, 211, 238, 0.18);
      border-radius: 16px;
    }
    .aegis-hidden-row {
      display: none !important;
    }
    .aegis-active-anchor {
      color: #22d3ee !important;
      font-weight: 700 !important;
    }
  `;
  doc.head.appendChild(style);
}

function showToast(doc, message) {
  injectStyles(doc);
  let toast = doc.querySelector(".aegis-toast");
  if (!toast) {
    toast = doc.createElement("div");
    toast.className = "aegis-toast";
    doc.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toast._aegisTimer);
  toast._aegisTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function setMessage(container, message, tone = "info") {
  injectStyles(container.ownerDocument || container);
  let node = container.querySelector(".aegis-inline-message");
  if (!node) {
    node = container.ownerDocument.createElement("div");
    node.className = "aegis-inline-message";
    container.appendChild(node);
  }
  node.className = `aegis-inline-message${tone === "success" ? " is-success" : tone === "error" ? " is-error" : ""}`;
  node.textContent = message;
}

function findButton(doc, text) {
  const target = normalizeText(text);
  return Array.from(doc.querySelectorAll("button, a")).find((node) => {
    const label = normalizeText(node.textContent);
    const aria = normalizeText(node.getAttribute("aria-label"));
    return label === target || aria === target || label.includes(target) || target.includes(label);
  }) || null;
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

function pushAction(action) {
  const current = readState();
  patchState({
    recentActions: [
      { action, at: new Date().toISOString() },
      ...current.recentActions,
    ].slice(0, 8),
  });
}

function enhanceHubGallery(doc) {
  if (doc.body.dataset.aegisEnhancedCustodianHub === "true") return;
  doc.body.dataset.aegisEnhancedCustodianHub = "true";
  injectStyles(doc);

  const launchApp = findButton(doc, "Launch App");
  const custodianLogin = findButton(doc, "Custodian Login");
  const applyToJoin = findButton(doc, "Apply to Join");
  const createNewPage = findButton(doc, "Create New Page");
  const editContent = findButton(doc, "Edit Site Content");
  const dynamicUpdates = findButton(doc, "Dynamic Updates");
  const networkHealth = findButton(doc, "Network Health");
  const initiateApplication = findButton(doc, "Initiate Application");
  const nodeAlpha = Array.from(doc.querySelectorAll("p, span, div")).find((node) => normalizeText(node.textContent) === "node alpha");
  const nodeBeta = Array.from(doc.querySelectorAll("p, span, div")).find((node) => normalizeText(node.textContent) === "node beta");
  const excellenceCard = Array.from(doc.querySelectorAll(".rounded-3xl, .rounded-2xl, .rounded-xl, .group, .card")).find((node) => normalizeText(node.textContent).includes("standard of excellence"));

  bindManagedClick(launchApp, () => navigateTo("/custodian-ui/secure/"));
  bindManagedClick(custodianLogin, () => navigateTo("/custodian-ui/custodian-login-portal/"));
  bindManagedClick(applyToJoin, () => navigateTo("/custodian-ui/site-custodian-login-recruitment-hub/"));
  bindManagedClick(createNewPage, () => navigateTo("/custodian-ui/create-new-page-custodian-tool/"));
  bindManagedClick(editContent, () => navigateTo("/custodian-ui/site-custodian-hub-gallery-update/"));
  bindManagedClick(dynamicUpdates, () => {
    pushAction("dynamic-updates");
    showToast(doc, "Dynamic update sweep queued across the Custodian publishing mesh.");
  });
  bindManagedClick(networkHealth, () => navigateTo("/custodian-ui/system-health-report-aegis-protocol/"));
  bindManagedClick(initiateApplication, () => navigateTo("/custodian-ui/site-custodian-login-recruitment-hub/"));
  bindManagedClick(nodeAlpha?.closest("div"), () => navigateTo("/custodian-ui/custodian-cockpit-hud-1/"));
  bindManagedClick(nodeBeta?.closest("div"), () => navigateTo("/custodian-ui/regional-drill-down-us-east-1/"));
  bindManagedClick(excellenceCard, () => {
    excellenceCard.classList.add("aegis-highlight-ring");
    window.setTimeout(() => excellenceCard.classList.remove("aegis-highlight-ring"), 1000);
    showToast(doc, "Custodian oath integrity remains verified for this staging surface.");
  });
}

function enhanceIncidentCenter(doc) {
  if (doc.body.dataset.aegisEnhancedIncidentCenter === "true") return;
  doc.body.dataset.aegisEnhancedIncidentCenter = "true";
  injectStyles(doc);

  const safetyHold = findButton(doc, "Initiate Safety hold");
  const flushDns = findButton(doc, "Flush DNS Cache");
  const rotateKeys = findButton(doc, "Rotate Master Keys");
  const navDashboard = findButton(doc, "Dashboard");
  const navGlobalNodes = findButton(doc, "Global Nodes");
  const navThreatIntel = findButton(doc, "Threat Intelligence");
  const navProtocolConfig = findButton(doc, "Protocol Config");
  const navSupport = findButton(doc, "Support");
  const priorityCards = Array.from(doc.querySelectorAll("h5, h4, h3")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("ddos attack target node-x4") || text.includes("unusual api spike");
  });
  const logger = Array.from(doc.querySelectorAll("div")).find((node) => normalizeText(node.textContent).includes("aegis_live_logger_v4.2"));
  const logLinesContainer = logger?.parentElement?.querySelector("div:last-child") || logger?.parentElement;
  const activeThreats = Array.from(doc.querySelectorAll("h3")).find((node) => /^\d+$/.test((node.textContent || "").trim()));
  const mitigation = Array.from(doc.querySelectorAll("h3")).find((node) => normalizeText(node.textContent).includes("12m"));
  const shield = Array.from(doc.querySelectorAll("h3")).find((node) => normalizeText(node.textContent).includes("98.2"));

  bindManagedClick(navDashboard, () => navigateTo("/custodian-ui/custodian-hub-operations-gallery/"));
  bindManagedClick(navGlobalNodes, () => navigateTo("/custodian-ui/regional-drill-down-us-east-1/"));
  bindManagedClick(navThreatIntel, () => navigateTo("/custodian-ui/security-logs-aegis-protocol/"));
  bindManagedClick(navProtocolConfig, () => navigateTo("/custodian-ui/api-reference-aegis-protocol/"));
  bindManagedClick(navSupport, () => navigateTo("/custodian-ui/ticket-details-aeg-4092/"));

  bindManagedClick(safetyHold, () => {
    pushAction("safety-hold");
    patchState({
      selectedIncident: "INC-88942-B",
      queueCounts: {
        ...readState().queueCounts,
        activeThreats: Math.max(1, readState().queueCounts.activeThreats - 1),
      },
    });
    if (activeThreats) activeThreats.textContent = String(readState().queueCounts.activeThreats);
    if (logLinesContainer) {
      const line = doc.createElement("div");
      line.textContent = `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] HOLD: Safety hold sequence queued for Node-X4 containment.`;
      logLinesContainer.prepend(line);
    }
    showToast(doc, "Safety hold staged. Opening the hold protocol sequence.");
    window.setTimeout(() => navigateTo("/custodian-ui/safety-hold-protocol-sequence/"), 180);
  });
  bindManagedClick(flushDns, () => {
    pushAction("flush-dns");
    if (mitigation) mitigation.textContent = "11m 42s";
    if (logLinesContainer) {
      const line = doc.createElement("div");
      line.textContent = `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] INFO: DNS cache flush propagated through perimeter relays.`;
      logLinesContainer.prepend(line);
    }
    showToast(doc, "DNS cache flush executed across the active perimeter.");
  });
  bindManagedClick(rotateKeys, () => {
    pushAction("rotate-keys");
    if (shield) shield.textContent = "99.1%";
    if (logLinesContainer) {
      const line = doc.createElement("div");
      line.textContent = `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] INFO: Master key rotation completed for incident workspace.`;
      logLinesContainer.prepend(line);
    }
    showToast(doc, "Master keys rotated. Shield integrity is rising.");
  });

  bindManagedClick(priorityCards.find((node) => normalizeText(node.textContent).includes("ddos"))?.closest("div"), () => navigateTo("/custodian-ui/incident-report-aeg-2023-08/"));
  bindManagedClick(priorityCards.find((node) => normalizeText(node.textContent).includes("api spike"))?.closest("div"), () => navigateTo("/custodian-ui/ticket-details-aeg-4092/"));
}

function enhanceGovernance(doc) {
  if (doc.body.dataset.aegisEnhancedCustodianGovernance === "true") return;
  doc.body.dataset.aegisEnhancedCustodianGovernance = "true";
  injectStyles(doc);

  const newProposal = findButton(doc, "New Proposal");
  const allProposals = findButton(doc, "All Proposals");
  const active = findButton(doc, "Active");
  const passed = findButton(doc, "Passed");
  const executed = findButton(doc, "Executed");
  const voteFor = findButton(doc, "For");
  const voteAgainst = findButton(doc, "Against");
  const confirmVote = findButton(doc, "Confirm Vote");
  const viewAll = findButton(doc, "View All");
  const learnMore = findButton(doc, "Learn More");
  const proposalCards = Array.from(doc.querySelectorAll("h1, h2, h3")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("aip-154") || text.includes("aip-153") || text.includes("aip-152");
  });
  let selectedVote = readState().lastVote || "";
  let activeFilter = readState().governanceFilter || "all";

  const applyFilter = (filter) => {
    activeFilter = filter;
    patchState({ governanceFilter: filter });
    proposalCards.forEach((node) => {
      const card = node.closest("div");
      if (!card) return;
      const text = normalizeText(card.textContent);
      const visible = filter === "all"
        || (filter === "active" && (text.includes("voting open") || text.includes("quorum reached")))
        || (filter === "passed" && text.includes("passed"))
        || (filter === "executed" && text.includes("executed"));
      card.classList.toggle("aegis-hidden-row", !visible);
    });
    [allProposals, active, passed, executed].forEach((button) => {
      if (!button) return;
      button.classList.toggle("aegis-active-anchor", normalizeText(button.textContent) === filter || (filter === "all" && normalizeText(button.textContent).includes("all")));
    });
  };

  bindManagedClick(newProposal, () => navigateTo("/custodian-ui/proposal-discussion-details/"));
  bindManagedClick(allProposals, () => applyFilter("all"));
  bindManagedClick(active, () => applyFilter("active"));
  bindManagedClick(passed, () => applyFilter("passed"));
  bindManagedClick(executed, () => applyFilter("executed"));
  bindManagedClick(voteFor, () => {
    selectedVote = "For";
    patchState({ lastVote: selectedVote });
    showToast(doc, "Support vote staged for AIP-154.");
  });
  bindManagedClick(voteAgainst, () => {
    selectedVote = "Against";
    patchState({ lastVote: selectedVote });
    showToast(doc, "Opposition vote staged for AIP-154.");
  });
  bindManagedClick(confirmVote, () => {
    if (!selectedVote) {
      const panel = confirmVote.closest("div");
      if (panel) setMessage(panel, "Choose For or Against before confirming the governance vote.", "error");
      return;
    }
    pushAction(`governance-vote-${selectedVote.toLowerCase()}`);
    const panel = confirmVote.closest("div");
    if (panel) setMessage(panel, `Vote confirmed: ${selectedVote}. Governance action recorded in local Custodian state.`, "success");
    showToast(doc, `AIP-154 vote confirmed: ${selectedVote}.`);
  });
  bindManagedClick(viewAll, () => applyFilter("all"));
  bindManagedClick(learnMore, () => navigateTo("/custodian-ui/site-custodians/"));

  proposalCards.forEach((node) => {
    const text = normalizeText(node.textContent);
    const target = text.includes("aip-154")
      ? "/custodian-ui/proposal-discussion-details/"
      : "/custodian-ui/site-custodian-hub-gallery-update/";
    bindManagedClick(node.closest("div"), () => navigateTo(target));
  });

  applyFilter(activeFilter);
}

const pageEnhancers = {
  "custodian-hub-operations-gallery": enhanceHubGallery,
  "security-incident-assessor-center": enhanceIncidentCenter,
  "decentralized-governance-voting": enhanceGovernance,
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
    // Let the next frame update retry if the iframe is not ready yet.
  }
}

function initCustodianActivation() {
  if (!document.body.classList.contains("domain-custodian-ui")) return;
  const frames = Array.from(document.querySelectorAll(".stitch-frame"));
  if (!frames.length) return;
  frames.forEach((frame) => {
    frame.addEventListener("load", () => enhanceFrame(frame));
    enhanceFrame(frame);
  });
}

window.aegisCustodianActivation = {
  readState,
  patchState,
  enhanceFrame,
};

initCustodianActivation();
