import { NextRequest, NextResponse } from 'next/server';
import { AnimationExportOptions } from '@/lib/types';
import { storeFile } from '@/lib/utils/file-storage';
// Import sharp but only use it in GIF/MP4 handlers that are currently disabled
import * as sharp from 'sharp';

// Keep edge runtime since we're not actively using Node.js features in current implementation
// If GIF/MP4 export is enabled in the future, this should be changed to 'nodejs'
export const runtime = 'edge';

/**
 * API route for exporting animated logos in different formats
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { 
      svg, 
      css, 
      js, 
      format = 'svg', 
      options = {} 
    } = body;

    if (!svg) {
      return NextResponse.json(
        { error: 'SVG content is required' },
        { status: 400 }
      );
    }

    // Process based on the requested format
    switch (format) {
      case 'svg':
        return handleSvgExport(svg, css, js);
      case 'html':
        return handleHtmlExport(svg, css, js, options);
      case 'gif':
        return handleGifExport(svg, css, js, options);
      case 'mp4':
        return handleMp4Export(svg, css, js, options);
      default:
        return NextResponse.json(
          { error: `Unsupported export format: ${format}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Animation export error:', error);
    return NextResponse.json(
      { error: 'Internal server error during animation export' },
      { status: 500 }
    );
  }
}

/**
 * Handle export of animated SVG
 */
async function handleSvgExport(svg: string, css?: string, js?: string) {
  // Combine SVG with CSS and JS
  const animatedSvg = embedCssJsInSvg(svg, css, js);
  
  // Store the file
  const fileId = storeFile('animated-logo.svg', Buffer.from(animatedSvg));
  
  // Return the file URL
  return NextResponse.json({
    success: true,
    fileUrl: `/api/download?file=${fileId}`,
    format: 'svg',
  });
}

/**
 * Handle export of HTML with embedded animated SVG
 */
async function handleHtmlExport(svg: string, css?: string, js?: string, options?: AnimationExportOptions) {
  // Create a self-contained HTML file with the animated SVG
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Animated Logo</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
    }
    .logo-container {
      max-width: 500px;
      max-height: 500px;
    }
    ${css || ''}
  </style>
</head>
<body>
  <div class="logo-container">
    ${svg}
  </div>
  <script>
    ${js || ''}
  </script>
</body>
</html>
  `;
  
  // Store the HTML file
  const fileId = storeFile('animated-logo.html', Buffer.from(html));
  
  // Return the file URL
  return NextResponse.json({
    success: true,
    fileUrl: `/api/download?file=${fileId}`,
    format: 'html',
  });
}

/**
 * Handle export of animated GIF
 * Note: This is a simplified implementation. In a production environment,
 * you would use a more robust solution like puppeteer to render and capture frames.
 */
async function handleGifExport(svg: string, css?: string, js?: string, options?: AnimationExportOptions) {
  // For now, return an error as GIF generation requires more complex setup
  return NextResponse.json(
    { 
      error: 'GIF export is not implemented in this version',
      message: 'Use SVG or HTML format for animation export'
    },
    { status: 501 }
  );
}

/**
 * Handle export of MP4 video
 * Note: This is a simplified implementation. In a production environment,
 * you would use a tool like FFmpeg to generate videos.
 */
async function handleMp4Export(svg: string, css?: string, js?: string, options?: AnimationExportOptions) {
  // For now, return an error as MP4 generation requires more complex setup
  return NextResponse.json(
    { 
      error: 'MP4 export is not implemented in this version',
      message: 'Use SVG or HTML format for animation export'
    },
    { status: 501 }
  );
}

/**
 * Embed CSS and JS directly into an SVG for self-contained animation
 */
function embedCssJsInSvg(svg: string, css?: string, js?: string): string {
  if (!css && !js) {
    return svg;
  }

  // Parse the SVG to insert style and script elements
  const styleTag = css ? `<style>${css}</style>` : '';
  const scriptTag = js ? `<script>${js}</script>` : '';
  
  // Insert after the opening svg tag
  return svg.replace('<svg', `<svg>${styleTag}${scriptTag}`);
}