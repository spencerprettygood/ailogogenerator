/**
 * Mockup Testing Utilities
 *
 * Provides utilities for testing the enhanced mockup system with various SVG types
 */

import { SVGLogo } from '@/lib/types';
import { EnhancedMockupService } from './enhanced-mockup-service';
import { MockupType } from './mockup-types';

/**
 * Test SVG variants for mockup testing
 */
export const TEST_SVG_LOGOS: Record<string, string> = {
  // Simple geometric logo
  simple: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" fill="#4285F4" />
    <rect x="25" y="25" width="50" height="50" fill="#34A853" />
    <polygon points="50,10 90,90 10,90" fill="#FBBC05" />
  </svg>`,

  // Text-based logo
  text: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
    <text x="10" y="50" font-family="Arial" font-size="30" font-weight="bold" fill="#4285F4">ACME</text>
    <text x="10" y="80" font-family="Arial" font-size="15" fill="#34A853">COMPANY</text>
  </svg>`,

  // Complex logo with gradients
  complex: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#4285F4;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#34A853;stop-opacity:1" />
      </linearGradient>
      <radialGradient id="grad2" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" style="stop-color:#FBBC05;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#EA4335;stop-opacity:1" />
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="80" fill="url(#grad1)" />
    <circle cx="100" cy="100" r="60" fill="url(#grad2)" />
    <path d="M50,50 Q100,25 150,50 T100,150 Z" fill="none" stroke="white" stroke-width="5" />
  </svg>`,

  // Logo with filters and effects
  filtered: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
        <feOffset dx="5" dy="5" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.5" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <rect x="40" y="40" width="120" height="120" rx="20" ry="20" fill="#4285F4" filter="url(#shadow)" />
    <circle cx="100" cy="100" r="50" fill="#FBBC05" />
    <text x="70" y="110" font-family="Arial" font-size="30" fill="white">ABC</text>
  </svg>`,

  // Monochrome logo (for testing with different color schemes)
  monochrome: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect x="10" y="10" width="80" height="80" rx="10" ry="10" fill="#000000" />
    <circle cx="50" cy="50" r="30" fill="#FFFFFF" />
    <rect x="35" y="35" width="30" height="30" fill="#000000" />
  </svg>`,
};

/**
 * Test all mockup templates with various SVG types
 * This is useful for ensuring the enhanced mockup system works with different kinds of SVGs
 */
export async function testAllMockupTemplates(): Promise<Record<string, Record<string, string>>> {
  const results: Record<string, Record<string, string>> = {};

  // Get all available templates
  const templates = EnhancedMockupService.getAllTemplates();

  // Test each template with each test SVG
  for (const template of templates) {
    if (!template?.id) continue;
    results[template.id] = {};

    for (const [name, svg] of Object.entries(TEST_SVG_LOGOS)) {
      if (!name || !svg) continue;
      try {
        // Generate mockup with default settings
        const mockup = EnhancedMockupService.generateEnhancedMockup(
          svg,
          template.id,
          undefined, // Use default background
          {}, // Default text
          {
            applyLighting: true,
            lightDirection: 'top',
            lightIntensity: 0.3,
            applyPerspective: false,
            applyShadow: true,
            shadowBlur: 8,
            shadowOpacity: 0.3,
          },
          'Test Brand'
        );

        if (results[template.id]) {
          results[template.id][name] = 'success';
        }
      } catch (error) {
        if (results[template.id]) {
          results[template.id][name] =
            `error: ${error instanceof Error ? error.message : String(error)}`;
        }
      }
    }
  }

  return results;
}

/**
 * Test performance of mockup generation with different complexity settings
 * Measures the time taken to generate mockups with various effect combinations
 */
export async function testMockupPerformance(
  iterations: number = 5
): Promise<Record<string, number>> {
  const performanceResults: Record<string, number> = {};
  const testSvg = TEST_SVG_LOGOS.complex; // Use complex SVG for performance testing
  const templates = EnhancedMockupService.getAllTemplates();
  const templateId = templates[0]?.id; // Use first template
  
  if (!templateId || !testSvg) {
    throw new Error('No templates or test SVG available for performance testing');
  }

  // Test basic mockup (no effects)
  const basicStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    EnhancedMockupService.generateEnhancedMockup(
      testSvg,
      templateId,
      undefined,
      {},
      {
        applyLighting: false,
        lightDirection: 'top',
        lightIntensity: 0,
        applyPerspective: false,
        applyShadow: false,
        shadowBlur: 0,
        shadowOpacity: 0,
      },
      'Test Brand'
    );
  }
  const basicEnd = performance.now();
  performanceResults['basic'] = (basicEnd - basicStart) / iterations;

  // Test with lighting only
  const lightingStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    EnhancedMockupService.generateEnhancedMockup(
      testSvg,
      templateId,
      undefined,
      {},
      {
        applyLighting: true,
        lightDirection: 'top',
        lightIntensity: 0.5,
        applyPerspective: false,
        applyShadow: false,
        shadowBlur: 0,
        shadowOpacity: 0,
      },
      'Test Brand'
    );
  }
  const lightingEnd = performance.now();
  performanceResults['lighting'] = (lightingEnd - lightingStart) / iterations;

  // Test with shadow only
  const shadowStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    EnhancedMockupService.generateEnhancedMockup(
      testSvg,
      templateId,
      undefined,
      {},
      {
        applyLighting: false,
        lightDirection: 'top',
        lightIntensity: 0,
        applyPerspective: false,
        applyShadow: true,
        shadowBlur: 10,
        shadowOpacity: 0.5,
      },
      'Test Brand'
    );
  }
  const shadowEnd = performance.now();
  performanceResults['shadow'] = (shadowEnd - shadowStart) / iterations;

  // Test with perspective only
  const perspectiveStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    EnhancedMockupService.generateEnhancedMockup(
      testSvg,
      templateId,
      undefined,
      {},
      {
        applyLighting: false,
        lightDirection: 'top',
        lightIntensity: 0,
        applyPerspective: true,
        perspectiveTransform: {
          rotateX: 15,
          rotateY: 10,
          rotateZ: 0,
          translateZ: 0,
        },
        applyShadow: false,
        shadowBlur: 0,
        shadowOpacity: 0,
      },
      'Test Brand'
    );
  }
  const perspectiveEnd = performance.now();
  performanceResults['perspective'] = (perspectiveEnd - perspectiveStart) / iterations;

  // Test with all effects
  const allEffectsStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    EnhancedMockupService.generateEnhancedMockup(
      testSvg,
      templateId,
      undefined,
      {},
      {
        applyLighting: true,
        lightDirection: 'top',
        lightIntensity: 0.5,
        applyPerspective: true,
        perspectiveTransform: {
          rotateX: 15,
          rotateY: 10,
          rotateZ: 0,
          translateZ: 0,
        },
        applyShadow: true,
        shadowBlur: 10,
        shadowOpacity: 0.5,
      },
      'Test Brand'
    );
  }
  const allEffectsEnd = performance.now();
  performanceResults['allEffects'] = (allEffectsEnd - allEffectsStart) / iterations;

  return performanceResults;
}

/**
 * Creates optimized mockups by applying performance recommendations
 * based on testing results
 */
export function createOptimizedMockup(
  svgCode: string,
  templateId: string,
  backgroundId?: string,
  customText: Record<string, string> = {},
  effectsConfig = {
    applyLighting: true,
    lightDirection: 'top' as const,
    lightIntensity: 0.3,
    applyPerspective: false,
    applyShadow: true,
    shadowBlur: 8,
    shadowOpacity: 0.3,
  },
  brandName: string = 'Brand Name'
): string {
  // Optimize SVG first - remove unnecessary elements and attributes
  const optimizedSvg = optimizeSvg(svgCode);

  // Generate mockup with optimized SVG
  return EnhancedMockupService.generateEnhancedMockup(
    optimizedSvg,
    templateId,
    backgroundId,
    customText,
    effectsConfig,
    brandName
  );
}

/**
 * Optimize SVG code for faster rendering
 * Removes unnecessary elements and attributes
 */
function optimizeSvg(svgCode: string): string {
  // This is a simple example - in a real implementation you would use a proper SVG optimizer library
  return (
    svgCode
      // Remove comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // Remove metadata
      .replace(/<metadata[\s\S]*?<\/metadata>/g, '')
      // Remove empty defs
      .replace(/<defs>\s*<\/defs>/g, '')
      // Remove empty groups
      .replace(/<g>\s*<\/g>/g, '')
      // Remove unnecessary whitespace
      .replace(/>\s+</g, '><')
  );
}

/**
 * Sample background image URLs for testing
 * In a real implementation, these would be actual images in the public directory
 */
export const TEST_BACKGROUND_IMAGES: Record<MockupType, string[]> = {
  [MockupType.BUSINESS_CARD]: [
    '/assets/mockups/backgrounds/business-card-desk-1.jpg',
    '/assets/mockups/backgrounds/business-card-hand-1.jpg',
    '/assets/mockups/backgrounds/business-card-stack-1.jpg',
  ],
  [MockupType.WEBSITE]: [
    '/assets/mockups/backgrounds/website-macbook-1.jpg',
    '/assets/mockups/backgrounds/website-desktop-1.jpg',
    '/assets/mockups/backgrounds/website-responsive-1.jpg',
  ],
  [MockupType.TSHIRT]: [
    '/assets/mockups/backgrounds/tshirt-model-1.jpg',
    '/assets/mockups/backgrounds/tshirt-hanging-1.jpg',
    '/assets/mockups/backgrounds/tshirt-folded-1.jpg',
  ],
  [MockupType.STOREFRONT]: [
    '/assets/mockups/backgrounds/storefront-urban-1.jpg',
    '/assets/mockups/backgrounds/storefront-mall-1.jpg',
    '/assets/mockups/backgrounds/storefront-night-1.jpg',
  ],
  [MockupType.SOCIAL_MEDIA]: [
    '/assets/mockups/backgrounds/social-profile-1.jpg',
    '/assets/mockups/backgrounds/social-post-1.jpg',
    '/assets/mockups/backgrounds/social-mobile-1.jpg',
  ],
  [MockupType.MOBILE_APP]: [
    '/assets/mockups/backgrounds/mobile-app-hand-1.jpg',
    '/assets/mockups/backgrounds/mobile-app-desk-1.jpg',
    '/assets/mockups/backgrounds/mobile-app-devices-1.jpg',
  ],
  [MockupType.PACKAGING]: [
    '/assets/mockups/backgrounds/packaging-box-1.jpg',
    '/assets/mockups/backgrounds/packaging-display-1.jpg',
    '/assets/mockups/backgrounds/packaging-unboxing-1.jpg',
  ],
  [MockupType.LETTERHEAD]: [
    '/assets/mockups/backgrounds/letterhead-desk-1.jpg',
    '/assets/mockups/backgrounds/letterhead-closeup-1.jpg',
  ],
  [MockupType.BILLBOARD]: [
    '/assets/mockups/backgrounds/billboard-urban-1.jpg',
    '/assets/mockups/backgrounds/billboard-highway-1.jpg',
  ],
  [MockupType.EMAIL_SIGNATURE]: ['/assets/mockups/backgrounds/email-laptop-1.jpg'],
  [MockupType.FAVICON]: ['/assets/mockups/backgrounds/favicon-browser-1.jpg'],
};
