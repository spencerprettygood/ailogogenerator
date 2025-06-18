import { 
  AnimationProvider, 
  AnimationType, 
  AnimationOptions,
  AnimatedSVGLogo,
  AnimationEasing
} from '../types';

/**
 * CSS-based animation provider implementation
 * Handles CSS animations for SVG elements
 */
export class CSSAnimationProvider implements AnimationProvider {
  id = 'css-provider';
  name = 'CSS Animation Provider';
  description = 'Provides CSS-based animations for SVG logos';
  
  // List of animation types supported by this provider
  supportedAnimationTypes: AnimationType[] = [
    AnimationType.FADE_IN,
    AnimationType.FADE_IN_UP, 
    AnimationType.FADE_IN_DOWN,
    AnimationType.FADE_IN_LEFT,
    AnimationType.FADE_IN_RIGHT,
    AnimationType.ZOOM_IN,
    AnimationType.ZOOM_OUT,
    AnimationType.SPIN,
    AnimationType.DRAW,
    AnimationType.FLOAT,
    AnimationType.PULSE,
    AnimationType.WIPE,
    AnimationType.BOUNCE,
    AnimationType.SEQUENTIAL,
    AnimationType.SHIMMER,
    AnimationType.WAVE,
    AnimationType.CUSTOM
  ];

  /**
   * Check if this provider supports the given animation type
   */
  supportsAnimationType(type: AnimationType): boolean {
    return this.supportedAnimationTypes.includes(type);
  }

  /**
   * Apply animation to an SVG
   */
  async animate(svg: string, options: AnimationOptions): Promise<AnimatedSVGLogo> {
    try {
      // Validate and optimize SVG
      const validatedSvg = this.validateSVG(svg);
      
      // Generate a unique ID for the animation
      const uniqueId = this.generateUniqueId();
      
      // Process the SVG and generate animation code based on type
      let result: { 
        animatedSvg: string; 
        cssCode: string; 
        jsCode?: string; 
      };
      
      switch (options.type) {
        case AnimationType.FADE_IN:
          result = this.applyFadeInAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.FADE_IN_UP:
          result = this.applyFadeInUpAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.FADE_IN_DOWN:
          result = this.applyFadeInDownAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.FADE_IN_LEFT:
          result = this.applyFadeInLeftAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.FADE_IN_RIGHT:
          result = this.applyFadeInRightAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.ZOOM_IN:
          result = this.applyZoomInAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.ZOOM_OUT:
          result = this.applyZoomOutAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.SPIN:
          result = this.applySpinAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.DRAW:
          result = this.applyDrawAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.FLOAT:
          result = this.applyFloatAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.PULSE:
          result = this.applyPulseAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.BOUNCE:
          result = this.applyBounceAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.SHIMMER:
          result = this.applyShimmerAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.SEQUENTIAL:
          result = this.applySequentialAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.WAVE:
          result = this.applyWaveAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.WIPE:
          result = this.applyWipeAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.CUSTOM:
          result = this.applyCustomAnimation(validatedSvg, options, uniqueId);
          break;
        default:
          // Default to fade-in if type isn't recognized
          result = this.applyFadeInAnimation(validatedSvg, options, uniqueId);
      }
      
      // Return animated SVG result
      return {
        originalSvg: svg,
        animatedSvg: result.animatedSvg,
        animationOptions: options,
        cssCode: result.cssCode,
        jsCode: result.jsCode
      };
    } catch (error) {
      console.error('Error in CSS Animation Provider:', error);
      throw error;
    }
  }
  
  /**
   * Validate SVG to ensure it's well-formed
   */
  private validateSVG(svg: string): string {
    try {
      // Simple validation to ensure the SVG is well-formed
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      
      // Check for parsing errors
      const parserErrors = doc.getElementsByTagName('parsererror');
      if (parserErrors.length > 0) {
        throw new Error('Invalid SVG: Document contains parser errors');
      }
      
      // Check that it has an SVG root element
      const svgElement = doc.querySelector('svg');
      if (!svgElement) {
        throw new Error('Invalid SVG: Missing root <svg> element');
      }
      
      // Ensure it has viewBox or width/height
      if (!svgElement.hasAttribute('viewBox') && 
          (!svgElement.hasAttribute('width') || !svgElement.hasAttribute('height'))) {
        console.warn('SVG is missing viewBox or width/height attributes');
        // Add a default viewBox if needed
        svgElement.setAttribute('viewBox', '0 0 300 300');
      }
      
      // Return the validated (and potentially fixed) SVG
      return new XMLSerializer().serializeToString(doc);
    } catch (error) {
      console.error('SVG validation failed:', error);
      throw error;
    }
  }

