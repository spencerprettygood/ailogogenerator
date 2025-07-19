import { NextRequest, NextResponse } from 'next/server';
import { claudeService } from '@/lib/services/claude-service';

export async function GET(req: NextRequest) {
  try {
    const response = await claudeService.generateResponse(
      'Say hello in one word',
      { maxTokens: 50 }
    );
    
    return NextResponse.json({
      success: true,
      response: response,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}