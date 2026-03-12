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
    ...domains.map((domain) => `<a href="/${domain.slug}/">${escapeHtml(domain.label)}</a>`),
  ].join("\n");
}

function domainBodyClass(domainSlug) {
  return `domain-surface domain-${domainSlug}`;
}

function shellScriptsTemplate() {
  return '<script type="module" src="/src/reminder-signals.js"></script>\n    <script type="module" src="/src/ambient-signals.js"></script>\n    <script type="module" src="/src/peer-signs.js"></script>\n    <script type="module" src="/src/portal-transit.js"></script>';
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

function routeTemplate({ page, domain, domainPages }) {
  const sidebarLinks = domainPages
    .map((item) => {
      const active = item.slug === page.slug ? "active" : "";
      return `<a class="${active}" href="${item.routePath}">${escapeHtml(item.title)}</a>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)} | AegisAlign EcoVerse</title>
    <link rel="stylesheet" href="/src/shell.css" />
  </head>
  <body class="${domainBodyClass(domain.slug)}">
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
          <nav class="page-list">
            ${sidebarLinks}
          </nav>
        </aside>

        <main class="panel content-wrap">
          <div class="content-head">
            <div>
              <h1>${escapeHtml(page.title)}</h1>
              <div class="breadcrumb">${escapeHtml(domain.label)} / ${escapeHtml(page.slug)}</div>
            </div>
          </div>
          <div class="iframe-wrap">
            <iframe class="stitch-frame" title="${escapeHtml(page.title)}" src="${page.stitchPath}" loading="lazy"></iframe>
          </div>
        </main>
      </div>
    </div>

    <script>
      const frame = document.querySelector('.stitch-frame');
      if (frame) {
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
            const regex = new RegExp('\\b' + from + '\\b', 'gi');
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

        const updateHeight = () => {
          try {
            const doc = frame.contentDocument;
            if (!doc) return;
            softenDocument(doc);
            const bodyHeight = doc.body ? doc.body.scrollHeight : 0;
            const docHeight = doc.documentElement ? doc.documentElement.scrollHeight : 0;
            const height = Math.max(bodyHeight, docHeight, Math.round(window.innerHeight * 0.8));
            frame.style.height = String(height + 12) + 'px';
          } catch {
            frame.style.minHeight = '85vh';
          }
        };

        frame.addEventListener('load', updateHeight);
        window.addEventListener('resize', updateHeight);
        setInterval(updateHeight, 2000);
      }
    </script>
    ${shellScriptsTemplate()}
  </body>
</html>
`;
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
  </head>
  <body class="${domainBodyClass(domain.slug)}">
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

      <main class="panel" style="margin: 18px auto; width: min(1400px, calc(100% - 36px));">
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
    ${shellScriptsTemplate()}
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
  </head>
  <body class="${domainBodyClass(domain.slug)}">
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

      <main class="panel" style="margin: 18px auto; width: min(1400px, calc(100% - 36px));">
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
    ${shellScriptsTemplate()}
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
  </head>
  <body class="${domainBodyClass("custodian-ui")}">
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

      <main class="panel" style="margin: 18px auto; width: min(1280px, calc(100% - 36px));">
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
    ${shellScriptsTemplate()}
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
    ${shellScriptsTemplate()}
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
    ${shellScriptsTemplate()}
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
    <canvas id="ether-canvas" aria-hidden="true"></canvas>
    <div class="layout immersive-layer">
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href="/">
            <span class="brand-pill"></span>
            <span>AegisAlign MultiDimensional Nexus</span>
          </a>
          <nav class="top-links">
            <a class="active" href="/nexus/">Nexus</a>
            ${domains.map((domain) => `<a href="/${domain.slug}/">${escapeHtml(domain.label)}</a>`).join("\n")}
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
          <div class="phase-links">
            <a class="phase-link" href="/nexus/">Visit Nexus</a>
            ${liveHubLinks}
          </div>
        </section>

        <section class="portal-grid">
          ${cards}
        </section>
      </main>
    </div>
    <script type="module" src="/src/nexus-ether.js"></script>
    ${shellScriptsTemplate()}
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
const canonicalContract = loadCanonicalContract();

fs.rmSync(generatedRoot, { recursive: true, force: true });
ensureDir(generatedRoot);
ensureDir(publicRoot);

const pages = [];
const redirects = [];
const seenRedirects = new Set();
const seenRoutes = new Set();

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
        const key = `${from}=>${routePath}`;
        if (seenRedirects.has(key)) {
          continue;
        }
        seenRedirects.add(key);
        redirects.push({ from, to: routePath });
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

pages.sort((a, b) => {
  if (a.domain === b.domain) {
    return a.slug.localeCompare(b.slug);
  }
  return a.domain.localeCompare(b.domain);
});

for (const domain of domains) {
  const domainPages = pages.filter((page) => page.domain === domain.slug);

  if (domain.slug === "custodian-ui") {
    writeFile(path.join(generatedRoot, domain.slug, "index.html"), custodianOpsIndexTemplate(domain, domainPages, hubByDomain));
    writeFile(path.join(generatedRoot, domain.slug, "status", "index.html"), custodianStatusTemplate());
    writeFile(path.join(generatedRoot, domain.slug, "secure", "index.html"), custodianSecureTemplate());
  } else {
    writeFile(path.join(generatedRoot, domain.slug, "index.html"), domainIndexTemplate(domain, domainPages, hubByDomain));
  }

  for (const page of domainPages) {
    const wrapper = routeTemplate({ page, domain, domainPages });
    writeFile(path.join(generatedRoot, domain.slug, page.slug, "index.html"), wrapper);
  }
}

writeFile(path.join(generatedRoot, "index.html"), rootIndexTemplate(hubs, pages));
writeFile(path.join(generatedRoot, "nexus", "index.html"), nexusTemplate(hubs, pages));

const manifest = pages.map(({ domain, slug, title, sourcePath, routePath }) => ({
  domain,
  slug,
  title,
  sourcePath,
  routePath,
}));

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
