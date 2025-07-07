import { NextRequest, NextResponse } from 'next/server';

// CORS configuration for the application
const corsConfig = {
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'https://ai-logo-generator.vercel.app',
    ...(process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(',') || []),
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Auth-Token',
  ],
  exposedHeaders: ['X-Total-Count', 'Content-Disposition'],
  maxAge: 86400, // 24 hours in seconds
  credentials: true,
};

/**
 * CORS handler for API routes
 * Handles OPTIONS requests with proper CORS headers for preflight checks
 */
export async function OPTIONS(req: NextRequest) {
  // Get the origin from the request headers
  const origin = req.headers.get('origin') || '';

  // Check if the origin is allowed or use development mode bypass
  const isAllowedOrigin =
    process.env.NODE_ENV === 'development' ||
    corsConfig.allowedOrigins.includes(origin) ||
    corsConfig.allowedOrigins.includes('*');

  // Set the allowed origin
  const corsOrigin = isAllowedOrigin ? origin : corsConfig.allowedOrigins[0];

  // Create a response with CORS headers
  // Create response with proper headers
  const response = new NextResponse(null, { status: 204 });

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', corsOrigin || '*');
  response.headers.set('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
  response.headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
  response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());
  response.headers.set(
    'Access-Control-Allow-Credentials',
    corsConfig.credentials ? 'true' : 'false'
  );

  return response;
}

/**
 * Utility function to apply CORS headers to any response
 */
export function applyCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin') || '';

  // Check if the origin is allowed or use development mode bypass
  const isAllowedOrigin =
    process.env.NODE_ENV === 'development' ||
    corsConfig.allowedOrigins.includes(origin) ||
    corsConfig.allowedOrigins.includes('*');

  // Set the allowed origin
  const corsOrigin = isAllowedOrigin ? origin : corsConfig.allowedOrigins[0];

  // Add CORS headers to the response
  response.headers.set('Access-Control-Allow-Origin', corsOrigin || '*');
  response.headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));

  if (corsConfig.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

/**
 * Test endpoint to verify CORS configuration
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.json({
    message: 'CORS configured successfully',
    timestamp: new Date().toISOString(),
    config: {
      allowedOrigins: corsConfig.allowedOrigins,
      allowedMethods: corsConfig.allowedMethods,
    },
  });

  return applyCorsHeaders(response, request);
}
