import { NextRequest, NextResponse } from 'next/server';
import { InputSanitizer, RateLimiter } from '@/lib/utils/security-utils';
import { nanoid } from 'nanoid';
import { MultiAgentOrchestrator } from '@/lib/agents/orchestrator';
import { PipelineProgress, LogoBrief, PipelineStage, AnimationOptions } from '@/lib/types';
import { CacheManager } from '@/lib/utils/cache-manager';
import { performanceMonitor } from '@/lib/utils/performance-monitor';
import { withPerformanceMonitoring } from '@/lib/middleware/performance-middleware';

export const runtime = 'nodejs';

export const POST = withPerformanceMonitoring(async function POST(req: NextRequest) {
  try {
    // Create a TextEncoder for the streaming response
    const encoder = new TextEncoder();
    
    // Generate session ID for the request
    const sessionId = nanoid();
    
  // Initialize the response stream
  const stream = new ReadableStream({
    async start(controller) {
      let controllerClosed = false;
      
      // Helper function to safely enqueue to controller
      const safeEnqueue = (data: any) => {
        if (!controllerClosed) {
          try {
            controller.enqueue(encoder.encode(JSON.stringify(data)));
          } catch (error) {
            console.error('Error enqueuing to controller:', error);
            controllerClosed = true;
          }
        }
      };
      
      // Helper function to safely close controller
      const safeClose = () => {
        if (!controllerClosed) {
          try {
            controller.close();
            controllerClosed = true;
          } catch (error) {
            console.error('Error closing controller:', error);
            controllerClosed = true;
          }
        }
      };
      
      try {
          // Handle both FormData and JSON
          let prompt = '';
          let images: (File | Blob)[] = [];
          let industry = '';
          let includeAnimations = false;
          let animationOptions: Record<string, unknown> | null = null;
          
          // Check if this is a multipart form
          const contentType = req.headers.get('content-type') || '';
          
          if (contentType.includes('multipart/form-data')) {
            // Handle FormData
            try {
              const formData = await req.formData();
              prompt = formData.get('brief') as string || '';
              industry = formData.get('industry') as string || '';
              includeAnimations = formData.get('includeAnimations') === 'true';
              
              // Parse animation options if provided
              const animationOptionsStr = formData.get('animationOptions') as string;
              if (animationOptionsStr) {
                try {
                  animationOptions = JSON.parse(animationOptionsStr);
                } catch (animError) {
                  console.error('Animation options parsing error:', animError);
                }
              }
              
              // Process files if any
              const fileEntries = Array.from(formData.entries())
                .filter(([key]) => key.startsWith('file_'))
                .map(([, value]) => value);
                
              images = fileEntries.filter((value): value is File => (typeof value !== 'string') && (value instanceof File));
            } catch (formError) {
              console.error('Form data parsing error:', formError);
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'error',
                error: {
                  message: 'Invalid form data format',
                  details: formError instanceof Error ? formError.message : 'Error parsing form data'
                }
              }) + '\n'));
              controller.close();
              return;
            }
          } else {
            // Handle JSON
            try {
              const text = await req.text();
              const body = JSON.parse(text);
              const briefFromRequest = body.brief || {};
              
              // Support both top-level prompt and brief.prompt
              prompt = body.prompt || briefFromRequest.prompt || '';
              
              // Support both top-level images and brief.image_uploads
              images = body.images || briefFromRequest.image_uploads || [];
              
              // Support both top-level industry and brief.industry
              industry = body.industry || briefFromRequest.industry || '';
              
              includeAnimations = body.includeAnimations || false;
              animationOptions = body.animationOptions || null;
            } catch (parseError) {
              console.error('JSON parsing error:', parseError);
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'error',
                error: {
                  message: 'Invalid request format',
                  details: parseError instanceof Error ? parseError.message : 'Error parsing JSON'
                }
              }) + '\n'));
              controller.close();
              return;
            }
          }
          
          if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'error',
              error: {
                message: 'A text prompt is required.'
              }
            }) + '\n'));
            controller.close();
            return;
          }
          
          // Check rate limits (using IP address)
          const ip = req.headers.get('x-forwarded-for') || 'unknown';
          const rateLimitResult = RateLimiter.check(ip);
          
          if (!rateLimitResult.allowed) {
            const retryAfterSeconds = Math.ceil((rateLimitResult.retryAfter || 0) / 1000);
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'error',
              error: {
                message: 'Rate limit exceeded. Please try again later.',
                details: {
                  retryAfterSeconds
                }
              }
            }) + '\n'));
            controller.close();
            return;
          }
          
          // Sanitize input
          const sanitizedPrompt = InputSanitizer.sanitizeBrief(prompt);
          
          // Use the session ID generated earlier
          
          // Send initial response with session ID
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'start',
            sessionId
          }) + '\n'));
          
          // Map agent progress to UI-friendly progress update
          const stageMap: Record<string, PipelineStage> = {
            'stage-a': PipelineStage.A,
            'stage-b': PipelineStage.B,
            'stage-c': PipelineStage.C,
            'stage-d': PipelineStage.D,
            'stage-e': PipelineStage.E,
            'stage-f': PipelineStage.F,
            'stage-g': PipelineStage.G,
            'stage-h': PipelineStage.H,
          };
          
          // Define progress callback
          const progressCallback = (progress: {
            stage: string;
            agent: string;
            status: string;
            progress: number;
            message: string;
            overallProgress: number;
          }) => {
            
            // Create pipeline progress object
            const pipelineProgress: PipelineProgress = {
              currentStage: stageMap[progress.stage] || PipelineStage.IDLE,
              stageProgress: progress.progress,
              overallProgress: progress.overallProgress,
              statusMessage: progress.message
            };
            
            // Send progress update
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'progress',
              progress: pipelineProgress
            }) + '\n'));
          };
          
          // Prepare the brief
          const brief: LogoBrief = {
            prompt: sanitizedPrompt,
            image_uploads: (images || []).filter((img): img is File => img instanceof File),
            industry: industry || undefined,
            includeAnimations: includeAnimations,
            animationOptions: (animationOptions && typeof animationOptions === 'object' && 'type' in animationOptions && 'timing' in animationOptions)
              ? animationOptions as unknown as AnimationOptions
              : undefined
          };
          
          // Check cache for existing result
          const cacheManager = CacheManager.getInstance();
          let cachedResult = null;
          
          try {
            // Need to await this async function
            cachedResult = await cacheManager.getGenerationResult(brief);
          } catch (cacheError) {
            console.error('Cache lookup error:', cacheError);
            // Proceed without cache
          }
          
          let result;
          
          if (cachedResult) {
            // Found in cache, use cached result
            console.log('Cache hit! Using cached logo generation result');
            
            // Send progress update
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'progress',
              progress: {
                currentStage: PipelineStage.CACHED,
                stageProgress: 100,
                overallProgress: 100,
                statusMessage: 'Retrieved from cache'
              }
            }) + '\n'));
            
            // If we have a preview SVG in the cached result, send it
            if (cachedResult.logoSvg) {
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'svg_preview',
                previewSvg: cachedResult.logoSvg
              }) + '\n'));
            }
            
            // Create a result object with the cached data
            result = {
              success: true,
              result: cachedResult,
              metrics: {
                totalExecutionTime: 0,
                totalTokensUsed: 0,
                agentMetrics: { fromCache: true }
              }
            };
            
            // Notify client this is from cache
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'cache',
              cached: true,
              message: 'Result retrieved from cache'
            }) + '\n'));
          } else {
            // Not in cache, execute the pipeline
            // Start performance timer for the entire generation process (safe for Edge Runtime)
            const generationTimerId = performanceMonitor.startTimer(
              'logo-generation',
              'generation',
              { 
                requestId: sessionId, 
                briefLength: sanitizedPrompt.length,
                environment: process.env.NEXT_RUNTIME || 'default'
              }
            );
            
            // Create and execute the multi-agent orchestrator
            const orchestrator = new MultiAgentOrchestrator(
              brief,
              {
                maxConcurrentAgents: 2,
                timeoutMs: 180000, // 3 minutes
                retryFailedAgents: true,
                debugMode: process.env.NODE_ENV === 'development'
              },
              (progress) => {
                // Cache progress updates
                cacheManager.cacheProgress(sessionId, {
                  currentStage: stageMap[progress.stage] || PipelineStage.IDLE,
                  stageProgress: progress.progress,
                  overallProgress: progress.overallProgress,
                  statusMessage: progress.message
                });
                
                // Call the original progress callback
                progressCallback(progress);
                
                // Record pipeline stage metrics
                if (progress.progress === 100) {
                  // Stage just completed
                  performanceMonitor.recordMetric({
                    name: `stage_${progress.stage}_complete`,
                    category: 'pipeline',
                    value: Date.now() - (progress.progress * 100),
                    unit: 'ms',
                    metadata: {
                      stageId: progress.stage,
                      stageName: progress.agent,
                      requestId: sessionId,
                      message: progress.message,
                      environment: process.env.NEXT_RUNTIME || 'default'
                    }
                  });
                }
              }
            );
            
            // Execute the orchestrator
            result = await orchestrator.execute();
            
            // End performance timer with safe metrics for Edge Runtime
            performanceMonitor.endTimer(generationTimerId, {
              success: result.success,
              requestId: sessionId,
              environment: process.env.NEXT_RUNTIME || 'default'
            });
            
            // Record token usage if available
            if (result.metrics?.totalTokensUsed) {
              performanceMonitor.recordMetric({
                name: 'token_usage',
                category: 'llm',
                value: result.metrics.totalTokensUsed,
                unit: 'tokens',
                metadata: {
                  model: 'claude-3-5-sonnet',
                  promptTokens: result.metrics.totalTokensUsed * 0.4, // Approximate split
                  completionTokens: result.metrics.totalTokensUsed * 0.6, // Approximate split
                  cost: result.metrics.totalTokensUsed * 0.000015, // Approximate cost
                  requestId: sessionId,
                  executionTime: result.metrics.totalExecutionTime,
                  environment: process.env.NEXT_RUNTIME || 'default'
                }
              });
            }
            
            // Cache the result if successful
            if (result.success && result.result) {
              cacheManager.cacheGenerationResult(brief, result.result);
            }
          }
          
          // Send final result
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'result',
            result: {
              success: result.success,
              ...result.result,
              sessionId,
              metrics: result.metrics
            }
          }) + '\n'));
          
          // Close the stream
          controller.close();
          
          // Record memory usage after completion - safe for Edge Runtime
          try {
            performanceMonitor.recordMemoryUsage({
              requestId: sessionId,
              operation: 'logo-generation-complete',
              environment: process.env.NEXT_RUNTIME || 'default'
            });
          } catch {
            // Silently handle memory recording errors in Edge Runtime
            console.debug('Memory recording skipped in Edge Runtime');
          }
        } catch (error) {
          console.error('Error in logo generation:', error);
          
          // Create an error ID for tracking
          const errorId = `err_${Date.now().toString(36)}`;
          
          // Record error in performance monitor
          performanceMonitor.recordMetric({
            name: 'Logo Generation Error',
            category: 'error',
            value: 1,
            unit: 'count',
            metadata: {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              errorId,
              requestId: sessionId || 'unknown'
            }
          });
          
          // Send error response with the same error ID
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            error: {
              message: error instanceof Error ? error.message : 'Logo generation failed',
              details: error instanceof Error ? error.stack : String(error),
              errorId
            }
          }) + '\n'));
          
          controller.close();
        }
      }
    });
    
    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }
    }, { status: 500 });
  }
})

