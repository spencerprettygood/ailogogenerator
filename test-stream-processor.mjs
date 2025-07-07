/**
 * Stream Processor Test Script
 *
 * This script tests the enhanced StreamProcessor's ability to handle concatenated JSON objects.
 * Run with: node --experimental-modules test-stream-processor.mjs
 */

import { StreamProcessor } from './lib/streaming.js';

// Sample data that simulates concatenated JSON objects in the stream
const concatenatedJsonSamples = [
  // Basic concatenated JSON objects
  '{"type":"start","sessionId":"RKU95zedGmdYU_UFZVnTN"}{"type":"progress","progress":{"currentStage":"distillation","stageProgress":5,"overallProgress":0,"statusMessage":"Executing..."}}',

  // Multiple objects with nested structures
  '{"type":"progress","progress":{"currentStage":"moodboard","stageProgress":100,"overallProgress":22,"statusMessage":"Execution completed successfully"}}{"type":"progress","progress":{"currentStage":"selection","stageProgress":5,"overallProgress":22,"statusMessage":"Executing..."}}{"type":"progress","progress":{"currentStage":"selection","stageProgress":100,"overallProgress":33,"statusMessage":"Execution completed successfully"}}',

  // Sample with result object containing SVG data
  '{"type":"progress","progress":{"currentStage":"packaging","stageProgress":100,"overallProgress":89,"statusMessage":"Execution completed successfully"}}{"type":"result","result":{"success":true,"brandName":"Test Brand","logoSvg":"<svg viewBox=\'0 0 100 100\'></svg>"}}',
];

// Create a test callback implementation
const testCallbacks = {
  onProgress: progress => {
    console.log(
      `PROGRESS: Stage ${progress.currentStage} - ${progress.stageProgress}% (Overall: ${progress.overallProgress}%)`
    );
  },
  onPreview: svgContent => {
    console.log(`PREVIEW: SVG content received (length: ${svgContent.length})`);
  },
  onComplete: (assets, sessionId) => {
    console.log(`COMPLETE: Assets received for session ${sessionId}`);
    console.log(`Logo SVG: ${assets.logoSvg ? 'Present' : 'Missing'}`);
  },
  onError: error => {
    console.error(`ERROR: ${error.message}`);
  },
  onCache: isCached => {
    console.log(`CACHE: Using cached result: ${isCached}`);
  },
};

// Create stream processor instance
const processor = new StreamProcessor();

// Test function to process each sample
async function testSample(sample, index) {
  console.log(`\n--- TEST SAMPLE ${index + 1} ---`);
  console.log(`Input (${sample.length} chars): ${sample.substring(0, 50)}...`);

  // Create a mock stream from the sample
  const encoder = new TextEncoder();
  const encodedSample = encoder.encode(sample);

  const mockStream = new ReadableStream({
    start(controller) {
      controller.enqueue(encodedSample);
      controller.close();
    },
  });

  // Track callback invocations
  let progressCount = 0;
  let previewCount = 0;
  let completeCount = 0;
  let errorCount = 0;

  const trackingCallbacks = {
    onProgress: progress => {
      progressCount++;
      testCallbacks.onProgress(progress);
    },
    onPreview: svgContent => {
      previewCount++;
      testCallbacks.onPreview(svgContent);
    },
    onComplete: (assets, sessionId) => {
      completeCount++;
      testCallbacks.onComplete(assets, sessionId);
    },
    onError: error => {
      errorCount++;
      testCallbacks.onError(error);
    },
    onCache: testCallbacks.onCache,
  };

  // Process the mock stream
  try {
    await processor.processStream(mockStream, trackingCallbacks);
    console.log('\nRESULTS:');
    console.log(`Progress updates: ${progressCount}`);
    console.log(`Preview updates: ${previewCount}`);
    console.log(`Complete calls: ${completeCount}`);
    console.log(`Error calls: ${errorCount}`);

    const expectedObjectCount = (sample.match(/"type":/g) || []).length;
    const processedCount = progressCount + previewCount + completeCount;
    const successRate = Math.round((processedCount / expectedObjectCount) * 100);

    console.log(
      `Processing success rate: ${successRate}% (${processedCount}/${expectedObjectCount})`
    );

    if (successRate < 100) {
      console.warn('⚠️ Some JSON objects were not successfully processed.');
    } else {
      console.log('✅ All JSON objects were successfully processed.');
    }
  } catch (error) {
    console.error(`FATAL ERROR: ${error.message}`);
  }
}

// Run tests for all samples
async function runTests() {
  console.log('STREAM PROCESSOR ENHANCED TEST');
  console.log('==============================\n');

  for (let i = 0; i < concatenatedJsonSamples.length; i++) {
    await testSample(concatenatedJsonSamples[i], i);
  }

  console.log('\n==============================');
  console.log('ALL TESTS COMPLETED');
}

// Execute the tests
runTests().catch(console.error);
