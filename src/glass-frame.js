const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const frameWraps = Array.from(document.querySelectorAll(".iframe-wrap"));

for (const wrap of frameWraps) {
  const frame = wrap.querySelector(".stitch-frame");
  if (!frame) continue;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let targetGlowX = 50;
  let targetGlowY = 16;
  let currentGlowX = 50;
  let currentGlowY = 16;
  let rafId = 0;

  const setVars = () => {
    wrap.style.setProperty("--glass-rotate-x", `${currentX.toFixed(2)}deg`);
    wrap.style.setProperty("--glass-rotate-y", `${currentY.toFixed(2)}deg`);
    wrap.style.setProperty("--glass-glow-x", `${currentGlowX.toFixed(2)}%`);
    wrap.style.setProperty("--glass-glow-y", `${currentGlowY.toFixed(2)}%`);
  };

  const animate = () => {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    currentGlowX += (targetGlowX - currentGlowX) * 0.14;
    currentGlowY += (targetGlowY - currentGlowY) * 0.14;
    setVars();

    const settled =
      Math.abs(targetX - currentX) < 0.02 &&
      Math.abs(targetY - currentY) < 0.02 &&
      Math.abs(targetGlowX - currentGlowX) < 0.08 &&
      Math.abs(targetGlowY - currentGlowY) < 0.08;

    if (settled) {
      rafId = 0;
      return;
    }

    rafId = window.requestAnimationFrame(animate);
  };

  const queueAnimate = () => {
    if (prefersReducedMotion.matches) {
      currentX = 0;
      currentY = 0;
      currentGlowX = 50;
      currentGlowY = 16;
      setVars();
      return;
    }

    if (!rafId) {
      rafId = window.requestAnimationFrame(animate);
    }
  };

  const reset = () => {
    wrap.classList.remove("glass-engaged");
    targetX = 0;
    targetY = 0;
    targetGlowX = 50;
    targetGlowY = 16;
    queueAnimate();
  };

  wrap.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion.matches) return;

    const rect = wrap.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const offsetX = (x - 0.5) * 2;
    const offsetY = (y - 0.5) * 2;

    wrap.classList.add("glass-engaged");
    targetX = offsetY * -4.5;
    targetY = offsetX * 6;
    targetGlowX = x * 100;
    targetGlowY = Math.max(6, y * 100 - 10);
    queueAnimate();
  });

  wrap.addEventListener("pointerleave", reset);
  wrap.addEventListener("pointercancel", reset);

  prefersReducedMotion.addEventListener("change", reset);
  setVars();
}
