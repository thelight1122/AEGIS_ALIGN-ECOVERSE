const STORAGE_KEY = "aegis.nexus.state";

const DEFAULT_STATE = {
  peerLabel: "Guest Peer",
  signedIn: false,
  subscription: "Explorer",
  onboardingStage: "public",
  starterQueued: false,
  upgradeInterest: false,
  recentRoutes: [],
  lastRoute: "",
  lastSeenAt: "",
};

const PAGE_META = {
  "aegisalign-landing-page": {
    focus: "Central hub",
    detail: "Public launch surface for the EcoVerse."
  },
  "aegis-protocol-features": {
    focus: "Protocol overview",
    detail: "Capability narrative and product-family positioning."
  },
  "aegis-protocol-documentation-portal": {
    focus: "Starter systems",
    detail: "Docs, reference surfaces, and starter download path."
  },
  "aegis-protocol-dashboard": {
    focus: "Live demo",
    detail: "Primary demo surface for active AEGIS protocol activity."
  },
  "login-aegisalign": {
    focus: "Access",
    detail: "Secure identity gateway into the Nexus."
  },
  "signup-aegisalign": {
    focus: "Onboarding",
    detail: "Peer creation and first-time activation path."
  },
  "multi-factor-authentication": {
    focus: "Verification",
    detail: "Identity confirmation for governed access."
  },
  "login-success-transition": {
    focus: "Session handoff",
    detail: "Transitioning authenticated Peers into the demo layer."
  },
  "aegisalign-pricing-plans": {
    focus: "Subscriber upgrade",
    detail: "Upgrade path for premium tools and full-system access."
  },
  "aegis-peer-profile": {
    focus: "Peer profile",
    detail: "Identity, subscription posture, and the gateway into premium AEGIS tools."
  },
  "aegisalign-settings": {
    focus: "Profile and access",
    detail: "Subscriber preferences, trusted access, and account state."
  }
};

const HANDOFF_META = {
  "aegisalign-landing-page": {
    kicker: "Public Entry Pattern",
    title: "Guide new Peers from the Nexus into demos, starter kits, or subscriber tools.",
    body: "Use the landing hub to show the family of products, then offer one clean branch into exploration, download, or upgrade.",
    bullets: ["Highlight the AEGIS ethos", "Open the live demo quickly", "Keep the upgrade path visible"],
  },
  "aegis-protocol-documentation-portal": {
    kicker: "Starter Download Handoff",
    title: "Package the documentation surface as the gateway into starter Git releases.",
    body: "This is the right place to describe what comes in the starter system, what the hosted demo proves, and what subscribers unlock next.",
    bullets: ["Starter repo overview", "Quickstart and API reference", "Upgrade path to the full system"],
  },
  "aegisalign-pricing-plans": {
    kicker: "Subscriber Conversion",
    title: "Turn interest into a clear premium offer without losing the honest product story.",
    body: "Pricing should read as an upgrade from demo and starter access into the full governed workspace, not as a paywall over the platform narrative.",
    bullets: ["Hosted premium modules", "Full system access", "Subscriber workspace benefits"],
  },
  "aegis-peer-profile": {
    kicker: "Identity Hub",
    title: "Make Profile the clean handoff into access, continuity, and subscriber capability.",
    body: "The Profile surface should help a Peer understand who they are in the EcoVerse, what they can access now, and which premium workspaces become available next.",
    bullets: ["Identity and continuity", "Trusted settings", "Premium workspace gateway"],
  },
  "aegis-protocol-dashboard": {
    kicker: "Live Demo Surface",
    title: "Keep the demo active while showing how Peers can continue deeper into the EcoVerse.",
    body: "The dashboard is the proof surface. From here, the strongest next branches are starter downloads, section exploration, and subscriber onboarding.",
    bullets: ["Demo credibility", "Starter follow-through", "Cross-section exploration"],
  },
};

