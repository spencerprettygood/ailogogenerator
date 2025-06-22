# AI SDK v5 Integration Documentation

This document outlines the integration of Anthropic's AI SDK v5 Alpha into the AI Logo Generator application.

## Overview

The AI Logo Generator has been updated to use the latest AI SDK v5 Alpha, which brings several improvements:

- Streamlined message handling
- Better type safety
- Improved error handling
- Support for tools and multi-modal content
- Enhanced streaming capabilities

## Key Components

### 1. Dependencies

The application uses the following AI SDK v5 packages:

```json
{
  "@ai-sdk/anthropic": "^2.0.0-alpha.15",
  "@ai-sdk/react": "^2.0.0-alpha.15",
  "ai": "^5.0.0-alpha.15"
}
```

### 2. OpenTelemetry Handling

AI SDK v5 includes OpenTelemetry for tracing, which can cause issues in browser environments. We've implemented a custom blocking solution:

- Created `lib/opentelemetry-blocker.js` with no-op implementations of all OpenTelemetry APIs
- Updated webpack config to redirect all OpenTelemetry imports to our blocker

### 3. Chat Interface

The chat interface has been refactored to use the standard `useChat` hook from `ai/react`:

```tsx
const { 
  messages, 
  input, 
  handleInputChange, 
  handleSubmit,
  isLoading,
  error 
} = useChat({
  api: '/api/chat',
  // Additional options...
});
```

### 4. Server-Side API Route

The API route for chat now uses the streaming text API:

```typescript
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Sanitize user inputs
    const sanitizedMessages = messages.map(sanitizeMessage);
    
    const result = await streamText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      system: `You are a friendly and creative AI logo designer...`,
      messages: sanitizedMessages,
    });
    
    return result.toAIStreamResponse();
  } catch (error) {
    // Error handling
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### 5. Types

We've updated our types to match the AI SDK v5 message format:

```typescript
export interface Message {
  id: string;
  role: string;
  content: string | MessageContent[];
  timestamp: Date;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface MessageContent {
  type: 'text' | 'image' | 'file' | 'tool_call' | 'tool_result';
  text?: string;
  image_url?: string;
  file_url?: string;
  tool_call?: ToolCall;
  tool_result?: ToolResult;
}

// Additional types...
```

### 6. Logo Display Component

The Logo Display component has been updated to handle AI SDK v5 response formats:

```typescript
// Extract SVG content from AI SDK v5 response format
if (svgContent.includes('<svg') && svgContent.includes('</svg>')) {
  const svgMatch = svgContent.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    return svgMatch[0];
  }
}
```

## Configuration

### Environment Variables

The following environment variables are required:

```
# Anthropic API Key
ANTHROPIC_API_KEY=your_key_here

# Environment Settings
NODE_ENV=development

# Feature Flags
ENABLE_IMAGE_UPLOAD=true
ENABLE_BRAND_GUIDELINES=true
ENABLE_CACHE=true
ENABLE_TELEMETRY=false
```

### PostCSS Configuration

The PostCSS configuration has been updated to work with Tailwind CSS v4:

```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    'postcss-preset-env': {
      features: { 'nesting-rules': false }
    }
  },
};
```

## Implementation Notes

1. **Browser Compatibility**: The OpenTelemetry blocker ensures the app works in all modern browsers.

2. **SVG Sanitization**: The SVG sanitizer has been updated to avoid browser-specific APIs like DOMParser, making it compatible with server-side rendering.

3. **Error Handling**: Improved error handling for API responses with proper error messages and status codes.

4. **Type Safety**: Enhanced type definitions ensure proper TypeScript validation throughout the application.

## Best Practices

1. **Message Handling**: Always sanitize user inputs before sending them to the AI model.

2. **Security**: Validate SVG content before rendering to prevent XSS attacks.

3. **Performance**: Use the streaming API to provide real-time updates to users.

4. **Error Recovery**: Implement proper error handling and recovery mechanisms.

## Troubleshooting

Common issues and solutions:

1. **OpenTelemetry Errors**: If you see OpenTelemetry-related errors, ensure the webpack configuration is correctly redirecting imports.

2. **Missing AI SDK Methods**: Check your version numbers - the API has changed significantly in v5.

3. **Type Errors**: If you encounter type errors, ensure you're using the updated message types.

4. **Build Failures**: Verify that the PostCSS configuration is correctly set up for Tailwind CSS v4.

5. **API Key Issues**: Make sure your ANTHROPIC_API_KEY is properly set in .env.local.

## Conclusion

The AI SDK v5 integration provides a more robust, type-safe, and feature-rich foundation for the AI Logo Generator. The streamlined API and improved error handling make the application more reliable and maintainable.