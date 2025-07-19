import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Simple, working logo generator - no complexity, just results
export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Initialize Anthropic directly - no wrappers, no complexity
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Simple, direct prompt to Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229', // Use a model that actually exists
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: `Create a simple SVG logo based on this description: "${prompt}"
        
Requirements:
- Return ONLY the SVG code, no explanations
- Use a viewBox of "0 0 100 100"
- Keep it simple and clean
- Use basic shapes and colors
- Make it look professional

Start with <svg and end with </svg>. Nothing else.`
      }]
    });

    // Extract SVG from response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const svgMatch = content.text.match(/<svg[^>]*>[\s\S]*<\/svg>/i);
    if (!svgMatch) {
      throw new Error('No valid SVG found in response');
    }

    const svg = svgMatch[0];

    // Return simple success response
    return NextResponse.json({
      success: true,
      logo: {
        svg,
        prompt,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Logo generation error:', error);
    
    // Simple error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate logo'
      },
      { status: 500 }
    );
  }
}