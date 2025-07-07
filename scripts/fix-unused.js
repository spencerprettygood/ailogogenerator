#!/usr/bin/env node

// This script identifies and helps fix unused variables in the codebase

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Output file for the report
const outputFile = path.join(__dirname, '..', 'unused-vars-report.md');

console.log('Analyzing codebase for unused variables...');

// Find all files with unused variables
try {
  // Use eslint to find unused variables
  const eslintCommand =
    "npx eslint . --ext .js,.jsx,.ts,.tsx --rule 'no-unused-vars: error' --rule '@typescript-eslint/no-unused-vars: error' --format json";

  const result = execSync(eslintCommand, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });

  // Parse the results
  const eslintResults = JSON.parse(result);

  // Filter for unused variables only
  const unusedVarsResults = eslintResults.filter(file =>
    file.messages.some(
      msg => msg.ruleId === 'no-unused-vars' || msg.ruleId === '@typescript-eslint/no-unused-vars'
    )
  );

  // Generate report
  let report = '# Unused Variables Analysis\n\n';
  report +=
    'This report identifies all unused variables in the codebase that should be addressed.\n\n';

  let totalUnused = 0;

  unusedVarsResults.forEach(file => {
    const filePath = file.filePath;
    const relativeFilePath = path.relative(process.cwd(), filePath);

    const unusedMessages = file.messages.filter(
      msg => msg.ruleId === 'no-unused-vars' || msg.ruleId === '@typescript-eslint/no-unused-vars'
    );

    totalUnused += unusedMessages.length;

    report += `## ${relativeFilePath}\n\n`;
    report += '| Line | Column | Variable | Message |\n';
    report += '|------|--------|----------|----------|\n';

    unusedMessages.forEach(msg => {
      report += `| ${msg.line} | ${msg.column} | \`${msg.message.match(/'([^']+)'/)?.[1] || 'unknown'}\` | ${msg.message} |\n`;
    });

    report += '\n### Suggested Fix\n\n';
    report += '```typescript\n';
    // Read a few lines from the file around each error
    const fileContent = fs.readFileSync(filePath, 'utf-8').split('\n');

    const errorLines = [...new Set(unusedMessages.map(msg => msg.line))].sort((a, b) => a - b);

    errorLines.forEach(line => {
      const startLine = Math.max(1, line - 2);
      const endLine = Math.min(fileContent.length, line + 2);

      for (let i = startLine; i <= endLine; i++) {
        const prefix = i === line ? '> ' : '  ';
        report += `${prefix}${i}: ${fileContent[i - 1]}\n`;
      }
      report += '\n';
    });

    report += '```\n\n';

    // Add recommendations
    report += '#### Recommendations\n\n';
    report += '- Remove unused variables or prefix with underscore if intentionally unused\n';
    report +=
      '- Consider using TypeScript\'s "noUnusedLocals" and "noUnusedParameters" compiler options\n';
    report +=
      '- For props or function parameters, use destructuring to pick only what you need\n\n';
  });

  // Add general recommendations
  report += '## General Recommendations\n\n';
  report += '1. Prefix intentionally unused variables with underscore (e.g., `_unusedVar`)\n';
  report += '2. For React components, use TypeScript to only extract the props you need\n';
  report += '3. Consider enabling strict mode in TypeScript which helps catch unused variables\n';
  report += "4. Use ESLint's `--fix` option to automatically remove many unused variables\n\n";

  report += `## Summary\n\n`;
  report += `Total unused variables found: ${totalUnused} across ${unusedVarsResults.length} files\n`;

  // Write report to file
  fs.writeFileSync(outputFile, report);

  console.log(
    `Analysis complete. Found ${totalUnused} unused variables in ${unusedVarsResults.length} files.`
  );
  console.log(`Report written to ${outputFile}`);
} catch (error) {
  console.error('Error analyzing unused variables:', error);
}
