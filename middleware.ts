/**
 * @file middleware.ts
 * @description Global middleware for the AI Logo Generator
 * 
 * This file contains middleware that runs on every request.
 * 
 * @author AILogoGenerator Team
 * @version 1.0.0
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { afterResponse } from './lib/middleware/performance-middleware';

// Admin username and password (in a real app, use environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

/**
 * Middleware handler function
 * @param request Incoming request
 */
export function middleware(request: NextRequest) {
  // Performance monitoring for all requests
  const response = performanceMiddleware(request);
  
  // Admin route protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return adminMiddleware(request, response);
  }
  
  return response;
}

/**
 * Performance monitoring middleware
 * @param request Incoming request
 */
function performanceMiddleware(request: NextRequest) {
  // Just continue for now - actual monitoring happens in the handlers
  const response = NextResponse.next();
  
  // Process after response
  afterResponse(response, request);
  
  return response;
}

/**
 * Admin route protection middleware
 * @param request Incoming request
 * @param response Current response
 */
function adminMiddleware(request: NextRequest, response: NextResponse) {
  // Check for Basic Auth credentials
  const authHeader = request.headers.get('authorization');
  
  if (authHeader) {
    // Parse the Authorization header
    const authValue = authHeader.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');
    
    // Check credentials
    if (user === ADMIN_USERNAME && pwd === ADMIN_PASSWORD) {
      // Valid credentials - continue
      return response;
    }
  }
  
  // No valid auth - request authentication
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Dashboard"'
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