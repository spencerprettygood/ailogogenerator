import { NextRequest, NextResponse } from 'next/server';
import { InputSanitizer, RateLimiter } from '@/lib/utils/security-utils';
import { nanoid } from 'nanoid';
import { MultiAgentOrchestrator } from '@/lib/agents/orchestrator';
import { PipelineProgress, LogoBrief } from '@/lib/types';
import { CacheManager } from '@/lib/utils/cache-manager';
import { performanceMonitor } from '@/lib/utils/performance-monitor';
import { withPerformanceMonitoring } from '@/lib/middleware/performance-middleware';

export const runtime = 'edge';

export const POST = withPerformanceMonitoring(async function POST(req: NextRequest) {
  try {
    // Create a TextEncoder for the streaming response
    const encoder = new TextEncoder();
    
    // Initialize the response stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Handle both FormData and JSON
          let prompt = '';
          let images: any[] = [];
          let industry = '';
          let includeAnimations = false;
          let animationOptions: any = null;
          
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
                .map(([_, value]) => value);
                
              images = fileEntries;
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
              prompt = body.prompt || '';
              images = body.images || [];
              industry = body.industry || '';
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
          const ip = req.ip || 'unknown';
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
          
          // Generate session ID
          const sessionId = nanoid();
          
          // Send initial response with session ID
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'start',
            sessionId
          }) + '\n'));
          
          // Define progress callback
          const progressCallback = (progress: {
            stage: string;
            agent: string;
            status: string;
            progress: number;
            message: string;
            overallProgress: number;
          }) => {
            // Map agent progress to UI-friendly progress update
            const stageMap: Record<string, string> = {
              'stage-a': 'A',
              'stage-b': 'B',
              'stage-c': 'C',
              'stage-d': 'D',
              'stage-e': 'E',
              'stage-f': 'F',
              'stage-g': 'G',
              'stage-h': 'H',
            };
            
            // Create pipeline progress object
            const pipelineProgress: PipelineProgress = {
              currentStage: stageMap[progress.stage] || progress.stage,
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
            image_uploads: images || [],
            industry: industry || undefined,
            includeAnimations: includeAnimations,
            animationOptions: animationOptions
          };
          
          // Check cache for existing result
          const cacheManager = CacheManager.getInstance();
          const cachedResult = cacheManager.getGenerationResult(brief);
          
          let result;
          
          if (cachedResult) {
            // Found in cache, use cached result
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'progress',
              progress: {
                currentStage: 'cached',
                stageProgress: 100,
                overallProgress: 100,
                statusMessage: 'Retrieved from cache'
              }
            }) + '\n'));
            
            result = {
              success: true,
              result: cachedResult,
              metrics: {
                totalExecutionTime: 0,
                totalTokensUsed: 0,
                agentMetrics: { fromCache: true }
              }
            };
            
            controller.enqueue(encoder.encode(JSON.stringify({
              type: 'cache',
              cached: true,
              message: 'Result retrieved from cache'
            }) + '\n'));
          } else {
            // Not in cache, execute the pipeline
            // Start performance timer for the entire generation process
            const generationTimerId = performanceMonitor.startTimer(
              'logo-generation',
              'generation',
              { sessionId, briefLength: sanitizedPrompt.length }
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
                  currentStage: progress.stage,
                  stageProgress: progress.progress,
                  overallProgress: progress.overallProgress,
                  statusMessage: progress.message
                });
                
                // Call the original progress callback
                progressCallback(progress);
                
                // Record pipeline stage metrics
                if (progress.progress === 100) {
                  // Stage just completed
                  performanceMonitor.recordPipelineStage({
                    stageId: progress.stage,
                    stageName: progress.agent,
                    startTime: Date.now() - (progress.progress * 100), // Approximate start time
                    endTime: Date.now(),
                    success: true,
                    metadata: {
                      sessionId,
                      message: progress.message
                    }
                  });
                }
              }
            );
            
            // Execute the orchestrator
            result = await orchestrator.execute();
            
            // End performance timer
            performanceMonitor.endTimer(generationTimerId, {
              success: result.success,
              sessionId
            });
            
            // Record token usage if available
            if (result.metrics?.totalTokensUsed) {
              performanceMonitor.recordTokenUsage({
                model: 'claude-3-5-sonnet',
                promptTokens: result.metrics.totalTokensUsed * 0.4, // Approximate split
                completionTokens: result.metrics.totalTokensUsed * 0.6, // Approximate split
                totalTokens: result.metrics.totalTokensUsed,
                cost: result.metrics.totalTokensUsed * 0.000015, // Approximate cost calculation
                metadata: {
                  sessionId,
                  executionTime: result.metrics.totalExecutionTime
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
          
          // Record memory usage after completion
          performanceMonitor.recordMemoryUsage({
            sessionId,
            operation: 'logo-generation-complete'
          });
        } catch (error) {
          console.error('Error in logo generation:', error);
          
          // Record error in performance monitor
          performanceMonitor.recordMetric({
            name: 'Logo Generation Error',
            category: 'error',
            value: 1,
            unit: 'count',
            metadata: {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              sessionId
            }
          });
          
          // Send error response
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'error',
            error: {
              message: error instanceof Error ? error.message : 'Logo generation failed',
              details: error instanceof Error ? error.stack : String(error)
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