'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TestCachePage() {
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testPrompt, setTestPrompt] = useState(
    'Create a modern logo for a tech company called TechWave'
  );
  const [activeTab, setActiveTab] = useState('basic');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiResponseTime, setApiResponseTime] = useState<number | null>(null);

  const fetchCacheStatus = async (detailed = false) => {
    setIsLoading(true);
    try {
      const url = `/api/clear-cache?detailed=${detailed}&memory=true`;
      const startTime = performance.now();
      const response = await fetch(url);
      const endTime = performance.now();
      const data = await response.json();

      if (detailed) {
        setDetailedStats(data);
      } else {
        setCacheStatus(data);
      }

      console.log(`Cache status fetched in ${Math.round(endTime - startTime)}ms`);
    } catch (error) {
      console.error('Error fetching cache status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testGeneration = async () => {
    setIsLoading(true);
    try {
      // First API call - should be cache miss
      const startTime1 = performance.now();
      const response1 = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testPrompt,
          cache: true, // Enable caching
        }),
      });
      const endTime1 = performance.now();
      const time1 = Math.round(endTime1 - startTime1);

      const data1 = await response1.json();
      console.log('First API call (should be cache miss):', data1);

      // Second API call with same prompt - should be cache hit
      const startTime2 = performance.now();
      const response2 = await fetch('/api/generate-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: testPrompt,
          cache: true, // Enable caching
        }),
      });
      const endTime2 = performance.now();
      const time2 = Math.round(endTime2 - startTime2);

      const data2 = await response2.json();
      console.log('Second API call (should be cache hit):', data2);

      // Set the response data and timing
      setApiResponse({
        firstCall: {
          time: time1,
          data: data1,
          cacheStatus: data1.cacheStatus || 'unknown',
        },
        secondCall: {
          time: time2,
          data: data2,
          cacheStatus: data2.cacheStatus || 'unknown',
        },
        improvement: time1 > 0 ? Math.round(((time1 - time2) / time1) * 100) : 0,
      });

      // Refresh cache status after generation
      fetchCacheStatus(activeTab === 'detailed');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clearAll: true,
          clearMemoization: true,
        }),
      });
      const data = await response.json();
      console.log('Cache cleared:', data);
      fetchCacheStatus(activeTab === 'detailed');
      setApiResponse(null);
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSpecificCache = async (type: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/clear-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          types: [type],
        }),
      });
      const data = await response.json();
      console.log(`Cache type ${type} cleared:`, data);
      fetchCacheStatus(activeTab === 'detailed');
    } catch (error) {
      console.error(`Error clearing cache type ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'basic') {
      fetchCacheStatus(false);
    } else {
      fetchCacheStatus(true);
    }
  }, [activeTab]);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Cache Testing Page</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Test Generation with Caching</h2>
          <div className="mb-4">
            <label htmlFor="prompt" className="block text-sm mb-1">
              Test Prompt:
            </label>
            <textarea
              id="prompt"
              value={testPrompt}
              onChange={e => setTestPrompt(e.target.value)}
              className="w-full p-2 border rounded min-h-[100px]"
            />
          </div>
          <Button onClick={testGeneration} disabled={isLoading} className="w-full">
            {isLoading ? 'Testing...' : 'Run Cache Performance Test'}
          </Button>
          <p className="text-xs mt-2 text-muted-foreground">
            This will make two identical API calls. The first should be a cache miss, the second a
            cache hit.
          </p>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Cache Control</h2>
          <p className="text-sm mb-4">
            Use these controls to check the cache status and clear the cache if needed.
          </p>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fetchCacheStatus(activeTab === 'detailed')}
                disabled={isLoading}
                className="flex-1"
              >
                Refresh Status
              </Button>
              <Button
                variant="destructive"
                onClick={clearCache}
                disabled={isLoading}
                className="flex-1"
              >
                Clear All Caches
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => clearSpecificCache('generation')}
                disabled={isLoading}
              >
                Clear Generation
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => clearSpecificCache('intermediate')}
                disabled={isLoading}
              >
                Clear Intermediate
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => clearSpecificCache('asset')}
                disabled={isLoading}
              >
                Clear Assets
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => clearSpecificCache('progress')}
                disabled={isLoading}
              >
                Clear Progress
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {apiResponse && (
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">API Performance Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <h3 className="font-medium">First Call (Cache Miss)</h3>
              <p className="text-sm">
                Time: <span className="font-bold">{apiResponse.firstCall.time}ms</span>
              </p>
              <p className="text-sm">
                Cache:{' '}
                <span
                  className={`font-bold ${apiResponse.firstCall.cacheStatus === 'hit' ? 'text-green-600' : 'text-amber-600'}`}
                >
                  {apiResponse.firstCall.cacheStatus}
                </span>
              </p>
            </div>
            <div className="border rounded p-3">
              <h3 className="font-medium">Second Call (Cache Hit)</h3>
              <p className="text-sm">
                Time: <span className="font-bold">{apiResponse.secondCall.time}ms</span>
              </p>
              <p className="text-sm">
                Cache:{' '}
                <span
                  className={`font-bold ${apiResponse.secondCall.cacheStatus === 'hit' ? 'text-green-600' : 'text-amber-600'}`}
                >
                  {apiResponse.secondCall.cacheStatus}
                </span>
              </p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <h3 className="font-medium">Performance Improvement</h3>
            <p className="text-2xl font-bold text-green-600">{apiResponse.improvement}%</p>
            <p className="text-sm text-muted-foreground">
              {apiResponse.firstCall.time - apiResponse.secondCall.time}ms faster with caching
            </p>
          </div>
        </Card>
      )}

      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Cache Stats</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">Cache Statistics</h2>
            {cacheStatus ? (
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-[500px]">
                {JSON.stringify(cacheStatus, null, 2)}
              </pre>
            ) : (
              <p>{isLoading ? 'Loading...' : 'No cache status information available'}</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">Detailed Cache Statistics</h2>
            {detailedStats ? (
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-[500px]">
                {JSON.stringify(detailedStats, null, 2)}
              </pre>
            ) : (
              <p>{isLoading ? 'Loading...' : 'No detailed cache statistics available'}</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
