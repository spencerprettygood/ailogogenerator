import type { DesignSpec, LogoVariants } from '@/lib/types';

export interface StageGInput {
  variants: LogoVariants;
  designSpec: DesignSpec;
}

export type StageGOutput = BrandGuidelines;

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
  input: StageGInput
): Promise<StageGOutput> {
  const { variants, designSpec } = input;
  const colors = extractHexColors(variants.primary);
  const colorPalette: ColorPalette[] = colors.map(hex => ({
    name: `Color ${hex}`,
    hex,
    rgb: hexToRgb(hex),
    cmyk: hexToCmyk(hex),
    usage: 'Primary brand color'
  }));

  const typography = getTypography(designSpec.style_preferences || '');

  // Constructing the brand overview from the design spec
  const brand_overview = `<h2>Brand Overview</h2><p><strong>${designSpec.brand_name}</strong>: ${designSpec.brand_description}. Our brand targets ${designSpec.target_audience}. The desired style is ${designSpec.style_preferences} with a focus on ${designSpec.imagery}.</p>`;

  const logo_usage = `<h2>Logo Usage</h2><p>The primary logo should be used in most cases. The monochrome version is for single-color applications. The favicon is for browser tabs and app icons.</p>`;

  const spacing_guidelines = `<h2>Logo Spacing & Sizing</h2><p>Maintain clear space around the logo equal to the height of the letter \"${designSpec.brand_name ? designSpec.brand_name[0] : 'A'}\". Minimum display size should be 24px in height.</p>`;

  const usage_examples = `<h2>Usage Examples</h2><p>Place the logo on marketing materials, websites, and social media profiles. Ensure high contrast with the background.</p>`;

  const dos_and_donts = `<h2>Do's and Don'ts</h2><ul><li>Do: Use the logo consistently.</li><li>Don't: Stretch, distort, or change the colors of the logo.</li></ul>`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${designSpec.brand_name} Brand Guidelines</title>
  <style>
    body { font-family: ${typography.secondary_font}; color: #333; margin: 0; padding: 0; }
    .container { max-width: 800px; margin: 40px auto; padding: 20px; }
    h1, h2 { font-family: ${typography.primary_font}; }
    h1 { color: ${colorPalette[0]?.hex || '#000'}; }
    .logo-display { padding: 20px; border: 1px solid #eee; text-align: center; margin-bottom: 20px; }
    .logo-display svg { max-width: 200px; max-height: 100px; }
    .color-swatch { display: inline-block; width: 100px; height: 100px; margin: 10px; border: 1px solid #ccc; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${designSpec.brand_name} Brand Guidelines</h1>
    
    <div class="logo-display">
      <h3>Primary Logo</h3>
      ${variants.primary}
    </div>
    <div class="logo-display">
      <h3>Monochrome Logo</h3>
      ${variants.monochrome}
    </div>

    ${brand_overview}
    ${logo_usage}

    <h2>Color Palette</h2>
    <table>
      <tr><th>Swatch</th><th>Name</th><th>HEX</th><th>RGB</th><th>CMYK</th></tr>
      ${colorPalette.map(c => `<tr><td><div class="color-swatch" style="background-color:${c.hex};"></div></td><td>${c.name}</td><td>${c.hex}</td><td>${c.rgb}</td><td>${c.cmyk}</td></tr>`).join('')}
    </table>

    <h2>Typography</h2>
    <p>Primary Font: <strong>${typography.primary_font}</strong></p>
    <p>Secondary Font: <strong>${typography.secondary_font}</strong></p>
    <p>${typography.usage}</p>

    ${spacing_guidelines}
    ${usage_examples}
    ${dos_and_donts}

  </div>
</body>
</html>
  `;

  return {
    html,
    sections: {
      brand_overview,
      logo_usage,
      color_palette: colorPalette,
      typography,
      spacing_guidelines,
      usage_examples,
      dos_and_donts,
    },
  };
}