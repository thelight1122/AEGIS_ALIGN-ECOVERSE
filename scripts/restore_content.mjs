import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src', 'custom-stitch-pages');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------
// CUSTODIAN OPS CENTER
// ---------------------------------------------------------
const opsCss = `
:root {
  --ops-bg: #030812;
  --ops-panel-bg: rgba(6, 15, 30, 0.7);
  --ops-border: rgba(0, 240, 255, 0.15);
  --ops-cyan: #00f0ff;
  --ops-teal: #00897B;
  --ops-alert: #F44336;
  --font-sans: 'Inter', system-ui, sans-serif;
}
body {
  background: var(--ops-bg);
  background-image: radial-gradient(circle at 10% 20%, rgba(0, 240, 255, 0.05), transparent 40%);
  color: #E0E6ED;
  font-family: var(--font-sans);
  margin: 0; padding: 1.5rem;
}
.glass-panel {
  background: var(--ops-panel-bg);
  border: 1px solid var(--ops-border);
  border-radius: 8px;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 30px rgba(0,0,0,0.5);
}
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}
.stat-box { text-align: center; padding: 1rem; border-right: 1px solid var(--ops-border); }
.stat-box:last-child { border-right: none; }
table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.85rem; }
th { text-align: left; padding: 10px; border-bottom: 1px solid var(--ops-border); color: var(--ops-cyan); }
td { padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,0.03); }
`;

ensureDir(path.join(SRC_DIR, 'custodian-ops-center'));
fs.writeFileSync(path.join(SRC_DIR, 'custodian-ops-center', 'custodian-ops.css'), opsCss);

const opsPages = [
  { slug: "home", title: "Ops Center Overview" },
  { slug: "incident-review-queue", title: "Incident Queue" },
  { slug: "security-incident-detail", title: "Incident Detail" },
  { slug: "governance-proposal-review", title: "Proposal Review" },
  { slug: "secure-access-gateway", title: "Access Gateway" },
  { slug: "regional-operations-drilldown", title: "Regional Operations" },
  { slug: "custodian-profile-role-surface", title: "Custodian Profile" }
];

opsPages.forEach(p => {
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${p.title}</title>
<link rel="stylesheet" href="../custodian-ops.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head><body>
<div class="glass-panel">
  <h1 style="color:var(--ops-cyan); font-weight:800; margin-top:0;">${p.title}</h1>
  <p style="color:rgba(255,255,255,0.6);">Precise operational diagnostics setup benchmarks triggers.</p>
  <div class="dashboard-grid">
    <div class="glass-panel"><h3><i class="fa-solid fa-gauge"></i> Telemetry</h3><p>Operational sync load metrics 98.4% diagnostics</p></div>
    <div class="glass-panel"><h3><i class="fa-solid fa-bell"></i> Alerts</h3><p>0 Critical | 2 Warnings triggers loaded</p></div>
  </div>
</div></body></html>`;
  ensureDir(path.join(SRC_DIR, 'custodian-ops-center', p.slug));
  fs.writeFileSync(path.join(SRC_DIR, 'custodian-ops-center', p.slug, 'index.html'), html);
});

// ---------------------------------------------------------
// PEER PROFILE
// ---------------------------------------------------------
const profileCss = `
:root {
  --profile-bg: #0A0C14;
  --profile-panel: rgba(13, 16, 26, 0.8);
  --profile-border: rgba(186, 104, 200, 0.15);
  --accent-purple: #BA68C8;
  --accent-amber: #FFCA28;
}
body {
  background: var(--profile-bg);
  background-image: radial-gradient(circle at 90% 10%, rgba(186, 104, 200, 0.08), transparent 40%);
  color: #ECEFF1;
  font-family: system-ui, sans-serif;
  margin: 0; padding: 1.5rem;
}
.glass-panel {
  background: var(--profile-panel);
  border: 1px solid var(--profile-border);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}
.dashboard-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1.5rem;
}
`;

ensureDir(path.join(SRC_DIR, 'peer-profile'));
fs.writeFileSync(path.join(SRC_DIR, 'peer-profile', 'profile-workspace.css'), profileCss);

const profilePages = [
  { slug: "home", title: "Profile Home" },
  { slug: "identity-trust", title: "Identity & Trust" },
  { slug: "subscription-access", title: "Subscription & Access" },
  { slug: "saved-systems", title: "Saved Systems" },
  { slug: "developer-connect", title: "Developer Connect" },
  { slug: "settings", title: "Settings" },
  { slug: "perks-benefits", title: "Tools & Perks" }
];

profilePages.forEach(p => {
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${p.title}</title>
<link rel="stylesheet" href="../profile-workspace.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head><body>
<div class="glass-panel">
  <h1 style="color:var(--accent-purple); margin-top:0;">${p.title}</h1>
  <p style="color:rgba(255,255,255,0.5);">Personal identity workspace config setup diagnostics layout benchmarks.</p>
  <div class="dashboard-grid">
    <div class="glass-panel"><h3><i class="fa-solid fa-id-card"></i> Status</h3><p>Node Sync Active diagnostics anchors valid</p></div>
    <div class="glass-panel"><h3><i class="fa-solid fa-link"></i> Keys</h3><p>Manage secrets and gateway endpoints triggers</p></div>
  </div>
</div></body></html>`;
  ensureDir(path.join(SRC_DIR, 'peer-profile', p.slug));
  fs.writeFileSync(path.join(SRC_DIR, 'peer-profile', p.slug, 'index.html'), html);
});

console.log("Pages restored to src/custom-stitch-pages");
