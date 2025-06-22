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
   */
  private async selectAppropriateAnimation(svg: string, brandName: string): Promise<AnimationOptions> {
    try {
      this.reportProgress(22, 'Analyzing SVG structure...');
      
      // Use regex to determine logo characteristics for server-side compatibility
      const hasPaths = /<path[^>]*>/i.test(svg);
      const hasText = /<text[^>]*>/i.test(svg);
      
      // Count root level elements as a rough proxy for complexity
      const elementCount = (svg.match(/<(?:path|rect|circle|ellipse|line|polyline|polygon|text|g)[^>]*>/gi) || []).length;
      const hasMultipleElements = elementCount > 3;
      
      this.reportProgress(25, 'Determining best animation type...');
      
      // Select animation type based on logo characteristics
      let animationType: AnimationType;
      
      if (hasPaths && !hasText) {
        // Path-based logos without text work well with drawing animations
        animationType = AnimationType.DRAW;
      } else if (hasMultipleElements) {
        // Complex logos with multiple elements work well with sequential animations
        animationType = AnimationType.SEQUENTIAL;
      } else if (hasText && !hasPaths) {
        // Text-only logos work well with typewriter animations
        animationType = AnimationType.TYPEWRITER;
      } else if (brandName.toLowerCase().includes('tech') || 
                brandName.toLowerCase().includes('digital') || 
                brandName.toLowerCase().includes('data')) {
        // Tech-related brands often look good with zoom-in animations
        animationType = AnimationType.ZOOM_IN;
      } else if (brandName.toLowerCase().includes('fun') || 
                brandName.toLowerCase().includes('kids') || 
                brandName.toLowerCase().includes('play')) {
        // Playful brands work well with bounce animations
        animationType = AnimationType.BOUNCE;
      } else {
        // Default to fade-in for simple logos or unclassified cases
        animationType = AnimationType.FADE_IN;
      }
      
      this.reportProgress(28, `Selected ${animationType} animation based on logo characteristics`);
      
      // Create animation options with appropriate timing for the selected type
      const animationOptions: AnimationOptions = {
        type: animationType,
        timing: {
          // Adjust duration and easing based on animation type
          duration: animationType === AnimationType.DRAW ? 2000 : 
                    animationType === AnimationType.SEQUENTIAL ? 1800 : 
                    animationType === AnimationType.TYPEWRITER ? 2500 : 1200,
          easing: animationType === AnimationType.BOUNCE ? 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 
                  animationType === AnimationType.DRAW ? 'ease-in-out' : 'ease-out'
        }
      };
      
      // Add additional options for specific animation types
      if (animationType === AnimationType.SEQUENTIAL) {
        animationOptions.stagger = 150; // 150ms between each element
      }
      
      return animationOptions;
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