import { 
  MockupTemplate, 
  MockupType, 
  SVGLogo 
} from '@/lib/types';
import { 
  generateRealisticMockupSvg, 
  svgToRealisticDataUrl, 
  convertRealisticMockupToPng 
} from './enhanced-mockup-generator';
import { 
  DEFAULT_MOCKUP_TEMPLATES, 
  getTemplateById, 
  getTemplatesByType 
} from './template-data';
import {
  getBackgroundById,
  getBackgroundsByType,
  getRandomBackground,
  getPlaceholderBackground
} from './background-image-registry';

/**
 * Enhanced Mockup Service with realistic previews
 * Provides advanced mockup generation with realistic backgrounds,
 * lighting effects, and perspective transformations
 */
export class EnhancedMockupService {
  /**
   * Get a background image for a mockup template
   */
  static getBackgroundForTemplate(
    templateId: string,
    backgroundId?: string
  ): string {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      throw new Error(`Template with ID "${templateId}" not found`);
    }
    
    // If a specific background ID is provided, use that
    if (backgroundId) {
      const background = getBackgroundById(backgroundId);
      if (background) {
        return background.url;
      }
    }
    
    // Otherwise, get a random background for this template type
    const randomBackground = getRandomBackground(template.type);
    if (randomBackground) {
      return randomBackground.url;
    }
    
