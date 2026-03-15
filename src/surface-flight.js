const body = document.body;
const root = document.documentElement;
const layout = document.querySelector(".layout");

if (!body || !layout) {
  // Pages without the shared shell do not need the flight layer.
} else {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const selectors = [
    ".sidebar",
    ".content-wrap",
    ".portal-card",
    ".phase-link",
    ".thread-card",
    ".nexus-command-deck",
    ".governance-card",
    ".starter-card",
    ".starter-handoff",
  ];

  const targets = Array.from(
    new Set(
      selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector))),
    ),
  );

  function setScene(xRatio, yRatio) {
    root.style.setProperty("--scene-pan-x", `${(xRatio * 18).toFixed(2)}px`);
    root.style.setProperty("--scene-pan-y", `${(yRatio * 14).toFixed(2)}px`);
    root.style.setProperty("--scene-pan-soft-x", `${(xRatio * -2.4).toFixed(2)}px`);
    root.style.setProperty("--scene-pan-soft-y", `${(yRatio * -1.8).toFixed(2)}px`);
    root.style.setProperty("--scene-pan-shell-x", `${(xRatio * -1.6).toFixed(2)}px`);
    root.style.setProperty("--scene-pan-shell-y", `${(yRatio * -1.2).toFixed(2)}px`);
    root.style.setProperty("--scene-tilt-x", `${(-yRatio * 1.2).toFixed(2)}deg`);
    root.style.setProperty("--scene-tilt-y", `${(xRatio * 1.6).toFixed(2)}deg`);
    root.style.setProperty("--scene-tilt-soft-y", `${(xRatio * 1.1).toFixed(2)}deg`);
  }

  function assignDepth() {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);

    targets.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const xRatio = ((rect.left + rect.width / 2) / width - 0.5) * 2;
      const yRatio = ((rect.top + rect.height / 2) / height - 0.5) * 2;
      const band = index % 4;
      const depth = Math.max(8, 12 + (3 - Math.abs(yRatio)) * 6 + band * 5);

      element.classList.add("flight-surface");
      element.style.setProperty("--flight-delay", `${Math.min(index * 55, 480)}ms`);
      element.style.setProperty("--flight-depth", `${depth.toFixed(0)}px`);
      element.style.setProperty("--flight-shift-x", `${(-xRatio * 12).toFixed(2)}px`);
      element.style.setProperty("--flight-shift-y", `${(-yRatio * 10).toFixed(2)}px`);
      element.style.setProperty("--flight-rotate", `${(-xRatio * 4.5).toFixed(2)}deg`);
    });
  }

  body.classList.add("surface-flight-booting");
  assignDepth();

  if (reducedMotion) {
    setScene(0, 0);
  } else {
    window.addEventListener(
      "pointermove",
      (event) => {
        const xRatio = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
        const yRatio = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
        setScene(xRatio * 2, yRatio * 2);
      },
      { passive: true },
    );

    document.addEventListener(
      "pointerleave",
      () => {
        setScene(0, 0);
      },
      { passive: true },
    );
  }

  window.addEventListener("resize", assignDepth, { passive: true });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      body.classList.add("surface-flight-ready");
      body.classList.remove("surface-flight-booting");
    });
  });
}
