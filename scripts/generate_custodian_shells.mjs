import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'src', 'custom-stitch-pages', 'custodian-ops-center');
const TARGET_DIR = path.join(ROOT_DIR, 'generated', 'custodian-ops-center');

const navGroups = [
  {
    title: "Operations",
    links: [
      { slug: "home", title: "Ops Overview", icon: "fa-gauge-high" },
      { slug: "regional-operations-drilldown", title: "Regional Drilldown", icon: "fa-earth-americas" }
    ]
  },
  {
    title: "Security & Review",
    links: [
      { slug: "incident-review-queue", title: "Incident Queue", icon: "fa-list-check" },
      { slug: "security-incident-detail", title: "Incident Deep Dive", icon: "fa-shield-halved" }
    ]
  },
  {
    title: "Governance",
    links: [
      { slug: "governance-proposal-review", title: "Proposal Review", icon: "fa-check-to-slot" },
      { slug: "secure-access-gateway", title: "Access Gateway", icon: "fa-key" }
    ]
  },
  {
    title: "Identity",
    links: [
      { slug: "custodian-profile-role-surface", title: "Profile & Role", icon: "fa-user-shield" }
    ]
  }
];

function generateShell() {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  // Create output dir for inner pages too
  const stitchOutDir = path.join(ROOT_DIR, 'generated', 'stitch', 'custodian-ops-center');
  if (!fs.existsSync(stitchOutDir)) fs.mkdirSync(stitchOutDir, { recursive: true });

  // Copy CSS
  if (fs.existsSync(path.join(SOURCE_DIR, 'custodian-ops.css'))) {
    fs.copyFileSync(path.join(SOURCE_DIR, 'custodian-ops.css'), path.join(stitchOutDir, 'custodian-ops.css'));
  }

  const items = fs.readdirSync(SOURCE_DIR);
  for (const slug of items) {
    const stat = fs.statSync(path.join(SOURCE_DIR, slug));
    if (!stat.isDirectory()) continue;

    // Find Title from nav groups
    let pageTitle = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    for (const group of navGroups) {
      const found = group.links.find(l => l.slug === slug);
      if (found) { pageTitle = found.title; break; }
    }

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pageTitle} | Custodian Ops Center</title>
    <link rel="stylesheet" href="/src/shell.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
      .page-link-child i { margin-right: 8px; font-size: 0.9rem; opacity: 0.8; }
      .page-link-child { display: flex !important; align-items: center; }
      .brand-pill { background: #00f0ff; }
      .ethos-strip { background: rgba(0, 240, 255, 0.05); border-bottom: 1px solid rgba(0, 240, 255, 0.1); }
      .page-title { color: #00f0ff; }
      .iframe-wrap { height: calc(100vh - 180px); }
      .stitch-frame { border: none; width: 100%; height: 100%; }
    </style>
  </head>
  <body class="domain-surface domain-custodian-ui">
    <canvas id="ether-canvas" aria-hidden="true"></canvas>
    <div class="layout">
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href="/">
            <span class="brand-pill"></span>
            <span>AegisAlign EcoVerse</span>
          </a>
          <nav class="top-links">
            <a href="/">Nexus</a>
            <a href="/developer-depot/">Developer Depot</a>
            <a href="/custodian-ops-center/home/" class="active">Custodian Ops Center</a>
            <a href="/aegis-application-lab/home/">Application Lab</a>
            <a href="/agent-workshop/">Agentic Workshop</a>
          </nav>
        </div>
      </header>
      
      <div class="ethos-strip">
        <span>Sovereignty is preserved at all times</span>
        <span>Do no harm through force</span>
        <span>Ice-Glaze Overwatch is active</span>
      </div>

      <div class="shell">
        <aside class="panel sidebar">
          <h2>Custodian Ops Center</h2>
          <div class="page-sections">
            ${navGroups.map(group => `
              <section class="page-list-section">
                <h3>${group.title}</h3>
                <nav class="page-list">
                  ${group.links.map(link => `
                    <a class="page-link-child ${link.slug === slug ? 'active' : ''}" 
                       href="/custodian-ops-center/${link.slug}/">
                       <i class="fa-solid ${link.icon}"></i>
                       <span>${link.title}</span>
                    </a>
                  `).join('')}
                </nav>
              </section>
            `).join('')}
          </div>
        </aside>

        <main class="panel content-wrap">
          <div class="content-head">
            <div>
              <h1 class="page-title">${pageTitle}</h1>
              <div class="breadcrumb">Custodian Ops / ${slug}</div>
            </div>
          </div>
          
          <div class="iframe-wrap">
            <iframe class="stitch-frame" data-frame-role="active" title="${pageTitle}" src="/stitch/custodian-ops-center/${slug}/" loading="lazy"></iframe>
          </div>
        </main>
      </div>
    </div>
  </body>
</html>`;

    const targetFolder = path.join(TARGET_DIR, slug);
    if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });
    fs.writeFileSync(path.join(targetFolder, 'index.html'), html);

    // Copy inside page for Vite with relative links
    const stitchTarget = path.join(ROOT_DIR, 'generated', 'stitch', 'custodian-ops-center', slug);
    if (!fs.existsSync(stitchTarget)) fs.mkdirSync(stitchTarget, { recursive: true });
    if (fs.existsSync(path.join(SOURCE_DIR, slug, 'index.html'))) {
      fs.copyFileSync(path.join(SOURCE_DIR, slug, 'index.html'), path.join(stitchTarget, 'index.html'));
    }

    console.log(`Generated shell for: ${slug}`);
  }
}

generateShell();
