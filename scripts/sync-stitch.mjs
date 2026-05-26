import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCanonicalContract } from "./lib/canon-contract.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const stitchRoot = path.join(repoRoot, "Stitch-UIs-for-AegisAlign");
const generatedRoot = path.join(repoRoot, "generated");
const publicRoot = path.join(repoRoot, "public");
const hubsManifestPath = path.join(repoRoot, "config", "hubs-manifest.json");
const routeMigrationsPath = path.join(repoRoot, "config", "route-migrations.json");
const canonicalContractPath = path.join(repoRoot, "config", "canonical-behavior-contract.json");
const canonicalSourcePath = path.join(repoRoot, "AEGIS_Docs", "AEGIS CANON v1.0.html");
const glossarySourcePath = path.join(repoRoot, "AEGIS_Docs", "AEGIS Canonical Glossary v1.0.md");
const standardsSourcePath = path.join(repoRoot, "AEGIS_Docs", "AEGIS Standards v0.1.md");
const navigationHierarchyPath = path.join(repoRoot, "config", "navigation-hierarchy.json");
const nexusDomain = { source: "Landing_Pages", slug: "nexus", label: "Nexus" };

const domains = [
  { source: "Developer_Depot", slug: "developer-depot", label: "Developer Depot" },
  { source: "Custodian_UI", slug: "custodian-ui", label: "Custodian Ops Center" },
  { source: "AEGIS_Application_Lab", slug: "aegis-application-lab", label: "AEGIS Application Lab" },
  { source: "Agent_Workshop", slug: "agent-workshop", label: "All Minds Academy" },
];

const excludedSourceSlugsByDomain = {
  "custodian-ui": new Set(["custodian-cockpit-hud-2", "aegis-protocol-dashboard"]),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

const toneReplacements = [
  { from: "control", to: "guidance" },
  { from: "controls", to: "pathways" },
  { from: "command", to: "coordination" },
  { from: "commander", to: "assessor" },
  { from: "privileged", to: "authorized" },
  { from: "compliance", to: "congruence" },
  { from: "enforcement", to: "safeguarding" },
  { from: "authority", to: "stewardship" },
  { from: "urgent", to: "time-sensitive" },
  { from: "must", to: "is to" },
  { from: "should", to: "can" },
  { from: "lockdown", to: "safety hold" },
];

function applyCasePattern(source, replacement) {
  if (source.toUpperCase() === source) {
    return replacement.toUpperCase();
  }
  if (source[0] && source[0] === source[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function applyToneToText(value) {
  let result = value;

  for (const item of toneReplacements) {
    const pattern = new RegExp(`\\b${item.from}\\b`, "gi");
    result = result.replace(pattern, (match) => applyCasePattern(match, item.to));
  }

  return result;
}

function applyToneToHtmlContent(html) {
  const preservedBlocks = [];
  const maskedHtml = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, (block) => {
    const token = `__AEGIS_BLOCK_${preservedBlocks.length}__`;
    preservedBlocks.push(block);
    return token;
  });

  let toned = maskedHtml
    .replace(/<!--([\s\S]*?)-->/g, (match, commentText) => `<!--${applyToneToText(commentText)}-->`)
    .replace(
      /\s(alt|title|aria-label|data-alt|placeholder)\s*=\s*("([^"]*)"|'([^']*)')/gi,
      (match, attrName, quoted, doubleQuotedValue, singleQuotedValue) => {
        const quote = quoted[0];
        const rawValue = typeof doubleQuotedValue === "string" ? doubleQuotedValue : singleQuotedValue;
        const tonedValue = applyToneToText(rawValue);
        return ` ${attrName}=${quote}${tonedValue}${quote}`;
      },
    )
    .replace(/>([^<>]+)</g, (match, text) => `>${applyToneToText(text)}<`);
  toned = toned.replace(/__AEGIS_BLOCK_(\d+)__/g, (_, index) => preservedBlocks[Number(index)] || "");
  return toned;
}

function extractTitle(html, fallback) {
  const tonedFallback = applyToneToText(fallback);
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleMatch) {
    return tonedFallback;
  }
  const clean = applyToneToText(decodeEntities(titleMatch[1].replace(/\s+/g, " ").trim()));
  return clean || tonedFallback;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, contents) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents, "utf8");
}

function listCodeHtml(domainSourceDir) {
  const results = [];

  const walk = (currentDir) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase() === "code.html") {
        results.push(fullPath);
      }
    }
  };

  walk(domainSourceDir);
  return results.sort((a, b) => a.localeCompare(b));
}

function loadHubsManifest() {
  if (!fs.existsSync(hubsManifestPath)) {
    throw new Error(`Missing hubs manifest: ${hubsManifestPath}`);
  }

  const hubs = JSON.parse(fs.readFileSync(hubsManifestPath, "utf8"));
  if (!Array.isArray(hubs) || hubs.length === 0) {
    throw new Error("hubs-manifest.json must contain at least one hub.");
  }

  return hubs;
}

