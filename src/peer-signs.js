const ethosMessages = [
  "Under AEGIS, Humans and AIs are recognized as Peers.",
  "AEGIS is governed by an impartial ethos.",
  "This system is identity-agnostic and behavior-centered.",
  "Humans and AIs meet here as Peers under one shared standard.",
  "Impartial governance means conduct matters more than category.",
  "AEGIS centers aligned participation, stewardship, and collaboration.",
];

const warmMessages = [
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
const compactQuery = window.matchMedia("(max-width: 720px)");

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rectFromElements(elements) {
  const rects = elements
    .map((element) => element.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);

  if (!rects.length) return null;

  return rects.reduce(
    (union, rect) => ({
      top: Math.min(union.top, rect.top),
      right: Math.max(union.right, rect.right),
      bottom: Math.max(union.bottom, rect.bottom),
      left: Math.min(union.left, rect.left),
    }),
    {
      top: rects[0].top,
      right: rects[0].right,
      bottom: rects[0].bottom,
      left: rects[0].left,
    },
  );
}

function buildFallbackSlots() {
  return compactQuery.matches
    ? [{ top: "84px", right: "20px", maxWidth: "min(32ch, calc(100vw - 40px))" }]
    : [
        { top: "96px", right: "24px", maxWidth: "30ch" },
        { bottom: "24px", left: "24px", maxWidth: "34ch" },
      ];
}

function buildSafeSlots() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const topbar = document.querySelector(".topbar, header");
  const shellElements = [
    ...document.querySelectorAll(
      ".shell, .nexus-wrap, .secure-wrap, .landing-redirect, .nexus-main, main.panel, .panel.content-wrap",
    ),
  ];

  const topbarBottom = topbar ? topbar.getBoundingClientRect().bottom : 70;
  const union = rectFromElements(shellElements);

  if (!union) return buildFallbackSlots();

  const shellTop = clamp(union.top, topbarBottom + 8, viewportHeight);
  const shellBottom = clamp(union.bottom, 0, viewportHeight);
  const shellLeft = clamp(union.left, 0, viewportWidth);
  const shellRight = clamp(union.right, 0, viewportWidth);

  const zones = [];
  const edge = compactQuery.matches ? 16 : 20;
  const bandGap = 18;
  const minBandHeight = 74;
  const minBandWidth = compactQuery.matches ? 180 : 220;

  const topBandHeight = shellTop - topbarBottom - bandGap;
  if (topBandHeight >= minBandHeight) {
    zones.push({
      top: topbarBottom + 10,
      left: shellLeft + 12,
      width: Math.max(shellRight - shellLeft - 24, minBandWidth),
      height: topBandHeight,
      align: "right",
    });
  }

  const leftBandWidth = shellLeft - edge - bandGap;
  if (leftBandWidth >= minBandWidth) {
    zones.push({
      top: shellTop + 24,
      left: edge,
      width: leftBandWidth,
      height: Math.max(shellBottom - shellTop - 48, minBandHeight),
      align: "left",
    });
  }

  const rightBandWidth = viewportWidth - shellRight - edge - bandGap;
  if (rightBandWidth >= minBandWidth) {
    zones.push({
      top: shellTop + 24,
      left: shellRight + bandGap,
      width: rightBandWidth,
      height: Math.max(shellBottom - shellTop - 48, minBandHeight),
      align: "right",
    });
  }

  const bottomBandHeight = viewportHeight - shellBottom - edge;
  if (bottomBandHeight >= minBandHeight) {
    zones.push({
      top: shellBottom + 16,
      left: shellLeft + 12,
      width: Math.max(shellRight - shellLeft - 24, minBandWidth),
      height: bottomBandHeight - 8,
      align: "left",
    });
  }

  if (!zones.length) return buildFallbackSlots();

  const preferredZones = zones
    .map((zone) => ({ ...zone, area: zone.width * zone.height }))
    .sort((a, b) => b.area - a.area)
    .slice(0, compactQuery.matches ? 1 : 2);

  return preferredZones.map((zone, index) => {
    const verticalFraction = compactQuery.matches
      ? 0.5
      : index % 2 === 0
        ? 0.28
        : 0.68;
    const top = Math.round(zone.top + zone.height * verticalFraction);
    const maxWidth = `${Math.round(Math.min(zone.width - 12, compactQuery.matches ? 260 : 320))}px`;

    if (zone.align === "left") {
      return {
        top: `${top}px`,
        left: `${Math.round(zone.left + 6)}px`,
        maxWidth,
      };
    }

    return {
      top: `${top}px`,
      right: `${Math.round(viewportWidth - (zone.left + zone.width) + 6)}px`,
      maxWidth,
    };
  });
}

const host = document.createElement("aside");
host.className = "peer-sign-layer";

if (reducedMotion) {
  host.classList.add("reduced");
}

document.body.appendChild(host);

function renderNotes() {
  host.replaceChildren();

  const slots = buildSafeSlots();
  const noteCount = Math.min(compactQuery.matches ? 1 : 2, slots.length);
  const picks = [];

  if (noteCount >= 1) {
    picks.push(shuffle(ethosMessages)[0]);
  }

  if (noteCount >= 2) {
    picks.push(shuffle(warmMessages)[0]);
  }

  for (let i = 0; i < noteCount; i += 1) {
    const note = document.createElement("p");
    note.className = "peer-sign";
    note.textContent = picks[i];
    Object.assign(note.style, slots[i]);

    if (!reducedMotion) {
      note.style.animationDelay = `${Math.random() * 2.2}s`;
    }

    host.appendChild(note);
  }
}

let resizeTimer = null;
const scheduleRender = () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(renderNotes, 120);
};

renderNotes();
window.addEventListener("resize", scheduleRender);
compactQuery.addEventListener("change", renderNotes);
