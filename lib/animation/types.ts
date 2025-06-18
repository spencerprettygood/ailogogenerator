/**
 * Animation system for SVG logos
 */

export enum AnimationType {
  FADE_IN = 'fade_in',
  FADE_IN_UP = 'fade_in_up',
  FADE_IN_DOWN = 'fade_in_down',
  FADE_IN_LEFT = 'fade_in_left',
  FADE_IN_RIGHT = 'fade_in_right',
  ZOOM_IN = 'zoom_in',
  ZOOM_OUT = 'zoom_out',
  SPIN = 'spin',
  DRAW = 'draw',
  MORPH = 'morph',
  FLOAT = 'float',
  PULSE = 'pulse',
  WIPE = 'wipe',
  BOUNCE = 'bounce',
  TYPEWRITER = 'typewriter',
  WAVE = 'wave',
  SHIMMER = 'shimmer',
  SEQUENTIAL = 'sequential',
  CUSTOM = 'custom'
}

export enum AnimationEasing {
  LINEAR = 'linear',
  EASE = 'ease',
  EASE_IN = 'ease-in',
  EASE_OUT = 'ease-out',
  EASE_IN_OUT = 'ease-in-out',
  ELASTIC = 'cubic-bezier(.5,2.5,.7,.7)',
  BOUNCE = 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
}

export enum AnimationTrigger {
  LOAD = 'load',
  SCROLL = 'scroll',
  HOVER = 'hover',
  CLICK = 'click'
}

export interface AnimationTiming {
  duration: number; // Duration in milliseconds
  delay?: number; // Delay in milliseconds
  easing?: AnimationEasing; // Easing function
  iterations?: number; // Number of iterations, Infinity for infinite
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

export interface AnimationOptions {
  type: AnimationType;
  timing: AnimationTiming;
  trigger?: AnimationTrigger;
  elements?: string[]; // Array of IDs or classes of elements to animate
  stagger?: number; // Delay between animations in milliseconds for sequential animations
  customKeyframes?: string; // Custom keyframes for CUSTOM type
  customCSS?: string; // Custom CSS for CUSTOM type
  transformOrigin?: string; // Transform origin for rotation/scaling animations
  sequenceOrder?: string[]; // Array of element IDs in sequence order for SEQUENTIAL type
}

export interface AnimatedSVGLogo {
  originalSvg: string;
  animatedSvg: string;
  animationOptions: AnimationOptions;
  cssCode?: string; // Separate CSS that may be needed
  jsCode?: string; // JavaScript code for more complex animations
  previewUrl?: string; // URL for preview
}

export interface AnimationTemplate {
  id: string;
  name: string;
  description: string;
  previewUrl?: string;
  defaultOptions: AnimationOptions;
  compatibleWithLayers?: boolean; // Whether this animation works with layered SVGs
  compatibleWithText?: boolean; // Whether this animation works with text elements
  thumbnailUrl?: string;
}

export interface AnimationResponse {
  success: boolean;
  result?: AnimatedSVGLogo;
  error?: {
    message: string;
    details?: string;
  };
  tokensUsed?: number;
  processingTime?: number;
}