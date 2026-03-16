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
  const next = {
    activeThreats: Math.max(0, current.queueCounts.activeThreats + (Math.random() > 0.58 ? -1 : 1)),
    mitigationMinutes: Math.max(4, current.queueCounts.mitigationMinutes + (Math.random() > 0.5 ? -1 : 1)),
    shieldStrength: Math.min(99.99, Math.max(94.5, Number((current.queueCounts.shieldStrength + (Math.random() > 0.5 ? 0.2 : -0.15)).toFixed(2)))),
  };
  patchState({ queueCounts: next });
  return next;
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
    const stability = Math.max(99.95, Number((99.99 - state.queueCounts.activeThreats * 0.0001).toFixed(3)));
    const coverage = `24 / 24`;
    const posture = state.queueCounts.activeThreats > 40
      ? "Guarded"
      : state.queueCounts.activeThreats > 25
        ? "Nominal"
        : "Hardened";

    missionTile?.querySelector(".status-number")?.replaceChildren(doc.createTextNode(`${stability}%`));
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

    pulse.textContent = `Public status pulse refreshed at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}. Active threats: ${state.queueCounts.activeThreats}. Shield integrity: ${state.queueCounts.shieldStrength.toFixed(2)}%.`;
  };

  render();
  window.setInterval(() => {
    refreshQueueState();
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

  const state = readState();
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

  if (state.reviewDecision && mainPanel) {
    setMessage(mainPanel, `Previous local review state: ${state.reviewDecision}.`, "info");
  }
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
  const incidentItems = Array.from(doc.querySelectorAll("p")).filter((node) => normalizeText(node.textContent).includes("auto-scaling group triggered") || normalizeText(node.textContent).includes("potential ddos mitigation"));
  const metricCards = Array.from(doc.querySelectorAll("p")).filter((node) => normalizeText(node.textContent).includes("regional health") || normalizeText(node.textContent).includes("uptime") || normalizeText(node.textContent).includes("avg latency"));

  bindManagedClick(dashboard, () => navigateTo("/custodian-ui/custodian-hub-operations-gallery/"));
  bindManagedClick(regions, () => navigateTo("/custodian-ui/regional-drill-down-us-east-1/"));
  bindManagedClick(security, () => navigateTo("/custodian-ui/security-incident-assessor-center/"));
  bindManagedClick(logs, () => navigateTo("/custodian-ui/security-logs-aegis-protocol/"));
  bindManagedClick(settings, () => navigateTo("/custodian-ui/site-custodians/"));
  bindManagedClick(notifications, () => showToast(doc, "Regional watch alerts acknowledged for US-EAST-1."));
  bindManagedClick(refresh, () => {
    const next = refreshQueueState();
    const numbers = Array.from(doc.querySelectorAll("h3"));
    if (numbers[0]) numbers[0].textContent = next.activeThreats > 40 ? "Guarded" : "Operational";
    if (numbers[1]) numbers[1].textContent = "99.99%";
    if (numbers[2]) numbers[2].textContent = `${Math.max(12, next.mitigationMinutes * 2)}ms`;
    showToast(doc, "Regional telemetry refreshed from the live Custodian state.");
  });
  bindManagedClick(regionLog, () => navigateTo("/custodian-ui/system-health-report-aegis-protocol/"));

  search?.addEventListener("input", () => {
    const query = normalizeText(search.value);
    nodeCards.forEach((card) => {
      card.classList.toggle("aegis-hidden-row", query && !normalizeText(card.textContent).includes(query));
    });
    incidentItems.forEach((item) => {
      const block = item.closest("div");
      block?.classList.toggle("aegis-hidden-row", query && !normalizeText(block.textContent).includes(query));
    });
  });

  nodeCards.forEach((card) => bindManagedClick(card, () => {
    nodeCards.forEach((entry) => entry.classList.remove("aegis-highlight-ring"));
    card.classList.add("aegis-highlight-ring");
    showToast(doc, `${card.querySelector("h4")?.textContent || "Node"} selected for focused regional review.`);
  }));
  incidentItems.forEach((item) => bindManagedClick(item.closest("div"), () => navigateTo("/custodian-ui/security-incident-assessor-center/")));
  metricCards.forEach((label) => bindManagedClick(label.closest("div"), () => {
    const next = refreshQueueState();
    showToast(doc, `Regional metric pulse refreshed. Shield integrity now ${next.shieldStrength.toFixed(2)}%.`);
  }));
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
  const serviceCards = Array.from(doc.querySelectorAll("p")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text === "core sync engine" || text === "shield network" || text === "api gateway" || text === "deployment service";
  }).map((node) => node.closest("div")).filter(Boolean);
  const incidentTitles = Array.from(doc.querySelectorAll("p")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("api gateway latency spike") || text.includes("core database maintenance") || text.includes("ddos mitigation active");
  }).map((node) => node.closest("div")).filter(Boolean);

  bindManagedClick(dashboard, () => navigateTo("/custodian-ui/custodian-hub-operations-gallery/"));
  bindManagedClick(systemHealth, () => navigateTo("/custodian-ui/system-health-report-aegis-protocol/"));
  bindManagedClick(security, () => navigateTo("/custodian-ui/security-incident-assessor-center/"));
  bindManagedClick(nodes, () => navigateTo("/custodian-ui/regional-drill-down-us-east-1/"));
  bindManagedClick(reports, () => navigateTo("/custodian-ui/submission-review-interface/"));
  bindManagedClick(notifications, () => showToast(doc, "System health alerts synchronized with the Custodian watch queue."));
  bindManagedClick(settings, () => navigateTo("/custodian-ui/site-custodians/"));
  bindManagedClick(refresh, () => {
    const next = refreshQueueState();
    const metricValues = Array.from(doc.querySelectorAll("p.text-3xl, p.text-3xl.font-bold, .text-3xl.font-bold"));
    if (metricValues[0]) metricValues[0].textContent = `${Math.max(99.9, 100 - next.activeThreats * 0.0002).toFixed(2)}%`;
    if (metricValues[1]) metricValues[1].textContent = `${Math.max(10, next.mitigationMinutes + 2)}ms`;
    if (metricValues[2]) metricValues[2].textContent = `${1248 + (42 - next.activeThreats)}`;
    showToast(doc, "System health telemetry refreshed from the Custodian command layer.");
  });
  bindManagedClick(viewArchive, () => navigateTo("/custodian-ui/security-logs-aegis-protocol/"));
  bindManagedClick(policy, () => navigateTo("/nexus/aegis-governance-hub/"));
  bindManagedClick(apiDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(contact, () => navigateTo("/custodian-ui/site-custodians/"));

  search?.addEventListener("input", () => {
    const query = normalizeText(search.value);
    [...serviceCards, ...incidentTitles].forEach((block) => {
      block.classList.toggle("aegis-hidden-row", query && !normalizeText(block.textContent).includes(query));
    });
  });

  serviceCards.forEach((card) => bindManagedClick(card, () => {
    card.classList.add("aegis-highlight-ring");
    window.setTimeout(() => card.classList.remove("aegis-highlight-ring"), 1200);
    showToast(doc, `${card.querySelector("p")?.textContent || "Service"} selected for deeper health review.`);
  }));
  incidentTitles.forEach((card) => bindManagedClick(card, () => navigateTo("/custodian-ui/security-incident-assessor-center/")));
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
  "custodian-login-portal": enhanceCustodianLogin,
  "site-custodian-login-recruitment-hub": enhanceRecruitmentHub,
  "submission-review-interface": enhanceSubmissionReview,
  "create-new-page-custodian-tool": enhanceCreatePageTool,
  "site-custodians": enhanceSiteCustodians,
  "regional-drill-down-us-east-1": enhanceRegionalDrilldown,
  "system-health-report-aegis-protocol": enhanceSystemHealth,
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
