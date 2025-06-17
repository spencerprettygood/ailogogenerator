import { NextRequest, NextResponse } from 'next/server';
import { generateLogo, PipelineProgress } from '@/lib/ai-pipeline/pipeline-orchestrator';
import { InputSanitizer, RateLimiter } from '@/lib/utils/security-utils';
import { nanoid } from 'nanoid';

// Handle rate limiting
function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    // Check rate limit
    const clientIp = getClientIp(req);
    const rateLimitResult = RateLimiter.check(clientIp);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        }
      }, { status: 429 });
    }
    
    // Parse request body
    const body = await req.json();
    const { prompt, images } = body;
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'A text prompt is required.'
        }
      }, { status: 400 });
    }
    
    // Sanitize input
    const sanitizedPrompt = InputSanitizer.sanitizeBrief(prompt);
    
    // Generate session ID
    const sessionId = nanoid();
    
    // Create response body with initial progress
    const initialResponse = {
      success: true,
      sessionId,
      progress: {
        currentStage: 'initializing',
        stageProgress: 0,
        overallProgress: 0,
        statusMessage: 'Initializing logo generation pipeline'
      }
    };
    
    // Create a new ReadableStream to send progress updates
    const stream = new ReadableStream({
      start(controller) {
        // Send initial response
        controller.enqueue(JSON.stringify(initialResponse) + '\n');
        
        // Set up progress callback
        const progressCallback = (progress: PipelineProgress) => {
          try {
            controller.enqueue(JSON.stringify({ 
              type: 'progress',
              progress 
            }) + '\n');
          } catch (err) {
            console.error('Error sending progress update:', err);
          }
        };
        
        // Start logo generation
        generateLogo({
          brief: { 
            prompt: sanitizedPrompt,
            image_uploads: images
          },
          debugMode: process.env.NODE_ENV === 'development'
        }, progressCallback)
          .then(result => {
            // Send final result
            controller.enqueue(JSON.stringify({
              type: 'result',
              result
            }) + '\n');
            controller.close();
          })
          .catch(error => {
            // Send error
            controller.enqueue(JSON.stringify({
              type: 'error',
              error: {
                message: error.message || 'Logo generation failed',
                details: error.stack || ''
              }
            }) + '\n');
            controller.close();
          });
      }
    });
    
    // Return streaming response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
    
  } catch (error) {
    console.error('Error in generate-logo API:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
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
