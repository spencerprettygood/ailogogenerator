import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { InputSanitizer, RateLimiter } from '@/lib/utils/security-utils';
import { nanoid } from 'nanoid';
import { MultiAgentOrchestrator } from '@/lib/agents/orchestrator';
import { PipelineProgress, LogoBrief, PipelineStage, AnimationOptions } from '@/lib/types';
import { CacheManager } from '@/lib/utils/cache-manager';
import { performanceMonitor } from '@/lib/utils/performance-monitor';
import { withPerformanceMonitoring } from '@/lib/middleware/performance-middleware';
import { GenerateLogoRequestSchema, GenerateLogoResponseSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export const POST = withPerformanceMonitoring(async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const sessionId = nanoid();

  const stream = new ReadableStream({
    async start(controller) {
      let controllerClosed = false;
      let streamCompleted = false;

      const safeEnqueue = (data: any) => {
        if (!controllerClosed && !streamCompleted) {
          try {
            const validatedData = GenerateLogoResponseSchema.parse(data);
            controller.enqueue(encoder.encode(JSON.stringify(validatedData)));
          } catch (error) {
            if (error instanceof z.ZodError) {
              console.error('Zod validation error enqueuing data:', error.errors);
              const errorResponse = {
                success: false,
                message: 'Internal data validation error',
                error: {
                  code: 'ZOD_VALIDATION_ERROR',
                  message: 'An issue occurred while formatting the response.',
                  details: error.flatten(),
                },
              };
              controller.enqueue(encoder.encode(JSON.stringify(errorResponse)));
            } else {
              console.error('Error enqueuing to controller:', error);
            }
          }
        }
      };

      const safeClose = () => {
        if (!controllerClosed && !streamCompleted) {
          try {
            streamCompleted = true;
            controller.close();
            controllerClosed = true;
          } catch (error) {
            console.error('Error closing controller:', error);
            controllerClosed = true;
          }
        }
      };

      let hasCompleted = false;

      try {
        const json = await req.json();
        const parsedRequest = GenerateLogoRequestSchema.safeParse(json);

        if (!parsedRequest.success) {
          safeEnqueue({
            success: false,
            message: 'Invalid request payload',
            error: {
              code: 'VALIDATION_ERROR',
              message: 'The provided data is invalid.',
              details: parsedRequest.error.flatten(),
            },
          });
          safeClose();
          return;
        }

        const { prompt, style, color_palette, font } = parsedRequest.data;

        // Create a logo brief from the validated data
        const brief: LogoBrief = {
          prompt,
          style: style,
          colors: color_palette,
          font: font,
          industry: 'general', // Placeholder, consider adding to schema if needed
        };

        const orchestrator = new MultiAgentOrchestrator(brief);

        orchestrator.on('progress', (progress: PipelineProgress) => {
          if (!hasCompleted) {
            safeEnqueue({
              success: true,
              message: `Processing stage: ${progress.currentStage}`,
              data: {
                type: 'progress',
                requestId: sessionId,
                status: 'pending',
                timestamp: new Date().toISOString(),
                progress: progress.progress || 0,
                currentStage: progress.currentStage || 'processing',
                message: progress.message || `Processing stage: ${progress.currentStage}`,
              },
            });
          }
        });

        orchestrator.on('error', (error: any) => {
          if (!hasCompleted) {
            hasCompleted = true;
            safeEnqueue({
              success: false,
              message: 'An error occurred during logo generation.',
              error: {
                code: 'ORCHESTRATOR_ERROR',
                message: error.message || 'Unknown orchestrator error',
              },
            });
            safeClose();
          }
        });

        orchestrator.on('complete', (result: any) => {
          if (!hasCompleted) {
            hasCompleted = true;
            
            // Extract SVG from the correct location in the result structure
            const svgResult = result.result?.SVGGenerationAgent;
            const svgCode = svgResult?.svg || '';
            
            safeEnqueue({
              success: true,
              message: 'Logo generation complete.',
              data: {
                type: 'result',
                requestId: sessionId,
                prompt: brief.prompt,
                status: 'success',
                timestamp: new Date().toISOString(),
                logo: {
                  id: result.id || sessionId,
                  prompt: brief.prompt,
                  svg_code: svgCode,
                  width: result.width,
                  height: result.height,
                },
              },
            });
            safeClose();
          }
        });

        await orchestrator.start();
      } catch (error: any) {
        if (!hasCompleted) {
          hasCompleted = true;
          let errorResponse;
          if (error instanceof z.ZodError) {
            errorResponse = {
              success: false,
              message: 'Invalid request format',
              error: {
                code: 'ZOD_REQUEST_VALIDATION_ERROR',
                message: 'The request structure is invalid.',
                details: error.flatten(),
              },
            };
          } else {
            errorResponse = {
              success: false,
              message: 'An unexpected error occurred.',
              error: {
                code: 'INTERNAL_SERVER_ERROR',
                message: error.message || 'An unknown error occurred.',
              },
            };
          }
          safeEnqueue(errorResponse);
          safeClose();
        }
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
});

// Also handle OPTIONS for CORS preflight
export const OPTIONS = withPerformanceMonitoring(async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
});

// Cache status endpoint
export const GET = withPerformanceMonitoring(async function GET(req: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      {
        error: 'Endpoint only available in development mode',
      },
      { status: 403 }
    );
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
      isEnabled: performanceMonitor.isEnabled(),
    };
  }

  return NextResponse.json({
    cache: cacheStats,
    performance: performanceStats,
  });
});
