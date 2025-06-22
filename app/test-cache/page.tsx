'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TestCachePage() {
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testPrompt, setTestPrompt] = useState('Create a modern logo for a tech company called TechWave');

  const fetchCacheStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-logo?metrics=true');
      const data = await response.json();
      setCacheStatus(data);
    } catch (error) {
      console.error('Error fetching cache status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testGeneration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testPrompt,
        }),
      });
      
      // Stream the response
      const reader = response.body?.getReader();
      
      if (reader) {
        const decoder = new TextDecoder();
        let output = '';
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          output += chunk;
          
          // Try to parse and display any complete JSON messages
          const lines = output.split('\n');
          output = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                const parsed = JSON.parse(line);
                console.log('Received message:', parsed);
              } catch (e) {
                console.warn('Failed to parse line:', line);
              }
            }
          }
        }
      }
      
      // Refresh cache status after generation
      fetchCacheStatus();
    } catch (error) {
      console.error('Error testing generation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCache = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/clear-cache', {
        method: 'POST',
      });
      const data = await response.json();
      console.log('Cache cleared:', data);
      fetchCacheStatus();
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCacheStatus();
  }, []);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Cache Testing Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Test Generation</h2>
          <div className="mb-4">
            <label htmlFor="prompt" className="block text-sm mb-1">Test Prompt:</label>
            <textarea 
              id="prompt"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="w-full p-2 border rounded min-h-[100px]"
            />
          </div>
          <Button onClick={testGeneration} disabled={isLoading}>
            {isLoading ? 'Testing...' : 'Test Generation'}
          </Button>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Cache Control</h2>
          <p className="text-sm mb-4">
            Use these controls to check the cache status and clear the cache if needed.
          </p>
          <div className="space-x-2">
            <Button variant="outline" onClick={fetchCacheStatus} disabled={isLoading}>
              Refresh Status
            </Button>
            <Button variant="destructive" onClick={clearCache} disabled={isLoading}>
              Clear Cache
            </Button>
          </div>
        </Card>
      </div>
      
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-2">Cache Status</h2>
        {cacheStatus ? (
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-[500px]">
            {JSON.stringify(cacheStatus, null, 2)}
          </pre>
        ) : (
          <p>{isLoading ? 'Loading...' : 'No cache status information available'}</p>
        )}
      </Card>
    </div>
  );
}