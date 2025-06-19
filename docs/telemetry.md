# Telemetry System Documentation

## Overview

This project uses a custom, lightweight telemetry system instead of OpenTelemetry. The implementation is located in `lib/telemetry/` and provides all necessary telemetry functionality without the complexities and dependencies of OpenTelemetry.

## Why Not OpenTelemetry?

OpenTelemetry was causing build failures and runtime errors due to:

1. Dependency on Node.js-specific modules like `async_hooks` that don't exist in browser environments
2. Complex dependency chains and initialization requirements
3. Integration issues with Next.js 15, particularly in Edge Runtime

## Our Solution

We've implemented a custom telemetry system that:

1. Works in both Node.js and browser environments
2. Has zero external dependencies
3. Provides all essential telemetry features (events, spans, metrics)
4. Integrates seamlessly with Next.js middleware and API routes
5. Has minimal performance impact

## Features

- **Event Recording**: Track user actions and system events
- **Performance Metrics**: Measure and monitor performance
- **Error Tracking**: Record and analyze errors
- **Timing Functions**: Measure duration of operations
- **React Hooks**: Easy integration with React components

## Usage

### Basic Event Recording

```typescript
import { telemetry } from '@/lib/telemetry';

// Record a simple event
telemetry.recordEvent('user_clicked_button', { buttonId: 'generate-logo' });

// Record with timing
const endTimer = telemetry.startTimer('logo_generation');
// ... perform operation ...
endTimer(); // Automatically records the duration
```

### React Hooks

```typescript
import { useTelemetry, usePageTracking } from '@/lib/telemetry';

function MyComponent() {
  // Track page view
  usePageTracking('logo_generator_page');
  
  // Get telemetry functions
  const { trackEvent, trackError, startTimer } = useTelemetry();
  
  const handleClick = () => {
    trackEvent('button_clicked', { action: 'generate' });
    
    // Track operation time
    const end = startTimer('generate_operation');
    // ... perform operation ...
    end(); // Ends timing and records result
  };
  
  // ...
}
```

### API Route Integration

```typescript
import { withPerformanceMonitoring } from '@/lib/middleware/performance-middleware';

async function handler(req: NextRequest) {
  // Your API logic here
  return NextResponse.json({ success: true });
}

// Automatically tracks API performance
export const GET = withPerformanceMonitoring(handler);
```

## Implementation Details

The telemetry system is implemented as a singleton instance with the following components:

1. `simple-telemetry.ts`: Core implementation with event and metric recording
2. `hooks.tsx`: React hooks for easy integration with components
3. `index.ts`: Exports and public API

## Replacing the `ai` Package Functions

We've replaced functions from the `ai` package to eliminate OpenTelemetry dependencies:

1. `generateId()`: Simple utility for generating unique IDs
2. `streamText()`: Streaming interface for AI responses

These replacements are in `lib/ai-utils.ts` and provide drop-in compatibility with the original functions.

## WebPack Configuration

Our webpack configuration in `lib/webpack-config.js` completely disables all OpenTelemetry modules to prevent any issues with imports or dependencies. This ensures that no OpenTelemetry code can ever run in either the server or client environments.

## Future Enhancements

1. **Storage Options**: Add persistent storage for telemetry data
2. **Visualization**: Implement a simple dashboard for telemetry data
3. **Sampling**: Add intelligent sampling for high-volume events
4. **Custom Dimensions**: Support for more complex data attributes