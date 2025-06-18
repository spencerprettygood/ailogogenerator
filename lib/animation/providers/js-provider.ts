import { 
  AnimationProvider, 
  AnimationType, 
  AnimationOptions,
  AnimatedSVGLogo,
  AnimationEasing
} from '../types';

/**
 * JavaScript-based animation provider implementation
 * Handles complex animations that require JavaScript such as morphing and path following
 */
export class JSAnimationProvider implements AnimationProvider {
  id = 'js-provider';
  name = 'JavaScript Animation Provider';
  description = 'Provides JavaScript-based animations for SVG logos, handling complex animations that CSS and SMIL cannot';
  
  // List of animation types supported by this provider
  supportedAnimationTypes: AnimationType[] = [
    AnimationType.MORPH,
    AnimationType.DRAW, 
    AnimationType.FLOAT,
    AnimationType.PULSE,
    AnimationType.WAVE,
    AnimationType.SHIMMER,
    AnimationType.SEQUENTIAL,
    AnimationType.TYPEWRITER,
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
        cssCode?: string; 
        jsCode: string; 
      };
      
      switch (options.type) {
        case AnimationType.MORPH:
          result = this.applyMorphAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.DRAW:
          result = this.applyDrawAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.TYPEWRITER:
          result = this.applyTypewriterAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.WAVE:
          result = this.applyWaveAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.SHIMMER:
          result = this.applyShimmerAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.SEQUENTIAL:
          result = this.applySequentialAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.FLOAT:
          result = this.applyFloatAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.PULSE:
          result = this.applyPulseAnimation(validatedSvg, options, uniqueId);
          break;
        case AnimationType.CUSTOM:
          result = this.applyCustomAnimation(validatedSvg, options, uniqueId);
          break;
        default:
          // Default to a simple fade in if type isn't supported
          result = this.applyDefaultAnimation(validatedSvg, options, uniqueId);
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
      console.error('Error in JS Animation Provider:', error);
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
   * Apply morphing animation to SVG paths
   */
  private applyMorphAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; jsCode: string; cssCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg morph-animation"`);
    
    // Generate CSS for basic styling
    const cssCode = `
      #${uniqueId}.animated-svg.morph-animation {
        /* Base styling for morphing animation */
      }
    `;
    
    // Generate JavaScript for the morphing animation
    // This implementation uses requestAnimationFrame for smooth animation
    const jsCode = `
      (function() {
        // Morph Animation for ${uniqueId}
        document.addEventListener('DOMContentLoaded', function() {
          const svg = document.getElementById('${uniqueId}');
          if (!svg) return;
          
          const paths = Array.from(svg.querySelectorAll('path'));
          if (paths.length < 2) return; // Need at least 2 paths for morphing
          
          // Store original path data
          const pathData = paths.map(path => path.getAttribute('d'));
          
          // Animation configuration
          const config = {
            duration: ${timing.duration},
            delay: ${timing.delay || 0},
            easing: '${timing.easing || AnimationEasing.EASE_IN_OUT}',
            iterations: ${timing.iterations === Infinity ? 'Infinity' : timing.iterations || 1}
          };
          
          // Easing functions
          const easingFunctions = {
            'linear': t => t,
            'ease': t => 0.25 * Math.pow(t, 2) * ((2.75 * t) - 1.75),
            'ease-in': t => t * t,
            'ease-out': t => t * (2 - t),
            'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
          };
          
          // Choose easing function
          const ease = easingFunctions[config.easing.replace(/-/g, '')] || easingFunctions['ease-in-out'];
          
          // Animation state
          let startTime = null;
          let animationFrame = null;
          let currentIteration = 0;
          let pauseTimeout = null;
          
          // Performance optimization: throttle animation
          const throttle = (func, limit) => {
            let lastCall = 0;
            return function(...args) {
              const now = Date.now();
              if (now - lastCall >= limit) {
                lastCall = now;
                return func.apply(this, args);
              }
            };
          };
          
          // Interpolate between two SVG paths
          const interpolatePath = (pathA, pathB, progress) => {
            // Convert paths to arrays of points
            const pointsA = pathA.match(/[A-Z][^A-Z]*/gi) || [];
            const pointsB = pathB.match(/[A-Z][^A-Z]*/gi) || [];
            
            // Use the shorter path length
            const length = Math.min(pointsA.length, pointsB.length);
            
            let result = '';
            for (let i = 0; i < length; i++) {
              const typeA = pointsA[i].charAt(0);
              const typeB = pointsB[i].charAt(0);
              
              if (typeA === typeB) {
                // Same command type, interpolate numbers
                const numbersA = pointsA[i].slice(1).trim().split(/[\\s,]+/).map(Number);
                const numbersB = pointsB[i].slice(1).trim().split(/[\\s,]+/).map(Number);
                
                const numbersLength = Math.min(numbersA.length, numbersB.length);
                let interpolated = typeA;
                
                for (let j = 0; j < numbersLength; j++) {
                  const valueA = numbersA[j];
                  const valueB = numbersB[j];
                  const value = valueA + (valueB - valueA) * progress;
                  interpolated += ' ' + value.toFixed(2);
                }
                
                result += interpolated;
              } else {
                // Different command types, just use current path
                result += progress < 0.5 ? pointsA[i] : pointsB[i];
              }
            }
            
            return result;
          };
          
          // Animation loop
          const animate = throttle(function(timestamp) {
            if (!startTime) startTime = timestamp;
            
            const elapsed = timestamp - startTime;
            let progress = Math.min(elapsed / config.duration, 1);
            progress = ease(progress);
            
            // For each path, interpolate between original and target
            paths.forEach((path, i) => {
              // Determine source and target based on current direction
              const source = pathData[i];
              const target = pathData[(i + 1) % pathData.length];
              
              // Interpolate and update path
              const interpolated = interpolatePath(source, target, progress);
              path.setAttribute('d', interpolated);
            });
            
            if (progress < 1) {
              // Continue animation
              animationFrame = requestAnimationFrame(animate);
            } else {
              // Animation complete
              currentIteration++;
              
              if (config.iterations === Infinity || currentIteration < config.iterations) {
                // Rotate path data for next iteration (move first path to end)
                pathData.push(pathData.shift());
                
                // Reset animation with slight delay
                startTime = null;
                pauseTimeout = setTimeout(() => {
                  animationFrame = requestAnimationFrame(animate);
                }, 500); // 500ms pause between iterations
              }
            }
          }, 16); // Throttle to ~60fps
          
          // Start animation after delay
          setTimeout(() => {
            animationFrame = requestAnimationFrame(animate);
          }, config.delay);
          
          // Cleanup function for animation
          const cleanup = () => {
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
              animationFrame = null;
            }
            if (pauseTimeout) {
              clearTimeout(pauseTimeout);
              pauseTimeout = null;
            }
          };
          
          // Clean up on page leave
          window.addEventListener('unload', cleanup);
          
          // Store cleanup function on element
          svg.__animationCleanup = cleanup;
        });
      })();
    `;
    
    return { animatedSvg, jsCode, cssCode };
  }

