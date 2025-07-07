#!/usr/bin/env node

/**
 * Selection Agent JSON Parsing Test Script
 * This script tests the robustness of our JSON parsing fixes
 */

const { SelectionAgent } = require('./lib/agents/specialized/selection-agent');

async function testSelectionAgent() {
  console.log('🧪 Testing Selection Agent JSON Parsing Fixes...\n');

  const agent = new SelectionAgent();

  // Test cases with various malformed JSON scenarios
  const testCases = [
    {
      name: 'JSON with control characters',
      input: `{
  "selection": {
    "selectedConcept": {
      "name": "Modern\x08Logo",
      "description": "A clean\x00modern design",
      "style": "minimal",
      "colors": ["#0066CC"],
      "imagery": "abstract"
    },
    "selectionRationale": "This concept\x0Bworks well",
    "score": 85
  }
}`,
    },
    {
      name: 'JSON with unescaped newlines',
      input: `{
  "selection": {
    "selectedConcept": {
      "name": "Modern Logo",
      "description": "A clean
modern design with
multiple lines",
      "style": "minimal",
      "colors": ["#0066CC"],
      "imagery": "abstract"
    },
    "selectionRationale": "This concept
works well for the brand",
    "score": 85
  }
}`,
    },
    {
      name: 'JSON with markdown code blocks',
      input: `\`\`\`json
{
  "selection": {
    "selectedConcept": {
      "name": "Modern Logo",
      "description": "A clean modern design",
      "style": "minimal",
      "colors": ["#0066CC"],
      "imagery": "abstract"
    },
    "selectionRationale": "This concept works well",
    "score": 85
  }
}
\`\`\``,
    },
    {
      name: 'JSON with trailing commas',
      input: `{
  "selection": {
    "selectedConcept": {
      "name": "Modern Logo",
      "description": "A clean modern design",
      "style": "minimal",
      "colors": ["#0066CC"],
      "imagery": "abstract",
    },
    "selectionRationale": "This concept works well",
    "score": 85,
  },
}`,
    },
    {
      name: 'Completely malformed text (should trigger fallback)',
      input: `I analyzed the concepts and selected concept 1 which is called "Modern Logo" with a clean, minimal design. The colors are blue (#0066CC) and the style is modern. This was selected because it best matches the brand requirements and target audience. I would rate this selection at 85 out of 100.`,
    },
  ];

  let successCount = 0;
  const totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);

    try {
      // Access the private sanitization method
      const sanitized = agent.sanitizeJsonString(testCase.input);

      try {
        const parsed = JSON.parse(sanitized);
        console.log('  ✅ Primary parsing successful');
        console.log('  📊 Parsed data structure:', Object.keys(parsed));
        successCount++;
      } catch (parseError) {
        console.log('  ⚠️ Primary parsing failed, testing fallback...');

        // Test fallback parsing
        const fallbackResult = agent.extractSelectionDataFallback(testCase.input);

        if (fallbackResult && fallbackResult.selection) {
          console.log('  ✅ Fallback parsing successful');
          console.log('  📊 Concept:', fallbackResult.selection.selectedConcept?.name || 'Unknown');
          successCount++;
        } else {
          console.log('  ❌ Both primary and fallback parsing failed');
        }
      }
    } catch (error) {
      console.log('  ❌ Sanitization failed:', error.message);
    }

    console.log('');
  }

  console.log(
    `🎯 Test Results: ${successCount}/${totalTests} tests passed (${Math.round((successCount / totalTests) * 100)}% success rate)`
  );

  if (successCount === totalTests) {
    console.log('🎉 All tests passed! The JSON parsing fixes are working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the implementation for edge cases.');
  }
}

// Handle ES module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testSelectionAgent };
}

// Run if called directly
if (require.main === module) {
  testSelectionAgent().catch(console.error);
}
