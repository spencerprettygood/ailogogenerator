import Anthropic from '@anthropic-ai/sdk';
import { DesignSpec } from './stage-a-distillation';
import { MoodboardConcept } from './stage-b-moodboard';

// Types for Stage C
export interface ConceptSelection {
  selectedConcept: MoodboardConcept;
  selectionRationale: string;
  score: number;
}

export interface StageCInput {
  designSpec: DesignSpec;
  concepts: MoodboardConcept[];
}

export interface StageCOutput {
  success: boolean;
  selection?: ConceptSelection;
  error?: {
    type: 'validation_error' | 'ai_error' | 'system_error';
    message: string;
    details?: unknown;
  };
  tokensUsed?: number;
  processingTime?: number;
}

// Configuration
const STAGE_C_CONFIG = {
  model: 'claude-3-5-haiku-20240620' as const, // Haiku for fast analysis
  temperature: 0.2, // Lower for more deterministic selection
  max_tokens: 400, // Enough for selection and rationale
  timeout: 15_000, // 15 seconds
  max_retries: 3,
  retry_delay: 1000, // 1 second
};

// System prompt for concept selection
const STAGE_C_SYSTEM_PROMPT = `
You are a logo design expert evaluating concept options based on brand requirements. Analyze the provided concepts and select the best match.

OUTPUT FORMAT (JSON only):
{
  "selected_concept_index": number (0, 1, or 2),
  "selection_rationale": "string (100-200 word explanation)",
  "score": number (0-100)
}

EVALUATION CRITERIA:
1. Brand Alignment: How well does the concept reflect the brand identity?
2. Target Audience Appeal: Will it resonate with the intended audience?
3. Distinctiveness: How unique and memorable is the concept?
4. Versatility: Will it work across different media and sizes?
5. Technical Feasibility: Can it be effectively produced as an SVG?

SCORING SYSTEM:
- Brand Alignment: 0-30 points
- Target Audience Appeal: 0-25 points
- Distinctiveness: 0-20 points
- Versatility: 0-15 points
- Technical Feasibility: 0-10 points

SELECTION PROCESS:
1. Evaluate each concept against all criteria
2. Select the concept with the highest total score
3. Provide a clear rationale for your selection
4. If scores are very close (within 5 points), select based on brand alignment

Return ONLY the JSON object with no additional commentary.
`;

// Input validation class
class StageCValidator {
  static validateInput(input: StageCInput): void {
    if (!input.designSpec) {
      throw new Error('Design specification is required');
    }

    if (!input.concepts || !Array.isArray(input.concepts) || input.concepts.length === 0) {
      throw new Error('Concepts array is required and must not be empty');
    }

    // Verify designSpec has required fields
    const requiredDesignFields: Array<keyof DesignSpec> = [
      'brand_name',
      'brand_description',
      'target_audience'
    ];

    for (const field of requiredDesignFields) {
      if (!input.designSpec[field] || typeof input.designSpec[field] !== 'string') {
        throw new Error(`Invalid design spec: ${field} is missing or invalid`);
      }
    }

    // Verify each concept has required fields
    for (let i = 0; i < input.concepts.length; i++) {
      const concept = input.concepts[i];
      
      if (!concept.name || typeof concept.name !== 'string') {
        throw new Error(`Concept ${i + 1} is missing a valid name`);
      }
      
      if (!concept.description || typeof concept.description !== 'string') {
        throw new Error(`Concept ${i + 1} is missing a valid description`);
      }
    }
  }

  static validateSelectionOutput(jsonString: string, conceptCount: number): ConceptSelection {
    let parsed: unknown;
    
    try {
      // Handle potential code blocks
      const match = jsonString.match(/```json\s*([\s\S]*?)\s*```/);
      const effectiveJsonString = match ? match[1] : jsonString;
      parsed = JSON.parse(effectiveJsonString.trim());
    } catch (error) {
      throw new Error(`Invalid JSON response from AI model: ${(error as Error).message}`);
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('AI response is not a valid object');
    }

    const obj = parsed as Record<string, unknown>;
    
    // Validate selected_concept_index
    if (!('selected_concept_index' in obj) || typeof obj.selected_concept_index !== 'number') {
      throw new Error('AI response missing or invalid selected_concept_index');
    }

    const selectedIndex = obj.selected_concept_index as number;
    if (selectedIndex < 0 || selectedIndex >= conceptCount || !Number.isInteger(selectedIndex)) {
      throw new Error(`Invalid selected_concept_index: ${selectedIndex}. Must be 0, 1, or 2.`);
    }

    // Validate selection_rationale
    if (!('selection_rationale' in obj) || typeof obj.selection_rationale !== 'string') {
      throw new Error('AI response missing or invalid selection_rationale');
    }

    const rationale = obj.selection_rationale as string;
    if (rationale.length < 20) {
      throw new Error('Selection rationale is too short');
    }

    // Validate score
    if (!('score' in obj) || typeof obj.score !== 'number') {
      throw new Error('AI response missing or invalid score');
    }

    const score = obj.score as number;
    if (score < 0 || score > 100) {
      throw new Error(`Invalid score: ${score}. Must be between 0 and 100.`);
    }

    return {
      selectedConcept: null as unknown as MoodboardConcept, // Will be populated after validation
      selectionRationale: rationale,
      score: score
    };
  }
}

