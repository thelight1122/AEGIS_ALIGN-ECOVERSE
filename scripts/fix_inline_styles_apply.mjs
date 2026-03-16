import fs from 'fs';
import path from 'path';

const rootDir = 'i:\\AEGIS_ALIGN-ECOVERSE\\src\\custom-stitch-pages';

// Mappings of exact style strings to class names
const styleToClass = {
  "color:var(--accent-purple); margin-top:0;": "profile-title",
  "color:rgba(255,255,255,0.5);": "profile-subtitle"
};

// CSS rules to append to profile-workspace.css
const profileCss = `
/* Added for inline style migration */
.profile-title { color: var(--accent-purple) !important; margin-top: 0 !important; }
.profile-subtitle { color: rgba(255,255,255,0.5) !important; }
`;

function processFiles() {
    // 1. Update profile-workspace.css
    const profileCssPath = path.join(rootDir, 'peer-profile', 'profile-workspace.css');
    if (fs.existsSync(profileCssPath)) {
        let cssContent = fs.readFileSync(profileCssPath, 'utf8');
        if (!cssContent.includes('.profile-title')) {
            fs.appendFileSync(profileCssPath, profileCss);
            console.log('Updated profile-workspace.css');
        }
    }

    // 2. Process Peer Profile HTML files
    const peerDirs = [
        'developer-connect', 'home', 'identity-trust', 
        'perks-benefits', 'saved-systems', 'settings', 'subscription-access'
    ];

    peerDirs.forEach(dir => {
        const filePath = path.join(rootDir, 'peer-profile', dir, 'index.html');
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            
            // Replace style with class
            content = content.replace(/style="color:var\(--accent-purple\); margin-top:0;"/g, 'class="profile-title"');
            content = content.replace(/style="color:rgba\(255,255,255,0\.5\);"/g, 'class="profile-subtitle"');
            
            fs.writeFileSync(filePath, content);
            console.log(`Updated ${dir}/index.html`);
        }
    });
}

processFiles();
