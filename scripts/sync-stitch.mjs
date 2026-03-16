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
  { source: "Agent_Workshop", slug: "agent-workshop", label: "Agentic Workshop" },
];

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
      '<a class="top-link-drift" href="/?mode=drift" data-drift-return="true">Re-enter Drift</a>',
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
      bridge: "Understand how agents collaborate in practice while observing orchestration states, mesh topology, and recursive workflows.",
    },
  };

  return library[domainSlug] || {
    bridge: "Enter with clear context first, then inspect structured signals and system behavior without friction.",
  };
}

function groupPagesForSidebar(domain, domainPages, navigationHierarchy) {
  const domainConfig = (navigationHierarchy || []).find((d) => d.domain === domain.slug);
  const sidebarHiddenSlugs = new Set([
    "custodian-cockpit-hud-2",
  ]);
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
            kicker: "Workshop Access",
            heading: "Workshop Entrance",
            badge: "Login Surface",
            frameRole: "entrance",
            title: workshopEntrance.title,
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
            heading: "Workshop Main Console",
            badge: "Primary Surface",
            frameRole: "primary",
            title: workshopConsole.title,
            stitchPath: workshopConsole.stitchPath,
            current: true,
            returnMarkup: renderThreadReturn({
              kicker: "Workshop Access",
              heading: "Workshop Entrance",
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
            heading: page.title,
            badge: "Expanded Pane",
            frameRole: "active",
            title: page.title,
            stitchPath: page.stitchPath,
            current: true,
            returnMarkup: renderThreadReturn({
              kicker: "Pinned Thread",
              heading: "Workshop Main Console",
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
            <iframe class="stitch-frame" data-frame-role="active" title="${escapeHtml(page.title)}" src="${page.stitchPath}" loading="lazy"></iframe>
          </div>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)} | AegisAlign EcoVerse</title>
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
              <h1>${escapeHtml(page.title)}</h1>
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
    "custodian-ui": "aegis-protocol-dashboard",
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
  <body class="nexus-surface with-ambient-signals">
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
    ${shellScriptsTemplate({ domainSlug: "nexus" })}
  </body>
</html>
`;
}

function rootIndexTemplate(hubs, pages) {
  const liveHubLinks = hubs
    .filter((hub) => hub.status === "live")
    .map((hub) => `<a class="phase-link" href="${hub.route}">Visit ${escapeHtml(hub.label)}</a>`)
    .join("\n");

  const cards = hubs
    .map((hub) => {
      const isLive = hub.status === "live";
      const count = pages.filter((page) => page.domain === hub.domainSlug).length;
      const cardTagOpen = isLive ? `<a class="portal-card live" href="${hub.route}">` : '<div class="portal-card pending">';
      const cardTagClose = isLive ? "</a>" : "</div>";

      return `${cardTagOpen}
        <div class="portal-status ${isLive ? "live" : "pending"}">${isLive ? "Accessible" : "On the Horizon"}</div>
        <h3>${escapeHtml(hub.label)}</h3>
        <p>${escapeHtml(hub.description)}</p>
        <div class="voice-block">
          <p>${escapeHtml(voiceByDomain(hub.domainSlug).bridge)}</p>
        </div>
        <div class="portal-meta">${count} mapped pages</div>
      ${cardTagClose}`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AegisAlign EcoVerse Nexus</title>
    <link rel="stylesheet" href="/src/shell.css" />
  </head>
  <body class="immersive-root nexus-surface with-ambient-signals">
    ${nexusVideoTemplate()}
    ${etherCanvasTemplate()}
    <div class="layout immersive-layer">
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href="/">
            <span class="brand-pill"></span>
            <span>AegisAlign MultiDimensional Nexus</span>
          </a>
          <nav class="top-links">
            <a class="active" href="/nexus/">Nexus</a>
            ${topLinksTemplate()}
          </nav>
        </div>
      </header>
      ${ethosStripTemplate(canonicalContract)}

      <main class="nexus-main">
        <section class="nexus-intro panel">
          <h1>Float Through the AEGIS EcoVerse</h1>
          <p>
            A surreal navigation layer designed for deep orientation and dimensional travel.
            Drift between living hubs and step into distinct EcoVerse atmospheres.
          </p>
          <p>
            This frontier will take strange turns; we stay coherent by choosing cooperation, curiosity, and care.
          </p>
          <div class="nexus-mode-switch" aria-label="Navigation mode">
            <button class="nexus-mode-btn is-active" type="button" data-drift-direct>Direct Access</button>
            <button class="nexus-mode-btn" type="button" data-drift-enter>Enter Drift Mode</button>
          </div>
          <p class="nexus-mode-copy">
            Choose direct access for speed, or enter Drift Mode to move through the Ether and approach floating module portals.
          </p>
          <div class="phase-links">
            <a class="phase-link" href="/nexus/">Visit Nexus</a>
            ${liveHubLinks}
          </div>
        </section>

        <section class="portal-grid">
          ${cards}
        </section>
        <div class="drift-quickbar" data-drift-quickbar hidden>
          <div class="drift-quickbar-copy">
            <strong>Drift Mode</strong>
            <span>Use mouse, wheel, or WASD to roam the Ether and click when a portal resonates.</span>
          </div>
          <button class="nexus-mode-btn" type="button" data-drift-exit>Return To Direct Access</button>
        </div>
      </main>
    </div>
    ${shellScriptsTemplate({ immersive: true })}
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
    const title = extractTitle(html, titleFromSlug(slug));

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

if (seenRoutes.has(governancePage.routePath)) {
  throw new Error(`Duplicate route generated: ${governancePage.routePath}`);
}
seenRoutes.add(governancePage.routePath);
pages.push(governancePage);
writeFile(
  path.join(generatedRoot, "stitch", "nexus", governancePage.slug, "index.html"),
  governanceStitchTemplate(canonicalContract),
);

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
      throw new Error("Agentic Workshop landing page is missing agentic-workshop-entrance.");
    }
    writeFile(
      path.join(generatedRoot, domain.slug, "index.html"),
      redirectTemplate({
        title: domain.label,
        destination: landingPage.routePath,
        label: landingPage.title,
        bodyClass: domainBodyClass(domain.slug),
        breadcrumb: "Opening the primary workshop surface",
        bridge: "Routing directly into the Workshop Entrance so the login surface is always the first step before console work begins.",
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
