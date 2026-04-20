import fs from 'fs';
import path from 'path';

const rootDir = 'i:\\AEGIS_ALIGN-ECOVERSE\\src\\custom-stitch-pages';

const meterStyles = new Map();

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

function processSection(sectionDir, cssFile) {
    const dirPath = path.join(rootDir, sectionDir);
    const files = walk(dirPath);
    let appendedCss = '';

    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        // 1. Meter Bars regex
        // Match style="width: [^;]+; background: [^;]+;"
        content = content.replace(/style="width:\s*([^;]+);\s*background:\s*([^;]+);"/g, (match, width, bg) => {
            modified = true;
            const cleanWidth = width.replace('%', '').replace('.', '_').trim();
            const cleanBg = bg
                .trim()
                .replace('var(--ops-', '')
                .replace(')', '')
                .replace('#', 'color-')
                .replace(/\./g, '_')
                .replace(/[^a-zA-Z0-9_-]+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            const className = `meter-w${cleanWidth}-${cleanBg}`;
            
            if (!meterStyles.has(className)) {
                meterStyles.set(className, { width, bg });
                appendedCss += `\n.${className} { width: ${width} !important; background: ${bg} !important; }`;
            }
            return `class="meter-bar-inner ${className}"`;
        });

        // 2. Specific styles mapped to semantic classes for static pages
        const staticMappings = {
            'margin: 20px 0;': 'margin-y-20',
            'font-size: 3.5rem; margin: 20px 0;': 'ops-icon-hero',
            'margin-top: 25px;': 'margin-top-25',
            'font-size: 4rem; opacity: 0.8;': 'ops-profile-icon',
            'font-weight: 600; font-size: 0.9rem;': 'text-semibold-sm',
            'font-size: 0.75rem; color: rgba(255,255,255,0.4);': 'text-muted-xs',
            'margin-bottom: 5px;': 'margin-bottom-5',
            'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;': 'download-item-card',
            'margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.4);': 'download-item-sub',
            'margin-top: 20px;': 'margin-top-20'
        };

        for (const [style, className] of Object.entries(staticMappings)) {
            // Check if style exists
            if (content.includes(`style="${style}"`)) {
                modified = true;
                // Add to CSS if not already there (we'll assume or append)
                // Append CSS logic for these simple utilities
                if (!appendedCss.includes(`.${className}`)) {
                    if (className === 'download-item-card') {
                        appendedCss += `\n.download-item-card { background: rgba(255,255,255,0.02) !important; border: 1px solid rgba(255,255,255,0.05) !important; border-radius: 8px !important; padding: 15px !important; margin-bottom: 10px !important; display: flex !important; justify-content: space-between !important; align-items: center !important; }`;
                    } else if (className === 'ops-icon-hero') {
                         appendedCss += `\n.ops-icon-hero { font-size: 3.5rem !important; margin: 20px 0 !important; }`;
                    } else if (className === 'ops-profile-icon') {
                         appendedCss += `\n.ops-profile-icon { font-size: 4rem !important; opacity: 0.8 !important; }`;
                    } else {
                        appendedCss += `\n.${className} { ${style.replace('!important', '')} }`; // safety
                    }
                }
                content = content.replace(`style="${style}"`, `class="${className}"`);
            }
        }

        if (modified) {
            fs.writeFileSync(file, content);
            console.log(`Updated ${file.replace(rootDir, '')}`);
        }
    });

    // Append to CSS file
    const cssPath = path.join(rootDir, sectionDir, cssFile);
    if (fs.existsSync(cssPath) && appendedCss) {
        fs.appendFileSync(cssPath, `\n\n/* Added for inline style migration */${appendedCss}`);
        console.log(`Updated ${cssFile}`);
    }
}

processSection('custodian-ops-center', 'custodian-ops.css');
processSection('aegis-application-lab', 'application-lab.css');

console.log('Finished applying style fixes to Ops and Lab sections.');