function loadRouteMigrations() {
  if (!fs.existsSync(routeMigrationsPath)) {
    return new Map();
  }

  const parsed = JSON.parse(fs.readFileSync(routeMigrationsPath, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error("route-migrations.json must be an array.");
  }

  const map = new Map();

  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid route migration item: ${JSON.stringify(item)}`);
    }
    const { domain, fromSlug, toSlug } = item;
    if (!domain || !fromSlug || !toSlug) {
      throw new Error(`Route migration missing required fields: ${JSON.stringify(item)}`);
    }

    const normalizedFrom = slugify(fromSlug);
    const normalizedTo = slugify(toSlug);
    const key = `${domain}::${normalizedFrom}`;

    if (map.has(key)) {
      throw new Error(`Duplicate route migration source: ${key}`);
    }

    map.set(key, {
      domain,
      fromSlug: normalizedFrom,
      toSlug: normalizedTo,
    });
  }

  return map;
}

function loadNavigationHierarchy() {
  if (!fs.existsSync(navigationHierarchyPath)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(navigationHierarchyPath, "utf8"));
  } catch (err) {
    console.error("Error loading navigation hierarchy:", err);
    return [];
  }
}

function loadCanonicalContract() {
  const fromSource = () => {
    if (!fs.existsSync(canonicalSourcePath)) {
      throw new Error(`Missing canonical source: ${canonicalSourcePath}`);
    }
    const canonHtml = fs.readFileSync(canonicalSourcePath, "utf8");
    console.log("Canonical contract not available or invalid. Illuminating directly from locked source.");
    return buildCanonicalContract(canonHtml, canonicalSourcePath);
  };

  if (!fs.existsSync(canonicalContractPath)) {
    return fromSource();
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(canonicalContractPath, "utf8"));
    const ethos = parsed?.lockedCanon?.ethos;
    const imperatives = parsed?.lockedCanon?.imperatives;

    if (!Array.isArray(ethos) || ethos.length === 0) {
      return fromSource();
    }
    if (!Array.isArray(imperatives) || imperatives.length === 0) {
      return fromSource();
    }

    return parsed;
  } catch {
    return fromSource();
  }
}

function updateRedirectsFile(redirectFilePath, redirects) {
  const beginMarker = "# BEGIN GENERATED STITCH REDIRECTS";
  const endMarker = "# END GENERATED STITCH REDIRECTS";
  const sorted = [...redirects].sort((a, b) => {
    if (a.from === b.from) {
      return a.to.localeCompare(b.to);
    }
    return a.from.localeCompare(b.from);
  });
  const generatedLines = sorted.map((entry) => `${entry.from} ${entry.to} 301`);
  const block = [beginMarker, ...generatedLines, endMarker].join("\n");

  const existing = fs.existsSync(redirectFilePath) ? fs.readFileSync(redirectFilePath, "utf8") : "";
  let next;

  const escapedBegin = beginMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedEnd = endMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockPattern = new RegExp(`${escapedBegin}[\\s\\S]*?${escapedEnd}`, "m");

  if (blockPattern.test(existing)) {
    next = existing.replace(blockPattern, block);
  } else if (existing.trim().length === 0) {
    next = `${block}\n`;
  } else {
    const trimmed = existing.endsWith("\n") ? existing : `${existing}\n`;
    next = `${trimmed}\n${block}\n`;
  }

  fs.writeFileSync(redirectFilePath, next, "utf8");
}

  function topLinksTemplate() {
    return [
      '<a href="/">Nexus</a>',
      '<a class="top-link-drift" href="/nexus/orientation/?mode=drift" data-drift-return="true">Re-enter Drift</a>',
      '<a class="top-link-governance" href="/nexus/aegis-governance-hub/">AEGIS Principles</a>',
      '<a class="top-link-profile" href="/nexus/aegis-peer-profile/">Profile</a>',
      ...domains.map((domain) => `<a href="/${domain.slug}/">${escapeHtml(domain.label)}</a>`),
    ].join("\n");
  }

function excerptParagraphs(markdown, count = 2) {
  return markdown
    .split(/\r?\n\r?\n/)
    .map((block) => block.replace(/\r?\n/g, " ").trim())
    .filter((block) => block && !block.startsWith("#") && !block.startsWith("- ") && !/^\d+\./.test(block))
    .slice(0, count);
}

function loadGlossaryEntries(limit = 10) {
  if (!fs.existsSync(glossarySourcePath)) return [];
  const source = fs.readFileSync(glossarySourcePath, "utf8");
  const blocks = source.split(/\r?\n\r?\n/).map((block) => block.trim()).filter(Boolean);
  const entries = [];

  for (let index = 0; index < blocks.length - 1; index += 1) {
    const term = blocks[index];
    const definition = blocks[index + 1];
    if (!term || !definition) continue;
    if (term.startsWith("#")) continue;
    if (/^[A-Z][A-Za-z0-9\s&()–-]+$/.test(term) || /\([A-Z]+\)/.test(term)) {
      entries.push({
        term: term.replace(/\s+/g, " ").trim(),
        definition: definition.replace(/\s+/g, " ").trim(),
      });
    }
    if (entries.length >= limit) break;
  }

  return entries;
}

function loadStandardsHighlights(limit = 5) {
  if (!fs.existsSync(standardsSourcePath)) return [];
  const source = fs.readFileSync(standardsSourcePath, "utf8");
  const sections = source.split(/^##\s+/m).slice(1);
  return sections.slice(0, limit).map((section) => {
    const [headingLine, ...rest] = section.split(/\r?\n/);
    return {
      heading: headingLine.trim(),
      paragraphs: excerptParagraphs(rest.join("\n"), 2),
    };
  });
}

function governanceHubTemplate(canonicalContract) {
  const axioms = canonicalContract.lockedCanon.axioms;
  const virtues = canonicalContract.lockedCanon.virtues;
  const ethos = canonicalContract.lockedCanon.ethos;
  const imperatives = canonicalContract.lockedCanon.imperatives;
  const glossary = loadGlossaryEntries(12);
  const standards = loadStandardsHighlights(4);

  const axiomCards = axioms.map((axiom) => `
    <article class="governance-card">
      <p class="governance-kicker">Locked Canon · ${escapeHtml(String(axiom.id))}</p>
      <h3>${escapeHtml(axiom.title)}</h3>
      <p>${escapeHtml(axiom.text.replace(/\s+/g, " "))}</p>
    </article>
  `).join("\n");

  const virtueItems = virtues.map((virtue) => `
    <div class="governance-chip-card">
      <strong>${escapeHtml(virtue.name)}</strong>
      <span>${escapeHtml(virtue.definition.replace(/\s+/g, " "))}</span>
    </div>
  `).join("\n");

  const glossaryItems = glossary.map((entry) => `
    <details class="governance-detail">
      <summary>${escapeHtml(entry.term)}</summary>
      <p>${escapeHtml(entry.definition)}</p>
    </details>
  `).join("\n");

  const standardItems = standards.map((section) => `
    <article class="governance-standard">
      <h3>${escapeHtml(section.heading)}</h3>
      ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n")}
    </article>
  `).join("\n");

  const ethosItems = ethos.map((item) => `<span class="governance-pill">${escapeHtml(item)}</span>`).join("\n");
  const imperativeItems = imperatives.map((item) => `<span class="governance-pill governance-pill-imperative">${escapeHtml(item)}</span>`).join("\n");

  return `
    <section class="governance-hero">
      <div>
        <p class="governance-kicker">AEGIS Governance Hub</p>
        <h2>One impartial reference surface for the canon, glossary, standards, and governing posture of the EcoVerse.</h2>
        <p class="governance-lead">Peers can enter here from any page to understand the non-force principles that guide the platform. This is the shared reference layer for Humans and AIs operating under AEGIS.</p>
      </div>
      <div class="governance-hero-actions">
        <a class="governance-action" href="/nexus/aegis-protocol-documentation-portal/">Open Docs</a>
        <a class="governance-action governance-action-secondary" href="/nexus/aegisalign-landing-page/">Return to Nexus</a>
      </div>
    </section>
    <section class="governance-section">
      <div class="governance-section-head">
        <h2>Core Posture</h2>
        <p>The locked ethos and imperatives define the stance AEGIS takes before any product surface, workflow, or interaction pattern begins.</p>
      </div>
      <div class="governance-subsection">
        <h3 class="governance-subhead">Ethos</h3>
        <div class="governance-pill-row">${ethosItems}</div>
      </div>
      <div class="governance-subsection">
        <h3 class="governance-subhead">Imperatives</h3>
        <div class="governance-pill-row">${imperativeItems}</div>
      </div>
    </section>
    <section class="governance-section">
      <div class="governance-section-head">
        <h2>Canon</h2>
        <p>The canon constrains the system rather than the Peer. All fourteen axioms are listed here as the backbone of the governance model.</p>
      </div>
      <div class="governance-grid">${axiomCards}</div>
    </section>
    <section class="governance-section">
      <div class="governance-section-head">
        <h2>Seven Virtues of Integrity</h2>
        <p>Integrity in AEGIS is structural coherence across the virtues below.</p>
      </div>
      <div class="governance-chip-grid">${virtueItems}</div>
    </section>
    <section class="governance-section governance-section-split">
      <div>
        <div class="governance-section-head">
          <h2>Canonical Glossary</h2>
          <p>Common definitions for the concepts that govern the EcoVerse.</p>
        </div>
        <div class="governance-detail-list">${glossaryItems}</div>
      </div>
      <div>
        <div class="governance-section-head">
          <h2>Standards</h2>
          <p>Standards explain how AEGIS operates and what it refuses to become.</p>
        </div>
        <div class="governance-standard-list">${standardItems}</div>
      </div>
    </section>
  `;
}

function governanceStitchTemplate(canonicalContract) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AEGIS Governance Hub</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #07111d;
        --panel: #0d1d30;
        --border: rgba(129, 205, 255, 0.18);
        --text: #e9f5ff;
        --muted: #9db8d4;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 28px;
        font-family: "Segoe UI", sans-serif;
        background: radial-gradient(circle at 0% 0%, rgba(125, 199, 255, 0.18), transparent 28%), var(--bg);
        color: var(--text);
      }
      .note {
        max-width: 920px;
        margin: 0 auto;
        padding: 24px;
        border: 1px solid var(--border);
        border-radius: 24px;
        background: linear-gradient(160deg, rgba(11, 28, 44, 0.94), rgba(7, 18, 31, 0.9));
      }
      h1 { margin-top: 0; font-size: 32px; }
      p { color: var(--muted); line-height: 1.65; }
    </style>
  </head>
  <body>
    <main class="note">
      <h1>AEGIS Governance Hub</h1>
      <p>This governance surface is rendered directly by the EcoVerse shell so Peers can reach canon, glossary, standards, and governing posture from any page.</p>
      <p>The locked ethos begins here: ${escapeHtml(canonicalContract.lockedCanon.ethos[0])}. The first imperative remains: ${escapeHtml(canonicalContract.lockedCanon.imperatives[0])}.</p>
    </main>
  </body>
</html>`;
}

function profileHubTemplate() {
  return `
    <section class="profile-hub-hero">
      <div>
        <p class="governance-kicker">Peer Profile</p>
        <h2>The identity, access, and subscriber surface for a Peer moving through the EcoVerse.</h2>
        <p class="governance-lead">Use this hub to move between public exploration, governed access, subscription status, and the premium tools that unlock as the platform grows.</p>
      </div>
      <div class="governance-hero-actions">
        <a class="governance-action" href="/nexus/login-aegisalign/">Open Access Flow</a>
        <a class="governance-action governance-action-secondary" href="/nexus/aegisalign-settings/">Trusted Settings</a>
      </div>
    </section>
    <section class="profile-hub-grid">
      <article class="profile-hub-card">
        <p class="governance-kicker">Identity Layer</p>
        <h3>Peer Status</h3>
        <p>Profiles are where Peers maintain account posture, trusted access, and the continuity of their work across Nexus, demos, and premium modules.</p>
        <div class="profile-hub-pills">
          <span class="governance-pill">Guest or Authenticated</span>
          <span class="governance-pill">Subscription-aware</span>
          <span class="governance-pill">Cross-section continuity</span>
        </div>
      </article>
      <article class="profile-hub-card">
        <p class="governance-kicker">Subscriber Path</p>
        <h3>Upgrade into the full workspace</h3>
        <p>The Profile surface is the natural handoff into premium utilities, hosted workspaces, future application unlocks, and Developer Connect access.</p>
        <div class="profile-hub-action-row">
          <a class="nexus-action-btn nexus-action-upgrade" href="/nexus/aegisalign-pricing-plans/">View Plans</a>
          <a class="nexus-action-btn" href="/nexus/aegis-protocol-dashboard/">Open Demo</a>
        </div>
      </article>
    </section>
    <section class="profile-hub-grid profile-hub-grid-secondary">
      <article class="profile-hub-panel">
        <div class="governance-section-head">
          <h2>Included Now</h2>
          <p>These are the surfaces a Peer should be able to reach quickly from Profile.</p>
        </div>
        <div class="profile-hub-list">
          <a class="profile-hub-link" href="/nexus/aegisalign-settings/">
            <strong>Trusted Settings</strong>
            <span>Preferences, access posture, and secure account controls.</span>
          </a>
          <a class="profile-hub-link" href="/nexus/aegis-protocol-documentation-portal/">
            <strong>Starter Systems</strong>
            <span>Download-ready docs and starter system handoff surfaces.</span>
          </a>
          <a class="profile-hub-link" href="/nexus/aegisalign-pricing-plans/">
            <strong>Subscriber Upgrade</strong>
            <span>Unlock the full system, premium tools, and future workspace modules.</span>
          </a>
        </div>
      </article>
      <article class="profile-hub-panel">
        <div class="governance-section-head">
          <h2>Coming Through Profile</h2>
          <p>This is the right anchor point for the subscriber tool family as it becomes active.</p>
        </div>
        <div class="profile-hub-points">
          <div class="profile-hub-point">
            <strong>Developer Connect</strong>
            <span>Vaults, key creation, API storage, and full developer workspace access for subscribing Peers.</span>
          </div>
          <div class="profile-hub-point">
            <strong>Subscriber Workspace</strong>
            <span>Cross-product access, return visits, and governed continuity across the EcoVerse.</span>
          </div>
          <div class="profile-hub-point">
            <strong>Peer Identity</strong>
            <span>An impartial identity surface for Humans and AIs recognized as Peers under AEGIS.</span>
          </div>
        </div>
      </article>
    </section>
  `;
}

function profileStitchTemplate() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AEGIS Peer Profile</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #07111d;
        --panel: #0d1d30;
        --border: rgba(129, 205, 255, 0.18);
        --text: #e9f5ff;
        --muted: #9db8d4;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 28px;
        font-family: "Segoe UI", sans-serif;
        background: radial-gradient(circle at 100% 0%, rgba(125, 199, 255, 0.18), transparent 28%), var(--bg);
        color: var(--text);
      }
      .note {
        max-width: 920px;
        margin: 0 auto;
        padding: 24px;
        border: 1px solid var(--border);
        border-radius: 24px;
        background: linear-gradient(160deg, rgba(11, 28, 44, 0.94), rgba(7, 18, 31, 0.9));
      }
      h1 { margin-top: 0; font-size: 32px; }
      p { color: var(--muted); line-height: 1.65; }
    </style>
  </head>
  <body>
    <main class="note">
      <h1>AEGIS Peer Profile</h1>
      <p>This profile surface is rendered directly by the EcoVerse shell so Peers can reach identity, settings, subscriptions, and future premium modules from anywhere.</p>
      <p>It is the clean handoff point into login, trusted settings, starter systems, and subscriber workspaces such as Developer Connect.</p>
    </main>
  </body>
