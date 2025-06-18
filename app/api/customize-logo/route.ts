import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { secureAndOptimizeSvg } from '@/lib/utils/security-utils';

// Use Node.js runtime since we need sharp for image processing
export const runtime = 'nodejs';

/**
 * API endpoint for customizing an SVG logo
 * 
 * Takes a customized SVG and generates PNG variants at different sizes
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { svgCode, format = 'all' } = data;

    if (!svgCode) {
      return NextResponse.json(
        { error: 'Missing required svgCode parameter' },
        { status: 400 }
      );
    }

    // Secure and optimize the SVG
    const sanitizedSvg = await secureAndOptimizeSvg(svgCode);

    // If only SVG is requested, return it directly
    if (format === 'svg') {
      return NextResponse.json({ 
        svg: sanitizedSvg 
      });
    }

    // Convert the SVG to PNG at different sizes
    const sizes = [256, 512, 1024];
    const pngBuffers: Record<string, Buffer> = {};
    
    // Process each size in parallel
    await Promise.all(
      sizes.map(async (size) => {
        try {
          const pngBuffer = await sharp(Buffer.from(sanitizedSvg))
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
          
          // Store the buffer
          pngBuffers[`size${size}`] = pngBuffer;
        } catch (error) {
          console.error(`Error generating PNG at size ${size}:`, error);
          throw new Error(`Failed to generate PNG at size ${size}`);
        }
      })
    );

    // Convert buffers to base64 for response
    const pngUrls: Record<string, string> = {};
    for (const [sizeKey, buffer] of Object.entries(pngBuffers)) {
      pngUrls[sizeKey] = `data:image/png;base64,${buffer.toString('base64')}`;
    }

    // Return the results
    return NextResponse.json({
      svg: sanitizedSvg,
      png: pngUrls,
    });
  } catch (error) {
    console.error('Error customizing logo:', error);
    return NextResponse.json(
      { error: 'Failed to process logo customization' },
      { status: 500 }
    );
  }
}