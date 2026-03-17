import fs from 'fs';
import path from 'path';

const cssPath = path.join(process.cwd(), 'src', 'index.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

const definedClasses = new Set();
const classRegex = /\.([a-zA-Z0-9_\-]+)(?::[a-zA-Z0-9_\-]+)?\s*[,{]/g;
let match;
while ((match = classRegex.exec(cssContent)) !== null) {
    definedClasses.add(match[1]);
}

const usedClasses = new Set();

function findTsxFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(findTsxFiles(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const tsxFiles = findTsxFiles(path.join(process.cwd(), 'src'));
const classUsageRegex = /className=(?:"([^"]+)"|'([^']+)'|{`([^`]+)`})/g;

tsxFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = classUsageRegex.exec(content)) !== null) {
        const classStr = match[1] || match[2] || match[3] || '';
        classStr.split(/\s+/).forEach(cls => {
            cls = cls.trim();
            if (cls && !cls.includes('${') && !cls.startsWith('[') && !cls.includes(':') && !cls.includes('/') && !cls.includes(']')) {
                usedClasses.add(cls);
            }
        });
    }
});

const missingClasses = Array.from(usedClasses).filter(cls => !definedClasses.has(cls));
let output = '--- Missing Classes ---\n';
output += missingClasses.join('\n') + '\n';

// Find occurrences
const classBlocks = {};
const blockRegex = /\.([a-zA-Z0-9_\-]+)\s*{([^}]+)}/g;
let bMatch;

while ((bMatch = blockRegex.exec(cssContent)) !== null) {
    const className = bMatch[1];
    const rules = bMatch[2].trim().split(';').map(r => r.trim()).filter(r => r).sort().join(';');
    if (!classBlocks[rules]) {
        classBlocks[rules] = [];
    }
    classBlocks[rules].push(className);
}

output += '\n--- Duplicate Style Blocks ---\n';
Object.values(classBlocks).forEach(names => {
    if (names.length > 1) {
        output += `Duplicate block shared by: ${names.join(', ')}\n`;
    }
});

const occurrences = {};
const simpleClassRegex = /\.([a-zA-Z0-9_\-]+)\s*{/g;
let cMatch;
while ((cMatch = simpleClassRegex.exec(cssContent)) !== null) {
    occurrences[cMatch[1]] = (occurrences[cMatch[1]] || 0) + 1;
}

output += '\n--- Multiply Defined Classes ---\n';
Object.entries(occurrences).forEach(([cls, count]) => {
    if (count > 1) {
        output += `${cls} is defined ${count} times.\n`;
    }
});

fs.writeFileSync('analysis_result.txt', output, 'utf8');
console.log('Done writing utf8 file');
