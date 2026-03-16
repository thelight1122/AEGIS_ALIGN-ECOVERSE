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
    // Match inputs and textareas
    let inputRegex = /<(input|textarea|select)([^>]+)>/gsi;
    let match;
    while ((match = inputRegex.exec(content)) !== null) {
        const tag = match[1].toLowerCase();
        const attrs = match[2];
        
        // Skip hidden inputs
        if (/type=["']hidden["']/i.test(attrs)) continue;
        
        // Check for id
        const idMatch = attrs.match(/id=["']([^"']+)["']/i);
        const id = idMatch ? idMatch[1] : null;
        
        // Check for aria-label or title
        const hasAria = /aria-label=/i.test(attrs);
        const hasTitle = /title=/i.test(attrs);
        const hasPlaceholder = /placeholder=/i.test(attrs);
        
        // Check for associated label if id exists
        let hasLabel = false;
        if (id) {
            const labelRegex = new RegExp(`<label[^>]+for=["']${id}["'][^>]*>`, 'i');
            hasLabel = labelRegex.test(content);
        }
        
        if (!hasLabel && !hasAria && !hasTitle && !hasPlaceholder) {
            issues.push({
                file: file.replace(rootDir, ''),
                tag: tag,
                id: id || 'No ID',
                attrs: attrs.trim()
            });
        }
    }
});

console.log(JSON.stringify(issues, null, 2));
