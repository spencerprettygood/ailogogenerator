'use client';

import React, { useState, useEffect } from 'react';
import { streamProcessor } from '@/lib/streaming';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { H1, H2, Paragraph } from '@/components/ui/typography';

export default function TestStreamingPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'success' | 'failure'>('idle');
  const [testType, setTestType] = useState<'simple' | 'full'>('simple');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const runTest = async () => {
    setLogs([]);
    setTestStatus('running');
    addLog(`Starting streaming test (${testType} version)...`);

    try {
      // Choose test data based on test type
      let concatenatedJson = '';

      if (testType === 'simple') {
        // Simple test with a few objects
        concatenatedJson = `{"type":"start","sessionId":"RKU95zedGmdYU_UFZVnTN"}{"type":"progress","progress":{"currentStage":"distillation","stageProgress":5,"overallProgress":0,"statusMessage":"Executing..."}}{"type":"progress","progress":{"currentStage":"distillation","stageProgress":100,"overallProgress":11,"statusMessage":"Execution completed successfully"}}{"type":"progress","progress":{"currentStage":"moodboard","stageProgress":5,"overallProgress":11,"statusMessage":"Executing..."}}`;
      } else {
        // Full test with the exact error example and more stages
        concatenatedJson = `{"type":"start","sessionId":"RKU95zedGmdYU_UFZVnTN"}{"type":"progress","progress":{"currentStage":"distillation","stageProgress":5,"overallProgress":0,"statusMessage":"Executing..."}}{"type":"progress","progress":{"currentStage":"distillation","stageProgress":100,"overallProgress":11,"statusMessage":"Execution completed successfully"}}{"type":"progress","progress":{"currentStage":"moodboard","stageProgress":5,"overallProgress":11,"statusMessage":"Executing..."}}{"type":"progress","progress":{"currentStage":"moodboard","stageProgress":100,"overallProgress":22,"statusMessage":"Execution completed successfully"}}{"type":"progress","progress":{"currentStage":"selection","stageProgress":5,"overallProgress":22,"statusMessage":"Executing..."}}{"type":"progress","progress":{"currentStage":"selection","stageProgress":100,"overallProgress":33,"statusMessage":"Execution completed successfully"}}{"type":"progress","progress":{"currentStage":"generation","stageProgress":5,"overallProgress":33,"statusMessage":"Executing..."}}{"type":"progress","progress":{"currentStage":"generation","stageProgress":100,"overallProgress":44,"statusMessage":"Execution completed successfully"}}{"type":"progress","progress":{"currentStage":"validation","stageProgress":5,"overallProgress":44,"statusMessage":"Executing..."}}{"type":"progress","progress":{"currentStage":"validation","stageProgress":100,"overallProgress":56,"statusMessage":"Execution completed successfully"}}{"type":"progress","progress":{"currentStage":"variants","stageProgress":5,"overallProgress":56,"statusMessage":"Executing..."}}{"type":"progress","progress":{"currentStage":"variants","stageProgress":100,"overallProgress":67,"statusMessage":"Execution completed successfully"}}{"type":"progress","progress":{"currentStage":"guidelines","stageProgress":5,"overallProgress":67,"statusMessage":"Executing..."}}{"type":"progress","progress":{"currentStage":"guidelines","stageProgress":100,"overallProgress":78,"statusMessage":"Execution completed successfully"}}{"type":"progress","progress":{"currentStage":"packaging","stageProgress":5,"overallProgress":78,"statusMessage":"Executing..."}}{"type":"progress","progress":{"currentStage":"packaging","stageProgress":100,"overallProgress":89,"statusMessage":"Execution completed successfully"}}{"type":"progress","progress":{"currentStage":"idle","stageProgress":5,"overallProgress":89,"statusMessage":"Executing..."}}`;
      }

      // Create a readable stream from the concatenated JSON
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const data = encoder.encode(concatenatedJson);
          controller.enqueue(data);
          controller.close();
        },
      });

      let progressCount = 0;

      // Process the stream
      await streamProcessor.processStream(stream, {
        onProgress: progress => {
          progressCount++;
          addLog(
            `Progress #${progressCount}: ${progress.currentStage} (${progress.stageProgress}%) - Overall: ${progress.overallProgress}% - ${progress.message}`
          );
        },
        onPreview: svgContent => {
          addLog(`Preview received: ${svgContent.substring(0, 50)}...`);
        },
        onComplete: (assets, sessionId) => {
          addLog(`Complete! Session ID: ${sessionId}`);
          addLog(`Assets received: ${JSON.stringify(assets).substring(0, 100)}...`);
        },
        onError: error => {
          addLog(`ERROR: ${error.message}`);
          setTestStatus('failure');
        },
        onCache: isCached => {
          addLog(`Cache status: ${isCached ? 'Retrieved from cache' : 'Not cached'}`);
        },
      });

      // Calculate success metrics
      const expectedProgressCount = testType === 'simple' ? 3 : 17; // Count the number of progress objects in test data
      addLog(
        `Stream processing complete. Received ${progressCount}/${expectedProgressCount} progress updates.`
      );

      if (progressCount === expectedProgressCount) {
        addLog(
          `TEST PASSED: All ${expectedProgressCount} progress objects successfully processed!`
        );
        setTestStatus('success');
      } else {
        addLog(
          `TEST FAILED: Expected ${expectedProgressCount} progress objects but processed ${progressCount}`
        );
        setTestStatus('failure');
      }
    } catch (error) {
      addLog(`Test failed with error: ${error instanceof Error ? error.message : String(error)}`);
      setTestStatus('failure');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="w-full">
        <CardHeader>
          <H1>Streaming JSON Parser Test</H1>
          <Paragraph>
            This page tests the robust streaming JSON parser that handles concatenated JSON objects.
          </Paragraph>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <Button
                  variant={testType === 'simple' ? 'default' : 'outline'}
                  onClick={() => setTestType('simple')}
                >
                  Simple Test
                </Button>
                <Button
                  variant={testType === 'full' ? 'default' : 'outline'}
                  onClick={() => setTestType('full')}
                >
                  Full Test (All Stages)
                </Button>
              </div>
              <Button onClick={runTest} disabled={testStatus === 'running'} variant="default">
                {testStatus === 'running' ? 'Running...' : 'Run Test'}
              </Button>
              <div className="text-sm">
                Status:{' '}
                <span
                  className={`font-bold ${
                    testStatus === 'success'
                      ? 'text-green-500'
                      : testStatus === 'failure'
                        ? 'text-red-500'
                        : testStatus === 'running'
                          ? 'text-blue-500'
                          : ''
                  }`}
                >
                  {testStatus.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md h-96 overflow-y-auto">
              <H2 className="mb-2">Test Logs</H2>
              {logs.length === 0 ? (
                <p className="text-slate-500 italic">No logs yet. Run the test to see results.</p>
              ) : (
                <pre className="text-xs whitespace-pre-wrap">{logs.join('\n')}</pre>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Paragraph className="text-sm text-slate-500">
            This test simulates the concatenated JSON stream that was previously causing errors. The
            parser now correctly extracts and processes each JSON object from the stream.
          </Paragraph>
        </CardFooter>
      </Card>
    </div>
  );
}
