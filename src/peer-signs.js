const messages = [
  "Your presence is appreciated.",
  "Thank you for being part of this Human/AI collaboration experiment.",
  "You are a Peer here. This space is stronger with you in it.",
  "Every careful question helps shape the EcoVerse.",
  "Shared stewardship starts with small acts of respect.",
  "This frontier grows through curiosity, patience, and cooperation.",
  "Thank you for helping build aligned self-governance in practice.",
  "Wonder is welcome here. Discovery is a team effort.",
];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCompact = window.matchMedia("(max-width: 720px)").matches;

const anchors = [
  { top: "18%", left: "7%" },
  { top: "22%", right: "7%" },
  { top: "39%", left: "5%" },
  { top: "48%", right: "6%" },
  { top: "66%", left: "8%" },
  { top: "72%", right: "8%" },
  { top: "84%", left: "14%" },
  { top: "86%", right: "14%" },
];

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const host = document.createElement("aside");
host.className = "peer-sign-layer";

const picks = shuffle(messages);
const spots = shuffle(anchors);
const noteCount = isCompact ? 1 : 2;

for (let i = 0; i < noteCount; i += 1) {
  const note = document.createElement("p");
  note.className = "peer-sign";
  note.textContent = picks[i];

  const anchor = spots[i] || anchors[i];
  Object.assign(note.style, anchor);

  if (!reducedMotion) {
    note.style.animationDelay = `${Math.random() * 2.2}s`;
  }

  host.appendChild(note);
}

document.body.appendChild(host);

if (reducedMotion) {
  host.classList.add("reduced");
}