const STARTER_CATALOG = [
  {
    id: "protocol-cli-starter",
    badge: "Starter Repo",
    title: "AEGIS Protocol CLI Starter",
    body: "A lightweight command-line entry point for initialization, keys, and basic protocol configuration.",
    bullets: ["CLI install flow", "Local key generation", "Quickstart environment"],
    actions: [
      { id: "starter", label: "Queue Starter", href: "/nexus/aegis-protocol-documentation-portal/" },
      { id: "demo", label: "Open Demo", href: "/nexus/aegis-protocol-dashboard/" },
    ],
  },
  {
    id: "integration-starter",
    badge: "Integration Pack",
    title: "Node Integration Starter",
    body: "A starter path for teams wiring the AEGIS layer into services, webhooks, and identity checks.",
    bullets: ["Webhook setup", "Authentication flow", "Environment variables"],
    actions: [
      { id: "starter", label: "Review Setup", href: "/nexus/aegis-protocol-documentation-portal/" },
      { id: "upgrade", label: "Full System", href: "/nexus/aegisalign-pricing-plans/" },
    ],
  },
  {
    id: "subscriber-workspace",
    badge: "Upgrade Path",
    title: "Subscriber Workspace",
    body: "The hosted path into premium AEGIS tools, governed access, and future modules like Developer Connect.",
    bullets: ["Hosted modules", "Profile access", "Premium toolchain"],
    actions: [
      { id: "upgrade", label: "Unlock Full System", href: "/nexus/aegisalign-pricing-plans/" },
      { id: "auth", label: "Sign In", href: "/nexus/login-aegisalign/" },
    ],
  },
];

function safeReadState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState(state) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function currentSlug(deck) {
  return deck?.dataset.pageSlug || window.location.pathname.split("/").filter(Boolean).at(-1) || "aegisalign-landing-page";
}

function mergeRecentRoute(state, slug) {
  const title = PAGE_META[slug]?.focus || titleFromSlug(slug);
  const next = [
    { slug, title, href: window.location.pathname, seenAt: new Date().toISOString() },
    ...state.recentRoutes.filter((entry) => entry.slug !== slug),
  ].slice(0, 4);
  return next;
}

function deriveStateForPage(state, slug) {
  const next = {
    ...state,
    lastRoute: slug,
    lastSeenAt: new Date().toISOString(),
    recentRoutes: mergeRecentRoute(state, slug),
  };

  if (slug === "signup-aegisalign") next.onboardingStage = "signup";
  if (slug === "multi-factor-authentication") next.onboardingStage = "mfa";
  if (slug === "login-success-transition" || (slug === "aegis-protocol-dashboard" && state.signedIn)) {
    next.signedIn = true;
    next.peerLabel = state.peerLabel === "Guest Peer" ? "Authenticated Peer" : state.peerLabel;
    next.onboardingStage = "active";
  }
  if (slug === "aegisalign-pricing-plans") next.upgradeInterest = true;
  if (slug === "aegisalign-settings" && next.signedIn && next.subscription === "Explorer") {
    next.subscription = "Peer";
  }

  return next;
}

