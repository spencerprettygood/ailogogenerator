import { SVGGenerationAgent } from '@/lib/agents/specialized/svg-generation-agent';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint for SVG generation with fallback models
 */
export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { prompt } = requestBody;
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt in request body' },
        { status: 400 }
      );
    }

    // Create a test SVG generation agent
    const agent = new SVGGenerationAgent({
      // Using all the fallback models we configured
      fallbackModels: ['claude-3-5-sonnet-20240229', 'claude-3-opus-20240229'],
      temperature: 0.7
    });
    
    // Initialize the agent
    await agent.initialize({
      sessionId: nanoid(10),
      brief: { brand_name: 'Test Brand', brief: prompt },
      sharedMemory: new Map()
    });
    
    // Execute the agent with test input
    const result = await agent.execute({
      id: 'test-input',
      designSpec: {
        brand_name: 'Test Brand',
        brand_description: prompt,
        style_preferences: 'Modern, clean, professional',
        color_palette: 'Blue, teal, white',
        imagery: 'Abstract, geometric',
        target_audience: 'Technology professionals',
        additional_requests: ''
      },
      selectedConcept: {
        name: 'Modern Tech Logo',
        description: 'A clean, abstract logo representing technology and innovation',
        style: 'Minimalist, geometric',
        colors: 'Blue gradient (#0066cc to #00ccff), white accent',
        imagery: 'Abstract circuit pattern with flowing lines'
      }
    });
    
    // Return the result
    return NextResponse.json({
      success: true,
      svg: result.success ? result.result?.svg : null,
      rationale: result.success ? result.result?.designRationale : null,
      error: !result.success ? result.error : null,
      metrics: agent.getMetrics()
    });
  } catch (error) {
    console.error('Error in test-svg endpoint:', error);
    return NextResponse.json(
      { 
        error: 'SVG generation failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}