// Retry utility
class StageCRetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = STAGE_C_CONFIG.max_retries,
    baseDelay: number = STAGE_C_CONFIG.retry_delay
  ): Promise<T> {
    let lastError: Error = new Error('Retry operation failed.');

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry validation errors
        if (error instanceof Error && error.message.includes('Design specification')) {
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, Math.min(delay, 10000)));
        }
      }
    }

    throw new Error(`Stage C: All attempts failed. Last error: ${lastError.message}`);
  }
}

// Main selection function
export async function selectDirection(
  input: StageCInput
): Promise<StageCOutput> {
  const startTime = Date.now();
  
  try {
    // Validate input
    StageCValidator.validateInput(input);

    // Initialize Anthropic client
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Construct user message with design requirements and concepts
    const userMessage = `
BRAND REQUIREMENTS:

Brand Name: ${input.designSpec.brand_name}
Brand Description: ${input.designSpec.brand_description}
Style Preferences: ${input.designSpec.style_preferences}
Color Palette: ${input.designSpec.color_palette}
Imagery: ${input.designSpec.imagery}
Target Audience: ${input.designSpec.target_audience}
Additional Requests: ${input.designSpec.additional_requests}

CONCEPT OPTIONS:

${input.concepts.map((concept, index) => `
CONCEPT ${index + 1}: ${concept.name}
Description: ${concept.description}
Style Approach: ${concept.style_approach}
Primary Colors: ${concept.primary_colors.join(', ')}
Typography: ${concept.typography_style}
Imagery Elements: ${concept.imagery_elements}
Rationale: ${concept.rationale}
`).join('\n')}

Select the best concept based on the evaluation criteria. Return only a JSON object with the selected_concept_index (0, 1, or 2), selection_rationale, and score.
`;

    // Call Claude API with retry logic
    const completion = await StageCRetryHandler.withRetry(async () => {
      const response = await anthropic.messages.create({
        model: STAGE_C_CONFIG.model,
        max_tokens: STAGE_C_CONFIG.max_tokens,
        temperature: STAGE_C_CONFIG.temperature,
        system: STAGE_C_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      });

      if (!response.content || response.content.length === 0) {
        throw new Error('Empty response from AI model');
      }

      const textContent = response.content.find(
        (contentBlock): contentBlock is Anthropic.TextBlock => contentBlock.type === 'text'
      );

      if (!textContent || !textContent.text.trim()) {
        throw new Error('No text content in AI response');
      }

      return {
        content: textContent.text,
        usage: response.usage,
      };
    });

    // Validate and parse the selection output
    const validatedSelection = StageCValidator.validateSelectionOutput(
      completion.content, 
      input.concepts.length
    );

    // Get the selected concept
    const selectedIndex = JSON.parse(completion.content).selected_concept_index;
    validatedSelection.selectedConcept = input.concepts[selectedIndex];

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      selection: validatedSelection,
      tokensUsed: (completion.usage.input_tokens || 0) + (completion.usage.output_tokens || 0),
      processingTime,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    let errorType: 'validation_error' | 'ai_error' | 'system_error' = 'system_error';
    let errorMessage = 'Unknown error occurred during concept selection';
    let errorDetails: unknown = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      if (process.env.NODE_ENV === 'development') {
        errorDetails = error.stack;
      }

      if (error.message.includes('Design specification') || 
          error.message.includes('Concepts array') ||
          error.message.includes('Concept ')) {
        errorType = 'validation_error';
      } else if (error.message.includes('AI model') || 
                 error.message.includes('AI response') ||
                 error.message.includes('JSON response') ||
                 error.message.includes('selection_rationale') ||
                 error.message.includes('selected_concept_index')) {
        errorType = 'ai_error';
      } else if (error.message.includes('ANTHROPIC_API_KEY')) {
        errorType = 'system_error';
      }
    }

    return {
      success: false,
      error: { type: errorType, message: errorMessage, details: errorDetails },
      processingTime,
    };
  }
}

// Manual selection function for user override
export function manualSelection(
  concepts: MoodboardConcept[],
  selectedIndex: number
): ConceptSelection {
  if (selectedIndex < 0 || selectedIndex >= concepts.length) {
    throw new Error(`Invalid selection index: ${selectedIndex}. Must be between 0 and ${concepts.length - 1}.`);
  }

  return {
    selectedConcept: concepts[selectedIndex],
    selectionRationale: "Manually selected by user.",
    score: 100 // Maximum score for user selection
  };
}

// Utility function for validation
export function validateStageCOutput(output: StageCOutput): string {
  if (!output) return "Output is undefined or null";
  
  if (output.success) {
    if (!output.selection) return "Successful output missing selection";
    if (!output.selection.selectedConcept) return "Selection missing selectedConcept";
    if (!output.selection.selectionRationale) return "Selection missing selectionRationale";
    if (typeof output.selection.score !== 'number') return "Selection missing or invalid score";
    
    if (!output.tokensUsed || output.tokensUsed <= 0) return "Missing or invalid tokensUsed";
    if (!output.processingTime || output.processingTime < 0) return "Missing or invalid processingTime";
    
    return "valid";
  } else {
    if (!output.error) return "Failed output missing error object";
    if (!output.error.type || !output.error.message) return "Error object missing type or message";
    if (!output.processingTime || output.processingTime < 0) return "Missing or invalid processingTime on error";
    
    return "valid_error";
  }
}

// Export configuration and metadata
export const STAGE_C_METADATA = {
  name: 'Stage C - Direction Selection',
  model: STAGE_C_CONFIG.model,
  expected_tokens_budget: 150, // From claude.md
  timeout_ms: STAGE_C_CONFIG.timeout,
  max_retries: STAGE_C_CONFIG.max_retries,
};