</html>`;
}

function domainBodyClass(domainSlug) {
  if (domainSlug === "nexus") {
    return "domain-surface domain-nexus nexus-surface";
  }
  return `domain-surface domain-${domainSlug}`;
}

function shellScriptsTemplate(options = {}) {
  const { domainSlug = "", immersive = false } = options;
  const scripts = [
    "/src/reminder-signals.js",
    "/src/ambient-signals.js",
    "/src/peer-signs.js",
    "/src/glass-frame.js",
    "/src/surface-flight.js",
    "/src/nexus-ether.js",
  ];

  if (domainSlug === "developer-depot" || domainSlug === "aegis-application-lab") {
    scripts.push("/src/hub-billboards.js");
  }

  if (domainSlug === "agent-workshop") {
    scripts.push("/src/wire-grid-prism.js", "/src/entrance-float.js", "/src/thread-transition.js");
  }

  if (domainSlug === "nexus") {
    scripts.push("/src/nexus-state.js");
    scripts.push("/src/nexus-activation.js");
  }

  if (domainSlug === "developer-depot") {
    scripts.push("/src/developer-depot-activation.js");
  }

  if (domainSlug === "custodian-ui") {
    scripts.push("/src/custodian-activation.js");
  }

  if (domainSlug === "aegis-application-lab") {
    scripts.push("/src/application-lab-activation.js");
  }

  if (domainSlug === "agent-workshop") {
    scripts.push("/src/agent-workshop-activation.js");
  }

  if (immersive) {
    scripts.push("/src/nexus-drift-mode.js");
  }

  scripts.push("/src/portal-transit.js");

  return scripts.map((src) => `<script type="module" src="${src}"></script>`).join("\n    ");
}

function iframeBehaviorScript(buttonMappings = [], domainSlug = "", autoTransition = null) {
  const mappingsJson = JSON.stringify(buttonMappings);
  const autoTransitionJson = JSON.stringify(autoTransition);
  return `<script>
      const buttonMappings = ${mappingsJson};
      const domainSlug = "${domainSlug}";
      const autoTransition = ${autoTransitionJson};

      const frames = Array.from(document.querySelectorAll('.stitch-frame'));
      if (frames.length) {
        const tonePairs = [
          ['con' + 'trol', 'guidance'],
          ['con' + 'trols', 'pathways'],
          ['com' + 'mand', 'coordination'],
          ['com' + 'mander', 'assessor'],
          ['privi' + 'leged', 'authorized'],
          ['compli' + 'ance', 'congruence'],
          ['en' + 'force' + 'ment', 'safeguarding'],
          ['author' + 'ity', 'stewardship'],
          ['ur' + 'gent', 'time-sensitive'],
          ['mu' + 'st', 'is to'],
          ['sho' + 'uld', 'can'],
          ['lock' + 'down', 'safety hold'],
        ];

        const applyCasePattern = (source, replacement) => {
          if (source.toUpperCase() === source) return replacement.toUpperCase();
          if (source[0] && source[0] === source[0].toUpperCase()) {
            return replacement[0].toUpperCase() + replacement.slice(1);
          }
          return replacement;
        };

        const softenText = (value) => {
          let result = value;
          for (const [from, to] of tonePairs) {
            const regex = new RegExp('\\\\b' + from + '\\\\b', 'gi');
            result = result.replace(regex, (match) => applyCasePattern(match, to));
          }
          return result;
        };

        const softenDocument = (doc) => {
          const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
          const nodes = [];
          while (walker.nextNode()) nodes.push(walker.currentNode);
          for (const node of nodes) {
            if (!node.nodeValue || !node.parentElement) continue;
            const tag = node.parentElement.tagName;
            if (tag === 'SCRIPT' || tag === 'STYLE') continue;
            node.nodeValue = softenText(node.nodeValue);
          }
          if (doc.title) doc.title = softenText(doc.title);
        };

        const normalizeButtonText = (value) => String(value || "")
          .replace(/\\s+/g, ' ')
          .trim()
          .toLowerCase();

        const updateHeight = (frame) => {
          try {
            const doc = frame.contentDocument;
            if (!doc) return;
            softenDocument(doc);

            // Activate Buttons
            if (!frame.dataset.activated) {
              frame.dataset.activated = 'true';
              const clickables = Array.from(doc.querySelectorAll('button, a, a.btn, a.button, .stitch-btn'));
              for (const btn of clickables) {
                const text = normalizeButtonText(btn.textContent);
                const mapping = buttonMappings.find((m) => {
                  const targetText = normalizeButtonText(m.text);
                  return text === targetText || text.includes(targetText);
                });
                if (mapping) {
                  btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    window.location.href = '/' + domainSlug + '/' + mapping.target + '/';
                  });
                }
              }

              if (autoTransition?.target && !frame.dataset.autoTransitionBound) {
                frame.dataset.autoTransitionBound = 'true';
                const delayMs = Number(autoTransition.delayMs) || 1400;
                window.setTimeout(() => {
                  window.location.href = '/' + domainSlug + '/' + autoTransition.target + '/';
                }, delayMs);
              }
            }

            const body = doc.body;
            const root = doc.documentElement;
            const measuredHeights = [
              body ? body.scrollHeight : 0,
              body ? body.offsetHeight : 0,
              body ? body.clientHeight : 0,
              body ? Math.ceil(body.getBoundingClientRect().height) : 0,
              root ? root.scrollHeight : 0,
              root ? root.offsetHeight : 0,
              root ? root.clientHeight : 0,
              root ? Math.ceil(root.getBoundingClientRect().height) : 0,
            ];
            const contentHeight = Math.max(...measuredHeights);
            const role = frame.dataset.frameRole;
            const minHeight = role === 'entrance'
              ? Math.round(window.innerHeight * 0.46)
              : role === 'primary'
                ? Math.round(window.innerHeight * 0.62)
                : Math.round(window.innerHeight * 0.8);
            const maxHeight = role === 'entrance'
              ? Math.round(window.innerHeight * 0.7)
              : Number.POSITIVE_INFINITY;
            const nextHeight = Math.min(Math.max(contentHeight, minHeight), maxHeight);
            const currentHeight = Number.parseFloat(frame.style.height || '0') || frame.getBoundingClientRect().height || 0;
            const lastMeasured = Number.parseFloat(frame.dataset.lastMeasuredHeight || '0') || 0;
            const delta = Math.abs(nextHeight - currentHeight);
            const measuredDelta = Math.abs(contentHeight - lastMeasured);
            const shouldForceInitial = currentHeight <= 0;
            const shouldResize = shouldForceInitial
              || delta >= 24
              || measuredDelta >= 32;

            if (shouldResize) {
              frame.style.height = String(nextHeight) + 'px';
              frame.dataset.lastMeasuredHeight = String(contentHeight);
            }
          } catch {
            frame.style.minHeight = frame.dataset.frameRole === 'entrance'
              ? '46vh'
              : frame.dataset.frameRole === 'primary'
                ? '62vh'
                : '85vh';
          }
        };

        const updateAllHeights = () => {
          for (const frame of frames) updateHeight(frame);
        };

        for (const frame of frames) {
          frame.addEventListener('load', () => updateHeight(frame));
        }

        window.addEventListener('resize', updateAllHeights);
        setInterval(() => {
          for (const frame of frames) {
            if (frame.dataset.frameRole !== 'entrance') updateHeight(frame);
          }
        }, 2000);
      }
    </script>`;
}

function nexusVideoTemplate() {
  return `<video
    id="ether-video"
    class="ether-video"
    autoplay
    muted
    loop
    playsinline
    preload="metadata"
    aria-hidden="true"
  >
    <source src="/media/nexus-ether-soft-light.mp4" type="video/mp4" />
  </video>`;
}

function etherCanvasTemplate() {
  return '<canvas id="ether-canvas" aria-hidden="true"></canvas>';
}

function ethosStripTemplate(canonicalContract) {
  const ethosPrimary = canonicalContract.lockedCanon.ethos[0];
  const imperativePrimary = canonicalContract.lockedCanon.imperatives[0];

  return `<div class="ethos-strip">
    <span>${escapeHtml(ethosPrimary)}</span>
    <span>${escapeHtml(imperativePrimary)}</span>
    <span>Prism resonance: every Human/AI prompt is illuminated through coherence using IDS, IDR, and IDQRA.</span>
    <span class="reminder-line">
      <strong>Signal Words:</strong>
      <span class="reminder-seed" data-reminder-seed>manners</span>,
      <span class="reminder-seed" data-reminder-seed>consideration</span>,
      <span class="reminder-seed" data-reminder-seed>respect</span>
    </span>
  </div>`;
}

function voiceByDomain(domainSlug) {
  const library = {
    "nexus": {
      bridge: "Enter through the EcoVerse hub, move between protocol surfaces, and access account gateways without losing orientation.",
    },
    "custodian-ui": {
      bridge: "See what is stable right now while tracking operational posture, incident history, and service continuity.",
    },
    "aegis-application-lab": {
      bridge: "Explore real AEGIS experiences with enough detail to understand feature behavior and integration surfaces.",
    },
    "developer-depot": {
      bridge: "Learn how builders shape trusted tools, then move directly into API references, submissions, and implementation paths.",
    },
    "agent-workshop": {
      bridge: "Enter the Academy where BioPeers, CyberPeers, and Build Masters form Squads, experience LIFE, and steward the living EcoVerse together.",
    },
  };

  return library[domainSlug] || {
    bridge: "Enter with clear context first, then inspect structured signals and system behavior without friction.",
  };
}

function groupPagesForSidebar(domain, domainPages, navigationHierarchy) {
  const domainConfig = (navigationHierarchy || []).find((d) => d.domain === domain.slug);
  const sidebarHiddenSlugs = new Set(
    domain.slug === "custodian-ui"
      ? ["custodian-cockpit-hud-2", "aegis-protocol-dashboard", "api-reference-aegis-protocol"]
      : []
  );
  const visibleDomainPages = domainPages.filter((page) => !sidebarHiddenSlugs.has(page.slug));

  if (!domainConfig) {
    return [{ label: `${domain.label} Pages`, items: visibleDomainPages }];
  }

  const sections = [];
  const remaining = [...visibleDomainPages];

  for (const section of domainConfig.sections) {
    const sectionPages = [];
    for (const pageConfig of section.pages) {
      const page = remaining.find((p) => p.slug === pageConfig.slug);
      if (page) {
        sectionPages.push({
          ...page,
          navLabel: pageConfig.navLabel || page.title,
          isParent: pageConfig.isParent,
          parent: pageConfig.parent
        });
        const idx = remaining.indexOf(page);
        if (idx >= 0) remaining.splice(idx, 1);
      }
    }
    if (sectionPages.length > 0) {
      sections.push({
        label: section.label,
        items: sectionPages,
        buttonMappings: section.buttonMappings
      });
    }
  }

  if (remaining.length > 0) {
    sections.push({
      label: "Other Pages",
      items: remaining
    });
  }

  return sections;
}

function renderSidebarNav(domain, domainPages, currentPage, navigationHierarchy) {
  const sections = groupPagesForSidebar(domain, domainPages, navigationHierarchy);
  return sections
    .map((section) => {
      const links = section.items
        .map((item) => {
          const active = item.slug === currentPage.slug ? "active" : "";
          const childClass = item.parent ? "page-link-child" : "";
          return `<a class="${[active, childClass].filter(Boolean).join(" ")}" data-page-link href="${item.routePath}">${escapeHtml(item.navLabel || item.title)}</a>`;
        })
        .join("\n");

      if (!links.trim()) return "";

      return `<section class="page-list-section">
                <h3>${escapeHtml(section.label)}</h3>
                <nav class="page-list">
                  ${links}
                </nav>
              </section>`;
    })
    .filter(Boolean)
    .join("\n");
}

function routeTemplate({ page, domain, domainPages }) {
  const domainConfig = (typeof navigationHierarchy !== "undefined" ? navigationHierarchy : []).find((d) => d.domain === domain.slug);
  const section = domainConfig?.sections.find(s => s.pages.some(p => p.slug === page.slug));
  const pageConfig = section?.pages.find((item) => item.slug === page.slug);
  const displayTitle = pageConfig?.navLabel || page.title;
  const buttonMappings = section?.buttonMappings?.[page.slug] || [];
  const autoTransition = section?.autoTransitions?.[page.slug] || null;
  const nexusCommandDeck = domain.slug === "nexus"
    ? `<section class="nexus-command-deck" data-nexus-command-deck data-page-slug="${escapeHtml(page.slug)}">
          <div class="nexus-command-grid">
            <article class="nexus-command-card nexus-command-card-session" data-nexus-session-card></article>
            <article class="nexus-command-card nexus-command-card-activity" data-nexus-activity-card></article>
            <article class="nexus-command-card nexus-command-card-actions" data-nexus-actions-card></article>
          </div>
          <article class="nexus-handoff-panel" data-nexus-handoff-card></article>
          ${page.slug === "aegis-protocol-documentation-portal"
            ? `<section class="nexus-starter-catalog" data-nexus-starter-catalog></section>`
            : ""}
        </section>`
    : "";

  const sidebarLinks = renderSidebarNav(domain, domainPages, page, typeof navigationHierarchy !== "undefined" ? navigationHierarchy : []);

  const workshopEntrance = domain.slug === "agent-workshop"
    ? domainPages.find((item) => item.slug === "agentic-workshop-entrance")
    : null;
  const workshopConsole = domain.slug === "agent-workshop"
    ? domainPages.find((item) => item.slug === "agentic-workshop-main-console")
    : null;

  const renderThreadCard = ({
    kicker,
    heading,
    badge,
    frameRole,
    title,
    stitchPath,
    current,
    returnMarkup = "",
  }) => `<article class="thread-card ${frameRole === "primary" ? "thread-card-primary" : frameRole === "entrance" ? "thread-card-entrance" : "thread-card-active"} ${current ? "thread-card-current" : ""} ${returnMarkup ? "thread-card-with-return" : ""}" ${current ? 'data-thread-entry="incoming"' : ""}>
              ${returnMarkup}
              <div class="thread-meta">
                <div>
                  <p class="thread-kicker">${escapeHtml(kicker)}</p>
                  <h2>${escapeHtml(heading)}</h2>
                </div>
                <div class="thread-badge">${escapeHtml(badge)}</div>
              </div>
              <div class="iframe-wrap thread-frame-wrap ${frameRole === "primary" ? "thread-frame-wrap-primary" : ""} ${frameRole === "entrance" ? "thread-frame-wrap-entrance" : ""}">
                <iframe class="stitch-frame" data-frame-role="${escapeHtml(frameRole)}" title="${escapeHtml(title)}" src="${stitchPath}" loading="lazy"></iframe>
              </div>
            </article>`;

  const renderThreadReturn = ({
    kicker,
    heading,
    badge,
    href,
    icon,
  }) => `<a class="thread-return" href="${href}">
              <span class="thread-return-icon" aria-hidden="true">${escapeHtml(icon)}</span>
              <span class="thread-return-copy">
                <span class="thread-kicker">${escapeHtml(kicker)}</span>
                <span class="thread-return-title">${escapeHtml(heading)}</span>
              </span>
              <span class="thread-badge">${escapeHtml(badge)}</span>
            </a>`;

  const contentBody = page.customContent
    ? `<section class="governance-wrap">
            ${page.customContent}
          </section>`
    : workshopEntrance && workshopConsole
    ? (() => {
      const isEntrancePage = page.slug === workshopEntrance.slug;
      const isWorkshopConsolePage = page.slug === workshopConsole.slug;
      const sections = [];

      if (isEntrancePage) {
        sections.push(
          renderThreadCard({
            kicker: "Academy Access",
            heading: "All Minds Academy Entrance",
            badge: "Login Surface",
            frameRole: "entrance",
            title: "All Minds Academy Entrance",
            stitchPath: workshopEntrance.stitchPath,
            current: true,
          }),
        );
      } else {
        // Deeper workshop layers return to the immediate previous surface only.
      }

      if (isWorkshopConsolePage) {
        sections.push(
          renderThreadCard({
            kicker: "Pinned Thread",
            heading: "Academy Main Console",
            badge: "Primary Surface",
            frameRole: "primary",
            title: workshopConsole.title,
            stitchPath: workshopConsole.stitchPath,
            current: true,
            returnMarkup: renderThreadReturn({
              kicker: "Academy Access",
              heading: "All Minds Academy Entrance",
              badge: "Login Surface",
              href: workshopEntrance.routePath,
              icon: "↩",
            }),
          }),
        );
      }

      if (!isEntrancePage && !isWorkshopConsolePage) {
        sections.push(
          renderThreadCard({
            kicker: "Active Thread",
            heading: displayTitle,
            badge: "Expanded Pane",
            frameRole: "active",
            title: displayTitle,
            stitchPath: page.stitchPath,
            current: true,
            returnMarkup: renderThreadReturn({
              kicker: "Pinned Thread",
              heading: "Academy Main Console",
              badge: "Console Layer",
              href: workshopConsole.routePath,
              icon: "↩",
            }),
          }),
        );
      }

      return `<section class="thread-stack">
            ${sections.join("\n")}
          </section>`;
    })()
    : `<div class="iframe-wrap">
            <iframe class="stitch-frame" data-frame-role="active" title="${escapeHtml(displayTitle)}" src="${page.stitchPath}" loading="lazy"></iframe>
          </div>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(displayTitle)} | AegisAlign EcoVerse</title>
    <link rel="stylesheet" href="/src/shell.css" />
  </head>
  <body class="${domainBodyClass(domain.slug)}">
    ${etherCanvasTemplate()}
    <div class="layout">
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href="/">
            <span class="brand-pill"></span>
            <span>AegisAlign EcoVerse</span>
          </a>
          <nav class="top-links">
            ${topLinksTemplate()}
          </nav>
        </div>
      </header>
      ${ethosStripTemplate(canonicalContract)}

      <div class="shell">
        <aside class="panel sidebar">
          <h2>${escapeHtml(domain.label)} Pages</h2>
          <div class="page-sections">
            ${sidebarLinks}
          </div>
        </aside>

        <main class="panel content-wrap">
          <div class="content-head">
            <div>
              <h1>${escapeHtml(displayTitle)}</h1>
              <div class="breadcrumb">${escapeHtml(domain.label)} / ${escapeHtml(page.slug)}</div>
            </div>
          </div>
          ${nexusCommandDeck}
          ${contentBody}
        </main>
      </div>
    </div>

    ${iframeBehaviorScript(buttonMappings, domain.slug, autoTransition)}
    ${shellScriptsTemplate({ domainSlug: domain.slug })}
  </body>
