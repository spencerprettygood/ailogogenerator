import { BaseAgent } from '../base/base-agent';
import { AgentInput, AgentOutput } from '../../types-agents';
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
  constructor() {
    super('animation');
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
      const animationResponse = await SVGAnimationService.animateSVG(input.svg, animationOptions);
      
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
    // Parse the SVG to analyze its structure
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
    
    // Check for paths that could work with the draw animation
    const hasPaths = svgDoc.querySelectorAll('path').length > 0;
    
    // Check if there are distinct elements that could be sequentially animated
    const hasMultipleElements = svgDoc.querySelector('svg')?.children.length > 3;
    
    // Check if there's text in the logo
    const hasText = svgDoc.querySelectorAll('text').length > 0;
    
    // Select animation type based on logo characteristics
    let animationType: AnimationType;
    
    if (hasPaths && !hasText) {
      animationType = AnimationType.DRAW;
    } else if (hasMultipleElements) {
      animationType = AnimationType.SEQUENTIAL;
    } else {
      // Default to fade-in for simple logos or logos with text
      animationType = AnimationType.FADE_IN;
    }
    
    // Create and return animation options
    return {
      type: animationType,
      timing: {
        duration: 1500,
        easing: 'ease-out'
      }
    };
  }
}