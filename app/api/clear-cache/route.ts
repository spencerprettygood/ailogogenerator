import { NextRequest, NextResponse } from 'next/server';
import { CacheManager } from '@/lib/utils/cache-manager';

export async function POST(_req: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      error: 'Endpoint only available in development mode'
    }, { status: 403 });
  }
  
  // Clear the cache
  const cacheManager = CacheManager.getInstance();
  cacheManager.clear();
  
  // Return success
  return NextResponse.json({
    success: true,
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString()
  });
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}