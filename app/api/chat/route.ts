import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20240620'),
    messages,
    system: `You are a friendly and creative AI logo designer. 
    Your goal is to have a natural conversation with the user to understand their needs. 
    Ask clarifying questions one at a time. 
    Keep your responses concise and conversational. 
    Once you have a good understanding of their brand name, industry, style preferences, and color palette, you can summarize it for them and ask for confirmation before telling the frontend to trigger the generation process. 
    To trigger the generation, end your final message with the special command: [GENERATE_LOGO]`,
  });

  return result.toDataStreamResponse();
}
