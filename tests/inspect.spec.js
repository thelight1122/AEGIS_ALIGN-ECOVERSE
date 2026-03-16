import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const generatedDir = path.resolve(__dirname, "../generated/aegis-application-lab");
const outputArtifact = path.resolve(__dirname, "../interactive_elements.md");

test("Survey and Click elements", async ({ page }) => {
  const results = [];

  const pages = [
    { name: "Home", rel: "home/index.html" },
    { name: "Apps Overview", rel: "apps-overview/index.html" },
    { name: "Live Demo Surface", rel: "live-demo-surface/index.html" },
    { name: "Feature Comparison", rel: "comparison-surface/index.html" },
    { name: "Starter Download", rel: "download-surface/index.html" },
    { name: "Full System Upgrade", rel: "upgrade-surface/index.html" },
    { name: "App Detail Template", rel: "app-detail-template/index.html" },
    { name: "Collaboration Showcase", rel: "collaboration-showcase/index.html" }
  ];

  for (const pageInfo of pages) {
    const filePath = path.join(generatedDir, pageInfo.rel);
    if (!fs.existsSync(filePath)) {
       results.push({ page: pageInfo.name, error: "File not found: " + filePath });
       continue;
    }

    const fileUrl = `file:///${filePath.replace(/\\/g, "/")}`;
    await page.goto(fileUrl, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500); // Wait for framing

    const pageData = {
      page: pageInfo.name,
      shellElements: [],
      iframeElements: []
    };

    // 1. Get Shell Elements
    const shellButtons = await page.$$eval("button, a, [role='button']", (elements) => {
      return elements.map(el => ({
        tagName: el.tagName,
        text: el.innerText.trim() || el.title || el.getAttribute("aria-label") || "Unnamed",
        id: el.id || "None",
        classes: el.className || "None"
      }));
    });
    pageData.shellElements = shellButtons;

    // 2. Access iframe
    const frames = page.frames();
    const contentFrame = frames.find(f => f.name() !== "index.html" && f !== page.mainFrame());
         
    if (contentFrame) {
         const iframeButtons = await contentFrame.$$eval("button, a, [role='button'], input[type='range'], input[type='checkbox']", (elements) => {
            return elements.map(el => {
               let text = el.innerText.trim();
               if (!text) {
                  if (el.tagName === 'INPUT') text = `${el.type} (${el.value})`;
                  else text = el.title || el.getAttribute("aria-label") || 'Unnamed Control';
               }
               return {
                 tagName: el.tagName,
                 text: text,
                 id: el.id || "None",
                 classes: el.className || "None"
               };
            });
         });
         pageData.iframeElements = iframeButtons;
    } else {
         pageData.iframeElements = [];
    }

    results.push(pageData);
  }

  // Generate Markdown
  let md = "# Interactive Elements Survey - AEGIS Application Lab\n\n";
  
  for (const res of results) {
    md += `## ${res.page}\n`;
    if (res.error) {
      md += `> [!WARNING]\n> ${res.error}\n\n`;
      continue;
    }

    md += `\n### Shell Wrappers / Sidebar Controls\n`;
    if (res.shellElements.length === 0) {
      md += `*No interactive elements found in shell.*\n`;
    } else {
      md += `| Tag | Label / Text | ID | Classes |\n|---|---|---|---|\n`;
      for (const el of res.shellElements) {
         md += `| \`${el.tagName}\` | ${el.text} | \`${el.id}\` | \`${el.classes}\` |\n`;
      }
    }

    md += `\n### Inner Frame Controls (Stitch content)\n`;
    if (res.iframeElements.length === 0) {
      md += `*No interactive elements found in iframe.*\n`;
    } else {
      md += `| Tag | Label / Text | ID | Classes |\n|---|---|---|---|\n`;
      for (const el of res.iframeElements) {
         md += `| \`${el.tagName}\` | ${el.text} | \`${el.id}\` | \`${el.classes}\` |\n`;
      }
    }
    md += `\n---\n\n`;
  }

  fs.writeFileSync(outputArtifact, md);
});