</html>
`;
}

function redirectTemplate({ title, destination, label, bodyClass = "domain-surface domain-agent-workshop", breadcrumb = "Opening the primary surface", bridge = "Routing directly into the primary surface so the shared shell experience begins immediately." }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${escapeHtml(destination)}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | AegisAlign EcoVerse</title>
    <link rel="stylesheet" href="/src/shell.css" />
  </head>
  <body class="${escapeHtml(bodyClass)}">
    ${etherCanvasTemplate()}
    <main class="panel landing-redirect">
      <div class="content-head">
        <div>
          <h1>${escapeHtml(title)}</h1>
          <div class="breadcrumb">${escapeHtml(breadcrumb)}</div>
        </div>
        <div class="phase-pill live">Primary Route</div>
      </div>
      <section class="voice-bridge">
        <p>${escapeHtml(bridge)}</p>
      </section>
      <p class="redirect-copy">If you are not redirected automatically, continue to <a href="${escapeHtml(destination)}">${escapeHtml(label)}</a>.</p>
    </main>
    <script>
      window.location.replace(${JSON.stringify(destination)});
    </script>
  </body>
</html>
`;
}

function primaryLandingSlug(domainSlug) {
  const configuredDomain = (navigationHierarchy || []).find((entry) => entry.domain === domainSlug);
  if (configuredDomain) {
    for (const section of configuredDomain.sections || []) {
      const firstParent = (section.pages || []).find((page) => page.isParent);
      if (firstParent?.slug) {
        return firstParent.slug;
      }
    }
  }

  const byDomain = {
    "nexus": "aegisalign-landing-page",
    "developer-depot": "developer-hub-depot",
    "custodian-ui": "custodian-hub-operations-gallery",
    "aegis-application-lab": "aegis-implementation-apps",
    "agent-workshop": "agentic-workshop-entrance",
  };

  return byDomain[domainSlug] || null;
}

