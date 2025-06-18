/**
 * Animation system for SVG logos
 * 
 * This module defines the core types, interfaces, and enums used throughout
 * the animation system. It provides a consistent type system for all animation
 * functionality, ensuring type safety and proper documentation.
 * 
 * @module AnimationTypes
 */

/**
 * Available animation types for SVG logos
 * 
 * This enum defines all supported animation types in the system.
 * Each animation type represents a distinct visual effect that can be
 * applied to SVG elements.
 */
export enum AnimationType {
  /** Element fades from transparent to fully visible */
  FADE_IN = 'fade_in',
  /** Element fades in while moving upward */
  FADE_IN_UP = 'fade_in_up',
  /** Element fades in while moving downward */
  FADE_IN_DOWN = 'fade_in_down',
  /** Element fades in while moving from left */
  FADE_IN_LEFT = 'fade_in_left',
  /** Element fades in while moving from right */
  FADE_IN_RIGHT = 'fade_in_right',
  /** Element scales up from smaller size */
  ZOOM_IN = 'zoom_in',
  /** Element scales down from larger size */
  ZOOM_OUT = 'zoom_out',
  /** Element rotates around its center */
  SPIN = 'spin',
  /** Path stroke drawing effect (line drawing) */
  DRAW = 'draw',
  /** Shape morphing between different paths */
  MORPH = 'morph',
  /** Gentle floating motion (up and down) */
  FLOAT = 'float',
  /** Pulsating scale effect */
  PULSE = 'pulse',
  /** Reveal with directional wipe */
  WIPE = 'wipe',
  /** Bouncing motion effect */
  BOUNCE = 'bounce',
  /** Text appears character by character */
  TYPEWRITER = 'typewriter',
  /** Wave-like motion effect */
  WAVE = 'wave',
  /** Shimmering/glinting effect */
  SHIMMER = 'shimmer',
  /** Elements appear in sequence */
  SEQUENTIAL = 'sequential',
  /** Custom animation with provided keyframes */
  CUSTOM = 'custom'
}

/**
 * Easing functions for controlling animation acceleration/deceleration
 * 
 * These easing functions define how animations accelerate and decelerate
 * over time, creating different motion characteristics.
 */
export enum AnimationEasing {
  /** Constant speed from start to end */
  LINEAR = 'linear',
  /** Gentle acceleration and deceleration (browser default) */
  EASE = 'ease',
  /** Starts slow, ends fast */
  EASE_IN = 'ease-in',
  /** Starts fast, ends slow */
  EASE_OUT = 'ease-out',
  /** Starts slow, speeds up in the middle, ends slow */
  EASE_IN_OUT = 'ease-in-out',
  /** Overshoots target and bounces back (elastic effect) */
  ELASTIC = 'cubic-bezier(.5,2.5,.7,.7)',
  /** Bouncy motion that settles at the target */
  BOUNCE = 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
}

/**
 * Defines when animations should be triggered
 * 
 * These triggers determine what event or action causes the animation to start.
 */
export enum AnimationTrigger {
  /** Animation starts immediately when element loads */
  LOAD = 'load',
  /** Animation starts when element scrolls into viewport */
  SCROLL = 'scroll',
  /** Animation starts when user hovers over element */
  HOVER = 'hover',
  /** Animation starts when user clicks on element */
  CLICK = 'click'
}

/**
 * Configuration for animation timing parameters
 * 
 * Controls how long animations last, when they start, and how they repeat.
 */
