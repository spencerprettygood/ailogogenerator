'use client';

import { useState } from 'react';

export default function TestSimpleLogo() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const generateLogo = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/simple-logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.logo);
      } else {
        setError(data.error || 'Failed to generate logo');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Simple Logo Generator Test</h1>
      
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your logo (e.g., 'Modern tech company logo with circuits')"
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>

      <button
        onClick={generateLogo}
        disabled={loading}
        style={{
          padding: '0.5rem 2rem',
          fontSize: '1rem',
          backgroundColor: loading ? '#ccc' : '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Generating...' : 'Generate Logo'}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Generated Logo:</h2>
          <div 
            style={{ 
              border: '1px solid #ddd', 
              padding: '1rem',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
            }}
            dangerouslySetInnerHTML={{ __html: result.svg }}
          />
          
          <h3>SVG Code:</h3>
          <pre style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '1rem', 
            overflow: 'auto',
            borderRadius: '4px',
          }}>
            {result.svg}
          </pre>
          
          <p>Generated at: {new Date(result.timestamp).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}