# Streaming JSON Parsing Error Resolution

## Issue Description

The AI Logo Generator was experiencing a critical issue with its stream processing implementation. The error occurred during the logo generation process when the server was sending multiple JSON objects concatenated together without proper delimiters:

```text
streaming.ts:106 Failed to parse streaming data: {"type":"start","sessionId":"RKU95zedGmdYU_UFZVnTN"}{"type":"progress",...
```

The error message indicated a syntax error at position 52 (position after `"RKU95zedGmdYU_UFZVnTN"}`), which is exactly where the first JSON object ends and the second one begins. The full error was:

```text
SyntaxError: Unexpected non-whitespace character after JSON at position 52 (line 1 column 53)
    at JSON.parse (<anonymous>)
    at StreamProcessor.processLine (streaming.ts:56:25)
    at eval (streaming.ts:28:18)
```

This error occurred consistently during the logo generation pipeline as the orchestrator streams updates about different stages of the process.

### Root Cause Analysis

The root cause of this issue was:

1. **Multiple Concatenated JSON Objects**: The server was sending multiple JSON objects back-to-back without proper delimiters (like newlines) between them. For example:

   ```json
   {"type":"start","sessionId":"RKU95zedGmdYU_UFZVnTN"}{"type":"progress","progress":{...}}
   ```

2. **JSON Parse Limitation**: JavaScript's `JSON.parse()` method is designed to parse a single, complete JSON object and fails when encountering multiple concatenated objects. It expects the string to end after a single valid JSON object.

3. **Naive Stream Processing**: The original implementation assumed each line contained exactly one well-formed JSON object, but the server was actually sending multiple concatenated objects in a single chunk.

4. **Missing Line Breaks**: The server side generation process was streaming objects without adding newline characters between them, making standard line-by-line processing ineffective.

This issue caused the stream processing to fail when handling responses from the multi-agent orchestrator, which streams multiple JSON objects as the logo generation progresses through different stages.

## Technical Details of the Problem

The specific problem occurred in the `processLine` method of `StreamProcessor` class in `streaming.ts`. The original implementation attempted to parse the entire line as a single JSON object:

```typescript
private processLine(line: string, callbacks: StreamingCallbacks): void {
  try {
    const data = JSON.parse(line);
    // Process data...
  } catch (error) {
    console.warn('Failed to parse streaming data:', line);
    // Error handling...
  }
}
```

When given concatenated JSON objects like:

```json
{"type":"start","sessionId":"RKU95zedGmdYU_UFZVnTN"}{"type":"progress","progress":{...}}
```

The `JSON.parse()` method failed because it encountered additional characters after the first valid JSON object.

## Solution Implementation

We implemented a comprehensive fix to robustly handle concatenated JSON objects in the stream using a depth-tracking algorithm:

1. **Multi-level Parsing Strategy**:
   - First attempt: Try parsing the entire line as a single JSON object (for backward compatibility)
   - Second attempt: If the first attempt fails, extract and parse individual JSON objects from the concatenated string

2. **Depth-tracking JSON Extraction**:
   - Scan the input string character by character
   - Track the nesting depth of curly braces to find complete JSON objects
   - Handle nested objects properly by counting opening/closing braces
   - Extract each complete JSON object when its closing brace is found (depth returns to 0)

3. **Modular Processing**:
   - Refactored the logic to separate JSON parsing from data processing
   - Created a dedicated `processJsonData` method to handle each extracted JSON object
   - Made the parser robust to different data formats and structures

4. **Enhanced Error Handling**:
   - Improved error reporting with specific messages for different failure scenarios
   - Added informative logging about the number of objects successfully processed
   - Implemented graceful degradation to prevent cascading failures
   - Added detailed debug logging for parsing failures

5. **Stream Resilience Improvements**:
   - Added timeout detection for stalled streams (60-second timeout)
   - Improved error handling for unexpected stream termination
   - Enhanced validation of parsed JSON data
   - Added proper cleanup of resources in error scenarios

## Implementation Details

### 1. Depth-Tracking JSON Parser

The core of the solution is a depth-tracking algorithm that scans the input string and identifies complete JSON objects by tracking the nesting level of curly braces:

```typescript
// Find the matching closing brace using a JSON object depth counter
let depth = 0;
let closingBracePos = -1;

for (let i = 0; i < remainingText.length; i++) {
  const char = remainingText[i];
  if (char === '{') depth++;
  else if (char === '}') {
    depth--;
    if (depth === 0) {
      closingBracePos = i;
      break;
    }
  }
}
```

This algorithm ensures that we correctly extract each complete JSON object, even if it contains nested objects. It works by:

