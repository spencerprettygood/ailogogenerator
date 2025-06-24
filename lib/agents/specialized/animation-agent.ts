import { BaseAgent } from '../base/base-agent';
import { AgentInput, AgentOutput, AgentCapability } from '../../types-agents';
import { SVGAnimationService } from '../../animation/animation-service';
import { AnimationOptions, AnimationType } from '../../animation/types';

interface AnimationAgentInput extends AgentInput {
  svg: string;
  brandName: string;
  animationOptions?: AnimationOptions;
  autoSelectAnimation?: boolean;
}

interface AnimationAgentOutput extends AgentOutput {
  result?: {
    animatedSvg: string;
    cssCode: string;
    jsCode?: string;
  };
}

/**
 * Agent responsible for adding animations to SVG logos
 */
export class AnimationAgent extends BaseAgent {
  private animationService: SVGAnimationService;
  
  constructor() {
    // Pass animation-specific capabilities
    const capabilities: AgentCapability[] = ['animation'];
    super('animation', capabilities);
    
    // Initialize animation service
    this.animationService = new SVGAnimationService();
    
    // Set system prompt for animation agent
    this.systemPrompt = `You are a specialized animation agent for an AI logo generator.
    
    Your task is to apply appropriate animations to SVG logos based on their visual structure.
    
    IMPORTANT REQUIREMENTS:
    1. Analyze SVG structure to determine suitable animation types
    2. Apply animations that enhance the logo without distracting from its design
    3. Consider brand personality when selecting animations
    4. Ensure animations are performant and compatible across browsers
    5. Provide clear CSS and/or JavaScript code for implementing the animations`;
  }