function buttonLabelSet(slug, state) {
  if (slug === "aegis-protocol-documentation-portal") {
    return {
      lead: "Move from docs into a real starter system without losing the path back to the live demo.",
      actions: [
        { id: "starter", label: "Queue Starter Kit", href: "/nexus/aegis-protocol-documentation-portal/" },
        { id: "demo", label: "Open Demo Surface", href: "/nexus/aegis-protocol-dashboard/" },
        { id: "upgrade", label: "View Full System", href: "/nexus/aegisalign-pricing-plans/" },
      ]
    };
  }

  if (slug === "aegis-protocol-dashboard") {
    return {
      lead: "Keep the demo live while showing the two next moves: clone the starter or unlock the full governed stack.",
      actions: [
        { id: "demo", label: "Refresh Demo Loop", href: "/nexus/aegis-protocol-dashboard/" },
        { id: "starter", label: "Claim Starter Kit", href: "/nexus/aegis-protocol-documentation-portal/" },
        { id: "upgrade", label: "Open Upgrade Path", href: "/nexus/aegisalign-pricing-plans/" },
      ]
    };
  }

  if (slug === "aegisalign-pricing-plans") {
    return {
      lead: "Choose how this Peer enters the EcoVerse.",
      actions: [
        { id: "upgrade", label: "Activate Subscriber", href: "/nexus/aegisalign-settings/" },
        { id: "demo", label: "Open Live Demo", href: "/nexus/aegis-protocol-dashboard/" },
        { id: "starter", label: "Queue Starter Kit", href: "/nexus/aegis-protocol-documentation-portal/" },
      ]
    };
  }

  if (slug === "aegis-peer-profile") {
    return {
      lead: "Move from identity into trusted settings, starter systems, or the subscriber workspace path.",
      actions: [
        { id: "auth", label: "Open Access Flow", href: "/nexus/login-aegisalign/" },
        { id: "starter", label: "Starter Systems", href: "/nexus/aegis-protocol-documentation-portal/" },
        { id: "upgrade", label: "Subscriber Path", href: "/nexus/aegisalign-pricing-plans/" },
      ]
    };
  }

  if (!state.signedIn && (slug === "login-aegisalign" || slug === "signup-aegisalign" || slug === "multi-factor-authentication")) {
    return {
      lead: "Bring the access flow, demo layer, and starter path together.",
      actions: [
        { id: "auth", label: "Continue Access", href: slug === "signup-aegisalign" ? "/nexus/multi-factor-authentication/" : "/nexus/login-aegisalign/" },
        { id: "demo", label: "Open Live Demo", href: "/nexus/aegis-protocol-dashboard/" },
        { id: "starter", label: "Review Starter Kit", href: "/nexus/aegis-protocol-documentation-portal/" },
      ]
    };
  }

  return {
    lead: "Offer a clean path into demos, starter systems, and subscriber upgrades.",
    actions: [
      { id: "demo", label: "Try Live Demo", href: "/nexus/aegis-protocol-dashboard/" },
      { id: "starter", label: "Download Starter", href: "/nexus/aegis-protocol-documentation-portal/" },
      { id: "upgrade", label: state.subscription === "Subscriber" ? "Open Subscriber Tools" : "Unlock Full System", href: state.subscription === "Subscriber" ? "/nexus/aegisalign-settings/" : "/nexus/aegisalign-pricing-plans/" },
    ]
  };
}

function renderSessionCard(node, state, slug) {
  const meta = PAGE_META[slug] || PAGE_META["aegisalign-landing-page"];
  const accessLabel = state.signedIn ? "Authenticated Peer" : "Public Visitor";
  const accessClass = state.signedIn ? "is-live" : "is-passive";
  node.innerHTML = `
    <div class="nexus-card-kicker">Peer Session</div>
    <div class="nexus-card-head">
      <strong>${state.peerLabel}</strong>
      <span class="nexus-status-pill ${accessClass}">${accessLabel}</span>
    </div>
    <div class="nexus-card-copy">${meta.detail}</div>
    <div class="nexus-profile-line">${state.signedIn ? "Profile unlocked for return visits and subscriber tools." : "Public mode is active until this Peer completes access."}</div>
    <div class="nexus-metric-row">
      <div><span>Tier</span><strong>${state.subscription}</strong></div>
      <div><span>Access</span><strong>${meta.focus}</strong></div>
    </div>
  `;
}

function renderActivityCard(node, state, slug) {
  const recent = state.recentRoutes
    .map((entry) => `<a href="${entry.href}" class="nexus-recent-link">${entry.title}</a>`)
    .join("");

  node.innerHTML = `
    <div class="nexus-card-kicker">Hub Activity</div>
    <div class="nexus-card-head">
      <strong>Current Surface</strong>
      <span class="nexus-mini-label">${titleFromSlug(slug)}</span>
    </div>
    <div class="nexus-card-copy">The Nexus now carries persistent platform context above each stitched page so Peers can stay oriented while exploring.</div>
    <div class="nexus-recent-list">${recent}</div>
  `;
}

