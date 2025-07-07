import { MockupTemplate } from '@/lib/types';

/**
 * API client for the mockup generation service
 */
export class MockupAPI {
  /**
   * Fetch available mockup templates
   */
  static async getTemplates(): Promise<MockupTemplate[]> {
    try {
      const response = await fetch('/api/generate-mockup');

      if (!response.ok) {
        throw new Error(`Failed to fetch mockup templates: ${response.statusText}`);
      }

      const data = await response.json();
      return data.templates;
    } catch (error) {
      console.error('Error fetching mockup templates:', error);
      throw error;
    }
  }

  /**
   * Generate a mockup and return the URL
   */
  static async generateMockup(
    logoSvg: string,
    templateId: string,
    customText: Record<string, string> = {},
    selectedColorVariant?: string,
    brandName: string = 'Brand Name',
    format: 'svg' | 'png' = 'svg'
  ): Promise<string> {
    try {
      const response = await fetch('/api/generate-mockup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logoSvg,
          templateId,
          customText,
          selectedColorVariant,
          brandName,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate mockup: ${response.statusText}`);
      }

      // If SVG format, return the SVG as text
      if (format === 'svg') {
        const svgText = await response.text();
        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
      }

      // If PNG format, return a blob URL
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error generating mockup:', error);
      throw error;
    }
  }

  /**
   * Download a mockup directly
   */
  static async downloadMockup(
    logoSvg: string,
    templateId: string,
    format: 'svg' | 'png' = 'png',
    customText: Record<string, string> = {},
    selectedColorVariant?: string,
    brandName: string = 'Brand Name',
    filename?: string
  ): Promise<void> {
    try {
      const response = await fetch('/api/generate-mockup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logoSvg,
          templateId,
          customText,
          selectedColorVariant,
          brandName,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate mockup: ${response.statusText}`);
      }

      // Get the suggested filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let suggestedFilename = filename;

      if (!suggestedFilename && contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          suggestedFilename = filenameMatch[1];
        }
      }

      if (!suggestedFilename) {
        suggestedFilename = `${brandName.replace(/\s+/g, '-').toLowerCase()}-mockup.${format}`;
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Create a download link and trigger the download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = suggestedFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading mockup:', error);
      throw error;
    }
  }
}
