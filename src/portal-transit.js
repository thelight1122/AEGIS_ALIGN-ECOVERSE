const TRANSIT_CLASS = "portal-transit-active";
const OVERLAY_ID = "portal-transit-overlay";
const ENTER_CLASS = "portal-transit-enter";
const ENTER_READY_CLASS = "portal-transit-enter-ready";
const DRIFT_STORAGE_KEY = "aegis.nexus.navMode";

function ensureOverlay() {
  let overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    return overlay;
  }

  overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.setAttribute("aria-hidden", "true");
  document.body.appendChild(overlay);
  return overlay;
}

function isInternalRoute(link) {
  if (!link || !link.href) {
    return false;
  }
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) {
    return false;
  }
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return false;
  }
  return true;
}

function setTransitOrigin(centerX, centerY) {
  document.documentElement.style.setProperty("--portal-transit-origin-x", `${centerX.toFixed(2)}px`);
  document.documentElement.style.setProperty("--portal-transit-origin-y", `${centerY.toFixed(2)}px`);
}

function engageTransit(targetHref, options = {}) {
  const viewportW = options.viewportW || window.innerWidth;
  const viewportH = options.viewportH || window.innerHeight;
  const centerX = typeof options.centerX === "number" ? options.centerX : viewportW * 0.5;
  const centerY = typeof options.centerY === "number" ? options.centerY : viewportH * 0.5;

  ensureOverlay();
  setTransitOrigin(centerX, centerY);
  document.body.classList.add(TRANSIT_CLASS);
  window.dispatchEvent(
    new CustomEvent("aegis:entrance-focus", {
      detail: { type: "engage", centerX, centerY, viewportW, viewportH },
    }),
  );
  try {
    const prefetch = document.createElement("link");
    prefetch.rel = "prefetch";
    prefetch.href = targetHref;
    document.head.appendChild(prefetch);
  } catch {
    // Ignore prefetch issues and continue with the transition.
  }
  window.setTimeout(() => {
    window.location.assign(targetHref);
  }, 240);
}

window.aegisTransit = engageTransit;

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!isInternalRoute(link)) {
    return;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  if (link.hasAttribute("data-drift-return")) {
    try {
      window.localStorage.setItem(DRIFT_STORAGE_KEY, "drift");
    } catch {
      // Ignore storage failures and continue with navigation.
    }
  }
  const rect = link.getBoundingClientRect();
  engageTransit(link.href, {
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
    viewportW: window.innerWidth,
    viewportH: window.innerHeight,
  });
});

window.addEventListener("pageshow", () => {
  document.body.classList.remove(TRANSIT_CLASS);
  document.body.classList.add(ENTER_CLASS);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add(ENTER_READY_CLASS);
      window.setTimeout(() => {
        document.body.classList.remove(ENTER_CLASS, ENTER_READY_CLASS);
      }, 420);
    });
  });
});
