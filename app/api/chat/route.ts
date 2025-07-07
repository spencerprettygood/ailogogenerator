import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { InputSanitizer } from '@/lib/utils/security-utils';
import { NextResponse } from 'next/server';

// Route segment config using Next.js 15 standards
export const runtime = 'edge';
export const preferredRegion = 'auto';
export const dynamic = 'force-dynamic'; // Always revalidate this route
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Define a type for chat messages
    type ChatMessage = {
      role: 'user' | 'assistant' | string;
      content: string;
      [key: string]: unknown;
    };

    // Sanitize user inputs for security
    const sanitizedMessages = messages.map((msg: ChatMessage) => {
      if (msg.role === 'user') {
        return {
          ...msg,
          content:
            typeof msg.content === 'string'
              ? InputSanitizer.sanitizeBrief(msg.content)
              : msg.content,
        };
      }
      return msg;
    });

    // Check if this is a request to generate a logo
    const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
    const isLogoGenerationRequest =
      typeof lastMessage?.content === 'string' && lastMessage.content.includes('[GENERATE_LOGO]');

    // If this is a logo generation request, redirect to the logo generation endpoint
    if (isLogoGenerationRequest) {
      return NextResponse.json({
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Redirecting to logo generation...',
        redirectToLogoGeneration: true,
        prompt: lastMessage.content.replace('[GENERATE_LOGO]', '').trim(),
      });
    }

    const result = await streamText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      system: `You are a friendly and creative AI logo designer. 
        Your goal is to have a natural conversation with the user to understand their needs. 
        Ask clarifying questions one at a time. 
        Keep your responses concise and conversational. 
        Once you have a good understanding of their brand name, industry, style preferences, and color palette, you can summarize it for them and ask for confirmation before telling the frontend to trigger the generation process. 
        To trigger the generation, end your final message with the special command: [GENERATE_LOGO]`,
      messages: sanitizedMessages,
    });

    // Use NextResponse for consistent API handling
    return new NextResponse(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'An error occurred',
      },
      {
        status: 500,
      }
    );
  }
}
