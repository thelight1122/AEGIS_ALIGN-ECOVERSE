import fs from 'fs';
import path from 'path';

const dir = 'i:\\AEGIS_ALIGN-ECOVERSE\\generated';

function walk(dir) {
    if (!fs.existsSync(dir)) return [];
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

const buttonIssues = [];
const styleIssues = [];

const htmlFiles = walk(dir);
htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check buttons
    const buttonRegex = /<button([^>]+)>(.*?)<\/button>/gs;
    let match;
    while ((match = buttonRegex.exec(content)) !== null) {
        const attrs = match[1];
        const innerHTML = match[2];
        const textContent = innerHTML.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').trim();
        const hasAriaLabel = attrs.includes('aria-label=') || attrs.includes('title=');
        
        if (textContent === '' && !hasAriaLabel) {
            buttonIssues.push({
                file: file.replace('i:\\AEGIS_ALIGN-ECOVERSE\\generated', ''),
                innerHTML: innerHTML.trim(),
                attrs: attrs.trim()
            });
        }
    }
    
    // Check inline styles
    const styleRegex = /style\s*=\s*["']([^"']+)["']/gi;
    if (styleRegex.test(content)) {
        const matches = content.match(styleRegex);
        styleIssues.push({
            file: file.replace('i:\\AEGIS_ALIGN-ECOVERSE\\generated', ''),
            styles: matches
        });
    }
});

fs.writeFileSync('i:\\AEGIS_ALIGN-ECOVERSE\\button_issues_generated.json', JSON.stringify(buttonIssues, null, 2));
fs.writeFileSync('i:\\AEGIS_ALIGN-ECOVERSE\\style_issues_generated.json', JSON.stringify(styleIssues, null, 2));

console.log(`Found ${buttonIssues.length} button issues in generated.`);
console.log(`Found ${styleIssues.length} files with inline styles in generated.`);