export interface AnimationTiming {
  /** Duration of the animation in milliseconds */
  duration: number;
  /** Delay before animation starts in milliseconds */
  delay?: number;
  /** Easing function to control acceleration/deceleration */
  easing?: AnimationEasing;
  /** Number of times animation repeats (use Infinity for endless loop) */
  iterations?: number;
  /** Direction of animation playback */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

/**
 * Complete configuration options for applying animations to SVGs
 * 
 * This is the main configuration interface used when applying animations
 * to SVG elements. It combines animation type, timing, and various
 * customization options.
 */
export interface AnimationOptions {
  /** The type of animation to apply */
  type: AnimationType;
  /** Timing configuration (duration, delay, easing, etc.) */
  timing: AnimationTiming;
  /** When the animation should be triggered (default: LOAD) */
  trigger?: AnimationTrigger;
  /** Array of IDs or CSS selectors targeting elements to animate */
  elements?: string[];
  /** Delay between animations (in ms) for sequential animations */
  stagger?: number;
  /** Custom keyframes for CUSTOM animation type */
  customKeyframes?: string;
  /** Custom CSS for CUSTOM animation type */
  customCSS?: string;
  /** JavaScript code for complex custom animations */
  jsCode?: string;
  /** Transform origin point for rotation/scaling animations (e.g., "center center") */
  transformOrigin?: string;
  /** Array of element IDs defining sequence order for SEQUENTIAL type */
  sequenceOrder?: string[];
}

/**
 * Result object containing the animated SVG and associated resources
 * 
 * This interface represents the complete output of the animation process,
 * including the original and animated SVGs along with any additional
 * resources needed to render the animation.
 */
export interface AnimatedSVGLogo {
  /** Original unmodified SVG content */
  originalSvg: string;
  /** SVG with animation attributes/elements added */
  animatedSvg: string;
  /** Animation options used to create this animation */
  animationOptions: AnimationOptions;
  /** CSS code needed for the animation (for CSS-based animations) */
  cssCode?: string;
  /** JavaScript code needed for the animation (for JS-based animations) */
  jsCode?: string;
  /** URL to preview the animation (if available) */
  previewUrl?: string;
}

/**
 * Pre-configured animation template for easy application
 * 
 * Animation templates provide ready-to-use animation configurations
 * with sensible defaults, making it easier for users to apply common
 * animations without having to configure all options manually.
 */
export interface AnimationTemplate {
  /** Unique identifier for the template */
  id: string;
  /** Display name of the template */
  name: string;
  /** Description of what the animation does */
  description: string;
  /** URL to a preview of the animation */
  previewUrl?: string;
  /** Pre-configured animation options */
  defaultOptions: AnimationOptions;
  /** Whether this animation works with layered/grouped SVGs */
  compatibleWithLayers?: boolean;
  /** Whether this animation works with text elements */
  compatibleWithText?: boolean;
  /** URL to a thumbnail image for UI display */
  thumbnailUrl?: string;
}

/**
 * Response object returned by animation operations
 * 
 * This standardized response format includes the animation result
 * along with metadata about the operation's success, errors, and performance.
 */
export interface AnimationResponse {
  /** Whether the animation operation was successful */
  success: boolean;
  /** The animated SVG result (when successful) */
  result?: AnimatedSVGLogo;
  /** Error information (when unsuccessful) */
  error?: {
    /** Brief error message */
    message: string;
    /** Detailed error information for debugging */
    details?: string;
  };
  /** Number of AI tokens used (if applicable) */
  tokensUsed?: number;
  /** Time taken to process the animation in milliseconds */
  processingTime?: number;
}

/**
 * Animation provider interface for different animation implementations
 * 
 * The provider interface defines the contract that all animation technology
 * implementations must follow. This enables a plugin architecture where
 * different animation technologies (SMIL, CSS, JS) can be used interchangeably.
 */
export interface AnimationProvider {
  /** Unique identifier for the provider */
  id: string;
  /** Display name of the provider */
  name: string;
  /** Description of the provider and its capabilities */
  description: string;
  /** List of animation types this provider can handle */
  supportedAnimationTypes: AnimationType[];
  
  /**
   * Apply animation to an SVG
   * 
   * This is the main method that applies the animation to the SVG content
   * using the provider's specific animation technology.
   * 
   * @param svg - The SVG content to animate
   * @param options - Animation configuration options
   * @returns Promise resolving to an AnimatedSVGLogo containing the animated SVG
   */
  animate(svg: string, options: AnimationOptions): Promise<AnimatedSVGLogo>;
  
  /**
   * Check if this provider supports the given animation type
   * 
   * Used to determine if a provider can handle a specific animation type
   * before attempting to use it.
   * 
   * @param type - Animation type to check
   * @returns Boolean indicating if the animation type is supported
   */
  supportsAnimationType(type: AnimationType): boolean;
}