const STORAGE_KEY = "aegis.applicationLab.state";

const DEFAULT_STATE = {
  selectedApp: "AEGIS Interceptor",
  search: "",
  focus: "",
  widgetSnippetCopied: false,
  lastAction: "",
};

function mergeState(base, stored) {
  return {
    ...base,
    ...stored,
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
  const next = mergeState(readState(), patch);
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
  if (doc.getElementById("aegis-application-lab-activation-styles")) return;
  const style = doc.createElement("style");
  style.id = "aegis-application-lab-activation-styles";
  style.textContent = `
    .aegis-inline-message {
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 12px;
      line-height: 1.45;
      border: 1px solid rgba(34, 211, 238, 0.24);
      background: rgba(34, 211, 238, 0.08);
      color: inherit;
    }
    .aegis-inline-message.is-success {
      border-color: rgba(16, 185, 129, 0.3);
      background: rgba(16, 185, 129, 0.08);
    }
    .aegis-inline-message.is-error {
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.08);
    }
    .aegis-toast {
      position: fixed;
      right: 18px;
      bottom: 18px;
      max-width: 340px;
      z-index: 9999;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid rgba(125, 211, 252, 0.24);
      background: rgba(7, 13, 25, 0.92);
      color: #eef8ff;
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);
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
      box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.35) inset, 0 0 0 1px rgba(96, 165, 250, 0.18);
      border-radius: 18px;
    }
    .aegis-hidden {
      display: none !important;
    }
    .aegis-active-anchor {
      color: #7dd3fc !important;
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
  toast._aegisTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
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

function setSelectedApp(label) {
  patchState({ selectedApp: label, lastAction: label });
}

function bindStandardFooter(doc) {
  const footerLinks = Array.from(doc.querySelectorAll("footer a, li a"));
  footerLinks.forEach((link) => bindManagedClick(link, () => {
    const text = normalizeText(link.textContent);
    if (text.includes("documentation") || text.includes("api docs") || text.includes("api reference") || text.includes("developer api")) {
      navigateTo("/nexus/aegis-protocol-documentation-portal/");
    } else if (text.includes("pricing") || text.includes("sales")) {
      navigateTo("/nexus/aegisalign-pricing-plans/");
    } else if (text.includes("support") || text.includes("help")) {
      navigateTo("/nexus/aegis-protocol-documentation-portal/");
    } else if (text.includes("status")) {
      navigateTo("/custodian-ui/status/");
    } else if (text.includes("privacy") || text.includes("terms") || text.includes("compliance") || text.includes("security")) {
      navigateTo("/nexus/aegis-governance-hub/");
    } else if (text.includes("github") || text.includes("sdk") || text.includes("developers")) {
      navigateTo("/developer-depot/developer-hub-depot/");
    } else if (text.includes("community")) {
      navigateTo("/peer-profile/home/");
    } else {
      navigateTo("/nexus/aegisalign-landing-page/");
    }
  }));
}

function bindSearchFilter(doc, input, nodes, getText) {
  if (!input || !nodes.length) return;
  const render = () => {
    const query = normalizeText(readState().search);
    nodes.forEach((node) => {
      const text = normalizeText(getText(node));
      node.classList.toggle("aegis-hidden", Boolean(query) && !text.includes(query));
    });
  };
  input.value = readState().search || "";
  input.addEventListener("input", () => {
    patchState({ search: input.value });
    render();
  });
  render();
}

function enhanceImplementationApps(doc) {
  if (doc.body.dataset.aegisEnhancedImplementationApps === "true") return;
  doc.body.dataset.aegisEnhancedImplementationApps = "true";
  injectStyles(doc);

  const navSolutions = findButton(doc, "Solutions");
  const navApps = findButton(doc, "Apps");
  const navDocs = findButton(doc, "Docs");
  const navSecurity = findButton(doc, "Security");
  const navPricing = findButton(doc, "Pricing");
  const getStarted = findButton(doc, "Get Started");
  const docsButton = findButton(doc, "Documentation");
  const contactSales = findButton(doc, "Contact Sales");
  const requestDemo = findButton(doc, "Request Demo");
  const search = doc.querySelector('input[placeholder*="Search implementation tools"]');
  const cards = Array.from(doc.querySelectorAll(".group")).filter((node) => node.querySelector("h3"));
  const actionLinks = cards.map((card) => card.querySelector("a, button")).filter(Boolean);

  bindManagedClick(navSolutions, () => navigateTo("/aegis-application-lab/home/"));
  bindManagedClick(navApps, () => navigateTo("/aegis-application-lab/aegis-implementation-apps/"));
  bindManagedClick(navDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(navSecurity, () => navigateTo("/custodian-ui/system-health-report-aegis-protocol/"));
  bindManagedClick(navPricing, () => navigateTo("/nexus/aegisalign-pricing-plans/"));
  bindManagedClick(getStarted, () => navigateTo("/peer-profile/home/"));
  bindManagedClick(docsButton, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(contactSales, () => navigateTo("/nexus/aegisalign-pricing-plans/"));
  bindManagedClick(requestDemo, () => navigateTo("/nexus/aegis-protocol-dashboard/"));

  actionLinks.forEach((link) => bindManagedClick(link, () => {
    const title = link.closest(".group")?.querySelector("h3")?.textContent?.trim() || "AEGIS App";
    setSelectedApp(title);
    const href = link.getAttribute("href");
    if (href) navigateTo(href);
  }));

  bindSearchFilter(doc, search, cards, (node) => node.textContent);
  bindStandardFooter(doc);
}

function enhanceCoreShield(doc) {
  if (doc.body.dataset.aegisEnhancedCoreShield === "true") return;
  doc.body.dataset.aegisEnhancedCoreShield = "true";
  injectStyles(doc);

  const navSolutions = findButton(doc, "Solutions");
  const navArchitecture = findButton(doc, "Architecture");
  const navDocs = findButton(doc, "Docs");
  const navPricing = findButton(doc, "Pricing");
  const launchDashboard = findButton(doc, "Launch Dashboard");
  const deployCoreShield = findButton(doc, "Deploy Core Shield");
  const technicalSpecs = findButton(doc, "Technical Specs");
  const openDeployment = findButton(doc, "Open Deployment Dashboard");
  const search = doc.querySelector('input[placeholder*="Search docs"]');
  const referenceLinks = Array.from(doc.querySelectorAll("li a"));
  const hero = Array.from(doc.querySelectorAll("section, div")).find((node) => normalizeText(node.textContent).includes("core shield"));

  bindManagedClick(navSolutions, () => navigateTo("/aegis-application-lab/aegis-implementation-apps/"));
  bindManagedClick(navArchitecture, () => navigateTo("/aegis-application-lab/aegis-implementation-apps/"));
  bindManagedClick(navDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(navPricing, () => navigateTo("/nexus/aegisalign-pricing-plans/"));
  bindManagedClick(launchDashboard, () => navigateTo("/custodian-ui/system-health-report-aegis-protocol/"));
  bindManagedClick(openDeployment, () => navigateTo("/custodian-ui/status/"));
  bindManagedClick(technicalSpecs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(deployCoreShield, () => {
    setSelectedApp("AEGIS Core Shield");
    setMessage(hero || doc.body, "Core Shield deployment path staged. Continue into subscriber unlocks or the system dashboard.", "success");
    showToast(doc, "Core Shield deployment staged for the governed infrastructure lane.");
    navigateTo("/nexus/aegisalign-pricing-plans/");
  });

  bindSearchFilter(doc, search, referenceLinks, (node) => node.textContent);
  bindStandardFooter(doc);
}

function enhanceInterceptor(doc) {
  if (doc.body.dataset.aegisEnhancedInterceptor === "true") return;
  doc.body.dataset.aegisEnhancedInterceptor = "true";
  injectStyles(doc);

  const navDashboard = findButton(doc, "Dashboard");
  const navLogs = findButton(doc, "Logs");
  const navRules = findButton(doc, "Rules");
  const navSupport = findButton(doc, "Support");
  const deployInterceptor = findButton(doc, "Deploy Interceptor");
  const viewDocumentation = findButton(doc, "View Documentation");
  const search = doc.querySelector('input[placeholder*="Search parameters"]');
  const links = Array.from(doc.querySelectorAll("a")).filter((node) => node !== navDashboard && node !== navLogs && node !== navRules && node !== navSupport);
  const hero = Array.from(doc.querySelectorAll("section, div")).find((node) => normalizeText(node.textContent).includes("deep packet security"));

  bindManagedClick(navDashboard, () => navigateTo("/aegis-application-lab/aegis-implementation-apps/"));
  bindManagedClick(navLogs, () => navigateTo("/custodian-ui/security-logs-aegis-protocol/"));
  bindManagedClick(navRules, () => navigateTo("/custodian-ui/api-reference-aegis-protocol/"));
  bindManagedClick(navSupport, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(viewDocumentation, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(deployInterceptor, () => {
    setSelectedApp("AEGIS Interceptor");
    setMessage(hero || doc.body, "Interceptor launch path armed. Move into telemetry or upgrade to continue deployment.", "success");
    showToast(doc, "Interceptor deployment queued through the Lab handoff.");
    navigateTo("/custodian-ui/security-incident-assessor-center/");
  });

  bindSearchFilter(doc, search, links, (node) => node.textContent);
  bindStandardFooter(doc);
}

function enhanceReflectivePrism(doc) {
  if (doc.body.dataset.aegisEnhancedReflectivePrism === "true") return;
  doc.body.dataset.aegisEnhancedReflectivePrism = "true";
  injectStyles(doc);

  const navSolutions = findButton(doc, "Solutions");
  const navPlatform = findButton(doc, "Platform");
  const navIntegrations = findButton(doc, "Integrations");
  const navPricing = findButton(doc, "Pricing");
  const getStarted = findButton(doc, "Get Started");
  const launchDemo = findButton(doc, "Launch Demo");
  const viewDocs = findButton(doc, "View Docs");
  const mitigationPath = findButton(doc, "View Mitigation Path");
  const search = doc.querySelector('input[placeholder*="Search documentation"]');
  const links = Array.from(doc.querySelectorAll("li a"));
  const hero = Array.from(doc.querySelectorAll("section, div")).find((node) => normalizeText(node.textContent).includes("reflective prism"));

  bindManagedClick(navSolutions, () => navigateTo("/aegis-application-lab/aegis-implementation-apps/"));
  bindManagedClick(navPlatform, () => navigateTo("/aegis-application-lab/apps-overview/"));
  bindManagedClick(navIntegrations, () => navigateTo("/developer-depot/webhooks-configuration-aegis-protocol/"));
  bindManagedClick(navPricing, () => navigateTo("/nexus/aegisalign-pricing-plans/"));
  bindManagedClick(viewDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(getStarted, () => navigateTo("/aegis-application-lab/aegis-implementation-apps/"));
  bindManagedClick(launchDemo, () => {
    setSelectedApp("AEGIS Reflective Prism");
    showToast(doc, "Reflective Prism demo path opened from the Application Lab.");
    navigateTo("/nexus/aegis-protocol-dashboard/");
  });
  bindManagedClick(mitigationPath, () => {
    setMessage(hero || doc.body, "Mitigation path highlighted. Routing into the active incident workspace.", "success");
    navigateTo("/custodian-ui/security-incident-assessor-center/");
  });

  bindSearchFilter(doc, search, links, (node) => node.textContent);
  bindStandardFooter(doc);
}

function enhanceReflectiveWidget(doc) {
  if (doc.body.dataset.aegisEnhancedReflectiveWidget === "true") return;
  doc.body.dataset.aegisEnhancedReflectiveWidget = "true";
  injectStyles(doc);

  const navProducts = findButton(doc, "Products");
  const navSolutions = findButton(doc, "Solutions");
  const navDevelopers = findButton(doc, "Developers");
  const navPricing = findButton(doc, "Pricing");
  const getStarted = findButton(doc, "Get Started");
  const getWidget = findButton(doc, "Get the Widget");
  const viewDocs = findButton(doc, "View Documentation");
  const copyButton = Array.from(doc.querySelectorAll("button")).find((node) => normalizeText(node.textContent).includes("content_copy"));
  const getApiKey = findButton(doc, "Get API Key");
  const salesInquiry = findButton(doc, "Sales Inquiry");
  const search = doc.querySelector('input[placeholder*="Search docs"]');
  const links = Array.from(doc.querySelectorAll("li a, a")).filter((node) => normalizeText(node.textContent).length > 0);
  const hero = Array.from(doc.querySelectorAll("section, div")).find((node) => normalizeText(node.textContent).includes("reflective widget"));

  bindManagedClick(navProducts, () => navigateTo("/aegis-application-lab/aegis-implementation-apps/"));
  bindManagedClick(navSolutions, () => navigateTo("/aegis-application-lab/home/"));
  bindManagedClick(navDevelopers, () => navigateTo("/developer-depot/developer-hub-depot/"));
  bindManagedClick(navPricing, () => navigateTo("/nexus/aegisalign-pricing-plans/"));
  bindManagedClick(viewDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(getStarted, () => navigateTo("/developer-depot/developer-hub-depot/"));
  bindManagedClick(getWidget, () => {
    setSelectedApp("AEGIS Reflective Widget");
    setMessage(hero || doc.body, "Widget starter path opened. Move into the Depot if you want to implement or distribute it.", "success");
    navigateTo("/developer-depot/submit-plugin-to-depot/");
  });
  bindManagedClick(copyButton, async () => {
    const snippet = '<script src=\"https://app.aegisalign.com/widgets/reflective.js\"></script>';
    try {
      await navigator.clipboard.writeText(snippet);
      patchState({ widgetSnippetCopied: true, lastAction: "widget-snippet-copied" });
      showToast(doc, "Reflective Widget snippet copied to the clipboard.");
    } catch {
      showToast(doc, "Clipboard access was not available, but the widget snippet path is ready.");
    }
  });
  bindManagedClick(getApiKey, () => navigateTo("/peer-profile/developer-connect/"));
  bindManagedClick(salesInquiry, () => navigateTo("/nexus/aegisalign-pricing-plans/"));

  bindSearchFilter(doc, search, links, (node) => node.textContent);
  bindStandardFooter(doc);
}

function enhanceArbitor(doc, mode) {
  const attr = mode === "overview" ? "aegisEnhancedArbitorOverview" : "aegisEnhancedArbitorConsensus";
  if (doc.body.dataset[attr] === "true") return;
  doc.body.dataset[attr] = "true";
  injectStyles(doc);

  const navInterceptor = findButton(doc, "Interceptor");
  const navCoreShield = findButton(doc, "Core Shield");
  const navArbitor = findButton(doc, "Arbitor");
  const navDocs = findButton(doc, "Docs");
  const launchApp = findButton(doc, "Launch App");
  const getStarted = findButton(doc, "Get Started");
  const technicalDocs = findButton(doc, "Technical Docs");
  const hero = Array.from(doc.querySelectorAll("section, div")).find((node) => normalizeText(node.textContent).includes("decentralized governance"));

  bindManagedClick(navInterceptor, () => navigateTo("/aegis-application-lab/aegis-interceptor-features-v2/"));
  bindManagedClick(navCoreShield, () => navigateTo("/aegis-application-lab/aegis-core-shield-features/"));
  bindManagedClick(navArbitor, () => navigateTo("/aegis-application-lab/aegis-arbitor-features-1/"));
  bindManagedClick(navDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(technicalDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(launchApp, () => {
    setSelectedApp(mode === "overview" ? "AEGIS Arbitor Overview" : "AEGIS Arbitor Consensus");
    showToast(doc, "Arbitor governance path launched into the active decision lane.");
    navigateTo(mode === "overview" ? "/aegis-application-lab/aegis-arbitor-features-2/" : "/custodian-ui/decentralized-governance-voting/");
  });
  bindManagedClick(getStarted, () => {
    setMessage(hero || doc.body, "Governance pathway staged. Continue into the active Custodian voting surface.", "success");
    navigateTo("/custodian-ui/decentralized-governance-voting/");
  });

  bindStandardFooter(doc);
}

function enhanceLlmColabWorkshop(doc) {
  if (doc.body.dataset.aegisEnhancedLlmColabWorkshop === "true") return;
  doc.body.dataset.aegisEnhancedLlmColabWorkshop = "true";
  injectStyles(doc);

  const navColab = findButton(doc, "Colab");
  const navWorkshop = findButton(doc, "Workshop");
  const navMetrics = findButton(doc, "Metrics");
  const navDocs = findButton(doc, "Docs");
  const getStarted = findButton(doc, "Get Started");
  const startCollaborating = findButton(doc, "Start Collaborating");
  const deployAgents = findButton(doc, "Deploy Agents");
  const links = Array.from(doc.querySelectorAll("li a"));
  const search = doc.querySelector('input[placeholder*="Search parameters"]');
  const hero = Array.from(doc.querySelectorAll("section, div")).find((node) => normalizeText(node.textContent).includes("orchestrate intelligence"));

  bindManagedClick(navColab, () => navigateTo("/aegis-application-lab/aegis-llm-colab-and-agentic-workshop/"));
  bindManagedClick(navWorkshop, () => navigateTo("/agent-workshop/"));
  bindManagedClick(navMetrics, () => navigateTo("/custodian-ui/status/"));
  bindManagedClick(navDocs, () => navigateTo("/nexus/aegis-protocol-documentation-portal/"));
  bindManagedClick(getStarted, () => navigateTo("/aegis-application-lab/aegis-implementation-apps/"));
  bindManagedClick(startCollaborating, () => {
    setSelectedApp("AEGIS LLM Colab & Agentic Workshop");
    setMessage(hero || doc.body, "Collaboration path opened. Continue into the Workshop to configure the active peer flow.", "success");
    navigateTo("/agent-workshop/agentic-workshop-main-console/");
  });
  bindManagedClick(deployAgents, () => navigateTo("/agent-workshop/create-new-agent-identity-configuration/"));

  bindSearchFilter(doc, search, links, (node) => node.textContent);
  bindStandardFooter(doc);
}

const pageEnhancers = {
  "aegis-implementation-apps": enhanceImplementationApps,
  "aegis-core-shield-features": enhanceCoreShield,
  "aegis-interceptor-features-v2": enhanceInterceptor,
  "aegis-reflective-prism-features": enhanceReflectivePrism,
  "aegis-reflective-widget-features": enhanceReflectiveWidget,
  "aegis-arbitor-features-1": (doc) => enhanceArbitor(doc, "overview"),
  "aegis-arbitor-features-2": (doc) => enhanceArbitor(doc, "consensus"),
  "aegis-llm-colab-and-agentic-workshop": enhanceLlmColabWorkshop,
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
    // stitched iframes may not be ready on the first pass
  }
}

function initApplicationLabActivation() {
  if (!document.body.classList.contains("domain-aegis-application-lab")) return;
  const boot = () => {
    document.querySelectorAll("iframe").forEach((frame) => {
      if (frame.dataset.aegisAppLabBound === "true") return;
      frame.dataset.aegisAppLabBound = "true";
      frame.addEventListener("load", () => enhanceFrame(frame));
      enhanceFrame(frame);
    });
  };
  boot();
  const observer = new MutationObserver(boot);
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApplicationLabActivation, { once: true });
} else {
  initApplicationLabActivation();
}
