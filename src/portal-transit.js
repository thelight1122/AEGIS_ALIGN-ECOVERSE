const TRANSIT_CLASS = "portal-transit-active";
const OVERLAY_ID = "portal-transit-overlay";

function ensureOverlay() {
  let overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    return overlay;
  }

  overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="portal-transit-core"></div>
    <div class="portal-transit-copy">Crossing into the next AEGIS dimension...</div>
  `;
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

function engageTransit(targetHref) {
  ensureOverlay();
  document.body.classList.add(TRANSIT_CLASS);
  window.setTimeout(() => {
    window.location.assign(targetHref);
  }, 320);
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!isInternalRoute(link)) {
    return;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  engageTransit(link.href);
});

window.addEventListener("pageshow", () => {
  document.body.classList.remove(TRANSIT_CLASS);
});