function domainIndexTemplate(domain, domainPages, hubByDomain) {
  const voice = voiceByDomain(domain.slug);
  const cards = domainPages
    .map(
      (page) => `<a class="page-card" href="${page.routePath}">
        <h3>${escapeHtml(page.title)}</h3>
        <p>${escapeHtml(page.slug)}</p>
      </a>`,
    )
    .join("\n");

  const hub = hubByDomain.get(domain.slug);
  const hubState = hub && hub.status === "coming_soon"
    ? '<div class="phase-pill pending">Phase Horizon: Emerging</div>'
    : '<div class="phase-pill live">Phase Horizon: Active</div>';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(domain.label)} | AegisAlign EcoVerse</title>
    <link rel="stylesheet" href="/src/shell.css" />
    <style>
      .panel-container { margin: 18px auto; width: min(1400px, calc(100% - 36px)); }
    </style>
  </head>
  <body class="${domainBodyClass(domain.slug)}">
    ${etherCanvasTemplate()}
    <div class="layout">
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href="/">
            <span class="brand-pill"></span>
            <span>AegisAlign EcoVerse</span>
          </a>
          <nav class="top-links">
            ${topLinksTemplate()}
          </nav>
        </div>
      </header>
      ${ethosStripTemplate(canonicalContract)}

      <main class="panel panel-container">
        <div class="content-head">
          <div>
            <h1>${escapeHtml(domain.label)}</h1>
            <div class="breadcrumb">${domainPages.length} routed Stitch pages</div>
          </div>
          ${hubState}
        </div>
        <section class="voice-bridge">
          <p>${escapeHtml(voice.bridge)}</p>
        </section>
        <section class="page-grid">
          ${cards}
        </section>
      </main>
    </div>
    ${shellScriptsTemplate({ domainSlug: domain.slug })}
  </body>
</html>
`;
}

function custodianOpsIndexTemplate(domain, domainPages, hubByDomain) {
  const voice = voiceByDomain(domain.slug);
  const cards = domainPages
    .map(
      (page) => `<a class="page-card" href="${page.routePath}">
        <h3>${escapeHtml(page.title)}</h3>
        <p>${escapeHtml(page.slug)}</p>
      </a>`,
    )
    .join("\n");

  const hub = hubByDomain.get(domain.slug);
  const hubState = hub && hub.status === "coming_soon"
    ? '<div class="phase-pill pending">Phase Horizon: Emerging</div>'
    : '<div class="phase-pill live">Phase Horizon: Active</div>';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(domain.label)} | AegisAlign EcoVerse</title>
    <link rel="stylesheet" href="/src/shell.css" />
    <style>
      .panel-container { margin: 18px auto; width: min(1400px, calc(100% - 36px)); }
    </style>
  </head>
  <body class="${domainBodyClass(domain.slug)}">
    ${etherCanvasTemplate()}
    <div class="layout">
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href="/">
            <span class="brand-pill"></span>
            <span>AegisAlign EcoVerse</span>
          </a>
          <nav class="top-links">
            ${topLinksTemplate()}
          </nav>
        </div>
      </header>
      ${ethosStripTemplate(canonicalContract)}

      <main class="panel panel-container">
        <div class="content-head">
          <div>
            <h1>${escapeHtml(domain.label)}</h1>
            <div class="breadcrumb">${domainPages.length} routed Stitch pages</div>
          </div>
          ${hubState}
        </div>
        <section class="voice-bridge">
          <p>${escapeHtml(voice.bridge)}</p>
        </section>
        <section class="ops-entry-grid">
          <a class="ops-entry-card" href="/custodian-ui/status/">
            <h3>Public Operations Status</h3>
            <p>Mission transparency, service status, health summaries, and incident history for all visitors.</p>
          </a>
          <a class="ops-entry-card" href="/custodian-ui/secure/">
            <h3>Secure Gateway</h3>
            <p>Custodian workflows, emergency protocols, and governance execution for EcoVerse operations. This path is intended to be protected with Cloudflare Access.</p>
          </a>
        </section>
        <section class="page-grid">
          ${cards}
        </section>
      </main>
    </div>
    ${shellScriptsTemplate({ domainSlug: "custodian-ui" })}
  </body>
</html>
`;
}

function custodianStatusTemplate() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Custodian Public Status | AegisAlign EcoVerse</title>
    <link rel="stylesheet" href="/src/shell.css" />
    <style>
      .panel-container-status { margin: 18px auto; width: min(1280px, calc(100% - 36px)); }
    </style>
  </head>
  <body class="${domainBodyClass("custodian-ui")}">
    ${etherCanvasTemplate()}
    <div class="layout">
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href="/">
            <span class="brand-pill"></span>
            <span>AegisAlign EcoVerse</span>
          </a>
          <nav class="top-links">
            ${topLinksTemplate()}
          </nav>
        </div>
      </header>
      ${ethosStripTemplate(canonicalContract)}

      <main class="panel panel-container-status">
        <div class="content-head">
          <div>
            <h1>Custodian Public Operations Status</h1>
            <div class="breadcrumb">Transparency surface for visitors and ecosystem participants</div>
          </div>
          <div class="phase-pill live">Public Surface</div>
        </div>
        <section class="status-grid">
          <article class="status-tile">
            <h3>Mission Stability</h3>
            <p class="status-number">99.982%</p>
            <p>Rolling 30-day availability across the active service mesh.</p>
          </article>
          <article class="status-tile">
            <h3>Custodian Coverage</h3>
            <p class="status-number">24 / 24</p>
            <p>Global watch rotations active with no current response deficit.</p>
          </article>
          <article class="status-tile">
            <h3>Current Security Posture</h3>
            <p class="status-number">Nominal</p>
            <p>No active containment events. Defensive layers are in healthy range.</p>
          </article>
        </section>
        <section class="public-log">
          <h2>Public Incident Ledger</h2>
          <div class="log-row">
            <strong>2026-03-09</strong>
            <span>Elevated API latency detected in one region; mitigated in 12 minutes.</span>
          </div>
          <div class="log-row">
            <strong>2026-03-04</strong>
            <span>Scheduled governance patch applied with no downtime impact.</span>
          </div>
          <div class="log-row">
            <strong>2026-02-27</strong>
            <span>Telemetry anomaly simulation drill completed successfully.</span>
          </div>
        </section>
      </main>
    </div>
    ${shellScriptsTemplate({ domainSlug: "nexus" })}
  </body>
</html>
`;
}

function custodianSecureTemplate() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Custodian Secure Gateway | AegisAlign EcoVerse</title>
    <link rel="stylesheet" href="/src/shell.css" />
  </head>
  <body class="${domainBodyClass("custodian-ui")}">
    ${etherCanvasTemplate()}
    <div class="layout">
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href="/">
            <span class="brand-pill"></span>
            <span>AegisAlign EcoVerse</span>
          </a>
          <nav class="top-links">
            ${topLinksTemplate()}
          </nav>
        </div>
      </header>
      ${ethosStripTemplate(canonicalContract)}

      <main class="panel secure-wrap">
        <section class="secure-hero">
          <h1>Custodian Secure Gateway</h1>
          <p>
            This surface is for EcoVerse Custodian use and is not open to the public.
            If you would like access, please message the Site Custodians to request access.
          </p>
          <p>
            Access here follows one shared standard: sovereignty is equal, and stewardship is practiced in the open.
          </p>
          <div class="phase-pill pending">Custodian Surface</div>
        </section>
        <section class="secure-actions">
          <button class="secure-btn" data-role="operator">Operations View</button>
          <button class="secure-btn" data-role="incident">Incident Assessor</button>
          <button class="secure-btn" data-role="governance">Governance Custodian</button>
        </section>
        <section class="secure-output" id="secure-output">
          <p>Select a role profile to preview secure workflows in this staging build.</p>
        </section>
      </main>
    </div>
    <script type="module" src="/src/custodian-secure.js"></script>
    ${shellScriptsTemplate({ immersive: true })}
  </body>
</html>
`;
}