  /**
   * Apply drawing animation to SVG paths using JS for more precise control
   */
  private applyDrawAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; jsCode: string; cssCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg draw-animation"`);
    
    // Generate CSS for styling
    const cssCode = `
      #${uniqueId}.animated-svg.draw-animation path,
      #${uniqueId}.animated-svg.draw-animation line,
      #${uniqueId}.animated-svg.draw-animation polyline,
      #${uniqueId}.animated-svg.draw-animation polygon,
      #${uniqueId}.animated-svg.draw-animation rect,
      #${uniqueId}.animated-svg.draw-animation circle,
      #${uniqueId}.animated-svg.draw-animation ellipse {
        fill-opacity: 0;
      }
    `;
    
    // Generate JavaScript for the drawing animation
    const jsCode = `
      (function() {
        // Draw Animation for ${uniqueId}
        document.addEventListener('DOMContentLoaded', function() {
          const svg = document.getElementById('${uniqueId}');
          if (!svg) return;
          
          // Get all elements that can be drawn
          const elements = svg.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse');
          if (elements.length === 0) return;
          
          // Animation configuration
          const config = {
            duration: ${timing.duration},
            delay: ${timing.delay || 0},
            easing: '${timing.easing || AnimationEasing.EASE_IN_OUT}',
            stagger: ${options.stagger || 100},
            iterations: ${timing.iterations === Infinity ? 'Infinity' : timing.iterations || 1}
          };
          
          // Easing functions
          const easingFunctions = {
            'linear': t => t,
            'ease': t => 0.25 * Math.pow(t, 2) * ((2.75 * t) - 1.75),
            'ease-in': t => t * t,
            'ease-out': t => t * (2 - t),
            'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
          };
          
          // Choose easing function
          const ease = easingFunctions[config.easing.replace(/-/g, '')] || easingFunctions['ease-in-out'];
          
          // Setup elements for animation
          elements.forEach((element, index) => {
            const elementType = element.tagName.toLowerCase();
            
            // For path elements, calculate the length
            if (elementType === 'path') {
              const pathLength = element.getTotalLength();
              element.style.strokeDasharray = pathLength;
              element.style.strokeDashoffset = pathLength;
            } 
            // For other elements, apply appropriate dash array based on perimeter
            else {
              let perimeter;
              
              switch (elementType) {
                case 'rect':
                  const width = parseFloat(element.getAttribute('width') || '0');
                  const height = parseFloat(element.getAttribute('height') || '0');
                  perimeter = 2 * (width + height);
                  break;
                  
                case 'circle':
                  const radius = parseFloat(element.getAttribute('r') || '0');
                  perimeter = 2 * Math.PI * radius;
                  break;
                  
                case 'ellipse':
                  const rx = parseFloat(element.getAttribute('rx') || '0');
                  const ry = parseFloat(element.getAttribute('ry') || '0');
                  // Approximation of ellipse perimeter
                  perimeter = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2);
                  break;
                  
                case 'line':
                  const x1 = parseFloat(element.getAttribute('x1') || '0');
                  const y1 = parseFloat(element.getAttribute('y1') || '0');
                  const x2 = parseFloat(element.getAttribute('x2') || '0');
                  const y2 = parseFloat(element.getAttribute('y2') || '0');
                  perimeter = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                  break;
                  
                case 'polyline':
                case 'polygon':
                  const points = element.getAttribute('points')?.split(/\\s+|,/) || [];
                  if (points.length >= 4) {
                    perimeter = 0;
                    for (let i = 0; i < points.length - 2; i += 2) {
                      const x1 = parseFloat(points[i]);
                      const y1 = parseFloat(points[i + 1]);
                      const x2 = parseFloat(points[i + 2]);
                      const y2 = parseFloat(points[i + 3]);
                      perimeter += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                    }
                    
                    // For polygons, close the shape
                    if (elementType === 'polygon') {
                      const x1 = parseFloat(points[points.length - 2]);
                      const y1 = parseFloat(points[points.length - 1]);
                      const x2 = parseFloat(points[0]);
                      const y2 = parseFloat(points[1]);
                      perimeter += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                    }
                  } else {
                    perimeter = 100; // Default if insufficient points
                  }
                  break;
                  
                default:
                  perimeter = 100; // Default perimeter
              }
              
              element.style.strokeDasharray = perimeter;
              element.style.strokeDashoffset = perimeter;
            }
            
            // Store original fill for restoration
            element.dataset.originalFill = element.getAttribute('fill') || 'none';
            element.style.fill = 'none';
            
            // Store original stroke for restoration
            element.dataset.originalStroke = element.getAttribute('stroke') || '#000';
            if (!element.getAttribute('stroke')) {
              element.setAttribute('stroke', element.dataset.originalStroke);
            }
            
            // Apply delay based on stagger
            element.dataset.animationDelay = String(config.delay + (index * config.stagger));
          });
          
          // Animation state tracking
          const animationState = {
            startTime: null,
            elementsAnimating: new Map(),
            animationFrame: null,
            currentIteration: 0
          };
          
          // Performance optimization: throttle animation
          const throttle = (func, limit) => {
            let lastCall = 0;
            return function(...args) {
              const now = Date.now();
              if (now - lastCall >= limit) {
                lastCall = now;
                return func.apply(this, args);
              }
            };
          };
          
          // Animation loop
          const animate = throttle(function(timestamp) {
            if (!animationState.startTime) animationState.startTime = timestamp;
            
            // Process each element
            elements.forEach((element, index) => {
              const elementDelay = parseInt(element.dataset.animationDelay || '0');
              
              // Check if this element should start animating
              if (timestamp - animationState.startTime >= elementDelay) {
                if (!animationState.elementsAnimating.has(element)) {
                  // Initialize this element's animation
                  animationState.elementsAnimating.set(element, {
                    startTime: timestamp
                  });
                }
                
                const elementState = animationState.elementsAnimating.get(element);
                const elapsed = timestamp - elementState.startTime;
                let progress = Math.min(elapsed / config.duration, 1);
                progress = ease(progress);
                
                // Calculate stroke dash offset based on progress
                const dashArray = parseFloat(element.style.strokeDasharray);
                const dashOffset = dashArray * (1 - progress);
                element.style.strokeDashoffset = dashOffset;
                
                // Fade in fill as the stroke completes
                if (progress > 0.7) {
                  const fillOpacity = (progress - 0.7) / 0.3;
                  element.style.fill = element.dataset.originalFill;
                  element.style.fillOpacity = fillOpacity;
                }
                
                // Mark as complete when done
                if (progress >= 1) {
                  elementState.complete = true;
                }
              }
            });
            
            // Check if all elements are complete
            const allComplete = Array.from(animationState.elementsAnimating.values())
              .every(state => state.complete);
            
            if (animationState.elementsAnimating.size === elements.length && allComplete) {
              // Current iteration complete
              animationState.currentIteration++;
              
              if (config.iterations === Infinity || animationState.currentIteration < config.iterations) {
                // Reset for next iteration
                animationState.startTime = timestamp;
                animationState.elementsAnimating.clear();
                
                // Reset all elements
                elements.forEach(element => {
                  element.style.strokeDashoffset = element.style.strokeDasharray;
                  element.style.fill = 'none';
                  element.style.fillOpacity = '0';
                });
              } else {
                // All iterations complete
                // Restore original state
                elements.forEach(element => {
                  element.style.strokeDasharray = '';
                  element.style.strokeDashoffset = '';
                  element.style.fill = element.dataset.originalFill;
                  element.style.fillOpacity = '1';
                });
                return;
              }
            }
            
            // Continue animation
            animationState.animationFrame = requestAnimationFrame(animate);
          }, 16); // Throttle to ~60fps
          
          // Start animation
          animationState.animationFrame = requestAnimationFrame(animate);
          
          // Cleanup function
          const cleanup = () => {
            if (animationState.animationFrame) {
              cancelAnimationFrame(animationState.animationFrame);
            }
            
            // Restore original state
            elements.forEach(element => {
              element.style.strokeDasharray = '';
              element.style.strokeDashoffset = '';
              element.style.fill = element.dataset.originalFill;
              element.style.fillOpacity = '1';
            });
          };
          
          // Clean up on page leave
          window.addEventListener('unload', cleanup);
          
          // Store cleanup function on element
          svg.__animationCleanup = cleanup;
        });
      })();
    `;
    
