import crypto from "node:crypto";
import fs from "node:fs";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#8212;", "—")
    .replaceAll("&#8217;", "’")
    .replaceAll("&#8220;", "“")
    .replaceAll("&#8221;", "”");
}

function toPlainText(value) {
  return decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim(),
  );
}

function getSection(html, heading) {
  const headingPattern = `<h2[^>]*>${escapeRegex(heading)}<\\/h2>`;
  const sectionPattern = new RegExp(
    `${headingPattern}([\\s\\S]*?)(?=<h2[^>]*>|<\\/body>)`,
    "i",
  );
  const match = html.match(sectionPattern);
  if (!match) {
    throw new Error(`Missing canon section: ${heading}`);
  }
  return match[1];
}

function extractAxioms(sectionHtml) {
  const axioms = [];
  const pattern = /<h3[^>]*><strong>(AXIOM\s+(\d+)\s+—\s+[^<]+)<\/strong><\/h3>\s*([\s\S]*?)<hr\/>/gi;
  let match;

  while ((match = pattern.exec(sectionHtml)) !== null) {
    const title = toPlainText(match[1]);
    const id = Number(match[2]);
    const text = toPlainText(match[3]);
    axioms.push({ id, title, text });
  }

  if (axioms.length !== 14) {
    throw new Error(`Expected 14 axioms, found ${axioms.length}.`);
  }

  return axioms;
}

function extractVirtues(sectionHtml) {
  const virtues = [];
  const pattern = /<li><p><strong>([^<]+)<\/strong>\s*—\s*([^<]+)<\/p><\/li>/gi;
  let match;

  while ((match = pattern.exec(sectionHtml)) !== null) {
    virtues.push({
      name: toPlainText(match[1]),
      definition: toPlainText(match[2]),
    });
  }

  if (virtues.length !== 7) {
    throw new Error(`Expected 7 virtues, found ${virtues.length}.`);
  }

  return virtues;
}

function extractListItems(sectionHtml) {
  const items = [];
  const pattern = /<li><p>([\s\S]*?)<\/p><\/li>/gi;
  let match;

  while ((match = pattern.exec(sectionHtml)) !== null) {
    items.push(toPlainText(match[1]));
  }

  return items;
}

export function buildCanonicalContract(canonHtml, sourcePath) {
  const axiomsSection = getSection(canonHtml, "THE AXIOM CANON (LOCKED)");
  const virtuesSection = getSection(canonHtml, "3. THE SEVEN VIRTUES OF INTEGRITY (LOCKED)");
  const ethosSection = getSection(canonHtml, "4. ETHOS (LOCKED)");
  const imperativesSection = getSection(canonHtml, "5. IMPERATIVES (LOCKED)");

  const axioms = extractAxioms(axiomsSection);
  const virtues = extractVirtues(virtuesSection);
  const ethos = extractListItems(ethosSection);
  const imperatives = extractListItems(imperativesSection);

  if (ethos.length !== 7) {
    throw new Error(`Expected 7 ethos statements, found ${ethos.length}.`);
  }
  if (imperatives.length !== 7) {
    throw new Error(`Expected 7 imperatives, found ${imperatives.length}.`);
  }

  const sha256 = crypto.createHash("sha256").update(canonHtml, "utf8").digest("hex");

  return {
    source: {
      path: sourcePath.replaceAll("\\", "/"),
      sha256,
    },
    lockedCanon: {
      axioms,
      virtues,
      ethos,
      imperatives,
    },
  };
}

export function loadCanonicalContract(canonHtmlPath, contractPath) {
  const canonHtml = fs.readFileSync(canonHtmlPath, "utf8");
  const expected = buildCanonicalContract(canonHtml, canonHtmlPath);

  if (!fs.existsSync(contractPath)) {
    throw new Error(`Missing canonical contract: ${contractPath}`);
  }

  const actual = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  return { expected, actual };
}
