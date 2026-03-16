import fs from 'fs';
import path from 'path';

const section = 'aegis-application-lab';
const __dirname = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'); // Fix for windows path

const pages = [
    { id: 'home', label: 'Lab Home', icon: 'home', path: 'home' },
    { id: 'apps-overview', label: 'Explore Apps', icon: 'grid_view', path: 'apps-overview' },
    { id: 'live-demo-surface', label: 'Live Simulator', icon: 'view_in_ar', path: 'live-demo-surface' },
    { id: 'comparison-surface', label: 'Feature Matrix', icon: 'compare_arrows', path: 'comparison-surface' },
    { id: 'download-surface', label: 'Starter Handoff', icon: 'download', path: 'download-surface' },
    { id: 'upgrade-surface', label: 'Upgrade Workspace', icon: 'bolt', path: 'upgrade-surface' },
    { id: 'app-detail-template', label: 'App Docs', icon: 'developer_board', path: 'app-detail-template' },
    { id: 'collaboration-showcase', label: 'Co-op Workspace', icon: 'group', path: 'collaboration-showcase' }
];

const template = (activePage) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${activePage.label} | AegisAlign EcoVerse</title>
    <link rel="stylesheet" href="/src/shell.css" />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1" rel="stylesheet" />
    <style>
      .page-list-section h3 { font-size: 11px; text-transform: uppercase; color: #8b8b8b; margin-bottom: 8px; letter-spacing: 0.05em; }
      .page-list a { display: flex; align-items: center; gap: 8px; padding: 6px 12px; font-size: 13px; color: #94a8ca; border-radius: 6px; transition: all 0.2s; }
      .page-list a:hover { background: rgba(255,255,255,0.03); color: #fff; }
      .page-list a.active { background: rgba(143, 133, 255, 0.15); color: #8f85ff; border: 1px solid rgba(143, 133, 255, 0.3); }
    </style>
  </head>
  <body class="domain-surface domain-aegis-application-lab">
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
            <a href="/custodian-ui/">Custodian Ops Center</a>
            <a class="active" href="/aegis-application-lab/">AEGIS Application Lab</a>
            <a href="/agent-workshop/">Agentic Workshop</a>
          </nav>
        </div>
      </header>

      <div class="shell">
        <aside class="panel sidebar">
          <h2>Application Lab</h2>
          <div class="page-sections">
            <section class="page-list-section">
                <h3>Navigation</h3>
                <nav class="page-list">
                  ${pages.map(p => `<a class="${p.id === activePage.id ? 'active' : ''}" href="/${section}/${p.path}/"><span class="material-symbols-outlined text-sm">${p.icon}</span> <span>${p.label}</span></a>`).join('\n')}
                </nav>
              </section>
          </div>
        </aside>

        <main class="panel content-wrap">
          <div class="content-head">
            <div>
              <h1>${activePage.label}</h1>
              <div class="breadcrumb">Application Lab / ${activePage.path}</div>
            </div>
          </div>
          
          <div class="iframe-wrap" style="flex: 1; display: flex; flex-direction: column;">
            <iframe class="stitch-frame" data-frame-role="active" title="${activePage.label}" src="/stitch/${section}/${activePage.path}/" loading="lazy" style="border: none; width: 100%; flex: 1; height: 100vh;"></iframe>
          </div>
        </main>
      </div>
    </div>
    
    <script>
      // Iframe height adjustment script
      const frame = document.querySelector('.stitch-frame');
      function adjustHeight() {
          if (frame && frame.contentWindow) {
              // Standard height adjustment or enforce 100%
          }
      }
      window.addEventListener('message', (e) => {
          if (e.data && e.data.type === 'resize' && e.data.height) {
              frame.style.height = e.data.height + 'px';
          }
      });
    </script>
  </body>
</html>`;

const outputDir = path.join(__dirname, 'generated', section);

pages.forEach(page => {
    const pageDir = path.join(outputDir, page.path);
    if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true });
    }
    const html = template(page);
    fs.writeFileSync(path.join(pageDir, 'index.html'), html);
    console.log(`Generated shell for ${page.label} at ${pageDir}`);
});

// Generate root index.html to redirect to home
const rootContent = `<!doctype html>
<html lang="en">
  <head>
    <meta http-equiv="refresh" content="0; url=/${section}/home/" />
    <script>window.location.replace("/${section}/home/");</script>
  </head>
  <body></body>
</html>`;
fs.writeFileSync(path.join(outputDir, 'index.html'), rootContent);
console.log(`Generated root redirect for ${section}`);
