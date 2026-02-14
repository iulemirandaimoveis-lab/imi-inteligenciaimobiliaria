const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Replace 1: rounded-[32px] -> rounded-3xl
    if (content.includes('rounded-[32px]')) {
        content = content.replace(/rounded-\[32px\]/g, 'rounded-3xl');
        changed = true;
    }

    // Replace 2: rounded-[2rem] -> rounded-3xl
    if (content.includes('rounded-[2rem]')) {
        content = content.replace(/rounded-\[2rem\]/g, 'rounded-3xl');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== '.next') {
                walkDir(filePath);
            }
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.css')) {
            replaceInFile(filePath);
        }
    });
}

// Executar nas pastas do projeto
const targetDirs = ['./src', './app', './components'];
targetDirs.forEach(dir => {
    console.log(`Searching in ${dir}...`);
    walkDir(dir);
});

console.log('✅ Radius normalization complete!');
