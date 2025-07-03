import { SVGLogo } from '@/lib/types';
import { MockupTemplate, LogoPlacement, TextPlaceholder } from './mockup-types';

/**
 * Enhanced mockup generator with realistic effects
 * Provides improved visual fidelity for logo mockups with realistic backgrounds,
 * lighting effects, and perspective transforms
 */

/**
 * Applies lighting effects to an SVG logo based on the mockup environment
 */
export function applyLightingEffects(
  svgContent: string,
  lightDirection: 'top' | 'right' | 'bottom' | 'left' = 'top',
  lightIntensity: number = 0.3,
  ambientLight: number = 0.7
): string {
  // Extract the SVG content without the outer SVG tag
  const innerContent = extractSvgContent(svgContent);
  
  // Create filter for lighting effects
  const filterId = `lighting-${Math.random().toString(36).substring(2, 9)}`;
  
  // Calculate light position based on direction
  let lightX = 0;
  let lightY = 0;
  
  switch (lightDirection) {
    case 'top':
      lightX = 0;
      lightY = -50;
      break;
    case 'right':
      lightX = 50;
      lightY = 0;
      break;
    case 'bottom':
      lightX = 0;
      lightY = 50;
      break;
    case 'left':
      lightX = -50;
      lightY = 0;
      break;
  }
  
  // Create the lighting filter
  const filter = `
    <filter id="${filterId}" x="-20%" y="-20%" width="140%" height="140%">
      <!-- Ambient light base -->
      <feComponentTransfer>
        <feFuncR type="linear" slope="${ambientLight}"/>
        <feFuncG type="linear" slope="${ambientLight}"/>
        <feFuncB type="linear" slope="${ambientLight}"/>
      </feComponentTransfer>
      
      <!-- Directional light -->
      <feSpecularLighting result="specOut" specularExponent="20" lighting-color="white">
        <fePointLight x="${lightX}" y="${lightY}" z="60"/>
      </feSpecularLighting>
      
      <!-- Adjust intensity of the specular light -->
      <feComponentTransfer in="specOut">
        <feFuncR type="linear" slope="${lightIntensity}"/>
        <feFuncG type="linear" slope="${lightIntensity}"/>
        <feFuncB type="linear" slope="${lightIntensity}"/>
      </feComponentTransfer>
      
      <!-- Combine original with lighting -->
      <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>
      
      <!-- Add subtle shadow -->
      <feGaussianBlur stdDeviation="2" />
    </filter>
  `;
  
  // Apply filter to the content
  const wrappedContent = `
    <defs>${filter}</defs>
    <g filter="url(#${filterId})">
      ${innerContent}
    </g>
  `;
  
  return wrappedContent;
}

/**
 * Applies a perspective transform to an SVG for placement on angled surfaces
 */
