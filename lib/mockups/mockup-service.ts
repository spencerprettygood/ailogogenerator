import { SVGLogo } from '@/lib/types';
import { MockupTemplate, MockupType } from './mockup-types';
import { generateMockupSvg, svgToDataUrl, convertMockupToPng } from './mockup-generator';
import { DEFAULT_MOCKUP_TEMPLATES, getTemplateById, getTemplatesByType } from './template-data';

/**
 * Mockup Service - Handles generating and managing mockups
 */
export class MockupService {
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
   * Generate an SVG mockup
   */
  static generateMockup(
    logo: string | SVGLogo,
    templateId: string,
    customText: Record<string, string> = {},
    selectedColorVariant?: string,
    brandName: string = 'Brand Name'
  ): string {
    const template = this.getTemplateById(templateId);

    if (!template) {
      throw new Error(`Template with ID "${templateId}" not found`);
    }

    return generateMockupSvg(logo, template, customText, selectedColorVariant, brandName);
  }

  /**
   * Generate an SVG data URL for a mockup
   */
  static generateMockupDataUrl(
    logo: string | SVGLogo,
    templateId: string,
    customText: Record<string, string> = {},
    selectedColorVariant?: string,
    brandName: string = 'Brand Name'
  ): string {
    const svg = this.generateMockup(logo, templateId, customText, selectedColorVariant, brandName);

    return svgToDataUrl(svg);
  }

  /**
   * Generate a PNG data URL for a mockup (browser-only)
   */
  static async generateMockupPng(
    logo: string | SVGLogo,
    templateId: string,
    width: number = 1200,
    customText: Record<string, string> = {},
    selectedColorVariant?: string,
    brandName: string = 'Brand Name'
  ): Promise<string> {
    const svg = this.generateMockup(logo, templateId, customText, selectedColorVariant, brandName);

    return convertMockupToPng(svg, width);
  }

  /**
   * Download a mockup as PNG (browser-only)
   */
  static async downloadMockup(
    logo: string | SVGLogo,
    templateId: string,
    format: 'png' | 'svg' = 'png',
    filename?: string,
    width: number = 1200,
    customText: Record<string, string> = {},
    selectedColorVariant?: string,
    brandName: string = 'Brand Name'
  ): Promise<void> {
    const template = this.getTemplateById(templateId);

    if (!template) {
      throw new Error(`Template with ID "${templateId}" not found`);
    }

    const defaultFilename = `${brandName.replace(/\s+/g, '-').toLowerCase()}-${template.type.toLowerCase()}.${format}`;
    const outputFilename = filename || defaultFilename;

    if (format === 'svg') {
      const svg = this.generateMockup(
        logo,
        templateId,
        customText,
        selectedColorVariant,
        brandName
      );

      const dataUrl = svgToDataUrl(svg);
      this.triggerDownload(dataUrl, outputFilename);
    } else {
      const pngDataUrl = await this.generateMockupPng(
        logo,
        templateId,
        width,
        customText,
        selectedColorVariant,
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
}

export default MockupService;
