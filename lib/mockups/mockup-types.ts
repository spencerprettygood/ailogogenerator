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
  BILLBOARD = 'billboard'
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
  metadata?: Record<string, any>; // Additional template-specific metadata
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
}