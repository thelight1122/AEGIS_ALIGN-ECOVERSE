import fs from 'fs';
import path from 'path';

const rootDir = 'i:\\AEGIS_ALIGN-ECOVERSE\\src\\custom-stitch-pages';

function walk(dir, ext = '.html') {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file, ext));
        } else { 
            if (file.endsWith(ext)) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(rootDir);
const issues = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Regex to match buttons
    let buttonRegex = /<button([^>]+)>(.*?)<\/button>/gs;
    let match;
    while ((match = buttonRegex.exec(content)) !== null) {
        const attrs = match[1];
        const innerHTML = match[2].trim();
        
        // Check if button has aria-label or title
        const hasAria = /aria-label=/i.test(attrs);
        const hasTitle = /title=/i.test(attrs);
        
        // If it has text content, it's usually fine (unless it's just spaces)
        // Check if innerHTML is just an icon tag or empty
        const isIconOnly = /^<i\s+class="[^"]+"><\/i>$/i.test(innerHTML) || innerHTML === '';
        
        if (isIconOnly && !hasAria && !hasTitle) {
            issues.push({
                file: file.replace(rootDir, ''),
                innerHTML: innerHTML,
                attrs: attrs.trim()
            });
        }
    }
});

console.log(JSON.stringify(issues, null, 2));
