/**
 * @file favicon-generator.ts
 * @description Generates favicons in various sizes and formats from SVG logos
 */

import { SVGLogo } from '@/lib/types';
import { FaviconPackage } from './mockup-types';
import { svgToDataUrl, convertMockupToPng } from './mockup-generator';
import JSZip from 'jszip';
import { ErrorCategory, handleError } from '@/lib/utils/error-handler';

/**
 * Predefined favicon packages
 */
export const FAVICON_PACKAGES: FaviconPackage[] = [
  {
    id: 'basic',
    name: 'Basic Package',
    description: 'Essential favicons for most websites',
    sizes: [16, 32, 64, 180, 192],
    formats: ['png', 'ico'],
    includeManifest: false,
    includeBrowserConfig: false,
  },
  {
    id: 'standard',
    name: 'Standard Package',
    description: 'Comprehensive favicon set for modern websites',
    sizes: [16, 32, 48, 64, 128, 180, 192, 512],
    formats: ['png', 'ico', 'svg'],
    includeManifest: true,
    includeBrowserConfig: true,
  },
  {
    id: 'complete',
    name: 'Complete Package',
    description: 'Full set of favicons with all metadata files',
    sizes: [16, 32, 48, 64, 96, 128, 180, 192, 256, 384, 512],
    formats: ['png', 'ico', 'svg'],
    includeManifest: true,
    includeBrowserConfig: true,
  },
];

/**
 * Prepares an SVG for favicon use
 */
