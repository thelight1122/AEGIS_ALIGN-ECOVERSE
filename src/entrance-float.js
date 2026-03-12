const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ENTRANCE_SELECTOR = [
  "[data-entrance]",
  "a.portal-card.live",
  "a.phase-link",
  "a.page-card",
].join(",");

const RELEASE_POINTER_DISTANCE = 44;
const LOCK_HOLD_MS = 110;

let focusedEntrance = null;
let lockPoint = null;
let holdTimer = 0;

function allEntrances() {
  return Array.from(document.querySelectorAll(ENTRANCE_SELECTOR));
}

function isInteractiveTypingTarget(target) {
  if (!target || !(target instanceof Element)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

function emitFocusEvent(type, entrance) {
  const rect = entrance?.getBoundingClientRect?.();
  const detail = rect
    ? {
        type,
        centerX: rect.left + rect.width * 0.5,
        centerY: rect.top + rect.height * 0.5,
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
      }
    : { type };
  window.dispatchEvent(new CustomEvent("aegis:entrance-focus", { detail }));
}

function markEntrances(nextFocused) {
  const entrances = allEntrances();
  for (let i = 0; i < entrances.length; i += 1) {
    entrances[i].classList.add("entrance-anchor");
    if (entrances[i] === nextFocused) {
      entrances[i].classList.add("is-entrance-focus");
    } else {
      entrances[i].classList.remove("is-entrance-focus");
    }
  }
}

function releaseFocus() {
  if (!focusedEntrance) {
    return;
  }
  focusedEntrance = null;
  lockPoint = null;
  document.body.classList.remove("entrance-focus-active");
  markEntrances(null);
  emitFocusEvent("release");
}

function centerEntrance(entrance) {
  if (!entrance || typeof entrance.scrollIntoView !== "function") {
    return;
  }
  entrance.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "center",
    inline: "center",
  });
}

function engageFocus(entrance, event) {
  if (!entrance) {
    return;
  }
  if (focusedEntrance === entrance) {
    return;
  }
  focusedEntrance = entrance;
  lockPoint = event ? { x: event.clientX || 0, y: event.clientY || 0 } : null;
  document.body.classList.add("entrance-focus-active");
  markEntrances(entrance);
  centerEntrance(entrance);
  emitFocusEvent("engage", entrance);
}

function scheduleEngage(entrance, event) {
  window.clearTimeout(holdTimer);
  holdTimer = window.setTimeout(() => {
    engageFocus(entrance, event);
  }, LOCK_HOLD_MS);
}

function onPointerMove(event) {
  if (!focusedEntrance || !lockPoint) {
    return;
  }
  const dx = event.clientX - lockPoint.x;
  const dy = event.clientY - lockPoint.y;
  const distance = Math.hypot(dx, dy);
  if (distance > RELEASE_POINTER_DISTANCE) {
    releaseFocus();
  }
}

document.addEventListener("pointerenter", (event) => {
  const entrance = event.target.closest?.(ENTRANCE_SELECTOR);
  if (!entrance) {
    return;
  }
  scheduleEngage(entrance, event);
}, true);

document.addEventListener("pointerdown", (event) => {
  const entrance = event.target.closest?.(ENTRANCE_SELECTOR);
  if (!entrance) {
    return;
  }
  engageFocus(entrance, event);
}, true);

document.addEventListener("focusin", (event) => {
  const entrance = event.target.closest?.(ENTRANCE_SELECTOR);
  if (!entrance) {
    return;
  }
  engageFocus(entrance);
});

document.addEventListener("pointermove", onPointerMove, { passive: true });
document.addEventListener("wheel", releaseFocus, { passive: true });
document.addEventListener("touchmove", releaseFocus, { passive: true });
window.addEventListener("scroll", releaseFocus, { passive: true });

document.addEventListener("keydown", (event) => {
  if (isInteractiveTypingTarget(event.target)) {
    return;
  }
  if (event.key === "Escape") {
    releaseFocus();
    return;
  }
  if (event.key.length === 1 || event.key.startsWith("Arrow") || event.key === "PageDown" || event.key === "PageUp") {
    releaseFocus();
  }
});

window.addEventListener("beforeunload", () => {
  window.clearTimeout(holdTimer);
});

markEntrances(null);
