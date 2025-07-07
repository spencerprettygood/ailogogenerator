import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequirementsAgent } from '../requirements-agent';
import { RequirementsAgentInput } from '../../../types-agents';
import { mockAnthropicResponse } from './test-utils';

// Mock the anthropic client
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      constructor() {}
      messages = {
        create: vi.fn().mockImplementation(async ({ messages }) => {
          // Simulate response based on input message content
          const userMessage = messages[0].content;

          let responseContent = '';

          if (typeof userMessage === 'string') {
            if (userMessage.includes('ByteWave')) {
              responseContent = JSON.stringify({
                brand_name: 'ByteWave',
                brand_description:
                  'A platform that helps companies manage cloud infrastructure efficiently',
                style_preferences: 'Clean, modern, professional, minimalist',
                color_palette: 'Blues with accents of white and possibly light gray',
                imagery: 'Abstract wave patterns, cloud symbols, data visualization elements',
                target_audience: 'IT professionals and CIOs at mid to large enterprises',
                additional_requests: 'Design should convey efficiency and reliability',
                industry: 'Technology',
              });
            } else if (userMessage.includes('Flour & Joy')) {
              responseContent = JSON.stringify({
                brand_name: 'Flour & Joy',
                brand_description:
                  'Neighborhood bakery specializing in artisanal sourdough and organic pastries',
                style_preferences: 'Warm, inviting, artisanal, handcrafted feel',
                color_palette: 'Warm earthy tones like terracotta, cream, soft browns',
                imagery: 'Wheat stalks, bread, rolling pin, or other baking elements',
                target_audience:
                  'Health-conscious families and young professionals in urban neighborhoods',
                additional_requests: 'Emphasize organic and artisanal nature of products',
                industry: 'Food & Beverage',
              });
            } else if (userMessage.includes('FlexFit')) {
              responseContent = JSON.stringify({
                brand_name: 'FlexFit',
                brand_description:
                  'Fitness program offering efficient 30-minute HIIT workouts for busy professionals',
                style_preferences: 'Energetic, bold, modern, dynamic',
                color_palette:
                  'Gradient colors from orange to red; high energy colors with strong contrast',
                imagery: 'Abstract representation of movement, dynamic angles',
                target_audience:
                  'Busy professionals seeking efficient, effective fitness solutions',
                additional_requests: 'Convey energy and efficiency',
                industry: 'Fitness & Health',
              });
            } else {
              responseContent = JSON.stringify({
                brand_name: 'GenericBrand',
                brand_description: 'Generic business description',
                style_preferences: 'Modern, professional',
                color_palette: 'Blue and gray',
                imagery: 'Abstract shapes or icons',
                target_audience: 'General consumers',
                additional_requests: 'None specified',
                industry: 'Retail',
              });
            }
          }

          return mockAnthropicResponse(responseContent);
        }),
      };
    },
  };
});

describe('RequirementsAgent Integration Tests', () => {
  let agent: RequirementsAgent;

  beforeEach(() => {
    agent = new RequirementsAgent({
      temperature: 0.1,
      maxTokens: 1000,
    });

    process.env.ANTHROPIC_API_KEY = 'test-key'; // Mock the API key
  });

  it('should successfully process tech startup brief', async () => {
    const input: RequirementsAgentInput = {
      id: 'test-1',
      brief:
        "I need a logo for my new tech startup called ByteWave. We're building a platform that helps companies manage their cloud infrastructure more efficiently.",
    };

    const result = await agent.execute(input);

    expect(result.success).toBe(true);
    expect(result.result?.designSpec.brand_name).toBe('ByteWave');
    expect(result.result?.designSpec.industry).toBe('Technology');
    expect(result.result?.designSpec.target_audience).toBe(
      'IT professionals and CIOs at mid to large enterprises'
    );
    expect(result.result?.designSpec.style_preferences).toBe(
      'Clean, modern, professional, minimalist'
    );
  });

  it('should successfully process bakery brief', async () => {
    const input: RequirementsAgentInput = {
      id: 'test-2',
      brief:
        "We're opening a neighborhood bakery called 'Flour & Joy' that specializes in artisanal sourdough and pastries made with organic ingredients.",
    };

    const result = await agent.execute(input);

    expect(result.success).toBe(true);
    expect(result.result?.designSpec.brand_name).toBe('Flour & Joy');
    expect(result.result?.designSpec.industry).toBe('Food & Beverage');
    expect(result.result?.designSpec.color_palette).toContain('earthy tones');
  });

  it('should handle image descriptions in the input', async () => {
    const input: RequirementsAgentInput = {
      id: 'test-3',
      brief:
        "I'm launching 'FlexFit' - a fitness program for busy professionals who want efficient workouts.",
      imageDescriptions: [
        'A modern fitness logo with dynamic angles, bold typography, and gradient colors from orange to red.',
      ],
    };

    const result = await agent.execute(input);

    expect(result.success).toBe(true);
    expect(result.result?.designSpec.brand_name).toBe('FlexFit');
    expect(result.result?.designSpec.industry).toBe('Fitness & Health');
    expect(result.result?.designSpec.color_palette).toContain('Gradient colors from orange to red');
  });
});

// Create test-utils.ts file for reusable mock functions
vi.mock('./test-utils', () => {
  return {
    mockAnthropicResponse: (content: string) => {
      return {
        id: 'mock-response-id',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-haiku-20240307',
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
        usage: {
          input_tokens: 100,
          output_tokens: 200,
        },
      };
    },
  };
});
