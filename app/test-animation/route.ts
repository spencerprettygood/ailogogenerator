import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AnimationAgent } from '@/lib/agents/specialized/animation-agent';
import { nanoid } from 'nanoid';

/**
 * Test endpoint for AnimationAgent
 * 
 * This endpoint allows testing the AnimationAgent in isolation
 * to verify it's working correctly with various SVG inputs.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const svgIndex = parseInt(searchParams.get('svgIndex') || '0');
  const svg = sampleSVGs[svgIndex] || sampleSVGs[0];
  
  // Create agent and animation service
  const animationAgent = new AnimationAgent();
  
  try {
    // Process the SVG with animation agent
    const result = await animationAgent.execute({
      id: nanoid(),
      svg,
      designSpec: {
        businessName: "TechFlow",
        industry: "Technology",
        businessDescription: "Software development company focused on innovative solutions",
        brandPersonality: ["Professional", "Modern", "Innovative"],
        targetAudience: "Tech businesses and enterprises",
        colorPreferences: ["#3366FF", "#001133"]
      }
    });
    
    if (!result.success || !result.result) {
      console.error('Animation agent failed:', result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error,
        svg,
        message: 'Animation generation failed'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      svg,
      animatedSvg: result.result.animatedSvg,
      cssCode: result.result.cssCode,
      jsCode: result.result.jsCode,
      animationOptions: result.result.animationOptions,
      tokensUsed: result.tokensUsed,
      processingTime: result.processingTime
    });
  } catch (error) {
    console.error('Unexpected error testing animation agent:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? { 
        message: error.message,
        stack: error.stack
      } : String(error),
      svg,
      message: 'Unexpected error during animation test'
    }, { status: 500 });
  }
}

// Sample SVGs for the animation tests
const sampleSVGs = [
  // Simple logo - circles and text
  `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <circle id="main-circle" cx="100" cy="100" r="80" fill="#3366FF" />
    <circle id="inner-circle" cx="100" cy="100" r="60" fill="#001133" />
    <text id="logo-text" x="100" y="110" font-family="Arial" font-size="24" fill="white" text-anchor="middle">TechFlow</text>
  </svg>`,
  
  // Path-based logo
  `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <path id="logo-path" d="M20,50 L180,50 L150,150 L50,150 Z" fill="#3366FF" />
    <text id="logo-text" x="100" y="110" font-family="Arial" font-size="24" fill="white" text-anchor="middle">TechFlow</text>
  </svg>`,
  
  // Multiple groups logo
  `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <g id="logo-group">
      <rect id="bg-rect" x="20" y="20" width="160" height="160" fill="#001133" />
      <circle id="main-circle" cx="100" cy="100" r="60" fill="#3366FF" />
      <g id="text-group">
        <text id="logo-text" x="100" y="110" font-family="Arial" font-size="24" fill="white" text-anchor="middle">TechFlow</text>
      </g>
    </g>
  </svg>`
];
