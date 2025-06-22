'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

export default function TestSVGPage() {
  const [prompt, setPrompt] = useState('Create a logo for a tech startup called "Quantum Flow" that specializes in AI and data processing');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test-svg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'SVG generation failed');
      }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Error testing SVG generation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">SVG Generation Test</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-1">
            Logo Description
          </label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full"
            placeholder="Describe the logo you want to generate..."
          />
        </div>
        
        <Button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="w-full"
        >
          {loading ? 'Generating...' : 'Generate SVG'}
        </Button>
      </form>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Generated SVG</h2>
            {result.svg ? (
              <div className="flex flex-col items-center">
                <div 
                  className="bg-gray-50 border border-gray-200 rounded-md p-4 w-64 h-64 flex items-center justify-center mb-4"
                  dangerouslySetInnerHTML={{ __html: result.svg }}
                />
                <pre className="bg-gray-50 p-4 rounded-md text-xs overflow-auto max-h-60 w-full">
                  {result.svg}
                </pre>
              </div>
            ) : (
              <p className="text-red-500">SVG generation failed</p>
            )}
          </Card>
          
          {result.rationale && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Design Rationale</h2>
              <div className="prose max-w-none">
                {result.rationale}
              </div>
            </Card>
          )}
          
          {result.error && (
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 text-red-600">Error</h2>
              <pre className="bg-red-50 p-4 rounded-md overflow-auto max-h-60">
                {JSON.stringify(result.error, null, 2)}
              </pre>
            </Card>
          )}
          
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Agent Metrics</h2>
            <pre className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60 text-xs">
              {JSON.stringify(result.metrics, null, 2)}
            </pre>
          </Card>
        </div>
      )}
    </div>
  );
}