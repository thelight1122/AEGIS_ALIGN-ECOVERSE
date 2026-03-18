const STORAGE_KEY = "aegis.custodian.state";

const DEFAULT_STATE = {
  role: "operator",
  loginProfile: {
    custodianId: "",
    securityKey: "",
    biometric: true,
  },
  recruitmentIntent: "observer",
  incidentFilter: "all",
  selectedIncident: "INC-88942-B",
  lastVote: "",
  governanceFilter: "all",
  reviewDecision: "",
  submissionClaimed: false,
  publishingFilter: "all",
  pageDraft: {
    title: "",
    slug: "",
    category: "Protocol",
    content: "",
    visibility: "Public Protocol",
    seoTitle: "",
    seoDescription: "",
    tags: ["custodian", "protocol"],
  },
  queueCounts: {
    activeThreats: 42,
    mitigationMinutes: 12,
    shieldStrength: 98.2,
  },
  ticketStatus: "in-review",
  ticketLane: "messages",
  lastTicketAction: "",
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
    return;
  }
  if (typeof window.top?.aegisTransit === "function") {
    window.top.aegisTransit(path);
    return;
  }
  window.location.href = path;
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

function findField(doc, matcher) {
  const nodes = Array.from(doc.querySelectorAll("input, textarea, select"));
  if (typeof matcher === "string") {
    const target = normalizeText(matcher);
    return nodes.find((node) => {
      const name = normalizeText(node.name);
      const placeholder = normalizeText(node.getAttribute("placeholder"));
      const aria = normalizeText(node.getAttribute("aria-label"));
      const id = normalizeText(node.id);
      return [name, placeholder, aria, id].some((value) => value && (value === target || value.includes(target)));
    }) || null;
  }
  return nodes.find((node) => matcher(node)) || null;
}