// Also handle OPTIONS for CORS preflight
export const OPTIONS = withPerformanceMonitoring(async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
})

// Cache status endpoint
export const GET = withPerformanceMonitoring(async function GET(req: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      error: 'Endpoint only available in development mode'
    }, { status: 403 });
  }
  
  const cacheManager = CacheManager.getInstance();
  const cacheStats = cacheManager.getStats();
  
  // Get performance metrics if requested
  const includeMetrics = req.nextUrl.searchParams.get('metrics') === 'true';
  let performanceStats = null;
  
  if (includeMetrics) {
    const category = req.nextUrl.searchParams.get('category') || undefined;
    const sinceMsStr = req.nextUrl.searchParams.get('since');
    const since = sinceMsStr ? parseInt(sinceMsStr, 10) : undefined;
    const limitStr = req.nextUrl.searchParams.get('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    
    const metrics = performanceMonitor.getMetrics({ category, since, limit });
    const summary = performanceMonitor.getSummary();
    
    performanceStats = {
      metrics: metrics.slice(0, 100), // Limit to 100 metrics max in the response
      summary,
      totalMetrics: metrics.length,
      isEnabled: performanceMonitor.isEnabled()
    };
  }
  
  return NextResponse.json({
    cache: cacheStats,
    performance: performanceStats
  });
})