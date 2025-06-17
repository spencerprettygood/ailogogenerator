import { NextRequest, NextResponse } from 'next/server';
import { getFile } from '../../../../lib/utils/file-storage';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('file');
    
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }
    
    const file = getFile(fileId);
    
    if (!file) {
      return NextResponse.json(
        { error: 'File not found or expired' },
        { status: 404 }
      );
    }
    
    // Ensure the filename is generic for the package
    const downloadFilename = 'logo-package.zip';

    // Return the file with appropriate headers
    return new NextResponse(Buffer.from(file.buffer), {
      status: 200,
      headers: {
        'Content-Type': file.contentType, // Should be 'application/zip' for these packages
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': file.buffer.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Expires': '0',
        'Pragma': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('Download error:', error);
    // In a production app, you might want to log this error to a monitoring service
    return NextResponse.json(
      { error: 'Internal server error during download' }, // More generic error for client
      { status: 500 }
    );
  }
}