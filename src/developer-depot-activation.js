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
  console: {
    range: "Last 24 Hours",
    logFilter: "",
    notices: 2,
    activeApiKeyId: "production-master",
  },
  usageReport: {
    range: "Last 7 Days",
  },
  webhooks: {
    endpointUrl: "",
    description: "",
    filters: [],
    selectedEndpointId: "",
  },
  protocolConfig: {
    syncInterval: 100,
    consensus: "Arbitor Mesh",
    autoDiscovery: true,
    encryption: "Standard (AES-256)",
    rotation: "24h Rotation",
    vpcTunnel: false,
    minNodes: 3,
    uptimeWeight: 0.6,
    latencyWeight: 0.4,
    modifiedCount: 4,
  },
  nodes: {
    search: "",
    filter: "All Nodes",
  },
  isolated: {
    lastAudit: "",
    standby: false,
  },
  topology: {
    viewMode: "Spatial",
    regions: ["North America (US)", "European Union (EU)"],
    protocolLayer: "Encrypted (AEGIS-V2)",
    focusedNode: "NY-CORE-MASTER",
    zoom: 100,
  },
  colab: {
    search: "",
    title: "",
    stack: "Rust (Substrate)",
    goal: "",
    stage: "alpha",
    selectedProject: "Aegis-Vault Protocol",
  },
  web3: {
    search: "",
    connected: true,
    selectedModule: ".digitalself",
    delegatedProposal: "",
    selectedCredential: "Passport Credential",
  },
  apiKeys: [
    {
      id: "production-master",
      name: "Production Master",
      token: "ae_live_8293....9x2a",
      permissions: "Full Access",
      lastRolledLabel: "Live in gateway cluster",
    },
    {
      id: "frontend-analytics",
      name: "Frontend Analytics",
      token: "ae_pk_1102....j8w1",
      permissions: "Read Only",
      lastRolledLabel: "Scoped to client telemetry",
    },
  ],
  webhooksList: [
    {
      id: "acme-primary",
      url: "https://api.acme.co/webhooks/aegis",
      enabled: true,
      secret: "whsec_6B9zN3r9K2lP8q5V1mX7jC4...",
      events: ["shield.breach", "node.offline"],
    },
    {
      id: "slack-ops",
      url: "https://hooks.slack.com/services/T000/B000...",
      enabled: true,
      secret: "whsec_vA8xM2q4P9L1k0R6fG3yH...",
      events: ["system.alert", "user.login", "security.auth_fail"],
    },
  ],
  webhookDeliveries: [
    {
      id: "delivery-1",
      timestampDate: "2023-11-24",
      timestampTime: "14:22:31 UTC",
      event: "shield.breach",
      endpoint: "api.acme.co/webhooks...",
      status: "200 OK",
      responseTime: "124ms",
    },
    {
      id: "delivery-2",
      timestampDate: "2023-11-24",
      timestampTime: "14:18:05 UTC",
      event: "node.offline",
      endpoint: "api.acme.co/webhooks...",
      status: "500 Error",
      responseTime: "2150ms",
    },
    {
      id: "delivery-3",
      timestampDate: "2023-11-24",
      timestampTime: "13:55:12 UTC",
      event: "user.login",
      endpoint: "hooks.slack.com/...",
      status: "200 OK",
      responseTime: "89ms",
    },
  ],
  nodesList: [
    {
      id: "#7721-DELTA-ORION",
      region: "US-EAST-1 • North Virginia",
      status: "ONLINE",
      cpu: "CPU 12%",
      latency: "24ms",
      uptime: "42d 12h 05m",
      version: "v2.4.1",
      alertLabel: "",
    },
    {
      id: "#8902-SIGMA-LYRA",
      region: "EU-WEST-2 • London",
      status: "Synchronizing",
      cpu: "CPU 88%",
      latency: "142ms",
      uptime: "0d 04h 22m",
      version: "v2.4.1",
      alertLabel: "High sync latency",
    },
    {
      id: "#1029-KAPPA-CYGNUS",
      region: "AP-SOUTH-1 • Mumbai",
      status: "ONLINE",
      cpu: "CPU 24%",
      latency: "62ms",
      uptime: "15d 10h 31m",
      version: "v2.4.0",
      alertLabel: "",
    },
    {
      id: "#5512-ZETA-RETI",
      region: "SA-EAST-1 • Sao Paulo",
      status: "Error",
      cpu: "N/A",
      latency: "TIMEOUT",
      uptime: "—",
      version: "v2.3.9",
      alertLabel: "Disconnected unexpectedly",
    },
  ],
  requestLog: [
    "[14:22:01] POST /v2/protocol/handshake 200 OK 42ms",
    "[14:22:03] GET /v2/metrics/realtime 200 OK 12ms",
    "[14:22:05] POST /v2/auth/validate 401 Unauthorized 21ms",
    "[14:22:08] PATCH /v2/node/config 200 OK 156ms",
    "[14:22:12] POST /v2/protocol/handshake 200 OK 38ms",
    "[14:22:15] GET /v2/user/session 200 OK 8ms",
    "[14:22:19] POST /v2/protocol/handshake 200 OK 40ms",
    "[14:22:21] # System: Garbage collection completed",
    "[14:22:24] GET /v2/node/health 200 OK 5ms",
    "[14:22:25] POST /v2/protocol/handshake 200 OK 45ms",
  ],
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
    console: { ...base.console, ...(stored?.console || {}) },
    usageReport: { ...base.usageReport, ...(stored?.usageReport || {}) },
    webhooks: { ...base.webhooks, ...(stored?.webhooks || {}) },
    protocolConfig: { ...base.protocolConfig, ...(stored?.protocolConfig || {}) },
    nodes: { ...base.nodes, ...(stored?.nodes || {}) },
    isolated: { ...base.isolated, ...(stored?.isolated || {}) },
    topology: {
      ...base.topology,
      ...(stored?.topology || {}),
      regions: Array.isArray(stored?.topology?.regions) && stored.topology.regions.length
        ? stored.topology.regions
        : base.topology.regions,
    },
    colab: { ...base.colab, ...(stored?.colab || {}) },
    web3: { ...base.web3, ...(stored?.web3 || {}) },
    apiKeys: Array.isArray(stored?.apiKeys) && stored.apiKeys.length ? stored.apiKeys : base.apiKeys,
    webhooksList: Array.isArray(stored?.webhooksList) && stored.webhooksList.length ? stored.webhooksList : base.webhooksList,
    webhookDeliveries: Array.isArray(stored?.webhookDeliveries) && stored.webhookDeliveries.length ? stored.webhookDeliveries : base.webhookDeliveries,
    nodesList: Array.isArray(stored?.nodesList) && stored.nodesList.length ? stored.nodesList : base.nodesList,
    requestLog: Array.isArray(stored?.requestLog) && stored.requestLog.length ? stored.requestLog : base.requestLog,
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

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function resolveWebhookEventName(node) {
  const label = normalizeText(node?.closest("label, div")?.textContent || "");
  return ["node.online", "node.offline", "shield.breach", "auth.failure", "quota.warning", "billing.alert"]
    .find((item) => label.includes(item)) || "";
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

function resolveNodeRowId(row) {
  return row?.querySelector("td .font-bold")?.textContent?.trim()
    || row?.querySelector("td span")?.textContent?.trim()
    || "";
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

function enhanceDeveloperConsole(doc) {
  if (doc.body.dataset.aegisDepotConsole === "true") return;
  doc.body.dataset.aegisDepotConsole = "true";
  injectStyles(doc);

  const navLinks = Array.from(doc.querySelectorAll("nav a"));
  const newProject = findButton(doc, "New Project");
  const copyButton = findButton(doc, "content_copy");
  const rangeSelect = doc.querySelector("select");
  const generateKey = findButton(doc, "Generate New Key");
  const rollButtons = Array.from(doc.querySelectorAll("button")).filter((node) => normalizeText(node.textContent) === "roll key");
  const logInput = doc.querySelector('input[placeholder*="Filter logs"]');
  const notifications = Array.from(doc.querySelectorAll("button, div")).find((node) => normalizeText(node.textContent) === "notifications");
  const stats = Array.from(doc.querySelectorAll("p")).filter((node) =>
    ["Total Requests (24h)", "Avg. Latency", "Error Rate", "Active Webhooks"].includes(node.textContent?.trim()));
  const logs = Array.from(doc.querySelectorAll("main div")).filter((node) => /^\[\d{2}:\d{2}:\d{2}\]/.test((node.textContent || "").trim()));
  const apiKeyCards = Array.from(doc.querySelectorAll("p")).filter((node) => ["Production Master", "Frontend Analytics"].includes(node.textContent?.trim()));

  const renderConsole = () => {
    const state = readState();
    const range = state.console.range || "Last 24 Hours";
    const statMap = {
      "Last 24 Hours": [
        { value: "1,245,892", delta: "+12.4%" },
        { value: "42.8ms", delta: "-2.1ms" },
        { value: "0.04%", delta: "Stable" },
        { value: String(state.webhooksList.filter((item) => item.enabled).length), delta: "Healthy" },
      ],
      "Last 7 Days": [
        { value: "8,904,220", delta: "+8.9%" },
        { value: "48.2ms", delta: "+3.4ms" },
        { value: "0.06%", delta: "Monitored" },
        { value: String(state.webhooksList.filter((item) => item.enabled).length), delta: "Healthy" },
      ],
    };
    const selected = statMap[range] || statMap["Last 24 Hours"];
    stats.forEach((label, index) => {
      const card = label.closest("div");
      const metric = card?.querySelector("h4");
      const delta = card?.querySelectorAll("div")[2];
      if (metric) metric.textContent = selected[index].value;
      if (delta) delta.textContent = selected[index].delta;
    });

    if (rangeSelect) rangeSelect.value = range;

    const filteredLogs = state.requestLog.filter((entry) => !state.console.logFilter || normalizeText(entry).includes(normalizeText(state.console.logFilter)));
    logs.forEach((node, index) => {
      node.textContent = filteredLogs[index] || state.requestLog[index] || "";
      node.classList.toggle("aegis-hidden", !node.textContent);
    });

    apiKeyCards.forEach((label) => {
      const key = state.apiKeys.find((item) => item.name === label.textContent?.trim());
      if (!key) return;
      const card = label.closest("div");
      const token = Array.from(card?.querySelectorAll("p") || []).find((node) => node !== label && /^ae_/.test(node.textContent || ""));
      const permissionValue = Array.from(card?.querySelectorAll("p") || []).find((node) =>
        ["Full Access", "Read Only", "Scoped Access"].includes(node.textContent?.trim()));
      if (token) token.textContent = key.token;
      if (permissionValue) permissionValue.textContent = key.permissions;
    });
  };

  navLinks.forEach((link) => bindManagedClick(link, () => {
    const label = normalizeText(link.textContent);
    if (label.includes("overview")) navigateTo("/developer-depot/developer-console-aegis-protocol/");
    else if (label.includes("api keys")) {
      const keySection = Array.from(doc.querySelectorAll("h3")).find((node) => normalizeText(node.textContent).includes("active api keys"));
      keySection?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (label.includes("webhooks")) navigateTo("/developer-depot/webhooks-configuration-aegis-protocol/");
    else if (label.includes("usage metrics")) navigateTo("/developer-depot/api-usage-report-aegis-protocol/");
    else if (label.includes("cli access")) {
      logInput?.focus();
      showToast(doc, "CLI coordination ready. Type a filter or command pattern.");
    }
  }));

  bindManagedClick(newProject, () => {
    showToast(doc, "New protocol workspace scaffolded in your local Developer Depot session.");
  });
  bindManagedClick(copyButton, async () => {
    const snippet = Array.from(doc.querySelectorAll("div")).find((node) => /^\$ curl -sSL/.test((node.textContent || "").trim()))?.textContent?.trim() || "";
    try {
      await navigator.clipboard.writeText(snippet);
      showToast(doc, "Quick-start command copied.");
    } catch {
      showToast(doc, "Copy unavailable here, but the command is ready.");
    }
  });
  rangeSelect?.addEventListener("change", () => {
    const current = readState();
    patchState({ console: { ...current.console, range: rangeSelect.value } });
    renderConsole();
  });
  bindManagedClick(generateKey, () => {
    const current = readState();
    const nextIndex = current.apiKeys.length + 1;
    patchState({
      apiKeys: [
        {
          id: `generated-${Date.now()}`,
          name: `Scoped Worker ${nextIndex}`,
          token: `ae_scoped_${Math.random().toString(36).slice(2, 6)}....${Math.random().toString(36).slice(2, 6)}`,
          permissions: "Scoped Access",
          lastRolledLabel: "Generated just now",
        },
        ...current.apiKeys,
      ],
    });
    showToast(doc, "New scoped API key generated and stored locally.");
    renderConsole();
  });
  rollButtons.forEach((button) => bindManagedClick(button, () => {
    const label = Array.from(button.closest("div")?.querySelectorAll("p") || []).find((node) => !/^Permissions$/i.test(node.textContent || "") && !["Full Access", "Read Only", "Scoped Access"].includes(node.textContent?.trim()));
    const current = readState();
    const target = current.apiKeys.find((item) => item.name === label?.textContent?.trim());
    if (!target) return;
    patchState({
      apiKeys: current.apiKeys.map((item) => item.id === target.id
        ? { ...item, token: `${item.token.slice(0, 9)}${Math.random().toString(36).slice(2, 6)}....${Math.random().toString(36).slice(2, 6)}` }
        : item),
    });
    showToast(doc, `${target.name} rotated and reflected in local state.`);
    renderConsole();
  }));
  logInput?.addEventListener("input", () => {
    const current = readState();
    patchState({ console: { ...current.console, logFilter: logInput.value } });
    renderConsole();
  });
  bindManagedClick(notifications, () => {
    const current = readState();
    const nextCount = Math.max(0, (current.console.notices || 0) - 1);
    patchState({ console: { ...current.console, notices: nextCount } });
    showToast(doc, nextCount ? `${nextCount} protocol notices still need review.` : "All protocol notices reviewed.");
  });

  renderConsole();
}

function enhanceUsageReport(doc) {
  if (doc.body.dataset.aegisDepotUsage === "true") return;
  doc.body.dataset.aegisDepotUsage = "true";
  injectStyles(doc);

  const rangeButton = Array.from(doc.querySelectorAll("div, button")).find((node) => normalizeText(node.textContent).includes("last 7 days"));
  const exportPdf = findButton(doc, "Export PDF");
  const heatmap = findButton(doc, "View Global Heatmap");
  const footerStatus = findButton(doc, "API Status");
  const footerDocs = findButton(doc, "Documentation");
  const footerSecurity = findButton(doc, "Security");
  const totalRequestsLabel = Array.from(doc.querySelectorAll("p")).find((node) => node.textContent?.trim() === "Total Requests");
  const dataTransferredLabel = Array.from(doc.querySelectorAll("p")).find((node) => node.textContent?.trim() === "Data Transferred");
  const endpointRows = Array.from(doc.querySelectorAll("tbody tr"));

  const renderUsage = () => {
    const state = readState();
    const range = state.usageReport.range || "Last 7 Days";
    const stats = {
      "Last 24 Hours": { requests: "1.8M", transferred: "124.6 GB" },
      "Last 7 Days": { requests: "12.4M", transferred: "856.2 GB" },
      "Last 30 Days": { requests: "48.9M", transferred: "3.2 TB" },
    };
    const selected = stats[range] || stats["Last 7 Days"];
    const requestMetric = totalRequestsLabel?.parentElement?.querySelector("h3");
    const transferMetric = dataTransferredLabel?.parentElement?.querySelector("h3");
    if (requestMetric) requestMetric.textContent = selected.requests;
    if (transferMetric) transferMetric.textContent = selected.transferred;
    if (rangeButton) {
      const labelNode = Array.from(rangeButton.querySelectorAll("*")).find((node) => ["Last 24 Hours", "Last 7 Days", "Last 30 Days"].includes(node.textContent?.trim()));
      if (labelNode) labelNode.textContent = range;
    }
    endpointRows.forEach((row, index) => row.classList.toggle("aegis-hidden", range === "Last 24 Hours" && index > 2));
  };

  bindManagedClick(rangeButton, () => {
    const current = readState();
    const order = ["Last 24 Hours", "Last 7 Days", "Last 30 Days"];
    const index = order.indexOf(current.usageReport.range || "Last 7 Days");
    patchState({ usageReport: { range: order[(index + 1) % order.length] } });
    renderUsage();
    showToast(doc, `Usage report window: ${readState().usageReport.range}.`);
  });
  bindManagedClick(exportPdf, () => showToast(doc, "Usage report export staged as a local PDF artifact."));
  bindManagedClick(heatmap, () => navigateTo("/developer-depot/node-management-aegis-protocol/"));
  bindManagedClick(footerStatus, () => navigateTo("/developer-depot/developer-console-aegis-protocol/"));
  bindManagedClick(footerDocs, () => navigateTo("/developer-depot/api-reference-aegis-protocol/"));
  bindManagedClick(footerSecurity, () => navigateTo("/developer-depot/protocol-configuration-aegis-protocol/"));

  renderUsage();
}

function enhanceWebhooks(doc) {
  if (doc.body.dataset.aegisDepotWebhooks === "true") return;
  doc.body.dataset.aegisDepotWebhooks = "true";
  injectStyles(doc);

  const addEndpointTop = findButton(doc, "Add New Endpoint");
  const endpointUrl = doc.querySelector('input[placeholder*="https://your-api.com/webhooks"]');
  const description = doc.querySelector('textarea, input[placeholder*="Identify this webhook"]');
  const eventCheckboxes = Array.from(doc.querySelectorAll('input[type="checkbox"]')).filter((node) => {
    return Boolean(resolveWebhookEventName(node));
  });
  const cancelButton = findButton(doc, "Cancel");
  const createButton = findButton(doc, "Create Endpoint");
  const viewAllLogs = findButton(doc, "View All Logs");
  const editButtons = Array.from(doc.querySelectorAll("button")).filter((node) => normalizeText(node.textContent) === "edit");
  const deleteButtons = Array.from(doc.querySelectorAll("button")).filter((node) => normalizeText(node.textContent) === "delete");
  const visibilityButtons = Array.from(doc.querySelectorAll("button")).filter((node) => normalizeText(node.textContent) === "visibility");
  const enabledCheckboxes = Array.from(doc.querySelectorAll('input[type="checkbox"]')).filter((node) => !node.getAttribute("aria-label"));
  const endpointHeadings = Array.from(doc.querySelectorAll("h3")).filter((node) => /^https?:\/\//.test(node.textContent || ""));
  const deliveriesHeading = Array.from(doc.querySelectorAll("h3")).find((node) => normalizeText(node.textContent).includes("recent deliveries"));
  const deliveriesBody = deliveriesHeading?.closest("div")?.querySelector("tbody");

  const syncWebhookDraft = () => {
    const current = readState();
    const selectedEvents = eventCheckboxes.filter((node) => node.checked).map((node) => resolveWebhookEventName(node)).filter(Boolean);
    patchState({
      webhooks: {
        ...current.webhooks,
        endpointUrl: endpointUrl?.value || "",
        description: description?.value || "",
        filters: selectedEvents,
      },
    });
  };

  const renderWebhooks = () => {
    const state = readState();
    if (endpointUrl) endpointUrl.value = state.webhooks.endpointUrl || "";
    if (description) description.value = state.webhooks.description || "";
    eventCheckboxes.forEach((node) => {
      node.checked = state.webhooks.filters.includes(resolveWebhookEventName(node));
    });
    endpointHeadings.forEach((heading, index) => {
      const item = state.webhooksList[index];
      if (!item) return;
      heading.textContent = item.url;
      const card = heading.closest("div");
      const enabledText = Array.from(card?.querySelectorAll("div, p") || []).find((node) => /Enabled|Paused/i.test(node.textContent || ""));
      if (enabledText) enabledText.textContent = item.enabled ? "Enabled" : "Paused";
      const secretText = Array.from(card?.querySelectorAll("div") || []).find((node) => /^whsec_/.test(node.textContent || ""));
      if (secretText) secretText.textContent = state.webhooks.selectedEndpointId === item.id ? item.secret : `${item.secret.slice(0, 20)}...`;
    });

    if (deliveriesBody) {
      deliveriesBody.innerHTML = state.webhookDeliveries.map((item) => `
        <tr>
          <td><div><div>${item.timestampDate}</div><div>${item.timestampTime}</div></div></td>
          <td>${item.event}</td>
          <td><div>${item.endpoint}</div></td>
          <td><div>${item.status}</div></td>
          <td>${item.responseTime}</td>
        </tr>
      `).join("");
    }
  };

  [endpointUrl, description].forEach((node) => node?.addEventListener("input", syncWebhookDraft));
  eventCheckboxes.forEach((node) => node.addEventListener("change", syncWebhookDraft));

  bindManagedClick(addEndpointTop, () => {
    endpointUrl?.focus();
    showToast(doc, "Webhook draft ready. Add an endpoint and subscribed events.");
  });
  bindManagedClick(cancelButton, () => {
    patchState({ webhooks: { endpointUrl: "", description: "", filters: [], selectedEndpointId: "" } });
    renderWebhooks();
    showToast(doc, "Webhook draft cleared.");
  });
  bindManagedClick(createButton, () => {
    syncWebhookDraft();
    const current = readState();
    if (!current.webhooks.endpointUrl.trim()) {
      showToast(doc, "Add an endpoint URL before creating the webhook.");
      endpointUrl?.focus();
      return;
    }
    if (!current.webhooks.filters.length) {
      showToast(doc, "Choose at least one event for the webhook subscription.");
      return;
    }
    patchState({
      webhooksList: [
        {
          id: slugify(current.webhooks.endpointUrl),
          url: current.webhooks.endpointUrl,
          enabled: true,
          secret: `whsec_${Math.random().toString(36).slice(2, 12)}...`,
          events: current.webhooks.filters,
        },
        ...current.webhooksList,
      ],
      webhooks: { endpointUrl: "", description: "", filters: [], selectedEndpointId: "" },
    });
    renderWebhooks();
    showToast(doc, "Webhook endpoint created and added to the local delivery mesh.");
  });
  bindManagedClick(viewAllLogs, () => navigateTo("/developer-depot/api-usage-report-aegis-protocol/"));
  visibilityButtons.forEach((button) => bindManagedClick(button, () => {
    const headingText = resolveDepotCardHeading(button);
    const current = readState();
    const item = current.webhooksList.find((entry) => entry.url === headingText);
    if (!item) return;
    patchState({ webhooks: { ...current.webhooks, selectedEndpointId: current.webhooks.selectedEndpointId === item.id ? "" : item.id } });
    renderWebhooks();
  }));
  editButtons.forEach((button) => bindManagedClick(button, () => {
    const headingText = resolveDepotCardHeading(button);
    const current = readState();
    const item = current.webhooksList.find((entry) => entry.url === headingText);
    if (!item) return;
    patchState({
      webhooks: {
        endpointUrl: item.url,
        description: `Editing ${item.url}`,
        filters: item.events,
        selectedEndpointId: item.id,
      },
    });
    renderWebhooks();
    endpointUrl?.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
  deleteButtons.forEach((button) => bindManagedClick(button, () => {
    const headingText = resolveDepotCardHeading(button);
    const current = readState();
    patchState({ webhooksList: current.webhooksList.filter((entry) => entry.url !== headingText) });
    renderWebhooks();
    showToast(doc, "Webhook endpoint removed from the local mesh.");
  }));
  enabledCheckboxes.forEach((checkbox, index) => {
    if (checkbox.dataset.aegisManaged === "true") return;
    checkbox.dataset.aegisManaged = "true";
    checkbox.addEventListener("change", () => {
      const current = readState();
      const item = current.webhooksList[index];
      if (!item) return;
      patchState({
        webhooksList: current.webhooksList.map((entry) => entry.id === item.id ? { ...entry, enabled: checkbox.checked } : entry),
      });
      renderWebhooks();
      showToast(doc, `${item.url} is now ${checkbox.checked ? "enabled" : "paused"}.`);
    });
  });

  renderWebhooks();
}

function enhanceNodeManagement(doc) {
  if (doc.body.dataset.aegisDepotNodes === "true") return;
  doc.body.dataset.aegisDepotNodes = "true";
  injectStyles(doc);

  const navLinks = Array.from(doc.querySelectorAll("header nav a"));
  const search = doc.querySelector('input[placeholder*="Quick search"]');
  const filterButtons = ["All Nodes", "Online", "Issues"].map((label) => findButton(doc, label)).filter(Boolean);
  const filterButton = findButton(doc, "Filter");
  const provisionButton = findButton(doc, "Provision Node");
  const alertButton = findButton(doc, "View all security alerts");
  const nodeRows = Array.from(doc.querySelectorAll("tbody tr"));
  const actionButtons = Array.from(doc.querySelectorAll("tbody button"));

  const renderNodes = () => {
    const state = readState();
    const query = normalizeText(state.nodes.search);
    const filteredNodes = state.nodesList.filter((node) => {
      const matchesQuery = !query || normalizeText(`${node.id} ${node.region} ${node.status} ${node.alertLabel}`).includes(query);
      const mode = state.nodes.filter || "All Nodes";
      const matchesMode = mode === "All Nodes"
        || (mode === "Online" && normalizeText(node.status) === "online")
        || (mode === "Issues" && normalizeText(node.status) !== "online");
      return matchesQuery && matchesMode;
    });

    nodeRows.forEach((row, index) => {
      const item = filteredNodes[index];
      row.classList.toggle("aegis-hidden", !item);
      if (!item) return;
      const cells = row.querySelectorAll("td");
      const title = row.querySelector("td .font-bold");
      const subtitle = row.querySelector("td .text-xs");
      if (title) title.textContent = item.id;
      if (subtitle) subtitle.textContent = item.region;
      if (cells[1]) cells[1].textContent = item.status;
      if (cells[2]) cells[2].textContent = `${item.cpu} ${item.latency}`;
      if (cells[3]) cells[3].textContent = item.uptime;
      if (cells[4]) cells[4].textContent = item.version;
    });

    filterButtons.forEach((button) => button.classList.toggle("aegis-active-anchor", normalizeText(button.textContent) === normalizeText(state.nodes.filter)));
    if (search) search.value = state.nodes.search;
  };

  navLinks.forEach((link) => bindManagedClick(link, () => {
    const label = normalizeText(link.textContent);
    if (label.includes("dashboard")) navigateTo("/developer-depot/developer-console-aegis-protocol/");
    else if (label.includes("nodes")) navigateTo("/developer-depot/node-management-aegis-protocol/");
    else if (label.includes("security")) navigateTo("/developer-depot/protocol-configuration-aegis-protocol/");
    else if (label.includes("logs")) navigateTo("/developer-depot/api-usage-report-aegis-protocol/");
  }));
  search?.addEventListener("input", () => {
    const current = readState();
    patchState({ nodes: { ...current.nodes, search: search.value } });
    renderNodes();
  });
  filterButtons.forEach((button) => bindManagedClick(button, () => {
    const current = readState();
    patchState({ nodes: { ...current.nodes, filter: button.textContent.trim() } });
    renderNodes();
  }));
  bindManagedClick(filterButton, () => {
    const current = readState();
    const order = ["All Nodes", "Online", "Issues"];
    const index = order.indexOf(current.nodes.filter || "All Nodes");
    patchState({ nodes: { ...current.nodes, filter: order[(index + 1) % order.length] } });
    renderNodes();
    showToast(doc, `Node view: ${readState().nodes.filter}.`);
  });
  bindManagedClick(provisionButton, () => {
    const current = readState();
    const id = `#${Math.floor(Math.random() * 9000) + 1000}-NEW-MESH`;
    patchState({
      nodesList: [
        {
          id,
          region: "US-WEST-2 • Phoenix",
          status: "Synchronizing",
          cpu: "CPU 9%",
          latency: "31ms",
          uptime: "0d 00h 02m",
          version: "v2.4.1",
          alertLabel: "Provisioning in progress",
        },
        ...current.nodesList,
      ],
    });
    renderNodes();
    showToast(doc, `${id} provisioned into the local mesh roster.`);
  });
  bindManagedClick(alertButton, () => navigateTo("/custodian-ui/security-incident-assessor-center/"));
  actionButtons.forEach((button) => bindManagedClick(button, () => {
    const row = button.closest("tr");
    const nodeId = resolveNodeRowId(row);
    const current = readState();
    const item = current.nodesList.find((entry) => entry.id === nodeId);
    if (!item) return;
    const icon = normalizeText(button.textContent);
    if (icon.includes("list_alt")) {
      showToast(doc, `${item.id} detail view opened in the local operator layer.`);
      return;
    }
    if (icon.includes("analytics")) {
      navigateTo("/developer-depot/api-usage-report-aegis-protocol/");
      return;
    }
    if (icon.includes("restart_alt")) {
      patchState({
        nodesList: current.nodesList.map((entry) => entry.id === item.id
          ? { ...entry, status: "Synchronizing", alertLabel: "Restart sequence initiated" }
          : entry),
      });
      renderNodes();
      showToast(doc, `${item.id} restart sequence initiated.`);
      return;
    }
    if (icon.includes("bolt")) {
      patchState({
        nodesList: current.nodesList.map((entry) => entry.id === item.id
          ? { ...entry, status: "ONLINE", cpu: "CPU 22%", latency: "61ms", uptime: "0d 00h 01m", alertLabel: "" }
          : entry),
      });
      renderNodes();
      showToast(doc, `${item.id} recovered and returned to service.`);
    }
  }));

  renderNodes();
}

function enhanceProtocolConfiguration(doc) {
  if (doc.body.dataset.aegisDepotProtocolConfig === "true") return;
  doc.body.dataset.aegisDepotProtocolConfig = "true";
  injectStyles(doc);

  const viewLogs = findButton(doc, "View Logs");
  const syncSlider = doc.querySelector('input[type="range"]');
  const selects = Array.from(doc.querySelectorAll("select"));
  const protocolCheckboxes = Array.from(doc.querySelectorAll('input[type="checkbox"]'));
  const autoDiscovery = protocolCheckboxes[0] || null;
  const vpcTunnel = protocolCheckboxes[1] || null;
  const minNodes = doc.querySelector('input[type="number"]');
  const resetButton = findButton(doc, "Reset to Defaults");
  const applyButton = findButton(doc, "Apply Changes");
  const footer = doc.querySelector("footer");
  const modifiedLabel = footer?.querySelector(".text-sm") || null;
  const preview = doc.querySelector("pre");
  const syncValue = syncSlider
    ?.closest("div")
    ?.previousElementSibling
    ?.querySelector(".font-mono");

  const [consensusSelect, encryptionSelect, rotationSelect] = selects;

  const updateModifiedCount = (nextConfig) => {
    let count = 0;
    const base = DEFAULT_STATE.protocolConfig;
    Object.keys(base).forEach((key) => {
      if (key === "modifiedCount") return;
      if (String(base[key]) !== String(nextConfig[key])) count += 1;
    });
    return count;
  };

  const renderConfig = () => {
    const state = readState();
    const config = state.protocolConfig;
    if (syncSlider) syncSlider.value = String(config.syncInterval);
    if (consensusSelect) consensusSelect.value = config.consensus;
    if (encryptionSelect) encryptionSelect.value = config.encryption;
    if (rotationSelect) rotationSelect.value = config.rotation;
    if (autoDiscovery) autoDiscovery.checked = Boolean(config.autoDiscovery);
    if (vpcTunnel) vpcTunnel.checked = Boolean(config.vpcTunnel);
    if (minNodes) minNodes.value = String(config.minNodes);

    if (syncValue) syncValue.textContent = `${config.syncInterval}ms`;
    const previewText = `aegis_protocol_v4:
sync:
  ${config.syncInterval}ms
consensus:
  ${slugify(config.consensus).replace(/-/g, "_")}
discovery:
  ${config.autoDiscovery ? "auto" : "manual"}
security:
  encryption:
    ${config.encryption.includes("Quantum") ? "quantum_res" : config.encryption.includes("High") ? "high_fidelity" : "aes_256"}
  key_rotation:
    ${config.rotation.toLowerCase().replace(/\s+/g, "_")}
  vpc_tunnel:
    ${config.vpcTunnel}
governance:
  min_nodes:
    ${config.minNodes}
  rep_weight:
    uptime:
      ${config.uptimeWeight}
    latency:
      ${config.latencyWeight}`;
    if (preview) preview.textContent = previewText;
    if (modifiedLabel) {
      modifiedLabel.innerHTML = `<span class="font-bold text-slate-800 dark:text-slate-200">Local Changes:</span> ${config.modifiedCount} modified parameters`;
    }
  };

  const persistConfig = (partial) => {
    const current = readState();
    const nextConfig = { ...current.protocolConfig, ...partial };
    nextConfig.modifiedCount = updateModifiedCount(nextConfig);
    patchState({ protocolConfig: nextConfig });
    renderConfig();
  };

  syncSlider?.addEventListener("input", () => persistConfig({ syncInterval: Number(syncSlider.value) }));
  consensusSelect?.addEventListener("change", () => persistConfig({ consensus: consensusSelect.value }));
  encryptionSelect?.addEventListener("change", () => persistConfig({ encryption: encryptionSelect.value }));
  rotationSelect?.addEventListener("change", () => persistConfig({ rotation: rotationSelect.value }));
  autoDiscovery?.addEventListener("change", () => persistConfig({ autoDiscovery: autoDiscovery.checked }));
  vpcTunnel?.addEventListener("change", () => persistConfig({ vpcTunnel: vpcTunnel.checked }));
  minNodes?.addEventListener("input", () => persistConfig({ minNodes: Number(minNodes.value || 0) }));

  bindManagedClick(viewLogs, () => navigateTo("/developer-depot/api-usage-report-aegis-protocol/"));
  bindManagedClick(resetButton, () => {
    patchState({ protocolConfig: { ...DEFAULT_STATE.protocolConfig } });
    renderConfig();
    showToast(doc, "Protocol configuration reset to defaults.");
  });
  bindManagedClick(applyButton, () => {
    const current = readState();
    patchState({
      protocolConfig: { ...current.protocolConfig, modifiedCount: 0 },
      requestLog: [
        `[${new Date().toLocaleTimeString("en-US", { hour12: false })}] PATCH /v2/node/config 200 OK 91ms`,
        ...current.requestLog,
      ].slice(0, 12),
    });
    renderConfig();
    showToast(doc, "Protocol configuration applied to the local AEGIS session.");
  });

  renderConfig();
}

function enhanceProtocolIsolation(doc) {
  if (doc.body.dataset.aegisDepotIsolated === "true") return;
  doc.body.dataset.aegisDepotIsolated = "true";
  injectStyles(doc);

  const notices = doc.querySelectorAll("header button");
  const auditButton = findButton(doc, "Initiate System Audit");
  const standbyButton = findButton(doc, "Enter Standby Mode");
  const summaryCards = Array.from(doc.querySelectorAll("main .grid .p-4, main .rounded-lg"))
    .filter((node) => /active breaches|system health|isolation level|mesh network|core firewall|cloud sync/i.test(node.textContent || ""));
  const terminalLines = Array.from(doc.querySelectorAll(".font-mono.text-sm p"));
  const uptimeLine = Array.from(doc.querySelectorAll("footer span"))
    .find((node) => normalizeText(node.textContent).includes("uptime"));
  const latencyLine = Array.from(doc.querySelectorAll("footer span"))
    .find((node) => normalizeText(node.textContent).includes("latency"));
  const heroPanel = Array.from(doc.querySelectorAll("section")).find((node) => normalizeText(node.textContent).includes("protocol isolated"));

  notices.forEach((button, index) => bindManagedClick(button, () => {
    if (index === 0) showToast(doc, "Security notifications reviewed. No active isolation breaches remain.");
    else navigateTo("/nexus/aegis-peer-profile/");
  }));

  summaryCards.forEach((card) => bindManagedClick(card, () => {
    const text = normalizeText(card.textContent);
    if (text.includes("mesh network")) navigateTo("/developer-depot/network-topology-visualizer/");
    else if (text.includes("core firewall")) navigateTo("/developer-depot/protocol-configuration-aegis-protocol/");
    else if (text.includes("cloud sync")) navigateTo("/developer-depot/web3-portal/");
    else showToast(doc, "Isolation verification panel focused.");
  }));

  bindManagedClick(auditButton, () => {
    const stamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    const current = readState();
    patchState({
      isolated: { ...current.isolated, lastAudit: stamp, standby: false },
      requestLog: [`[${stamp}] AUDIT /v2/protocol/isolation 200 OK 64ms`, ...current.requestLog].slice(0, 12),
    });
    if (terminalLines[terminalLines.length - 1]) {
      terminalLines[terminalLines.length - 1].textContent = `[${stamp}] SUCCESS Full post-isolation audit passed. Cold-store integrity remains intact.`;
    }
    if (uptimeLine) uptimeLine.textContent = "Uptime: 145:08:41";
    if (latencyLine) latencyLine.textContent = "Latency: 0.1ms";
    setMessage(heroPanel || doc.body, `System audit completed at ${stamp}. No new breach signatures detected.`, "success");
    showToast(doc, "Protocol isolation audit completed successfully.");
  });

  bindManagedClick(standbyButton, () => {
    const current = readState();
    const nextStandby = !current.isolated.standby;
    patchState({ isolated: { ...current.isolated, standby: nextStandby } });
    standbyButton.innerHTML = nextStandby
      ? '<span class="material-symbols-outlined">bolt</span> Resume Active Monitoring'
      : '<span class="material-symbols-outlined">power_settings_new</span> Enter Standby Mode';
    setMessage(heroPanel || doc.body, nextStandby
      ? "Standby mode staged. Passive monitoring remains enabled while direct actions are paused."
      : "Active monitoring restored. The security cockpit is live again.", nextStandby ? "info" : "success");
    showToast(doc, nextStandby ? "Security cockpit shifted to standby monitoring." : "Security cockpit restored to active monitoring.");
  });
}

function enhanceTopologyVisualizer(doc) {
  if (doc.body.dataset.aegisDepotTopology === "true") return;
  doc.body.dataset.aegisDepotTopology = "true";
  injectStyles(doc);

  const navExplorer = findButton(doc, "Explorer");
  const navNodes = findButton(doc, "Nodes");
  const navSecurity = findButton(doc, "Security");
  const topButtons = Array.from(doc.querySelectorAll("header button"));
  const viewButtons = ["Spatial", "Logical"].map((label) => findButton(doc, label)).filter(Boolean);
  const regionLabels = Array.from(doc.querySelectorAll("label")).filter((node) => /north america|european union|asia pacific/i.test(node.textContent || ""));
  const protocolSelect = doc.querySelector("select");
  const liveStream = Array.from(doc.querySelectorAll("div")).find((node) => normalizeText(node.textContent).includes("live stream"));
  const zoomButtons = Array.from(doc.querySelectorAll("section button")).filter((node) => {
    const icon = normalizeText(node.textContent);
    return icon.includes("add") || icon.includes("remove") || icon.includes("center_focus_strong") || icon.includes("near_me");
  });
  const nodeBlocks = Array.from(doc.querySelectorAll("section .absolute")).filter((node) => /ny-core-master|us-east-01|eu-cent-04|ap-tok-02/i.test(node.textContent || ""));
  const inspectorTitle = Array.from(doc.querySelectorAll("h2")).find((node) => normalizeText(node.textContent).includes("ny-core-master"));
  const locationNode = doc.querySelector("[data-location]");
  const cpuBar = Array.from(doc.querySelectorAll(".bg-primary.h-1\\.5, .bg-primary")).find((node) => node.getAttribute("style")?.includes("42%"));
  const memBar = Array.from(doc.querySelectorAll(".bg-accent-success.h-1\\.5, .bg-accent-success")).find((node) => node.getAttribute("style")?.includes("45%"));
  const connectionRows = Array.from(doc.querySelectorAll("aside .p-2")).filter((node) => /us-east-01|eu-cent-04|ap-tok-02/i.test(node.textContent || ""));

  const nodeMeta = {
    "NY-CORE-MASTER": { location: "New York, US", cpu: 42, memory: 45 },
    "US-EAST-01": { location: "Virginia, US", cpu: 31, memory: 40 },
    "EU-CENT-04": { location: "Frankfurt, EU", cpu: 27, memory: 36 },
    "AP-TOK-02": { location: "Tokyo, AP", cpu: 66, memory: 58 },
  };

  const render = () => {
    const state = readState();
    viewButtons.forEach((button) => button.classList.toggle("aegis-active-anchor", normalizeText(button.textContent) === normalizeText(state.topology.viewMode)));
    regionLabels.forEach((label) => {
      const checkbox = label.querySelector('input[type="checkbox"]');
      const text = label.textContent.trim();
      if (checkbox) checkbox.checked = state.topology.regions.includes(text);
    });
    if (protocolSelect) protocolSelect.value = state.topology.protocolLayer;
    const focused = nodeMeta[state.topology.focusedNode] || nodeMeta["NY-CORE-MASTER"];
    if (inspectorTitle) inspectorTitle.textContent = state.topology.focusedNode;
    if (locationNode) locationNode.textContent = focused.location;
    if (cpuBar) cpuBar.style.width = `${focused.cpu}%`;
    if (memBar) memBar.style.width = `${focused.memory}%`;
    nodeBlocks.forEach((block) => block.classList.toggle("aegis-highlight-ring", normalizeText(block.textContent).includes(normalizeText(state.topology.focusedNode))));
    if (liveStream) {
      const rows = Array.from(liveStream.querySelectorAll("p"));
      if (rows[0]) rows[0].textContent = `${state.topology.viewMode.toUpperCase()} :: ${state.topology.focusedNode} focus synchronized`;
    }
  };

  bindManagedClick(navExplorer, () => navigateTo("/developer-depot/developer-hub-depot/"));
  bindManagedClick(navNodes, () => navigateTo("/developer-depot/node-management-aegis-protocol/"));
  bindManagedClick(navSecurity, () => navigateTo("/developer-depot/protocol-configuration-aegis-protocol/"));
  topButtons.forEach((button, index) => bindManagedClick(button, () => {
    if (index === 0) showToast(doc, "Topology notifications acknowledged.");
    else navigateTo("/developer-depot/protocol-configuration-aegis-protocol/");
  }));

  viewButtons.forEach((button) => bindManagedClick(button, () => {
    patchState({ topology: { ...readState().topology, viewMode: button.textContent.trim() } });
    render();
    showToast(doc, `Topology view switched to ${button.textContent.trim()}.`);
  }));
  regionLabels.forEach((label) => {
    const checkbox = label.querySelector('input[type="checkbox"]');
    checkbox?.addEventListener("change", () => {
      const current = readState();
      const regions = new Set(current.topology.regions);
      const text = label.textContent.trim();
      if (checkbox.checked) regions.add(text);
      else regions.delete(text);
      patchState({ topology: { ...current.topology, regions: Array.from(regions) } });
      render();
    });
  });
  protocolSelect?.addEventListener("change", () => {
    patchState({ topology: { ...readState().topology, protocolLayer: protocolSelect.value } });
    showToast(doc, `Protocol layer set to ${protocolSelect.value}.`);
  });

  zoomButtons.forEach((button) => bindManagedClick(button, () => {
    const icon = normalizeText(button.textContent);
    const current = readState();
    let zoom = current.topology.zoom;
    if (icon.includes("add")) zoom = Math.min(160, zoom + 10);
    else if (icon.includes("remove")) zoom = Math.max(70, zoom - 10);
    else if (icon.includes("center_focus_strong")) zoom = 100;
    else if (icon.includes("near_me")) patchState({ topology: { ...current.topology, focusedNode: "NY-CORE-MASTER" } });
    patchState({ topology: { ...readState().topology, zoom } });
    showToast(doc, `Topology zoom ${zoom}%. Focus: ${readState().topology.focusedNode}.`);
    render();
  }));

  nodeBlocks.forEach((block) => bindManagedClick(block, () => {
    const raw = block.textContent || "";
    const focusedNode = /US-EAST-01/i.test(raw) ? "US-EAST-01"
      : /EU-CENT-04/i.test(raw) ? "EU-CENT-04"
      : /AP-TOK-02/i.test(raw) ? "AP-TOK-02"
      : "NY-CORE-MASTER";
    patchState({ topology: { ...readState().topology, focusedNode } });
    render();
    showToast(doc, `${focusedNode} focused in the topology inspector.`);
  }));

  connectionRows.forEach((row) => bindManagedClick(row, () => {
    const raw = row.textContent || "";
    const focusedNode = /US-EAST-01/i.test(raw) ? "US-EAST-01"
      : /EU-CENT-04/i.test(raw) ? "EU-CENT-04"
      : "AP-TOK-02";
    patchState({ topology: { ...readState().topology, focusedNode } });
    render();
    showToast(doc, `Peer connection ${focusedNode} selected for drilldown.`);
  }));

  render();
}

function enhanceCollabHub(doc, stage = "alpha") {
  const key = stage === "beta" ? "aegisDepotColabBeta" : "aegisDepotColabAlpha";
  if (doc.body.dataset[key] === "true") return;
  doc.body.dataset[key] = "true";
  injectStyles(doc);

  const navProjects = findButton(doc, "Projects");
  const navTeams = findButton(doc, "Teams");
  const navDocs = findButton(doc, "Docs");
  const search = doc.querySelector('input[placeholder*="Search ecosystem"]');
  const startButtons = Array.from(doc.querySelectorAll("button")).filter((node) => /start new colab|launch proposal/i.test(node.textContent || ""));
  const stackSelect = doc.querySelector("select");
  const titleField = Array.from(doc.querySelectorAll("input")).find((node) => /oracle bridge/i.test(node.getAttribute("placeholder") || ""));
  const goalField = doc.querySelector("textarea");
  const filterButton = Array.from(doc.querySelectorAll("button")).find((node) => normalizeText(node.textContent).includes("filter_list"));
  const projectCards = Array.from(doc.querySelectorAll("h4")).filter((node) => /aegis-vault protocol|sentinel ui framework/i.test(node.textContent || ""))
    .map((node) => node.closest(".group"));
  const projectActions = Array.from(doc.querySelectorAll("button")).filter((node) => /view details|join team/i.test(node.textContent || ""));
  const communityLink = Array.from(doc.querySelectorAll("a")).find((node) => normalizeText(node.textContent).includes("connect now"));
  const footerLinks = Array.from(doc.querySelectorAll("footer a"));
  const panel = Array.from(doc.querySelectorAll(".rounded-xl")).find((node) => normalizeText(node.textContent).includes("start new colab"));

  const render = () => {
    const state = readState();
    if (search) search.value = state.colab.search;
    if (titleField) titleField.value = state.colab.title;
    if (stackSelect) stackSelect.value = state.colab.stack;
    if (goalField) goalField.value = state.colab.goal;
    projectCards.forEach((card) => {
      const match = !state.colab.search || normalizeText(card.textContent).includes(normalizeText(state.colab.search));
      card.classList.toggle("aegis-hidden", !match);
      card.classList.toggle("aegis-highlight-ring", normalizeText(card.textContent).includes(normalizeText(state.colab.selectedProject)));
    });
  };

  bindManagedClick(navProjects, () => navigateTo("/developer-depot/my-submissions-dashboard/"));
  bindManagedClick(navTeams, () => navigateTo("/developer-depot/colab-creation-page-1/"));
  bindManagedClick(navDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(filterButton, () => {
    const current = readState();
    patchState({ colab: { ...current.colab, search: current.colab.search ? "" : "Aegis" } });
    render();
    showToast(doc, current.colab.search ? "Collab filter cleared." : "Collab filter primed for AEGIS projects.");
  });

  search?.addEventListener("input", () => {
    patchState({ colab: { ...readState().colab, search: search.value } });
    render();
  });
  titleField?.addEventListener("input", () => patchState({ colab: { ...readState().colab, title: titleField.value } }));
  stackSelect?.addEventListener("change", () => patchState({ colab: { ...readState().colab, stack: stackSelect.value } }));
  goalField?.addEventListener("input", () => patchState({ colab: { ...readState().colab, goal: goalField.value } }));

  startButtons.forEach((button) => bindManagedClick(button, () => {
    const current = readState();
    const title = current.colab.title.trim();
    const goal = current.colab.goal.trim();
    if (!title && stage === "beta") {
      setMessage(panel, "Add a project title before launching the proposal.", "error");
      return;
    }
    patchState({ colab: { ...current.colab, stage } });
    if (stage === "alpha") {
      showToast(doc, "Collab concept staged. Continue into the proposal workspace.");
      navigateTo("/developer-depot/colab-creation-page-2/");
      return;
    }
    const nextId = slugify(title || current.colab.selectedProject || "aegis-colab-proposal");
    const nextSubmission = {
      id: nextId,
      name: title || "AEGIS Colab Proposal",
      version: "0.1.0-proposal",
      category: "Collaboration",
      description: goal || "Collaboration proposal staged through the Depot workspace.",
      status: "In Review",
      updatedLabel: "Proposal launched just now",
      createdLabel: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      downloads: 0,
      rating: 0,
      reason: "",
    };
    const currentSubmissions = readState().submissions.filter((item) => item.id !== nextId);
    patchState({
      submissions: [nextSubmission, ...currentSubmissions],
      submissionFilter: "all",
      colab: { ...current.colab, selectedProject: nextSubmission.name },
    });
    setMessage(panel, `${nextSubmission.name} launched into the Developer Depot review queue.`, "success");
    showToast(doc, "Collab proposal launched and routed into My Submissions.");
    window.setTimeout(() => navigateTo("/developer-depot/my-submissions-dashboard/"), 180);
  }));

  projectActions.forEach((button) => bindManagedClick(button, () => {
    const card = button.closest(".group");
    const title = card?.querySelector("h4")?.textContent?.trim() || "Collab";
    patchState({ colab: { ...readState().colab, selectedProject: title } });
    render();
    if (/view details/i.test(button.textContent || "")) {
      showToast(doc, `${title} selected for deeper collaboration planning.`);
      navigateTo("/developer-depot/colab-creation-page-2/");
    } else {
      showToast(doc, `You joined the ${title} collaboration lane.`);
    }
  }));

  bindManagedClick(communityLink, () => navigateTo("/peer-profile/home/"));
  footerLinks.forEach((link) => bindManagedClick(link, () => {
    const text = normalizeText(link.textContent);
    if (text.includes("github")) navigateTo("/developer-depot/developer-console-aegis-protocol/");
    else if (text.includes("privacy") || text.includes("cookie")) navigateTo("/nexus/aegis-peer-profile/");
    else navigateTo("/nexus/aegisalign-landing-page/");
  }));

  render();
}

function enhanceWeb3Portal(doc) {
  if (doc.body.dataset.aegisDepotWeb3 === "true") return;
  doc.body.dataset.aegisDepotWeb3 = "true";
  injectStyles(doc);

  const navEcosystem = findButton(doc, "Ecosystem");
  const navProtocol = findButton(doc, "Protocol");
  const navGovernance = findButton(doc, "Governance");
  const navStitch = findButton(doc, "Stitch");
  const search = doc.querySelector('input[placeholder*="Search ecosystem"]');
  const walletButton = Array.from(doc.querySelectorAll("button")).find((node) => normalizeText(node.textContent).includes("account_balance_wallet"));
  const getStarted = findButton(doc, "Get Started");
  const viewDocs = findButton(doc, "View Documentation");
  const moduleButtons = Array.from(doc.querySelectorAll("button")).filter((node) => /launch module|manage identity/i.test(node.textContent || ""));
  const editProfile = findButton(doc, "Edit Profile");
  const delegateVoting = findButton(doc, "Delegate Voting Power");
  const proposalCards = Array.from(doc.querySelectorAll("a")).filter((node) => /aap-104|aap-105/i.test(node.textContent || ""));
  const didCards = Array.from(doc.querySelectorAll("p")).filter((node) => /passport credential|dao contribution score|multi-chain stitch/i.test(node.textContent || ""))
    .map((node) => node.closest(".flex.items-center.justify-between"));
  const footerLinks = Array.from(doc.querySelectorAll("footer a"));
  const hero = Array.from(doc.querySelectorAll("section")).find((node) => normalizeText(node.textContent).includes("gateway to the"));

  const render = () => {
    const state = readState();
    if (search) search.value = state.web3.search;
    didCards.forEach((card) => card?.classList.toggle("aegis-highlight-ring", normalizeText(card.textContent).includes(normalizeText(state.web3.selectedCredential))));
    proposalCards.forEach((card) => card?.classList.toggle("aegis-highlight-ring", normalizeText(card.textContent).includes(normalizeText(state.web3.delegatedProposal))));
  };

  bindManagedClick(navEcosystem, () => navigateTo("/aegis-application-lab/"));
  bindManagedClick(navProtocol, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(navGovernance, () => navigateTo("/custodian-ui/decentralized-governance-voting/"));
  bindManagedClick(navStitch, () => navigateTo("/developer-depot/developer-hub-depot/"));
  bindManagedClick(walletButton, () => {
    const current = readState();
    patchState({ web3: { ...current.web3, connected: !current.web3.connected } });
    showToast(doc, readState().web3.connected ? "Wallet relay connected to the .digitalSelf gateway." : "Wallet relay disconnected from the Web3 gateway.");
  });
  bindManagedClick(getStarted, () => {
    patchState({ web3: { ...readState().web3, selectedModule: ".digitalself" } });
    setMessage(hero || doc.body, "Gateway onboarding staged. Route the Peer into Profile to complete identity setup.", "success");
    navigateTo("/nexus/aegis-peer-profile/");
  });
  bindManagedClick(viewDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  moduleButtons.forEach((button) => bindManagedClick(button, () => {
    const text = normalizeText(button.closest(".group, .rounded-xl, .rounded-lg")?.textContent || button.textContent);
    if (text.includes("stitch for web3")) {
      patchState({ web3: { ...readState().web3, selectedModule: "Stitch for Web3" } });
      showToast(doc, "Stitch for Web3 selected as the active gateway module.");
      navigateTo("/developer-depot/webhooks-configuration-aegis-protocol/");
    } else {
      patchState({ web3: { ...readState().web3, selectedModule: ".digitalself", selectedCredential: "Passport Credential" } });
      showToast(doc, ".digitalself identity workspace selected.");
      navigateTo("/peer-profile/home/");
    }
  }));
  bindManagedClick(editProfile, () => navigateTo("/nexus/aegis-peer-profile/"));
  bindManagedClick(delegateVoting, () => {
    const proposal = "AAP-104: Liquidity Incentives";
    patchState({ web3: { ...readState().web3, delegatedProposal: proposal } });
    render();
    showToast(doc, `Voting power delegated toward ${proposal}.`);
    navigateTo("/custodian-ui/decentralized-governance-voting/");
  });
  proposalCards.forEach((card) => bindManagedClick(card, () => {
    const title = card.querySelector("p")?.textContent?.trim() || card.textContent.trim();
    patchState({ web3: { ...readState().web3, delegatedProposal: title } });
    render();
    showToast(doc, `${title} marked as the active governance proposal.`);
  }));
  didCards.forEach((card) => bindManagedClick(card, () => {
    const title = card.querySelector(".font-bold")?.textContent?.trim() || "Identity credential";
    patchState({ web3: { ...readState().web3, selectedCredential: title } });
    render();
    showToast(doc, `${title} focused in the identity workspace.`);
  }));
  search?.addEventListener("input", () => {
    const current = readState();
    patchState({ web3: { ...current.web3, search: search.value } });
    const query = normalizeText(search.value);
    [...didCards, ...proposalCards].forEach((node) => {
      node.classList.toggle("aegis-hidden", query && !normalizeText(node.textContent).includes(query));
    });
  });
  footerLinks.forEach((link) => bindManagedClick(link, () => {
    const text = normalizeText(link.textContent);
    if (text.includes("discord")) navigateTo("/peer-profile/home/");
    else if (text.includes("github")) navigateTo("/developer-depot/developer-console-aegis-protocol/");
    else navigateTo("/nexus/aegisalign-landing-page/");
  }));

  render();
}

const pageEnhancers = {
  "developer-hub-depot": enhanceDeveloperHub,
  "api-reference-aegis-protocol": enhanceApiReference,
  "submit-plugin-to-depot": enhanceSubmitPlugin,
  "my-submissions-dashboard": enhanceMySubmissions,
  "plugin-developer-analytics": enhanceAnalytics,
  "developer-console-aegis-protocol": enhanceDeveloperConsole,
  "api-usage-report-aegis-protocol": enhanceUsageReport,
  "webhooks-configuration-aegis-protocol": enhanceWebhooks,
  "node-management-aegis-protocol": enhanceNodeManagement,
  "protocol-configuration-aegis-protocol": enhanceProtocolConfiguration,
  "protocol-isolated-confirmation": enhanceProtocolIsolation,
  "network-topology-visualizer": enhanceTopologyVisualizer,
  "colab-creation-page-1": (doc) => enhanceCollabHub(doc, "alpha"),
  "colab-creation-page-2": (doc) => enhanceCollabHub(doc, "beta"),
  "web3-portal": enhanceWeb3Portal,
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
