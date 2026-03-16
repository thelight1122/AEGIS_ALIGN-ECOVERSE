const STORAGE_KEY = "aegis.developerDepot.state";

const DEFAULT_STATE = {
  profile: {
    handle: "Dev_Cipher",
    role: "Core Contributor",
  },
  hub: {
    search: "",
    sort: "trending",
    installed: [],
  },
  api: {
    language: "curl",
  },
  submissionDraft: {
    pluginName: "",
    version: "",
    category: "",
    description: "",
    repository: "",
    packageName: "",
  },
  editingSubmissionId: "",
  submissionFilter: "all",
  submissionSort: "updated",
  analytics: {
    range: "30D",
    selectedSubmissionId: "aegisguard-pro",
  },
  submissions: [
    {
      id: "aegisguard-pro",
      name: "AegisGuard Pro",
      version: "2.4.1",
      category: "Security & Firewall",
      description: "Published defensive plugin with active release history.",
      status: "Published",
      updatedLabel: "Updated 2h ago",
      createdLabel: "Oct 24, 2023",
      downloads: 8400,
      rating: 4.9,
      reason: "",
    },
    {
      id: "streamflow-engine",
      name: "StreamFlow Engine",
      version: "1.0.0-beta",
      category: "Performance",
      description: "Review-stage performance contribution.",
      status: "In Review",
      updatedLabel: "Submitted Oct 24, 2023",
      createdLabel: "Oct 24, 2023",
      downloads: 0,
      rating: 0,
      reason: "",
    },
    {
      id: "cli-optimizer-toolkit",
      name: "CLI-Optimizer Toolkit",
      version: "0.8.0-dev",
      category: "Developer Tool",
      description: "Draft CLI improvement toolkit awaiting publish.",
      status: "Draft",
      updatedLabel: "Last saved 1 day ago",
      createdLabel: "Mar 14, 2026",
      downloads: 0,
      rating: 0,
      reason: "",
    },
    {
      id: "legacy-auth-handler",
      name: "Legacy Auth Handler",
      version: "1.2.0",
      category: "Authentication",
      description: "Rejected submission requiring updates before resubmission.",
      status: "Rejected",
      updatedLabel: "Action Required",
      createdLabel: "Oct 11, 2023",
      downloads: 0,
      rating: 0,
      reason: "Rejected: credential handling does not yet meet the current AEGIS secure transport standard.",
    },
  ],
};

const ANALYTICS_RANGES = {
  "7D": { downloads: "9,842", rating: "4.78", installs: "80,944", revenue: "$10,420" },
  "30D": { downloads: "125,482", rating: "4.82", installs: "82,105", revenue: "$12,400" },
  "90D": { downloads: "310,904", rating: "4.80", installs: "79,320", revenue: "$33,900" },
  "1Y": { downloads: "1.24M", rating: "4.84", installs: "88,410", revenue: "$146,000" },
};

