import { BaseAgent } from '../base/base-agent';
import { 
  AgentConfig, 
  AgentInput, 
  AgentOutput, 
  SelectionAgentInput, 
  SelectionAgentOutput 
} from '../../types-agents';

/**
 * SelectionAgent - Evaluates and selects the best concept from the moodboard
 */
export class SelectionAgent extends BaseAgent {
  constructor(config?: Partial<AgentConfig>) {
    super(
      'selection', 
      ['selection'],
      {
        model: 'claude-3-haiku-20240307', // Use faster model for analysis
        temperature: 0.3, // Low temperature for consistent decision-making
        maxTokens: 1000,
        ...config
      }
    );
    
    // Set the system prompt for this agent
    this.systemPrompt = `You are a specialized selection agent for an AI-powered logo generator.
    
Your task is to evaluate multiple logo concepts and select the one that best matches the design specifications.
You should consider alignment with brand identity, target audience, visual appeal, and practicality.

CRITICAL JSON FORMATTING REQUIREMENTS:
1. Your response MUST be valid JSON that can be parsed without errors
2. Do NOT include any text before or after the JSON object
3. Do NOT use markdown code blocks or formatting
4. Ensure all strings are properly quoted with double quotes
5. Escape any special characters in strings (newlines as \\n, quotes as \\", etc.)
6. Do NOT include any control characters or non-printable characters
7. Use only standard ASCII characters in JSON structure

REQUIRED JSON FORMAT:
{
  "selection": {
    "selectedConcept": {
      "name": "concept name here",
      "description": "concept description here",
      "style": "style here",
      "colors": ["color1", "color2"],
      "imagery": "imagery description"
    },
    "selectionRationale": "detailed explanation of why this concept was selected",
    "score": 85
  }
}

Your selection rationale should analyze:
1. How well the concept aligns with the brand's identity and values
2. Appropriateness for the target audience
3. Visual distinctiveness and memorability
4. Practicality for various use cases (digital, print, etc.)
5. Adherence to any specific requirements in the brief

The score should be a number from 0-100 representing how well this concept matches the requirements.

REMEMBER: Return ONLY the JSON object, nothing else. No explanatory text, no markdown, no additional commentary.`;
  }
  
  /**
   * Generate the prompt for the concept selection
   */
  protected async generatePrompt(input: SelectionAgentInput): Promise<string> {
    const { designSpec, concepts } = input;
    
    // Create a detailed prompt that includes both the design spec and the concepts
    let prompt = `Please evaluate these logo concepts and select the best one based on these design specifications:

Brand Name: ${designSpec.brand_name}
Brand Description: ${designSpec.brand_description}
Style Preferences: ${designSpec.style_preferences}
Color Palette: ${designSpec.color_palette}
Imagery Requirements: ${designSpec.imagery}
Target Audience: ${designSpec.target_audience}
Additional Requests: ${designSpec.additional_requests}

Here are the concepts to evaluate:

`;

    // Add each concept
    concepts.forEach((concept, index) => {
      prompt += `CONCEPT ${index + 1}: ${concept.name}
Description: ${concept.description}
Style: ${concept.style}
Colors: ${concept.colors}
Imagery: ${concept.imagery}

`;
    });
    
    prompt += `Please select the BEST concept that most closely matches the design specifications and explain your reasoning.`;
    
    return prompt;
  }
  
