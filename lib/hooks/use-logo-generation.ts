import { useState, useCallback } from 'react';
import { logoAPI } from '../api'; // Adjusted import path
import { streamProcessor } from '../streaming'; // Adjusted import path
import { GenerationProgress, GeneratedAssets, PipelineStage, AnimationOptions } from '../types';

export interface LogoGenerationOptions {
  industry?: string;
  includeAnimations?: boolean;
  animationOptions?: AnimationOptions;
  includeUniquenessAnalysis?: boolean;
  includeMockups?: boolean;
}

export interface UseLogoGenerationReturn {
  generateLogo: (brief: string, files?: File[], options?: LogoGenerationOptions) => Promise<void>;
  isGenerating: boolean;
  progress: GenerationProgress | null;
  preview: string | null;
  assets: GeneratedAssets | null;
  sessionId: string | null;
  error: Error | null;
  reset: () => void;
  fromCache: boolean;
}

export function useLogoGeneration(): UseLogoGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [assets, setAssets] = useState<GeneratedAssets | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const generateLogo = useCallback(async (brief: string, files?: File[], options?: LogoGenerationOptions) => {
    setIsGenerating(true);
    setError(null);
    setProgress(null);
    setPreview(null);
    setAssets(null);
    setSessionId(null);

    try {
      const stream = await logoAPI.generateLogo(brief, files, options);
      
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
        },
        onCache: (isCached) => {
          setFromCache(isCached);
          // If from cache, immediately set progress to 100%
          if (isCached) {
            const cachedProgress: GenerationProgress = {
              status: 'completed',
              progress: 100,
              message: 'Retrieved from cache',
              stage: PipelineStage.CACHED,
              estimatedTimeRemaining: 0,
            };
            setProgress(cachedProgress);
            
            // Also ensure progress display shows completion
            setIsGenerating(false);
          } else {
            setFromCache(false);
          }
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
    setFromCache(false);
  }, []);

  return {
    generateLogo,
    isGenerating,
    progress,
    preview,
    assets,
    sessionId,
    error,
    reset,
    fromCache
  };
}
