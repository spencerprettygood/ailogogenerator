'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestClaudePage() {
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('claude-3-sonnet-20240229');

  const testClaudeConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/diagnose-claude');
      const data = await response.json();
      setDiagnosticResult(data);
    } catch (error) {
      console.error('Error testing Claude connection:', error);
      setDiagnosticResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testModelConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: "This is a test prompt to verify the Claude API connection. Please respond with a simple confirmation.",
          options: {
            model: selectedModel,
            temperature: 0,
            maxTokens: 50,
          },
        }),
      });
      
      // Read the streaming response
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let result = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          result += chunk;
          
          // Try to parse the result
          try {
            const lines = result.split('\n');
            const lastLine = lines[lines.length - 1];
            if (lastLine) {
              const parsedLine = JSON.parse(lastLine);
              console.log('Received response chunk:', parsedLine);
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
        
        setDiagnosticResult({
          success: true,
          message: 'Model test completed successfully',
          model: selectedModel,
        });
      }
    } catch (error) {
      console.error('Error testing model connection:', error);
      setDiagnosticResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const availableModels = [
    'claude-3-5-sonnet-20240620',
    'claude-3-haiku-20240307',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
  ];

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Claude API Diagnostic Tool</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This tool will test the connection to the Claude API and verify that your API key is working properly.
          </p>
          <Button onClick={testClaudeConnection} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Test Claude Connection'}
          </Button>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Model Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Test a specific Claude model to verify it's available and working.
          </p>
          
          <div className="mb-4">
            <label htmlFor="model-select" className="block text-sm font-medium mb-2">
              Select Model:
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          
          <Button onClick={testModelConnection} disabled={isLoading}>
            {isLoading ? 'Testing Model...' : 'Test Selected Model'}
          </Button>
        </CardContent>
      </Card>
      
      {diagnosticResult && (
        <Card>
          <CardHeader>
            <CardTitle>
              {diagnosticResult.success ? '✅ Success' : '❌ Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-[500px]">
              {JSON.stringify(diagnosticResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}