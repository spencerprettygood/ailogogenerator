import { SVGLogo } from '@/lib/types';
import { MockupTemplate } from './mockup-types';

/**
 * Positions an SVG logo on a mockup template, applying necessary transformations
 */
export function positionLogoOnMockup(
  logoSvg: string,
  template: MockupTemplate,
  width: number,
  height: number
): string {
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
  
  return `
    <g class="mockup-logo" ${rotation}>
      <svg 
        x="${logoX}" 
        y="${logoY}" 
        width="${logoWidth}" 
        height="${logoHeight}" 
        viewBox="${viewBox.join(' ')}"
        preserveAspectRatio="${template.logoPlacement.preserveAspectRatio ? 'xMidYMid meet' : 'none'}"
      >
        ${extractSvgContent(cleanedSvg)}
      </svg>
    </g>
  `;
}

/**
 * Renders placeholder text elements for the mockup
 */
export function renderTextPlaceholders(
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
  
  template.textPlaceholders.forEach(placeholder => {
    // Get text, replace {BRAND_NAME} with actual brand name
    let text = customText[placeholder.id] || placeholder.default || '';
    text = text.replace('{BRAND_NAME}', brandName);
    
    // Calculate position and dimensions
    const x = (placeholder.x / 100) * width;
    const y = (placeholder.y / 100) * height;
    const maxWidth = placeholder.maxWidth ? (placeholder.maxWidth / 100) * width : width * 0.8;
    
    // Split text into lines if it contains newlines
    const lines = text.split('\\n');
    
    // Create text element with proper styling
    const textElement = `
      <text 
        x="${x}" 
        y="${y}" 
        font-family="${placeholder.fontFamily || 'Arial, sans-serif'}" 
        font-size="${placeholder.fontSize}px" 
        fill="${placeholder.color}"
        text-anchor="middle"
        ${maxWidth ? `textLength="${maxWidth}" lengthAdjust="spacingAndGlyphs"` : ''}
      >
        ${lines.map((line: string, i: number) => 
          `<tspan x="${x}" dy="${i === 0 ? 0 : placeholder.fontSize * 1.2}">${line}</tspan>`
        ).join('')}
      </text>
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
  return contentMatch ? contentMatch[1] ?? '' : svgString;
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
 * Generates a complete mockup SVG with the logo positioned correctly
 */
export function generateMockupSvg(
  logoSvg: string | SVGLogo,
  template: MockupTemplate,
  customText: Record<string, string> = {},
  selectedColorVariant?: string,
  brandName: string = 'Brand Name'
): string {
  // Extract SVG code if SVGLogo object is provided
  const svgCode = typeof logoSvg === 'string' ? logoSvg : logoSvg.svgCode;
  
  // Calculate dimensions based on aspect ratio
  const width = 1000;
  const height = width / template.aspectRatio;
  
  // Determine background color/style
  const bgColor = selectedColorVariant || 
    (template.colorVariants && template.colorVariants.length > 0 
      ? template.colorVariants[0] 
      : '#FFFFFF');
  
  // Position the logo
  const positionedLogo = positionLogoOnMockup(svgCode, template, width, height);
  
  // Generate text elements
  const textElements = renderTextPlaceholders(template, width, height, customText, brandName);
  
  // Build the final SVG
  return `
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="${width}" 
      height="${height}" 
      viewBox="0 0 ${width} ${height}"
      class="mockup-preview mockup-type-${template.type.toLowerCase()}"
    >
      <!-- Background -->
      <rect width="100%" height="100%" fill="${bgColor}" />
      
      <!-- Mockup elements -->
      <g class="mockup-elements">
        ${positionedLogo}
        ${textElements}
      </g>
    </svg>
  `;
}

/**
 * Converts SVG to a data URL
 */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Creates a PNG from the SVG mockup
 * This function is meant to be used in browser environments
 */
export async function convertMockupToPng(
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
      const viewBox = (svgMatch && svgMatch[1]) ? svgMatch[1].split(/\s+/).map(Number) : [0, 0, 1000, 1000];
      const aspectRatio = (viewBox[2] !== undefined && viewBox[3] !== undefined && viewBox[3] !== 0)
        ? viewBox[2] / viewBox[3]
        : 1;
      
      const height = width / aspectRatio;
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Convert SVG to data URL
      const dataUrl = svgToDataUrl(svgString);
      
      img.onload = () => {
        if (ctx) {
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