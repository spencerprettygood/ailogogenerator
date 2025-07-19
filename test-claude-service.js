// Test script to check Claude service functionality
const { claudeService } = require('./lib/services/claude-service.ts');

async function testClaude() {
  try {
    console.log('Testing Claude service...');
    const response = await claudeService.generateResponse(
      'Say hello',
      { maxTokens: 100 }
    );
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testClaude();