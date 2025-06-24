/**
 * Helper utilities for testing agent functionality
 */

/**
 * Creates a mock Anthropic API response
 * @param content The text content to include in the response
 * @returns A mock Anthropic response object
 */
export function mockAnthropicResponse(content: string) {
  return {
    id: 'mock-response-id',
    type: 'message',
    role: 'assistant',
    model: 'claude-3-5-haiku-20240307',
    content: [
      {
        type: 'text',
        text: content
      }
    ],
    usage: {
      input_tokens: 100,
      output_tokens: 200
    }
  };
}

/**
 * Creates a basic agent input object with required fields
 * @param id Unique identifier for the agent input
 * @param additionalFields Additional properties to include in the input
 * @returns An agent input object
 */
export function createAgentInput(id: string, additionalFields: Record<string, any> = {}) {
  return {
    id,
    ...additionalFields
  };
}

/**
 * Creates a mock design specification with default values
 * @param overrides Fields to override in the default design specification
 * @returns A mock design specification object
 */
export function createMockDesignSpec(overrides: Partial<Record<string, string>> = {}) {
  return {
    brand_name: "TestBrand",
    brand_description: "A test company description",
    style_preferences: "Modern, professional",
    color_palette: "Blue and gray",
    imagery: "Abstract shapes or icons",
    target_audience: "General consumers",
    additional_requests: "None specified",
    industry: "Technology",
    ...overrides
  };
}

/**
 * Creates a mock agent execution context for testing
 * @param sessionId Unique identifier for the agent session
 * @param overrides Fields to override in the default context
 * @returns A mock agent context object
 */
export function createMockAgentContext(sessionId: string, overrides: Record<string, any> = {}) {
  return {
    sessionId,
    brief: {
      prompt: "Create a logo for TestBrand, a technology company",
    },
    sharedMemory: new Map(),
    debugMode: true,
    ...overrides
  };
}