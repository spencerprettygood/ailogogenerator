import { useState, useCallback } from 'react';
import { logoAPI } from '../api'; // Adjusted import path
import { streamProcessor } from '../streaming'; // Adjusted import path
import { GenerationProgress, GeneratedAssets } from '../types';

export interface UseLogoGenerationReturn {
  generateLogo: (brief: string, files?: File[]) => Promise<void>;
  isGenerating: boolean;
  progress: GenerationProgress | null;
  preview: string | null;
  assets: GeneratedAssets | null;
  sessionId: string | null;
  error: Error | null;
  reset: () => void;
}

export function useLogoGeneration(): UseLogoGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [assets, setAssets] = useState<GeneratedAssets | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const generateLogo = useCallback(async (brief: string, files?: File[]) => {
    setIsGenerating(true);
    setError(null);
    setProgress(null);
    setPreview(null);
    setAssets(null);
    setSessionId(null);

    try {
      const stream = await logoAPI.generateLogo(brief, files);
      
      await streamProcessor.processStream(stream, {
        onProgress: setProgress,
        onPreview: setPreview,
        onComplete: (generatedAssets, generatedSessionId) => {
          setAssets(generatedAssets);
          setSessionId(generatedSessionId);
          setIsGenerating(false);
        },
        onError: (streamError) => {
          setError(streamError);
          setIsGenerating(false);
        }
      });
    } catch (err) {
      setError(err as Error);
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setProgress(null);
    setPreview(null);
    setAssets(null);
    setSessionId(null);
    setError(null);
  }, []);

  return {
    generateLogo,
    isGenerating,
    progress,
    preview,
    assets,
    sessionId,
    error,
    reset
  };
}
