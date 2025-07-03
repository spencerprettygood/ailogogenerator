/**
 * Safely parses a JSON string with robust error handling and fallback mechanisms.
 * It attempts to clean the string, find a JSON object within it, and parse it.
 *
 * @param jsonString The raw string that should contain JSON.
 * @returns The parsed JavaScript object, or null if parsing fails completely.
 */
export function safeJsonParse(jsonString: string): any | null {
  if (typeof jsonString !== 'string') {
    return null;
  }

  // 1. Trim whitespace
  let cleanedString = jsonString.trim();

  // 2. Remove common non-JSON prefixes (like "```json" and "```")
  cleanedString = cleanedString.replace(/^```json\s*/, '').replace(/```$/, '');

  // 3. Find the first '{' and the last '}' to extract a potential JSON object
  const firstBrace = cleanedString.indexOf('{');
  const lastBrace = cleanedString.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    // If no valid JSON structure is found, return null
    return null;
  }

  let potentialJson = cleanedString.substring(firstBrace, lastBrace + 1);

  // 4. More aggressive sanitization
  // Remove ALL control characters (0x00-0x1F and 0x7F-0x9F)
  potentialJson = potentialJson.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  
  // Fix common JSON syntax issues
  // Remove trailing commas before closing braces/brackets
  potentialJson = potentialJson.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing commas between object properties (this is the main issue)
  // Handle the specific case where we have a closing quote followed by a property name
  potentialJson = potentialJson.replace(/"\s*\n\s*"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '",\n  "$1":');
  
  // Fix the specific case in the selection response where there's no comma before "score"
  potentialJson = potentialJson.replace(/"\s*\n\s*"score":/g, '",\n  "score":');
  
  // Escape internal quotes in long text values
  // This is a more targeted approach for the selectionRationale field
  potentialJson = potentialJson.replace(
    /("selectionRationale"\s*:\s*")([^"]*(?:\\.[^"]*)*?)("\s*\n)/g,
    (match, start, content, end) => {
      // Escape any unescaped quotes in the content
      const escapedContent = content.replace(/(?<!\\)"/g, '\\"');
      return start + escapedContent + end;
    }
  );

  // 5. Attempt to parse the sanitized JSON
  try {
    return JSON.parse(potentialJson);
  } catch (error) {
    console.error('Initial JSON.parse failed:', error);
    
    // 6. Fallback: Try to extract key-value pairs manually
    try {
      return extractJsonDataFallback(potentialJson);
    } catch (fallbackError) {
      console.error('Fallback JSON extraction failed:', fallbackError);
      console.error('Could not parse JSON string even after sanitization:', potentialJson);
      return null;
    }
  }
}

/**
 * Fallback method to extract JSON data using regex patterns
 */
function extractJsonDataFallback(jsonString: string): any | null {
  try {
    // Try to fix the specific missing comma issue in the selection response
    if (jsonString.includes('"selectionRationale"') && jsonString.includes('"score"')) {
      // Add missing comma between selectionRationale and score
      let fixedJson = jsonString.replace(/"\s*\n\s*"score"/, '",\n  "score"');
      
      // Also try to fix any multiline strings by replacing newlines within string values
      fixedJson = fixedJson.replace(
        /("selectionRationale"\s*:\s*")([^"]*(?:\n[^"]*)*?)("\s*,?\s*\n)/g,
        (match, start, content, end) => {
          // Replace newlines with spaces and escape quotes
          const cleanContent = content
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/(?<!\\)"/g, '\\"')
            .trim();
          return start + cleanContent + end;
        }
      );
      
      try {
        return JSON.parse(fixedJson);
      } catch (e) {
        console.warn('Failed to parse fixed JSON, trying original approach');
      }
    }
    
    // Extract common patterns manually
    const patterns = {
      selectedConcept: /"selectedConcept"\s*:\s*({[^}]+})/,
      selectionRationale: /"selectionRationale"\s*:\s*"([^"]+)"/,
      score: /"score"\s*:\s*(\d+)/
    };
    
    const extracted: any = {};
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = jsonString.match(pattern);
      if (match && match[1]) {
        if (key === 'selectedConcept') {
          try {
            extracted[key] = JSON.parse(match[1]);
          } catch {
            extracted[key] = null;
          }
        } else if (key === 'score') {
          extracted[key] = parseInt(match[1], 10);
        } else {
          extracted[key] = match[1];
        }
      }
    }
    
    return Object.keys(extracted).length > 0 ? extracted : null;
  } catch (error) {
    console.error('Fallback extraction failed:', error);
    return null;
  }
}