export function applyPerspectiveTransform(
  svgContent: string,
  transform: {
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    translateZ?: number;
  }
): string {
  const { rotateX = 0, rotateY = 0, rotateZ = 0, translateZ = 0 } = transform;
  
  // Extract inner content
  const innerContent = extractSvgContent(svgContent);
  
  // Create a transform that applies the perspective
  const transformValue = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) translateZ(${translateZ}px)`;
  
  // Apply the transform with a perspective container
  const transformed = `
    <g style="transform-origin: center center; transform: ${transformValue}; transform-style: preserve-3d;">
      ${innerContent}
    </g>
  `;
  
  return transformed;
}

/**
 * Creates a realistic shadow for the logo
 */
export function createShadowEffect(
  width: number,
  height: number,
  blur: number = 10,
  opacity: number = 0.3,
  offsetX: number = 5,
  offsetY: number = 5
): string {
  const shadowId = `shadow-${Math.random().toString(36).substring(2, 9)}`;
  
  return `
    <defs>
      <filter id="${shadowId}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" />
        <feOffset dx="${offsetX}" dy="${offsetY}" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="${opacity}" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <use filter="url(#${shadowId})" href="#logo-content" />
  `;
}

/**
 * Positions an SVG logo on a mockup with enhanced effects
 */
export function positionLogoWithEffects(
  logoSvg: string,
  template: MockupTemplate,
  width: number,
  height: number,
  effects: {
    applyLighting?: boolean;
    lightDirection?: 'top' | 'right' | 'bottom' | 'left';
    lightIntensity?: number;
    applyPerspective?: boolean;
    perspectiveTransform?: {
      rotateX?: number;
      rotateY?: number;
      rotateZ?: number;
      translateZ?: number;
    };
    applyShadow?: boolean;
    shadowBlur?: number;
    shadowOpacity?: number;
  } = {}
): string {
  const {
    applyLighting = false,
    lightDirection = 'top',
    lightIntensity = 0.3,
    applyPerspective = false,
    perspectiveTransform = { rotateX: 0, rotateY: 0, rotateZ: 0, translateZ: 0 },
    applyShadow = false,
    shadowBlur = 10,
    shadowOpacity = 0.3
  } = effects;
  
  // Parse the SVG to get its viewBox
  const viewBoxMatch = logoSvg.match(/viewBox=["']([^"']*)["']/);
  const viewBox = viewBoxMatch && viewBoxMatch[1]
    ? viewBoxMatch[1].split(/\s+/).map(Number) 
    : [0, 0, 300, 300];
  
  // Calculate logo dimensions based on template placement
  const logoWidth = (template.logoPlacement.inlineSize / 100) * width;
  const logoHeight = template.logoPlacement.preserveAspectRatio 
    ? logoWidth / template.aspectRatio
    : (template.logoPlacement.blockSize / 100) * height;
  
  // Calculate position
  const logoX = (template.logoPlacement.x / 100) * width;
  const logoY = (template.logoPlacement.y / 100) * height;
  
  // Apply rotation if specified
  const rotation = template.logoPlacement.rotation 
    ? `transform="rotate(${template.logoPlacement.rotation}, ${logoX + logoWidth/2}, ${logoY + logoHeight/2})"` 
    : '';
  
  // Clean the SVG to ensure it works within the mockup
  const cleanedSvg = cleanSvgForMockup(logoSvg);
  
  // Apply effects to the SVG content
  let svgContent = extractSvgContent(cleanedSvg);
  
  // Store original content for shadow usage
  const originalContent = svgContent;
  
  // Apply lighting effect if requested
  if (applyLighting) {
    svgContent = applyLightingEffects(
      svgContent, 
      lightDirection,
      lightIntensity,
      0.7 // ambient light level
    );
  }
  
  // Apply perspective transform if requested
  if (applyPerspective) {
    svgContent = applyPerspectiveTransform(
      svgContent,
      perspectiveTransform
    );
  }
  
  // Set up shadow effect if requested
  const shadowEffect = applyShadow 
    ? createShadowEffect(
        logoWidth, 
        logoHeight, 
        shadowBlur, 
        shadowOpacity,
        3, // offsetX
        3  // offsetY
      )
    : '';
  
  // Define the logo content for reference by the shadow
  const contentWithId = `<g id="logo-content">${originalContent}</g>`;
  
  // Combine everything
  return `
    <g class="mockup-logo enhanced" ${rotation}>
      <svg 
        x="${logoX}" 
        y="${logoY}" 
        width="${logoWidth}" 
        height="${logoHeight}" 
        viewBox="${viewBox.join(' ')}"
        preserveAspectRatio="${template.logoPlacement.preserveAspectRatio ? 'xMidYMid meet' : 'none'}"
      >
        ${shadowEffect}
        ${contentWithId}
        ${svgContent}
      </svg>
    </g>
  `;
}

/**
 * Generates a mockup with a realistic background image
 */
export function generateRealisticMockupSvg(
  logoSvg: string | SVGLogo,
  template: MockupTemplate,
  backgroundImage: string,
  customText: Record<string, string> = {},
  effectsConfig: {
    applyLighting?: boolean;
    lightDirection?: 'top' | 'right' | 'bottom' | 'left';
    lightIntensity?: number;
    applyPerspective?: boolean;
    perspectiveTransform?: {
      rotateX?: number;
      rotateY?: number;
      rotateZ?: number;
      translateZ?: number;
    };
    applyShadow?: boolean;
    shadowBlur?: number;
    shadowOpacity?: number;
  } = {},
  brandName: string = 'Brand Name'
): string {
  // Extract SVG code if SVGLogo object is provided
  const svgCode = typeof logoSvg === 'string' ? logoSvg : logoSvg.svgCode;
  
  // Calculate dimensions based on aspect ratio
  const width = 1000;
  const height = width / template.aspectRatio;
  
  // Position the logo with effects
  const positionedLogo = positionLogoWithEffects(
    svgCode, 
    template, 
    width, 
    height,
    effectsConfig
  );
  
  // Render text elements
  const textElements = renderRealisticTextPlaceholders(
    template, 
    width, 
    height, 
    customText, 
    brandName
  );
  
  // Build the final SVG with background image
  return `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="${width}" 
      height="${height}" 
      viewBox="0 0 ${width} ${height}"
      class="mockup-preview realistic mockup-type-${template.type.toLowerCase()}"
    >
      <!-- Background Image -->
      <image 
        href="${backgroundImage}" 
        width="100%" 
        height="100%" 
        preserveAspectRatio="xMidYMid slice"
      />
      
      <!-- Mockup elements with enhanced effects -->
      <g class="mockup-elements">
        ${positionedLogo}
        ${textElements}
      </g>
    </svg>
  `;
}

/**
 * Renders text placeholders with enhanced styling for realism
 */
export function renderRealisticTextPlaceholders(
  template: MockupTemplate,
  width: number,
  height: number,
  customText: Record<string, string> = {},
  brandName: string = 'Brand Name'
): string {
  if (!template.textPlaceholders) {
    return '';
  }
  
  const textElements: string[] = [];
  
  template.textPlaceholders.forEach((placeholder: TextPlaceholder) => {
    // Get text, replace {BRAND_NAME} with actual brand name
    let text = customText[placeholder.id] || placeholder.default;
    text = text.replace('{BRAND_NAME}', brandName);
    
    // Calculate position and dimensions
    const x = (placeholder.x / 100) * width;
    const y = (placeholder.y / 100) * height;
    const maxWidth = (placeholder.maxWidth / 100) * width;
    
    // Split text into lines if it contains newlines
    const lines = text.split('\\n');
    
    // Create text element with proper styling and enhanced effects
    const textElement = `
      <g class="text-element">
        <!-- Shadow effect for text -->
        <filter id="text-shadow-${placeholder.id}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
          <feOffset dx="1" dy="1" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <text 
          x="${x}" 
          y="${y}" 
          font-family="${placeholder.fontFamily || 'Arial, sans-serif'}" 
          font-size="${placeholder.fontSize}px" 
          fill="${placeholder.color}"
          text-anchor="${placeholder.textAlign === 'center' ? 'middle' : 
                      placeholder.textAlign === 'right' ? 'end' : 'start'}"
          font-weight="${placeholder.fontWeight || 'normal'}"
          filter="url(#text-shadow-${placeholder.id})"
          ${maxWidth ? `textLength="${maxWidth}" lengthAdjust="spacingAndGlyphs"` : ''}
        >
          ${lines.map((line: string, i: number) => 
            `<tspan x="${x}" dy="${i === 0 ? 0 : placeholder.fontSize * 1.2}">${line}</tspan>`
          ).join('')}
        </text>
      </g>
    `;
    
    textElements.push(textElement);
  });
  
  return textElements.join('');
}

/**
 * Extracts the inner content of an SVG tag
 */
function extractSvgContent(svgString: string): string {
  // Match everything between <svg> and </svg>
  const contentMatch = svgString.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  return contentMatch && contentMatch[1] ? contentMatch[1] : svgString;
}

/**
 * Clean SVG for use in a mockup
 */
function cleanSvgForMockup(svgString: string): string {
  // Remove any scripts or event handlers
  let cleaned = svgString
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Ensure the SVG has xmlns attribute
  if (!cleaned.includes('xmlns=')) {
    cleaned = cleaned.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  
  return cleaned;
}

/**
 * Converts SVG to a data URL
 */
export function svgToRealisticDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Creates a PNG from the enhanced SVG mockup
 * This function is meant to be used in browser environments
 */
export async function convertRealisticMockupToPng(
  svgString: string, 
  width: number = 1200
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Calculate height based on SVG's aspect ratio
      const svgMatch = svgString.match(/viewBox=["']([^"']*)["']/);
      const viewBox = svgMatch && svgMatch[1] ? svgMatch[1].split(/\s+/).map(Number) : [0, 0, 1000, 1000];
      const aspectRatio = (viewBox[2] || 1000) / (viewBox[3] || 1000);
      
      const height = width / aspectRatio;
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Convert SVG to data URL
      const dataUrl = svgToRealisticDataUrl(svgString);
      
      img.onload = () => {
        if (ctx) {
          // Apply high quality rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw with slight blur for anti-aliasing
          ctx.filter = 'blur(0.5px)';
          ctx.drawImage(img, 0, 0, width, height);
          
          // Reset filter and draw again for sharper edges
          ctx.filter = 'none';
          ctx.globalAlpha = 0.8;
          ctx.drawImage(img, 0, 0, width, height);
          
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      
      img.onerror = (error) => {
        reject(error || new Error('Failed to load SVG'));
      };
      
      img.src = dataUrl;
    } catch (error) {
      reject(error);
    }
  });
}