function renderActionsCard(node, state, slug) {
  const set = buttonLabelSet(slug, state);
  node.innerHTML = `
    <div class="nexus-card-kicker">Launch Paths</div>
    <div class="nexus-card-head">
      <strong>EcoVerse Actions</strong>
      <span class="nexus-mini-label">${state.starterQueued ? "Starter queued" : "Ready"}</span>
    </div>
    <div class="nexus-card-copy">${set.lead}</div>
    <div class="nexus-action-row">
      ${set.actions.map((action) => `<button type="button" class="nexus-action-btn nexus-action-${action.id}" data-nexus-action="${action.id}" data-href="${action.href}">${action.label}</button>`).join("")}
    </div>
  `;
}

function renderHandoffCard(node, state, slug) {
  if (!node) return;
  const meta = HANDOFF_META[slug] || HANDOFF_META["aegisalign-landing-page"];
  const status = state.starterQueued
    ? "Starter kit interest is saved for this Peer."
    : state.subscription === "Subscriber"
      ? "Subscriber mode is active. Route this Peer into premium tools."
      : "No handoff is locked yet. Use this surface to guide the next step.";

  node.innerHTML = `
    <div class="nexus-handoff-copy">
      <div class="nexus-card-kicker">${meta.kicker}</div>
      <h2>${meta.title}</h2>
      <p>${meta.body}</p>
      <div class="nexus-handoff-status">${status}</div>
    </div>
    <div class="nexus-handoff-list">
      ${meta.bullets.map((item) => `<span class="nexus-handoff-chip">${item}</span>`).join("")}
    </div>
  `;
}

function renderStarterCatalog(node) {
  if (!node) return;
  node.innerHTML = `
    <div class="nexus-starter-head">
      <div>
        <div class="nexus-card-kicker">Starter Catalog</div>
        <h2>Begin listing real AEGIS starter systems from the docs surface.</h2>
        <p>The docs page can now act as the EcoVerse handoff into starter Git packages, setup guides, and subscriber expansion paths.</p>
      </div>
    </div>
    <div class="nexus-starter-grid">
      ${STARTER_CATALOG.map((starter) => `
        <article class="nexus-starter-card">
          <div class="nexus-starter-badge">${starter.badge}</div>
          <h3>${starter.title}</h3>
          <p>${starter.body}</p>
          <div class="nexus-starter-points">
            ${starter.bullets.map((item) => `<span class="nexus-starter-point">${item}</span>`).join("")}
          </div>
          <div class="nexus-action-row">
            ${starter.actions.map((action) => `<button type="button" class="nexus-action-btn nexus-action-${action.id}" data-nexus-action="${action.id}" data-href="${action.href}">${action.label}</button>`).join("")}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function bindActionButtons(deck, state) {
  const buttons = Array.from(deck.querySelectorAll("[data-nexus-action]"));
  for (const button of buttons) {
    button.addEventListener("click", () => {
      const action = button.dataset.nexusAction;
      const href = button.dataset.href;
      const next = { ...state };
      if (action === "starter") next.starterQueued = true;
      if (action === "upgrade") {
        next.upgradeInterest = true;
        if (window.location.pathname.includes("/aegisalign-pricing-plans/")) {
          next.subscription = "Subscriber";
          next.signedIn = true;
          next.peerLabel = next.peerLabel === "Guest Peer" ? "Subscriber Peer" : next.peerLabel;
        }
      }
      if (action === "demo" && next.peerLabel === "Guest Peer") next.peerLabel = "Demo Peer";
      saveState(next);
      window.location.href = href;
    });
  }
}

function initNexusState() {
  if (!document.body.classList.contains("domain-nexus")) return;
  const deck = document.querySelector("[data-nexus-command-deck]");
  if (!deck) return;

  const slug = currentSlug(deck);
  const state = deriveStateForPage(safeReadState(), slug);
  saveState(state);

  renderSessionCard(deck.querySelector("[data-nexus-session-card]"), state, slug);
  renderActivityCard(deck.querySelector("[data-nexus-activity-card]"), state, slug);
  renderActionsCard(deck.querySelector("[data-nexus-actions-card]"), state, slug);
  renderHandoffCard(deck.querySelector("[data-nexus-handoff-card]"), state, slug);
  if (slug === "aegis-protocol-documentation-portal") {
    renderStarterCatalog(deck.querySelector("[data-nexus-starter-catalog]"));
  }
  bindActionButtons(deck, state);
}

initNexusState();
