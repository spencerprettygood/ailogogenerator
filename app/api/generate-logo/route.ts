import { NextRequest, NextResponse } from 'next/server';
import { InputSanitizer, RateLimiter } from '@/lib/utils/security-utils';
import { nanoid } from 'nanoid';
import { MultiAgentOrchestrator } from '@/lib/agents/orchestrator';
import { PipelineProgress } from '@/lib/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Create a TextEncoder for the streaming response
    const encoder = new TextEncoder();
    
    // Initialize the response stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Safely parse JSON with proper error handling
          let body;
          try {
            const text = await req.text();
            body = JSON.parse(text);
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
          
          const { prompt, images } = body;
          
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
          
          // Create and execute the multi-agent orchestrator
          const orchestrator = new MultiAgentOrchestrator(
            {
              prompt: sanitizedPrompt,
              image_uploads: images || []
            },
            {
              maxConcurrentAgents: 2,
              timeoutMs: 180000, // 3 minutes
              retryFailedAgents: true,
              debugMode: process.env.NODE_ENV === 'development'
            },
            progressCallback
          );
          
          // Execute the orchestrator
          const result = await orchestrator.execute();
          
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
        } catch (error) {
          console.error('Error in logo generation:', error);
          
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
}

// Also handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}