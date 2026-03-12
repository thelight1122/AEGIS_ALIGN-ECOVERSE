const storageKey = "aegis-thread-transition";

const pageLinks = Array.from(document.querySelectorAll("[data-page-link]"));

for (const link of pageLinks) {
  link.addEventListener("click", () => {
    const rect = link.getBoundingClientRect();
    const payload = {
      href: link.href,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      label: (link.textContent || "").trim(),
      timestamp: Date.now(),
    };

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Ignore storage failures and allow normal navigation.
    }
  });
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!prefersReducedMotion.matches) {
  let payload = null;

  try {
    payload = JSON.parse(sessionStorage.getItem(storageKey) || "null");
  } catch {
    payload = null;
  }

  if (payload && payload.href === window.location.href && Date.now() - payload.timestamp < 3000) {
    const target = document.querySelector('[data-thread-entry="incoming"]');
    if (target) {
      const targetRect = target.getBoundingClientRect();
      const sourceCenterX = payload.left + payload.width / 2;
      const sourceCenterY = payload.top + payload.height / 2;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;
      const deltaX = sourceCenterX - targetCenterX;
      const deltaY = sourceCenterY - targetCenterY;
      const scaleX = Math.max(0.18, Math.min(0.72, payload.width / Math.max(targetRect.width, 1)));
      const scaleY = Math.max(0.12, Math.min(0.42, payload.height / Math.max(targetRect.height, 1)));

      target.animate(
        [
          {
            opacity: 0.18,
            transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
            filter: "blur(6px) saturate(1.18)",
          },
          {
            opacity: 1,
            transform: "translate(0, 0) scale(1, 1)",
            filter: "blur(0px) saturate(1)",
          },
        ],
        {
          duration: 620,
          easing: "cubic-bezier(0.18, 0.82, 0.22, 1)",
          fill: "both",
        },
      );
    }

    sessionStorage.removeItem(storageKey);
  }
}
