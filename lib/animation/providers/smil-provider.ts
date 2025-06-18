import { 
  AnimationOptions, 
  AnimatedSVGLogo, 
  AnimationProvider, 
  AnimationType,
  AnimationEasing,
  AnimationTiming
} from '../types';
import { nanoid } from 'nanoid';

/**
 * SMIL Animation Provider
 * Implements SVG animations using SMIL (Synchronized Multimedia Integration Language)
 * which is natively supported in SVG without requiring CSS or JavaScript
 */
export class SMILAnimationProvider implements AnimationProvider {
  id: string = 'smil-animation-provider';
  name: string = 'SMIL Animation Provider';
  description: string = 'Provides native SVG animations using SMIL technology';
  
  // List of animation types supported by this provider
  supportedAnimationTypes: AnimationType[] = [
    AnimationType.FADE_IN,
    AnimationType.FADE_IN_UP,
    AnimationType.FADE_IN_DOWN,
    AnimationType.ZOOM_IN,
    AnimationType.ZOOM_OUT,
    AnimationType.SPIN,
    AnimationType.DRAW,
    AnimationType.FLOAT,
    AnimationType.PULSE
  ];
  
  /**
   * Check if this provider supports the given animation type
   * @param type Animation type to check
   * @returns Boolean indicating if the animation type is supported
   */
  supportsAnimationType(type: AnimationType): boolean {
    return this.supportedAnimationTypes.includes(type);
  }
  
  /**
   * Apply SMIL animation to an SVG
   * @param svg The SVG content to animate
   * @param options Animation options
   * @returns AnimatedSVGLogo containing the animated SVG
   */
  async animate(svg: string, options: AnimationOptions): Promise<AnimatedSVGLogo> {
    try {
      // Parse the SVG
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
      
      // Generate a unique ID for the SVG if it doesn't have one
      const svgElement = svgDoc.querySelector('svg');
      if (!svgElement) {
        throw new Error('Invalid SVG: No SVG element found');
      }
      
      const svgId = svgElement.id || `animated-svg-${nanoid(6)}`;
      svgElement.id = svgId;
      
      // Apply the appropriate animation based on the type
      let animatedSvg: string;
      
      switch (options.type) {
        case AnimationType.FADE_IN:
          animatedSvg = this.applyFadeInAnimation(svgDoc, options.timing);
          break;
        case AnimationType.FADE_IN_UP:
          animatedSvg = this.applyFadeInUpAnimation(svgDoc, options.timing);
          break;
        case AnimationType.FADE_IN_DOWN:
          animatedSvg = this.applyFadeInDownAnimation(svgDoc, options.timing);
          break;
        case AnimationType.ZOOM_IN:
          animatedSvg = this.applyZoomInAnimation(svgDoc, options.timing);
          break;
        case AnimationType.ZOOM_OUT:
          animatedSvg = this.applyZoomOutAnimation(svgDoc, options.timing);
          break;
        case AnimationType.SPIN:
          animatedSvg = this.applySpinAnimation(svgDoc, options.timing);
          break;
        case AnimationType.DRAW:
          animatedSvg = this.applyDrawAnimation(svgDoc, options.timing, options.elements);
          break;
        case AnimationType.FLOAT:
          animatedSvg = this.applyFloatAnimation(svgDoc, options.timing);
          break;
        case AnimationType.PULSE:
          animatedSvg = this.applyPulseAnimation(svgDoc, options.timing);
          break;
        default:
          throw new Error(`Animation type ${options.type} is not supported by SMIL provider`);
      }
      
      return {
        originalSvg: svg,
        animatedSvg,
        animationOptions: options
      };
    } catch (error) {
      console.error('Error applying SMIL animation:', error);
      throw error;
    }
  }
  
  /**
   * Apply fade-in animation using SMIL
   * @param svgDoc The SVG document
   * @param timing Animation timing options
   * @returns Animated SVG string
   */
  private applyFadeInAnimation(svgDoc: Document, timing: AnimationTiming): string {
    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) throw new Error('SVG element not found');
    
