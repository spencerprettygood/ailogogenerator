#!/usr/bin/env node

// This script analyzes performance issues in React components

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Output file for the report
const outputFile = path.join(__dirname, '..', 'performance-analysis-report.md');

console.log('Analyzing React components for performance issues...');

try {
  // Find all React component files
  const findComponentsCommand = "find ./components -type f -name '*.tsx' | grep -v '.test.tsx'";
  const componentFiles = execSync(findComponentsCommand, { encoding: 'utf-8' })
    .split('\n')
    .filter(Boolean);
  
  // Generate report
  let report = '# React Performance Analysis\n\n';
  report += 'This report identifies potential performance issues in React components.\n\n';
  
  // Performance checks
  const checks = [
    { name: 'Missing memoization', regex: /\bfunction\s+(\w+)\s*\([^\)]*\)\s*{\s*.*\breturn\b/gs },
    { name: 'Inline object creation', regex: /\breturn\b[^;]*{\s*[^;{}]*:[^;{}]*}/gs },
    { name: 'Inline function creation', regex: /\bonChange\w*\s*=\s*\(/gs },
    { name: 'Missing dependency array', regex: /useEffect\s*\(\s*\(\)\s*=>\s*{[^}]*}\s*\)/gs },
    { name: 'Expensive calculation in render', regex: /\.[^.]*map\s*\([^)]*\)/g },
    { name: 'Heavy conditional rendering', regex: /{\s*\w+\s*\?\s*\(\s*<[^>]*>\s*.*\s*<\/[^>]*>\s*\)\s*:\s*\(\s*<[^>]*>/gs },
  ];

  // Track component issues
  const componentIssues = {};
  
  componentFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativeFilePath = path.relative(process.cwd(), filePath);
    
    componentIssues[relativeFilePath] = [];
    
    // Run checks
    checks.forEach(check => {
      const matches = content.match(check.regex) || [];
      if (matches.length > 0) {
        componentIssues[relativeFilePath].push({
          check: check.name,
          count: matches.length,
          examples: matches.slice(0, 2).map(m => m.slice(0, 100) + (m.length > 100 ? '...' : ''))
        });
      }
    });
    
    // Check for React.memo usage
    const hasComponentExport = /export\s+(?:default\s+)?(?:const|function)\s+\w+/g.test(content);
    const hasMemo = /React\.memo|memo\(/g.test(content);
    
    if (hasComponentExport && !hasMemo) {
      componentIssues[relativeFilePath].push({
        check: 'Component not memoized',
        count: 1,
        examples: ['Consider using React.memo for this component']
      });
    }
  });
  
  // Filter out components with no issues
  const componentsWithIssues = Object.entries(componentIssues)
    .filter(([_, issues]) => issues.length > 0);
  
  if (componentsWithIssues.length === 0) {
    report += '## No Performance Issues Found\n\n';
    report += 'Great job! No obvious performance issues were detected in the React components.\n\n';
  } else {
    // Sort components by number of issues
    componentsWithIssues.sort((a, b) => b[1].length - a[1].length);
    
    // Add components to report
    componentsWithIssues.forEach(([filePath, issues]) => {
      report += `## ${filePath}\n\n`;
      report += '| Issue | Count | Example |\n';
      report += '|-------|-------|--------|\n';
      
      issues.forEach(issue => {
        const exampleFormatted = issue.examples[0]
          .replace(/\n/g, ' ')
          .replace(/\|/g, '\\|');
        
        report += `| ${issue.check} | ${issue.count} | \`${exampleFormatted}\` |\n`;
      });
      
      report += '\n### Recommendations\n\n';
      
      // Add specific recommendations based on issues
      if (issues.some(i => i.check === 'Missing memoization')) {
        report += '- Use `useMemo` for expensive calculations\n';
      }
      
      if (issues.some(i => i.check === 'Inline object creation')) {
        report += '- Move object declarations outside of the render function or memoize them\n';
      }
      
      if (issues.some(i => i.check === 'Inline function creation')) {
        report += '- Use `useCallback` for event handlers to prevent unnecessary re-renders\n';
      }
      
      if (issues.some(i => i.check === 'Missing dependency array')) {
        report += '- Add dependency arrays to `useEffect` hooks\n';
      }
      
      if (issues.some(i => i.check === 'Expensive calculation in render')) {
        report += '- Move array mapping operations into useMemo hooks\n';
      }
      
      if (issues.some(i => i.check === 'Component not memoized')) {
        report += '- Wrap exported components with React.memo to prevent unnecessary re-renders\n';
      }
      
      report += '\n';
    });
  }
  
  // Add general recommendations
  report += '## General Performance Recommendations\n\n';
  report += '1. **Component Memoization**: Use `React.memo` for functional components that render often with the same props\n';
  report += '2. **Hook Optimization**:\n';
  report += '   - Use `useMemo` for expensive calculations\n';
  report += '   - Use `useCallback` for functions passed as props\n';
  report += '   - Ensure proper dependency arrays for all hooks\n';
  report += '3. **Render Optimization**:\n';
  report += '   - Avoid creating objects or arrays during render\n';
  report += '   - Consider using virtualization for long lists\n';
  report += '   - Implement pagination for large datasets\n';
  report += '4. **State Management**:\n';
  report += '   - Keep state as local as possible\n';
  report += '   - Consider using context selectors to prevent unnecessary re-renders\n';
  report += '   - Split context providers to minimize re-renders\n\n';
  
  // Summary stats
  const totalIssues = componentsWithIssues.reduce((sum, [_, issues]) => sum + issues.length, 0);
  report += '## Summary\n\n';
  report += `- **Components analyzed**: ${componentFiles.length}\n`;
  report += `- **Components with issues**: ${componentsWithIssues.length}\n`;
  report += `- **Total issues found**: ${totalIssues}\n`;
  
  // Write report to file
  fs.writeFileSync(outputFile, report);
  
  console.log(`Analysis complete. Found ${totalIssues} potential performance issues in ${componentsWithIssues.length} components.`);
  console.log(`Report written to ${outputFile}`);
  
} catch (error) {
  console.error('Error analyzing performance:', error);
}