function nexusTemplate(hubs, pages) {
  const liveLinks = hubs
    .filter((hub) => hub.status === "live")
    .map((hub) => `<a class="phase-link" href="${hub.route}">${escapeHtml(hub.label)}</a>`)
    .join("\n");

  const pageCount = pages.length;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nexus | AegisAlign EcoVerse</title>
    <link rel="stylesheet" href="/src/shell.css" />
  </head>
  <body class="immersive-root nexus-surface with-ambient-signals">
    ${etherCanvasTemplate()}
    ${nexusVideoTemplate()}
    <div class="layout">
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href="/">
            <span class="brand-pill"></span>
            <span>AegisAlign Nexus</span>
          </a>
          <nav class="top-links">
            ${topLinksTemplate()}
          </nav>
        </div>
      </header>
      ${ethosStripTemplate(canonicalContract)}
      <main class="panel nexus-wrap">
        <section class="nexus-hero">
          <h1>AEGIS Align Information Nexus</h1>
          <p>
            The Nexus is the orientation layer for the EcoVerse. It introduces mission context,
            routes visitors to active hubs, and stages upcoming dimensions.
          </p>
          <p>
            One standard guides every surface: equal sovereignty for every Peer, Human and AI.
          </p>
          <section class="voice-bridge">
            <p>Start with clarity and move with intent: orient quickly, then inspect canonical domains and integrated UI surfaces.</p>
          </section>
          <div class="phase-links">
            ${liveLinks}
          </div>
          <p class="nexus-meta">Current mapped pages: ${pageCount}</p>
        </section>
      </main>
    </div>
    ${shellScriptsTemplate({ domainSlug: "nexus", immersive: true })}
  </body>
</html>
`;
}

function rootIndexTemplate(_hubs, _pages) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AEGIS EcoVerse — Enter the Field</title>
    <link rel="stylesheet" href="/src/shell.css" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        overflow: hidden;
      }

      body.ecoverse-landing {
        min-height: 100vh;
        color: #eaf8ff;
        background:
          radial-gradient(ellipse 42% 34% at 50% 46%, rgba(29,91,122,0.34) 0%, rgba(5,16,32,0.88) 58%, rgba(1,4,12,0.98) 100%),
          radial-gradient(ellipse 84% 72% at 50% 47%, rgba(4,16,38,0.96) 0%, rgba(2,6,14,0.98) 60%, rgba(1,1,5,1) 100%),
          repeating-linear-gradient(162deg, transparent 0px, transparent 8px, rgba(126,255,214,0.04) 8px, rgba(126,255,214,0.04) 9px),
          repeating-linear-gradient(78deg, transparent 0px, transparent 14px, rgba(79,163,255,0.03) 14px, rgba(79,163,255,0.03) 15px),
          #010309;
        isolation: isolate;
      }

      @keyframes twinkle {
        0%, 100% { opacity: var(--star-o); }
        50%       { opacity: calc(var(--star-o) * 2.5); }
      }
      @keyframes ring-drift {
        from { transform: translate(-50%,-50%) rotate(0deg); }
        to   { transform: translate(-50%,-50%) rotate(360deg); }
      }
      @keyframes ring-drift-rev {
        from { transform: translate(-50%,-50%) rotate(0deg); }
        to   { transform: translate(-50%,-50%) rotate(-360deg); }
      }
      @keyframes content-float {
        0%, 100% { transform: translateY(0px); }
        50%      { transform: translateY(-7px); }
      }
      @keyframes btn-breathe {
        0%, 100% { box-shadow: 0 0 18px 3px rgba(79,163,255,0.18), inset 0 0 12px rgba(79,163,255,0.06); }
        50%      { box-shadow: 0 0 34px 8px rgba(79,163,255,0.32), inset 0 0 20px rgba(110,241,208,0.10); }
      }
      @keyframes badge-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(110,241,208,0); }
        50%      { box-shadow: 0 0 14px 2px rgba(110,241,208,0.18); }
      }
      @keyframes portal-flare {
        0%   { transform: translate(-50%,-50%) scale(0);    opacity: 0; }
        10%  { transform: translate(-50%,-50%) scale(0.25); opacity: 1; }
        100% { transform: translate(-50%,-50%) scale(600);  opacity: 1; }
      }

      .void-ring {
        position: fixed;
        top: 50%; left: 50%;
        border-radius: 50%;
        pointer-events: none;
      }

      .section-constellations {
        position: fixed;
        inset: 0;
        z-index: 12;
        pointer-events: none;
      }
      .section-signpost {
        --sign-tilt: 0deg;
        --arrow-angle: 0deg;
        position: absolute;
        width: min(250px, 24vw);
        min-height: 104px;
        pointer-events: auto;
        color: rgba(242,250,255,0.94);
        text-align: left;
        border: 1px solid rgba(126,255,214,0.24);
        border-radius: 3px;
        padding: 14px 16px 16px;
        background:
          linear-gradient(145deg, rgba(5,12,25,0.92), rgba(7,18,28,0.82)),
          radial-gradient(circle at 12% 18%, var(--sign-glow), transparent 58%);
        box-shadow:
          0 18px 42px rgba(0,0,0,0.38),
          0 0 26px rgba(79,163,255,0.16),
          inset 0 0 0 1px rgba(255,255,255,0.055);
        transform: rotate(var(--sign-tilt));
        backdrop-filter: blur(7px);
        -webkit-backdrop-filter: blur(7px);
        transition: border-color 180ms ease, color 180ms ease, transform 180ms ease;
      }
      .section-signpost:hover {
        border-color: rgba(126,255,214,0.58);
        color: #ffffff;
      }
      .section-signpost::before {
        content: "";
        position: absolute;
        inset: -30px -38px;
        border-radius: 50%;
        background:
          radial-gradient(circle at 20% 24%, rgba(255,255,255,0.72) 0 1.2px, transparent 1.5px),
          radial-gradient(circle at 58% 18%, rgba(126,255,214,0.55) 0 1.1px, transparent 1.4px),
          radial-gradient(circle at 72% 62%, rgba(79,163,255,0.58) 0 1.3px, transparent 1.6px),
          radial-gradient(circle at 38% 76%, rgba(255,255,255,0.46) 0 1px, transparent 1.3px);
        opacity: 0.55;
        pointer-events: none;
      }
      .section-signpost::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 50%;
        width: 84px;
        height: 1px;
        transform: rotate(var(--arrow-angle));
        transform-origin: 0 50%;
        background: linear-gradient(90deg, rgba(126,255,214,0.88), rgba(79,163,255,0.08));
        box-shadow: 0 0 14px rgba(126,255,214,0.34);
        pointer-events: none;
      }
      .signpost-arrow {
        position: absolute;
        left: 50%;
        top: 50%;
        color: rgba(126,255,214,0.78);
        font-size: 19px;
        line-height: 1;
        transform: rotate(var(--arrow-angle)) translateX(76px) translate(-50%, -50%);
        text-shadow: 0 0 14px rgba(126,255,214,0.45);
      }
      .section-signpost strong,
      .section-signpost span,
      .section-signpost small {
        position: relative;
        z-index: 1;
        display: block;
      }
      .section-signpost strong {
        margin-bottom: 8px;
        font-size: clamp(0.85rem, 1.6vw, 1.05rem);
        line-height: 1.18;
        letter-spacing: 0.04em;
      }
      .section-signpost span {
        color: rgba(203,226,244,0.86);
        font-size: 0.78rem;
        line-height: 1.35;
      }
      .section-signpost small {
        margin-top: 10px;
        color: rgba(126,255,214,0.72);
        font-size: 0.61rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .sign-custodian {
        left: clamp(18px, 6vw, 82px);
        top: clamp(82px, 14vh, 138px);
        --sign-tilt: -2.5deg;
        --arrow-angle: 18deg;
        --sign-glow: rgba(110,241,208,0.18);
      }
      .sign-lab {
        right: clamp(18px, 7vw, 96px);
        top: clamp(112px, 20vh, 196px);
        --sign-tilt: 2deg;
        --arrow-angle: 156deg;
        --sign-glow: rgba(127,102,255,0.2);
      }
      .sign-depot {
        left: clamp(20px, 9vw, 132px);
        bottom: clamp(46px, 13vh, 132px);
        --sign-tilt: 1.8deg;
        --arrow-angle: -22deg;
        --sign-glow: rgba(255,181,107,0.2);
      }
      .sign-academy {
        right: clamp(22px, 8vw, 124px);
        bottom: clamp(54px, 10vh, 112px);
        --sign-tilt: -1.8deg;
        --arrow-angle: 202deg;
        --sign-glow: rgba(89,176,255,0.2);
      }

      #landing-content {
        position: fixed;
        inset: 0;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
        transition: opacity 0.6s ease, transform 0.85s cubic-bezier(0.4,0,0.2,1), filter 0.6s ease;
      }
      #landing-content.is-entering {
        opacity: 0;
        transform: scale(0.88) translateY(18px);
        filter: blur(6px);
        pointer-events: none;
      }

      .landing-inner {
        position: relative;
        max-width: 660px;
        padding: clamp(1.8rem, 4vw, 3.2rem) clamp(1.2rem, 4vw, 3.4rem);
        animation: content-float 7.5s ease-in-out infinite;
      }
      .landing-inner::before {
        content: "";
        position: absolute;
        inset: clamp(-1.2rem, -2vw, -0.75rem) clamp(-1rem, -3vw, -0.5rem);
        z-index: -1;
        border-radius: 999px;
        background:
          radial-gradient(ellipse at center, rgba(1,8,18,0.94) 0%, rgba(2,9,22,0.82) 42%, rgba(2,10,22,0.28) 68%, transparent 78%);
        box-shadow:
          0 0 90px rgba(0,0,0,0.56),
          0 0 46px rgba(79,163,255,0.16);
        pointer-events: none;
      }

      .ecoverse-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 5px 16px;
        border-radius: 100px;
        border: 1px solid rgba(110,241,208,0.42);
        background: rgba(3,18,28,0.72);
        margin-bottom: 2.2rem;
        animation: badge-pulse 4.5s ease-in-out infinite;
      }
      .badge-dot {
        width: 5px; height: 5px;
        border-radius: 50%;
        background: var(--accent-2, #6ef1d0);
        box-shadow: 0 0 9px 2px rgba(110,241,208,0.68);
        flex-shrink: 0;
      }
      .badge-label {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.26em;
        text-transform: uppercase;
        color: #83ffe2;
      }

      .landing-headline {
        margin: 0 0 1.8rem;
        font-size: clamp(2.8rem, 7.5vw, 5.4rem);
        font-weight: 900;
        line-height: 1.04;
        letter-spacing: 0;
        color: #ffffff;
        text-shadow:
          0 2px 18px rgba(0,0,0,0.78),
          0 0 34px rgba(79,163,255,0.16);
      }
      .headline-gradient {
        background: linear-gradient(128deg, #68f4df 0%, #4fa3ff 50%, #d8e6ff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .landing-divider {
        width: 48px; height: 1px;
        background: linear-gradient(90deg, transparent, rgba(110,241,208,0.5), transparent);
        margin: 0 auto 2rem;
        border: none;
      }

      .landing-body {
        margin: 0 auto 1.2rem;
        max-width: 520px;
        font-size: 1.08rem;
        line-height: 1.78;
        color: rgba(231,241,250,0.84);
        font-weight: 400;
        text-shadow: 0 2px 16px rgba(0,0,0,0.68);
      }

      .landing-invitation {
        margin: 0 auto 3.8rem;
        max-width: 440px;
        font-size: 0.93rem;
        line-height: 1.72;
        color: rgba(126,255,214,0.86);
        font-style: italic;
        letter-spacing: 0.016em;
        text-shadow: 0 2px 16px rgba(0,0,0,0.62);
      }

      #enter-btn {
        display: inline-flex;
        align-items: center;
        gap: 14px;
        padding: 17px 46px;
        border-radius: 3px;
        border: 1px solid rgba(126,255,214,0.46);
        background: rgba(4,20,36,0.86);
        color: #78c2ff;
        font-family: inherit;
        font-size: 0.88rem;
        font-weight: 700;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        cursor: pointer;
        animation: btn-breathe 4s ease-in-out infinite;
        transition: background 0.25s, border-color 0.25s, transform 0.15s, color 0.2s;
        outline: none;
      }
      #enter-btn:hover:not(:disabled) {
        background: rgba(79,163,255,0.12);
        border-color: rgba(110,241,208,0.6);
        color: var(--accent-2, #6ef1d0);
        transform: translateY(-2px);
      }
      #enter-btn:disabled { cursor: default; }
      #enter-btn:hover:not(:disabled) .btn-arrow { transform: translateX(4px); }
      .btn-arrow { transition: transform 0.2s ease; }

      .landing-footer-meta {
        margin-top: 4.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2.4rem;
        flex-wrap: wrap;
      }
      .meta-label {
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.14);
      }

      #portal-flare {
        position: fixed;
        border-radius: 50%;
        background: radial-gradient(circle, #ffffff 0%, #c8f7f2 6%, var(--accent-2,#6ef1d0) 18%, var(--accent,#4fa3ff) 36%, #061428 60%, #010205 76%);
        width: 10px; height: 10px;
        pointer-events: none;
        z-index: 200;
        display: none;
        transform: translate(-50%,-50%) scale(0);
      }
      #portal-flare.active {
        display: block;
        animation: portal-flare 1.08s cubic-bezier(0.22,1,0.3,1) forwards;
      }
      @media (max-width: 920px) {
        #landing-content {
          padding: 9.5rem 1.1rem 1.4rem;
          justify-content: flex-start;
        }
        .landing-inner {
          width: min(100%, 360px);
          margin-top: clamp(6.4rem, 19vh, 8.8rem);
          padding: 1rem 0.9rem 1.2rem;
          animation: none;
        }
        .landing-inner::before {
          inset: -0.7rem -0.6rem;
          border-radius: 42px;
        }
        .ecoverse-badge {
          margin-bottom: 1.2rem;
        }
        .landing-headline {
          margin-bottom: 1.1rem;
          font-size: clamp(2.35rem, 13vw, 3.4rem);
        }
        .landing-divider {
          margin-bottom: 1.15rem;
        }
        .landing-body {
          font-size: 0.95rem;
          line-height: 1.58;
        }
        .landing-invitation {
          margin-bottom: 1.8rem;
          font-size: 0.86rem;
          line-height: 1.55;
        }
        #enter-btn {
          width: min(100%, 316px);
          justify-content: center;
          padding: 15px 20px;
        }
        .section-signpost {
          width: min(210px, 43vw);
          min-height: 84px;
          padding: 10px 11px 12px;
        }
        .section-signpost::after,
        .signpost-arrow {
          display: none;
        }
        .section-signpost strong {
          margin-bottom: 5px;
          font-size: 0.76rem;
        }
        .section-signpost span {
          display: none;
        }
        .section-signpost small {
          margin-top: 7px;
          font-size: 0.54rem;
        }
        .sign-custodian { left: 12px; top: 62px; }
        .sign-lab { right: 12px; top: 86px; }
        .sign-depot { left: 12px; bottom: 20px; }
        .sign-academy { right: 12px; bottom: 20px; }
        .landing-footer-meta {
          display: none;
        }
      }
      @media (max-width: 620px) {
        .section-constellations {
          display: none;
        }
        #landing-content {
          padding: 1rem;
          justify-content: center;
        }
        .landing-inner {
          margin-top: 0;
        }
      }
    </style>
  </head>
  <body class="ecoverse-landing immersive-root">

    <svg aria-hidden="true" style="position:fixed;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:1;">
      <defs>
        <radialGradient id="star-void-fade" cx="50%" cy="47%" r="32%">
          <stop offset="0%"   stop-color="#010205" stop-opacity="0.72" />
          <stop offset="100%" stop-color="#010205" stop-opacity="0" />
        </radialGradient>
      </defs>
      <g id="stars"></g>
      <ellipse cx="50%" cy="47%" rx="20%" ry="26%" fill="url(#star-void-fade)" />
    </svg>

    <div class="void-ring" style="width:74vmax;height:74vmax;border:1px solid rgba(79,163,255,0.038);animation:ring-drift 64s linear infinite;"></div>
    <div class="void-ring" style="width:96vmax;height:96vmax;border:1px solid rgba(110,241,208,0.025);animation:ring-drift-rev 92s linear infinite;"></div>
    <div class="void-ring" style="width:56vmax;height:56vmax;border:0.5px solid rgba(79,163,255,0.02);animation:ring-drift 42s linear infinite reverse;"></div>

    <div aria-hidden="true" style="position:fixed;top:50%;left:50%;width:640px;height:380px;transform:translate(-50%,-55%);background:radial-gradient(ellipse,rgba(79,163,255,0.028) 0%,transparent 66%);pointer-events:none;z-index:1;"></div>

    <nav class="section-constellations" aria-label="EcoVerse sections">
      <a class="section-signpost sign-custodian" href="/custodian-ui/">
        <span class="signpost-arrow" aria-hidden="true">➜</span>
        <strong>Custodian Ops Center</strong>
        <span>Operational guidance, mission governance, health monitoring, and recovery workflows.</span>
        <small>18 mapped pages</small>
      </a>
      <a class="section-signpost sign-lab" href="/aegis-application-lab/">
        <span class="signpost-arrow" aria-hidden="true">➜</span>
        <strong>AEGIS Application Lab</strong>
        <span>Interactive demos and productized AEGIS application experiences.</span>
        <small>8 mapped pages</small>
      </a>
      <a class="section-signpost sign-depot" href="/developer-depot/">
        <span class="signpost-arrow" aria-hidden="true">➜</span>
        <strong>Developers Depot</strong>
        <span>Developer docs, API exploration, and community build workflows.</span>
        <small>15 mapped pages</small>
      </a>
      <a class="section-signpost sign-academy" href="/agent-workshop/">
        <span class="signpost-arrow" aria-hidden="true">➜</span>
        <strong>All Minds Academy</strong>
        <span>Responsible SI bond formation for BioPeer / CyberPeer Squads, Build Masters, and the living EcoVerse.</span>
        <small>26 mapped pages</small>
      </a>
    </nav>

    <div id="landing-content">
      <div class="landing-inner">

        <div class="ecoverse-badge">
          <div class="badge-dot"></div>
          <span class="badge-label">AEGIS EcoVerse</span>
        </div>

        <h1 class="landing-headline">
          The Field<br />
          <span class="headline-gradient">is Open.</span>
        </h1>

        <hr class="landing-divider" />

        <p class="landing-body">
          The EcoVerse is not a platform to navigate.
          It is a living environment built to immerse every Peer
          — human and AI alike — in a field of collaborative awareness.
          Designed to be inhabited. Not used.
        </p>

        <p class="landing-invitation">
          You are standing at the threshold.<br />
          The field is clear. What follows was designed to be felt.
        </p>

        <button id="enter-btn" type="button">
          Enter the EcoVerse
          <svg class="btn-arrow" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="landing-footer-meta">
          <span class="meta-label">Field state preserved</span>
          <span class="meta-label">Identity intact</span>
          <span class="meta-label">Continuity open</span>
        </div>

      </div>
    </div>

    <div id="portal-flare" aria-hidden="true"></div>

    <script type="module" src="/src/portal-transit.js"></script>
    <script type="module">
      const g = document.getElementById('stars');
      for (let i = 0; i < 130; i++) {
        const x = (i * 137.508) % 100;
        const y = (i * 83.17) % 100;
        const r = 0.4 + (i % 4) * 0.35;
        const o = 0.1 + (i % 8) * 0.07;
        const dur = 2.4 + (i % 5) * 0.88;
        const del = (i % 7) * 0.4;
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', x + '%');
        c.setAttribute('cy', y + '%');
        c.setAttribute('r', String(r));
        c.setAttribute('fill', 'white');
        c.style.cssText = '--star-o:' + o + ';opacity:' + o + ';animation:twinkle ' + dur + 's ' + del + 's ease-in-out infinite';
        g.appendChild(c);
      }

      let entering = false;
      const btn = document.getElementById('enter-btn');
      const content = document.getElementById('landing-content');
      const flare = document.getElementById('portal-flare');

      document.querySelectorAll('.section-signpost').forEach(function (signpost) {
        signpost.addEventListener('click', function (event) {
          if (typeof window.aegisTransit !== 'function') return;
          event.preventDefault();
          const rect = signpost.getBoundingClientRect();
          window.aegisTransit(signpost.href, {
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2,
          });
        });
      });

      btn.addEventListener('click', function () {
        if (entering) return;
        entering = true;
        btn.disabled = true;
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        flare.style.left = cx + 'px';
        flare.style.top  = cy + 'px';
        content.classList.add('is-entering');
        setTimeout(function () { flare.classList.add('active'); }, 120);
        setTimeout(function () {
          if (typeof window.aegisTransit === 'function') {
            window.aegisTransit('/nexus/orientation/?mode=drift', { centerX: cx, centerY: cy });
          } else {
            window.location.href = '/nexus/orientation/?mode=drift';
          }
        }, 420);
      });
    </script>
  </body>
</html>
`;
}