  /**
   * Applies animations to SVG logos
   * 
   * @param input Animation agent input
   * @returns Animated SVG logo
   */
  async execute(input: AnimationAgentInput): Promise<AnimationAgentOutput> {
    const startTime = Date.now();
    
    try {
      // Report progress
      this.reportProgress(10, 'Analyzing logo structure...');
      
      // Determine animation options
      let animationOptions: AnimationOptions;
      
      if (input.animationOptions) {
        // Use provided animation options
        animationOptions = input.animationOptions;
        this.reportProgress(20, `Applying ${animationOptions.type} animation...`);
      } else if (input.autoSelectAnimation) {
        // Auto-select an appropriate animation based on the logo
        this.reportProgress(20, 'Selecting appropriate animation for this logo...');
        animationOptions = await this.selectAppropriateAnimation(input.svg, input.brandName);
        this.reportProgress(30, `Selected ${animationOptions.type} animation for this logo`);
      } else {
        // Use default fade-in animation
        this.reportProgress(20, 'Using default fade-in animation...');
        animationOptions = {
          type: AnimationType.FADE_IN,
          timing: {
            duration: 1000,
            easing: 'ease-in-out'
          }
        };
      }
      
      // Apply animation to the SVG logo
      this.reportProgress(40, 'Applying animation to SVG...');
      const animationResponse = await this.animationService.animateSVG(input.svg, animationOptions);
      
      if (!animationResponse.success) {
        throw new Error(`Animation failed: ${animationResponse.error?.message}`);
      }
      
      this.reportProgress(80, 'Finalizing animated SVG...');
      
      // Record token usage (minimal for this agent as it's not using Claude)
      this.recordTokenUsage(10, 10, 20);
      
      this.reportProgress(100, 'Animation applied successfully');
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        result: {
          animatedSvg: animationResponse.result!.animatedSvg,
          cssCode: animationResponse.result!.cssCode || '',
          jsCode: animationResponse.result!.jsCode
        },
        executionTime: processingTime
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.reportProgress(0, `Animation failed: ${errorMessage}`);
      
      return {
        success: false,
        error: {
          message: 'Failed to animate logo',
          details: errorMessage
        },
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Analyzes a logo and selects an appropriate animation type based on its characteristics
   * Enhanced with design intelligence and comprehensive analysis
   */
  private async selectAppropriateAnimation(svg: string, brandName: string): Promise<AnimationOptions> {
    try {
      this.reportProgress(22, 'Analyzing SVG structure and brand context with design intelligence...');
      
      // Try to use design intelligence for enhanced analysis
      let designIntelligenceAvailable = false;
      let colorHarmony = 0;
      let visualHierarchy = 0;
      let composition = 0;
      
      try {
        // Import design intelligence utilities
        const { assessSVGDesignQuality } = require('../../utils/svg-enhancer');
        
        // Create a minimal SVGLogo object for assessment
        const svgLogo = {
          svgCode: svg,
          width: 300, // Default width
          height: 300, // Default height
          elements: [], // Will be parsed internally
          colors: {
            primary: '#000000' // Default color, will be extracted from SVG
          },
          name: brandName
        };
        
        // Perform design quality assessment
        const designAssessment = await assessSVGDesignQuality(svgLogo);
        
        // Extract design quality metrics for animation selection
        colorHarmony = designAssessment.colorHarmony.score;
        visualHierarchy = designAssessment.visualHierarchy.score;
        composition = designAssessment.composition.score;
        designIntelligenceAvailable = true;
        
        this.reportProgress(24, 'Design intelligence analysis complete');
      } catch (error) {
        console.warn('Design intelligence assessment unavailable, falling back to basic analysis:', error);
      }
      
      // Comprehensive SVG structure analysis
      const hasPaths = /<path[^>]*>/i.test(svg);
      const hasText = /<text[^>]*>/i.test(svg);
      const hasCircles = /<circle[^>]*>/i.test(svg);
      const hasRects = /<rect[^>]*>/i.test(svg);
      const hasPolygons = /<polygon[^>]*>/i.test(svg);
      const hasGroups = /<g[^>]*>/i.test(svg);
      const hasGradients = /<(?:linearGradient|radialGradient)[^>]*>/i.test(svg);
      
      // Calculate element complexity
      const pathCount = (svg.match(/<path[^>]*>/gi) || []).length;
      const totalElements = (svg.match(/<(?:path|rect|circle|ellipse|line|polyline|polygon|text|g)[^>]*>/gi) || []).length;
      const hasMultipleElements = totalElements > 3;
      const isComplex = totalElements > 8 || pathCount > 5;
      
      // Detect if elements have IDs (better for targeting specific elements)
      const hasElementIds = svg.match(/id=["'][^"']*["']/gi);
      const hasNamedGroups = hasElementIds && hasGroups;
      
      // Estimate SVG size/complexity
      const svgSize = svg.length;
      const isLargeSvg = svgSize > 5000;
      
      // Brand context analysis
      const brandNameLower = brandName.toLowerCase();
      const words = brandNameLower.split(/\s+|[_\-]/);
      
      // Industry/category detection based on name
      const isTech = words.some(word => 
        ['tech', 'digital', 'data', 'cyber', 'soft', 'app', 'web', 'net', 'code', 'ai', 'cloud'].includes(word)
      );
      
      const isCreative = words.some(word => 
        ['design', 'creative', 'art', 'studio', 'media', 'film', 'photo', 'vision', 'imagine'].includes(word)
      );
      
      const isPlayful = words.some(word => 
        ['fun', 'kids', 'play', 'joy', 'happy', 'bright', 'smile', 'game'].includes(word)
      );
      
      const isLuxury = words.some(word => 
        ['luxury', 'premium', 'elite', 'exclusive', 'prestige', 'gold', 'diamond'].includes(word)
      );
      
      const isNature = words.some(word => 
        ['eco', 'green', 'nature', 'organic', 'earth', 'bio', 'leaf', 'tree', 'water', 'sun'].includes(word)
      );
      
      const isFinance = words.some(word => 
        ['finance', 'bank', 'invest', 'capital', 'wealth', 'money', 'fund', 'asset'].includes(word)
      );
      
      // Deeper SVG pattern analysis for specific logo types
      const hasCircularPattern = hasCircles && pathCount < 3; // Likely a circular logo
      const hasSquareShape = hasRects && !hasCircles && pathCount < 3; // Likely a square/rectangular logo
      const isLettermark = hasText && totalElements < 4; // Likely just text/lettermark
      const isSymbolWithText = hasText && (hasPaths || hasCircles || hasRects) && totalElements > 3; // Combined symbol & text
      const isPureSymbol = !hasText && totalElements > 0; // Just a symbol, no text
      
      this.reportProgress(25, 'Determining optimal animation strategy with design intelligence...');
      
      // Advanced animation selection logic enhanced with design intelligence
      let animationType: AnimationType;
      let animationOptions: Partial<AnimationOptions> = {};
      
      // Use design intelligence metrics if available
      if (designIntelligenceAvailable) {
        // High composition score (75+) suggests a well-balanced design that can benefit from subtle animations
        const isWellBalanced = composition >= 75;
        
        // High visual hierarchy (75+) suggests clear distinction between elements that works well with sequential animations
        const hasStrongHierarchy = visualHierarchy >= 75;
        
        // High color harmony (75+) suggests cohesive color use that works well with color-based animations
        const hasStrongColorHarmony = colorHarmony >= 75;
        
        // Enhance animation selection based on design intelligence
        if (isWellBalanced && hasCircularPattern) {
          // Well-balanced circular logos benefit from centered, radial animations
          animationType = isPlayful ? AnimationType.SPIN : AnimationType.PULSE;
          animationOptions = {
            duration: 1800,
            easing: 'ease-in-out',
            iterations: isPlayful ? 1 : 2
          };
        } else if (hasStrongHierarchy && hasMultipleElements) {
          // Logos with strong visual hierarchy work well with sequential animations
          animationType = AnimationType.SEQUENTIAL;
          animationOptions = {
            duration: 1600,
            easing: 'ease-out',
            stagger: 180 // 180ms between each element
          };
        } else if (hasStrongColorHarmony && (hasGradients || isPureSymbol)) {
          // Logos with strong color harmony work well with morphing or color transformations
          animationType = isComplex ? AnimationType.FADE_IN : AnimationType.MORPH;
          animationOptions = {
            duration: 2000,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Springy, dynamic easing
          };
        }
      }
      
      // If no animation type has been selected yet, fall back to standard logic
      if (!animationType) {
        // Base animation selection on SVG structure and brand context
        if (hasPaths && !hasText && pathCount < 5) {
          // Simple path-based logos work well with drawing animations
          animationType = AnimationType.DRAW;
          animationOptions = {
            duration: 2000,
            easing: 'ease-in-out'
          };
        } else if (hasNamedGroups && hasMultipleElements && !isComplex) {
          // Logos with organized groups work well with sequential animations
          animationType = AnimationType.SEQUENTIAL;
          animationOptions = {
            duration: 1800,
            easing: 'ease-out',
            stagger: 150 // 150ms between each element
          };
        } else if (isLettermark && !isComplex) {
          // Text-only logos work well with typewriter or fade animations
          if (brandNameLower.length < 8) {
            animationType = AnimationType.TYPEWRITER;
            animationOptions = {
              duration: 2500,
              easing: 'ease-in-out'
            };
          } else {
            animationType = AnimationType.FADE_IN;
            animationOptions = {
              duration: 1200,
              easing: 'ease-out'
            };
          }
        } else if (isSymbolWithText && hasNamedGroups) {
          // Symbol with text works well with staggered reveal
          animationType = AnimationType.SEQUENTIAL;
          animationOptions = {
            duration: 1500,
            easing: 'ease-out',
            stagger: 250 // Longer delay between symbol and text
          };
        } else if (isPureSymbol && hasCircularPattern) {
          // Circular symbols work well with spin or pulse
          if (isPlayful) {
            animationType = AnimationType.SPIN;
            animationOptions = {
              duration: 1500,
              easing: 'ease-in-out',
              iterations: 1
            };
          } else {
            animationType = AnimationType.PULSE;
            animationOptions = {
              duration: 1800,
              easing: 'ease-in-out',
              iterations: 2
            };
          }
        } else if (isPureSymbol && hasSquareShape) {
          // Square/rectangular symbols work well with flip or zoom
          animationType = AnimationType.ZOOM_IN;
          animationOptions = {
            duration: 1200,
            easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Slight overshoot
          };
        } else {
          // Industry-specific defaults when structure analysis is inconclusive
          if (isTech) {
            // Tech brands benefit from modern, clean animations
            animationType = AnimationType.ZOOM_IN;
            animationOptions = {
              duration: 1200,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)' // Expo-like easing
            };
          } else if (isCreative) {
            // Creative brands benefit from more dynamic animations
            animationType = isComplex ? AnimationType.SEQUENTIAL : AnimationType.MORPH;
            animationOptions = {
              duration: isComplex ? 2000 : 1800,
              easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Springy, creative feel
              stagger: isComplex ? 120 : undefined
            };
          } else if (isPlayful) {
            // Playful brands benefit from fun, bouncy animations
            animationType = AnimationType.BOUNCE;
            animationOptions = {
              duration: 1500,
              easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Elastic, playful bounce
              iterations: 1
            };
          } else if (isLuxury) {
            // Luxury brands benefit from subtle, elegant animations
            animationType = AnimationType.FADE_IN;
            animationOptions = {
              duration: 1800,
              easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)' // Subtle, refined easing
            };
          } else if (isNature) {
            // Nature brands benefit from organic, flowing animations
            animationType = hasMultipleElements ? AnimationType.SEQUENTIAL : AnimationType.FLOAT;
            animationOptions = {
              duration: 2200,
              easing: 'cubic-bezier(0.42, 0, 0.58, 1)', // Natural, fluid motion
              stagger: hasMultipleElements ? 180 : undefined
            };
          } else if (isFinance) {
            // Finance brands benefit from stable, trustworthy animations
            animationType = AnimationType.FADE_IN;
            animationOptions = {
              duration: 1200,
              easing: 'ease-out' // Stable, predictable motion
            };
          } else {
            // Default to fade-in for unclassified cases with a moderate duration
            animationType = AnimationType.FADE_IN;
            animationOptions = {
              duration: 1200,
              easing: 'ease-out'
            };
          }
        }
      }
      
      const sourceName = designIntelligenceAvailable ? 'design intelligence enhanced' : 'comprehensive';
      this.reportProgress(28, `Selected ${animationType} animation based on ${sourceName} analysis`);
      
      // Construct final animation options
      const finalOptions: AnimationOptions = {
        type: animationType,
        timing: {
          duration: animationOptions.duration || 1200,
          easing: animationOptions.easing || 'ease-out',
          delay: animationOptions.delay || 0,
          iterations: animationOptions.iterations || 1
        }
      };
      
      // Add any additional type-specific options
      if (animationOptions.stagger) {
        finalOptions.stagger = animationOptions.stagger;
      }
      
      return finalOptions;
    } catch (error) {
      console.error('Error selecting appropriate animation:', error);
      
      // Return a safe default option in case of errors
      return {
        type: AnimationType.FADE_IN,
        timing: {
          duration: 1000,
          easing: 'ease-in-out'
        }
      };
    }
  }
  
  /**
   * Abstract methods required by BaseAgent
   */
  protected async generatePrompt(input: AgentInput): Promise<string> {
    // This agent doesn't use Claude for generation, but we need to implement this method
    return '';
  }
  
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<AgentOutput> {
    // This agent doesn't use Claude for generation, but we need to implement this method
    return { success: true };
  }
}