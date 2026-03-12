const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const frameWraps = Array.from(document.querySelectorAll(".iframe-wrap"));

for (const wrap of frameWraps) {
  wrap.style.setProperty("--glass-rotate-x", "0deg");
  wrap.style.setProperty("--glass-rotate-y", "0deg");
  wrap.style.setProperty("--glass-glow-x", "50%");
  wrap.style.setProperty("--glass-glow-y", prefersReducedMotion.matches ? "18%" : "16%");
}