function sanitizeInstalled(installed) {
  const seen = new Set();
  return (Array.isArray(installed) ? installed : [])
    .map((value) => String(value || "").trim())
    .filter((value) => value && value.toLowerCase() !== "plugin")
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function mergeState(base, stored) {
  return {
    ...base,
    ...stored,
    profile: { ...base.profile, ...(stored?.profile || {}) },
    hub: {
      ...base.hub,
      ...(stored?.hub || {}),
      installed: sanitizeInstalled(Array.isArray(stored?.hub?.installed) ? stored.hub.installed : base.hub.installed),
    },
    api: { ...base.api, ...(stored?.api || {}) },
    submissionDraft: { ...base.submissionDraft, ...(stored?.submissionDraft || {}) },
    analytics: { ...base.analytics, ...(stored?.analytics || {}) },
    submissions: Array.isArray(stored?.submissions) && stored.submissions.length ? stored.submissions : base.submissions,
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

function navigateTo(path) {
  if (typeof window.aegisTransit === "function") {
    window.aegisTransit(path);
  } else {
    window.location.href = path;
  }
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
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
  if (doc.getElementById("aegis-depot-activation-styles")) return;
  const style = doc.createElement("style");
  style.id = "aegis-depot-activation-styles";
  style.textContent = `
    .aegis-inline-message {
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 12px;
      line-height: 1.45;
      border: 1px solid rgba(245, 158, 11, 0.24);
      background: rgba(245, 158, 11, 0.08);
      color: inherit;
    }
    .aegis-inline-message.is-error {
      border-color: rgba(239, 68, 68, 0.32);
      background: rgba(239, 68, 68, 0.08);
    }
    .aegis-inline-message.is-success {
      border-color: rgba(16, 185, 129, 0.28);
      background: rgba(16, 185, 129, 0.08);
    }
    .aegis-toast {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 9999;
      max-width: 340px;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(245, 158, 11, 0.2);
      background: rgba(17, 24, 39, 0.92);
      color: #f5f7fb;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(10px);
      font-size: 12px;
      line-height: 1.45;
      opacity: 0;
      transform: translateY(12px);
      transition: opacity 180ms ease, transform 180ms ease;
      pointer-events: none;
    }
    .aegis-toast.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
    .aegis-highlight-ring {
      box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.32) inset, 0 0 0 1px rgba(245, 158, 11, 0.15);
      border-radius: 18px;
    }
    .aegis-active-anchor {
      color: #f59e0b !important;
      font-weight: 700 !important;
    }
    .aegis-hidden {
      display: none !important;
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
  if (!container) return;
  injectStyles(container.ownerDocument || container);
  let node = container.querySelector(".aegis-inline-message");
  if (!node) {
    node = container.ownerDocument.createElement("div");
    node.className = "aegis-inline-message";
    container.appendChild(node);
  }
  node.className = `aegis-inline-message${tone === "error" ? " is-error" : tone === "success" ? " is-success" : ""}`;
  node.textContent = message;
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

function findButton(doc, text) {
  const target = normalizeText(text);
  return Array.from(doc.querySelectorAll("button, a")).find((node) => {
    const label = normalizeText(node.textContent);
    const aria = normalizeText(node.getAttribute("aria-label"));
    return label === target || aria === target || label.includes(target);
  }) || null;
}

function slugify(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function resolveDepotCardHeading(node) {
  let cursor = node;
  while (cursor && cursor !== cursor.ownerDocument.body) {
    if (typeof cursor.querySelector === "function") {
      const directHeading = cursor.querySelector("h3");
      if (directHeading?.textContent?.trim()) {
        return directHeading.textContent.trim();
      }
    }
    cursor = cursor.parentElement;
  }
  return "";
}

function updateDraftFromSubmission(submission) {
  patchState({
    editingSubmissionId: submission.id,
    submissionDraft: {
      pluginName: submission.name,
      version: submission.version,
      category: submission.category,
      description: submission.description,
      repository: "",
      packageName: submission.packageName || "",
    },
  });
}

function enhanceDeveloperHub(doc) {
  if (doc.body.dataset.aegisDepotHub === "true") return;
  doc.body.dataset.aegisDepotHub = "true";
  injectStyles(doc);

  const state = readState();
  const search = doc.querySelector('input[placeholder*="Search plugins"]');
  const profile = findButton(doc, "Profile");
  const share = findButton(doc, "Share a Plugin");
  const viewDocs = findButton(doc, "View Docs");
  const socialViewAll = findButton(doc, "View All");
  const sortButtons = ["Trending", "Newest", "Top Rated"].map((label) => findButton(doc, label)).filter(Boolean);
  const pluginCards = Array.from(doc.querySelectorAll("main h3"))
    .filter((node) => ["LogSentinel Pro", "HyperNode Config", "EncryptedTunnel v2"].includes(node.textContent?.trim()))
    .map((heading) => heading.closest(".rounded-2xl"));
  const socialCards = Array.from(doc.querySelectorAll("main p"))
    .filter((node) => /latency|gRPC listener/i.test(node.textContent || ""))
    .map((node) => node.closest("[class*='cursor-pointer']"));
  const bulletinCards = Array.from(doc.querySelectorAll("main h3"))
    .filter((node) => /AegisX Global|Protocol Patch|Weekly Developer/i.test(node.textContent || ""))
    .map((node) => node.closest(".rounded-2xl"));
  const sidebarLinks = Array.from(doc.querySelectorAll("aside a"));
  const footerDocs = findButton(doc, "Protocol Docs");
  const footerPortal = findButton(doc, "Developer Portal");
  const sections = {
    dashboard: doc.querySelector("main"),
    "social hub": Array.from(doc.querySelectorAll("h2")).find((node) => normalizeText(node.textContent).includes("social hub"))?.closest(".rounded-3xl"),
    "the depot": Array.from(doc.querySelectorAll("h2")).find((node) => normalizeText(node.textContent).includes("the depot"))?.closest(".rounded-3xl"),
    "bulletin board": Array.from(doc.querySelectorAll("h2")).find((node) => normalizeText(node.textContent).includes("bulletin board"))?.closest(".rounded-2xl"),
  };

  const applySearch = (query) => {
    const normalizedQuery = normalizeText(query);
    [...pluginCards, ...socialCards, ...bulletinCards].forEach((card) => {
      if (!card) return;
      const matches = !normalizedQuery || normalizeText(card.textContent).includes(normalizedQuery);
      card.classList.toggle("aegis-hidden", !matches);
      card.classList.toggle("aegis-highlight-ring", Boolean(normalizedQuery) && matches);
    });
  };

  const applySort = (mode) => {
    const current = readState();
    patchState({ hub: { ...current.hub, sort: mode } });
    const parent = pluginCards[0]?.parentElement;
    if (!parent || pluginCards.length < 2) return;
    const weight = {
      trending: { "LogSentinel Pro": 3, "HyperNode Config": 2, "EncryptedTunnel v2": 1 },
      newest: { "EncryptedTunnel v2": 3, "LogSentinel Pro": 2, "HyperNode Config": 1 },
      "top rated": { "HyperNode Config": 3, "LogSentinel Pro": 2, "EncryptedTunnel v2": 1 },
    };
    pluginCards
      .slice()
      .sort((a, b) => (weight[mode]?.[b.querySelector("h3")?.textContent?.trim() || ""] || 0) - (weight[mode]?.[a.querySelector("h3")?.textContent?.trim() || ""] || 0))
      .forEach((card) => parent.appendChild(card));
    sortButtons.forEach((button) => {
      button.classList.toggle("aegis-active-anchor", normalizeText(button.textContent) === mode);
    });
  };

  if (search) {
    search.value = state.hub.search || "";
    search.addEventListener("input", () => {
      const current = readState();
      patchState({ hub: { ...current.hub, search: search.value } });
      applySearch(search.value);
    });
    applySearch(search.value);
  }

  applySort(state.hub.sort || "trending");

  bindManagedClick(profile, () => navigateTo("/nexus/aegis-peer-profile/"));
  bindManagedClick(share, () => navigateTo("/developer-depot/submit-plugin-to-depot/"));
  bindManagedClick(viewDocs, () => navigateTo("/developer-depot/api-reference-aegis-protocol/"));
  bindManagedClick(socialViewAll, () => navigateTo("/developer-depot/colab-creation-page-1/"));
  bindManagedClick(footerDocs, () => navigateTo("/developer-depot/api-reference-aegis-protocol/"));
  bindManagedClick(footerPortal, () => navigateTo("/developer-depot/developer-console-aegis-protocol/"));
  sortButtons.forEach((button) => bindManagedClick(button, () => applySort(normalizeText(button.textContent))));

  sidebarLinks.forEach((link) => {
    const label = normalizeText(link.textContent).replace(/^[a-z_]+\s*/, "");
    const target = sections[label] || sections.dashboard;
    bindManagedClick(link, () => {
      if (label === "settings") {
        navigateTo("/nexus/aegisalign-settings/");
        return;
      }
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      target?.classList.add("aegis-highlight-ring");
      window.setTimeout(() => target?.classList.remove("aegis-highlight-ring"), 900);
      sidebarLinks.forEach((node) => node.classList.toggle("aegis-active-anchor", node === link));
    });
  });

  socialCards.forEach((card) => bindManagedClick(card, () => showToast(doc, "Peer discussion opened in the collaborative thread viewer.")));
  bulletinCards.forEach((card) => bindManagedClick(card, () => showToast(doc, "Bulletin pinned to your Depot watchlist.")));

  Array.from(doc.querySelectorAll("button"))
    .filter((button) => /Get Plugin|Download Config/i.test(button.textContent || ""))
    .forEach((button) => {
      bindManagedClick(button, () => {
        const heading = resolveDepotCardHeading(button) || "Plugin";
        const current = readState();
        if (!current.hub.installed.includes(heading)) {
          patchState({ hub: { ...current.hub, installed: sanitizeInstalled([heading, ...current.hub.installed]) } });
        }
        showToast(doc, `${heading} added to your local Developer Depot toolkit.`);
      });
    });
}

function enhanceApiReference(doc) {
  if (doc.body.dataset.aegisDepotApi === "true") return;
  doc.body.dataset.aegisDepotApi = "true";
  injectStyles(doc);

  const state = readState();
  const navLinks = Array.from(doc.querySelectorAll("header nav a"));
  const consoleButton = findButton(doc, "Console");
  const langButtons = ["cURL", "Python", "Node.js"].map((label) => findButton(doc, label)).filter(Boolean);
  const copyButton = findButton(doc, "content_copy");
  const requestCode = Array.from(doc.querySelectorAll("main code")).find((node) => normalizeText(node.textContent).includes("/v1/shield/deploy"));
  const responseBlock = Array.from(doc.querySelectorAll("main [class]")).find((node) => normalizeText(node.textContent).includes("\"status\": \"success\""));
  const sections = {
    docs: Array.from(doc.querySelectorAll("h3")).find((node) => normalizeText(node.textContent).includes("headers"))?.closest(".space-y-8") || doc.body,
    api: requestCode?.closest(".rounded-2xl") || doc.body,
    network: Array.from(doc.querySelectorAll("h5")).find((node) => normalizeText(node.textContent).includes("common errors"))?.closest(".rounded-2xl") || doc.body,
    status: responseBlock || doc.body,
  };
  const requestSnippets = {
    curl: "curl --request POST \\\n  --url https://api.aegis.io/v1/shield/deploy \\\n  --header 'Authorization: Bearer YOUR_TOKEN' \\\n  --header 'Content-Type: application/json' \\\n  --data '{\"shield_name\":\"alpha-secure-01\",\"protocol_type\":\"quantum\",\"auto_scaling\":true}'",
    python: "import requests\\n\\nresponse = requests.post(\\n  'https://api.aegis.io/v1/shield/deploy',\\n  headers={'Authorization': 'Bearer YOUR_TOKEN'},\\n  json={'shield_name': 'alpha-secure-01', 'protocol_type': 'quantum', 'auto_scaling': True},\\n)\\nprint(response.json())",
    "node.js": "const response = await fetch('https://api.aegis.io/v1/shield/deploy', {\\n  method: 'POST',\\n  headers: {\\n    Authorization: 'Bearer YOUR_TOKEN',\\n    'Content-Type': 'application/json',\\n  },\\n  body: JSON.stringify({ shield_name: 'alpha-secure-01', protocol_type: 'quantum', auto_scaling: true }),\\n});\\nconsole.log(await response.json());",
  };

  const renderLanguage = (language) => {
    if (requestCode) requestCode.textContent = requestSnippets[language];
    langButtons.forEach((button) => button.classList.toggle("aegis-active-anchor", normalizeText(button.textContent) === language));
    const current = readState();
    patchState({ api: { ...current.api, language } });
  };

  renderLanguage(normalizeText(state.api.language || "curl"));

  navLinks.forEach((link) => {
    const key = normalizeText(link.textContent);
    bindManagedClick(link, () => {
      if (key === "status") {
        navigateTo("/developer-depot/api-usage-report-aegis-protocol/");
        return;
      }
      sections[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
      sections[key]?.classList.add("aegis-highlight-ring");
      window.setTimeout(() => sections[key]?.classList.remove("aegis-highlight-ring"), 900);
    });
  });
  bindManagedClick(consoleButton, () => navigateTo("/developer-depot/developer-console-aegis-protocol/"));
  langButtons.forEach((button) => bindManagedClick(button, () => renderLanguage(normalizeText(button.textContent))));
  bindManagedClick(copyButton, async () => {
    const snippet = requestCode?.textContent || requestSnippets.curl;
    try {
      await navigator.clipboard.writeText(snippet);
      showToast(doc, "API example copied to the clipboard.");
    } catch {
      showToast(doc, "Copy unavailable in this browser context, but the example is ready to copy manually.");
    }
  });
}

function enhanceSubmitPlugin(doc) {
  if (doc.body.dataset.aegisDepotSubmit === "true") return;
  doc.body.dataset.aegisDepotSubmit = "true";
  injectStyles(doc);

  const state = readState();
  const formArea = Array.from(doc.querySelectorAll("main > div, main > section")).find((node) => normalizeText(node.textContent).includes("submit new plugin")) || doc.body;
  const formButtons = Array.from(formArea.querySelectorAll("button"));
  const pluginName = doc.querySelector('input[placeholder*="CyberShield"]');
  const version = doc.querySelector('input[placeholder*="1.0.0"]');
  const category = doc.querySelector("select");
  const description = doc.querySelector('textarea, input[placeholder*="Briefly describe"]');
  const repository = doc.querySelector('input[placeholder*="username/repo"]');
  const uploadPanel = Array.from(doc.querySelectorAll("div")).find((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("click to upload or drag and drop")
      && text.includes("maximum file size")
      && !text.includes("save draft")
      && !text.includes("submit for review");
  });
  const saveDraft = formButtons.find((node) => normalizeText(node.textContent) === "save draft") || findButton(doc, "Save Draft");
  const submit = formButtons.find((node) => normalizeText(node.textContent).includes("submit for review")) || findButton(doc, "Submit for Review");
  const docsLink = findButton(doc, "View Developer Docs");

  const draft = state.submissionDraft || DEFAULT_STATE.submissionDraft;
  if (pluginName) pluginName.value = draft.pluginName || "";
  if (version) version.value = draft.version || "";
  if (category && draft.category) category.value = draft.category;
  if (description) description.value = draft.description || "";
  if (repository) repository.value = draft.repository || "";
  if (uploadPanel && draft.packageName) {
    const prompt = uploadPanel.querySelector("p");
    if (prompt) prompt.textContent = draft.packageName;
  }

  const syncDraft = () => {
    patchState({
      submissionDraft: {
        pluginName: pluginName?.value || "",
        version: version?.value || "",
        category: category?.value || "",
        description: description?.value || "",
        repository: repository?.value || "",
        packageName: readState().submissionDraft.packageName || "",
      },
    });
  };

  [pluginName, version, category, description, repository].forEach((field) => field?.addEventListener("input", syncDraft));
  category?.addEventListener("change", syncDraft);

  bindManagedClick(uploadPanel, () => {
    const current = readState();
    patchState({
      submissionDraft: {
        ...current.submissionDraft,
        packageName: current.editingSubmissionId ? `${current.editingSubmissionId}.zip` : "plugin-package.zip",
      },
    });
    const prompt = Array.from(uploadPanel.querySelectorAll("p")).find((node) => /click to upload/i.test(node.textContent || ""));
    if (prompt) prompt.textContent = readState().submissionDraft.packageName;
    showToast(doc, "Local package stub attached to the submission draft.");
  });

  bindManagedClick(docsLink, () => navigateTo("/developer-depot/api-reference-aegis-protocol/"));
  bindManagedClick(saveDraft, () => {
    syncDraft();
    showToast(doc, "Draft saved to your local Developer Depot workspace.");
  });

  bindManagedClick(submit, () => {
    syncDraft();
    const current = readState();
    const nextDraft = readState().submissionDraft;
    if (!nextDraft.pluginName.trim()) {
      setMessage(formArea, "Add a plugin name before submitting to the Depot review flow.", "error");
      pluginName?.focus();
      return;
    }
    if (!nextDraft.version.trim()) {
      setMessage(formArea, "Version information is required for semantic review.", "error");
      version?.focus();
      return;
    }
    if (!nextDraft.category || /select a category/i.test(nextDraft.category)) {
      setMessage(formArea, "Choose a category so the review queue can classify this submission.", "error");
      category?.focus();
      return;
    }
    if (!nextDraft.description.trim()) {
      setMessage(formArea, "Describe the plugin clearly before routing it into review.", "error");
      description?.focus();
      return;
    }
    if (!nextDraft.packageName && !nextDraft.repository.trim()) {
      setMessage(formArea, "Attach a package stub or provide a repository path before submitting.", "error");
      return;
    }

    const createdLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const submission = {
      id: current.editingSubmissionId || slugify(nextDraft.pluginName),
      name: nextDraft.pluginName,
      version: nextDraft.version,
      category: nextDraft.category,
      description: nextDraft.description,
      status: "In Review",
      updatedLabel: `Submitted ${createdLabel}`,
      createdLabel,
      downloads: 0,
      rating: 0,
      packageName: nextDraft.packageName,
      reason: "",
    };

    const remaining = current.submissions.filter((entry) => entry.id !== submission.id);
    patchState({
      editingSubmissionId: "",
      submissionDraft: { ...DEFAULT_STATE.submissionDraft },
      submissions: [submission, ...remaining],
    });
    setMessage(formArea, "Submission accepted into the governed review queue. Routing to your inventory.", "success");
    window.setTimeout(() => navigateTo("/developer-depot/my-submissions-dashboard/"), 180);
  });
}

function enhanceMySubmissions(doc) {
  if (doc.body.dataset.aegisDepotSubmissions === "true") return;
  doc.body.dataset.aegisDepotSubmissions = "true";
  injectStyles(doc);

  const search = doc.querySelector('input[placeholder*="Search your plugins"]');
  const submitNew = findButton(doc, "Submit New Plugin");
  const filterButton = findButton(doc, "Filter");
  const sortButton = findButton(doc, "Sort");
  const inventoryHeading = Array.from(doc.querySelectorAll("h3")).find((node) => normalizeText(node.textContent).includes("submission inventory"));
  const inventoryList = inventoryHeading?.closest(".rounded-3xl")?.querySelector(".space-y-4") || Array.from(doc.querySelectorAll(".space-y-4")).find((node) => normalizeText(node.textContent).includes("aegisguard pro"));
  const statsBlock = Array.from(doc.querySelectorAll("main .grid")).find((node) => normalizeText(node.textContent).includes("total submissions"));
  const statusCycle = ["all", "published", "in review", "draft", "rejected"];
  const sortCycle = ["updated", "status", "name"];
  const iconForStatus = { Published: "extension", "In Review": "data_thresholding", Draft: "terminal", Rejected: "heart_broken" };

  const renderStats = (submissions) => {
    if (!statsBlock) return;
    const cards = Array.from(statsBlock.children).slice(0, 4);
    const published = submissions.filter((entry) => entry.status === "Published").length;
    const reviewing = submissions.filter((entry) => entry.status === "In Review").length;
    const totalDownloads = submissions.reduce((sum, entry) => sum + (entry.downloads || 0), 0);
    const values = [`${submissions.length}`, `${published}`, `${reviewing}`, `${(totalDownloads / 1000).toFixed(1)}k`];
    cards.forEach((card, index) => {
      const metric = card.querySelectorAll("div")[2];
      if (metric) metric.textContent = values[index];
    });
  };

  const renderInventory = () => {
    const state = readState();
    const query = normalizeText(search?.value || "");
    const filter = state.submissionFilter || "all";
    const sort = state.submissionSort || "updated";
    const submissions = state.submissions
      .filter((entry) => filter === "all" || normalizeText(entry.status) === filter)
      .filter((entry) => !query || normalizeText([entry.name, entry.category, entry.description, entry.status].join(" ")).includes(query))
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "status") return a.status.localeCompare(b.status);
        return b.id.localeCompare(a.id);
      });

    renderStats(state.submissions);
    if (!inventoryList) return;
    inventoryList.innerHTML = submissions.map((entry) => {
      const actions = entry.status === "Published"
        ? `<button data-action="edit" data-id="${entry.id}" aria-label="edit"><span class="material-symbols-outlined">edit</span></button>
           <button data-action="upload" data-id="${entry.id}" aria-label="upload"><span class="material-symbols-outlined">upload_file</span></button>
           <button data-action="analytics" data-id="${entry.id}" aria-label="analytics"><span class="material-symbols-outlined">query_stats</span></button>
           <button data-action="delete" data-id="${entry.id}" aria-label="delete"><span class="material-symbols-outlined">delete</span></button>`
        : entry.status === "In Review"
          ? `<button data-action="edit" data-id="${entry.id}" aria-label="edit"><span class="material-symbols-outlined">edit</span></button>
             <button data-action="delete" data-id="${entry.id}" aria-label="delete"><span class="material-symbols-outlined">delete</span></button>`
          : entry.status === "Draft"
            ? `<button data-action="edit" data-id="${entry.id}" aria-label="edit"><span class="material-symbols-outlined">edit</span></button>
               <button data-action="publish" data-id="${entry.id}" aria-label="publish"><span class="material-symbols-outlined">publish</span></button>
               <button data-action="delete" data-id="${entry.id}" aria-label="delete"><span class="material-symbols-outlined">delete</span></button>`
            : `<button data-action="reason" data-id="${entry.id}">View Reason</button>
               <button data-action="replay" data-id="${entry.id}" aria-label="replay"><span class="material-symbols-outlined">replay</span></button>`;

      return `<div class="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4" data-submission-id="${entry.id}">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-slate-300">${iconForStatus[entry.status] || "extension"}</span>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="text-base font-semibold">${entry.name}</h4>
                <span class="text-xs uppercase tracking-[0.24em] text-amber-300">${entry.status}</span>
              </div>
              <p class="text-sm text-slate-400">${entry.version} • ${entry.category} • ${entry.updatedLabel}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">${actions}</div>
        </div>
      </div>`;
    }).join("");

    Array.from(inventoryList.querySelectorAll("[data-action]")).forEach((button) => {
      bindManagedClick(button, () => {
        const current = readState();
        const entry = current.submissions.find((item) => item.id === button.dataset.id);
        if (!entry) return;
        if (button.dataset.action === "edit") {
          updateDraftFromSubmission(entry);
          navigateTo("/developer-depot/submit-plugin-to-depot/");
          return;
        }
        if (button.dataset.action === "analytics") {
          patchState({ analytics: { ...current.analytics, selectedSubmissionId: entry.id } });
          navigateTo("/developer-depot/plugin-developer-analytics/");
          return;
        }
        if (button.dataset.action === "upload") {
          patchState({ submissions: current.submissions.map((item) => item.id === entry.id ? { ...item, updatedLabel: "Updated moments ago" } : item) });
          renderInventory();
          showToast(doc, `${entry.name} update staged for governed confirmation.`);
          return;
        }
        if (button.dataset.action === "publish") {
          patchState({ submissions: current.submissions.map((item) => item.id === entry.id ? { ...item, status: "In Review", updatedLabel: "Submitted just now" } : item) });
          renderInventory();
          showToast(doc, `${entry.name} routed from draft into review.`);
          return;
        }
        if (button.dataset.action === "reason") {
          showToast(doc, entry.reason || "Review notes unavailable for this submission.");
          return;
        }
        if (button.dataset.action === "replay") {
          updateDraftFromSubmission(entry);
          navigateTo("/developer-depot/submit-plugin-to-depot/");
          return;
        }
        if (button.dataset.action === "delete") {
          patchState({ submissions: current.submissions.filter((item) => item.id !== entry.id) });
          renderInventory();
          showToast(doc, `${entry.name} removed from the local Depot inventory.`);
        }
      });
    });
  };

  bindManagedClick(submitNew, () => {
    patchState({ editingSubmissionId: "", submissionDraft: { ...DEFAULT_STATE.submissionDraft } });
    navigateTo("/developer-depot/submit-plugin-to-depot/");
  });
  bindManagedClick(filterButton, () => {
    const current = readState();
    const index = statusCycle.indexOf(current.submissionFilter || "all");
    patchState({ submissionFilter: statusCycle[(index + 1) % statusCycle.length] });
    renderInventory();
    showToast(doc, `Inventory filter: ${readState().submissionFilter}.`);
  });
  bindManagedClick(sortButton, () => {
    const current = readState();
    const index = sortCycle.indexOf(current.submissionSort || "updated");
    patchState({ submissionSort: sortCycle[(index + 1) % sortCycle.length] });
    renderInventory();
    showToast(doc, `Inventory sort: ${readState().submissionSort}.`);
  });
  search?.addEventListener("input", renderInventory);
  renderInventory();
}

function enhanceAnalytics(doc) {
  if (doc.body.dataset.aegisDepotAnalytics === "true") return;
  doc.body.dataset.aegisDepotAnalytics = "true";
  injectStyles(doc);

  const state = readState();
  const rangeButtons = ["7D", "30D", "90D", "1Y"].map((label) => findButton(doc, label)).filter(Boolean);
  const manage = findButton(doc, "Manage Plugin");
  const pushUpdate = findButton(doc, "Push Update");
  const viewAll = findButton(doc, "View All");
  const readDocs = findButton(doc, "Read the docs");
  const back = findButton(doc, "Back to My Submissions");
  const navLinks = Array.from(doc.querySelectorAll("header a, nav a")).filter((node) => ["My Submissions", "Plugins", "Analytics"].some((label) => normalizeText(node.textContent).includes(normalizeText(label))));
  const statHeadings = Array.from(doc.querySelectorAll("p")).filter((node) => ["Total Downloads", "Avg Rating", "Active Installs", "Revenue"].includes(node.textContent?.trim()));

  const renderRange = (range) => {
    const values = ANALYTICS_RANGES[range] || ANALYTICS_RANGES["30D"];
    statHeadings.forEach((heading) => {
      const metric = heading.parentElement?.parentElement?.querySelector("h3")
        || heading.closest("div")?.parentElement?.querySelector("h3");
      if (!metric) return;
      if (heading.textContent.includes("Downloads")) metric.textContent = values.downloads;
      if (heading.textContent.includes("Rating")) metric.textContent = values.rating;
      if (heading.textContent.includes("Active Installs")) metric.textContent = values.installs;
      if (heading.textContent.includes("Revenue")) metric.textContent = values.revenue;
    });
    rangeButtons.forEach((button) => button.classList.toggle("aegis-active-anchor", normalizeText(button.textContent) === normalizeText(range)));
    const current = readState();
    patchState({ analytics: { ...current.analytics, range } });
  };

  renderRange(state.analytics.range || "30D");

  navLinks.forEach((link) => bindManagedClick(link, () => {
    const label = normalizeText(link.textContent);
    if (label.includes("my submissions")) navigateTo("/developer-depot/my-submissions-dashboard/");
    else if (label.includes("plugins")) navigateTo("/developer-depot/developer-hub-depot/");
  }));
  bindManagedClick(manage, () => navigateTo("/developer-depot/my-submissions-dashboard/"));
  bindManagedClick(pushUpdate, () => {
    const current = readState();
    patchState({
      submissions: current.submissions.map((entry) => entry.id === (current.analytics.selectedSubmissionId || "aegisguard-pro")
        ? { ...entry, version: entry.version === "2.4.1" ? "2.4.2" : entry.version, updatedLabel: "Updated moments ago" }
        : entry),
    });
    showToast(doc, "Plugin update prepared and reflected in local release state.");
  });
  bindManagedClick(viewAll, () => {
    const target = Array.from(doc.querySelectorAll("h2")).find((node) => normalizeText(node.textContent).includes("user sentiment"));
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    target?.closest(".rounded-2xl")?.classList.add("aegis-highlight-ring");
    window.setTimeout(() => target?.closest(".rounded-2xl")?.classList.remove("aegis-highlight-ring"), 900);
  });
  bindManagedClick(readDocs, () => navigateTo("/developer-depot/api-reference-aegis-protocol/"));
  bindManagedClick(back, () => navigateTo("/developer-depot/my-submissions-dashboard/"));
  rangeButtons.forEach((button) => bindManagedClick(button, () => renderRange(button.textContent.trim())));
}

const pageEnhancers = {
  "developer-hub-depot": enhanceDeveloperHub,
  "api-reference-aegis-protocol": enhanceApiReference,
  "submit-plugin-to-depot": enhanceSubmitPlugin,
  "my-submissions-dashboard": enhanceMySubmissions,
  "plugin-developer-analytics": enhanceAnalytics,
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
    // same-origin stitched frames should be accessible; ignore if not yet ready
  }
}

function initDeveloperDepotActivation() {
  if (!document.body.classList.contains("domain-developer-depot")) return;
  const boot = () => {
    document.querySelectorAll("iframe").forEach((frame) => {
      if (frame.dataset.aegisDepotBound === "true") return;
      frame.dataset.aegisDepotBound = "true";
      frame.addEventListener("load", () => enhanceFrame(frame));
      enhanceFrame(frame);
    });
  };
  boot();
  const observer = new MutationObserver(boot);
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDeveloperDepotActivation, { once: true });
} else {
  initDeveloperDepotActivation();
}