    // Fallback to placeholder if no background is available
    return getPlaceholderBackground(template.type);
  }
  
  /**
   * Get all available mockup templates
   */
  static getAllTemplates(): MockupTemplate[] {
    return DEFAULT_MOCKUP_TEMPLATES;
  }

  /**
   * Get mockup templates by type
   */
  static getTemplatesByType(type: MockupType): MockupTemplate[] {
    return getTemplatesByType(type);
  }

  /**
   * Get a specific template by ID
   */
  static getTemplateById(id: string): MockupTemplate | undefined {
    return getTemplateById(id);
  }

  /**
   * Generate an enhanced SVG mockup with realistic effects
   */
  static generateEnhancedMockup(
    logo: string | SVGLogo,
    templateId: string,
    backgroundId?: string,
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
    } = {
      applyLighting: true,
      lightDirection: 'top',
      lightIntensity: 0.3,
      applyPerspective: false,
      applyShadow: true
    },
    brandName: string = 'Brand Name'
  ): string {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      throw new Error(`Template with ID "${templateId}" not found`);
    }
    
    // Get background image
    const backgroundImage = this.getBackgroundForTemplate(templateId, backgroundId);
    
    // Extract SVG code if SVGLogo object is provided
    const svgCode = typeof logo === 'string' ? logo : logo.svgCode;
    
    // Generate mockup with realistic effects
    return generateRealisticMockupSvg(
      svgCode,
      template,
      backgroundImage,
      customText,
      effectsConfig,
      brandName
    );
  }

  /**
   * Generate an SVG data URL for an enhanced mockup
   */
  static generateEnhancedMockupDataUrl(
    logo: string | SVGLogo,
    templateId: string,
    backgroundId?: string,
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
    } = {
      applyLighting: true,
      lightDirection: 'top',
      lightIntensity: 0.3,
      applyPerspective: false,
      applyShadow: true
    },
    brandName: string = 'Brand Name'
  ): string {
    const svg = this.generateEnhancedMockup(
      logo,
      templateId,
      backgroundId,
      customText,
      effectsConfig,
      brandName
    );
    
    return svgToRealisticDataUrl(svg);
  }

  /**
   * Generate a PNG data URL for an enhanced mockup (browser-only)
   */
  static async generateEnhancedMockupPng(
    logo: string | SVGLogo,
    templateId: string,
    width: number = 1200,
    backgroundId?: string,
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
    } = {
      applyLighting: true,
      lightDirection: 'top',
      lightIntensity: 0.3,
      applyPerspective: false,
      applyShadow: true
    },
    brandName: string = 'Brand Name'
  ): Promise<string> {
    const svg = this.generateEnhancedMockup(
      logo,
      templateId,
      backgroundId,
      customText,
      effectsConfig,
      brandName
    );
    
    return convertRealisticMockupToPng(svg, width);
  }

  /**
   * Download an enhanced mockup as PNG (browser-only)
   */
  static async downloadEnhancedMockup(
    logo: string | SVGLogo,
    templateId: string,
    format: 'png' | 'svg' = 'png',
    filename?: string,
    width: number = 1200,
    backgroundId?: string,
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
    } = {
      applyLighting: true,
      lightDirection: 'top',
      lightIntensity: 0.3,
      applyPerspective: false,
      applyShadow: true
    },
    brandName: string = 'Brand Name'
  ): Promise<void> {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      throw new Error(`Template with ID "${templateId}" not found`);
    }
    
    const defaultFilename = `${brandName.replace(/\s+/g, '-').toLowerCase()}-${template.type.toLowerCase()}-enhanced.${format}`;
    const outputFilename = filename || defaultFilename;
    
    if (format === 'svg') {
      const svg = this.generateEnhancedMockup(
        logo,
        templateId,
        backgroundId,
        customText,
        effectsConfig,
        brandName
      );
      
      const dataUrl = svgToRealisticDataUrl(svg);
      this.triggerDownload(dataUrl, outputFilename);
    } else {
      const pngDataUrl = await this.generateEnhancedMockupPng(
        logo,
        templateId,
        width,
        backgroundId,
        customText,
        effectsConfig,
        brandName
      );
      
      this.triggerDownload(pngDataUrl, outputFilename);
    }
  }

  /**
   * Helper to trigger a download in the browser
   */
  private static triggerDownload(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  /**
   * Get available effects for a template
   * Returns appropriate effects configuration based on template type
   */
  static getRecommendedEffects(templateId: string): {
    applyLighting: boolean;
    lightDirection: 'top' | 'right' | 'bottom' | 'left';
    lightIntensity: number;
    applyPerspective: boolean;
    perspectiveTransform?: {
      rotateX: number;
      rotateY: number;
      rotateZ: number;
      translateZ: number;
    };
    applyShadow: boolean;
    shadowBlur: number;
    shadowOpacity: number;
  } {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      // Default effects if template not found
      return {
        applyLighting: true,
        lightDirection: 'top',
        lightIntensity: 0.3,
        applyPerspective: false,
        applyShadow: true,
        shadowBlur: 8,
        shadowOpacity: 0.3
      };
    }
    
    // Customize effects based on template type
    switch (template.type) {
      case MockupType.BUSINESS_CARD:
        return {
          applyLighting: true,
          lightDirection: 'top',
          lightIntensity: 0.4,
          applyPerspective: true,
          perspectiveTransform: {
            rotateX: 10,
            rotateY: 5,
            rotateZ: 0,
            translateZ: 0
          },
          applyShadow: true,
          shadowBlur: 5,
          shadowOpacity: 0.3
        };
        
      case MockupType.WEBSITE:
        return {
          applyLighting: true,
          lightDirection: 'top',
          lightIntensity: 0.2,
          applyPerspective: false,
          applyShadow: false,
          shadowBlur: 0,
          shadowOpacity: 0
        };
        
      case MockupType.TSHIRT:
        return {
          applyLighting: true,
          lightDirection: 'top',
          lightIntensity: 0.25,
          applyPerspective: true,
          perspectiveTransform: {
            rotateX: 0,
            rotateY: 0,
            rotateZ: 0,
            translateZ: 0
          },
          applyShadow: false,
          shadowBlur: 0,
          shadowOpacity: 0
        };
        
      case MockupType.STOREFRONT:
        return {
          applyLighting: true,
          lightDirection: 'top',
          lightIntensity: 0.4,
          applyPerspective: true,
          perspectiveTransform: {
            rotateX: 0,
            rotateY: 20,
            rotateZ: 0,
            translateZ: 0
          },
          applyShadow: true,
          shadowBlur: 10,
          shadowOpacity: 0.4
        };
        
      case MockupType.PACKAGING:
        return {
          applyLighting: true,
          lightDirection: 'top',
          lightIntensity: 0.3,
          applyPerspective: true,
          perspectiveTransform: {
            rotateX: 5,
            rotateY: 10,
            rotateZ: 0,
            translateZ: 0
          },
          applyShadow: true,
          shadowBlur: 8,
          shadowOpacity: 0.4
        };
        
      default:
        // Default effects for other template types
        return {
          applyLighting: true,
          lightDirection: 'top',
          lightIntensity: 0.3,
          applyPerspective: false,
          applyShadow: true,
          shadowBlur: 8,
          shadowOpacity: 0.3
        };
    }
  }
}

export default EnhancedMockupService;