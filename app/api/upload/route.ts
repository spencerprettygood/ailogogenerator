import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // Generate a client token for the browser to upload the file
        // ⚠️ Authenticate users before allowing them to upload files: https://vercel.com/docs/storage/vercel-blob/using-blob-sdk#securing-your-blob-store
        return {
          allowedContentTypes: ['application/zip', 'text/html', 'text/plain', 'application/json'],
          token: process.env.BLOB_READ_WRITE_TOKEN,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Get notified when the file is uploaded – here you can update your database or send a webhook notification.
        console.log('Blob upload completed', blob, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 } // The webhook will retry 5 times waiting for a 200
    );
  }
}
