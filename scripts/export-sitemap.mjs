import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const manifestPath = path.join(repoRoot, "generated", "route-manifest.json");
const publicDir = path.join(repoRoot, "public");
const csvPath = path.join(publicDir, "sitemap-routes.csv");
const xmlPath = path.join(publicDir, "sitemap.xml");

const baseUrl = (process.env.SITE_URL || "https://aegisalign.com").replace(/\/+$/, "");
const nowIso = new Date().toISOString();

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

if (!fs.existsSync(manifestPath)) {
  throw new Error("Missing generated/route-manifest.json. Run npm run sync:stitch first.");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (!Array.isArray(manifest) || manifest.length === 0) {
  throw new Error("Route manifest is empty.");
}

fs.mkdirSync(publicDir, { recursive: true });

const routes = ["/", ...manifest.map((item) => item.routePath)];

const csvLines = ["path,url,domain,slug,title"];
csvLines.push(`/,${baseUrl}/,root,home,Home`);
for (const item of manifest) {
  const url = `${baseUrl}${item.routePath}`;
  const title = String(item.title || "").replaceAll("\"", "\"\"");
  csvLines.push(`${item.routePath},${url},${item.domain},${item.slug},"${title}"`);
}
fs.writeFileSync(csvPath, `${csvLines.join("\n")}\n`, "utf8");

const xmlEntries = routes
  .map((route) => {
    const loc = `${baseUrl}${route}`;
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === "/" ? "1.0" : "0.7"}</priority>
  </url>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;
fs.writeFileSync(xmlPath, xml, "utf8");

console.log(`Wrote ${csvPath}`);
console.log(`Wrote ${xmlPath}`);
console.log(`Routes exported: ${routes.length}`);
