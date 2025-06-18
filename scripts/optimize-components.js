#!/usr/bin/env node

// This script helps optimize React components by adding memo, useMemo, and useCallback

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Output file for the report
const outputFile = path.join(__dirname, '..', 'component-optimization-report.md');

console.log('Analyzing React components for optimization opportunities...');

try {
  // Find all React component files
  const findComponentsCommand = "find ./components -type f -name '*.tsx' | grep -v '.test.tsx'";
  const componentFiles = execSync(findComponentsCommand, { encoding: 'utf-8' })
    .split('\n')
    .filter(Boolean);
  
  // Generate report
  let report = '# React Component Optimization Guide\n\n';
  report += 'This report provides guidance on optimizing React components in the codebase.\n\n';
  
  // Keep track of components and optimizations
  const componentOptimizations = {};
  
  componentFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativeFilePath = path.relative(process.cwd(), filePath);
    
    componentOptimizations[relativeFilePath] = {
      memoizeComponent: false,
      useMemoForCalculations: [],
      useCallbackForHandlers: [],
      fixEffectDependencies: [],
      moveFunctionsOutside: []
    };
    
    // Check if component is memoized
    const hasMemo = /React\.memo|memo\(/g.test(content);
    const componentExportMatch = content.match(/export\s+(?:default\s+)?(?:const|function)\s+(\w+)/);
    
    if (componentExportMatch && !hasMemo) {
      componentOptimizations[relativeFilePath].memoizeComponent = true;
      componentOptimizations[relativeFilePath].componentName = componentExportMatch[1];
    }
    
    // Check for calculations that could use useMemo
    const calculations = content.match(/(?:const|let)\s+(\w+)\s*=\s*(?:.*\.map\(|.*\.filter\(|.*\.reduce\()/g);
    if (calculations) {
      componentOptimizations[relativeFilePath].useMemoForCalculations = calculations.map(calc => {
        const varName = calc.match(/(?:const|let)\s+(\w+)/)[1];
        return { varName, calculation: calc.trim() };
      });
    }
    
    // Check for handlers that could use useCallback
    const handlers = content.match(/(?:const|let)\s+(\w+)\s*=\s*(?:useCallback\()?\s*\(\s*(?:\w+(?:\s*,\s*\w+)*)?\s*\)\s*=>/g);
    if (handlers) {
      const nonCallbackHandlers = handlers.filter(h => !h.includes('useCallback'));
      componentOptimizations[relativeFilePath].useCallbackForHandlers = nonCallbackHandlers.map(handler => {
        const varName = handler.match(/(?:const|let)\s+(\w+)/)[1];
        return { varName, handler: handler.trim() };
      });
    }
    
    // Check for useEffect hooks with missing dependencies
    const effects = content.match(/useEffect\s*\(\s*\(\)\s*=>\s*{[^}]*}\s*(?:,\s*\[\s*\])?\s*\)/g);
    if (effects) {
      componentOptimizations[relativeFilePath].fixEffectDependencies = effects.map((effect, index) => {
        const hasDeps = effect.includes(',');
        const emptyDeps = effect.includes('[]');
        
        return {
          effectIndex: index + 1,
          hasDependencies: hasDeps,
          emptyDependencies: emptyDeps,
          effect: effect.slice(0, 100) + (effect.length > 100 ? '...' : '')
        };
      }).filter(e => !e.hasDependencies || e.emptyDependencies);
    }
    
    // Check for functions defined inside component that could be moved outside
    const functionsInsideComponent = content.match(/function\s+(\w+)\s*\([^)]*\)\s*{[^}]*}/g);
    if (functionsInsideComponent) {
      componentOptimizations[relativeFilePath].moveFunctionsOutside = functionsInsideComponent.map(func => {
        const funcName = func.match(/function\s+(\w+)/)[1];
        return {
          functionName: funcName,
          function: func.slice(0, 100) + (func.length > 100 ? '...' : '')
        };
      });
    }
  });
  
  // Add components to report that need optimization
  Object.entries(componentOptimizations).forEach(([filePath, optimizations]) => {
    // Check if any optimizations are needed
    const needsOptimization = optimizations.memoizeComponent || 
      optimizations.useMemoForCalculations.length > 0 || 
      optimizations.useCallbackForHandlers.length > 0 || 
      optimizations.fixEffectDependencies.length > 0 ||
      optimizations.moveFunctionsOutside.length > 0;
    
    if (needsOptimization) {
      report += `## ${filePath}\n\n`;
      
      if (optimizations.memoizeComponent) {
        report += `### Memoize Component\n\n`;
        report += `The component \`${optimizations.componentName}\` should be memoized using React.memo to prevent unnecessary re-renders.\n\n`;
        report += '```typescript\n';
        report += `// Before\nexport const ${optimizations.componentName} = (props) => { ... };\n\n`;
        report += `// After\nconst ${optimizations.componentName} = (props) => { ... };\nexport default React.memo(${optimizations.componentName});\n`;
        report += '```\n\n';
      }
      
      if (optimizations.useMemoForCalculations.length > 0) {
        report += `### Use useMemo for Calculations\n\n`;
        optimizations.useMemoForCalculations.forEach(calc => {
          report += `- Variable \`${calc.varName}\` should use useMemo:\n\n`;
          report += '```typescript\n';
          report += `// Before\n${calc.calculation}\n\n`;
          report += `// After\nconst ${calc.varName} = useMemo(() => {\n  ${calc.calculation.replace(/(?:const|let)\s+\w+\s*=\s*/, '')}\n}, [/* dependencies */]);\n`;
          report += '```\n\n';
        });
      }
      
      if (optimizations.useCallbackForHandlers.length > 0) {
        report += `### Use useCallback for Event Handlers\n\n`;
        optimizations.useCallbackForHandlers.forEach(handler => {
          report += `- Handler \`${handler.varName}\` should use useCallback:\n\n`;
          report += '```typescript\n';
          report += `// Before\n${handler.handler}\n\n`;
          report += `// After\nconst ${handler.varName} = useCallback(${handler.handler.replace(/(?:const|let)\s+\w+\s*=\s*/, '')}, [/* dependencies */]);\n`;
          report += '```\n\n';
        });
      }
      
      if (optimizations.fixEffectDependencies.length > 0) {
        report += `### Fix useEffect Dependencies\n\n`;
        optimizations.fixEffectDependencies.forEach(effect => {
          report += `- Effect #${effect.effectIndex} is missing proper dependencies:\n\n`;
          report += '```typescript\n';
          report += `// Before\n${effect.effect}\n\n`;
          report += `// After\nuseEffect(() => {\n  // effect code\n}, [/* Add proper dependencies here */]);\n`;
          report += '```\n\n';
        });
      }
      
      if (optimizations.moveFunctionsOutside.length > 0) {
        report += `### Move Functions Outside Component\n\n`;
        optimizations.moveFunctionsOutside.forEach(func => {
          report += `- Function \`${func.functionName}\` could be moved outside the component or memoized:\n\n`;
          report += '```typescript\n';
          report += `// Before - inside component\n${func.function}\n\n`;
          report += `// After - outside component\nfunction ${func.functionName}(...) {\n  // function code\n}\n\n// Or inside component with useCallback\nconst ${func.functionName} = useCallback((...) => {\n  // function code\n}, [/* dependencies */]);\n`;
          report += '```\n\n';
        });
      }
      
      report += '\n';
    }
  });
  
  // Add general optimization guidelines
  report += '## General React Optimization Guidelines\n\n';
  
  report += '### Component Optimization\n\n';
  report += '1. **Memoize Components**\n';
  report += '   ```typescript\n';
  report += '   // Memoize functional components\n';
  report += '   const MyComponent = React.memo(function MyComponent(props) {\n';
  report += '     return <div>{props.children}</div>;\n';
  report += '   });\n';
  report += '   ```\n\n';
  
  report += '2. **useMemo for Expensive Calculations**\n';
  report += '   ```typescript\n';
  report += '   // Memoize expensive calculations\n';
  report += '   const memoizedValue = useMemo(() => {\n';
  report += '     return computeExpensiveValue(a, b);\n';
  report += '   }, [a, b]);\n';
  report += '   ```\n\n';
  
  report += '3. **useCallback for Event Handlers**\n';
  report += '   ```typescript\n';
  report += '   // Memoize callback functions\n';
  report += '   const memoizedCallback = useCallback(() => {\n';
  report += '     doSomething(a, b);\n';
  report += '   }, [a, b]);\n';
  report += '   ```\n\n';
  
  report += '4. **Proper useEffect Dependencies**\n';
  report += '   ```typescript\n';
  report += '   // Always include all dependencies\n';
  report += '   useEffect(() => {\n';
  report += '     document.title = `Hello, ${name}`;\n';
  report += '   }, [name]); // Include all values from the component scope that change over time\n';
  report += '   ```\n\n';
  
  report += '5. **Component Code Structure**\n';
  report += '   ```typescript\n';
  report += '   // Avoid recreating functions and objects on each render\n';
  report += '   \n';
  report += '   // Bad - new object every render\n';
  report += '   return <Component style={{ margin: 0 }} />;\n';
  report += '   \n';
  report += '   // Good - stable object reference\n';
  report += '   const style = useMemo(() => ({ margin: 0 }), []);\n';
  report += '   return <Component style={style} />;\n';
  report += '   ```\n\n';
  
  // Write report to file
  fs.writeFileSync(outputFile, report);
  
  console.log(`Optimization analysis complete.`);
  console.log(`Report written to ${outputFile}`);
  
} catch (error) {
  console.error('Error analyzing components for optimization:', error);
}