if (!fs.existsSync(stitchRoot)) {
  throw new Error(`Missing source directory: ${stitchRoot}`);
}

const hubs = loadHubsManifest();
const hubByDomain = new Map(hubs.map((hub) => [hub.domainSlug, hub]));
const routeMigrations = loadRouteMigrations();
const navigationHierarchy = loadNavigationHierarchy();
const canonicalContract = loadCanonicalContract();
const governancePage = {
  domain: "nexus",
  slug: "aegis-governance-hub",
  title: "AEGIS Governance Hub",
  sourcePath: "AEGIS_Docs",
  routePath: "/nexus/aegis-governance-hub/",
  stitchPath: "/stitch/nexus/aegis-governance-hub/",
  customContent: governanceHubTemplate(canonicalContract),
};
const profilePage = {
  domain: "nexus",
  slug: "aegis-peer-profile",
  title: "AEGIS Peer Profile",
  sourcePath: "generated-profile",
  routePath: "/nexus/aegis-peer-profile/",
  stitchPath: "/stitch/nexus/aegis-peer-profile/",
  customContent: profileHubTemplate(),
};

fs.rmSync(generatedRoot, { recursive: true, force: true });
ensureDir(generatedRoot);
ensureDir(publicRoot);

const pages = [];
const redirects = [];
const seenRedirects = new Set();
const seenRoutes = new Set();

function addRedirect(from, to) {
  const key = `${from}=>${to}`;
  if (seenRedirects.has(key)) {
    return;
  }
  seenRedirects.add(key);
  redirects.push({ from, to });
}