    return { animatedSvg, jsCode, cssCode };
  }

  /**
   * Apply typewriter animation to text elements
   */
  private applyTypewriterAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; jsCode: string; cssCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg typewriter-animation"`);
    
    // Generate CSS for styling
    const cssCode = `
      #${uniqueId}.animated-svg.typewriter-animation text {
        visibility: visible;
      }
    `;
    
    // Generate JavaScript for the typewriter animation
    const jsCode = `
      (function() {
        // Typewriter Animation for ${uniqueId}
        document.addEventListener('DOMContentLoaded', function() {
          const svg = document.getElementById('${uniqueId}');
          if (!svg) return;
          
          // Get all text elements
          const textElements = svg.querySelectorAll('text');
          if (textElements.length === 0) return;
          
          // Animation configuration
          const config = {
            duration: ${timing.duration},
            delay: ${timing.delay || 0},
            easing: '${timing.easing || AnimationEasing.EASE_IN_OUT}',
            stagger: ${options.stagger || 100},
            iterations: ${timing.iterations === Infinity ? 'Infinity' : timing.iterations || 1}
          };
          
          // Prepare text elements for animation
          textElements.forEach((textElement, index) => {
            // Clone the text element
            const originalContent = textElement.textContent || '';
            textElement.textContent = '';
            
            // Create tspan for each character
            originalContent.split('').forEach((char, charIndex) => {
              const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
              tspan.textContent = char;
              tspan.style.opacity = '0';
              tspan.dataset.index = charIndex.toString();
              textElement.appendChild(tspan);
            });
            
            // Set element delay based on stagger
            textElement.dataset.delay = String(config.delay + (index * config.stagger));
          });
          
          // Animation state
          let startTime = null;
          let animationFrame = null;
          let currentIteration = 0;
          
          // Animation loop
          const animate = function(timestamp) {
            if (!startTime) startTime = timestamp;
            
            // Process each text element
            textElements.forEach((textElement) => {
              const elementDelay = parseInt(textElement.dataset.delay || '0');
              
              if (timestamp - startTime >= elementDelay) {
                const elapsed = timestamp - startTime - elementDelay;
                const tspans = textElement.querySelectorAll('tspan');
                
                // Calculate how many characters should be visible
                const charDuration = config.duration / tspans.length;
                const charsVisible = Math.floor(elapsed / charDuration);
                
                // Update visibility of each character
                tspans.forEach((tspan, i) => {
                  if (i < charsVisible) {
                    tspan.style.opacity = '1';
                  } else {
                    tspan.style.opacity = '0';
                  }
                });
              }
            });
            
            // Check if animation is complete
            const maxDelay = Math.max(...Array.from(textElements).map(el => parseInt(el.dataset.delay || '0')));
            const totalDuration = maxDelay + config.duration;
            
            if (timestamp - startTime < totalDuration) {
              // Continue animation
              animationFrame = requestAnimationFrame(animate);
            } else {
              // Animation complete
              currentIteration++;
              
              if (config.iterations === Infinity || currentIteration < config.iterations) {
                // Reset for next iteration
                textElements.forEach(textElement => {
                  const tspans = textElement.querySelectorAll('tspan');
                  tspans.forEach(tspan => {
                    tspan.style.opacity = '0';
                  });
                });
                
                startTime = timestamp;
                animationFrame = requestAnimationFrame(animate);
              } else {
                // All iterations complete, ensure all text is visible
                textElements.forEach(textElement => {
                  const tspans = textElement.querySelectorAll('tspan');
                  tspans.forEach(tspan => {
                    tspan.style.opacity = '1';
                  });
                });
              }
            }
          };
          
          // Start animation after delay
          setTimeout(() => {
            animationFrame = requestAnimationFrame(animate);
          }, config.delay);
          
          // Cleanup function
          const cleanup = () => {
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
            }
            
            // Restore all text to visible
            textElements.forEach(textElement => {
              const tspans = textElement.querySelectorAll('tspan');
              tspans.forEach(tspan => {
                tspan.style.opacity = '1';
              });
            });
          };
          
          // Clean up on page leave
          window.addEventListener('unload', cleanup);
          
          // Store cleanup function on element
          svg.__animationCleanup = cleanup;
        });
      })();
    `;
    
    return { animatedSvg, jsCode, cssCode };
  }

  /**
   * Apply wave animation to elements
   */
  private applyWaveAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; jsCode: string; cssCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg wave-animation"`);
    
    // Generate JavaScript for the wave animation
    const jsCode = `
      (function() {
        // Wave Animation for ${uniqueId}
        document.addEventListener('DOMContentLoaded', function() {
          const svg = document.getElementById('${uniqueId}');
          if (!svg) return;
          
          // Get all animatable elements (excluding defs and svg itself)
          const elements = Array.from(svg.querySelectorAll('*')).filter(el => 
            el.tagName !== 'defs' && 
            el.tagName !== 'svg' && 
            el.tagName !== 'g'
          );
          
          if (elements.length === 0) return;
          
          // Animation configuration
          const config = {
            duration: ${timing.duration},
            delay: ${timing.delay || 0},
            easing: '${timing.easing || AnimationEasing.EASE_IN_OUT}',
            stagger: ${options.stagger || 100},
            iterations: ${timing.iterations === Infinity ? 'Infinity' : timing.iterations || 1},
            amplitude: 10, // Max wave height in pixels
            frequency: 2 // Wave cycles per animation
          };
          
          // Store original positions
          elements.forEach((element, index) => {
            // Get the element's current transform matrix
            const transform = element.getAttribute('transform') || '';
            element.dataset.originalTransform = transform;
            
            // Calculate center point (approximation)
            const bbox = element.getBBox();
            element.dataset.centerX = String(bbox.x + bbox.width / 2);
            element.dataset.centerY = String(bbox.y + bbox.height / 2);
            
            // Set element delay based on stagger
            element.dataset.delay = String(config.delay + (index * config.stagger));
          });
          
          // Animation state
          let startTime = null;
          let animationFrame = null;
          let currentIteration = 0;
          
          // Sine wave function
          const sineWave = (x, amplitude, frequency) => {
            return amplitude * Math.sin(2 * Math.PI * frequency * x);
          };
          
          // Animation loop
          const animate = function(timestamp) {
            if (!startTime) startTime = timestamp;
            
            // Process each element
            elements.forEach((element, index) => {
              const elementDelay = parseInt(element.dataset.delay || '0');
              
              if (timestamp - startTime >= elementDelay) {
                const elapsed = timestamp - startTime - elementDelay;
                let progress = (elapsed % config.duration) / config.duration;
                
                // Calculate wave offset
                const waveOffset = sineWave(
                  progress, 
                  config.amplitude, 
                  config.frequency
                );
                
                // Apply transform with wave effect
                const originalTransform = element.dataset.originalTransform || '';
                
                // Create translation based on wave
                element.setAttribute(
                  'transform', 
                  \`\${originalTransform} translate(0, \${waveOffset})\`
                );
              }
            });
            
            // Check if animation should continue
            const totalAnimationTime = config.delay + 
              (elements.length * config.stagger) + 
              (config.iterations === Infinity ? Infinity : config.iterations * config.duration);
            
            if (config.iterations === Infinity || timestamp - startTime < totalAnimationTime) {
              // Continue animation
              animationFrame = requestAnimationFrame(animate);
            } else {
              // All iterations complete, restore original positions
              elements.forEach(element => {
                element.setAttribute('transform', element.dataset.originalTransform || '');
              });
            }
          };
          
          // Start animation
          animationFrame = requestAnimationFrame(animate);
          
          // Cleanup function
          const cleanup = () => {
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
            }
            
            // Restore original transforms
            elements.forEach(element => {
              element.setAttribute('transform', element.dataset.originalTransform || '');
            });
          };
          
          // Clean up on page leave
          window.addEventListener('unload', cleanup);
          
          // Store cleanup function on element
          svg.__animationCleanup = cleanup;
        });
      })();
    `;
    
    return { animatedSvg, jsCode };
  }

  /**
   * Apply shimmer/shine animation
   */
  private applyShimmerAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; jsCode: string; cssCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    let animatedSvg = svg;
    
    // Parse SVG to add the necessary elements for shimmer
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
    
    // Add id to the svg
    const svgElement = svgDoc.querySelector('svg');
    if (svgElement) {
      svgElement.id = uniqueId;
      svgElement.classList.add('animated-svg', 'shimmer-animation');
      
      // Create defs if not exists
      let defs = svgDoc.querySelector('defs');
      if (!defs) {
        defs = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svgElement.prepend(defs);
      }
      
      // Create linear gradient for shimmer
      const gradient = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      gradient.id = `shimmer-gradient-${uniqueId}`;
      gradient.setAttribute('x1', '0%');
      gradient.setAttribute('y1', '0%');
      gradient.setAttribute('x2', '100%');
      gradient.setAttribute('y2', '0%');
      
      // Create gradient stops
      const stop1 = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', 'rgba(255,255,255,0)');
      stop1.setAttribute('stop-opacity', '0');
      
      const stop2 = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop2.setAttribute('offset', '50%');
      stop2.setAttribute('stop-color', 'rgba(255,255,255,0.8)');
      stop2.setAttribute('stop-opacity', '0.8');
      
      const stop3 = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'stop');
      stop3.setAttribute('offset', '100%');
      stop3.setAttribute('stop-color', 'rgba(255,255,255,0)');
      stop3.setAttribute('stop-opacity', '0');
      
      gradient.appendChild(stop1);
      gradient.appendChild(stop2);
      gradient.appendChild(stop3);
      defs.appendChild(gradient);
      
      // Create rect for shimmer overlay
      const shimmerRect = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
      shimmerRect.id = `shimmer-overlay-${uniqueId}`;
      shimmerRect.setAttribute('width', '100%');
      shimmerRect.setAttribute('height', '100%');
      shimmerRect.setAttribute('fill', `url(#shimmer-gradient-${uniqueId})`);
      shimmerRect.setAttribute('opacity', '0');
      shimmerRect.setAttribute('pointer-events', 'none');
      
      // Get viewBox or dimensions
      const viewBox = svgElement.getAttribute('viewBox');
      if (viewBox) {
        const [, , width, height] = viewBox.split(' ').map(Number);
        shimmerRect.setAttribute('width', String(width));
        shimmerRect.setAttribute('height', String(height));
      } else {
        const width = svgElement.getAttribute('width') || '100%';
        const height = svgElement.getAttribute('height') || '100%';
        shimmerRect.setAttribute('width', width);
        shimmerRect.setAttribute('height', height);
      }
      
      // Add the shimmer rect as the last child
      svgElement.appendChild(shimmerRect);
    }
    
    // Serialize back to string
    animatedSvg = new XMLSerializer().serializeToString(svgDoc);
    
    // Generate JavaScript for the shimmer animation
    const jsCode = `
      (function() {
        // Shimmer Animation for ${uniqueId}
        document.addEventListener('DOMContentLoaded', function() {
          const svg = document.getElementById('${uniqueId}');
          if (!svg) return;
          
          // Get the shimmer overlay element
          const shimmerRect = document.getElementById('shimmer-overlay-${uniqueId}');
          if (!shimmerRect) return;
          
          // Animation configuration
          const config = {
            duration: ${timing.duration},
            delay: ${timing.delay || 0},
            easing: '${timing.easing || AnimationEasing.EASE_IN_OUT}',
            iterations: ${timing.iterations === Infinity ? 'Infinity' : timing.iterations || 1}
          };
          
          // Animation state
          let startTime = null;
          let animationFrame = null;
          let currentIteration = 0;
          
          // Animation loop
          const animate = function(timestamp) {
            if (!startTime) startTime = timestamp;
            
            const elapsed = timestamp - startTime;
            let progress = (elapsed % config.duration) / config.duration;
            
            // Position the gradient from left to right
            const translateX = -100 + progress * 200; // -100% to 100%
            
            // Update the shimmer overlay
            shimmerRect.setAttribute('transform', \`translate(\${translateX}, 0)\`);
            shimmerRect.setAttribute('opacity', '1');
            
            // Check if current iteration is complete
            if (progress >= 1) {
              currentIteration++;
              
              if (config.iterations === Infinity || currentIteration < config.iterations) {
                // Reset for next iteration
                startTime = timestamp;
              } else {
                // All iterations complete
                shimmerRect.setAttribute('opacity', '0');
                return;
              }
            }
            
            // Continue animation
            animationFrame = requestAnimationFrame(animate);
          };
          
          // Start animation after delay
          setTimeout(() => {
            animationFrame = requestAnimationFrame(animate);
          }, config.delay);
          
          // Cleanup function
          const cleanup = () => {
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
            }
            shimmerRect.setAttribute('opacity', '0');
          };
          
          // Clean up on page leave
          window.addEventListener('unload', cleanup);
          
          // Store cleanup function on element
          svg.__animationCleanup = cleanup;
        });
      })();
    `;
    
    return { animatedSvg, jsCode };
  }

  /**
   * Apply sequential animation to elements
   */
  private applySequentialAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; jsCode: string; cssCode?: string } {
    const { timing } = options;
    const staggerDelay = options.stagger || 200;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg sequential-animation"`);
    
    // Generate JavaScript for the sequential animation
    const jsCode = `
      (function() {
        // Sequential Animation for ${uniqueId}
        document.addEventListener('DOMContentLoaded', function() {
          const svg = document.getElementById('${uniqueId}');
          if (!svg) return;
          
          // Get elements to animate
          let elements = [];
          
          // Use specified elements if provided
          ${options.sequenceOrder && options.sequenceOrder.length > 0 ? `
          const sequenceOrder = ${JSON.stringify(options.sequenceOrder)};
          elements = sequenceOrder
            .map(id => svg.getElementById(id))
            .filter(el => el !== null);
          ` : `
          // Use all direct children of the SVG except defs
          elements = Array.from(svg.children).filter(el => 
            el.tagName.toLowerCase() !== 'defs'
          );
          `}
          
          if (elements.length === 0) return;
          
          // Animation configuration
          const config = {
            duration: ${timing.duration},
            delay: ${timing.delay || 0},
            easing: '${timing.easing || AnimationEasing.EASE_OUT}',
            stagger: ${staggerDelay},
            iterations: ${timing.iterations === Infinity ? 'Infinity' : timing.iterations || 1}
          };
          
          // Hide all elements initially
          elements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.transition = \`opacity \${config.duration}ms \${config.easing}, transform \${config.duration}ms \${config.easing}\`;
          });
          
          // Animation state
          let currentIteration = 0;
          let timeouts = [];
          
          // Show elements sequentially
          const animateElements = () => {
            elements.forEach((element, index) => {
              const timeout = setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
              }, config.delay + (index * config.stagger));
              
              timeouts.push(timeout);
            });
            
            // Reset for next iteration if needed
            if (config.iterations === Infinity || currentIteration < config.iterations - 1) {
              const totalDuration = config.delay + (elements.length * config.stagger) + config.duration;
              
              const iterationTimeout = setTimeout(() => {
                // Reset all elements
                elements.forEach(element => {
                  element.style.opacity = '0';
                  element.style.transform = 'translateY(20px)';
                });
                
                // Short delay before starting next iteration
                setTimeout(() => {
                  currentIteration++;
                  animateElements();
                }, 500);
              }, totalDuration);
              
              timeouts.push(iterationTimeout);
            }
          };
          
          // Start animation
          animateElements();
          
          // Cleanup function
          const cleanup = () => {
            timeouts.forEach(timeout => clearTimeout(timeout));
            
            // Show all elements
            elements.forEach(element => {
              element.style.opacity = '1';
              element.style.transform = 'translateY(0)';
            });
          };
          
          // Clean up on page leave
          window.addEventListener('unload', cleanup);
          
          // Store cleanup function on element
          svg.__animationCleanup = cleanup;
        });
      })();
    `;
    
    return { animatedSvg, jsCode };
  }

  /**
   * Apply floating animation
   */
  private applyFloatAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; jsCode: string; cssCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg float-animation"`);
    
    // Generate JavaScript for the float animation
    const jsCode = `
      (function() {
        // Float Animation for ${uniqueId}
        document.addEventListener('DOMContentLoaded', function() {
          const svg = document.getElementById('${uniqueId}');
          if (!svg) return;
          
          // Animation configuration
          const config = {
            duration: ${timing.duration},
            delay: ${timing.delay || 0},
            easing: '${timing.easing || AnimationEasing.EASE_IN_OUT}',
            iterations: ${timing.iterations === Infinity ? 'Infinity' : timing.iterations || 1},
            amplitude: 10 // Float height in pixels
          };
          
          // Store original transform
          const originalTransform = svg.getAttribute('transform') || '';
          
          // Animation state
          let startTime = null;
          let animationFrame = null;
          let currentIteration = 0;
          
          // Easing functions
          const easingFunctions = {
            'linear': t => t,
            'ease': t => 0.25 * Math.pow(t, 2) * ((2.75 * t) - 1.75),
            'ease-in': t => t * t,
            'ease-out': t => t * (2 - t),
            'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
          };
          
          // Choose easing function
          const ease = easingFunctions[config.easing.replace(/-/g, '')] || easingFunctions['ease-in-out'];
          
          // Animation loop
          const animate = function(timestamp) {
            if (!startTime) startTime = timestamp;
            
            const elapsed = timestamp - startTime;
            let normalizedProgress = (elapsed % config.duration) / config.duration;
            
            // Apply easing to get a smooth sine-like motion
            let easedProgress = ease(normalizedProgress);
            
            // Calculate float position
            // Use sine function for smooth up-down motion
            const floatY = Math.sin(easedProgress * Math.PI * 2) * config.amplitude;
            
            // Apply transform
            svg.setAttribute('transform', \`\${originalTransform} translate(0, \${floatY})\`);
            
            // Check if current iteration is complete
            if (normalizedProgress >= 1) {
              currentIteration++;
              
              if (config.iterations === Infinity || currentIteration < config.iterations) {
                // Reset for next iteration
                startTime = timestamp;
              } else {
                // All iterations complete
                svg.setAttribute('transform', originalTransform);
                return;
              }
            }
            
            // Continue animation
            animationFrame = requestAnimationFrame(animate);
          };
          
          // Start animation after delay
          setTimeout(() => {
            animationFrame = requestAnimationFrame(animate);
          }, config.delay);
          
          // Cleanup function
          const cleanup = () => {
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
            }
            svg.setAttribute('transform', originalTransform);
          };
          
          // Clean up on page leave
          window.addEventListener('unload', cleanup);
          
          // Store cleanup function on element
          svg.__animationCleanup = cleanup;
        });
      })();
    `;
    
    return { animatedSvg, jsCode };
  }

  /**
   * Apply pulse animation
   */
  private applyPulseAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; jsCode: string; cssCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg pulse-animation"`);
    
    // Generate JavaScript for the pulse animation
    const jsCode = `
      (function() {
        // Pulse Animation for ${uniqueId}
        document.addEventListener('DOMContentLoaded', function() {
          const svg = document.getElementById('${uniqueId}');
          if (!svg) return;
          
          // Animation configuration
          const config = {
            duration: ${timing.duration},
            delay: ${timing.delay || 0},
            easing: '${timing.easing || AnimationEasing.EASE_IN_OUT}',
            iterations: ${timing.iterations === Infinity ? 'Infinity' : timing.iterations || 1},
            pulseScale: 1.05 // Maximum scale during pulse
          };
          
          // Store original transform
          const originalTransform = svg.getAttribute('transform') || '';
          
          // Extract the viewBox to find the center
          let centerX = 0, centerY = 0;
          const viewBox = svg.getAttribute('viewBox');
          if (viewBox) {
            const [x, y, width, height] = viewBox.split(' ').map(Number);
            centerX = x + width / 2;
            centerY = y + height / 2;
          } else {
            const width = parseFloat(svg.getAttribute('width') || '100');
            const height = parseFloat(svg.getAttribute('height') || '100');
            centerX = width / 2;
            centerY = height / 2;
          }
          
          // Animation state
          let startTime = null;
          let animationFrame = null;
          let currentIteration = 0;
          
          // Easing functions
          const easingFunctions = {
            'linear': t => t,
            'ease': t => 0.25 * Math.pow(t, 2) * ((2.75 * t) - 1.75),
            'ease-in': t => t * t,
            'ease-out': t => t * (2 - t),
            'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
          };
          
          // Choose easing function
          const ease = easingFunctions[config.easing.replace(/-/g, '')] || easingFunctions['ease-in-out'];
          
          // Animation loop
          const animate = function(timestamp) {
            if (!startTime) startTime = timestamp;
            
            const elapsed = timestamp - startTime;
            let normalizedProgress = (elapsed % config.duration) / config.duration;
            
            // Apply easing
            let easedProgress = ease(normalizedProgress);
            
            // Calculate scale factor using sine function for smooth pulsing
            const scaleFactor = 1 + (Math.sin(easedProgress * Math.PI) * (config.pulseScale - 1));
            
            // Apply transform with scale around center
            svg.setAttribute(
              'transform', 
              \`\${originalTransform} translate(\${centerX}, \${centerY}) scale(\${scaleFactor}) translate(\${-centerX}, \${-centerY})\`
            );
            
            // Check if current iteration is complete
            if (normalizedProgress >= 1) {
              currentIteration++;
              
              if (config.iterations === Infinity || currentIteration < config.iterations) {
                // Reset for next iteration
                startTime = timestamp;
              } else {
                // All iterations complete
                svg.setAttribute('transform', originalTransform);
                return;
              }
            }
            
            // Continue animation
            animationFrame = requestAnimationFrame(animate);
          };
          
          // Start animation after delay
          setTimeout(() => {
            animationFrame = requestAnimationFrame(animate);
          }, config.delay);
          
          // Cleanup function
          const cleanup = () => {
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
            }
            svg.setAttribute('transform', originalTransform);
          };
          
          // Clean up on page leave
          window.addEventListener('unload', cleanup);
          
          // Store cleanup function on element
          svg.__animationCleanup = cleanup;
        });
      })();
    `;
    
    return { animatedSvg, jsCode };
  }

  /**
   * Apply custom animation using provided JavaScript code
   */
  private applyCustomAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; jsCode: string; cssCode?: string } {
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg custom-animation"`);
    
    // Use custom CSS if provided, otherwise use a simple fade-in
    const cssCode = options.customCSS || `
      #${uniqueId}.animated-svg.custom-animation {
        opacity: 0;
        animation: customAnimation-${uniqueId} ${options.timing.duration}ms ${options.timing.easing || AnimationEasing.EASE} ${options.timing.delay || 0}ms ${options.timing.iterations === Infinity ? 'infinite' : options.timing.iterations || '1'} forwards;
      }
      
      @keyframes customAnimation-${uniqueId} {
        ${options.customKeyframes || `
        from { opacity: 0; }
        to { opacity: 1; }
        `}
      }
    `;
    
    // Use custom JS if provided, otherwise create a basic animation
    const jsCode = options.jsCode || `
      (function() {
        // Custom Animation for ${uniqueId}
        document.addEventListener('DOMContentLoaded', function() {
          const svg = document.getElementById('${uniqueId}');
          if (!svg) return;
          
          // Animation configuration
          const config = {
            duration: ${options.timing.duration},
            delay: ${options.timing.delay || 0},
            easing: '${options.timing.easing || AnimationEasing.EASE}',
            iterations: ${options.timing.iterations === Infinity ? 'Infinity' : options.timing.iterations || 1}
          };
          
          // Animation state
          let startTime = null;
          let animationFrame = null;
          let currentIteration = 0;
          
          // Easing functions
          const easingFunctions = {
            'linear': t => t,
            'ease': t => 0.25 * Math.pow(t, 2) * ((2.75 * t) - 1.75),
            'ease-in': t => t * t,
            'ease-out': t => t * (2 - t),
            'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
          };
          
          // Choose easing function
          const ease = easingFunctions[config.easing.replace(/-/g, '')] || easingFunctions['ease-in-out'];
          
          // Animation loop
          const animate = function(timestamp) {
            if (!startTime) startTime = timestamp;
            
            const elapsed = timestamp - startTime;
            let progress = Math.min(elapsed / config.duration, 1);
            progress = ease(progress);
            
            // Simple fade-in animation as default
            svg.style.opacity = progress;
            
            if (progress < 1) {
              // Continue animation
              animationFrame = requestAnimationFrame(animate);
            } else {
              // Current iteration complete
              currentIteration++;
              
              if (config.iterations === Infinity || currentIteration < config.iterations) {
                // Reset for next iteration
                startTime = timestamp;
                svg.style.opacity = 0;
                animationFrame = requestAnimationFrame(animate);
              }
            }
          };
          
          // Start animation after delay
          setTimeout(() => {
            svg.style.opacity = 0; // Start hidden
            animationFrame = requestAnimationFrame(animate);
          }, config.delay);
          
          // Cleanup function
          const cleanup = () => {
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
            }
            svg.style.opacity = 1; // Ensure visible when cleaning up
          };
          
          // Clean up on page leave
          window.addEventListener('unload', cleanup);
          
          // Store cleanup function on element
          svg.__animationCleanup = cleanup;
        });
      })();
    `;
    
    return { animatedSvg, jsCode, cssCode };
  }

  /**
   * Apply default animation as fallback
   */
  private applyDefaultAnimation(svg: string, options: AnimationOptions, uniqueId: string): { animatedSvg: string; jsCode: string; cssCode?: string } {
    const { timing } = options;
    
    // Add animation class and ID to the SVG element
    const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg fade-in"`);
    
    // Default CSS for fade-in
    const cssCode = `
      #${uniqueId}.animated-svg.fade-in {
        opacity: 0;
      }
    `;
    
    // Simple JavaScript animation as fallback
    const jsCode = `
      (function() {
        // Default Animation for ${uniqueId}
        document.addEventListener('DOMContentLoaded', function() {
          const svg = document.getElementById('${uniqueId}');
          if (!svg) return;
          
          // Animation configuration
          const config = {
            duration: ${timing.duration},
            delay: ${timing.delay || 0},
            easing: '${timing.easing || AnimationEasing.EASE_IN_OUT}',
            iterations: ${timing.iterations === Infinity ? 'Infinity' : timing.iterations || 1}
          };
          
          // Start with opacity 0
          svg.style.opacity = '0';
          
          // Animation state
          let startTime = null;
          let animationFrame = null;
          let currentIteration = 0;
          
          // Easing functions
          const easingFunctions = {
            'linear': t => t,
            'ease': t => 0.25 * Math.pow(t, 2) * ((2.75 * t) - 1.75),
            'ease-in': t => t * t,
            'ease-out': t => t * (2 - t),
            'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
          };
          
          // Choose easing function
          const ease = easingFunctions[config.easing.replace(/-/g, '')] || easingFunctions['ease-in-out'];
          
          // Animation loop
          const animate = function(timestamp) {
            if (!startTime) startTime = timestamp;
            
            const elapsed = timestamp - startTime;
            let progress = Math.min(elapsed / config.duration, 1);
            progress = ease(progress);
            
            // Apply opacity
            svg.style.opacity = progress;
            
            if (progress < 1) {
              // Continue animation
              animationFrame = requestAnimationFrame(animate);
            } else {
              // Current iteration complete
              currentIteration++;
              
              if (config.iterations === Infinity || currentIteration < config.iterations) {
                // Reset for next iteration
                startTime = timestamp;
                svg.style.opacity = 0;
                animationFrame = requestAnimationFrame(animate);
              }
            }
          };
          
          // Start animation after delay
          setTimeout(() => {
            animationFrame = requestAnimationFrame(animate);
          }, config.delay);
          
          // Cleanup function
          const cleanup = () => {
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
            }
            svg.style.opacity = 1; // Ensure visible when cleaning up
          };
          
          // Clean up on page leave
          window.addEventListener('unload', cleanup);
          
          // Store cleanup function on element
          svg.__animationCleanup = cleanup;
        });
      })();
    `;
    
    return { animatedSvg, jsCode, cssCode };
  }
}