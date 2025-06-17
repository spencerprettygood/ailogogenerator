import type { DesignSpec } from '../types';

export interface ColorPalette {
  name: string;
  hex: string;
  rgb: string;
  cmyk: string;
  usage: string;
}

export interface TypographySpec {
  primary_font: string;
  secondary_font: string;
  usage: string;
}

export interface BrandGuidelines {
  html: string;
  sections: {
    brand_overview: string;
    logo_usage: string;
    color_palette: ColorPalette[];
    typography: TypographySpec;
    spacing_guidelines: string;
    usage_examples: string;
    dos_and_donts: string;
  };
}

export interface LogoVariants {
  primary: string; // SVG string
  monochrome: string; // SVG string
  favicon: string; // SVG string
  pngVariants?: { [size: string]: string }; // base64 PNGs
}

// Utility: Extract HEX colors from SVG string
function extractHexColors(svg: string): string[] {
  const hexRegex = /#([0-9a-fA-F]{3,8})/g;
  const matches = svg.match(hexRegex) || [];
  return Array.from(new Set(matches));
}

// Utility: Convert HEX to RGB
function hexToRgb(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return `rgb(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255})`;
}

// Utility: Convert HEX to CMYK
function hexToCmyk(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const k = 1 - Math.max(r, g, b);
  const denom = 1 - k || 1;
  const cyan = ((1 - r - k) / denom) || 0;
  const magenta = ((1 - g - k) / denom) || 0;
  const yellow = ((1 - b - k) / denom) || 0;
  return `cmyk(${(cyan*100).toFixed(0)}%, ${(magenta*100).toFixed(0)}%, ${(yellow*100).toFixed(0)}%, ${(k*100).toFixed(0)}%)`;
}

// Utility: Simple font pairing logic
function getTypography(style: string): TypographySpec {
  if (/modern|tech|minimal/i.test(style)) {
    return {
      primary_font: 'Inter, Arial, sans-serif',
      secondary_font: 'Roboto, Helvetica, sans-serif',
      usage: 'Use Inter for headings, Roboto for body text.'
    };
  }
  if (/serif|classic|elegant/i.test(style)) {
    return {
      primary_font: 'Merriweather, Times New Roman, serif',
      secondary_font: 'Lora, Georgia, serif',
      usage: 'Use Merriweather for headings, Lora for body text.'
    };
  }
  return {
    primary_font: 'Montserrat, Arial, sans-serif',
    secondary_font: 'Open Sans, Helvetica, sans-serif',
    usage: 'Use Montserrat for headings, Open Sans for body text.'
  };
}

// Main function: Generate Brand Guidelines
export async function generateBrandGuidelines(
  variants: LogoVariants,
  designSpec: DesignSpec
): Promise<BrandGuidelines> {
  // 1. Color extraction
  const allSvgs = [variants.primary, variants.monochrome, variants.favicon].join(' ');
  const hexColors = extractHexColors(allSvgs);
  const color_palette: ColorPalette[] = hexColors.map((hex, i) => ({
    name: `Color ${i+1}`,
    hex,
    rgb: hexToRgb(hex),
    cmyk: hexToCmyk(hex),
    usage: i === 0 ? 'Primary' : 'Secondary',
  }));

  // 2. Typography
  const typography = getTypography(Array.isArray(designSpec.stylePreferences) ? designSpec.stylePreferences.join(', ') : (designSpec.stylePreferences || ''));

  // 3. Sections
  const brand_overview = `<h2>Brand Overview</h2><p><strong>${designSpec.brandName}</strong>: ${designSpec.slogan ? designSpec.slogan + '. ' : ''}${designSpec.industry ? 'Industry: ' + designSpec.industry + '. ' : ''}${designSpec.targetAudience ? 'Target: ' + designSpec.targetAudience + '. ' : ''}</p>`;
  const logo_usage = `<h2>Logo Usage</h2><div><p>Use the primary logo for most applications. Monochrome for limited color or print. Favicon for web tabs.</p><div style="display:flex;gap:24px;align-items:center;"><div><div>Primary</div>${variants.primary}</div><div><div>Monochrome</div>${variants.monochrome}</div><div><div>Favicon</div>${variants.favicon}</div></div></div>`;
  const color_palette_html = `<h2>Color Palette</h2><div style="display:flex;gap:16px;flex-wrap:wrap;">${color_palette.map(c => `<div style="border:1px solid #ccc;padding:8px;text-align:center;"><div style="width:48px;height:48px;background:${c.hex};margin:auto;border-radius:6px;"></div><div>${c.hex}</div><div>${c.rgb}</div><div>${c.cmyk}</div><div style="font-size:12px;color:#666;">${c.usage}</div></div>`).join('')}</div>`;
  const typography_html = `<h2>Typography</h2><div><strong>Primary Font:</strong> ${typography.primary_font}<br/><strong>Secondary Font:</strong> ${typography.secondary_font}<br/><span style="font-size:12px;color:#666;">${typography.usage}</span></div>`;
  const spacing_guidelines = `<h2>Logo Spacing & Sizing</h2><p>Maintain clear space around the logo equal to the height of the letter "${designSpec.brandName ? designSpec.brandName[0] : 'X'}". Minimum logo size: 32px height for digital, 10mm for print.</p>`;
  const usage_examples = `<h2>Usage Examples</h2><ul><li>On white/light backgrounds</li><li>On brand color backgrounds</li><li>As app icon or favicon</li></ul>`;
  const dos_and_donts = `<h2>Do's and Don'ts</h2><ul><li>Do: Use provided logo files only</li><li>Do: Maintain aspect ratio</li><li>Don't: Alter colors or proportions</li><li>Don't: Add effects or outlines</li></ul>`;

  // 4. HTML Template
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${designSpec.brandName} Brand Guidelines</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #222; }
    main { max-width: 800px; margin: 0 auto; padding: 32px; background: #fff; }
    h1 { font-size: 2.2rem; margin-bottom: 0.5em; }
    h2 { font-size: 1.3rem; margin-top: 2em; margin-bottom: 0.5em; }
    ul { margin: 0 0 1em 1.5em; }
    @media (max-width: 600px) {
      main { padding: 8px; }
      h1 { font-size: 1.3rem; }
      h2 { font-size: 1.1rem; }
    }
    /* Print styles */
    @media print {
      body, main { background: #fff !important; color: #000 !important; }
      a { color: #000 !important; text-decoration: underline; }
    }
  </style>
</head>
<body>
  <main>
    <h1>${designSpec.brandName} Brand Guidelines</h1>
    ${brand_overview}
    ${logo_usage}
    ${color_palette_html}
    ${typography_html}
    ${spacing_guidelines}
    ${usage_examples}
    ${dos_and_donts}
  </main>
</body>
</html>`;

  return {
    html,
    sections: {
      brand_overview,
      logo_usage,
      color_palette,
      typography,
      spacing_guidelines,
      usage_examples,
      dos_and_donts,
    },
  };
}