import { AnimationType, AnimationProvider } from '../types';

/**
 * Get the best provider for an animation type based on browser capabilities
 * @param type Animation type to get a provider for
 * @returns The best provider for the animation type, or null if none is available
 */
export function getBestProviderForType(type: AnimationType): AnimationProvider | null {
  // For now, this is a placeholder that would detect browser capabilities
  // and return the most suitable provider
  const providers = createAllProviders();
  return providers.find(p => p.supportsAnimationType(type)) || null;
}

/**
 * Create all available animation providers
 * @returns Array of animation providers
 */
export function createAllProviders(): AnimationProvider[] {
  return [
    createCSSAnimationProvider(),
    createSMILAnimationProvider(),
    createJSAnimationProvider()
  ];
}

/**
 * Create a CSS animation provider
 * @returns A CSS animation provider
 */
function createCSSAnimationProvider(): AnimationProvider {
  return {
    id: 'css-animation-provider',
    name: 'CSS Animation Provider',
    description: 'Provides animations using CSS animations and transitions',
    supportedAnimationTypes: [
      AnimationType.FADE_IN,
      AnimationType.FADE_IN_UP,
      AnimationType.FADE_IN_DOWN,
      AnimationType.FADE_IN_LEFT,
      AnimationType.FADE_IN_RIGHT,
      AnimationType.ZOOM_IN,
      AnimationType.ZOOM_OUT,
      AnimationType.SPIN,
      AnimationType.FLOAT,
      AnimationType.PULSE,
      AnimationType.BOUNCE,
      AnimationType.SHIMMER,
      AnimationType.DRAW,
      AnimationType.CUSTOM
    ],
    
    async animate(svg, options) {
      // This would be implemented to transform the SVG with CSS animations
      const uniqueId = `animated-svg-${Math.random().toString(36).substring(2, 11)}`;
      const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg css-animated"`);
      
      // Generate CSS based on the animation type
      let cssCode = '';
      switch (options.type) {
        case AnimationType.FADE_IN:
          cssCode = `
            .animated-svg.css-animated {
              opacity: 0;
              animation: fadeIn${uniqueId} ${options.timing.duration}ms ${options.timing.easing} ${options.timing.delay || 0}ms forwards;
            }
            @keyframes fadeIn${uniqueId} {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `;
          break;
        // Other animation types would be implemented here
        default:
          cssCode = `
            .animated-svg.css-animated {
              animation: default${uniqueId} ${options.timing.duration}ms ${options.timing.easing} ${options.timing.delay || 0}ms forwards;
            }
            @keyframes default${uniqueId} {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `;
      }
      
      return {
        originalSvg: svg,
        animatedSvg,
        animationOptions: options,
        cssCode
      };
    },
    
    supportsAnimationType(type) {
      return this.supportedAnimationTypes.includes(type);
    }
  };
}

/**
 * Create a SMIL animation provider
 * @returns A SMIL animation provider
 */
function createSMILAnimationProvider(): AnimationProvider {
  return {
    id: 'smil-animation-provider',
    name: 'SMIL Animation Provider',
    description: 'Provides animations using SVG SMIL animations',
    supportedAnimationTypes: [
      AnimationType.FADE_IN,
      AnimationType.ZOOM_IN,
      AnimationType.SPIN,
      AnimationType.DRAW,
      AnimationType.MORPH,
      AnimationType.SEQUENTIAL
    ],
    
    async animate(svg, options) {
      // This would be implemented to transform the SVG with SMIL animations
      const parser = new DOMParser();
      const doc = parser.parseFromString(svg, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');
      
      if (!svgElement) {
        throw new Error('Invalid SVG: no root element found');
      }
      
      // Add SMIL animation based on animation type
      switch (options.type) {
        case AnimationType.FADE_IN:
          // Add animate element for opacity
          const animateOpacity = doc.createElementNS('http://www.w3.org/2000/svg', 'animate');
          animateOpacity.setAttribute('attributeName', 'opacity');
          animateOpacity.setAttribute('from', '0');
          animateOpacity.setAttribute('to', '1');
          animateOpacity.setAttribute('dur', `${options.timing.duration / 1000}s`);
          animateOpacity.setAttribute('begin', `${options.timing.delay || 0}ms`);
          animateOpacity.setAttribute('fill', 'freeze');
          svgElement.appendChild(animateOpacity);
          break;
        // Other animation types would be implemented here
      }
      
      const animatedSvg = new XMLSerializer().serializeToString(doc);
      
      return {
        originalSvg: svg,
        animatedSvg,
        animationOptions: options
      };
    },
    
    supportsAnimationType(type) {
      return this.supportedAnimationTypes.includes(type);
    }
  };
}

/**
 * Create a JavaScript animation provider
 * @returns A JavaScript animation provider
 */
function createJSAnimationProvider(): AnimationProvider {
  return {
    id: 'js-animation-provider',
    name: 'JavaScript Animation Provider',
    description: 'Provides animations using JavaScript',
    supportedAnimationTypes: [
      AnimationType.FADE_IN,
      AnimationType.ZOOM_IN,
      AnimationType.SPIN,
      AnimationType.DRAW,
      AnimationType.MORPH,
      AnimationType.TYPEWRITER,
      AnimationType.SEQUENTIAL,
      AnimationType.CUSTOM
    ],
    
    async animate(svg, options) {
      // This would be implemented to transform the SVG with JavaScript animations
      const uniqueId = `animated-svg-${Math.random().toString(36).substring(2, 11)}`;
      const animatedSvg = svg.replace('<svg', `<svg id="${uniqueId}" class="animated-svg js-animated"`);
      
      // Generate JavaScript code based on animation type
      let jsCode = '';
      switch (options.type) {
        case AnimationType.FADE_IN:
          jsCode = `
            document.addEventListener('DOMContentLoaded', function() {
              const svg = document.getElementById('${uniqueId}');
              if (!svg) return;
              
              svg.style.opacity = 0;
              
              setTimeout(() => {
                let startTime = null;
                const duration = ${options.timing.duration};
                
                function animate(timestamp) {
                  if (!startTime) startTime = timestamp;
                  const elapsed = timestamp - startTime;
                  const progress = Math.min(elapsed / duration, 1);
                  
                  svg.style.opacity = progress;
                  
                  if (progress < 1) {
                    requestAnimationFrame(animate);
                  }
                }
                
                requestAnimationFrame(animate);
              }, ${options.timing.delay || 0});
            });
          `;
          break;
        // Other animation types would be implemented here
      }
      
      return {
        originalSvg: svg,
        animatedSvg,
        animationOptions: options,
        jsCode
      };
    },
    
    supportsAnimationType(type) {
      return this.supportedAnimationTypes.includes(type);
    }
  };
}