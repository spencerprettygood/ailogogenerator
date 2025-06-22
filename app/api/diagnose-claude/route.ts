import { NextRequest, NextResponse } from 'next/server';
import { claudeService } from '@/lib/services/claude-service';
import { withErrorHandling } from '@/lib/middleware/error-middleware';
import { env, config } from '@/lib/utils/env';

/**
 * Diagnose Claude API connection issues
 * This endpoint is only available in development mode
 */
export const GET = withErrorHandling(async function GET(req: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({
      error: 'This endpoint is only available in development mode'
    }, { status: 403 });
  }
  
  // Collect diagnostic information
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      node_env: process.env.NODE_ENV,
      next_runtime: process.env.NEXT_RUNTIME || 'default',
      app_url: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
    },
    anthropic: {
      api_key_present: Boolean(env.ANTHROPIC_API_KEY),
      api_key_format_valid: validateApiKeyFormat(env.ANTHROPIC_API_KEY),
    },
    config: {
      is_client: config.isClient,
      is_development: config.isDevelopment,
      caching_enabled: config.features.cachingEnabled,
    }
  };
  
  // Try a simple API call to test the connection
  try {
    const testResponse = await claudeService.generateResponse(
      "Hello, this is a test prompt to verify connectivity. Please respond with 'Connection successful'.",
      {
        systemPrompt: "You are a test assistant. Respond with 'Connection successful' to verify connectivity.",
        model: 'claude-3-sonnet-20240229', // Use a stable model for testing
        temperature: 0,
        maxTokens: 20,
      }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Claude API diagnostic successful',
      diagnostics,
      test_response: {
        content: testResponse.content,
        processing_time: testResponse.processingTime,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Claude API diagnostic failed',
      error: error instanceof Error ? error.message : String(error),
      diagnostics,
    }, { status: 500 });
  }
});

/**
 * Validate the format of an Anthropic API key
 * This doesn't check if the key is valid, just if it follows the expected format
 */
function validateApiKeyFormat(apiKey?: string): boolean {
  if (!apiKey) return false;
  
  // Check if it follows the typical format of Anthropic API keys
  const validFormat = /^sk-ant-api\d{2}-[a-zA-Z0-9_-]{48,}$/.test(apiKey);
  
  return validFormat;
}