1. Starting with a depth of 0
2. Incrementing the depth when an opening brace is found
3. Decrementing the depth when a closing brace is found
4. When the depth returns to 0, we've found a complete JSON object

### 2. Robust Error Handling

The solution includes comprehensive error handling at multiple levels:

- **Individual JSON parsing errors**: Each extracted JSON object is parsed in its own try/catch block
- **Stream processing errors**: The main processing loop has error handling for network and I/O errors
- **Data validation**: All parsed data is validated before processing
- **Callback protection**: Each callback invocation is wrapped in a try/catch to prevent cascade failures

### 3. Backward Compatibility

The solution maintains backward compatibility with existing API formats by:

- First attempting to parse the entire line as a single JSON object
- Supporting multiple field names for the same data (e.g., `currentStage` and `currentStageId`)
- Maintaining the same callback interface
- Preserving the original method signatures

## Code Changes

The main changes were made to the `StreamProcessor` class in `streaming.ts`:

1. **Process Line Method**:
   - Replaced the simple `JSON.parse()` call with a sophisticated JSON extraction algorithm
   - Added a depth-tracking mechanism to properly identify JSON object boundaries
   - Added support for processing multiple JSON objects in a single line
   - Enhanced logging with counts of successfully processed objects

2. **Process JSON Data Method**:
   - Added input validation to handle malformed data
   - Enhanced error handling with try/catch blocks around callback invocations
   - Added null/undefined checks for all data properties
   - Improved backward compatibility support for legacy field names

3. **Process Stream Method**:
   - Added timeout detection for stalled streams (60-second timeout)
   - Improved error handling for stream read operations
   - Enhanced cleanup in finally block with error handling
   - Added more robust error reporting

## Testing Results

After implementing these changes:

1. **Successful Processing**: The stream processor now correctly handles concatenated JSON objects from the multi-agent orchestrator
2. **Improved Error Reporting**: The system provides more informative error messages when issues occur
3. **Resilience to Bad Data**: The system gracefully handles malformed JSON without crashing
4. **Timeout Detection**: Long pauses in stream data are now detected and reported
5. **Backward Compatibility**: The solution maintains compatibility with existing API formats
6. **Performance**: The parsing algorithm has minimal overhead even with large concatenated streams

The test page at `/app/test-streaming/page.tsx` demonstrates the fix by simulating a concatenated JSON stream that matches the real-world issue.

## Future Improvements

For further enhancement of the streaming implementation:

1. **Standardize Server Response**: Update the server to consistently include newline separators between JSON objects

   ```typescript
   controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
   ```

2. **Add Response Validation**: Implement JSON schema validation for each message type

   ```typescript
   // Example with a validation library like Zod or Ajv
   const isValid = validateSchema('progressUpdate', data);
   if (!isValid) {
    console.warn('Invalid schema for progress update', data);
    return;
   }
   ```

3. **Enhanced Monitoring**: Add telemetry to track parsing success rates and failure types

   ```typescript
   telemetry.trackEvent('streamParsingSuccess', {
     objectCount: processedCount,
     totalLength: line.length,
     processingTime: Date.now() - startTime
   });
   ```

4. **Stream Reconnection**: Implement automatic reconnection with exponential backoff for network interruptions

   ```typescript
   // Add reconnection logic with backoff
   const maxRetries = 3;
   let retry = 0;
   let backoffTime = 1000;
   
   while (retry < maxRetries) {
     try {
       // Attempt connection
       break;
     } catch (e) {
       retry++;
       await new Promise(resolve => setTimeout(resolve, backoffTime));
       backoffTime *= 2; // Exponential backoff
     }
   }
   ```

5. **WebSocket Alternative**: Consider replacing the current streaming approach with a WebSocket implementation for more reliable bidirectional communication

   ```typescript
   // WebSocket example
   const socket = new WebSocket(url);
   socket.onmessage = (event) => {
     const data = JSON.parse(event.data);
     processJsonData(data, callbacks);
   };
   ```

## Conclusion

This fix addresses one of the critical issues preventing the AI Logo Generator from reaching production readiness. By implementing a robust JSON stream parser, we've eliminated a major source of errors in the logo generation pipeline, bringing the application closer to a stable production release.

The implementation follows best practices for stream processing and error handling, making the system more resilient to variations in data format and network conditions. This improvement will significantly reduce generation failures and improve the overall user experience.

## Related Files

- `/lib/streaming.ts` - Main file containing the stream processing logic
- `/app/api/generate-logo/route.ts` - API endpoint that generates the streaming response
- `/lib/types.ts` - Contains the type definitions for the streaming data
- `/app/test-streaming/page.tsx` - Test page to verify the streaming fix