    // Create an opacity animation
    const animation = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animation.setAttribute('attributeName', 'opacity');
    animation.setAttribute('from', '0');
    animation.setAttribute('to', '1');
    animation.setAttribute('dur', `${timing.duration / 1000}s`);
    animation.setAttribute('begin', timing.delay ? `${timing.delay / 1000}s` : '0s');
    animation.setAttribute('fill', 'freeze');
    
    // Add easing
    if (timing.easing) {
      animation.setAttribute('calcMode', 'spline');
      animation.setAttribute('keySplines', this.getKeySplineForEasing(timing.easing));
    }
    
    // Set initial opacity
    svgElement.setAttribute('opacity', '0');
    
    // Add the animation to the root SVG element
    svgElement.appendChild(animation);
    
    return new XMLSerializer().serializeToString(svgDoc);
  }
  
  /**
   * Apply fade-in-up animation using SMIL
   * @param svgDoc The SVG document
   * @param timing Animation timing options
   * @returns Animated SVG string
   */
  private applyFadeInUpAnimation(svgDoc: Document, timing: AnimationTiming): string {
    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) throw new Error('SVG element not found');
    
    // Create an opacity animation
    const opacityAnim = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animate');
    opacityAnim.setAttribute('attributeName', 'opacity');
    opacityAnim.setAttribute('from', '0');
    opacityAnim.setAttribute('to', '1');
    opacityAnim.setAttribute('dur', `${timing.duration / 1000}s`);
    opacityAnim.setAttribute('begin', timing.delay ? `${timing.delay / 1000}s` : '0s');
    opacityAnim.setAttribute('fill', 'freeze');
    
    // Create transform animation for moving up
    const transformAnim = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
    transformAnim.setAttribute('attributeName', 'transform');
    transformAnim.setAttribute('type', 'translate');
    transformAnim.setAttribute('from', '0 20');  // Start 20 pixels down
    transformAnim.setAttribute('to', '0 0');     // Move to original position
    transformAnim.setAttribute('dur', `${timing.duration / 1000}s`);
    transformAnim.setAttribute('begin', timing.delay ? `${timing.delay / 1000}s` : '0s');
    transformAnim.setAttribute('fill', 'freeze');
    
    // Add easing
    if (timing.easing) {
      const keySpline = this.getKeySplineForEasing(timing.easing);
      opacityAnim.setAttribute('calcMode', 'spline');
      opacityAnim.setAttribute('keySplines', keySpline);
      transformAnim.setAttribute('calcMode', 'spline');
      transformAnim.setAttribute('keySplines', keySpline);
    }
    
    // Set initial opacity
    svgElement.setAttribute('opacity', '0');
    
    // Add animations to the root SVG element
    svgElement.appendChild(opacityAnim);
    svgElement.appendChild(transformAnim);
    
    return new XMLSerializer().serializeToString(svgDoc);
  }
  
  /**
   * Apply fade-in-down animation using SMIL
   * @param svgDoc The SVG document
   * @param timing Animation timing options
   * @returns Animated SVG string
   */
  private applyFadeInDownAnimation(svgDoc: Document, timing: AnimationTiming): string {
    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) throw new Error('SVG element not found');
    
    // Create an opacity animation
    const opacityAnim = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animate');
    opacityAnim.setAttribute('attributeName', 'opacity');
    opacityAnim.setAttribute('from', '0');
    opacityAnim.setAttribute('to', '1');
    opacityAnim.setAttribute('dur', `${timing.duration / 1000}s`);
    opacityAnim.setAttribute('begin', timing.delay ? `${timing.delay / 1000}s` : '0s');
    opacityAnim.setAttribute('fill', 'freeze');
    
    // Create transform animation for moving down
    const transformAnim = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
    transformAnim.setAttribute('attributeName', 'transform');
    transformAnim.setAttribute('type', 'translate');
    transformAnim.setAttribute('from', '0 -20');  // Start 20 pixels up
    transformAnim.setAttribute('to', '0 0');      // Move to original position
    transformAnim.setAttribute('dur', `${timing.duration / 1000}s`);
    transformAnim.setAttribute('begin', timing.delay ? `${timing.delay / 1000}s` : '0s');
    transformAnim.setAttribute('fill', 'freeze');
    
    // Add easing
    if (timing.easing) {
      const keySpline = this.getKeySplineForEasing(timing.easing);
      opacityAnim.setAttribute('calcMode', 'spline');
      opacityAnim.setAttribute('keySplines', keySpline);
      transformAnim.setAttribute('calcMode', 'spline');
      transformAnim.setAttribute('keySplines', keySpline);
    }
    
    // Set initial opacity
    svgElement.setAttribute('opacity', '0');
    
    // Add animations to the root SVG element
    svgElement.appendChild(opacityAnim);
    svgElement.appendChild(transformAnim);
    
    return new XMLSerializer().serializeToString(svgDoc);
  }
  
  /**
   * Apply zoom-in animation using SMIL
   * @param svgDoc The SVG document
   * @param timing Animation timing options
   * @returns Animated SVG string
   */
  private applyZoomInAnimation(svgDoc: Document, timing: AnimationTiming): string {
    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) throw new Error('SVG element not found');
    
    // Get the center of the SVG for transform origin
    let centerX = 0, centerY = 0;
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const [x, y, width, height] = viewBox.split(' ').map(Number);
      centerX = x + width / 2;
      centerY = y + height / 2;
    } else if (svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
      centerX = parseInt(svgElement.getAttribute('width') || '0') / 2;
      centerY = parseInt(svgElement.getAttribute('height') || '0') / 2;
    }
    
    // Create an opacity animation
    const opacityAnim = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animate');
    opacityAnim.setAttribute('attributeName', 'opacity');
    opacityAnim.setAttribute('from', '0');
    opacityAnim.setAttribute('to', '1');
    opacityAnim.setAttribute('dur', `${timing.duration / 1000}s`);
    opacityAnim.setAttribute('begin', timing.delay ? `${timing.delay / 1000}s` : '0s');
    opacityAnim.setAttribute('fill', 'freeze');
    
    // Create transform animation for scaling
    const transformAnim = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
    transformAnim.setAttribute('attributeName', 'transform');
    transformAnim.setAttribute('type', 'scale');
    transformAnim.setAttribute('from', '0.5');
    transformAnim.setAttribute('to', '1');
    transformAnim.setAttribute('dur', `${timing.duration / 1000}s`);
    transformAnim.setAttribute('begin', timing.delay ? `${timing.delay / 1000}s` : '0s');
    transformAnim.setAttribute('fill', 'freeze');
    
    // Add easing
    if (timing.easing) {
      const keySpline = this.getKeySplineForEasing(timing.easing);
      opacityAnim.setAttribute('calcMode', 'spline');
      opacityAnim.setAttribute('keySplines', keySpline);
      transformAnim.setAttribute('calcMode', 'spline');
      transformAnim.setAttribute('keySplines', keySpline);
    }
    
    // Set initial opacity and add transform origin
    svgElement.setAttribute('opacity', '0');
    
    // Create a wrapper group to handle transform origin
    const g = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${centerX},${centerY})`);
    
    // Add the transform animation to the group
    g.appendChild(transformAnim);
    
    // Move all children of SVG to the group
    while (svgElement.firstChild) {
      g.appendChild(svgElement.firstChild);
    }
    
    // Add the group and opacity animation to the SVG
    svgElement.appendChild(g);
    svgElement.appendChild(opacityAnim);
    
    return new XMLSerializer().serializeToString(svgDoc);
  }
  
  /**
   * Apply zoom-out animation using SMIL
   * @param svgDoc The SVG document
   * @param timing Animation timing options
   * @returns Animated SVG string
   */
  private applyZoomOutAnimation(svgDoc: Document, timing: AnimationTiming): string {
    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) throw new Error('SVG element not found');
    
    // Get the center of the SVG for transform origin
    let centerX = 0, centerY = 0;
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const [x, y, width, height] = viewBox.split(' ').map(Number);
      centerX = x + width / 2;
      centerY = y + height / 2;
    } else if (svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
      centerX = parseInt(svgElement.getAttribute('width') || '0') / 2;
      centerY = parseInt(svgElement.getAttribute('height') || '0') / 2;
    }
    
    // Create an opacity animation
    const opacityAnim = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animate');
    opacityAnim.setAttribute('attributeName', 'opacity');
    opacityAnim.setAttribute('from', '0');
    opacityAnim.setAttribute('to', '1');
    opacityAnim.setAttribute('dur', `${timing.duration / 1000}s`);
    opacityAnim.setAttribute('begin', timing.delay ? `${timing.delay / 1000}s` : '0s');
    opacityAnim.setAttribute('fill', 'freeze');
    
    // Create transform animation for scaling
    const transformAnim = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
    transformAnim.setAttribute('attributeName', 'transform');
    transformAnim.setAttribute('type', 'scale');
    transformAnim.setAttribute('from', '1.5');
    transformAnim.setAttribute('to', '1');
    transformAnim.setAttribute('dur', `${timing.duration / 1000}s`);
    transformAnim.setAttribute('begin', timing.delay ? `${timing.delay / 1000}s` : '0s');
    transformAnim.setAttribute('fill', 'freeze');
    
    // Add easing
    if (timing.easing) {
      const keySpline = this.getKeySplineForEasing(timing.easing);
      opacityAnim.setAttribute('calcMode', 'spline');
      opacityAnim.setAttribute('keySplines', keySpline);
      transformAnim.setAttribute('calcMode', 'spline');
      transformAnim.setAttribute('keySplines', keySpline);
    }
    
    // Set initial opacity
    svgElement.setAttribute('opacity', '0');
    
    // Create a wrapper group to handle transform origin
    const g = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${centerX},${centerY})`);
    
    // Add the transform animation to the group
    g.appendChild(transformAnim);
    
    // Move all children of SVG to the group
    while (svgElement.firstChild) {
      g.appendChild(svgElement.firstChild);
    }
    
    // Add the group and opacity animation to the SVG
    svgElement.appendChild(g);
    svgElement.appendChild(opacityAnim);
    
    return new XMLSerializer().serializeToString(svgDoc);
  }
  
  /**
   * Apply spin animation using SMIL
   * @param svgDoc The SVG document
   * @param timing Animation timing options
   * @returns Animated SVG string
   */
  private applySpinAnimation(svgDoc: Document, timing: AnimationTiming): string {
    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) throw new Error('SVG element not found');
    
    // Get the center of the SVG for transform origin
    let centerX = 0, centerY = 0;
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const [x, y, width, height] = viewBox.split(' ').map(Number);
      centerX = x + width / 2;
      centerY = y + height / 2;
    } else if (svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
      centerX = parseInt(svgElement.getAttribute('width') || '0') / 2;
      centerY = parseInt(svgElement.getAttribute('height') || '0') / 2;
    }
    
    // Create rotate animation
    const rotateAnim = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
    rotateAnim.setAttribute('attributeName', 'transform');
    rotateAnim.setAttribute('type', 'rotate');
    rotateAnim.setAttribute('from', '0 ' + centerX + ' ' + centerY);
    rotateAnim.setAttribute('to', '360 ' + centerX + ' ' + centerY);
    rotateAnim.setAttribute('dur', `${timing.duration / 1000}s`);
    rotateAnim.setAttribute('begin', timing.delay ? `${timing.delay / 1000}s` : '0s');
    
    // Handle repetition
    if (timing.iterations === Infinity) {
      rotateAnim.setAttribute('repeatCount', 'indefinite');
    } else if (timing.iterations && timing.iterations > 1) {
      rotateAnim.setAttribute('repeatCount', timing.iterations.toString());
    } else {
      rotateAnim.setAttribute('fill', 'freeze');
    }
    
    // Add easing
    if (timing.easing) {
      rotateAnim.setAttribute('calcMode', 'spline');
      rotateAnim.setAttribute('keySplines', this.getKeySplineForEasing(timing.easing));
    }
    
    // Add the animation to the SVG
    svgElement.appendChild(rotateAnim);
    
    return new XMLSerializer().serializeToString(svgDoc);
  }
  
  /**
   * Apply drawing animation to SVG paths
   * @param svgDoc The SVG document
   * @param timing Animation timing options
   * @param elementSelectors Optional array of element selectors to animate
   * @returns Animated SVG string
   */
  private applyDrawAnimation(svgDoc: Document, timing: AnimationTiming, elementSelectors?: string[]): string {
    // Find all path elements to animate
    let pathElements: Element[] = [];
    
    if (elementSelectors && elementSelectors.length > 0) {
      // Use provided selectors
      elementSelectors.forEach(selector => {
        const elements = svgDoc.querySelectorAll(selector);
        elements.forEach(el => pathElements.push(el));
      });
    } else {
      // Default to all paths
      pathElements = Array.from(svgDoc.querySelectorAll('path'));
    }
    
    if (pathElements.length === 0) {
      console.warn('No path elements found for drawing animation');
      return new XMLSerializer().serializeToString(svgDoc);
    }
    
    // Calculate stagger delay if multiple paths
    const staggerDelay = 100; // 100ms between each path animation
    
    // Apply drawing animation to each path
    pathElements.forEach((path, index) => {
      // Create dasharray and dashoffset animations
      const dashArray = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animate');
      dashArray.setAttribute('attributeName', 'stroke-dasharray');
      dashArray.setAttribute('from', '0 1000');
      dashArray.setAttribute('to', '1000 0');
      dashArray.setAttribute('dur', `${timing.duration / 1000}s`);
      
      // Calculate delay with staggering
      const delay = (timing.delay || 0) + (index * staggerDelay);
      dashArray.setAttribute('begin', `${delay / 1000}s`);
      dashArray.setAttribute('fill', 'freeze');
      
      // Add easing
      if (timing.easing) {
        dashArray.setAttribute('calcMode', 'spline');
        dashArray.setAttribute('keySplines', this.getKeySplineForEasing(timing.easing));
      }
      
      // Setup path for animation
      path.setAttribute('stroke-dasharray', '0 1000');
      path.setAttribute('fill-opacity', '0');
      
      // Create fill opacity animation
      const fillOpacity = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animate');
      fillOpacity.setAttribute('attributeName', 'fill-opacity');
      fillOpacity.setAttribute('from', '0');
      fillOpacity.setAttribute('to', '1');
      fillOpacity.setAttribute('dur', `${timing.duration / 2000}s`); // Half the duration
      fillOpacity.setAttribute('begin', `${(delay + timing.duration / 2) / 1000}s`); // Start halfway through the stroke animation
      fillOpacity.setAttribute('fill', 'freeze');
      
      // Add animations to path
      path.appendChild(dashArray);
      path.appendChild(fillOpacity);
    });
    
    return new XMLSerializer().serializeToString(svgDoc);
  }
  
  /**
   * Apply floating animation using SMIL
   * @param svgDoc The SVG document
   * @param timing Animation timing options
   * @returns Animated SVG string
   */
  private applyFloatAnimation(svgDoc: Document, timing: AnimationTiming): string {
    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) throw new Error('SVG element not found');
    
    // Create a vertical movement animation
    const moveAnim = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
    moveAnim.setAttribute('attributeName', 'transform');
    moveAnim.setAttribute('type', 'translate');
    moveAnim.setAttribute('values', '0 0; 0 -10; 0 0');
    moveAnim.setAttribute('keyTimes', '0; 0.5; 1');
    moveAnim.setAttribute('dur', `${timing.duration / 1000}s`);
    moveAnim.setAttribute('begin', timing.delay ? `${timing.delay / 1000}s` : '0s');
    
    // Handle repetition
    if (timing.iterations === Infinity) {
      moveAnim.setAttribute('repeatCount', 'indefinite');
    } else if (timing.iterations && timing.iterations > 1) {
      moveAnim.setAttribute('repeatCount', timing.iterations.toString());
    } else {
      moveAnim.setAttribute('repeatCount', '1');
    }
    
    // Add easing
    moveAnim.setAttribute('calcMode', 'spline');
    moveAnim.setAttribute('keySplines', '0.42 0 0.58 1; 0.42 0 0.58 1');
    
    // Add the animation to the SVG
    svgElement.appendChild(moveAnim);
    
    return new XMLSerializer().serializeToString(svgDoc);
  }
  
  /**
   * Apply pulse animation using SMIL
   * @param svgDoc The SVG document
   * @param timing Animation timing options
   * @returns Animated SVG string
   */
  private applyPulseAnimation(svgDoc: Document, timing: AnimationTiming): string {
    const svgElement = svgDoc.querySelector('svg');
    if (!svgElement) throw new Error('SVG element not found');
    
    // Get the center of the SVG for transform origin
    let centerX = 0, centerY = 0;
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const [x, y, width, height] = viewBox.split(' ').map(Number);
      centerX = x + width / 2;
      centerY = y + height / 2;
    } else if (svgElement.hasAttribute('width') && svgElement.hasAttribute('height')) {
      centerX = parseInt(svgElement.getAttribute('width') || '0') / 2;
      centerY = parseInt(svgElement.getAttribute('height') || '0') / 2;
    }
    
    // Create scale animation
    const scaleAnim = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
    scaleAnim.setAttribute('attributeName', 'transform');
    scaleAnim.setAttribute('type', 'scale');
    scaleAnim.setAttribute('values', '1; 1.1; 1');
    scaleAnim.setAttribute('keyTimes', '0; 0.5; 1');
    scaleAnim.setAttribute('dur', `${timing.duration / 1000}s`);
    scaleAnim.setAttribute('begin', timing.delay ? `${timing.delay / 1000}s` : '0s');
    
    // Handle repetition
    if (timing.iterations === Infinity) {
      scaleAnim.setAttribute('repeatCount', 'indefinite');
    } else if (timing.iterations && timing.iterations > 1) {
      scaleAnim.setAttribute('repeatCount', timing.iterations.toString());
    } else {
      scaleAnim.setAttribute('repeatCount', '1');
    }
    
    // Add easing
    scaleAnim.setAttribute('calcMode', 'spline');
    scaleAnim.setAttribute('keySplines', '0.42 0 0.58 1; 0.42 0 0.58 1');
    
    // Create a wrapper group to handle transform origin
    const g = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${centerX},${centerY})`);
    
    // Add the transform animation to the group
    g.appendChild(scaleAnim);
    
    // Move all children of SVG to the group
    while (svgElement.firstChild) {
      g.appendChild(svgElement.firstChild);
    }
    
    // Add the group to the SVG
    svgElement.appendChild(g);
    
    return new XMLSerializer().serializeToString(svgDoc);
  }
  
  /**
   * Convert AnimationEasing to SMIL keySplines values
   * @param easing The easing type
   * @returns keySplines value for the specified easing
   */
  private getKeySplineForEasing(easing: AnimationEasing): string {
    switch (easing) {
      case AnimationEasing.LINEAR:
        return '0 0 1 1';
      case AnimationEasing.EASE:
        return '0.25 0.1 0.25 1';
      case AnimationEasing.EASE_IN:
        return '0.42 0 1 1';
      case AnimationEasing.EASE_OUT:
        return '0 0 0.58 1';
      case AnimationEasing.EASE_IN_OUT:
        return '0.42 0 0.58 1';
      case AnimationEasing.ELASTIC:
        return '0.5 2.5 0.7 0.7';
      case AnimationEasing.BOUNCE:
        return '0.68 -0.55 0.265 1.55';
      default:
        return '0.25 0.1 0.25 1'; // Default to ease
    }
  }
}