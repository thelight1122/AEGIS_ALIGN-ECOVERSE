import fs from 'fs';
import path from 'path';

const dir = 'i:\\AEGIS_ALIGN-ECOVERSE\\src\\custom-stitch-pages';

function walk(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.html')) {
                results.push(file);
            }
        }
    });
    return results;
}

const htmlFiles = walk(dir);
const issues = [];

htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    // Match buttons
    const buttonRegex = /<button([^>]+)>(.*?)<\/button>/gs;
    let match;
    while ((match = buttonRegex.exec(content)) !== null) {
        const attrs = match[1];
        const innerHTML = match[2];
        
        // Check if button has text inside (not just icon or whitespace)
        const textContent = innerHTML.replace(/<[^>]+>/g, '').trim();
        const hasAriaLabel = attrs.includes('aria-label=') || attrs.includes('title=');
        
        if (textContent === '' && !hasAriaLabel) {
            issues.push({
                file: file.replace('i:\\AEGIS_ALIGN-ECOVERSE\\src\\custom-stitch-pages', ''),
                innerHTML: innerHTML.trim(),
                attrs: attrs.trim()
            });
        }
    }
});

fs.writeFileSync('i:\\AEGIS_ALIGN-ECOVERSE\\button_issues_current.json', JSON.stringify(issues, null, 2));
console.log(`Found ${issues.length} issues. Saved to button_issues_current.json`);
