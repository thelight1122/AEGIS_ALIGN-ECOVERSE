const body = document.body;

if (!body || !body.classList.contains("immersive-root")) {
  // Drift mode is only used on the immersive landing surface.
} else {
  const STORAGE_KEY = "aegis.nexus.navMode";
  const enterButton = document.querySelector("[data-drift-enter]");
  const directButton = document.querySelector("[data-drift-direct]");
  const exitButton = document.querySelector("[data-drift-exit]");
  const quickbar = document.querySelector("[data-drift-quickbar]");

  function setActiveButton(active) {
    if (enterButton) {
      enterButton.classList.toggle("is-active", active === "drift");
    }
    if (directButton) {
      directButton.classList.toggle("is-active", active === "direct");
    }
  }

  function applyMode(mode) {
    const drift = mode === "drift";
    body.classList.toggle("nexus-drift-mode", drift);
    setActiveButton(drift ? "drift" : "direct");
    if (quickbar) {
      quickbar.hidden = !drift;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, drift ? "drift" : "direct");
    } catch {
      // Ignore storage failures and keep the active mode in-memory.
    }
    window.dispatchEvent(
      new CustomEvent("aegis:nexus-nav-mode", {
        detail: { mode: drift ? "drift" : "direct" },
      }),
    );
  }

  let initialMode = "direct";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "drift" || stored === "direct") {
      initialMode = stored;
    }
  } catch {
    // Ignore storage failures and use direct mode by default.
  }

  applyMode(initialMode);

  enterButton?.addEventListener("click", () => applyMode("drift"));
  directButton?.addEventListener("click", () => applyMode("direct"));
  exitButton?.addEventListener("click", () => applyMode("direct"));

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("nexus-drift-mode")) {
      applyMode("direct");
    }
  });
}
