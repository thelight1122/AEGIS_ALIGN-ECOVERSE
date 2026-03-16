import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const generatedRoot = path.join(repoRoot, "generated", "aegis-application-lab");

// Copy CSS file
const stitchOutDirRoot = path.join(repoRoot, "generated", "stitch", "aegis-application-lab");
if (!fs.existsSync(stitchOutDirRoot)) {
    fs.mkdirSync(stitchOutDirRoot, { recursive: true });
}
const cssSource = path.join(repoRoot, "src", "custom-stitch-pages", "aegis-application-lab", "application-lab.css");
if (fs.existsSync(cssSource)) {
    fs.copyFileSync(cssSource, path.join(stitchOutDirRoot, "application-lab.css"));
}


// 1. Define the 8 Upgraded Pages
const upgradedPages = [
    { title: "Application Lab Home", slug: "home", sourceDir: "home", category: "Explore" },
    { title: "Apps Overview", slug: "apps-overview", sourceDir: "implementation-apps-overview", category: "Explore" },
    { title: "Live Demo Surface", slug: "live-demo", sourceDir: "live-demo-surface", category: "Demos" },
    { title: "Feature Comparison", slug: "feature-comparison", sourceDir: "feature-comparison-surface", category: "Demos" },
    { title: "Starter Download", slug: "starter-download", sourceDir: "starter-download-surface", category: "Kits" },
    { title: "Full System Upgrade", slug: "full-system-upgrade", sourceDir: "full-system-upgrade-surface", category: "Kits" },
    { title: "App Detail Template", slug: "app-detail", sourceDir: "app-detail-template", category: "Templates" },
    { title: "Collaboration Showcase", slug: "collaboration-showcase", sourceDir: "collaboration-multi-agent-showcase", category: "Templates" }
];


// 2. Load Base Template (From existing sync outputs for valid styling/scripts)
const baseTemplatePath = path.join(generatedRoot, "aegis-implementation-apps", "index.html");
if (!fs.existsSync(baseTemplatePath)) {
    console.error("Base template not found in generated outputs. Run sync-stitch first.");
    process.exit(1);
}
let baseTemplate = fs.readFileSync(baseTemplatePath, "utf-8");

// 3. Reconstruct Sidebar Navigation
const buildSidebar = (activeSlug) => {
    let sidebarHtml = `<h2>AEGIS Application Lab</h2>
    <div class="page-sections">`;
    
    // Group by category
    const categories = ["Explore", "Demos", "Kits", "Templates"];
    for (const cat of categories) {
        sidebarHtml += `<section class="page-list-section">
            <h3>${cat}</h3>
            <nav class="page-list">`;
        const categoryPages = upgradedPages.filter(p => p.category === cat);
        for (const p of categoryPages) {
            const activeClass = p.slug === activeSlug ? "active" : "";
            sidebarHtml += `<a class="${activeClass}" data-page-link href="/aegis-application-lab/${p.slug}/">${p.title}</a>\n`;
        }
        sidebarHtml += `</nav></section>\n`;
    }
    sidebarHtml += `</div>`;
    return sidebarHtml;
};

// 4. Generate Wrappers for Each Page
for (const p of upgradedPages) {
    const pageDir = path.join(generatedRoot, p.slug);
    if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true });
    }

    let pageHtml = baseTemplate;

    // A. Update Title
    pageHtml = pageHtml.replace(/<title>.*?<\/title>/, `<title>${p.title} | AEGIS Application Lab</title>`);

    // B. Inject Custom Sidebar
    const sidebarRegex = /<aside class="panel sidebar">([\s\S]*?)<\/aside>/;
    const newSidebar = `<aside class="panel sidebar">${buildSidebar(p.slug)}</aside>`;
    pageHtml = pageHtml.replace(sidebarRegex, newSidebar);

    // C. Update Breadcrumb
    pageHtml = pageHtml.replace(/<div class="breadcrumb">.*?<\/div>/, `<div class="breadcrumb">AEGIS Application Lab / ${p.slug}</div>`);
    pageHtml = pageHtml.replace(/<h1>.*?<\/h1>/, `<h1>${p.title}</h1>`);

    // D. Update Iframe Source & Disable Scrolling
    const iframeRegex = /<iframe class="stitch-frame"[\s\S]*?src=".*?"/;
    const newIframeAttr = `<iframe class="stitch-frame" data-frame-role="active" title="${p.title}" src="/stitch/aegis-application-lab/${p.slug}/" scrolling="no"`;
    pageHtml = pageHtml.replace(iframeRegex, newIframeAttr);

    // E. Make Iframe Height Calculation Robust (0px measuring trick)
    const heightRegex = /const measuredHeights = [\s\S]*?const contentHeight = Math\.max\(\.\.\.measuredHeights\);/;
    const newHeightCalc = `// collapse to measure natural height
            frame.style.height = '0px';
            const contentHeight = doc.documentElement.scrollHeight;`;
    pageHtml = pageHtml.replace(heightRegex, newHeightCalc);



    fs.writeFileSync(path.join(pageDir, "index.html"), pageHtml);

    // E. Copy Inner Page Content
    const stitchOutDir = path.join(repoRoot, "generated", "stitch", "aegis-application-lab", p.slug);
    if (!fs.existsSync(stitchOutDir)) {
        fs.mkdirSync(stitchOutDir, { recursive: true });
    }
    const sourceInnerPage = path.join(repoRoot, "src", "custom-stitch-pages", "aegis-application-lab", p.sourceDir, "index.html");
    if (fs.existsSync(sourceInnerPage)) {
        fs.copyFileSync(sourceInnerPage, path.join(stitchOutDir, "index.html"));
    }

    console.log(`Generated shell for: ${p.slug}`);
}


// 5. Update Root Index Redirect
const rootIndex = path.join(generatedRoot, "index.html");
if (fs.existsSync(rootIndex)) {
    let rootHtml = fs.readFileSync(rootIndex, "utf-8");
    rootHtml = rootHtml.replaceAll("/aegis-application-lab/aegis-implementation-apps/", "/aegis-application-lab/home/");
    fs.writeFileSync(rootIndex, rootHtml);
    console.log("Updated root index redirect to /home/");
}