function prepareSvgForFavicon(svgString: string): string {
  // Extract viewBox information
  const viewBoxMatch = svgString.match(/viewBox=["']([^"']*)["']/);
  const viewBox = viewBoxMatch?.[1] ? viewBoxMatch[1].split(/\s+/).map(Number) : [0, 0, 100, 100];

  // Make sure the SVG is square for favicon use
  if (viewBox[2] !== viewBox[3]) {
    const size = Math.max(viewBox[2] || 0, viewBox[3] || 0);
    const newViewBox = `${viewBox[0] || 0} ${viewBox[1] || 0} ${size} ${size}`;
    svgString = svgString.replace(/viewBox=["'][^"']*["']/, `viewBox="${newViewBox}"`);
  }

  // Remove any width/height attributes to ensure proper scaling
  svgString = svgString.replace(/width=["'][^"']*["']/g, '');
  svgString = svgString.replace(/height=["'][^"']*["']/g, '');

  // Add explicit viewBox if not present
  if (!viewBoxMatch) {
    svgString = svgString.replace(/<svg/, '<svg viewBox="0 0 100 100"');
  }

  // Ensure the SVG has xmlns attribute
  if (!svgString.includes('xmlns=')) {
    svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  return svgString;
}

/**
 * Generates all favicons for a specific package
 */
export async function generateFavicons(
  logo: string | SVGLogo,
  packageId: string = 'standard',
  brandName: string = 'Brand Name',
  brandColor: string = '#000000'
): Promise<Blob> {
  try {
    // Get SVG code
    const svgCode = typeof logo === 'string' ? logo : logo.svgCode;

    // Get package configuration
    const packageConfig = FAVICON_PACKAGES.find(p => p.id === packageId) || FAVICON_PACKAGES[1]; // Default to standard

    // Prepare SVG for favicon use
    const preparedSvg = prepareSvgForFavicon(svgCode);
    const svgDataUrl = svgToDataUrl(preparedSvg);

    // Create a ZIP archive
    const zip = new JSZip();

    // Add the original SVG
    zip.file('favicon.svg', preparedSvg);

    // Generate PNGs at various sizes
    for (const size of packageConfig.sizes) {
      if (packageConfig.formats.includes('png')) {
        const pngDataUrl = await convertMockupToPng(preparedSvg, size);
        const pngData = pngDataUrl?.split(',')[1];
        if (pngData) {
          zip.file(`favicon-${size}x${size}.png`, pngData, { base64: true });
        }
      }
    }

    // Add favicon.ico (16x16, 32x32, 48x48)
    if (packageConfig.formats.includes('ico')) {
      // Note: ICO generation requires server-side processing
      // Here we include a placeholder note in the zip
      zip.file(
        'favicon.ico.txt',
        'Note: .ico generation requires server-side processing. Please use the PNG files to create an ICO file using an online converter.'
      );
    }

    // Add manifest.json if requested
    if (packageConfig.includeManifest && brandName && brandColor) {
      const manifest = generateWebManifest(brandName, brandColor, packageConfig.sizes);
      zip.file('manifest.json', manifest);
    }

    // Add browserconfig.xml if requested
    if (packageConfig.includeBrowserConfig && brandColor) {
      const browserConfig = generateBrowserConfig(brandColor);
      zip.file('browserconfig.xml', browserConfig);
    }

    // Add HTML snippet for easy integration
    const htmlSnippet = generateHtmlSnippet(packageConfig, brandColor || '#000000');
    zip.file('favicon-snippet.html', htmlSnippet);

    // Add README
    const readme = generateReadme(packageConfig, brandName || 'Brand Name');
    zip.file('README.txt', readme);

    // Generate the ZIP file
    const blob = await zip.generateAsync({ type: 'blob' });
    return blob;
  } catch (error) {
    handleError(error, {
      category: ErrorCategory.EXTERNAL,
      context: {
        operation: 'generateFavicons',
        packageId,
      },
      rethrow: true,
    });
    throw error; // Rethrow to propagate the error
  }
}

/**
 * Generates a web manifest file for Progressive Web Apps
 */
function generateWebManifest(brandName: string, themeColor: string, sizes: number[]): string {
  const icons = sizes
    .filter(size => size >= 192) // Only include larger sizes in manifest
    .map(size => ({
      src: `/favicon-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
    }));

  const manifest = {
    name: brandName,
    short_name: brandName,
    icons,
    theme_color: themeColor,
    background_color: '#ffffff',
    display: 'standalone',
  };

  return JSON.stringify(manifest, null, 2);
}

/**
 * Generates a browserconfig.xml file for IE/Edge
 */
function generateBrowserConfig(themeColor: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="/favicon-128x128.png"/>
      <square150x150logo src="/favicon-270x270.png"/>
      <TileColor>${themeColor}</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
}

/**
 * Generates HTML code snippet for including favicons
 */
function generateHtmlSnippet(packageConfig: FaviconPackage, themeColor: string): string {
  let html = '<!-- Favicon tags - Add these to your HTML <head> section -->\n';

  // Basic favicon
  html += '<link rel="icon" href="/favicon.ico" sizes="any">\n';
  html += '<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n';

  // Apple touch icon
  if (packageConfig.sizes.includes(180)) {
    html += '<link rel="apple-touch-icon" href="/favicon-180x180.png">\n';
  }

  // Manifest
  if (packageConfig.includeManifest) {
    html += '<link rel="manifest" href="/manifest.json">\n';
  }

  // Theme color
  html += `<meta name="theme-color" content="${themeColor}">\n`;

  return html;
}

/**
 * Generates a README file with instructions
 */
function generateReadme(packageConfig: FaviconPackage, brandName: string): string {
  return `# ${brandName} - Favicon Package

This package contains favicon files for ${brandName} in various sizes and formats.

## Contents

${packageConfig.formats.includes('svg') ? '- favicon.svg - Vector SVG favicon' : ''}
${packageConfig.formats.includes('ico') ? '- favicon.ico - Standard ICO favicon for browsers' : ''}
${packageConfig.sizes.map(size => `- favicon-${size}x${size}.png - ${size}x${size} PNG favicon`).join('\n')}
${packageConfig.includeManifest ? '- manifest.json - Web App Manifest for PWA support' : ''}
${packageConfig.includeBrowserConfig ? '- browserconfig.xml - Configuration for IE/Edge' : ''}
- favicon-snippet.html - HTML code for adding these favicons to your site

## Installation Instructions

1. Copy all favicon files to your website's root directory
2. Add the HTML from favicon-snippet.html to the <head> section of your HTML

## Notes

- For best compatibility, use both .ico and .svg favicons
- Modern browsers will use the SVG version when available
- The PNG files are provided for various touchscreen and application icon needs
- You may need to clear your browser cache to see favicon changes

Generated by AI Logo Generator
`;
}

/**
 * Downloads the favicon package as a ZIP file
 */
export async function downloadFavicons(
  logo: string | SVGLogo,
  packageId: string = 'standard',
  brandName: string = 'Brand Name',
  brandColor: string = '#000000'
): Promise<void> {
  try {
    const blob = await generateFavicons(logo, packageId, brandName, brandColor);

    // Format filename
    const safeFileName = brandName.replace(/\s+/g, '-').toLowerCase();
    const filename = `${safeFileName}-favicons.zip`;

    // Create and trigger download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    handleError(error, {
      category: ErrorCategory.UI,
      context: {
        operation: 'downloadFavicons',
        packageId,
      },
    });
  }
}
