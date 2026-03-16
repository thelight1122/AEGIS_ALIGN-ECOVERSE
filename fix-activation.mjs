import fs from 'node:fs';

const file = 'src/developer-depot-activation.js';
let content = fs.readFileSync(file, 'utf-8');

// Regex to find the broken block:
// endpointUrl?.scrollIntoView(...);
// });
// deleteButtons.forEach
const regex = /(endpointUrl\?\.scrollIntoView\(\{ behavior: "smooth", block: "center" \}\);)\s*\}\);\s*(deleteButtons\.forEach)/;

if (regex.test(content)) {
  content = content.replace(regex, '$1\n  }));\n  $2');
  fs.writeFileSync(file, content);
  console.log("Successfully fixed syntax error in developer-depot-activation.js");
} else {
  console.error("Regex did not match. Printing context around 1284:");
  const lines = content.split('\n');
  for(let i = 1280; i < 1290; i++) {
    console.log(`${i}: ${lines[i]}`);
  }
}
