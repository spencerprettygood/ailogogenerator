import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_MOCKUP_TEMPLATES, getTemplateById } from '@/lib/mockups/template-data';
import { generateMockupSvg } from '@/lib/mockups/mockup-generator';
import securityUtils from '@/lib/utils/security-utils';
import sharp from 'sharp';

// Use Node.js runtime since we need sharp for image processing
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body
    const body = await request.json();
    const { 
      logoSvg, 
      templateId, 
      customText = {}, 
      selectedColorVariant,
      brandName = 'Brand Name',
      format = 'svg',
      width = 1200 
    } = body;

    // Validate inputs
    if (!logoSvg) {
      return NextResponse.json(
        { error: 'Missing logo SVG' },
        { status: 400 }
      );
    }

    if (!templateId) {
      return NextResponse.json(
        { error: 'Missing template ID' },
        { status: 400 }
      );
    }

    // Find the template
    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: `Template with ID "${templateId}" not found` },
        { status: 404 }
      );
    }

    // Sanitize the SVG
    const sanitizedSvg = securityUtils.cleanSVG(logoSvg);

    // Generate the mockup SVG
    const mockupSvg = generateMockupSvg(
      sanitizedSvg,
      template,
      customText,
      selectedColorVariant,
      brandName
    );

    // If SVG format is requested, return the SVG
    if (format === 'svg') {
      return new NextResponse(mockupSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `attachment; filename="${brandName.replace(/\s+/g, '-').toLowerCase()}-${template.type.toLowerCase()}.svg"`
        }
      });
    }

    // If PNG format is requested, convert SVG to PNG
    if (format === 'png') {
      // Calculate height based on aspect ratio
      const height = Math.round(width / template.aspectRatio);

      // Convert SVG to PNG
      const pngBuffer = await sharp(Buffer.from(mockupSvg))
        .resize(width, height)
        .png()
        .toBuffer();

      return new NextResponse(pngBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${brandName.replace(/\s+/g, '-').toLowerCase()}-${template.type.toLowerCase()}.png"`
        }
      });
    }

    // If neither SVG nor PNG is requested, return an error
    return NextResponse.json(
      { error: 'Invalid format. Supported formats: svg, png' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error generating mockup:', error);
    return NextResponse.json(
      { error: 'Failed to generate mockup' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Return a list of available templates
  return NextResponse.json({
    templates: DEFAULT_MOCKUP_TEMPLATES.map(template => ({
      id: template.id,
      type: template.type,
      name: template.name,
      description: template.description,
      thumbnailUrl: template.thumbnailUrl,
      aspectRatio: template.aspectRatio
    }))
  });
}