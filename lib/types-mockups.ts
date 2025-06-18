/**
 * Mockup system types
 * 
 * This file re-exports the types from mockup-types.ts to support existing imports
 * and provides additional interface definitions for the mockup components.
 */

import { SVGLogo } from "./types";
import { MockupTemplate, MockupType, TextPlaceholder, LogoPlacement } from "./mockups/mockup-types";

// Re-export from mockup-types.ts
export { MockupType, MockupTemplate, TextPlaceholder, LogoPlacement };

/**
 * Props for the MockupSelector component
 */
export interface MockupSelectorProps {
  templates: MockupTemplate[];
  selectedTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
  logo: SVGLogo | string;
  brandName?: string;
  className?: string;
}

/**
 * Props for the MockupPreviewSystem component
 */
export interface MockupPreviewSystemProps {
  logo: SVGLogo | string;
  brandName?: string;
  templates?: MockupTemplate[];
  className?: string;
  onDownload?: (templateId: string, format: string) => void;
  initialTemplateId?: string;
}

/**
 * Props for the MockupPreview component
 */
export interface MockupPreviewProps {
  logo: SVGLogo | string;
  template: MockupTemplate;
  customText?: Record<string, string>;
  selectedColorVariant?: string;
  brandName?: string;
  onDownload?: () => void;
  previewOnly?: boolean;
  className?: string;
}

/**
 * Props for the MockupCustomizer component
 */
export interface MockupCustomizerProps {
  template: MockupTemplate;
  brandName?: string;
  onUpdateCustomText: (customText: Record<string, string>) => void;
  onUpdateColorVariant: (colorVariant: string) => void;
  selectedColorVariant?: string;
  initialCustomText?: Record<string, string>;
  className?: string;
}

/**
 * Mockup rendering options
 */
export interface MockupRenderOptions {
  width?: number;
  height?: number;
  format?: 'png' | 'jpg' | 'svg';
  quality?: number;
  transparent?: boolean;
  customText?: Record<string, string>;
  colorVariant?: string;
  brandName?: string;
}