/**
 * @file middleware.ts
 * @description Global middleware for the AI Logo Generator
 * 
 * This file contains middleware that runs on every request.
 * 
 * @author AILogoGenerator Team
 * @version 1.0.0
 */

import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/utils/env';

// Use secure environment variables with validation
// In development mode, provide default values if not configured
const isDev = env.isDevelopment;
const ADMIN_USERNAME = isDev ? (env.get('ADMIN_USERNAME', 'admin_user')) : env.get('ADMIN_USERNAME');
const ADMIN_PASSWORD = isDev ? (env.get('ADMIN_PASSWORD', 'Admin_Password123!')) : env.get('ADMIN_PASSWORD');

/**
 * Middleware handler function using Next.js 15 patterns
 * @param request Incoming request
 */
export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const pathname = request.nextUrl.pathname;
  
  // Admin route protection
  if (pathname.startsWith('/admin')) {
    return handleAdminAuth(request);
  }
  
  // Add performance monitoring headers
  const response = NextResponse.next();
  
  // Add Server-Timing header for basic monitoring
  const requestStartTime = request.headers.get('x-request-start-time');
  const duration = requestStartTime ? Date.now() - parseInt(requestStartTime, 10) : 0;
  response.headers.set('Server-Timing', `route;dur=${duration}`);
  
  // Add CORS headers for API routes
  if (pathname.startsWith('/api')) {
    // Add CORS headers to all API responses
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle OPTIONS requests (preflight)
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
  }
  
  return response;
}

/**
 * Admin route protection middleware using modern patterns
 * @param request Incoming request
 */
function handleAdminAuth(request: NextRequest) {
  // In development mode, allow access without authentication
  if (isDev) {
    return NextResponse.next();
  }
  
  // Check for Basic Auth credentials in production
  const authHeader = request.headers.get('authorization');
  
  if (authHeader) {
    // Parse the Authorization header
    const authValue = authHeader.split(' ')[1];
    const decodedAuth = authValue ? atob(authValue) : '';
    const [user, pwd] = decodedAuth.split(':');
    
    // Check credentials
    if (user === ADMIN_USERNAME && pwd === ADMIN_PASSWORD) {
      // Valid credentials - continue
      return NextResponse.next();
    }
  }
  
  // No valid auth - request authentication
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Dashboard"',
      'Content-Type': 'text/plain',
    },
  });
}

/**
 * Configure paths that trigger the middleware
 */
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*'
  ],
};