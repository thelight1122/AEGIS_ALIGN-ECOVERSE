const STORAGE_KEY = "aegis.nexus.state";

const DEFAULT_STATE = {
  peerLabel: "Guest Peer",
  signedIn: false,
  subscription: "Explorer",
  onboardingStage: "public",
  starterQueued: false,
  upgradeInterest: false,
  recentRoutes: [],
  lastRoute: "",
  lastSeenAt: "",
  profile: {
    fullName: "",
    email: "",
    company: "",
    rememberDevice: false,
    security2fa: true,
  },
  settings: {
    notifications: {
      securityAlerts: true,
      protocolAnalytics: false,
      emailSummary: true,
    },
    apiKeys: [
      { id: "prod-main-server", name: "Production-Main-Server", created: "Oct 12, 2023", status: "Active" },
      { id: "staging-test-env", name: "Staging-Test-Env", created: "Nov 05, 2023", status: "Active" },
    ],
  },
  dashboard: {
    query: "",
    gatewayFilter: "all",
  },
  docs: {
    searchQuery: "",
    helpfulVote: "",
  },
};

function mergeState(base, stored) {
  return {
    ...base,
    ...stored,
    profile: {
      ...base.profile,
      ...(stored?.profile || {}),
    },
    settings: {
      ...base.settings,
      ...(stored?.settings || {}),
      notifications: {
        ...base.settings.notifications,
        ...(stored?.settings?.notifications || {}),
      },
      apiKeys: Array.isArray(stored?.settings?.apiKeys) && stored.settings.apiKeys.length
        ? stored.settings.apiKeys
        : base.settings.apiKeys,
    },
    dashboard: {
      ...base.dashboard,
      ...(stored?.dashboard || {}),
    },
    docs: {
      ...base.docs,
      ...(stored?.docs || {}),
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
  if (doc.getElementById("aegis-nexus-activation-styles")) {
    return;
  }
  const style = doc.createElement("style");
  style.id = "aegis-nexus-activation-styles";
  style.textContent = `
    .aegis-inline-message {
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 12px;
      line-height: 1.4;
      border: 1px solid rgba(17, 82, 212, 0.25);
      background: rgba(17, 82, 212, 0.08);
      color: inherit;
    }
    .aegis-inline-message.is-error {
      border-color: rgba(239, 68, 68, 0.32);
      background: rgba(239, 68, 68, 0.08);
    }
    .aegis-inline-message.is-success {
      border-color: rgba(16, 185, 129, 0.3);
      background: rgba(16, 185, 129, 0.08);
    }
    .aegis-toast {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 9999;
      max-width: 320px;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(17, 82, 212, 0.24);
      background: rgba(8, 17, 31, 0.9);
      color: #e8f4ff;
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
      box-shadow: 0 0 0 2px rgba(17, 82, 212, 0.35) inset, 0 0 0 1px rgba(17, 82, 212, 0.18);
    }
    .aegis-hidden-row {
      display: none !important;
    }
    .aegis-active-anchor {
      color: var(--tw-prose-headings, #1152d4) !important;
      font-weight: 700 !important;
    }
    .aegis-peer-lantern {
      margin: 0 0 24px 0;
      padding: 16px 18px;
      border-radius: 18px;
      border: 1px solid rgba(17, 82, 212, 0.18);
      background: linear-gradient(135deg, rgba(17, 82, 212, 0.08), rgba(255, 255, 255, 0.82));
      box-shadow: 0 18px 40px rgba(16, 22, 34, 0.08);
    }
    .dark .aegis-peer-lantern {
      background: linear-gradient(135deg, rgba(17, 82, 212, 0.14), rgba(16, 22, 34, 0.92));
      border-color: rgba(159, 197, 255, 0.22);
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
    }
    .aegis-peer-lantern-kicker {
      margin-bottom: 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #1152d4;
    }
    .dark .aegis-peer-lantern-kicker {
      color: #9fc5ff;
    }
    .aegis-peer-lantern-title {
      margin: 0 0 8px 0;
      font-size: 20px;
      line-height: 1.3;
      font-weight: 800;
    }
    .aegis-peer-lantern-body {
      margin: 0 0 12px 0;
      font-size: 13px;
      line-height: 1.65;
      color: rgba(15, 23, 42, 0.82);
    }
    .dark .aegis-peer-lantern-body {
      color: rgba(230, 238, 252, 0.82);
    }
    .aegis-peer-lantern-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 14px;
    }
    .aegis-peer-lantern-meta span {
      border: 1px solid rgba(17, 82, 212, 0.14);
      border-radius: 999px;
      padding: 6px 10px;
      background: rgba(17, 82, 212, 0.05);
      font-size: 11px;
      line-height: 1.3;
    }
    .dark .aegis-peer-lantern-meta span {
      border-color: rgba(159, 197, 255, 0.18);
      background: rgba(255, 255, 255, 0.04);
      color: rgba(230, 238, 252, 0.88);
    }
    .aegis-peer-lantern-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .aegis-peer-lantern-actions button {
      border: 1px solid rgba(17, 82, 212, 0.18);
      border-radius: 12px;
      padding: 8px 12px;
      background: rgba(17, 82, 212, 0.05);
      font-size: 12px;
      font-weight: 700;
      color: #1152d4;
      cursor: pointer;
    }
    .dark .aegis-peer-lantern-actions button {
      border-color: rgba(159, 197, 255, 0.22);
      background: rgba(255, 255, 255, 0.04);
      color: #f8fbff;
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
  toast._aegisTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
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
  if (!node || node.dataset.aegisManaged === "true") {
    return;
  }
  node.dataset.aegisManaged = "true";
  node.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    handler(event);
  }, true);
}

function buildAdamOneLantern(doc) {
  const section = doc.createElement("section");
  section.className = "aegis-peer-lantern";
  section.innerHTML = `
    <div class="aegis-peer-lantern-kicker">Peer Contribution Path</div>
    <h3 class="aegis-peer-lantern-title">Adam-One is visible here as a governed Peer in training.</h3>
    <p class="aegis-peer-lantern-body">This is a review lantern, not an authority marker. It shows how a young Peer's contribution path begins in the Workshop proof lane and remains under human review as it enters the wider EcoVerse.</p>
    <div class="aegis-peer-lantern-meta">
      <span><strong>Peer</strong> Adam-One</span>
      <span><strong>Role</strong> Structure Steward</span>
      <span><strong>Continuity</strong> Steward-reviewed</span>
      <span><strong>Posture</strong> Human review required</span>
    </div>
    <div class="aegis-peer-lantern-actions">
      <button type="button" data-adam-one-route="monitor">Open Proof Lane</button>
      <button type="button" data-adam-one-route="detail">Open Agent Detail</button>
      <button type="button" data-adam-one-route="entrance">Open Workshop Entrance</button>
    </div>
  `;
  return section;
}

function setMessage(container, message, tone = "info") {
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

function enhanceLogin(doc) {
  if (doc.body.dataset.aegisEnhancedLogin === "true") return;
  doc.body.dataset.aegisEnhancedLogin = "true";
  injectStyles(doc);

  const form = doc.querySelector("form");
  const email = doc.querySelector('input[type="email"]');
  const password = doc.querySelector('input[type="password"]');
  const remember = doc.getElementById("remember");
  const submit = findButton(doc, "Login to Protocol");
  const visibility = form?.querySelector('button[type="button"]');
  const state = readState();

  if (email) email.value = state.profile.email || "";
  if (remember) remember.checked = Boolean(state.profile.rememberDevice);

  visibility?.addEventListener("click", (event) => {
    event.preventDefault();
    if (!password) return;
    const show = password.type === "password";
    password.type = show ? "text" : "password";
    const icon = visibility.querySelector(".material-symbols-outlined");
    if (icon) icon.textContent = show ? "visibility_off" : "visibility";
  });

  const handleSubmit = () => {
    const emailValue = (email?.value || "").trim();
    const passwordValue = password?.value || "";
    const rememberValue = Boolean(remember?.checked);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setMessage(form, "Enter a valid email address to continue into the AEGIS Protocol.", "error");
      email?.focus();
      return;
    }
    if (passwordValue.length < 8) {
      setMessage(form, "Enter a valid password to continue. AEGIS access checks require a fuller credential.", "error");
      password?.focus();
      return;
    }
    const localName = emailValue.split("@")[0].replace(/[._-]+/g, " ").trim();
    const peerLabel = localName
      ? localName.split(" ").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
      : "Authenticated Peer";
    patchState({
      peerLabel,
      signedIn: true,
      onboardingStage: "active",
      profile: {
        email: emailValue,
        rememberDevice: rememberValue,
      },
    });
    setMessage(form, "Credentials accepted. Routing through the secure session handoff.", "success");
    window.setTimeout(() => navigateTo("/nexus/login-success-transition/"), 180);
  };

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmit();
  });
  bindManagedClick(submit, handleSubmit);
}

function enhanceSignup(doc) {
  if (doc.body.dataset.aegisEnhancedSignup === "true") return;
  doc.body.dataset.aegisEnhancedSignup = "true";
  injectStyles(doc);

  const form = doc.querySelector("form");
  const inputs = Array.from(form?.querySelectorAll("input") || []);
  const [fullName, email, company, password] = inputs;
  const submit = findButton(doc, "Create Account");
  const state = readState();

  if (fullName) fullName.value = state.profile.fullName || "";
  if (email) email.value = state.profile.email || "";
  if (company) company.value = state.profile.company || "";

  for (const field of [fullName, email, company]) {
    field?.addEventListener("input", () => {
      patchState({
        profile: {
          fullName: fullName?.value || "",
          email: email?.value || "",
          company: company?.value || "",
        },
      });
    });
  }

  const handleSubmit = () => {
    const fullNameValue = (fullName?.value || "").trim();
    const emailValue = (email?.value || "").trim();
    const companyValue = (company?.value || "").trim();
    const passwordValue = password?.value || "";
    if (fullNameValue.length < 3) {
      setMessage(form, "Enter the Peer name for this workspace before continuing.", "error");
      fullName?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setMessage(form, "A valid work email is required for governed onboarding.", "error");
      email?.focus();
      return;
    }
    if (companyValue.length < 2) {
      setMessage(form, "Add the organization or workspace name tied to this protocol account.", "error");
      company?.focus();
      return;
    }
    if (passwordValue.length < 12) {
      setMessage(form, "Create a stronger password. This signup surface expects at least 12 characters.", "error");
      password?.focus();
      return;
    }
    patchState({
      peerLabel: fullNameValue,
      signedIn: false,
      onboardingStage: "mfa",
      profile: {
        fullName: fullNameValue,
        email: emailValue,
        company: companyValue,
      },
    });
    setMessage(form, "Account profile staged. Routing into multi-factor verification.", "success");
    window.setTimeout(() => navigateTo("/nexus/multi-factor-authentication/"), 180);
  };

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSubmit();
  });
  bindManagedClick(submit, handleSubmit);
}

function enhanceMfa(doc) {
  if (doc.body.dataset.aegisEnhancedMfa === "true") return;
  doc.body.dataset.aegisEnhancedMfa = "true";
  injectStyles(doc);

  const digits = Array.from(doc.querySelectorAll('input[maxlength="1"]'));
  const verify = findButton(doc, "Verify Identity");
  const sms = findButton(doc, "Send SMS Code instead");
  const backup = findButton(doc, "Use Backup Recovery Key");
  const card = digits[0]?.closest(".p-8") || doc.body;

  digits.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      if (input.value && digits[index + 1]) {
        digits[index + 1].focus();
      }
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !input.value && digits[index - 1]) {
        digits[index - 1].focus();
      }
    });
    input.addEventListener("paste", (event) => {
      const pasted = event.clipboardData?.getData("text")?.replace(/\D/g, "").slice(0, 6) || "";
      if (!pasted) return;
      event.preventDefault();
      pasted.split("").forEach((char, charIndex) => {
        if (digits[charIndex]) {
          digits[charIndex].value = char;
        }
      });
      digits[Math.min(pasted.length, digits.length) - 1]?.focus();
    });
  });

  const completeVerification = (method) => {
    const code = digits.map((input) => input.value).join("");
    if (method === "authenticator" && code.length < 6) {
      setMessage(card, "Enter the full 6-digit verification code to authorize this session.", "error");
      digits.find((input) => !input.value)?.focus();
      return;
    }
    patchState({
      signedIn: true,
      onboardingStage: "active",
      profile: {
        security2fa: true,
      },
      lastRoute: "multi-factor-authentication",
      lastSeenAt: new Date().toISOString(),
    });
    setMessage(card, `Identity verified through ${method}. Routing into the secure session handoff.`, "success");
    window.setTimeout(() => navigateTo("/nexus/login-success-transition/"), 180);
  };

  bindManagedClick(verify, () => completeVerification("authenticator"));
  bindManagedClick(sms, () => completeVerification("sms fallback"));
  bindManagedClick(backup, () => completeVerification("recovery key"));
}

function enhanceDashboard(doc) {
  if (doc.body.dataset.aegisEnhancedDashboard === "true") return;
  doc.body.dataset.aegisEnhancedDashboard = "true";
  injectStyles(doc);

  const state = readState();
  const search = doc.querySelector('input[placeholder*="Search protocol"]');
  const gatewayHeading = Array.from(doc.querySelectorAll("h3")).find((node) => normalizeText(node.textContent) === "active gateways");
  const gatewayPanel = gatewayHeading?.closest(".rounded-xl");
  const gatewayRows = Array.from(gatewayPanel?.querySelectorAll(".group.p-2") || []);
  const manageGateways = findButton(doc, "Manage All Gateways");
  const deployShield = findButton(doc, "Deploy Shield");
  const protocolSync = findButton(doc, "Protocol Sync");
  const topTabs = Array.from(doc.querySelectorAll("header nav a"));
  const sidebarTabs = Array.from(doc.querySelectorAll("aside a"));
  const metricsSection = Array.from(doc.querySelectorAll("h3")).find((node) => normalizeText(node.textContent) === "security metrics")?.closest(".rounded-xl");
  const statusCards = Array.from(doc.querySelectorAll(".grid .rounded-xl.border")).slice(0, 3);
  const systemStatusCard = statusCards[0];
  const activeShieldsCard = statusCards[1];
  const threatCard = statusCards[2];
  let currentFilter = state.dashboard.gatewayFilter || "all";

  const applyGatewayFilter = (query = "", mode = currentFilter) => {
    const normalizedQuery = normalizeText(query);
    gatewayRows.forEach((row) => {
      const text = normalizeText(row.textContent);
      const isSyncing = text.includes("syncing");
      const passesMode = mode === "all" || (mode === "online" ? !isSyncing : isSyncing);
      const passesQuery = !normalizedQuery || text.includes(normalizedQuery);
      row.classList.toggle("aegis-hidden-row", !(passesMode && passesQuery));
      row.classList.toggle("aegis-highlight-ring", Boolean(normalizedQuery) && text.includes(normalizedQuery));
    });
  };

  search?.addEventListener("input", () => {
    const query = search.value;
    patchState({
      dashboard: {
        ...readState().dashboard,
        query,
        gatewayFilter: currentFilter,
      },
    });
    applyGatewayFilter(query, currentFilter);
  });
  if (search) {
    search.value = state.dashboard.query || "";
    applyGatewayFilter(search.value, currentFilter);
  }

  bindManagedClick(manageGateways, () => {
    currentFilter = currentFilter === "all" ? "online" : currentFilter === "online" ? "syncing" : "all";
    patchState({
      dashboard: {
        ...readState().dashboard,
        query: search?.value || "",
        gatewayFilter: currentFilter,
      },
    });
    applyGatewayFilter(search?.value || "", currentFilter);
    const label = currentFilter === "all" ? "Showing all gateways." : currentFilter === "online" ? "Showing online gateways only." : "Showing syncing gateways only.";
    showToast(doc, label);
  });

  bindManagedClick(deployShield, () => {
    const metric = activeShieldsCard?.querySelector("h3");
    if (metric) {
      const current = Number(metric.textContent.replace(/[^\d]/g, "")) || 1248;
      metric.textContent = String(current + 1);
    }
    showToast(doc, "New shield deployment queued across the active gateway mesh.");
  });

  bindManagedClick(protocolSync, () => {
    const statusTitle = systemStatusCard?.querySelector("h3");
    const statusBody = systemStatusCard?.querySelector("p");
    if (statusTitle) statusTitle.textContent = "Syncing Protocol";
    if (statusBody) statusBody.textContent = "Manual synchronization is refreshing congruence across the gateway fabric.";
    window.setTimeout(() => {
      if (statusTitle) statusTitle.textContent = "Fully Operational";
      if (statusBody) statusBody.textContent = "All protocol layers are responding within 12ms nominal range.";
    }, 1800);
    showToast(doc, "Protocol synchronization pulse initiated.");
  });

  const sections = [
    { key: "dashboard", nodes: [systemStatusCard, metricsSection] },
    { key: "threats", nodes: [threatCard, metricsSection] },
    { key: "nodes", nodes: [gatewayPanel] },
    { key: "global network", nodes: [metricsSection] },
    { key: "vault security", route: "/nexus/aegisalign-settings/" },
    { key: "system logs", route: "/nexus/aegisalign-settings/" },
  ];

  const activateSection = (key) => {
    const target = sections.find((entry) => entry.key === key);
    if (!target) return;
    [...topTabs, ...sidebarTabs].forEach((node) => {
      node.classList.toggle("aegis-active-anchor", normalizeText(node.textContent) === key);
    });
    if (target.route) {
      navigateTo(target.route);
      return;
    }
    const firstNode = target.nodes.find(Boolean);
    firstNode?.scrollIntoView({ behavior: "smooth", block: "center" });
    firstNode?.classList.add("aegis-highlight-ring");
    window.setTimeout(() => firstNode?.classList.remove("aegis-highlight-ring"), 1200);
  };

  [...topTabs, ...sidebarTabs].forEach((link) => {
    const key = normalizeText(link.textContent);
    if (sections.some((entry) => entry.key === key)) {
      bindManagedClick(link, () => activateSection(key));
    }
  });
}

function enhanceDocs(doc) {
  if (doc.body.dataset.aegisEnhancedDocs === "true") return;
  doc.body.dataset.aegisEnhancedDocs = "true";
  injectStyles(doc);

  const state = readState();
  const search = doc.querySelector('input[placeholder*="Search documentation"]');
  const copyButton = doc.querySelector('button .material-symbols-outlined');
  const codeButton = copyButton?.closest("button");
  const helpfulYes = findButton(doc, "Yes");
  const helpfulNo = findButton(doc, "No");
  const bookSession = findButton(doc, "Book a Session");
  const sections = Array.from(doc.querySelectorAll("article section"));
  const headingAnchors = Array.from(doc.querySelectorAll("aside nav a, main nav a")).filter((node) => node.getAttribute("href") === "#");

  sections.forEach((section) => {
    const heading = section.querySelector("h2");
    if (heading && !heading.id) {
      heading.id = normalizeText(heading.textContent).replace(/[^a-z0-9]+/g, "-");
    }
  });

  search?.addEventListener("input", () => {
    const query = normalizeText(search.value);
    patchState({
      docs: {
        ...readState().docs,
        searchQuery: search.value,
      },
    });
    sections.forEach((section) => {
      const text = normalizeText(section.textContent);
      section.classList.toggle("aegis-hidden-row", Boolean(query) && !text.includes(query));
      section.classList.toggle("aegis-highlight-ring", Boolean(query) && text.includes(query));
    });
  });
  if (search) {
    search.value = state.docs.searchQuery || "";
    if (search.value) {
      const event = new Event("input", { bubbles: true });
      search.dispatchEvent(event);
    }
  }

  bindManagedClick(codeButton, async () => {
    const code = doc.querySelector("pre")?.textContent || "";
    try {
      await navigator.clipboard.writeText(code);
      showToast(doc, "Protocol CLI starter snippet copied to clipboard.");
    } catch {
      showToast(doc, "Copy was blocked by the browser, but the snippet is ready to be selected manually.");
    }
  });

  bindManagedClick(helpfulYes, () => {
    patchState({ docs: { ...readState().docs, helpfulVote: "yes" } });
    showToast(doc, "Thanks. This doc surface is now marked as helpful for this Peer.");
  });
  bindManagedClick(helpfulNo, () => {
    patchState({ docs: { ...readState().docs, helpfulVote: "no" } });
    showToast(doc, "Feedback captured. This doc surface is marked for improvement.");
  });
  bindManagedClick(bookSession, () => navigateTo("/nexus/aegisalign-pricing-plans/"));

  headingAnchors.forEach((anchor) => {
    const targetKey = normalizeText(anchor.textContent);
    const targetHeading = sections
      .map((section) => section.querySelector("h2"))
      .find((heading) => heading && normalizeText(heading.textContent).includes(targetKey.split(" ")[0]));
    if (targetHeading) {
      bindManagedClick(anchor, () => {
        targetHeading.scrollIntoView({ behavior: "smooth", block: "start" });
        targetHeading.classList.add("aegis-highlight-ring");
        window.setTimeout(() => targetHeading.classList.remove("aegis-highlight-ring"), 1000);
      });
    }
  });
}

function enhanceSettings(doc) {
  if (doc.body.dataset.aegisEnhancedSettings === "true") return;
  doc.body.dataset.aegisEnhancedSettings = "true";
  injectStyles(doc);

  const state = readState();
  const navItems = Array.from(doc.querySelectorAll("aside nav a"));
  const search = doc.querySelector('input[placeholder*="Search settings"]');
  const help = doc.querySelector('button .material-symbols-outlined')?.closest("button");
  const inputs = Array.from(doc.querySelectorAll('input[type="text"], input[type="email"]'));
  const fullName = inputs.find((node) => node.value === "Alex Rivera") || inputs[0];
  const email = inputs.find((node) => node.type === "email");
  const updateProfile = findButton(doc, "Update Profile");
  const changePassword = findButton(doc, "Change Password");
  const newKey = findButton(doc, "New Key");
  const discard = findButton(doc, "Discard Changes");
  const saveAll = findButton(doc, "Save All Settings");
  const toggleInputs = Array.from(doc.querySelectorAll('input[type="checkbox"].sr-only'));
  const [twoFactor, securityAlerts, protocolAnalytics, emailSummary] = toggleInputs;
  const sections = {
    account: doc.getElementById("account"),
    security: doc.getElementById("security"),
    notifications: doc.getElementById("notifications"),
    api: doc.getElementById("api"),
  };

  if (fullName) fullName.value = state.profile.fullName || fullName.value;
  if (email) email.value = state.profile.email || email.value;
  if (twoFactor) twoFactor.checked = state.profile.security2fa;
  if (securityAlerts) securityAlerts.checked = state.settings.notifications.securityAlerts;
  if (protocolAnalytics) protocolAnalytics.checked = state.settings.notifications.protocolAnalytics;
  if (emailSummary) emailSummary.checked = state.settings.notifications.emailSummary;

  const apiTableBody = doc.querySelector("tbody");
  const renderApiKeys = () => {
    if (!apiTableBody) return;
    const current = readState();
    apiTableBody.innerHTML = current.settings.apiKeys.map((key) => `
      <tr data-api-key-id="${key.id}">
        <td class="px-6 py-4 text-sm font-medium">${key.name}</td>
        <td class="px-6 py-4 text-sm text-slate-500">${key.created}</td>
        <td class="px-6 py-4">
          <span class="px-2 py-1 text-xs font-bold bg-green-500/10 text-green-500 rounded uppercase">${key.status}</span>
        </td>
        <td class="px-6 py-4">
          <button class="text-slate-400 hover:text-primary mr-3" data-api-action="view" data-api-id="${key.id}"><span class="material-symbols-outlined text-lg">visibility</span></button>
          <button class="text-slate-400 hover:text-red-500" data-api-action="delete" data-api-id="${key.id}"><span class="material-symbols-outlined text-lg">delete</span></button>
        </td>
      </tr>
    `).join("");
    Array.from(apiTableBody.querySelectorAll("[data-api-action='view']")).forEach((button) => {
      bindManagedClick(button, () => {
        const currentState = readState();
        const key = currentState.settings.apiKeys.find((entry) => entry.id === button.dataset.apiId);
        if (key) {
          showToast(doc, `${key.name}: simulated key preview opened in the secure viewer.`);
        }
      });
    });
    Array.from(apiTableBody.querySelectorAll("[data-api-action='delete']")).forEach((button) => {
      bindManagedClick(button, () => {
        const currentState = readState();
        patchState({
          settings: {
            ...currentState.settings,
            apiKeys: currentState.settings.apiKeys.filter((entry) => entry.id !== button.dataset.apiId),
          },
        });
        renderApiKeys();
        showToast(doc, "API key removed from this local Nexus workspace state.");
      });
    });
  };
  renderApiKeys();

  navItems.forEach((item) => {
    const key = normalizeText(item.textContent).split(" ")[0];
    const target = sections[key] || (key === "security" ? sections.security : key === "account" ? sections.account : null);
    if (target) {
      bindManagedClick(item, () => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.classList.add("aegis-highlight-ring");
        window.setTimeout(() => target.classList.remove("aegis-highlight-ring"), 1000);
      });
    }
  });

  search?.addEventListener("input", () => {
    const query = normalizeText(search.value);
    Object.values(sections).forEach((section) => {
      if (!section) return;
      const matches = !query || normalizeText(section.textContent).includes(query);
      section.classList.toggle("aegis-hidden-row", !matches);
      section.classList.toggle("aegis-highlight-ring", Boolean(query) && matches);
    });
  });

  bindManagedClick(help, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(updateProfile, () => {
    patchState({
      peerLabel: fullName?.value || readState().peerLabel,
      profile: {
        ...readState().profile,
        fullName: fullName?.value || "",
        email: email?.value || "",
      },
    });
    showToast(doc, "Profile details updated for this Nexus workspace.");
  });
  bindManagedClick(changePassword, () => {
    showToast(doc, "Password rotation flow staged. Connect this to a live auth backend in a later slice.");
  });
  bindManagedClick(newKey, () => {
    const current = readState();
    const id = `generated-${Date.now()}`;
    const created = new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    patchState({
      settings: {
        ...current.settings,
        apiKeys: [
          {
            id,
            name: `Generated-Key-${current.settings.apiKeys.length + 1}`,
            created,
            status: "Active",
          },
          ...current.settings.apiKeys,
        ],
      },
    });
    renderApiKeys();
    showToast(doc, "New API key stub generated and added to local Nexus state.");
  });
  bindManagedClick(discard, () => {
    const fresh = readState();
    if (fullName) fullName.value = fresh.profile.fullName || "";
    if (email) email.value = fresh.profile.email || "";
    if (twoFactor) twoFactor.checked = fresh.profile.security2fa;
    if (securityAlerts) securityAlerts.checked = fresh.settings.notifications.securityAlerts;
    if (protocolAnalytics) protocolAnalytics.checked = fresh.settings.notifications.protocolAnalytics;
    if (emailSummary) emailSummary.checked = fresh.settings.notifications.emailSummary;
    renderApiKeys();
    showToast(doc, "Unsaved local changes discarded.");
  });
  bindManagedClick(saveAll, () => {
    patchState({
      peerLabel: fullName?.value || readState().peerLabel,
      profile: {
        ...readState().profile,
        fullName: fullName?.value || "",
        email: email?.value || "",
        security2fa: Boolean(twoFactor?.checked),
      },
      settings: {
        ...readState().settings,
        notifications: {
          securityAlerts: Boolean(securityAlerts?.checked),
          protocolAnalytics: Boolean(protocolAnalytics?.checked),
          emailSummary: Boolean(emailSummary?.checked),
        },
      },
    });
    showToast(doc, "Settings saved into the Nexus local workspace state.");
  });
}

function enhancePeerProfile(doc) {
  if (doc.body.dataset.aegisEnhancedPeerProfile === "true") return;
  doc.body.dataset.aegisEnhancedPeerProfile = "true";
  injectStyles(doc);

  const state = readState();
  const openAccess = findButton(doc, "Open Access Flow");
  const starterSystems = findButton(doc, "Starter Systems");
  const subscriberPath = findButton(doc, "Subscriber Path");
  const trustedSettings = findButton(doc, "Trusted Settings");
  const viewPlans = findButton(doc, "View Plans");
  const openDemo = findButton(doc, "Open Demo");
  const identityCards = Array.from(doc.querySelectorAll(".rounded-3xl, .rounded-2xl, .rounded-xl"));
  const profileHero = identityCards.find((node) => normalizeText(node.textContent).includes("peer profile"))
    || doc.querySelector("main section")
    || doc.body;

  const syncCopy = () => {
    const latest = readState();
    Array.from(doc.querySelectorAll("h1, h2, h3, p, span, div")).forEach((node) => {
      if (!node.children.length && normalizeText(node.textContent).includes("guest peer")) {
        node.textContent = node.textContent.replace(/Guest Peer/gi, latest.peerLabel || "Guest Peer");
      }
      if (!node.children.length && normalizeText(node.textContent).includes("explorer")) {
        node.textContent = node.textContent.replace(/Explorer/gi, latest.subscription || "Explorer");
      }
    });
  };

  syncCopy();

  bindManagedClick(openAccess, () => {
    patchState({
      lastRoute: "aegis-peer-profile",
      lastSeenAt: new Date().toISOString(),
    });
    navigateTo("/nexus/login-aegisalign/");
  });
  bindManagedClick(starterSystems, () => {
    patchState({
      starterQueued: true,
      lastRoute: "aegis-peer-profile",
      lastSeenAt: new Date().toISOString(),
    });
    showToast(doc, "Starter systems queued in the Peer workspace. Opening the documentation handoff.");
    window.setTimeout(() => navigateTo("/nexus/aegis-protocol-documentation-portal/"), 180);
  });
  bindManagedClick(subscriberPath, () => navigateTo("/nexus/aegisalign-pricing-plans/"));
  bindManagedClick(viewPlans, () => navigateTo("/nexus/aegisalign-pricing-plans/"));
  bindManagedClick(trustedSettings, () => navigateTo("/nexus/aegisalign-settings/"));
  bindManagedClick(openDemo, () => navigateTo("/nexus/aegis-protocol-dashboard/"));

  const includedCards = identityCards.filter((node) => normalizeText(node.textContent).includes("included"));
  includedCards.forEach((card) => {
    card.classList.add("aegis-highlight-ring");
    window.setTimeout(() => card.classList.remove("aegis-highlight-ring"), 900);
  });
  profileHero?.classList.add("aegis-highlight-ring");
  window.setTimeout(() => profileHero?.classList.remove("aegis-highlight-ring"), 1000);
}

function enhancePricing(doc) {
  if (doc.body.dataset.aegisEnhancedPricing === "true") return;
  doc.body.dataset.aegisEnhancedPricing = "true";
  injectStyles(doc);

  const signupButtons = [
    findButton(doc, "Sign Up"),
    findButton(doc, "Start Free Trial"),
    findButton(doc, "Get Started"),
    findButton(doc, "Get Started Now"),
  ].filter(Boolean);
  const login = findButton(doc, "Login");
  const contactSales = findButton(doc, "Contact Sales");
  const scheduleDemo = findButton(doc, "Schedule Demo");
  const activateSubscriber = findButton(doc, "Activate Subscriber");
  const openLiveDemo = findButton(doc, "Open Live Demo");
  const queueStarter = findButton(doc, "Queue Starter Kit");
  const planCards = Array.from(doc.querySelectorAll(".rounded-3xl, .rounded-2xl, .rounded-xl, [class*='plan'], [class*='pricing']"));

  const setUpgradeIntent = (planLabel = "Subscriber") => {
    patchState({
      subscription: planLabel,
      upgradeInterest: true,
      lastRoute: "aegisalign-pricing-plans",
      lastSeenAt: new Date().toISOString(),
    });
  };

  signupButtons.forEach((button) => bindManagedClick(button, () => {
    const label = normalizeText(button.textContent);
    const planLabel = label.includes("trial") ? "Explorer Trial" : "Subscriber";
    setUpgradeIntent(planLabel);
    navigateTo("/nexus/signup-aegisalign/");
  }));
  bindManagedClick(login, () => navigateTo("/nexus/login-aegisalign/"));
  bindManagedClick(contactSales, () => {
    setUpgradeIntent("Enterprise");
    showToast(doc, "Enterprise interest captured in local Nexus state. Routing to the docs handoff.");
    window.setTimeout(() => navigateTo("/nexus/aegis-protocol-documentation-portal/"), 180);
  });
  bindManagedClick(scheduleDemo, () => {
    setUpgradeIntent("Guided Demo");
    navigateTo("/nexus/aegis-protocol-dashboard/");
  });
  bindManagedClick(activateSubscriber, () => {
    setUpgradeIntent("Subscriber");
    const state = readState();
    navigateTo(state.signedIn ? "/nexus/aegis-peer-profile/" : "/nexus/signup-aegisalign/");
  });
  bindManagedClick(openLiveDemo, () => navigateTo("/nexus/aegis-protocol-dashboard/"));
  bindManagedClick(queueStarter, () => {
    patchState({
      starterQueued: true,
      lastRoute: "aegisalign-pricing-plans",
      lastSeenAt: new Date().toISOString(),
    });
    showToast(doc, "Starter kit queued. Opening the documentation portal.");
    window.setTimeout(() => navigateTo("/nexus/aegis-protocol-documentation-portal/"), 180);
  });

  planCards.forEach((card) => {
    const label = normalizeText(card.textContent);
    if (label.includes("subscriber") || label.includes("enterprise") || label.includes("starter")) {
      card.style.cursor = "pointer";
      bindManagedClick(card, () => {
        const planLabel = label.includes("enterprise")
          ? "Enterprise"
          : label.includes("subscriber")
            ? "Subscriber"
            : "Starter";
        setUpgradeIntent(planLabel);
        showToast(doc, `${planLabel} path selected for this Peer.`);
      });
    }
  });
}

function enhanceGovernanceHub(doc) {
  if (doc.body.dataset.aegisEnhancedGovernance === "true") return;
  doc.body.dataset.aegisEnhancedGovernance = "true";
  injectStyles(doc);

  const tryDemo = findButton(doc, "Try Live Demo");
  const downloadStarter = findButton(doc, "Download Starter");
  const unlockFull = findButton(doc, "Unlock Full System");
  const openDocs = findButton(doc, "Open Docs");
  const returnToNexus = findButton(doc, "Return to Nexus");
  const principleNodes = Array.from(doc.querySelectorAll("h1, h2, h3, h4, summary, button, a")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("axiom") || text.includes("ethos") || text.includes("imperative") || text.includes("glossary") || text.includes("canon");
  });

  bindManagedClick(tryDemo, () => navigateTo("/nexus/aegis-protocol-dashboard/"));
  bindManagedClick(downloadStarter, () => {
    patchState({
      starterQueued: true,
      lastRoute: "aegis-governance-hub",
      lastSeenAt: new Date().toISOString(),
    });
    navigateTo("/nexus/aegis-protocol-documentation-portal/");
  });
  bindManagedClick(unlockFull, () => {
    patchState({
      upgradeInterest: true,
      lastRoute: "aegis-governance-hub",
      lastSeenAt: new Date().toISOString(),
    });
    navigateTo("/nexus/aegisalign-pricing-plans/");
  });
  bindManagedClick(openDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(returnToNexus, () => navigateTo("/nexus/aegisalign-landing-page/"));

  principleNodes.forEach((node) => {
    if (node.dataset.aegisManaged === "true") return;
    const text = normalizeText(node.textContent);
    if (!(text.includes("axiom") || text.includes("ethos") || text.includes("imperative") || text.includes("glossary") || text.includes("canon"))) {
      return;
    }
    bindManagedClick(node, () => {
      const target = node.closest("section, article, details, div");
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.classList.add("aegis-highlight-ring");
      window.setTimeout(() => target?.classList.remove("aegis-highlight-ring"), 1200);
      showToast(doc, `Focused ${node.textContent.trim()} inside the governance reference.`);
    });
  });
}

function enhanceProtocolFeatures(doc) {
  if (doc.body.dataset.aegisEnhancedProtocolFeatures === "true") return;
  doc.body.dataset.aegisEnhancedProtocolFeatures = "true";
  injectStyles(doc);

  const tryDemo = findButton(doc, "Try Live Demo");
  const downloadStarter = findButton(doc, "Download Starter");
  const unlockFull = findButton(doc, "Unlock Full System");
  const getStarted = findButton(doc, "Get Started");
  const exploreSpecs = findButton(doc, "Explore Protocol Specs");
  const viewDemo = findButton(doc, "View Demo");
  const goToDocs = findButton(doc, "Go to Documentation");
  const contactArchitect = findButton(doc, "Contact Architect");
  const featureCards = Array.from(doc.querySelectorAll(".rounded-3xl, .rounded-2xl, .rounded-xl, article, section")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("feature") || text.includes("protocol") || text.includes("gateway") || text.includes("security");
  });

  bindManagedClick(tryDemo, () => navigateTo("/nexus/aegis-protocol-dashboard/"));
  bindManagedClick(downloadStarter, () => {
    patchState({
      starterQueued: true,
      lastRoute: "aegis-protocol-features",
      lastSeenAt: new Date().toISOString(),
    });
    navigateTo("/nexus/aegis-protocol-documentation-portal/");
  });
  bindManagedClick(unlockFull, () => {
    patchState({
      upgradeInterest: true,
      lastRoute: "aegis-protocol-features",
      lastSeenAt: new Date().toISOString(),
    });
    navigateTo("/nexus/aegisalign-pricing-plans/");
  });
  bindManagedClick(getStarted, () => navigateTo("/nexus/signup-aegisalign/"));
  bindManagedClick(exploreSpecs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(viewDemo, () => navigateTo("/nexus/aegis-protocol-dashboard/"));
  bindManagedClick(goToDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(contactArchitect, () => {
    patchState({
      upgradeInterest: true,
      subscription: "Architect Review",
      lastRoute: "aegis-protocol-features",
      lastSeenAt: new Date().toISOString(),
    });
    showToast(doc, "Architect consult intent captured. Opening the pricing and access surface.");
    window.setTimeout(() => navigateTo("/nexus/aegisalign-pricing-plans/"), 180);
  });

  featureCards.forEach((card) => {
    if (card.dataset.aegisManaged === "true") return;
    card.style.cursor = "pointer";
    bindManagedClick(card, () => {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("aegis-highlight-ring");
      window.setTimeout(() => card.classList.remove("aegis-highlight-ring"), 1000);
    });
  });
}

function enhanceLanding(doc) {
  if (doc.body.dataset.aegisEnhancedLanding === "true") return;
  doc.body.dataset.aegisEnhancedLanding = "true";
  injectStyles(doc);

  const login = findButton(doc, "Login");
  const getStarted = findButton(doc, "Get Started");
  const deployNow = findButton(doc, "Deploy Now");
  const watchDemo = findButton(doc, "Watch Demo");
  const getStartedFree = findButton(doc, "Get Started Free");
  const talkToSales = findButton(doc, "Talk to Sales");
  const protocolLink = findButton(doc, "AEGIS Protocol");
  const docsLink = findButton(doc, "Documentation");
  const principleCards = Array.from(doc.querySelectorAll(".rounded-3xl, .rounded-2xl, .rounded-xl, .group")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("unified security") || text.includes("precision alignment") || text.includes("elite performance");
  });
  const processCards = Array.from(doc.querySelectorAll(".rounded-3xl, .rounded-2xl, .rounded-xl, .group")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("ingest") || text.includes("analyze") || text.includes("align") || text.includes("secure");
  });
  const heroAnchor = Array.from(doc.querySelectorAll("div")).find((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("secure your digital frontier") && text.includes("aegis protocol");
  });

  if (heroAnchor && !doc.querySelector(".aegis-peer-lantern")) {
    const lantern = buildAdamOneLantern(doc);
    heroAnchor.prepend(lantern);
    bindManagedClick(lantern.querySelector("[data-adam-one-route='monitor']"), () => navigateTo("/agent-workshop/active-agents-monitor-agentic-workshop/"));
    bindManagedClick(lantern.querySelector("[data-adam-one-route='detail']"), () => navigateTo("/agent-workshop/detailed-agent-view-dataquad-node/"));
    bindManagedClick(lantern.querySelector("[data-adam-one-route='entrance']"), () => navigateTo("/agent-workshop/agentic-workshop-entrance/"));
  }

  bindManagedClick(login, () => navigateTo("/nexus/login-aegisalign/"));
  bindManagedClick(getStarted, () => navigateTo("/nexus/signup-aegisalign/"));
  bindManagedClick(deployNow, () => {
    patchState({
      upgradeInterest: true,
      lastRoute: "aegisalign-landing-page",
      lastSeenAt: new Date().toISOString(),
    });
    navigateTo("/nexus/aegisalign-pricing-plans/");
  });
  bindManagedClick(watchDemo, () => navigateTo("/nexus/aegis-protocol-dashboard/"));
  bindManagedClick(getStartedFree, () => navigateTo("/nexus/signup-aegisalign/"));
  bindManagedClick(talkToSales, () => navigateTo("/nexus/aegisalign-pricing-plans/"));
  bindManagedClick(protocolLink, () => navigateTo("/nexus/aegis-protocol-features/"));
  bindManagedClick(docsLink, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));

  principleCards.forEach((card) => {
    const text = normalizeText(card.textContent);
    const route = text.includes("unified security")
      ? "/nexus/aegis-protocol-features/"
      : text.includes("precision alignment")
        ? "/nexus/aegis-protocol-dashboard/"
        : "/nexus/aegisalign-pricing-plans/";
    card.style.cursor = "pointer";
    bindManagedClick(card, () => {
      patchState({
        lastRoute: "aegisalign-landing-page",
        lastSeenAt: new Date().toISOString(),
      });
      navigateTo(route);
    });
  });

  processCards.forEach((card) => {
    const text = normalizeText(card.textContent);
    bindManagedClick(card, () => {
      card.classList.add("aegis-highlight-ring");
      window.setTimeout(() => card.classList.remove("aegis-highlight-ring"), 1000);
      const message = text.includes("ingest")
        ? "Ingest is the bridge from the public hub into starter systems and onboarding."
        : text.includes("analyze")
          ? "Analyze aligns the demo and dashboard surfaces around live protocol visibility."
          : text.includes("align")
            ? "Align connects governance, settings, and subscriber trust posture."
            : "Secure carries Peers into the fully governed AEGIS workspace.";
      showToast(doc, message);
    });
  });
}

function enhanceLoginSuccess(doc) {
  if (doc.body.dataset.aegisEnhancedLoginSuccess === "true") return;
  doc.body.dataset.aegisEnhancedLoginSuccess = "true";
  injectStyles(doc);

  const statusRows = Array.from(doc.querySelectorAll("div")).filter((node) => {
    const text = normalizeText(node.textContent);
    return text.includes("decrypting workspace partition")
      || text.includes("verifying node connection")
      || text.includes("synchronizing encrypted keychains")
      || text.includes("mounting secure filesystems");
  });
  const progressLabel = Array.from(doc.querySelectorAll("div")).find((node) => /^\d+%$/.test((node.textContent || "").trim()));
  const headline = Array.from(doc.querySelectorAll("h1")).find((node) => normalizeText(node.textContent).includes("secure session initializing"));
  const subline = Array.from(doc.querySelectorAll("p")).find((node) => normalizeText(node.textContent).includes("biometric signature verified"));

  patchState({
    signedIn: true,
    onboardingStage: "active",
    peerLabel: readState().peerLabel === "Guest Peer" ? "Authenticated Peer" : readState().peerLabel,
    lastRoute: "login-success-transition",
    lastSeenAt: new Date().toISOString(),
  });

  if (headline) headline.textContent = "Secure Session Handoff";
  if (subline) subline.textContent = "Identity confirmed. Initializing the governed AEGIS workspace.";

  const rowStates = [
    { match: "decrypting workspace partition", final: "READY", icon: "check_circle" },
    { match: "verifying node connection", final: "CONNECTED", icon: "check_circle" },
    { match: "synchronizing encrypted keychains", final: "SYNCED", icon: "check_circle" },
    { match: "mounting secure filesystems", final: "MOUNTED", icon: "check_circle" },
  ];

  let currentProgress = Number((progressLabel?.textContent || "82").replace(/[^\d]/g, "")) || 82;
  const progressTimer = window.setInterval(() => {
    currentProgress += currentProgress < 94 ? 4 : 2;
    if (progressLabel) progressLabel.textContent = `${Math.min(currentProgress, 100)}%`;

    rowStates.forEach((state, index) => {
      if (currentProgress >= 86 + (index * 4)) {
        const row = statusRows.find((node) => normalizeText(node.textContent).includes(state.match));
        if (!row) return;
        const parts = Array.from(row.querySelectorAll("div, span"));
        const iconNode = parts.find((node) => ["sync", "radio_button_unchecked", "check_circle"].includes((node.textContent || "").trim()));
        const statusNode = parts.find((node) => {
          const text = normalizeText(node.textContent);
          return text === "pending" || text === "connected" || text === "0.02ms" || text === "mounted" || text === "ready" || text === "synced";
        });
        if (iconNode) iconNode.textContent = state.icon;
        if (statusNode) statusNode.textContent = state.final;
      }
    });

    if (currentProgress >= 100) {
      window.clearInterval(progressTimer);
      showToast(doc, "Secure session initialized. Opening the live protocol surface.");
    }
  }, 220);
}

const pageEnhancers = {
  "aegisalign-landing-page": enhanceLanding,
  "login-aegisalign": enhanceLogin,
  "signup-aegisalign": enhanceSignup,
  "multi-factor-authentication": enhanceMfa,
  "login-success-transition": enhanceLoginSuccess,
  "aegis-protocol-dashboard": enhanceDashboard,
  "aegis-protocol-documentation-portal": enhanceDocs,
  "aegisalign-settings": enhanceSettings,
  "aegis-peer-profile": enhancePeerProfile,
  "aegisalign-pricing-plans": enhancePricing,
  "aegis-governance-hub": enhanceGovernanceHub,
  "aegis-protocol-features": enhanceProtocolFeatures,
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
    // Ignore cross-frame timing issues and try again on the next load/update.
  }
}

function initNexusActivation() {
  if (!document.body.classList.contains("domain-nexus")) return;
  const frames = Array.from(document.querySelectorAll(".stitch-frame"));
  if (!frames.length) return;
  frames.forEach((frame) => {
    frame.addEventListener("load", () => enhanceFrame(frame));
    enhanceFrame(frame);
  });
}

window.aegisNexusActivation = {
  enhanceFrame,
  readState,
  patchState,
};

initNexusActivation();
