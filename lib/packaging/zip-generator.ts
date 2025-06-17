import JSZip from 'jszip';

// Interface for the data needed to create the package
// This should align with what StageHInput provides or can be mapped from it.
export interface PackageData {
  brandName: string;
  originalSvg: string; // Corresponds to StageHInput.svg
  monochrome: {
    lightSvg: string; // Corresponds to StageHInput.monochrome.white
    darkSvg: string;  // Corresponds to StageHInput.monochrome.black
  };
  faviconSvg: string; // Corresponds to StageHInput.favicon.svg
  pngExports: {
    png256: Buffer;   // Corresponds to StageHInput.pngVariants.png256
    png512: Buffer;   // Corresponds to StageHInput.pngVariants.png512
    png1024: Buffer;  // Corresponds to StageHInput.pngVariants.png1024
  };
  faviconIco: Buffer; // Corresponds to StageHInput.favicon.ico
  guidelinesHtml: string; // Corresponds to StageHInput.guidelines.html
}

// README content generation (adapting from stage-h-packaging.ts template)
function generateReadmeContent(brandName: string): string {
  const date = new Date().toLocaleDateString();
  return `# ${brandName} Logo Package

This package contains the complete brand assets for ${brandName}, generated with AI Logo Generator.

## Contents

### SVG Files
- \`logo.svg\` - Primary logo in vector format
- \`logo-mono-light.svg\` - Monochrome light version (e.g., white for dark backgrounds)
- \`logo-mono-dark.svg\` - Monochrome dark version (e.g., black for light backgrounds)
- \`favicon.svg\` - Simplified favicon version in vector format

### PNG Files
- \`exports/logo-256.png\` - 256x256 pixel raster version
- \`exports/logo-512.png\` - 512x512 pixel raster version
- \`exports/logo-1024.png\` - 1024x1024 pixel raster version

### Favicon
- \`favicon.ico\` - ICO format for website favicon

### Documentation
- \`brand-guidelines.html\` - Complete brand guidelines document

## Usage

The SVG files are vector graphics that can be scaled to any size without loss of quality. They are ideal for print and high-resolution digital use.

The PNG files are raster images suitable for web and digital use where vector formats are not supported.

The favicon files are optimized for use as website favicons and app icons.

## License

These assets are owned by ${brandName} and are subject to their terms of use.

Generated on: ${date}
`;
}

export async function createLogoPackage(
  data: PackageData
): Promise<Buffer> {
  const zip = new JSZip();

  // Add SVG files
  zip.file('logo.svg', data.originalSvg);
  zip.file('logo-mono-light.svg', data.monochrome.lightSvg);
  zip.file('logo-mono-dark.svg', data.monochrome.darkSvg);
  zip.file('favicon.svg', data.faviconSvg);

  // Add PNG exports to an 'exports' folder within the zip
  const exportsFolder = zip.folder('exports');
  if (exportsFolder) {
    exportsFolder.file('logo-256.png', data.pngExports.png256);
    exportsFolder.file('logo-512.png', data.pngExports.png512);
    exportsFolder.file('logo-1024.png', data.pngExports.png1024);
  } else {
    // Fallback if folder creation fails, though JSZip usually handles this well
    zip.file('exports/logo-256.png', data.pngExports.png256);
    zip.file('exports/logo-512.png', data.pngExports.png512);
    zip.file('exports/logo-1024.png', data.pngExports.png1024);
  }
  
  zip.file('favicon.ico', data.faviconIco);

  // Add brand guidelines
  zip.file('brand-guidelines.html', data.guidelinesHtml);

  // Add README with usage instructions
  const readme = generateReadmeContent(data.brandName);
  zip.file('README.txt', readme);

  return await zip.generateAsync({ type: 'nodebuffer', compression: "DEFLATE", compressionOptions: { level: 9 } });
}
