const STORAGE_KEY = "aegis.agentWorkshop.state";

const DEFAULT_STATE = {
  lastLaunchRoute: "",
  launches: [],
};

function mergeState(base, stored) {
  return {
    ...base,
    ...stored,
    launches: Array.isArray(stored?.launches) ? stored.launches : base.launches,
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
  const next = patchState({
    lastLaunchRoute: path,
    launches: [
      { path, at: new Date().toISOString() },
      ...readState().launches,
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

  const render = () => {
    const state = readState();
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
}

const pageEnhancers = {
  "agentic-workshop-main-console": enhanceMainConsole,
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
