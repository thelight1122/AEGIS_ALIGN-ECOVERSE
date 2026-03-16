import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const rootDir = 'i:\\AEGIS_ALIGN-ECOVERSE\\src\\custom-stitch-pages';

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; 
    }
    return Math.abs(hash).toString(36);
}

async function main() {
    const jsonPath = path.join(repoRoot, 'inline_styles.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('Missing inline_styles.json');
        return;
    }

    const inlineStyles = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const sectionCss = {
        'aegis-application-lab': {
            file: 'application-lab.css',
            appended: ''
        },
        'custodian-ops-center': {
            file: 'custodian-ops.css',
            appended: ''
        }
    };

    // Track assigned classes to avoid duplicates
    const assignedClasses = new Map(); // style -> class

    for (const [styleRule, files] of Object.entries(inlineStyles)) {
        // Skip styles that are dynamic meter bars (already handled or too specific)
        if (styleRule.includes('width:') && styleRule.includes('background:')) {
            // Some might be static, but let's process them if they aren't meter bars
            if (styleRule.includes('meter-bar')) continue; 
        }

        const cleanRule = styleRule.trim();
        const hash = hashCode(cleanRule);
        const className = `u-fx-${hash}`;

        // Group files by section
        const sectionFiles = {
             'aegis-application-lab': [],
             'custodian-ops-center': []
        };

        files.forEach(file => {
             if (file.includes('aegis-application-lab')) {
                 sectionFiles['aegis-application-lab'].push(file);
             } else if (file.includes('custodian-ops-center')) {
                 sectionFiles['custodian-ops-center'].push(file);
             }
        });

        // Apply rules
        for (const [section, list] of Object.entries(sectionFiles)) {
             if (list.length === 0) continue;

             const cssObj = sectionCss[section];
             if (!cssObj.appended.includes(`.${className}`)) {
                 cssObj.appended += `\n.${className} { ${cleanRule.replace(/!important/g, '')} !important; }`;
             }

             // Update HTML files
             list.forEach(relFile => {
                 const absPath = path.join(rootDir, relFile);
                 if (!fs.existsSync(absPath)) return;

                 let content = fs.readFileSync(absPath, 'utf8');
                 let modified = false;

                 // Regex to match starting tag up to style
                 // We want to match exactly style="cleanRule"
                 const escapedRule = cleanRule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                 const styleRegex = new RegExp(`(<[a-z0-9]+[^>]*)\\bstyle=["']${escapedRule}["']([^>]*)`, 'gi');

                 content = content.replace(styleRegex, (match, beforeStyle, afterStyle) => {
                     modified = true;
                     
                     // Check if beforeStyle or afterStyle has class attribute
                     const classRegex = /class=["']([^"']+)["']/i;
                     const classMatch = beforeStyle.match(classRegex) || afterStyle.match(classRegex);

                     if (classMatch) {
                         const existingClasses = classMatch[1];
                         if (existingClasses.includes(className)) {
                              return match; // Already applied
                         }
                         // Replace in the side it was found
                         if (beforeStyle.match(classRegex)) {
                             const updatedBefore = beforeStyle.replace(classRegex, `class="${existingClasses} ${className}"`);
                             return `${updatedBefore}${afterStyle}`;
                         } else {
                             const updatedAfter = afterStyle.replace(classRegex, `class="${existingClasses} ${className}"`);
                             return `${beforeStyle}${updatedAfter}`;
                         }
                     } else {
                         // No class found, add it
                         return `${beforeStyle}class="${className}"${afterStyle}`;
                     }
                 });

                 if (modified) {
                     fs.writeFileSync(absPath, content);
                     console.log(`[${section}] Updated ${relFile}`);
                 }
             });
        }
    }

    // Append to CSS files
    for (const [section, obj] of Object.entries(sectionCss)) {
        if (obj.appended) {
             const cssPath = path.join(rootDir, section, obj.file);
             if (fs.existsSync(cssPath)) {
                 fs.appendFileSync(cssPath, `\n\n/* Automated Inline Style Migration */${obj.appended}`);
                 console.log(`Updated ${cssPath}`);
             } else {
                 console.warn(`CSS file not found: ${cssPath}`);
             }
        }
    }

    console.log('Automated style migration finished.');
}

main().catch(console.error);
