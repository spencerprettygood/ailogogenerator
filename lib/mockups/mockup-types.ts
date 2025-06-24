/**
 * Mockup system types
 * 
 * This file contains the types and interfaces for the mockup system.
 */

/**
 * Types of mockups available in the system
 */
export enum MockupType {
  BUSINESS_CARD = 'business_card',
  WEBSITE = 'website',
  TSHIRT = 'tshirt',
  STOREFRONT = 'storefront',
  SOCIAL_MEDIA = 'social_media',
  MOBILE_APP = 'mobile_app',
  PACKAGING = 'packaging',
  LETTERHEAD = 'letterhead',
  BILLBOARD = 'billboard',
  EMAIL_SIGNATURE = 'email_signature',
  FAVICON = 'favicon'
}

/**
 * Email signature template types
 */
export enum EmailSignatureType {
  MINIMALIST = 'minimalist',
  PROFESSIONAL = 'professional',
  CREATIVE = 'creative',
  COMPACT = 'compact'
}

/**
 * Text placeholder in a mockup template
 */
export interface TextPlaceholder {
  id: string;
  name: string;
  default: string;
  x: number; // percentage position from left (0-100)
  y: number; // percentage position from top (0-100)
  maxWidth: number; // percentage of mockup width (0-100)
  fontSize: number; // in pixels
  fontFamily?: string;
  color: string; // CSS color value
  fontWeight?: string | number;
  textAlign?: 'left' | 'center' | 'right';
}

/**
 * Logo placement configuration in a mockup
 */
export interface LogoPlacement {
  x: number; // percentage position from left (0-100)
  y: number; // percentage position from top (0-100)
  width: number; // percentage of mockup width (0-100)
  height: number; // percentage of mockup height (0-100)
  preserveAspectRatio: boolean;
  rotation?: number; // degrees
  opacity?: number; // 0-1
  depth?: number; // z-index for 3D positioning
  perspective?: {
    rotateX: number; // degrees
    rotateY: number; // degrees
    rotateZ: number; // degrees
  };
}

/**
 * Enhanced lighting effects configuration
 */
export interface LightingEffects {
  enabled: boolean;
  direction: 'top' | 'right' | 'bottom' | 'left';
  intensity: number; // 0-1
  ambientLight: number; // 0-1
  specularHighlight: boolean;
}

/**
 * Shadow effects configuration
 */
export interface ShadowEffects {
  enabled: boolean;
  blur: number; // pixels
  opacity: number; // 0-1
  offsetX: number; // pixels
  offsetY: number; // pixels
  color?: string; // CSS color value
}

/**
 * Mockup template definition
 */
export interface MockupTemplate {
  id: string;
  type: MockupType;
  name: string;
  description: string;
  placeholderUrl: string;
  thumbnailUrl?: string;
  aspectRatio: number; // width/height
  logoPlacement: LogoPlacement;
  textPlaceholders?: TextPlaceholder[];
  colorVariants?: string[]; // CSS color values for background
  customizableColors?: boolean;
  metadata?: Record<string, unknown>; // Additional template-specific metadata
  enhancedSettings?: {
    defaultLighting?: LightingEffects;
    defaultShadow?: ShadowEffects;
    supportsPerspective?: boolean;
    recommendedBackgroundTags?: string[];
  };
}

/**
 * Color scheme for email signatures and other templates
 */
export interface ColorScheme {
  primary: string;
  secondary: string;
  text: string;
  background: string;
  accent: string;
}

/**
 * Email signature template definition
 */
export interface EmailSignatureTemplate {
  id: string;
  name: string;
  type: EmailSignatureType;
  description: string;
  lightColors: ColorScheme;
  darkColors: ColorScheme;
  html: string; // HTML template with placeholders
}

/**
 * Favicon package configuration
 */
export interface FaviconPackage {
  id: string;
  name: string;
  description: string;
  sizes: number[]; // Array of sizes to generate (e.g., [16, 32, 48, 64, 128, 192, 512])
  formats: ('png' | 'ico' | 'svg')[]; // Formats to include
  includeManifest: boolean; // Whether to include web manifest
  includeBrowserConfig: boolean; // Whether to include browserconfig.xml for IE/Edge
}

/**
 * Mockup instance with applied logo and customization
 */
export interface MockupInstance {
  id: string;
  templateId: string;
  logoSvg: string;
  backgroundColor?: string;
  textValues?: Record<string, string>;
  customCss?: string;
  renderedUrl?: string;
  backgroundImageId?: string;
  effectsConfig?: {
    lighting?: LightingEffects;
    shadow?: ShadowEffects;
    perspective?: boolean;
  };
}

/**
 * Enhanced mockup effects configuration
 */
export interface EnhancedEffectsConfig {
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
}