// Quick test to verify prompt extraction logic works
const { NextRequest } = require('next/server');

// Test 1: Top-level prompt
const test1Request = new NextRequest('https://example.com/api/generate-logo', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    prompt: 'Create a logo for my company',
    images: [],
  }),
});

// Test 2: Brief.prompt format
const test2Request = new NextRequest('https://example.com/api/generate-logo', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    brief: {
      prompt: 'Create a logo for my company via brief',
    },
    images: [],
  }),
});

// Simple function to test extraction logic
async function testPromptExtraction(req) {
  const contentType = req.headers.get('content-type') || '';
  let prompt = '';

  if (!contentType.includes('multipart/form-data')) {
    try {
      const text = await req.text();
      const body = JSON.parse(text);
      const briefFromRequest = body.brief || {};

      // Support both top-level prompt and brief.prompt
      prompt = body.prompt || briefFromRequest.prompt || '';

      console.log('Body:', body);
      console.log('Extracted prompt:', prompt);
      console.log('Is prompt valid?', !!prompt && prompt.trim().length > 0);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
    }
  }

  return prompt;
}

async function runTests() {
  console.log('=== Test 1: Top-level prompt ===');
  const prompt1 = await testPromptExtraction(test1Request);

  console.log('\n=== Test 2: Brief.prompt format ===');
  const prompt2 = await testPromptExtraction(test2Request);

  console.log('\n=== Summary ===');
  console.log('Test 1 passed:', prompt1 === 'Create a logo for my company');
  console.log('Test 2 passed:', prompt2 === 'Create a logo for my company via brief');
}

runTests().catch(console.error);
