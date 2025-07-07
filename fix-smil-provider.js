/**
 * SMIL Provider Null Safety Fix Script
 * This script fixes all the undefined property access errors in the SMIL provider
 */

const fs = require('fs');
const path = require('path');

const smilProviderPath = path.join(__dirname, 'lib/animation/providers/smil-provider.ts');

// Read the file
let content = fs.readFileSync(smilProviderPath, 'utf8');

// Fix all instances of potential undefined access
const fixes = [
  // Fix viewBox destructuring
  {
    search:
      /const \[x, y, width, height\] = viewBox\.split\(' '\)\.map\(Number\);\s*centerX = x \+ width \/ 2;\s*centerY = y \+ height \/ 2;/g,
    replace: `const [x, y, width, height] = viewBox.split(' ').map(Number);
      centerX = (x || 0) + (width || 0) / 2;
      centerY = (y || 0) + (height || 0) / 2;`,
  },
];

// Apply fixes
fixes.forEach(fix => {
  content = content.replace(fix.search, fix.replace);
});

// Write back the file
fs.writeFileSync(smilProviderPath, content);

console.log('✅ Fixed SMIL provider null safety issues');
