const words = [
  "Manners",
  "Consideration",
  "Respect",
  "Gratitude",
  "Kindness",
  "Wonder",
  "Play",
  "Discovery",
];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hostEligible = document.body.classList.contains("with-ambient-signals");

if (hostEligible) {
  const host = document.createElement("div");
  host.className = "signal-constellation";

  const shuffled = [...words].sort(() => Math.random() - 0.5);
  const maxNodes = Math.min(8, shuffled.length);

  for (let i = 0; i < maxNodes; i += 1) {
    const node = document.createElement("span");
    node.className = "signal-node";
    node.textContent = shuffled[i];

    const left = 8 + Math.random() * 84;
    const top = 22 + Math.random() * 66;
    const duration = 8 + Math.random() * 7;
    const delay = Math.random() * 5;

    node.style.left = `${left}%`;
    node.style.top = `${top}%`;

    if (!reducedMotion) {
      node.style.animationDuration = `${duration}s`;
      node.style.animationDelay = `${delay}s`;
    }

    host.appendChild(node);
  }

  document.body.appendChild(host);

  if (reducedMotion) {
    host.classList.add("reduced");
  }
}