  /**
   * Enhanced JSON sanitization with comprehensive control character handling
   * This method handles multiple layers of potential JSON corruption from AI responses
   */
  private sanitizeJsonString(jsonString: string): string {
    try {
      console.log('Original JSON string length:', jsonString.length);
      console.log('Original JSON preview:', jsonString.substring(0, 200) + '...');
      
      // Step 1: Basic cleaning and extraction
      let cleaned = jsonString.trim();
      
      // Remove markdown code blocks and non-JSON prefixes/suffixes
      cleaned = cleaned.replace(/```(?:json)?\s*\n?/gi, '');
      cleaned = cleaned.replace(/```\s*$/g, '');
      cleaned = cleaned.replace(/^[^{]*/, ''); // Remove everything before first {
      cleaned = cleaned.replace(/[^}]*$/, ''); // Remove everything after last }
      
      // Extract the main JSON object - find the outermost balanced braces
      const firstBrace = cleaned.indexOf('{');
      if (firstBrace === -1) {
        throw new Error('No JSON object found in response');
      }
      
      let braceCount = 0;
      let jsonEnd = -1;
      
      for (let i = firstBrace; i < cleaned.length; i++) {
        if (cleaned[i] === '{') braceCount++;
        if (cleaned[i] === '}') braceCount--;
        if (braceCount === 0) {
          jsonEnd = i;
          break;
        }
      }
      
      if (jsonEnd === -1) {
        throw new Error('Unbalanced braces in JSON response');
      }
      
      cleaned = cleaned.substring(firstBrace, jsonEnd + 1);
      
      // Step 2: Aggressive control character and problematic character removal
      // Handle ALL potential control characters that could break JSON parsing
      cleaned = cleaned
        // Remove all control characters (0x00-0x1F and 0x7F-0x9F)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
        // Remove common problematic characters
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        // Remove BOM and other Unicode control characters
        .replace(/[\uFEFF\uFFFE\uFFFF]/g, '')
        // Remove any remaining non-printable characters
        .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '');
      
      // Step 3: Fix common JSON syntax issues
      cleaned = cleaned
        // Remove trailing commas before closing brackets/braces
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix multiple consecutive commas
        .replace(/,{2,}/g, ',')
        // Fix missing commas between object properties (basic case)
        .replace(/}(\s*)"([^"]+)":/g, '},$1"$2":')
        // Fix missing commas between array elements
        .replace(/](\s*)"([^"]+)"/g, '],$1"$2"')
        // Normalize whitespace (but preserve string content)
        .replace(/\s+/g, ' ');
      
      // Step 4: Advanced string content sanitization with proper escaping
      let result = '';
      let inString = false;
      let escaped = false;
      let quoteChar = '';
      
      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        const prevChar = i > 0 ? cleaned[i - 1] : '';
        
        if (escaped) {
          // Handle escaped characters properly
          if (char === 'n') result += '\\n';
          else if (char === 'r') result += '\\r';
          else if (char === 't') result += '\\t';
          else if (char === 'b') result += '\\b';
          else if (char === 'f') result += '\\f';
          else if (char === '"') result += '\\"';
          else if (char === '\\') result += '\\\\';
          else if (char === '/') result += '\\/';
          else result += '\\' + char; // Keep other escapes as-is
          escaped = false;
          continue;
        }
        
        if (char === '\\' && inString) {
          escaped = true;
          continue; // Don't add the backslash yet, handle it in the next iteration
        }
        
        if (char === '"' && !escaped) {
          if (!inString) {
            inString = true;
            quoteChar = char;
            result += char;
          } else if (char === quoteChar) {
            inString = false;
            quoteChar = '';
            result += char;
          } else {
            result += char;
          }
          continue;
        }
        
        if (inString) {
          // Inside a string: escape special characters
          if (char === '\n') result += '\\n';
          else if (char === '\r') result += '\\r';
          else if (char === '\t') result += '\\t';
          else if (char === '\b') result += '\\b';
          else if (char === '\f') result += '\\f';
          else if (char && char.charCodeAt(0) < 32) {
            // Convert any remaining control characters to unicode escapes
            result += '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0');
          } else {
            result += char;
          }
        } else {
          // Outside string: keep as-is
          result += char;
        }
      }
      
      // Step 5: Final validation and cleanup
      result = result.trim();
      
      // Try to parse the result to make sure it's valid JSON
      try {
        JSON.parse(result);
        console.log('Successfully sanitized JSON');
        console.log('Sanitized JSON preview:', result.substring(0, 200) + '...');
        return result;
      } catch (parseError) {
        console.error('Sanitized JSON still invalid:', parseError);
        console.log('Failed JSON content:', result);
        
        // Last resort: try to fix obvious issues
        let lastResort = result
          // Remove any remaining invalid characters
          .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '')
          // Fix common quote issues
          .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)\1?\s*:/g, '"$2":')
          // Ensure proper string quotes
          .replace(/:\s*([^",\[\]{}]+)(?=[,\]}])/g, ': "$1"');
        
        try {
          JSON.parse(lastResort);
          console.log('Last resort parsing successful');
          return lastResort;
        } catch (finalError) {
          console.error('All JSON sanitization attempts failed:', finalError);
          throw new Error(`Unable to sanitize JSON: ${finalError instanceof Error ? finalError.message : 'Unknown error'}`);
        }
      }
      
    } catch (error) {
      console.error('Error in sanitizeJsonString:', error);
      throw new Error(`JSON sanitization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fallback method to extract selection data when JSON parsing fails
   * This method uses multiple strategies to extract data from malformed responses
   */
  private extractSelectionDataFallback(responseContent: string): any | null {
    try {
      console.log('Attempting fallback parsing...');
      console.log('Response content length:', responseContent.length);
      console.log('Response preview:', responseContent.substring(0, 500));
      
      // Clean the response content first
      let cleanContent = responseContent
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Try to extract key information using multiple regex patterns
      const patterns = {
        // More flexible patterns that can handle various formats
        selectedConcept: [
          /(?:selectedConcept|selected_concept|concept)["\s]*:["\s]*\{([^}]+)\}/i,
          /"selectedConcept"\s*:\s*\{([^}]*)\}/i,
          /selectedConcept["\s]*:["\s]*([^,}]+)/i
        ],
        selectionRationale: [
          /(?:selectionRationale|selection_rationale|rationale)["\s]*:["\s]*"([^"]+)"/i,
          /"selectionRationale"\s*:\s*"([^"]*)"/i,
          /rationale["\s]*:["\s]*"([^"]+)"/i,
          /explanation["\s]*:["\s]*"([^"]+)"/i,
          /reasoning["\s]*:["\s]*"([^"]+)"/i
        ],
        score: [
          /(?:score)["\s]*:["\s]*(\d+(?:\.\d+)?)/i,
          /"score"\s*:\s*(\d+(?:\.\d+)?)/i,
          /rating["\s]*:["\s]*(\d+(?:\.\d+)?)/i
        ],
        conceptName: [
          /(?:name)["\s]*:["\s]*"([^"]+)"/i,
          /"name"\s*:\s*"([^"]*)"/i,
          /title["\s]*:["\s]*"([^"]+)"/i
        ],
        conceptDescription: [
          /(?:description)["\s]*:["\s]*"([^"]+)"/i,
          /"description"\s*:\s*"([^"]*)"/i,
          /desc["\s]*:["\s]*"([^"]+)"/i
        ],
        conceptStyle: [
          /(?:style)["\s]*:["\s]*"([^"]+)"/i,
          /"style"\s*:\s*"([^"]*)"/i,
          /design["\s]*:["\s]*"([^"]+)"/i
        ],
        conceptColors: [
          /(?:colors)["\s]*:["\s]*\[([^\]]+)\]/i,
          /"colors"\s*:\s*\[([^\]]*)\]/i,
          /palette["\s]*:["\s]*\[([^\]]+)\]/i,
          /colors["\s]*:["\s]*"([^"]+)"/i
        ],
        conceptImagery: [
          /(?:imagery)["\s]*:["\s]*"([^"]+)"/i,
          /"imagery"\s*:\s*"([^"]*)"/i,
          /image["\s]*:["\s]*"([^"]+)"/i,
          /visual["\s]*:["\s]*"([^"]+)"/i
        ],
      };
      
      const extracted: any = {};
      
      // Try each pattern for each field
      for (const [field, fieldPatterns] of Object.entries(patterns)) {
        for (const pattern of fieldPatterns) {
          const match = cleanContent.match(pattern);
          if (match && match[1]) {
            extracted[field] = match[1].trim();
            console.log(`Extracted ${field}:`, match[1].trim().substring(0, 100));
            break; // Found a match, move to next field
          }
        }
      }
      
      // Process extracted data
      if (extracted.selectionRationale) {
        // Clean up the rationale text
        extracted.selectionRationale = extracted.selectionRationale
          .replace(/\\n/g, ' ')
          .replace(/\\"/g, '"')
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      if (extracted.score) {
        const numScore = parseFloat(extracted.score);
        if (!isNaN(numScore) && numScore >= 0 && numScore <= 100) {
          extracted.score = numScore;
        } else {
          extracted.score = 75; // Default score
        }
      }
      
      // Process concept colors if found
      if (extracted.conceptColors) {
        try {
          if (extracted.conceptColors.includes('[')) {
            // Already in array format
            extracted.conceptColors = extracted.conceptColors
              .replace(/[\[\]]/g, '')
              .split(',')
              .map((c: string) => c.trim().replace(/['"]/g, ''))
              .filter((c: string) => c.length > 0);
          } else {
            // Single color or comma-separated list
            extracted.conceptColors = extracted.conceptColors
              .split(',')
              .map((c: string) => c.trim().replace(/['"]/g, ''))
              .filter((c: string) => c.length > 0);
          }
        } catch (colorError) {
          console.warn('Error processing colors:', colorError);
          extracted.conceptColors = ['#0066CC']; // Default color
        }
      }
      
      // If we have the essential parts, create a valid structure
      if (extracted.conceptName && extracted.conceptDescription && extracted.selectionRationale) {
        const selectedConcept = {
          name: extracted.conceptName,
          description: extracted.conceptDescription,
          style: extracted.conceptStyle || 'modern',
          colors: extracted.conceptColors || ['#0066CC'],
          imagery: extracted.conceptImagery || 'abstract'
        };
        
        const result = {
          selection: {
            selectedConcept,
            selectionRationale: extracted.selectionRationale,
            score: extracted.score || 75
          }
        };
        
        console.log('Fallback parsing successful, extracted data:', JSON.stringify(result, null, 2));
        return result;
      }
      
      // If basic extraction failed, try a more aggressive approach
      console.log('Basic fallback failed, trying aggressive extraction');
      
      // Look for any concept-like structure in the text
      const conceptMatches = cleanContent.match(/concept\s*\d*\s*[:\-]?\s*([^.!?]*)/gi);
      const rationaleMatches = cleanContent.match(/(?:because|since|due to|reason|selected|choose|best)([^.!?]*[.!?])/gi);
      
      if (conceptMatches && conceptMatches.length > 0 && rationaleMatches && rationaleMatches.length > 0) {
        const conceptText = conceptMatches[0].replace(/concept\s*\d*\s*[:\-]?\s*/i, '').trim();
        const rationaleText = rationaleMatches[0].trim();
        
        const fallbackResult = {
          selection: {
            selectedConcept: {
              name: conceptText.split(/[,;]/)[0]?.trim() || 'Selected Concept',
              description: conceptText,
              style: 'modern',
              colors: ['#0066CC'],
              imagery: 'abstract'
            },
            selectionRationale: rationaleText,
            score: 75
          }
        };
        
        console.log('Aggressive fallback parsing successful:', JSON.stringify(fallbackResult, null, 2));
        return fallbackResult;
      }
      
      console.log('All fallback parsing attempts failed');
      return null;
    } catch (error) {
      console.error('Error in fallback parsing:', error);
      return null;
    }
  }

  /**
   * Process the response from Claude with comprehensive error recovery
   */
  protected async processResponse(responseContent: string, originalInput: AgentInput): Promise<SelectionAgentOutput> {
    try {
      console.log('Processing selection agent response...');
      console.log('Raw response length:', responseContent.length);
      console.log('Raw response preview:', responseContent.substring(0, 300) + '...');
      
      // Check for empty or malformed responses
      if (!responseContent || typeof responseContent !== 'string' || responseContent.trim().length === 0) {
        throw new Error('Empty or invalid response from Claude API');
      }
      
      // Sanitize the JSON string with our comprehensive method
      const sanitizedJson = this.sanitizeJsonString(responseContent);
      console.log('Sanitized JSON length:', sanitizedJson.length);
      console.log('Sanitized JSON preview:', sanitizedJson.substring(0, 300) + '...');
      
      let selectionData: any;
      
      // Primary parsing attempt
      try {
        selectionData = JSON.parse(sanitizedJson);
        console.log('Primary JSON parsing successful');
      } catch (parseError) {
        console.error('Primary JSON parse error:', parseError);
        console.error('Failed JSON content:', sanitizedJson);
        
        // Secondary parsing attempt: try fallback extraction
        console.log('Attempting fallback data extraction...');
        const fallbackData = this.extractSelectionDataFallback(responseContent);
        
        if (fallbackData) {
          console.log('Fallback extraction successful');
          selectionData = fallbackData;
        } else {
          // Tertiary attempt: try to construct minimal valid response
          console.log('Attempting to construct minimal valid response...');
          const input = originalInput as SelectionAgentInput;
          
          if (input.concepts && input.concepts.length > 0) {
            // Use the first concept as a fallback
            const fallbackConcept = input.concepts[0];
            selectionData = {
              selection: {
                selectedConcept: fallbackConcept,
                selectionRationale: 'Selected the first available concept due to parsing issues in the AI response.',
                score: 50 // Low score to indicate this was a fallback
              }
            };
            console.log('Constructed minimal fallback response');
          } else {
            throw new Error(`Failed to parse JSON response and no fallback data available: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
          }
        }
      }
      
      // Validate the selection object structure
      if (!selectionData || typeof selectionData !== 'object') {
        throw new Error('Invalid response structure: expected an object');
      }
      
      if (!selectionData.selection) {
        throw new Error('Invalid response structure: missing selection field');
      }
      
      const selection = selectionData.selection;
      
      if (!selection.selectedConcept || !selection.selectionRationale) {
        throw new Error('Invalid selection format: missing selectedConcept or selectionRationale');
      }
      
      // Validate and sanitize the score
      let score = selection.score;
      if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 100) {
        console.warn(`Invalid score value: ${score}, using default of 75`);
        score = 75;
      }
      
      // Validate selected concept has all required fields
      const concept = selection.selectedConcept;
      const requiredFields = ['name', 'description', 'style', 'colors', 'imagery'];
      
      // Auto-fill missing fields with defaults
      const sanitizedConcept = {
        name: concept.name || 'Untitled Concept',
        description: concept.description || 'No description available',
        style: concept.style || 'modern',
        colors: Array.isArray(concept.colors) && concept.colors.length > 0 ? concept.colors : ['#0066CC'],
        imagery: concept.imagery || 'abstract'
      };
      
      // Sanitize rationale text
      let rationale = selection.selectionRationale;
      if (typeof rationale !== 'string' || rationale.trim().length === 0) {
        rationale = 'This concept was selected based on the provided criteria.';
      }
      
      // Clean up the rationale
      rationale = rationale
        .replace(/\\n/g, ' ')
        .replace(/\\"/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
      
      // If we have an override in the context, use that concept
      const input = originalInput as SelectionAgentInput;
      if (this.context?.overrides?.manualConceptSelection !== undefined) {
        const index = this.context.overrides.manualConceptSelection as number;
        if (index >= 0 && index < input.concepts.length) {
          const manualConcept = input.concepts[index];
          return {
            result: {
              selection: {
                selectedConcept: manualConcept!,
                selectionRationale: 'User manually selected a concept',
                score: 100, // Manual selection gets a perfect score
              }
            },
          };
        }
      }
      
      // Return the processed and validated result
      const finalResult = {
        result: {
          selection: {
            selectedConcept: sanitizedConcept,
            selectionRationale: rationale,
            score: score
          }
        }
      };
      
      console.log('Selection agent processing completed successfully:', JSON.stringify(finalResult.result.selection, null, 2));
      return finalResult;
      
    } catch (error) {
      console.error('Failed to process selection agent response:', error);
      
      // Final fallback: if we have concepts available, select the first one
      const input = originalInput as SelectionAgentInput;
      if (input.concepts && input.concepts.length > 0) {
        console.log('Using emergency fallback: selecting first available concept');
        const emergencyConcept = input.concepts[0];
        
        if (emergencyConcept) {
          return {
            result: {
              selection: {
                selectedConcept: emergencyConcept,
                selectionRationale: `Emergency fallback selection due to processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                score: 25 // Very low score to indicate this was an emergency fallback
              }
            }
          };
        }
      }
      
      // If no concepts available, throw the error
      throw error;
    }
  }
}