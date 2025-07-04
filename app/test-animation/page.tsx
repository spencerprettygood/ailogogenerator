'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function TestAnimation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [svgIndex, setSvgIndex] = useState(0);

  async function testAnimation() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/test-animation?svgIndex=${svgIndex}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || { message: 'Unknown error occurred' });
        console.error('Animation test failed:', data.error);
      } else {
        setResult(data);
        console.log('Animation test succeeded:', data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Error testing animation:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Animation Agent Test</h1>
      
      <div className="flex flex-col gap-6">
        <div className="bg-slate-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Test Controls</h2>
          <div className="flex gap-4 items-center">
            <select 
              className="border border-gray-300 rounded p-2"
              value={svgIndex}
              onChange={(e) => setSvgIndex(parseInt(e.target.value))}
            >
              <option value="0">Simple Logo (Circles)</option>
              <option value="1">Path-based Logo</option>
              <option value="2">Grouped Elements Logo</option>
            </select>
            <Button
              onClick={testAnimation}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Testing...' : 'Test Animation'}
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2 text-red-800">Error</h2>
            <pre className="bg-red-100 p-3 rounded overflow-auto max-h-60 text-sm">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}
        
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Original SVG</h2>
              <div 
                className="bg-white border border-slate-200 p-4 rounded-lg flex items-center justify-center h-60"
                dangerouslySetInnerHTML={{ __html: result.svg }} 
              />
            </div>
            
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Animated SVG</h2>
              <div 
                className="bg-white border border-slate-200 p-4 rounded-lg flex items-center justify-center h-60"
                dangerouslySetInnerHTML={{ __html: result.animatedSvg }} 
              />
              <style dangerouslySetInnerHTML={{ __html: result.cssCode || '' }} />
            </div>
            
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Animation Options</h2>
              <pre className="bg-slate-100 p-3 rounded overflow-auto max-h-60 text-sm">
                {JSON.stringify(result.animationOptions, null, 2)}
              </pre>
            </div>
            
            {result.cssCode && (
              <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">CSS Code</h2>
                <pre className="bg-slate-100 p-3 rounded overflow-auto max-h-60 text-sm">
                  {result.cssCode}
                </pre>
              </div>
            )}
            
            {result.jsCode && (
              <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">JS Code</h2>
                <pre className="bg-slate-100 p-3 rounded overflow-auto max-h-60 text-sm">
                  {result.jsCode}
                </pre>
              </div>
            )}
            
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Performance</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Tokens Used</p>
                  <p className="font-semibold">{result.tokensUsed || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Processing Time</p>
                  <p className="font-semibold">{result.processingTime ? `${result.processingTime}ms` : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
