import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const generatedRoot = path.join(repoRoot, "generated", "aegis-application-lab");

// 1. Define the 8 Upgraded Pages
const upgradedPages = [
    { title: "Application Lab Home", slug: "home", category: "Explore" },
    { title: "Apps Overview", slug: "apps-overview", category: "Explore" },
    { title: "Live Demo Surface", slug: "live-demo", category: "Demos" },
    { title: "Feature Comparison", slug: "feature-comparison", category: "Demos" },
    { title: "Starter Download", slug: "starter-download", category: "Kits" },
    { title: "Full System Upgrade", slug: "full-system-upgrade", category: "Kits" },
    { title: "App Detail Template", slug: "app-detail", category: "Templates" },
    { title: "Collaboration Showcase", slug: "collaboration-showcase", category: "Templates" }
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

    // D. Update Iframe Source
    const iframeRegex = /<iframe class="stitch-frame"[\s\S]*?src=".*?"/;
    const newIframeAttr = `<iframe class="stitch-frame" data-frame-role="active" title="${p.title}" src="/stitch/aegis-application-lab/${p.slug}/"`;
    pageHtml = pageHtml.replace(iframeRegex, newIframeAttr);

    fs.writeFileSync(path.join(pageDir, "index.html"), pageHtml);
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
