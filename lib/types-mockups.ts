/**
 * Mockup system types
 * 
 * This file re-exports the types from mockup-types.ts to support existing imports
 * and provides additional interface definitions for the mockup components.
 */

import { SVGLogo } from "./types";
import { 
  MockupTemplate, 
  MockupType, 
  TextPlaceholder, 
  LogoPlacement,
  EnhancedEffectsConfig,
  LightingEffects,
  ShadowEffects
} from "./mockups/mockup-types";

// Re-export from mockup-types.ts
export { MockupType };
export type { 
  MockupTemplate, 
  TextPlaceholder, 
  LogoPlacement,
  EnhancedEffectsConfig,
  LightingEffects,
  ShadowEffects
};

/**
 * Props for the MockupSelector component
 */
export interface MockupSelectorProps {
  templates: MockupTemplate[];
  selectedTemplateId: string;
  onSelectTemplateAction: (id: string) => void;
  logo?: SVGLogo | string;
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
 * Props for the EnhancedMockupPreviewSystem component
 */
export interface EnhancedMockupPreviewSystemProps {
  logo: SVGLogo | string;
  brandName?: string;
  templates?: MockupTemplate[];
  className?: string;
  onDownload?: (templateId: string, format: string) => void;
  initialTemplateId?: string;
  initialBackgroundId?: string;
}

/**
 * Props for the EnhancedMockupPreview component
 */
export interface EnhancedMockupPreviewProps extends MockupPreviewProps {
  backgroundId?: string;
  onBackgroundChange?: (backgroundId: string) => void;
  showBackgroundSelector?: boolean;
  showEffectsControls?: boolean;
  effectsConfig?: EnhancedEffectsConfig;
  onEffectsChange?: (effectsConfig: EnhancedEffectsConfig) => void;
}

/**
 * Props for the EnhancedBackgroundSelector component
 */
export interface EnhancedBackgroundSelectorProps {
  initialBackgroundId?: string;
  mockupType: MockupType;
  onSelectBackground: (backgroundId: string) => void;
  className?: string;
  filteredTags?: string[];
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
 * Props for the EnhancedEffectsCustomizer component
 */
export interface EnhancedEffectsCustomizerProps {
  effectsConfig: EnhancedEffectsConfig;
  onEffectsChange: (effectsConfig: EnhancedEffectsConfig) => void;
  templateId: string;
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

/**
 * Enhanced mockup rendering options
 */
export interface EnhancedMockupRenderOptions extends MockupRenderOptions {
  backgroundId?: string;
  effectsConfig?: EnhancedEffectsConfig;
  renderQuality?: 'standard' | 'high' | 'ultra';
}