  /**
   * Generate a unique ID for animation targeting
   */
  private generateUniqueId(): string {
    return `animated-svg-${Math.random().toString(36).substring(2, 11)}`;
  }
  
  /**
   * Get the animation trigger based on provided options
   */
  private getAnimationTrigger(options: AnimationOptions): string {
    // Default trigger is on load (immediate)
    return options.trigger || 'load';
  }

  /**
   * Generate CSS for handling different animation triggers
   */
  private generateTriggerCSS(uniqueId: string, options: AnimationOptions): string {
    const trigger = this.getAnimationTrigger(options);
    
    switch (trigger) {
      case 'hover':
        return `
          #${uniqueId} {
            animation-play-state: paused;
          }
          #${uniqueId}:hover {
            animation-play-state: running;
          }
        `;
      case 'scroll':
        return `
          #${uniqueId} {
            animation-play-state: paused;
            opacity: 0;
          }
          #${uniqueId}.in-viewport {
            animation-play-state: running;
          }
        `;
      case 'click':
        return `
          #${uniqueId} {
            animation-play-state: paused;
          }
          #${uniqueId}.animation-triggered {
            animation-play-state: running;
          }
        `;
      case 'load':
      default:
        return ''; // No special CSS needed for load trigger
    }
  }

  /**
   * Generate JS for handling different animation triggers
   */
  private generateTriggerJS(uniqueId: string, options: AnimationOptions): string {
    const trigger = this.getAnimationTrigger(options);
    
    switch (trigger) {
      case 'scroll':
        return `
          document.addEventListener('DOMContentLoaded', function() {
            const element = document.getElementById('${uniqueId}');
            if (!element) return;
            
            // Simple viewport check function
            function isInViewport(el) {
              const rect = el.getBoundingClientRect();
              return (
                rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.bottom >= 0
              );
            }
            
            // Check on scroll
            function checkViewport() {
              if (isInViewport(element)) {
                element.classList.add('in-viewport');
                // Once triggered, we can stop listening
                window.removeEventListener('scroll', checkViewport);
              }
            }
            
            // Initial check
            checkViewport();
            
            // Listen for scroll
            window.addEventListener('scroll', checkViewport);
          });
        `;
      case 'click':
        return `
          document.addEventListener('DOMContentLoaded', function() {
            const element = document.getElementById('${uniqueId}');
            if (!element) return;
            
            element.addEventListener('click', function() {
              element.classList.add('animation-triggered');
            });
          });
        `;
      case 'hover':
      case 'load':
      default:
        return ''; // No JS needed for hover or load triggers
    }
  }

  /**
   * Apply fade-in animation
   */
  private applyFadeInAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg fade-in"`);
    
