import fs from 'node:fs';
const text = fs.readFileSync('scripts/sync-stitch.mjs', 'utf8');
const lines = text.split('\n');
const out = [];
lines.forEach((l, i) => {
  if (l.includes('stitchRoot') || l.includes('generatedRoot') || l.includes('domains')) {
    out.push(`${i+1}: ${l.trim()}`);
  }
});
fs.writeFileSync('search_results.txt', out.join('\n'));
console.log("Done writing search_results.txt");