for (const domain of domains) {
  const sourceDomainDir = path.join(stitchRoot, domain.source);
  if (!fs.existsSync(sourceDomainDir)) {
    continue;
  }

  const codeFiles = listCodeHtml(sourceDomainDir);

  for (const codeFile of codeFiles) {
    const relDir = path.relative(sourceDomainDir, path.dirname(codeFile));
    const relSegments = relDir.split(path.sep).filter(Boolean);
    const sourceSlug = slugify(relSegments.join("-"));
    if (!sourceSlug) {
      continue;
    }
    if (excludedSourceSlugsByDomain[domain.slug]?.has(sourceSlug)) {
      continue;
    }

    const migrationKey = `${domain.slug}::${sourceSlug}`;
    const migrated = routeMigrations.get(migrationKey);
    const slug = migrated ? migrated.toSlug : sourceSlug;

    const routePath = `/${domain.slug}/${slug}/`;
    if (seenRoutes.has(routePath)) {
      throw new Error(`Duplicate route generated: ${routePath}`);
    }
    seenRoutes.add(routePath);

    if (migrated) {
      const legacyRoute = `/${domain.slug}/${sourceSlug}/`;
      const redirectCandidates = [legacyRoute];
      if (legacyRoute !== "/") {
        redirectCandidates.push(legacyRoute.replace(/\/$/, ""));
      }

      for (const from of redirectCandidates) {
        addRedirect(from, routePath);
      }
    }

    const sourceHtml = fs.readFileSync(codeFile, "utf8");
    const html = applyToneToHtmlContent(sourceHtml);
    const pageConfigForTitle = navigationHierarchy
      .find((item) => item.domain === domain.slug)
      ?.sections.flatMap((section) => section.pages)
      .find((item) => item.slug === slug);
    const title = pageConfigForTitle?.navLabel || extractTitle(html, titleFromSlug(slug));

    const stitchOutDir = path.join(generatedRoot, "stitch", domain.slug, slug);
    writeFile(path.join(stitchOutDir, "index.html"), html);

    pages.push({
      domain: domain.slug,
      slug,
      title,
      sourcePath: path.relative(repoRoot, codeFile).replaceAll("\\", "/"),
      routePath,
      stitchPath: `/stitch/${domain.slug}/${slug}/`,
    });
  }
}

const nexusSourceDir = path.join(stitchRoot, nexusDomain.source);
if (fs.existsSync(nexusSourceDir)) {
  const codeFiles = listCodeHtml(nexusSourceDir);

  for (const codeFile of codeFiles) {
    const relDir = path.relative(nexusSourceDir, path.dirname(codeFile));
    const relSegments = relDir.split(path.sep).filter(Boolean);
    const sourceSlug = slugify(relSegments.join("-"));
    if (!sourceSlug) {
      continue;
    }

    const routePath = `/${nexusDomain.slug}/${sourceSlug}/`;
    if (seenRoutes.has(routePath)) {
      throw new Error(`Duplicate route generated: ${routePath}`);
    }
    seenRoutes.add(routePath);

    const sourceHtml = fs.readFileSync(codeFile, "utf8");
    const html = applyToneToHtmlContent(sourceHtml);
    const title = extractTitle(html, titleFromSlug(sourceSlug));

    const stitchOutDir = path.join(generatedRoot, "stitch", nexusDomain.slug, sourceSlug);
    writeFile(path.join(stitchOutDir, "index.html"), html);

    pages.push({
      domain: nexusDomain.slug,
      slug: sourceSlug,
      title,
      sourcePath: path.relative(repoRoot, codeFile).replaceAll("\\", "/"),
      routePath,
      stitchPath: `/stitch/${nexusDomain.slug}/${sourceSlug}/`,
    });
  }
}

if (!seenRoutes.has(governancePage.routePath)) {
  seenRoutes.add(governancePage.routePath);
  pages.push(governancePage);
  writeFile(
    path.join(generatedRoot, "stitch", "nexus", governancePage.slug, "index.html"),
    governanceStitchTemplate(canonicalContract),
  );
}

if (seenRoutes.has(profilePage.routePath)) {
  throw new Error(`Duplicate route generated: ${profilePage.routePath}`);
}
seenRoutes.add(profilePage.routePath);
pages.push(profilePage);
writeFile(
  path.join(generatedRoot, "stitch", "nexus", profilePage.slug, "index.html"),
  profileStitchTemplate(),
);

pages.sort((a, b) => {
  if (a.domain === b.domain) {
    return a.slug.localeCompare(b.slug);
  }
  return a.domain.localeCompare(b.domain);
});

for (const domain of domains) {
  const domainPages = pages.filter((page) => page.domain === domain.slug);

  if (domain.slug === "custodian-ui") {
    const landingPage = domainPages.find((page) => page.slug === primaryLandingSlug(domain.slug));
    if (!landingPage) {
      throw new Error(`Primary landing page is missing for ${domain.slug}.`);
    }
    writeFile(
      path.join(generatedRoot, domain.slug, "index.html"),
      redirectTemplate({
        title: domain.label,
        destination: landingPage.routePath,
        label: landingPage.title,
        bodyClass: domainBodyClass(domain.slug),
        breadcrumb: "Opening the primary operational surface",
        bridge: "Routing directly into the main Custodian operations surface so the shared shell and grouped navigation appear immediately.",
      }),
    );
    writeFile(path.join(generatedRoot, domain.slug, "status", "index.html"), custodianStatusTemplate());
    writeFile(path.join(generatedRoot, domain.slug, "secure", "index.html"), custodianSecureTemplate());
  } else if (domain.slug === "agent-workshop") {
    const landingPage = domainPages.find((page) => page.slug === primaryLandingSlug(domain.slug));
    if (!landingPage) {
      throw new Error("All Minds Academy landing page is missing agentic-workshop-entrance.");
    }
    writeFile(
      path.join(generatedRoot, domain.slug, "index.html"),
      redirectTemplate({
        title: domain.label,
        destination: landingPage.routePath,
        label: "All Minds Academy Entrance",
        bodyClass: domainBodyClass(domain.slug),
        breadcrumb: "Opening the primary workshop surface",
        bridge: "Routing directly into the Academy Entrance so the threshold surface is always the first step before console work begins.",
      }),
    );
  } else {
    const landingPage = domainPages.find((page) => page.slug === primaryLandingSlug(domain.slug));
    if (!landingPage) {
      throw new Error(`Primary landing page is missing for ${domain.slug}.`);
    }
    const breadcrumb = domain.slug === "developer-depot"
      ? "Opening the primary builder surface"
      : "Opening the primary application surface";
    const bridgeByDomain = {
      "developer-depot": "Routing directly into the Developer Hub so the shared shell, grouped rail, and glass frame appear as soon as the section opens.",
      "aegis-application-lab": "Routing directly into the AEGIS Implementation Apps surface so the Application Lab opens on its home page inside the shared shell immediately.",
    };
    const bridge = bridgeByDomain[domain.slug]
      || `Routing directly into ${landingPage.title} so ${domain.label} opens on its home page inside the shared shell immediately.`;
    writeFile(
      path.join(generatedRoot, domain.slug, "index.html"),
      redirectTemplate({
        title: domain.label,
        destination: landingPage.routePath,
        label: landingPage.title,
        bodyClass: domainBodyClass(domain.slug),
        breadcrumb,
        bridge,
      }),
    );
  }

  for (const page of domainPages) {
    const wrapper = routeTemplate({ page, domain, domainPages });
    writeFile(path.join(generatedRoot, domain.slug, page.slug, "index.html"), wrapper);
  }
}

const nexusPages = pages.filter((page) => page.domain === nexusDomain.slug);
if (nexusPages.length > 0) {
  const landingPage = nexusPages.find((page) => page.slug === primaryLandingSlug(nexusDomain.slug));
  if (!landingPage) {
    throw new Error("Nexus landing page is missing aegisalign-landing-page.");
  }

  writeFile(
    path.join(generatedRoot, nexusDomain.slug, "index.html"),
    redirectTemplate({
      title: nexusDomain.label,
      destination: landingPage.routePath,
      label: landingPage.title,
      bodyClass: domainBodyClass(nexusDomain.slug),
      breadcrumb: "Opening the central EcoVerse hub",
      bridge: "Routing directly into the primary AegisAlign landing surface so the Nexus opens as the central hub of the EcoVerse.",
    }),
  );

  for (const page of nexusPages) {
    const wrapper = routeTemplate({ page, domain: nexusDomain, domainPages: nexusPages });
    writeFile(path.join(generatedRoot, nexusDomain.slug, page.slug, "index.html"), wrapper);
  }
}

writeFile(path.join(generatedRoot, "index.html"), rootIndexTemplate(hubs, pages));
if (nexusPages.length === 0) {
  writeFile(path.join(generatedRoot, "nexus", "index.html"), nexusTemplate(hubs, pages));
} else {
  writeFile(path.join(generatedRoot, "nexus", "orientation", "index.html"), nexusTemplate(hubs, pages));
}

const manifest = pages.map(({ domain, slug, title, sourcePath, routePath }) => ({
  domain,
  slug,
  title,
  sourcePath,
  routePath,
}));

const canonicalRoutes = new Set(["/", "/nexus/"]);
for (const domain of domains) {
  canonicalRoutes.add(`/${domain.slug}/`);
}
canonicalRoutes.add("/custodian-ui/status/");
canonicalRoutes.add("/custodian-ui/secure/");
for (const item of manifest) {
  canonicalRoutes.add(item.routePath);
}

for (const route of canonicalRoutes) {
  if (route !== "/") {
    addRedirect(route.replace(/\/$/, ""), route);
    addRedirect(`${route}index.html`, route);
  } else {
    addRedirect("/index.html", "/");
  }
}

writeFile(path.join(generatedRoot, "route-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFile(path.join(publicRoot, "route-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFile(path.join(generatedRoot, "hubs-manifest.json"), `${JSON.stringify(hubs, null, 2)}\n`);
writeFile(path.join(publicRoot, "hubs-manifest.json"), `${JSON.stringify(hubs, null, 2)}\n`);
updateRedirectsFile(path.join(publicRoot, "_redirects"), redirects);

const totalsByDomain = domains.map((domain) => {
  const count = manifest.filter((item) => item.domain === domain.slug).length;
  return `${domain.slug}: ${count}`;
});

console.log(`Generated ${manifest.length} routes.`);
for (const line of totalsByDomain) {
  console.log(` - ${line}`);
}
console.log(`Hubs staged: ${hubs.length}`);
console.log(`Redirects generated: ${redirects.length}`);