function highlightSelection(nodes, activeNode) {
  nodes.forEach((node) => node?.classList.toggle("aegis-active-anchor", node === activeNode));
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

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferPageSlug() {
  return window.location.pathname.split("/").filter(Boolean).at(-1) || "";
}

function refreshQueueState() {
  const current = readState();
  return current.queueCounts;
}

function enhanceStatusSurface(doc) {
  if (doc.body.dataset.aegisEnhancedPublicStatus === "true") return;
  doc.body.dataset.aegisEnhancedPublicStatus = "true";
  injectStyles(doc);

  const tiles = Array.from(doc.querySelectorAll(".status-tile"));
  const missionTile = tiles.find((node) => normalizeText(node.textContent).includes("mission stability"));
  const coverageTile = tiles.find((node) => normalizeText(node.textContent).includes("custodian coverage"));
  const postureTile = tiles.find((node) => normalizeText(node.textContent).includes("current security posture"));
  const ledger = doc.querySelector(".public-log");
  const ledgerRows = ledger ? Array.from(ledger.querySelectorAll(".log-row")) : [];

  const pulse = doc.createElement("div");
  pulse.className = "aegis-inline-message";
  pulse.style.marginBottom = "18px";
  pulse.style.maxWidth = "420px";
  const panel = doc.querySelector(".panel-container-status");
  panel?.insertBefore(pulse, panel.firstElementChild?.nextSibling || null);

  const render = () => {
    const state = readState();
    const lastAction = state.recentActions[0];
    const connectivity = navigator.onLine ? "Connected" : "Offline";
    const coverage = `${state.recentActions.length} recent actions`;
    const posture = lastAction ? "Active Review" : "Awaiting Live Feed";

    missionTile?.querySelector(".status-number")?.replaceChildren(doc.createTextNode(connectivity));
    coverageTile?.querySelector(".status-number")?.replaceChildren(doc.createTextNode(coverage));
    postureTile?.querySelector(".status-number")?.replaceChildren(doc.createTextNode(posture));

    if (ledgerRows.length) {
      const recent = state.recentActions.slice(0, 3);
      recent.forEach((entry, index) => {
        const row = ledgerRows[index];
        if (!row) return;
        const strong = row.querySelector("strong");
        const span = row.querySelector("span");
        if (strong) strong.textContent = new Date(entry.at).toISOString().slice(0, 10);
        if (span) span.textContent = `Custodian action recorded: ${entry.action.replace(/-/g, " ")}. Public pulse updated for transparency.`;
      });
    }

    pulse.textContent = lastAction
      ? `Public status pulse refreshed at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}. Latest live Custodian action: ${lastAction.action.replace(/-/g, " ")} at ${new Date(lastAction.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`
      : `Public status pulse refreshed at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}. No backend telemetry is connected yet, so only live local Custodian state is shown.`;
  };

  render();
  window.setInterval(() => {
    render();
  }, 6000);
}

function enhanceCustodianLogin(doc) {
  if (doc.body.dataset.aegisEnhancedCustodianLogin === "true") return;
  doc.body.dataset.aegisEnhancedCustodianLogin = "true";
  injectStyles(doc);

  const state = readState();
  const idField = findField(doc, "custodian id") || findField(doc, (node) => node.type === "text");
  const keyField = findField(doc, "security key") || findField(doc, (node) => node.type === "password");
  const biometricField = findField(doc, (node) => node.type === "checkbox");
  const visibilityButton = Array.from(doc.querySelectorAll("button")).find((node) => {
    const label = normalizeText(node.getAttribute("aria-label"));
    return label.includes("show") || label.includes("hide") || normalizeText(node.textContent) === "";
  });
  const authorizeAccess = findButton(doc, "Authorize Access");
  const networkStatus = findButton(doc, "Network Status");
  const help = findButton(doc, "Help");
  const forgot = findButton(doc, "Forgot security credentials?");
  const requestAccess = findButton(doc, "Request Access");
  const formContainer = authorizeAccess?.closest("form, div");

  if (idField) idField.value = state.loginProfile.custodianId || "";
  if (keyField) keyField.value = state.loginProfile.securityKey || "";
  if (biometricField) biometricField.checked = Boolean(state.loginProfile.biometric);

  idField?.addEventListener("input", () => patchState({
    loginProfile: {
      ...readState().loginProfile,
      custodianId: idField.value.trim(),
    },
  }));
  keyField?.addEventListener("input", () => patchState({
    loginProfile: {
      ...readState().loginProfile,
      securityKey: keyField.value,
    },
  }));
  biometricField?.addEventListener("change", () => patchState({
    loginProfile: {
      ...readState().loginProfile,
      biometric: biometricField.checked,
    },
  }));

  bindManagedClick(visibilityButton, () => {
    if (!keyField) return;
    keyField.type = keyField.type === "password" ? "text" : "password";
    showToast(doc, keyField.type === "text" ? "Security key revealed for this session only." : "Security key hidden again.");
  });

  bindManagedClick(networkStatus, () => navigateTo("/custodian-ui/status/"));
  bindManagedClick(help, () => navigateTo("/custodian-ui/site-custodians/"));
  bindManagedClick(forgot, () => {
    if (formContainer) setMessage(formContainer, "Credential recovery routes through Peer Custodian verification. Review the directory and request a reset.", "info");
    showToast(doc, "Recovery guidance opened for Peer Custodian verification.");
    navigateTo("/custodian-ui/site-custodians/");
  });
  bindManagedClick(requestAccess, () => navigateTo("/custodian-ui/site-custodian-login-recruitment-hub/"));
  bindManagedClick(authorizeAccess, () => {
    const custodianId = idField?.value.trim() || "";
    const securityKey = keyField?.value.trim() || "";
    if (!custodianId || securityKey.length < 8) {
      if (formContainer) setMessage(formContainer, "Enter a valid Custodian ID and an 8+ character security key to authorize access.", "error");
      showToast(doc, "Authorization blocked until the access credentials are complete.");
      return;
    }
    patchState({
      loginProfile: {
        custodianId,
        securityKey,
        biometric: biometricField?.checked ?? false,
      },
    });
    pushAction("custodian-login");
    if (formContainer) setMessage(formContainer, `Authorization accepted for ${custodianId}. Routing through the secure gateway now.`, "success");
    showToast(doc, "Custodian authorization accepted.");
    window.setTimeout(() => navigateTo("/custodian-ui/secure/"), 180);
  });
}

function enhanceRecruitmentHub(doc) {
  if (doc.body.dataset.aegisEnhancedRecruitmentHub === "true") return;
  doc.body.dataset.aegisEnhancedRecruitmentHub = "true";
  injectStyles(doc);

  const launchApp = findButton(doc, "Launch App");
  const protocol = findButton(doc, "Protocol");
  const governance = findButton(doc, "Governance");
  const custodians = findButton(doc, "Custodians");
  const ecosystem = findButton(doc, "Ecosystem");
  const custodianLogin = findButton(doc, "Custodian Login");
  const applyToJoin = findButton(doc, "Apply to Join");
  const createNewPage = findButton(doc, "Create New Page");
  const editContent = findButton(doc, "Edit Site Content");
  const dynamicUpdates = findButton(doc, "Dynamic Updates");
  const networkHealth = findButton(doc, "Network Health");
  const initiateButtons = Array.from(doc.querySelectorAll("button, a")).filter((node) => normalizeText(node.textContent).includes("initiate application"));
  const roleCards = Array.from(doc.querySelectorAll("h2, h3, h4")).map((heading) => {
    const text = normalizeText(heading.textContent);
    if (!["coordination & growth", "protocol management", "recruitment portal"].includes(text)) return null;
    return {
      label: text,
      node: heading.closest("section, article") || heading.parentElement,
    };
  }).filter(Boolean);
  const uniqueRoleCards = roleCards.filter((entry, index, list) => list.findIndex((other) => other.label === entry.label) === index);
  const firstActionArea = applyToJoin?.closest("div");

  bindManagedClick(launchApp, () => navigateTo("/custodian-ui/secure/"));
  bindManagedClick(protocol, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(governance, () => navigateTo("/custodian-ui/decentralized-governance-voting/"));
  bindManagedClick(custodians, () => navigateTo("/custodian-ui/site-custodians/"));
  bindManagedClick(ecosystem, () => navigateTo("/aegis-application-lab/"));
  bindManagedClick(custodianLogin, () => navigateTo("/custodian-ui/custodian-login-portal/"));
  bindManagedClick(applyToJoin, () => {
    patchState({ recruitmentIntent: "applicant" });
    pushAction("recruitment-apply");
    if (firstActionArea) setMessage(firstActionArea, "Application intent staged. Choose a recruitment lane below or continue into the secure login gateway.", "success");
    showToast(doc, "Application intake opened for Peer Custodian review.");
  });
  bindManagedClick(createNewPage, () => navigateTo("/custodian-ui/create-new-page-custodian-tool/"));
  bindManagedClick(editContent, () => navigateTo("/custodian-ui/site-custodian-hub-gallery-update/"));
  bindManagedClick(dynamicUpdates, () => {
    pushAction("recruitment-dynamic-updates");
    showToast(doc, "Recruitment update pulse queued across the Custodian mesh.");
  });
  bindManagedClick(networkHealth, () => navigateTo("/custodian-ui/system-health-report-aegis-protocol/"));
  initiateButtons.forEach((button) => bindManagedClick(button, () => {
    patchState({ recruitmentIntent: "applicant" });
    showToast(doc, "Application runway primed. Continue by choosing a Custodian lane.");
  }));

  uniqueRoleCards.forEach(({ label, node }) => {
    bindManagedClick(node, () => {
      const intent = label.includes("coordination") ? "coordination" : label.includes("protocol") ? "protocol" : "recruitment";
      patchState({ recruitmentIntent: intent });
      node.classList.add("aegis-highlight-ring");
      window.setTimeout(() => node.classList.remove("aegis-highlight-ring"), 1000);
      showToast(doc, `${intent[0].toUpperCase()}${intent.slice(1)} lane selected for Peer Custodian intake.`);
    });
  });
}

function enhanceSubmissionReview(doc) {
  if (doc.body.dataset.aegisEnhancedSubmissionReview === "true") return;
  doc.body.dataset.aegisEnhancedSubmissionReview = "true";
  injectStyles(doc);

  const backToQueue = findButton(doc, "Back to Queue");
  const claimSubmission = findButton(doc, "Claim Submission");
  const overview = findButton(doc, "Overview");
  const securityScan = findButton(doc, "Security Scan");
  const codeReview = findButton(doc, "Code Review");
  const metadata = findButton(doc, "Metadata");
  const ignoreButtons = Array.from(doc.querySelectorAll("button, a")).filter((node) => normalizeText(node.textContent) === "ignore");
  const approve = findButton(doc, "Approve Submission");
  const requestChanges = findButton(doc, "Request Changes");
  const rejectBlock = findButton(doc, "Reject & Block");
  const dashboard = findButton(doc, "Dashboard");
  const queue = findButton(doc, "Queue");
  const securityLogs = findButton(doc, "Security Logs");
  const settings = findButton(doc, "Settings");
  const commentField = findField(doc, (node) => node.tagName === "TEXTAREA");
  const copyButton = Array.from(doc.querySelectorAll("button")).find((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("copy") || normalizeText(node.getAttribute("aria-label")).includes("copy");
  });
  const helperClose = Array.from(doc.querySelectorAll("button")).find((node) => {
    const label = normalizeText(node.getAttribute("aria-label"));
    return label.includes("close");
  });
  const tabButtons = [overview, securityScan, codeReview, metadata].filter(Boolean);
  const sections = Array.from(doc.querySelectorAll("section, div")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("security scan") || text.includes("code review") || text.includes("metadata") || text.includes("submission overview") || text.includes("reviewer comments");
  });
  const mainPanel = approve?.closest("div");
  const liveReviewCount = doc.querySelector("[data-live-review-count]");

  const render = () => {
    const state = readState();
    if (liveReviewCount) {
      liveReviewCount.textContent = String(Math.max(1, state.recentActions.length));
    }
    if (state.reviewDecision && mainPanel) {
      setMessage(mainPanel, `Previous local review state: ${state.reviewDecision}.`, "info");
    }
  };

  const showSection = (mode) => {
    highlightSelection(tabButtons, ({
      overview,
      "security scan": securityScan,
      "code review": codeReview,
      metadata,
    })[mode]);
    sections.forEach((section) => {
      const text = normalizeText(section.textContent);
      const visible = mode === "overview"
        ? !text.includes("security scan") && !text.includes("code review") && !text.includes("metadata")
        : text.includes(mode);
      section.classList.toggle("aegis-hidden-row", !visible);
    });
  };

  bindManagedClick(backToQueue, () => navigateTo("/custodian-ui/custodian-hub-operations-gallery/"));
  bindManagedClick(claimSubmission, () => {
    patchState({ submissionClaimed: true });
    pushAction("claim-submission");
    if (mainPanel) setMessage(mainPanel, "Submission claimed for your review lane. Decision controls are now active.", "success");
    showToast(doc, "Submission claimed for Peer Custodian review.");
  });
  bindManagedClick(overview, () => showSection("overview"));
  bindManagedClick(securityScan, () => showSection("security scan"));
  bindManagedClick(codeReview, () => showSection("code review"));
  bindManagedClick(metadata, () => showSection("metadata"));
  ignoreButtons.forEach((button, index) => bindManagedClick(button, () => {
    const issue = button.closest("div, li");
    issue?.classList.add("aegis-hidden-row");
    pushAction(`ignore-review-issue-${index + 1}`);
    showToast(doc, "Review finding marked as ignored for this local session.");
  }));
  bindManagedClick(copyButton, async () => {
    const codeBlock = Array.from(doc.querySelectorAll("pre, code")).find((node) => node.textContent?.trim());
    if (!codeBlock) return;
    try {
      await navigator.clipboard.writeText(codeBlock.textContent.trim());
      showToast(doc, "Code sample copied to the clipboard.");
    } catch {
      showToast(doc, "Clipboard copy was blocked by the browser.");
    }
  });
  bindManagedClick(dashboard, () => navigateTo("/custodian-ui/custodian-hub-operations-gallery/"));
  bindManagedClick(queue, () => navigateTo("/custodian-ui/submission-review-interface/"));
  bindManagedClick(securityLogs, () => navigateTo("/custodian-ui/security-logs-aegis-protocol/"));
  bindManagedClick(settings, () => navigateTo("/custodian-ui/site-custodians/"));
  bindManagedClick(helperClose, () => {
    const helper = helperClose.closest("div");
    helper?.classList.add("aegis-hidden-row");
  });

  const completeDecision = (decision, tone, route) => {
    if (!readState().submissionClaimed && decision !== "request-changes") {
      if (mainPanel) setMessage(mainPanel, "Claim the submission before issuing a final decision.", "error");
      showToast(doc, "Claim this submission before sending a final verdict.");
      return;
    }
    if (!commentField?.value.trim()) {
      if (mainPanel) setMessage(mainPanel, "Add reviewer comments so the decision record stays coherent.", "error");
      showToast(doc, "Reviewer comments are required before finalizing this decision.");
      return;
    }
    patchState({ reviewDecision: decision });
    pushAction(`submission-${decision}`);
    if (mainPanel) setMessage(mainPanel, `Submission decision recorded: ${decision}. Routing to the next Custodian step.`, tone);
    showToast(doc, `Submission ${decision.replace("-", " ")} recorded.`);
    window.setTimeout(() => navigateTo(route), 180);
  };

  bindManagedClick(approve, () => completeDecision("approved", "success", "/custodian-ui/custodian-hub-operations-gallery/"));
  bindManagedClick(requestChanges, () => completeDecision("request-changes", "info", "/custodian-ui/site-custodian-hub-gallery-update/"));
  bindManagedClick(rejectBlock, () => completeDecision("rejected-and-blocked", "error", "/custodian-ui/security-incident-assessor-center/"));

  render();
  showSection("overview");
}

function renderPreview(doc, previewBox, draft) {
  previewBox.innerHTML = `
    <div style="display:grid; gap:12px;">
      <div>
        <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; opacity:0.7;">Preview</div>
        <h3 style="margin:6px 0 0;">${draft.title || "Untitled Custodian Surface"}</h3>
        <div style="font-size:12px; opacity:0.72; margin-top:4px;">/${draft.slug || "draft-slug"} · ${draft.category || "Protocol"} · ${draft.visibility || "Public Protocol"}</div>
      </div>
      <div style="padding:14px; border-radius:14px; border:1px solid rgba(34,211,238,0.18); background:rgba(8,17,31,0.35); white-space:pre-wrap; line-height:1.6;">${(draft.content || "Start writing the new Custodian page to preview it here.").replace(/[<>&]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[char]))}</div>
      <div style="font-size:12px; opacity:0.76;">SEO title: ${draft.seoTitle || "Not set yet"} | Tags: ${(draft.tags || []).join(", ") || "None"}</div>
    </div>
  `;
}

function enhanceCreatePageTool(doc) {
  if (doc.body.dataset.aegisEnhancedCreatePage === "true") return;
  doc.body.dataset.aegisEnhancedCreatePage = "true";
  injectStyles(doc);

  const state = readState();
  const draft = { ...state.pageDraft };
  const dashboard = findButton(doc, "Dashboard");
  const sitePages = findButton(doc, "Site Pages");
  const custodians = findButton(doc, "Custodians");
  const settings = findButton(doc, "Settings");
  const discard = findButton(doc, "Discard");
  const publishProtocol = findButton(doc, "Publish to Protocol");
  const saveDraft = findButton(doc, "Save Draft");
  const previewButton = Array.from(doc.querySelectorAll("button, a")).find((node) => normalizeText(node.textContent) === "preview");
  const publishMainnet = findButton(doc, "Publish to Mainnet");
  const writeMode = findButton(doc, "Write");
  const previewMode = Array.from(doc.querySelectorAll("button, a")).find((node) => normalizeText(node.textContent) === "preview");
  const addTag = findButton(doc, "Add Tag");
  const supportDocs = findButton(doc, "Support Docs");
  const styleGuide = findButton(doc, "Style Guide");
  const communityForum = findButton(doc, "Community Forum");
  const changelog = findButton(doc, "Changelog");
  const toolbarButtons = Array.from(doc.querySelectorAll("button")).filter((node) => {
    const label = normalizeText(node.getAttribute("aria-label"));
    const text = normalizeText(node.textContent);
    return ["bold", "italic", "link", "h1", "list", "code", "image"].some((name) => label.includes(name) || text === name);
  });
  const titleField = findField(doc, (node) => {
    const placeholder = normalizeText(node.placeholder);
    return placeholder.includes("page title") || placeholder.includes("understanding node validation");
  });
  const slugField = findField(doc, (node) => {
    const placeholder = normalizeText(node.placeholder);
    return placeholder.includes("slug") || placeholder.includes("protocol-validation");
  });
  const categoryField = findField(doc, (node) => node.tagName === "SELECT");
  const contentField = findField(doc, (node) => node.tagName === "TEXTAREA");
  const seoTitle = findField(doc, (node) => {
    const placeholder = normalizeText(node.placeholder);
    return placeholder.includes("seo title") || placeholder.includes("understanding aegis protocol validation");
  });
  const seoDescription = Array.from(doc.querySelectorAll("textarea, input")).find((node) => {
    const placeholder = normalizeText(node.placeholder);
    return placeholder.includes("seo description") || placeholder.includes("comprehensive guide");
  }) || null;
  const visibilityOptions = Array.from(doc.querySelectorAll("input[type='radio']"));
  const tagsContainer = addTag?.closest("div")?.parentElement;
  const editorContainer = contentField?.closest("div");
  let previewBox = editorContainer?.querySelector(".aegis-inline-preview");

  if (titleField) titleField.value = draft.title;
  if (slugField) slugField.value = draft.slug;
  if (categoryField && draft.category) categoryField.value = draft.category;
  if (contentField) contentField.value = draft.content;
  if (seoTitle) seoTitle.value = draft.seoTitle;
  if (seoDescription) seoDescription.value = draft.seoDescription;
  visibilityOptions.forEach((option) => {
    option.checked = normalizeText(option.value || option.id) === normalizeText(draft.visibility);
  });

  const persistDraft = () => patchState({
    pageDraft: {
      title: titleField?.value.trim() || "",
      slug: slugField?.value.trim() || "",
      category: categoryField?.value || "Protocol",
      content: contentField?.value || "",
      visibility: visibilityOptions.find((option) => option.checked)?.value || visibilityOptions.find((option) => option.checked)?.id || "Public Protocol",
      seoTitle: seoTitle?.value.trim() || "",
      seoDescription: seoDescription?.value.trim() || "",
      tags: readState().pageDraft.tags || [],
    },
  });

  const ensurePreview = () => {
    if (previewBox || !editorContainer) return previewBox;
    previewBox = doc.createElement("div");
    previewBox.className = "aegis-inline-message aegis-inline-preview";
    previewBox.style.display = "none";
    editorContainer.appendChild(previewBox);
    return previewBox;
  };

  titleField?.addEventListener("input", () => {
    if (slugField && !slugField.value.trim()) slugField.value = slugify(titleField.value);
    persistDraft();
  });
  [slugField, categoryField, contentField, seoTitle, seoDescription].forEach((field) => field?.addEventListener("input", persistDraft));
  visibilityOptions.forEach((option) => option.addEventListener("change", persistDraft));

  bindManagedClick(dashboard, () => navigateTo("/custodian-ui/custodian-hub-operations-gallery/"));
  bindManagedClick(sitePages, () => navigateTo("/custodian-ui/site-custodian-hub-gallery-update/"));
  bindManagedClick(custodians, () => navigateTo("/custodian-ui/site-custodians/"));
  bindManagedClick(settings, () => navigateTo("/custodian-ui/site-custodians/"));
  bindManagedClick(discard, () => {
    patchState({ pageDraft: { ...DEFAULT_STATE.pageDraft } });
    if (titleField) titleField.value = "";
    if (slugField) slugField.value = "";
    if (contentField) contentField.value = "";
    if (seoTitle) seoTitle.value = "";
    if (seoDescription) seoDescription.value = "";
    showToast(doc, "Draft discarded from local Custodian state.");
  });
  bindManagedClick(saveDraft, () => {
    persistDraft();
    pushAction("save-custodian-draft");
    showToast(doc, "Draft saved locally for the Custodian publishing flow.");
  });
  bindManagedClick(publishProtocol, () => {
    const next = persistDraft();
    pushAction("publish-protocol");
    if (editorContainer) setMessage(editorContainer, `Protocol publish queued for ${next.pageDraft.title || "Untitled Custodian Surface"}.`, "success");
    showToast(doc, "Protocol publish queued for review.");
  });
  bindManagedClick(publishMainnet, () => {
    const next = persistDraft();
    pushAction("publish-mainnet");
    if (editorContainer) setMessage(editorContainer, `Mainnet publish staged for ${next.pageDraft.title || "Untitled Custodian Surface"}. Reviewers will receive the package next.`, "success");
    showToast(doc, "Mainnet publish staged for Peer Custodian approval.");
    window.setTimeout(() => navigateTo("/custodian-ui/submission-review-interface/"), 180);
  });
  bindManagedClick(writeMode, () => {
    highlightSelection([writeMode, previewMode], writeMode);
    if (contentField) contentField.style.display = "";
    ensurePreview().style.display = "none";
  });
  bindManagedClick(previewButton, () => {
    const next = persistDraft();
    highlightSelection([writeMode, previewMode], previewMode);
    if (contentField) contentField.style.display = "none";
    const box = ensurePreview();
    box.style.display = "block";
    renderPreview(doc, box, next.pageDraft);
    showToast(doc, "Preview rendered from the current Custodian draft.");
  });
  toolbarButtons.forEach((button) => bindManagedClick(button, () => {
    if (!contentField) return;
    const label = normalizeText(button.getAttribute("aria-label") || button.textContent);
    const snippet = label.includes("bold")
      ? "**bold emphasis**"
      : label.includes("italic")
        ? "_italic emphasis_"
        : label.includes("link")
          ? "[linked reference](https://app.aegisalign.com)"
          : label === "h1"
            ? "# Custodian Heading"
            : label.includes("list")
              ? "- First item\n- Second item"
              : label.includes("code")
                ? "```txt\ncustodian protocol snippet\n```"
                : "![Protocol image](https://app.aegisalign.com/favicon.ico)";
    contentField.value = `${contentField.value}${contentField.value ? "\n\n" : ""}${snippet}`;
    persistDraft();
    showToast(doc, `${label.toUpperCase()} snippet inserted into the draft.`);
  }));
  bindManagedClick(addTag, () => {
    const nextTag = window.prompt("Add a Custodian tag", "governance");
    if (!nextTag) return;
    const current = readState().pageDraft.tags || [];
    const tags = [...new Set([...current, nextTag.trim()])];
    patchState({ pageDraft: { ...readState().pageDraft, tags } });
    if (tagsContainer) setMessage(tagsContainer, `Tag added: ${nextTag.trim()}.`, "success");
    showToast(doc, `Tag ${nextTag.trim()} added to the draft.`);
  });
  bindManagedClick(supportDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(styleGuide, () => navigateTo("/custodian-ui/site-custodian-hub-gallery-update/"));
  bindManagedClick(communityForum, () => navigateTo("/developer-depot/developer-hub-depot/"));
  bindManagedClick(changelog, () => navigateTo("/custodian-ui/submission-review-interface/"));

  highlightSelection([writeMode, previewMode], writeMode);
}

function enhancePublishingSurface(doc) {
  if (doc.body.dataset.aegisEnhancedPublishingSurface === "true") return;
  doc.body.dataset.aegisEnhancedPublishingSurface = "true";
  injectStyles(doc);

  const launchApp = findButton(doc, "Launch App");
  const protocol = findButton(doc, "Protocol");
  const governance = findButton(doc, "Governance");
  const custodians = findButton(doc, "Custodians");
  const ecosystem = findButton(doc, "Ecosystem");
  const openPublishingQueue = findButton(doc, "Open Publishing Queue");
  const stageReleaseReview = findButton(doc, "Stage Release Review");
  const allPackages = findButton(doc, "All Packages");
  const needsReview = findButton(doc, "Needs Review");
  const validated = Array.from(doc.querySelectorAll("button, a")).find((node) => normalizeText(node.textContent) === "validated");
  const readyToSync = findButton(doc, "Ready to Sync");
  const reviewPackage = findButton(doc, "Review Package");
  const previewRelease = findButton(doc, "Preview Release");
  const routeToGovernance = findButton(doc, "Route to Governance");
  const openInEditor = findButton(doc, "Open In Editor");
  const syncToMesh = findButton(doc, "Sync to Mesh");
  const openIntegrityNotes = findButton(doc, "Open Integrity Notes");
  const sendBackToDraft = findButton(doc, "Send Back To Draft");
  const runValidationSweep = findButton(doc, "Run Validation Sweep");
  const openDraftEditor = Array.from(doc.querySelectorAll("button, a")).find((node) => normalizeText(node.textContent) === "open draft editor");
  const reviewPending = findButton(doc, "Review pending submissions");
  const openPublishingGuide = findButton(doc, "Open publishing guide");
  const syncDynamicUpdates = findButton(doc, "Sync dynamic updates");
  const filterButtons = [allPackages, needsReview, validated, readyToSync].filter(Boolean);
  const queueCards = Array.from(doc.querySelectorAll("article"));
  const heroPanel = openPublishingQueue?.closest("section");
  const validationPanel = runValidationSweep?.closest("section");
  const publishingSync = doc.querySelector("[data-live-publishing-sync]");
  const publishingSyncCopy = doc.querySelector("[data-live-publishing-sync-copy]");

  const render = () => {
    const state = readState();
    if (publishingSync) publishingSync.textContent = navigator.onLine ? "Local" : "Offline";
    if (publishingSyncCopy) {
      publishingSyncCopy.textContent = state.recentActions.length
        ? `${state.recentActions.length} local Custodian action${state.recentActions.length === 1 ? "" : "s"} recorded. Backend publishing telemetry is still pending.`
        : "Backend publishing telemetry is not connected. Showing local Custodian state only.";
    }
  };

  const applyFilter = (filter) => {
    patchState({ publishingFilter: filter });
    highlightSelection(filterButtons, ({
      all: allPackages,
      "needs-review": needsReview,
      validated,
      "ready-to-sync": readyToSync,
    })[filter] || allPackages);

    queueCards.forEach((card) => {
      const text = normalizeText(card.textContent);
      const visible = filter === "all"
        || (filter === "needs-review" && text.includes("needs review"))
        || (filter === "validated" && text.includes("validated"))
        || (filter === "ready-to-sync" && (text.includes("validated") || text.includes("mesh")));
      card.classList.toggle("aegis-hidden-row", !visible);
    });
  };

  bindManagedClick(launchApp, () => navigateTo("/custodian-ui/secure/"));
  bindManagedClick(protocol, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(governance, () => navigateTo("/custodian-ui/decentralized-governance-voting/"));
  bindManagedClick(custodians, () => navigateTo("/custodian-ui/site-custodians/"));
  bindManagedClick(ecosystem, () => navigateTo("/aegis-application-lab/"));

  bindManagedClick(openPublishingQueue, () => {
    pushAction("open-publishing-queue");
    if (heroPanel) setMessage(heroPanel, "Publishing queue aligned. Review-ready packages are highlighted for the next Custodian pass.", "success");
    applyFilter("needs-review");
    showToast(doc, "Publishing queue focused on review-ready packages.");
  });
  bindManagedClick(stageReleaseReview, () => {
    pushAction("stage-release-review");
    if (heroPanel) setMessage(heroPanel, "Release review staged. Governance-sensitive updates can now be routed into proposal review.", "success");
    showToast(doc, "Release review staged for Peer Custodian handling.");
  });

  bindManagedClick(allPackages, () => applyFilter("all"));
  bindManagedClick(needsReview, () => applyFilter("needs-review"));
  bindManagedClick(validated, () => applyFilter("validated"));
  bindManagedClick(readyToSync, () => applyFilter("ready-to-sync"));

  bindManagedClick(reviewPackage, () => navigateTo("/custodian-ui/submission-review-interface/"));
  bindManagedClick(previewRelease, () => navigateTo("/custodian-ui/create-new-page-custodian-tool/"));
  bindManagedClick(routeToGovernance, () => {
    pushAction("route-publishing-governance");
    showToast(doc, "Publishing package routed into governance review.");
    navigateTo("/custodian-ui/decentralized-governance-voting/");
  });
  bindManagedClick(openInEditor, () => navigateTo("/custodian-ui/create-new-page-custodian-tool/"));
  bindManagedClick(syncToMesh, () => {
    pushAction("sync-publishing-mesh");
    showToast(doc, "Validated package queued for governed mesh sync.");
  });
  bindManagedClick(openIntegrityNotes, () => navigateTo("/custodian-ui/security-incident-assessor-center/"));
  bindManagedClick(sendBackToDraft, () => {
    pushAction("send-back-to-draft");
    showToast(doc, "Package sent back into the draft lane.");
    navigateTo("/custodian-ui/create-new-page-custodian-tool/");
  });

  bindManagedClick(runValidationSweep, () => {
    pushAction("run-validation-sweep");
    if (validationPanel) setMessage(validationPanel, "Validation sweep complete. Governance alignment passed, publishing diff review remains under watch.", "success");
    showToast(doc, "Validation sweep completed for staged publishing packages.");
  });
  bindManagedClick(openDraftEditor, () => navigateTo("/custodian-ui/create-new-page-custodian-tool/"));
  bindManagedClick(reviewPending, () => navigateTo("/custodian-ui/submission-review-interface/"));
  bindManagedClick(openPublishingGuide, () => navigateTo("/nexus/aegis-governance-hub/"));
  bindManagedClick(syncDynamicUpdates, () => {
    pushAction("sync-dynamic-updates");
    showToast(doc, "Dynamic update sync queued across Custodian publishing surfaces.");
  });

  render();
  applyFilter(readState().publishingFilter || "all");
}

function enhanceRegionalDrilldown(doc) {
  if (doc.body.dataset.aegisEnhancedRegionalDrilldown === "true") return;
  doc.body.dataset.aegisEnhancedRegionalDrilldown = "true";
  injectStyles(doc);

  const dashboard = findButton(doc, "Dashboard");
  const regions = findButton(doc, "Regions");
  const security = findButton(doc, "Security");
  const logs = findButton(doc, "Logs");
  const settings = findButton(doc, "Settings");
  const notifications = Array.from(doc.querySelectorAll("button")).find((node) => normalizeText(node.textContent).includes("notifications"));
  const refresh = Array.from(doc.querySelectorAll("button")).find((node) => normalizeText(node.textContent).includes("refresh"));
  const search = findField(doc, (node) => normalizeText(node.placeholder).includes("search nodes or logs"));
  const regionLog = findButton(doc, "View Full Region Log");
  const nodeCards = Array.from(doc.querySelectorAll("h4")).map((heading) => heading.closest("div")).filter(Boolean);
  const incidentItems = Array.from(doc.querySelectorAll("[data-live-region-activity-row]"));
  const metricCards = Array.from(doc.querySelectorAll("[data-live-region-metric]")).map((node) => node.closest("div")).filter(Boolean);
  const connectivityMetric = doc.querySelector("[data-live-region-metric='connectivity']");
  const connectivityDetail = doc.querySelector("[data-live-region-detail='connectivity']");
  const actionsMetric = doc.querySelector("[data-live-region-metric='actions']");
  const actionsDetail = doc.querySelector("[data-live-region-detail='actions']");
  const pulseMetric = doc.querySelector("[data-live-region-metric='pulse']");
  const pulseDetail = doc.querySelector("[data-live-region-detail='pulse']");
  const nodeTracked = doc.querySelector("[data-live-region-node-count='tracked']");
  const nodeFocused = doc.querySelector("[data-live-region-node-count='focused']");
  const feedState = doc.querySelector("[data-live-region-feed-state]");
  const lastAction = doc.querySelector("[data-live-region-last-action]");
  const badge = doc.querySelector("[data-live-region-badge]");
  const nodeLoads = Array.from(doc.querySelectorAll("[data-live-node-load]"));

  bindManagedClick(dashboard, () => navigateTo("/custodian-ui/custodian-hub-operations-gallery/"));
  bindManagedClick(regions, () => navigateTo("/custodian-ui/regional-drill-down-us-east-1/"));
  bindManagedClick(security, () => navigateTo("/custodian-ui/security-incident-assessor-center/"));
  bindManagedClick(logs, () => navigateTo("/custodian-ui/security-logs-aegis-protocol/"));
  bindManagedClick(settings, () => navigateTo("/custodian-ui/site-custodians/"));
  bindManagedClick(notifications, () => showToast(doc, "Regional watch alerts acknowledged for US-EAST-1."));
  bindManagedClick(refresh, () => {
    renderRegionalTruth();
    showToast(doc, "Regional review refreshed from live local Custodian state.");
  });
  bindManagedClick(regionLog, () => navigateTo("/custodian-ui/system-health-report-aegis-protocol/"));

  search?.addEventListener("input", () => {
    const query = normalizeText(search.value);
    nodeCards.forEach((card) => {
      card.classList.toggle("aegis-hidden-row", query && !normalizeText(card.textContent).includes(query));
    });
    incidentItems.forEach((item) => item.classList.toggle("aegis-hidden-row", query && !normalizeText(item.textContent).includes(query)));
  });

  nodeCards.forEach((card) => bindManagedClick(card, () => {
    nodeCards.forEach((entry) => entry.classList.remove("aegis-highlight-ring"));
    card.classList.add("aegis-highlight-ring");
    showToast(doc, `${card.querySelector("h4")?.textContent || "Node"} selected for focused regional review.`);
  }));
  incidentItems.forEach((item) => bindManagedClick(item, () => navigateTo("/custodian-ui/security-incident-assessor-center/")));
  metricCards.forEach((label) => bindManagedClick(label.closest("div"), () => {
    renderRegionalTruth();
    showToast(doc, "Regional metric pulse refreshed from local state.");
  }));

  const renderRegionalTruth = () => {
    const state = readState();
    const online = navigator.onLine;
    const latest = state.recentActions[0] || null;

    if (badge) badge.textContent = online ? "Live Local" : "Offline";
    if (connectivityMetric) connectivityMetric.textContent = online ? "Online" : "Offline";
    if (connectivityDetail) connectivityDetail.textContent = online ? "Browser connected" : "Reconnect required";
    if (actionsMetric) actionsMetric.textContent = String(state.recentActions.length);
    if (actionsDetail) actionsDetail.textContent = latest ? "Derived from local Custodian actions" : "No actions recorded yet";
    if (pulseMetric) pulseMetric.textContent = latest
      ? new Date(latest.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "--";
    if (pulseDetail) pulseDetail.textContent = latest ? latest.action.replace(/-/g, " ") : "Current session";
    if (nodeTracked) nodeTracked.textContent = String(nodeCards.length);
    if (nodeFocused) nodeFocused.textContent = String(nodeCards.filter((card) => card.classList.contains("aegis-highlight-ring")).length);
    if (feedState) feedState.textContent = "Pending backend connection";
    if (lastAction) lastAction.textContent = latest ? latest.action.replace(/-/g, " ") : "None recorded";

    nodeLoads.forEach((node, index) => {
      const entry = state.recentActions[index];
      node.textContent = entry ? `Linked to ${entry.action.replace(/-/g, " ")}` : index === 3 ? "No local activity" : "Awaiting local review";
    });

    incidentItems.forEach((row, index) => {
      const entry = state.recentActions[index];
      if (!entry) return;
      const date = row.querySelector("[data-live-region-activity-date]");
      const title = row.querySelector("[data-live-region-activity-title]");
      const copy = row.querySelector("[data-live-region-activity-copy]");
      if (date) date.textContent = new Date(entry.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      if (title) title.textContent = entry.action.replace(/-/g, " ");
      if (copy) copy.textContent = "Recorded from live local Custodian state in this browser session.";
    });
  };

  renderRegionalTruth();
  window.setInterval(renderRegionalTruth, 15000);
}

function enhanceSecurityLogs(doc) {
  if (doc.body.dataset.aegisEnhancedSecurityLogs === "true") return;
  doc.body.dataset.aegisEnhancedSecurityLogs = "true";
  injectStyles(doc);

  const overview = findButton(doc, "Overview");
  const shields = findButton(doc, "Shields");
  const network = findButton(doc, "Network");
  const deployments = findButton(doc, "Deployments");
  const logs = findButton(doc, "Security Logs");
  const settings = findButton(doc, "Settings");
  const search = findField(doc, (node) => normalizeText(node.placeholder).includes("search live local log notes"));
  const apply = findButton(doc, "Apply");
  const viewDetails = Array.from(doc.querySelectorAll("button")).filter((node) => normalizeText(node.textContent).includes("open case") || normalizeText(node.textContent).includes("view details"));
  const connectivityMetric = doc.querySelector("[data-live-log-metric='connectivity']");
  const connectivityDetail = doc.querySelector("[data-live-log-detail='connectivity']");
  const actionsMetric = doc.querySelector("[data-live-log-metric='actions']");
  const actionsDetail = doc.querySelector("[data-live-log-detail='actions']");
  const archiveMetric = doc.querySelector("[data-live-log-metric='archive']");
  const archiveDetail = doc.querySelector("[data-live-log-detail='archive']");
  const pulseMetric = doc.querySelector("[data-live-log-metric='pulse']");
  const rows = Array.from(doc.querySelectorAll("tbody tr"));

  bindManagedClick(overview, () => navigateTo("/custodian-ui/custodian-hub-operations-gallery/"));
  bindManagedClick(shields, () => navigateTo("/custodian-ui/system-health-report-aegis-protocol/"));
  bindManagedClick(network, () => navigateTo("/custodian-ui/regional-drill-down-us-east-1/"));
  bindManagedClick(deployments, () => navigateTo("/custodian-ui/site-custodian-hub-gallery-update/"));
  bindManagedClick(logs, () => navigateTo("/custodian-ui/security-logs-aegis-protocol/"));
  bindManagedClick(settings, () => navigateTo("/custodian-ui/site-custodians/"));
  bindManagedClick(apply, () => {
    renderSecurityLogsTruth();
    showToast(doc, "Security log view refreshed from current local state.");
  });

  search?.addEventListener("input", () => {
    const query = normalizeText(search.value);
    rows.forEach((row) => row.classList.toggle("aegis-hidden-row", query && !normalizeText(row.textContent).includes(query)));
  });

  viewDetails.forEach((button) => bindManagedClick(button, () => navigateTo("/custodian-ui/ticket-details-aeg-4092/")));

  const renderSecurityLogsTruth = () => {
    const state = readState();
    const online = navigator.onLine;
    const latest = state.recentActions[0] || null;

    if (connectivityMetric) connectivityMetric.textContent = online ? "Online" : "Offline";
    if (connectivityDetail) connectivityDetail.textContent = online ? "Browser signal live" : "Reconnect required";
    if (actionsMetric) actionsMetric.textContent = String(state.recentActions.length);
    if (actionsDetail) actionsDetail.textContent = latest ? "Local actions indexed" : "No local actions indexed";
    if (archiveMetric) archiveMetric.textContent = "Pending";
    if (archiveDetail) archiveDetail.textContent = "Backend archive feed required";
    if (pulseMetric) pulseMetric.textContent = latest
      ? new Date(latest.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "--";

    rows.forEach((row, index) => {
      const entry = state.recentActions[index];
      if (!entry) {
        row.classList.toggle("aegis-hidden-row", index > 0);
        return;
      }
      row.classList.remove("aegis-hidden-row");
      const cells = row.querySelectorAll("td");
      if (cells[0]) cells[0].textContent = new Date(entry.at).toLocaleString("en-US", { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" });
      const title = row.querySelector("[data-live-log-title]");
      if (title) title.textContent = entry.action.replace(/-/g, " ");
      if (cells[2]) cells[2].textContent = "LOCAL-WORKSPACE";
      const severity = row.querySelector("[data-live-log-severity]");
      if (severity) severity.textContent = "Recorded";
    });
  };

  renderSecurityLogsTruth();
  window.setInterval(renderSecurityLogsTruth, 15000);
}

function enhanceIncidentReport(doc) {
  if (doc.body.dataset.aegisEnhancedIncidentReport === "true") return;
  doc.body.dataset.aegisEnhancedIncidentReport = "true";
  injectStyles(doc);

  const notifications = Array.from(doc.querySelectorAll("button")).find((node) => normalizeText(node.textContent).includes("notifications"));
  const share = Array.from(doc.querySelectorAll("button")).find((node) => normalizeText(node.textContent).includes("share"));
  const exportPdf = findButton(doc, "Export PDF");
  const status = doc.querySelector("[data-live-incident-status]");
  const metricStatus = doc.querySelector("[data-live-incident-metric='status']");
  const metricActions = doc.querySelector("[data-live-incident-metric='actions']");
  const metricPulse = doc.querySelector("[data-live-incident-metric='pulse']");
  const metricFeed = doc.querySelector("[data-live-incident-metric='feed']");
  const summary = doc.querySelector("[data-live-incident-summary]");
  const timelineTitle = doc.querySelector("[data-live-incident-timeline-title]");
  const timelineTime = doc.querySelector("[data-live-incident-timeline-time]");

  bindManagedClick(notifications, () => showToast(doc, "Incident case watch notifications acknowledged."));
  bindManagedClick(share, () => navigateTo("/custodian-ui/decentralized-governance-voting/"));
  bindManagedClick(exportPdf, () => showToast(doc, "Export is disabled until a verified backend case feed is attached."));

  const renderIncidentTruth = () => {
    const state = readState();
    const latest = state.recentActions[0] || null;
    if (status) status.textContent = latest ? "Live Local" : "Backend Pending";
    if (metricStatus) metricStatus.textContent = state.lastTicketAction ? "In Review" : "Open";
    if (metricActions) metricActions.textContent = String(state.recentActions.length);
    if (metricPulse) metricPulse.textContent = latest
      ? new Date(latest.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "--";
    if (metricFeed) metricFeed.textContent = "Pending";
    if (summary) summary.textContent = latest
      ? `Latest local Custodian action recorded: ${latest.action.replace(/-/g, " ")}. This case remains truth-first until a real evidence backend is connected.`
      : "This case records a governed Custodian review lane. No backend incident evidence is connected yet, so this surface only reflects local Custodian activity, routing, and review state.";
    if (timelineTitle) timelineTitle.textContent = latest ? latest.action.replace(/-/g, " ") : "Awaiting verified case state";
    if (timelineTime) timelineTime.textContent = latest
      ? new Date(latest.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
      : "No backend timestamp";
  };

  renderIncidentTruth();
  window.setInterval(renderIncidentTruth, 15000);
}

function enhanceOperationsCockpit(doc) {
  if (doc.body.dataset.aegisEnhancedOperationsCockpit === "true") return;
  doc.body.dataset.aegisEnhancedOperationsCockpit = "true";
  injectStyles(doc);

  const buttons = Array.from(doc.querySelectorAll("button"));
  const terminal = Array.from(doc.querySelectorAll("button")).find((node) => normalizeText(node.textContent).includes("terminal"));
  const notifications = Array.from(doc.querySelectorAll("button")).find((node) => normalizeText(node.textContent).includes("notifications"));
  const warning = Array.from(doc.querySelectorAll("button")).find((node) => normalizeText(node.textContent).includes("warning"));
  const emergencyStop = findButton(doc, "Emergency Stop");
  const override = findButton(doc, "Protocol Override");
  const syncLines = Array.from(doc.querySelectorAll("div.text-accent-cyan\\/80, div.text-slate-400, div.text-accent-amber, div.text-primary")).filter((node) => node.textContent.includes(">"));
  const metrics = Array.from(doc.querySelectorAll("p.text-3xl"));
  const ringValues = Array.from(doc.querySelectorAll("span.text-xs.font-bold.font-mono.text-white"));
  const nodeStats = Array.from(doc.querySelectorAll("div")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("active nodes") || text.includes("geo replication") || text.includes("uptime");
  }).map((node) => Array.from(node.querySelectorAll("span")).at(-1)).filter(Boolean);

  bindManagedClick(terminal, () => navigateTo("/developer-depot/developer-console-aegis-protocol/"));
  bindManagedClick(notifications, () => showToast(doc, "Operations cockpit alerts acknowledged."));
  bindManagedClick(warning, () => navigateTo("/custodian-ui/security-incident-assessor-center/"));
  bindManagedClick(emergencyStop, () => {
    pushAction("operations-emergency-stop");
    showToast(doc, "Emergency stop recorded locally. No backend control plane is connected.");
  });
  bindManagedClick(override, () => navigateTo("/custodian-ui/secure/"));
  buttons.forEach((button) => {
    const text = normalizeText(button.textContent);
    if (text.includes("emergency stop") || text.includes("protocol override")) return;
    if (text.includes("terminal") || text.includes("notifications") || text.includes("warning")) return;
    bindManagedClick(button, () => showToast(doc, "This cockpit action is currently limited to live local state."));
  });

  const renderCockpitTruth = () => {
    const state = readState();
    const latest = state.recentActions[0] || null;
    if (syncLines[0]) syncLines[0].textContent = `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] > LIVE LOCAL CUSTODIAN STATE ACTIVE`;
    if (syncLines[1]) syncLines[1].textContent = latest ? `[${new Date(latest.at).toLocaleTimeString("en-US", { hour12: false })}] > LAST ACTION: ${latest.action.replace(/-/g, " ").toUpperCase()}` : "[--:--:--] > NO LOCAL ACTIONS RECORDED";
    if (syncLines[2]) syncLines[2].textContent = navigator.onLine ? `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] > BROWSER CONNECTIVITY VERIFIED` : "[offline] > BROWSER CONNECTIVITY LOST";
    if (metrics[0]) metrics[0].textContent = navigator.onLine ? "LIVE" : "OFFLINE";
    if (metrics[1]) metrics[1].textContent = String(state.recentActions.length);
    if (metrics[2]) metrics[2].textContent = latest ? new Date(latest.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "--";
    if (ringValues[0]) ringValues[0].textContent = navigator.onLine ? "ON" : "OFF";
    if (ringValues[1]) ringValues[1].textContent = state.lastVote ? "GOV" : "LOC";
    if (ringValues[2]) ringValues[2].textContent = latest ? "NOW" : "--";
    if (nodeStats[0]) nodeStats[0].textContent = `${state.recentActions.length} / ${state.recentActions.length}`;
    if (nodeStats[1]) nodeStats[1].textContent = "LOCAL";
    if (nodeStats[2]) nodeStats[2].textContent = "BACKEND PENDING";
  };

  renderCockpitTruth();
  window.setInterval(renderCockpitTruth, 15000);
}

function enhanceSystemHealth(doc) {
  if (doc.body.dataset.aegisEnhancedSystemHealth === "true") return;
  doc.body.dataset.aegisEnhancedSystemHealth = "true";
  injectStyles(doc);

  const dashboard = findButton(doc, "Dashboard");
  const systemHealth = findButton(doc, "System Health");
  const security = findButton(doc, "Security");
  const nodes = findButton(doc, "Nodes");
  const reports = findButton(doc, "Reports");
  const notifications = Array.from(doc.querySelectorAll("button")).find((node) => normalizeText(node.textContent).includes("notifications"));
  const settings = Array.from(doc.querySelectorAll("button")).find((node) => normalizeText(node.textContent).includes("settings"));
  const refresh = findButton(doc, "Refresh");
  const viewArchive = findButton(doc, "View Archive");
  const search = findField(doc, (node) => normalizeText(node.placeholder).includes("search system logs"));
  const policy = findButton(doc, "Security Policy");
  const apiDocs = findButton(doc, "API Documentation");
  const contact = findButton(doc, "Contact Engineering");
  const serviceCards = Array.from(doc.querySelectorAll("[data-live-service]")).map((node) => node.closest("div")).filter(Boolean);
  const activityRows = Array.from(doc.querySelectorAll("[data-live-activity-row]"));
  const statusText = doc.querySelector("[data-live-text='status']");
  const verifiedText = doc.querySelector("[data-live-text='verified']");
  const indicator = doc.querySelector("[data-live-indicator='status']");
  const connectivityMetric = doc.querySelector("[data-live-metric='connectivity']");
  const connectivityDetail = doc.querySelector("[data-live-metric-detail='connectivity']");
  const actionsMetric = doc.querySelector("[data-live-metric='actions']");
  const actionsDetail = doc.querySelector("[data-live-metric-detail='actions']");
  const pulseMetric = doc.querySelector("[data-live-metric='pulse']");
  const pulseDetail = doc.querySelector("[data-live-metric-detail='pulse']");
  const connectivityBar = doc.querySelector("[data-live-bar='connectivity']");
  const connectivityNote = doc.querySelector("[data-live-note='connectivity']");
  const workspaceStatus = doc.querySelector("[data-live-service='workspace-status']");
  const workspaceNote = doc.querySelector("[data-live-service-note='workspace-status']");
  const hostingStatus = doc.querySelector("[data-live-service='hosting-status']");
  const hostingNote = doc.querySelector("[data-live-service-note='hosting-status']");
  const governanceStatus = doc.querySelector("[data-live-service='governance-status']");
  const governanceNote = doc.querySelector("[data-live-service-note='governance-status']");
  const telemetryStatus = doc.querySelector("[data-live-service='telemetry-status']");
  const telemetryNote = doc.querySelector("[data-live-service-note='telemetry-status']");

  bindManagedClick(dashboard, () => navigateTo("/custodian-ui/custodian-hub-operations-gallery/"));
  bindManagedClick(systemHealth, () => navigateTo("/custodian-ui/system-health-report-aegis-protocol/"));
  bindManagedClick(security, () => navigateTo("/custodian-ui/security-incident-assessor-center/"));
  bindManagedClick(nodes, () => navigateTo("/custodian-ui/regional-drill-down-us-east-1/"));
  bindManagedClick(reports, () => navigateTo("/custodian-ui/submission-review-interface/"));
  bindManagedClick(notifications, () => showToast(doc, "System health alerts synchronized with the Custodian watch queue."));
  bindManagedClick(settings, () => navigateTo("/custodian-ui/site-custodians/"));
  bindManagedClick(refresh, () => {
    renderTruth();
    showToast(doc, "Live Custodian telemetry refreshed from current local state.");
  });
  bindManagedClick(viewArchive, () => navigateTo("/custodian-ui/security-logs-aegis-protocol/"));
  bindManagedClick(policy, () => navigateTo("/nexus/aegis-governance-hub/"));
  bindManagedClick(apiDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(contact, () => navigateTo("/custodian-ui/site-custodians/"));

  search?.addEventListener("input", () => {
    const query = normalizeText(search.value);
    [...serviceCards, ...activityRows].forEach((block) => {
      block.classList.toggle("aegis-hidden-row", query && !normalizeText(block.textContent).includes(query));
    });
  });

  serviceCards.forEach((card) => bindManagedClick(card, () => {
    card.classList.add("aegis-highlight-ring");
    window.setTimeout(() => card.classList.remove("aegis-highlight-ring"), 1200);
    showToast(doc, `${card.querySelector("p")?.textContent || "Service"} selected for deeper health review.`);
  }));
  activityRows.forEach((card) => bindManagedClick(card, () => navigateTo("/custodian-ui/security-incident-assessor-center/")));

  const renderTruth = () => {
    const state = readState();
    const now = new Date();
    const lastAction = state.recentActions[0] || null;
    const online = navigator.onLine;

    if (statusText) statusText.textContent = online ? "Local workspace online" : "Local workspace offline";
    if (verifiedText) verifiedText.textContent = `Verified ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    if (indicator) indicator.className = `size-3 rounded-full animate-pulse ${online ? "bg-emerald-500" : "bg-orange-500"}`;

    if (connectivityMetric) connectivityMetric.textContent = online ? "Online" : "Offline";
    if (connectivityDetail) connectivityDetail.textContent = online ? "Browser signal live" : "Reconnect needed";
    if (actionsMetric) actionsMetric.textContent = String(state.recentActions.length);
    if (actionsDetail) actionsDetail.textContent = lastAction ? "Derived from local Custodian state" : "No actions recorded yet";
    if (pulseMetric) pulseMetric.textContent = lastAction
      ? new Date(lastAction.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "--";
    if (pulseDetail) pulseDetail.textContent = lastAction ? lastAction.action.replace(/-/g, " ") : "Current session";

    if (connectivityBar) connectivityBar.style.width = online ? "100%" : "35%";
    if (connectivityNote) connectivityNote.textContent = online
      ? "Browser connectivity is live. Backend infrastructure feed is still pending."
      : "Browser appears offline. Backend telemetry is unavailable.";

    if (workspaceStatus) workspaceStatus.textContent = online ? "LIVE" : "OFFLINE";
    if (workspaceNote) workspaceNote.textContent = lastAction
      ? `Latest local action: ${lastAction.action.replace(/-/g, " ")}`
      : "No live Custodian actions recorded yet";

    if (hostingStatus) hostingStatus.textContent = "CHECK";
    if (hostingNote) hostingNote.textContent = "Static hosting is reachable; no real backend infrastructure metrics are connected yet.";

    if (governanceStatus) governanceStatus.textContent = state.lastVote ? "ACTIVE" : "LOCAL";
    if (governanceNote) governanceNote.textContent = state.lastVote
      ? `Latest local governance signal: ${state.lastVote}`
      : "No live governance action recorded in this session";

    if (telemetryStatus) telemetryStatus.textContent = "WAITING";
    if (telemetryNote) telemetryNote.textContent = "Connect a backend telemetry source to replace this placeholder lane.";

    activityRows.forEach((row, index) => {
      const entry = state.recentActions[index];
      const date = row.querySelector("[data-live-activity-date]");
      const title = row.querySelector("[data-live-activity-title]");
      const copy = row.querySelector("[data-live-activity-copy]");
      const tag = row.querySelector("[data-live-activity-tag]");
      if (!entry) return;
      if (date) date.textContent = new Date(entry.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      if (title) title.textContent = entry.action.replace(/-/g, " ");
      if (copy) copy.textContent = "Live local Custodian action recorded in this browser session.";
      if (tag) tag.textContent = "RECORDED";
    });
  };

  renderTruth();
  window.setInterval(renderTruth, 15000);
}

function enhanceSiteCustodians(doc) {
  if (doc.body.dataset.aegisEnhancedSiteCustodians === "true") return;
  doc.body.dataset.aegisEnhancedSiteCustodians = "true";
  injectStyles(doc);

  const launchApp = findButton(doc, "Launch App");
  const viewCharter = findButton(doc, "View Charter");
  const selectionProcess = findButton(doc, "Selection Process");
  const applyNextCycle = findButton(doc, "Apply for Next Cycle");
  const protocol = findButton(doc, "Protocol");
  const governance = findButton(doc, "Governance");
  const ecosystem = findButton(doc, "Ecosystem");
  const architecture = findButton(doc, "Architecture");
  const sdks = findButton(doc, "SDKs");
  const discord = findButton(doc, "Discord");
  const twitter = findButton(doc, "Twitter");
  const charter = Array.from(doc.querySelectorAll("a, button, p")).find((node) => normalizeText(node.textContent) === "charter");
  const privacy = findButton(doc, "Privacy");
  const peerCards = Array.from(doc.querySelectorAll("h3")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text === "aetheris vane" || text === "soren kael" || text === "lyra thorne";
  });
  const responsibilityCards = Array.from(doc.querySelectorAll("h4")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("emergency patching")
      || text.includes("governance oversight")
      || text.includes("treasury management")
      || text.includes("integrity validation");
  });
  const standardCard = Array.from(doc.querySelectorAll("p, div")).find((node) => normalizeText(node.textContent).includes("standard of excellence"))?.closest("div");
  const contributionCards = Array.from(doc.querySelectorAll("span")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.startsWith("01. contribution")
      || text.startsWith("02. endorsement")
      || text.startsWith("03. verification");
  });

  bindManagedClick(launchApp, () => navigateTo("/custodian-ui/secure/"));
  bindManagedClick(viewCharter, () => navigateTo("/nexus/aegis-governance-hub/"));
  bindManagedClick(selectionProcess, () => navigateTo("/custodian-ui/site-custodian-login-recruitment-hub/"));
  bindManagedClick(applyNextCycle, () => {
    patchState({ recruitmentIntent: "custodian-cycle" });
    pushAction("custodian-cycle-application");
    showToast(doc, "Next-cycle application path opened through the recruitment hub.");
    navigateTo("/custodian-ui/site-custodian-login-recruitment-hub/");
  });

  bindManagedClick(protocol, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(governance, () => navigateTo("/custodian-ui/decentralized-governance-voting/"));
  bindManagedClick(ecosystem, () => navigateTo("/aegis-application-lab/"));
  bindManagedClick(architecture, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(sdks, () => navigateTo("/developer-depot/api-reference-aegis-protocol/"));
  bindManagedClick(discord, () => navigateTo("/peer-profile/home/"));
  bindManagedClick(twitter, () => navigateTo("/nexus/aegisalign-landing-page/"));
  bindManagedClick(charter, () => navigateTo("/nexus/aegis-governance-hub/"));
  bindManagedClick(privacy, () => navigateTo("/nexus/aegis-peer-profile/"));

  peerCards.forEach((card) => bindManagedClick(card.closest("div"), () => {
    const panel = card.closest("div");
    panel?.classList.add("aegis-highlight-ring");
    window.setTimeout(() => panel?.classList.remove("aegis-highlight-ring"), 1200);
    showToast(doc, `${card.textContent.trim()} selected. Peer Custodian dossier aligned with the governance charter.`);
  }));

  responsibilityCards.forEach((card) => bindManagedClick(card.closest("div"), () => {
    const label = card.textContent.trim();
    pushAction(slugify(label));
    showToast(doc, `${label} opened as an active Custodian stewardship lane.`);
    if (normalizeText(label).includes("governance")) {
      navigateTo("/custodian-ui/decentralized-governance-voting/");
      return;
    }
    if (normalizeText(label).includes("integrity")) {
      navigateTo("/custodian-ui/system-health-report-aegis-protocol/");
      return;
    }
    if (normalizeText(label).includes("patching")) {
      navigateTo("/custodian-ui/security-incident-assessor-center/");
      return;
    }
    navigateTo("/custodian-ui/submission-review-interface/");
  }));

  bindManagedClick(standardCard, () => {
    standardCard?.classList.add("aegis-highlight-ring");
    window.setTimeout(() => standardCard?.classList.remove("aegis-highlight-ring"), 1200);
    showToast(doc, "Custodian oath integrity is anchored to the active AEGIS charter.");
  });

  contributionCards.forEach((step) => bindManagedClick(step.closest("div"), () => {
    patchState({ recruitmentIntent: step.textContent.trim() });
    showToast(doc, `${step.textContent.trim()} staged as the current recruitment milestone.`);
  }));
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

  bindManagedClick(protocol, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(governance, () => navigateTo("/custodian-ui/decentralized-governance-voting/"));
  bindManagedClick(custodians, () => navigateTo("/custodian-ui/site-custodians/"));
  bindManagedClick(ecosystem, () => navigateTo("/aegis-application-lab/"));
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

  const safetyHold = findButton(doc, "Initiate Lockdown");
  const flushDns = findButton(doc, "Flush DNS Cache");
  const rotateKeys = findButton(doc, "Rotate Master Keys");
  const navDashboard = findButton(doc, "Dashboard");
  const navGlobalNodes = findButton(doc, "Global Nodes");
  const navThreatIntel = findButton(doc, "Threat Intelligence");
  const navProtocolConfig = findButton(doc, "Protocol Config");
  const navSupport = findButton(doc, "Support");
  const priorityHeadings = Array.from(doc.querySelectorAll("h5")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("awaiting recorded custodian incident action")
      || text.includes("awaiting backend incident evidence");
  });
  const priorityCards = priorityHeadings.map((node) => node.closest("div")).filter(Boolean);
  const incidentBadge = doc.querySelector("[data-live-incident-center-badge]");
  const incidentTime = doc.querySelector("[data-live-incident-center-time]");
  const actionsMetric = doc.querySelector("[data-live-incident-center-metric='actions']");
  const pulseMetric = doc.querySelector("[data-live-incident-center-metric='pulse']");
  const feedMetric = doc.querySelector("[data-live-incident-center-metric='feed']");
  const actionDetail = doc.querySelector("[data-live-incident-center-detail='actions']");
  const pulseDetail = doc.querySelector("[data-live-incident-center-detail='pulse']");
  const feedBar = doc.querySelector("[data-live-incident-center-bar]");
  const liveLogLines = Array.from(doc.querySelectorAll("[data-live-incident-log]"));
  const header = doc.querySelector("header");

  const render = () => {
    const state = readState();
    const lastAction = state.recentActions[0];
    const connectivity = navigator.onLine ? "Live Local" : "Offline";
    const pulse = lastAction
      ? new Date(lastAction.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "--";
    const feedStatus = navigator.onLine ? "Local" : "Offline";
    const actionCount = state.recentActions.length;

    if (incidentBadge) incidentBadge.textContent = connectivity;
    if (incidentTime) {
      incidentTime.textContent = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    if (actionsMetric) actionsMetric.textContent = String(actionCount);
    if (pulseMetric) pulseMetric.textContent = pulse;
    if (feedMetric) feedMetric.textContent = feedStatus;
    if (actionDetail) {
      actionDetail.textContent = actionCount ? `${actionCount} recorded action${actionCount === 1 ? "" : "s"}` : "Awaiting local actions";
    }
    if (pulseDetail) {
      pulseDetail.textContent = lastAction ? "Derived from local activity" : "Current session";
    }
    if (feedBar) {
      const width = navigator.onLine ? Math.min(100, Math.max(20, actionCount * 22)) : 12;
      feedBar.style.width = `${width}%`;
      feedBar.style.background = navigator.onLine ? "#1152d4" : "#64748b";
      feedBar.style.boxShadow = navigator.onLine ? "0 0 10px #1152d4" : "none";
    }

    liveLogLines.forEach((line, index) => {
      const entry = state.recentActions[index];
      if (entry) {
        line.textContent = `[${new Date(entry.at).toLocaleTimeString("en-US", { hour12: false })}] LOCAL: ${entry.action.replace(/-/g, " ")} recorded for Custodian review.`;
      } else if (index === 0) {
        line.textContent = `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] LOCAL: Review workspace active. Awaiting backend incident telemetry.`;
      } else if (index === 1) {
        line.textContent = `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] NOTE: Browser connectivity is ${navigator.onLine ? "online" : "offline"}. Only local state is being shown.`;
      } else {
        line.textContent = `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] PENDING: Incident evidence feed will appear here when backend services are connected.`;
      }
    });

    const cardRoutes = [
      "/custodian-ui/incident-report-aeg-2023-08/",
      "/custodian-ui/ticket-details-aeg-4092/",
    ];
    priorityCards.forEach((card, index) => {
      const badge = card?.querySelector(".uppercase");
      const meta = card ? Array.from(card.querySelectorAll(".text-\\[10px\\], .font-mono")).find((node) => normalizeText(node.textContent).includes("current session") || normalizeText(node.textContent).includes("backend pending")) : null;
      if (badge) {
        badge.textContent = index === 0 && actionCount ? "Active" : "Pending";
      }
      if (meta && index === 0 && lastAction) {
        meta.textContent = `${new Date(lastAction.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} local action`;
      }
      if (card) {
        card.dataset.aegisPriorityRoute = cardRoutes[index] || "";
      }
    });

    if (header) {
      header.dataset.aegisTruthFirst = navigator.onLine ? "connected" : "offline";
    }
  };

  bindManagedClick(navDashboard, () => navigateTo("/custodian-ui/custodian-hub-operations-gallery/"));
  bindManagedClick(navGlobalNodes, () => navigateTo("/custodian-ui/regional-drill-down-us-east-1/"));
  bindManagedClick(navThreatIntel, () => navigateTo("/custodian-ui/security-logs-aegis-protocol/"));
  bindManagedClick(navProtocolConfig, () => navigateTo("/developer-depot/api-reference-aegis-protocol/"));
  bindManagedClick(navSupport, () => navigateTo("/custodian-ui/ticket-details-aeg-4092/"));

  bindManagedClick(safetyHold, () => {
    pushAction("safety-hold");
    patchState({ selectedIncident: "local-review-1" });
    render();
    showToast(doc, "Safety hold recorded in the local review session. Opening the hold workflow.");
    window.setTimeout(() => navigateTo("/custodian-ui/safety-hold-protocol-sequence/"), 180);
  });
  bindManagedClick(flushDns, () => {
    pushAction("flush-dns");
    render();
    showToast(doc, "DNS cache flush action recorded locally. No backend network control is connected.");
  });
  bindManagedClick(rotateKeys, () => {
    pushAction("rotate-keys");
    render();
    showToast(doc, "Key rotation intent recorded locally. Backend key services are still pending.");
  });

  bindManagedClick(priorityCards[0], () => navigateTo("/custodian-ui/incident-report-aeg-2023-08/"));
  bindManagedClick(priorityCards[1], () => navigateTo("/custodian-ui/ticket-details-aeg-4092/"));

  render();
  window.setInterval(render, 6000);
}

function enhanceSafetyHoldProtocol(doc) {
  if (doc.body.dataset.aegisEnhancedSafetyHold === "true") return;
  doc.body.dataset.aegisEnhancedSafetyHold = "true";
  injectStyles(doc);

  const protocolDetails = findButton(doc, "Protocol Details");
  const emergencyOverride = findButton(doc, "Emergency Override");
  const confirmAuthorization = findButton(doc, "Confirm Authorization");
  const biometricScan = Array.from(doc.querySelectorAll("button, div")).find((node) => normalizeText(node.textContent).includes("biometric scan"));
  const keycardAuth = Array.from(doc.querySelectorAll("button, div")).find((node) => normalizeText(node.textContent).includes("keycard auth"));
  const countdown = Array.from(doc.querySelectorAll("div, span, p")).find((node) => /^\d{2}:\d{2}:\d{2}$/.test((node.textContent || "").trim()));
  const progressValue = Array.from(doc.querySelectorAll("div, span, p")).find((node) => (node.textContent || "").trim() === "45%");
  const progressBar = progressValue?.closest("div")?.nextElementSibling?.querySelector("div");
  const connectivityPanel = Array.from(doc.querySelectorAll("div")).find((node) => normalizeText(node.textContent).includes("network status"));
  const integrityPanel = Array.from(doc.querySelectorAll("div")).find((node) => normalizeText(node.textContent).includes("data integrity"));

  let authMode = "biometric";

  const render = () => {
    const state = readState();
    const lastAction = state.recentActions.find((entry) => entry.action === "safety-hold") || state.recentActions[0] || null;
    const online = navigator.onLine;
    const elapsedMs = lastAction ? Math.max(0, Date.now() - new Date(lastAction.at).getTime()) : 0;
    const remainingMs = Math.max(0, 252000 - elapsedMs);
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    const progress = lastAction ? Math.min(100, 45 + Math.floor(elapsedMs / 4000)) : 45;

    if (countdown) countdown.textContent = `00:${minutes}:${seconds}`;
    if (progressValue) progressValue.textContent = `${progress}%`;
    if (progressBar) progressBar.style.width = `${progress}%`;

    if (connectivityPanel) {
      const parts = connectivityPanel.querySelectorAll("div, p");
      const value = Array.from(parts).find((node) => node !== connectivityPanel && normalizeText(node.textContent) && !normalizeText(node.textContent).includes("network status"));
      const detail = Array.from(parts).reverse().find((node) => node !== value && node !== connectivityPanel && normalizeText(node.textContent));
      if (value) value.textContent = online ? "LOCAL REVIEW" : "OFFLINE";
      if (detail) {
        detail.textContent = lastAction
          ? "Safety-hold intent is recorded locally. Backend containment services are pending."
          : "No live containment backend is connected.";
      }
    }

    if (integrityPanel) {
      const parts = integrityPanel.querySelectorAll("div, p");
      const value = Array.from(parts).find((node) => node !== connectivityPanel && normalizeText(node.textContent) && !normalizeText(node.textContent).includes("data integrity"));
      const detail = Array.from(parts).reverse().find((node) => node !== value && normalizeText(node.textContent));
      if (value) value.textContent = "LOCAL ONLY";
      if (detail) detail.textContent = "Integrity confirmation becomes authoritative when backend evidence services are connected.";
    }

    if (biometricScan) biometricScan.classList.toggle("aegis-highlight-ring", authMode === "biometric");
    if (keycardAuth) keycardAuth.classList.toggle("aegis-highlight-ring", authMode === "keycard");
  };

  bindManagedClick(protocolDetails, () => navigateTo("/custodian-ui/proposal-discussion-details/"));
  bindManagedClick(emergencyOverride, () => navigateTo("/custodian-ui/secure/"));
  bindManagedClick(confirmAuthorization, () => {
    pushAction(`safety-hold-authorized-${authMode}`);
    showToast(doc, "Safety hold authorization recorded in local Custodian state.");
    navigateTo("/custodian-ui/ticket-details-aeg-4092/");
  });
  bindManagedClick(biometricScan, () => {
    authMode = "biometric";
    showToast(doc, "Biometric authorization path selected for local review.");
    render();
  });
  bindManagedClick(keycardAuth, () => {
    authMode = "keycard";
    showToast(doc, "Keycard authorization path selected for local review.");
    render();
  });

  render();
  window.setInterval(render, 3000);
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

function enhanceSupportTicket(doc) {
  if (doc.body.dataset.aegisEnhancedSupportTicket === "true") return;
  doc.body.dataset.aegisEnhancedSupportTicket = "true";
  injectStyles(doc);

  const dashboard = findButton(doc, "Dashboard");
  const tickets = findButton(doc, "Tickets");
  const nodes = findButton(doc, "Nodes");
  const systemLog = findButton(doc, "System Log");
  const closeTicket = findButton(doc, "Close Ticket");
  const postReply = findButton(doc, "Post Reply");
  const messagesTab = findButton(doc, "Messages");
  const logsTab = findButton(doc, "System Logs");
  const activityTab = findButton(doc, "Activity Feed");
  const attachLog = findButton(doc, "Attach Log File");
  const sendReply = findButton(doc, "Send Reply");
  const composer = Array.from(doc.querySelectorAll("textarea")).find((node) =>
    normalizeText(node.placeholder).includes("type your reply here"));
  const mainPanel = doc.querySelector("main");
  const statusLine = Array.from(doc.querySelectorAll("span, div")).find((node) =>
    normalizeText(node.textContent).includes("status:"));
  const liveSync = doc.querySelector("[data-live-ticket-sync]");
  const liveConnectivity = doc.querySelector("[data-live-ticket-connectivity]");
  const liveRegion = doc.querySelector("[data-live-ticket-region]");
  const quickActions = Array.from(doc.querySelectorAll("button, a")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("launch") || text.includes("assign") || text.includes("escalate") || text.includes("open archive");
  });
  const tabs = [messagesTab, logsTab, activityTab].filter(Boolean);

  const applyTicketStatus = (state) => {
    if (!statusLine) return;
    const statusMap = {
      "in-review": "Status: In Review",
      "awaiting-peer-response": "Status: Awaiting Peer Response",
      "resolved-awaiting-publish": "Status: Resolved / Awaiting Custodian Publish",
    };
    statusLine.textContent = statusMap[state.ticketStatus] || statusLine.textContent;
  };

  const render = () => {
    if (liveSync) {
      liveSync.textContent = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
    if (liveConnectivity) {
      liveConnectivity.textContent = navigator.onLine ? "Online" : "Offline";
      liveConnectivity.className = navigator.onLine ? "text-green-500 font-bold" : "text-amber-500 font-bold";
    }
    if (liveRegion) {
      liveRegion.textContent = "Local browser session";
    }
  };

  bindManagedClick(dashboard, () => navigateTo("/custodian-ui/custodian-hub-operations-gallery/"));
  bindManagedClick(tickets, () => navigateTo("/custodian-ui/ticket-details-aeg-4092/"));
  bindManagedClick(nodes, () => navigateTo("/custodian-ui/regional-drill-down-us-east-1/"));
  bindManagedClick(systemLog, () => navigateTo("/custodian-ui/security-logs-aegis-protocol/"));
  bindManagedClick(closeTicket, () => {
    const next = patchState({ ticketStatus: "resolved-awaiting-publish", lastTicketAction: "close-ticket" });
    pushAction("close-ticket");
    applyTicketStatus(next);
    if (mainPanel) setMessage(mainPanel, "Ticket AEG-4092 closed locally and handed toward governed publishing review.", "success");
    showToast(doc, "Support ticket closed and staged for Custodian review.");
  });
  bindManagedClick(postReply, () => {
    const reply = composer?.value.trim() || "";
    if (!reply) {
      if (mainPanel) setMessage(mainPanel, "Add a reply before posting to the Custodian support lane.", "error");
      return;
    }
    const next = patchState({ ticketStatus: "awaiting-peer-response", lastTicketAction: "post-reply" });
    pushAction("post-ticket-reply");
    applyTicketStatus(next);
    if (mainPanel) setMessage(mainPanel, "Reply staged in local support state. Continue through logs, incident casework, or governed publishing as needed.", "success");
    showToast(doc, "Reply posted to support case AEG-4092.");
  });
  bindManagedClick(attachLog, () => {
    patchState({ lastTicketAction: "attach-log" });
    pushAction("attach-support-log");
    showToast(doc, "Opening the security log archive for attachment review.");
    navigateTo("/custodian-ui/security-logs-aegis-protocol/");
  });
  bindManagedClick(sendReply, () => {
    const reply = composer?.value.trim() || "";
    if (!reply) {
      if (mainPanel) setMessage(mainPanel, "Write a governed response before sending.", "error");
      return;
    }
    const next = patchState({ ticketStatus: "awaiting-peer-response", lastTicketAction: "send-reply" });
    pushAction("send-support-reply");
    applyTicketStatus(next);
    if (mainPanel) setMessage(mainPanel, "Governed support response sent. Archive or escalate the case if further action is needed.", "success");
    showToast(doc, "Governed support response sent.");
  });

  bindManagedClick(messagesTab, () => {
    patchState({ ticketLane: "messages" });
    showToast(doc, "Message lane focused for AEG-4092.");
  });
  bindManagedClick(logsTab, () => {
    patchState({ ticketLane: "logs" });
    showToast(doc, "Opening the archived system log lane for AEG-4092.");
    navigateTo("/custodian-ui/security-logs-aegis-protocol/");
  });
  bindManagedClick(activityTab, () => {
    patchState({ ticketLane: "activity" });
    showToast(doc, "Activity feed lane aligned for the support case.");
  });

  tabs.forEach((tab) => bindManagedClick(tab, () => {
    tabs.forEach((node) => {
      node.classList.remove("border-primary", "text-primary");
      node.classList.add("border-transparent");
    });
    tab.classList.add("border-primary", "text-primary");
    tab.classList.remove("border-transparent");
  }));

  quickActions.forEach((button) => bindManagedClick(button, () => {
    const text = normalizeText(button.textContent);
    if (text.includes("launch")) {
      pushAction("launch-containment");
      showToast(doc, "Containment workflow launched from the support case.");
      navigateTo("/custodian-ui/security-incident-assessor-center/");
      return;
    }
    if (text.includes("assign")) {
      patchState({ lastTicketAction: "assign-custodian-lane" });
      showToast(doc, "Custodian support lane assignment recorded for AEG-4092.");
      return;
    }
    if (text.includes("escalate")) {
      patchState({ lastTicketAction: "escalate-governance" });
      showToast(doc, "Support case escalated into the governance lane.");
      navigateTo("/custodian-ui/decentralized-governance-voting/");
      return;
    }
    if (text.includes("open archive")) {
      navigateTo("/custodian-ui/security-logs-aegis-protocol/");
    }
  }));

  applyTicketStatus(readState());
  render();
}

const pageEnhancers = {
  "custodian-hub-operations-gallery": enhanceHubGallery,
  "custodian-cockpit-hud-1": enhanceOperationsCockpit,
  "security-incident-assessor-center": enhanceIncidentCenter,
  "safety-hold-protocol-sequence": enhanceSafetyHoldProtocol,
  "decentralized-governance-voting": enhanceGovernance,
  "custodian-login-portal": enhanceCustodianLogin,
  "site-custodian-login-recruitment-hub": enhanceRecruitmentHub,
  "submission-review-interface": enhanceSubmissionReview,
  "create-new-page-custodian-tool": enhanceCreatePageTool,
  "site-custodian-hub-gallery-update": enhancePublishingSurface,
  "site-custodians": enhanceSiteCustodians,
  "regional-drill-down-us-east-1": enhanceRegionalDrilldown,
  "security-logs-aegis-protocol": enhanceSecurityLogs,
  "incident-report-aeg-2023-08": enhanceIncidentReport,
  "system-health-report-aegis-protocol": enhanceSystemHealth,
  "ticket-details-aeg-4092": enhanceSupportTicket,
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
  if (inferPageSlug() === "status") {
    enhanceStatusSurface(document);
  }
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
