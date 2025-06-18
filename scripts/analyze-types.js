#!/usr/bin/env node

// This script analyzes TypeScript files for any types and generates recommended interfaces

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Output file for the report
const outputFile = path.join(__dirname, '..', 'type-analysis-report.md');

console.log('Analyzing TypeScript files for any types...');

// Find all files with any type
try {
  // Use grep to find all instances of ': any' or 'any[]' or 'Array<any>'
  const grepCommand = "grep -r --include='*.ts' --include='*.tsx' -E '(: any|any\\[\\]|Array<any>|<any,|,any>|<any>)' --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=app-backup --exclude-dir=app-consolidated .";
  
  const result = execSync(grepCommand, { encoding: 'utf-8' });
  
  // Parse the results
  const lines = result.split('\n').filter(Boolean);
  
  // Group by file
  const fileMatches = {};
  
  lines.forEach(line => {
    const [filePath, ...contentParts] = line.split(':');
    const content = contentParts.join(':');
    
    if (!fileMatches[filePath]) {
      fileMatches[filePath] = [];
    }
    
    fileMatches[filePath].push(content.trim());
  });
  
  // Generate report
  let report = '# TypeScript Any Types Analysis\n\n';
  report += 'This report identifies all usages of `any` types in the codebase that should be replaced with proper types.\n\n';
  
  Object.entries(fileMatches).forEach(([file, matches]) => {
    report += `## ${file}\n\n`;
    report += '```typescript\n';
    matches.forEach(match => {
      report += match + '\n';
    });
    report += '```\n\n';
    
    // Try to suggest proper types based on the context
    report += '### Suggested Improvements\n\n';
    report += '- Consider creating proper interfaces for these any types\n';
    report += '- For API responses, use Zod schemas to validate and type the data\n';
    report += '- Use `unknown` instead of `any` when the type is truly dynamic, then use type guards\n\n';
  });
  
  // Add recommendation section
  report += '## General Recommendations\n\n';
  report += '1. Create a central `types.ts` file for each module with shared interfaces\n';
  report += '2. Use utility types like `Partial<T>`, `Pick<T>`, and `Omit<T>` when appropriate\n';
  report += '3. Use generics for flexible, type-safe components and functions\n';
  report += '4. Implement proper error handling with typed error objects\n\n';
  
  // Write report to file
  fs.writeFileSync(outputFile, report);
  
  console.log(`Analysis complete. Found ${lines.length} instances of 'any' types in ${Object.keys(fileMatches).length} files.`);
  console.log(`Report written to ${outputFile}`);
  
} catch (error) {
  console.error('Error analyzing types:', error);
}