    // Generate CSS for the animation
    const cssCode = `
      #${uniqueId}.animated-svg.fade-in {
        opacity: 0;
        animation: fadeIn-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_IN_OUT} ${timing.delay || 0}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'} both;
      }
      
      @keyframes fadeIn-${uniqueId} {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }

  /**
   * Apply fade-in-up animation
   */
  private applyFadeInUpAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg fade-in-up"`);
    
    // Generate CSS for the animation
    const cssCode = `
      #${uniqueId}.animated-svg.fade-in-up {
        opacity: 0;
        transform: translateY(20px);
        animation: fadeInUp-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_OUT} ${timing.delay || 0}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'} both;
      }
      
      @keyframes fadeInUp-${uniqueId} {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply fade-in-down animation
   */
  private applyFadeInDownAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg fade-in-down"`);
    
    // Generate CSS for the animation
    const cssCode = `
      #${uniqueId}.animated-svg.fade-in-down {
        opacity: 0;
        transform: translateY(-20px);
        animation: fadeInDown-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_OUT} ${timing.delay || 0}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'} both;
      }
      
      @keyframes fadeInDown-${uniqueId} {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply fade-in-left animation
   */
  private applyFadeInLeftAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg fade-in-left"`);
    
    // Generate CSS for the animation
    const cssCode = `
      #${uniqueId}.animated-svg.fade-in-left {
        opacity: 0;
        transform: translateX(-20px);
        animation: fadeInLeft-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_OUT} ${timing.delay || 0}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'} both;
      }
      
      @keyframes fadeInLeft-${uniqueId} {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply fade-in-right animation
   */
  private applyFadeInRightAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg fade-in-right"`);
    
    // Generate CSS for the animation
    const cssCode = `
      #${uniqueId}.animated-svg.fade-in-right {
        opacity: 0;
        transform: translateX(20px);
        animation: fadeInRight-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_OUT} ${timing.delay || 0}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'} both;
      }
      
      @keyframes fadeInRight-${uniqueId} {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply zoom-in animation
   */
  private applyZoomInAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    const transformOrigin = options.transformOrigin || 'center center';
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg zoom-in"`);
    
    // Generate CSS for the animation
    const cssCode = `
      #${uniqueId}.animated-svg.zoom-in {
        opacity: 0;
        transform: scale(0.5);
        transform-origin: ${transformOrigin};
        animation: zoomIn-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_OUT} ${timing.delay || 0}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'} both;
      }
      
      @keyframes zoomIn-${uniqueId} {
        from {
          opacity: 0;
          transform: scale(0.5);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply zoom-out animation
   */
  private applyZoomOutAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    const transformOrigin = options.transformOrigin || 'center center';
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg zoom-out"`);
    
    // Generate CSS for the animation
    const cssCode = `
      #${uniqueId}.animated-svg.zoom-out {
        opacity: 0;
        transform: scale(1.5);
        transform-origin: ${transformOrigin};
        animation: zoomOut-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_OUT} ${timing.delay || 0}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'} both;
      }
      
      @keyframes zoomOut-${uniqueId} {
        from {
          opacity: 0;
          transform: scale(1.5);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply spin animation
   */
  private applySpinAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    const transformOrigin = options.transformOrigin || 'center center';
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg spin-animation"`);
    
    // Generate CSS for the animation
    const cssCode = `
      #${uniqueId}.animated-svg.spin-animation {
        transform-origin: ${transformOrigin};
        animation: spin-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_IN_OUT} ${timing.delay || 0}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'};
      }
      
      @keyframes spin-${uniqueId} {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply drawing animation to SVG paths
   */
  private applyDrawAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    let animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg draw-animation"`);
    
    // Add stroke-dasharray and stroke-dashoffset attributes to all path elements
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(animatedSvg, 'image/svg+xml');
    
    const paths = svgDoc.querySelectorAll('path');
    paths.forEach((path, index) => {
      path.classList.add('draw-path');
      path.setAttribute('data-index', index.toString());
    });
    
    // Serialize back to string
    animatedSvg = new XMLSerializer().serializeToString(svgDoc);
    
    // Generate CSS for the animation
    const staggerDelay = options.stagger || 100;
    let pathAnimations = '';
    
    for (let i = 0; i < paths.length; i++) {
      pathAnimations += `
      #${uniqueId}.animated-svg.draw-animation .draw-path[data-index="${i}"] {
        animation: drawPath-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_IN_OUT} ${timing.delay + (i * staggerDelay)}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'} forwards;
      }
      `;
    }
    
    const cssCode = `
      #${uniqueId}.animated-svg.draw-animation .draw-path {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        fill-opacity: 0;
      }
      
      ${pathAnimations}
      
      @keyframes drawPath-${uniqueId} {
        to {
          stroke-dashoffset: 0;
          fill-opacity: 1;
        }
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply floating animation
   */
  private applyFloatAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg float-animation"`);
    
    // Generate CSS for the animation
    const cssCode = `
      #${uniqueId}.animated-svg.float-animation {
        animation: float-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_IN_OUT} ${timing.delay || 0}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'alternate'};
      }
      
      @keyframes float-${uniqueId} {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply pulse animation
   */
  private applyPulseAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    const transformOrigin = options.transformOrigin || 'center center';
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg pulse-animation"`);
    
    // Generate CSS for the animation
    const cssCode = `
      #${uniqueId}.animated-svg.pulse-animation {
        transform-origin: ${transformOrigin};
        animation: pulse-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_IN_OUT} ${timing.delay || 0}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'alternate'};
      }
      
      @keyframes pulse-${uniqueId} {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply bounce animation
   */
  private applyBounceAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg bounce-animation"`);
    
    // Generate CSS for the animation
    const cssCode = `
      #${uniqueId}.animated-svg.bounce-animation {
        animation: bounce-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.BOUNCE} ${timing.delay || 0}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'} both;
        transform-origin: center bottom;
      }
      
      @keyframes bounce-${uniqueId} {
        0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
        40% {transform: translateY(-30px);}
        60% {transform: translateY(-15px);}
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply shimmer/shine animation
   */
  private applyShimmerAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg shimmer-animation" style="position: relative; overflow: hidden;"`);
    
    // Generate CSS for the animation
    const cssCode = `
      #${uniqueId}.animated-svg.shimmer-animation::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
        transform: rotate(30deg);
        animation: shimmer-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_IN_OUT} ${timing.delay || 0}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'};
      }
      
      @keyframes shimmer-${uniqueId} {
        0% { transform: translateX(-100%) rotate(30deg); }
        100% { transform: translateX(100%) rotate(30deg); }
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply wipe animation (reveal with mask)
   */
  private applyWipeAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    let animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg wipe-animation"`);
    
    // Parse SVG to add clipping path
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(animatedSvg, 'image/svg+xml');
    
    // Get SVG dimensions
    const svgElement = svgDoc.querySelector('svg');
    let width = 300;
    let height = 300;
    
    if (svgElement) {
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const viewBoxValues = viewBox.split(' ').map(Number);
        if (viewBoxValues.length === 4) {
          width = viewBoxValues[2];
          height = viewBoxValues[3];
        }
      } else {
        width = parseInt(svgElement.getAttribute('width') || '300', 10);
        height = parseInt(svgElement.getAttribute('height') || '300', 10);
      }
      
      // Add defs with clip path for wipe effect
      let defs = svgDoc.querySelector('defs');
      if (!defs) {
        defs = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svgElement.prepend(defs);
      }
      
      // Create unique clipPath ID
      const clipPathId = `wipe-clip-${uniqueId}`;
      
      // Create clipPath element
      const clipPath = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
      clipPath.setAttribute('id', clipPathId);
      
      // Create rectangle for clipping
      const rect = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', '0');
      rect.setAttribute('y', '0');
      rect.setAttribute('width', '0');
      rect.setAttribute('height', height.toString());
      rect.setAttribute('class', 'wipe-rect');
      
      clipPath.appendChild(rect);
      defs.appendChild(clipPath);
      
      // Add clipPath to the content group
      const mainGroup = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
      mainGroup.setAttribute('clip-path', `url(#${clipPathId})`);
      
      // Move all children to the main group
      while (svgElement.childNodes.length > 0) {
        const child = svgElement.childNodes[0];
        if (child !== defs && child !== mainGroup) {
          mainGroup.appendChild(child);
        } else {
          svgElement.appendChild(child);
        }
      }
      
      svgElement.appendChild(mainGroup);
    }
    
    // Serialize back to string
    animatedSvg = new XMLSerializer().serializeToString(svgDoc);
    
    // Generate CSS for the animation
    const cssCode = `
      #${uniqueId}.animated-svg.wipe-animation .wipe-rect {
        animation: wipe-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_IN_OUT} ${timing.delay || 0}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'} forwards;
      }
      
      @keyframes wipe-${uniqueId} {
        from { width: 0; }
        to { width: ${width}px; }
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply wave animation to SVG paths
   */
  private applyWaveAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    let animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg wave-animation"`);
    
    // Parse the SVG to identify elements
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(animatedSvg, 'image/svg+xml');
    
    // Get elements to animate
    const elements = Array.from(svgDoc.querySelectorAll('path, circle, rect, ellipse, polygon, polyline'));
    
    // Add animation classes to elements
    elements.forEach((el, index) => {
      el.classList.add('wave-item');
      el.setAttribute('data-index', index.toString());
    });
    
    // Serialize back to string
    animatedSvg = new XMLSerializer().serializeToString(svgDoc);
    
    // Generate CSS for the animation
    const staggerDelay = options.stagger || 100;
    let elementAnimations = '';
    
    for (let i = 0; i < elements.length; i++) {
      elementAnimations += `
      #${uniqueId}.animated-svg.wave-animation .wave-item[data-index="${i}"] {
        animation: wave-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_IN_OUT} ${timing.delay + (i * staggerDelay)}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'};
      }
      `;
    }
    
    const cssCode = `
      @keyframes wave-${uniqueId} {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-5px) rotate(-2deg); }
        75% { transform: translateY(5px) rotate(2deg); }
      }
      
      ${elementAnimations}
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply sequential animation to elements in the SVG
   */
  private applySequentialAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    const { timing } = options;
    const staggerDelay = options.stagger || 200;
    
    // Add animation class and ID to the SVG element
    let animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg sequential-animation"`);
    
    // Parse the SVG to identify elements
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(animatedSvg, 'image/svg+xml');
    
    // Get elements to animate
    let elements: Element[] = [];
    if (options.sequenceOrder && options.sequenceOrder.length > 0) {
      // Animate elements in the specified order
      elements = options.sequenceOrder
        .map(id => svgDoc.getElementById(id))
        .filter(el => el !== null) as Element[];
    } else {
      // Animate all direct children of the SVG (except defs)
      elements = Array.from(svgDoc.querySelector('svg')?.children || [])
        .filter(el => el.tagName.toLowerCase() !== 'defs');
    }
    
    // Add animation classes to elements
    elements.forEach((el, index) => {
      el.classList.add('sequential-item');
      el.setAttribute('data-index', index.toString());
    });
    
    // Serialize back to string
    animatedSvg = new XMLSerializer().serializeToString(svgDoc);
    
    // Generate CSS for the animation
    let elementAnimations = '';
    
    for (let i = 0; i < elements.length; i++) {
      elementAnimations += `
      #${uniqueId}.animated-svg.sequential-animation .sequential-item[data-index="${i}"] {
        opacity: 0;
        animation: sequentialFadeIn-${uniqueId} ${timing.duration}ms ${timing.easing || AnimationEasing.EASE_OUT} ${timing.delay + (i * staggerDelay)}ms ${timing.iterations === Infinity ? 'infinite' : timing.iterations || '1'} ${timing.direction || 'normal'} forwards;
      }
      `;
    }
    
    const cssCode = `
      @keyframes sequentialFadeIn-${uniqueId} {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      ${elementAnimations}
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    const jsCode = this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
  
  /**
   * Apply custom animation using provided keyframes and CSS
   */
  private applyCustomAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; cssCode: string; jsCode?: string } {
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg custom-animation"`);
    
    // Use custom CSS if provided, otherwise use a simple fade-in
    const cssCode = options.customCSS || `
      #${uniqueId}.animated-svg.custom-animation {
        animation: customAnimation-${uniqueId} ${options.timing.duration}ms ${options.timing.easing || AnimationEasing.EASE} ${options.timing.delay || 0}ms ${options.timing.iterations === Infinity ? 'infinite' : options.timing.iterations || '1'} ${options.timing.direction || 'normal'} both;
      }
      
      @keyframes customAnimation-${uniqueId} {
        ${options.customKeyframes || `
        from { opacity: 0; }
        to { opacity: 1; }
        `}
      }
      
      ${this.generateTriggerCSS(uniqueId, options)}
    `;
    
    // Custom JS code if provided, or generate trigger JS
    const jsCode = options.jsCode || this.generateTriggerJS(uniqueId, options);
    
    return { animatedSvg, cssCode, jsCode };
  }
}