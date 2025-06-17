import { NextRequest, NextResponse } from 'next/server';
import { generateLogo } from '../../../../lib/ai-pipeline/pipeline-orchestrator';
import { LogoBrief } from '../../../../lib/types';

export const config = {
  runtime: 'edge',
  maxDuration: 60, // 60 seconds maximum execution time
};

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (simple IP-based)
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';
    const rateLimitResult = checkRateLimit(ip);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({
        success: false,
        message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitResult.retryAfter || 0) / 1000)} seconds.`,
        retryAfter: rateLimitResult.retryAfter || 0
      }, { status: 429 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate input
    if (!body.prompt || typeof body.prompt !== 'string') {
      return NextResponse.json({
        success: false,
        message: 'Missing or invalid prompt in request body'
      }, { status: 400 });
    }
    
    const logoBrief: LogoBrief = {
      prompt: body.prompt,
      style: body.style,
      colors: body.colors,
      keywords: body.keywords,
      // Note: Image uploads would need to be handled separately as form data
    };
    
    // Execute logo generation pipeline
    const result = await generateLogo({
      brief: logoBrief,
      skipStages: body.skipStages,
      manualConceptSelection: body.conceptSelection
    });
    
    if (!result.success) {
      // Return error with appropriate status
      const statusCode = getErrorStatusCode(result.error?.stage);
      
      return NextResponse.json({
        success: false,
        message: result.error?.message || 'Logo generation failed',
        stage: result.error?.stage,
        progress: result.progress
      }, { status: statusCode });
    }
    
    // Return successful result
    return NextResponse.json({
      success: true,
      message: 'Logo generation completed successfully',
      result: result.result,
      progress: result.progress,
      executionTime: result.executionTime?.total,
      tokensUsed: result.tokensUsed?.total
    });
    
  } catch (error) {
    console.error('Error processing logo generation request:', error);
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Simple in-memory rate limiter
const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 10; // 10 requests
const RATE_LIMIT_WINDOW = process.env.RATE_LIMIT_WINDOW ? parseInt(process.env.RATE_LIMIT_WINDOW) : 15 * 60 * 1000; // 15 minutes

interface RequestInfo {
  count: number;
  resetTime: number;
}

const requestCounts = new Map<string, RequestInfo>();

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  
  // Get or create request info
  const requestInfo = requestCounts.get(identifier) || {
    count: 0,
    resetTime: now + RATE_LIMIT_WINDOW
  };
  
  // Reset if window expired
  if (now > requestInfo.resetTime) {
    requestInfo.count = 1;
    requestInfo.resetTime = now + RATE_LIMIT_WINDOW;
    requestCounts.set(identifier, requestInfo);
    return { allowed: true };
  }
  
  // Check if limit exceeded
  if (requestInfo.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfter: requestInfo.resetTime - now
    };
  }
  
  // Increment counter and update
  requestInfo.count++;
  requestCounts.set(identifier, requestInfo);
  
  return { allowed: true };
}

// Map error stages to appropriate HTTP status codes
function getErrorStatusCode(stage?: string): number {
  if (!stage) return 500;
  
  switch (stage) {
    case 'A':
    case 'stageA':
      return 400; // Bad Request - likely an issue with the input brief
      
    case 'system_error':
      return 500; // Internal Server Error
      
    case 'rate_limit':
      return 429; // Too Many Requests
      
    default:
      return 500; // Default to Internal Server Error
  }
}