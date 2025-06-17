import Anthropic from '@anthropic-ai/sdk';
import { DesignSpec } from './stage-a-distillation';

// Types for Stage B
export interface MoodboardConcept {
  name: string;
  description: string;
  style_approach: string;
  primary_colors: string[];
  typography_style: string;
  imagery_elements: string;
  rationale: string;
}

export interface MoodboardOutput {
  concepts: MoodboardConcept[];
}

export interface StageBInput {
  designSpec: DesignSpec;
}

export interface StageBOutput {
  success: boolean;
  moodboard?: MoodboardOutput;
  error?: {
    type: 'validation_error' | 'ai_error' | 'system_error';
    message: string;
    details?: unknown;
  };
  tokensUsed?: number;
  processingTime?: number;
}

// Configuration
const STAGE_B_CONFIG = {
  model: 'claude-3-5-sonnet-20240620' as const, // Sonnet for creative generation
  temperature: 0.7, // Higher creativity for concept generation
  max_tokens: 1500, // Allow for longer creative outputs
  timeout: 30_000, // 30 seconds for creative generation
  max_retries: 3,
  retry_delay: 2000, // 2 seconds
  required_concepts: 3,
};

// System prompt for creative concept generation
const STAGE_B_SYSTEM_PROMPT = `
You are a creative logo designer brainstorming visual concepts. Generate exactly 3 distinct logo directions based on the provided design requirements.

Your task is to create diverse visual concepts that explore different creative approaches while staying true to the brand requirements. Each concept should offer a unique perspective on how the logo could be executed.

OUTPUT FORMAT (JSON only):
{
  "concepts": [
    {
      "name": "string (e.g., 'Modern Geometric', 'Classic Wordmark', 'Symbolic Icon')",
      "description": "string (150-200 words describing the visual concept)",
      "style_approach": "string (e.g., 'Minimalist', 'Bold & Dynamic', 'Classic & Elegant')",
      "primary_colors": ["hex codes or color names"],
      "typography_style": "string (font style description)",
      "imagery_elements": "string (visual elements and symbols)",
      "rationale": "string (why this concept fits the brand)"
    }
  ]
}

CONCEPT REQUIREMENTS:
1. Generate exactly 3 unique concepts
2. Each concept must be visually distinct from the others
3. Vary the style approaches (e.g., one minimalist, one bold, one classic)
4. Include 2-4 specific colors with hex codes when possible
5. Describe typography that fits the concept
6. Explain visual elements clearly for implementation
7. Each description should be 150-200 words
8. Focus on practical visual execution, not abstract ideas

ORIGINALITY RULES:
- Do not copy or closely mimic existing famous logos
- Create original concepts inspired by the brief
- Avoid clichéd symbol choices unless specifically requested
- Ensure each concept offers a fresh perspective

DIVERSITY REQUIREMENTS:
- Vary color palettes between concepts
- Use different typographic approaches
- Mix symbolic, text-based, and combination approaches
- Consider different target audience segments if applicable

Return ONLY the JSON object with no additional commentary.
`;

// Input validation class
class StageBValidator {
  static validateDesignSpec(designSpec: DesignSpec): void {
    if (!designSpec) {
      throw new Error('Design specification is required');
    }

    const requiredFields: Array<keyof DesignSpec> = [
      'brand_name',
      'brand_description',
      'style_preferences',
      'color_palette',
      'imagery',
      'target_audience'
    ];

    for (const field of requiredFields) {
      if (!designSpec[field] || typeof designSpec[field] !== 'string') {
        throw new Error(`Invalid design spec: ${field} is missing or invalid`);
      }
    }

    if (designSpec.brand_name === 'unspecified' || designSpec.brand_name.length < 2) {
      throw new Error('Brand name must be specified and meaningful');
    }
  }

  static validateMoodboardOutput(jsonString: string): MoodboardOutput {
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
    
    if (!obj.concepts || !Array.isArray(obj.concepts)) {
      throw new Error('AI response missing concepts array');
    }

    if (obj.concepts.length !== STAGE_B_CONFIG.required_concepts) {
      throw new Error(`Expected ${STAGE_B_CONFIG.required_concepts} concepts, got ${obj.concepts.length}`);
    }

    const validatedConcepts: MoodboardConcept[] = [];

    for (let i = 0; i < obj.concepts.length; i++) {
      const concept = obj.concepts[i];
      
      if (!concept || typeof concept !== 'object') {
        throw new Error(`Concept ${i + 1} is not a valid object`);
      }

      const c = concept as Record<string, unknown>;
      
      // Validate required fields
      const requiredFields = ['name', 'description', 'style_approach', 'primary_colors', 'typography_style', 'imagery_elements', 'rationale'];
      
      for (const field of requiredFields) {
        if (!(field in c) || !c[field]) {
          throw new Error(`Concept ${i + 1} missing required field: ${field}`);
        }
      }

      // Validate field types
      if (typeof c.name !== 'string' || c.name.length < 3) {
        throw new Error(`Concept ${i + 1} has invalid name`);
      }

      if (typeof c.description !== 'string' || c.description.length < 50) {
        throw new Error(`Concept ${i + 1} description is too short`);
      }

      if (typeof c.style_approach !== 'string' || c.style_approach.length < 3) {
        throw new Error(`Concept ${i + 1} has invalid style approach`);
      }

      if (!Array.isArray(c.primary_colors) || c.primary_colors.length === 0) {
        throw new Error(`Concept ${i + 1} must have at least one primary color`);
      }

      // Validate colors are strings
      for (const color of c.primary_colors) {
        if (typeof color !== 'string' || color.length < 3) {
          throw new Error(`Concept ${i + 1} has invalid color: ${color}`);
        }
      }

      if (typeof c.typography_style !== 'string' || c.typography_style.length < 5) {
        throw new Error(`Concept ${i + 1} has invalid typography style`);
      }

      if (typeof c.imagery_elements !== 'string' || c.imagery_elements.length < 5) {
        throw new Error(`Concept ${i + 1} has invalid imagery elements`);
      }

      if (typeof c.rationale !== 'string' || c.rationale.length < 20) {
        throw new Error(`Concept ${i + 1} rationale is too short`);
      }

      validatedConcepts.push({
        name: c.name as string,
        description: c.description as string,
        style_approach: c.style_approach as string,
        primary_colors: c.primary_colors as string[],
        typography_style: c.typography_style as string,
        imagery_elements: c.imagery_elements as string,
        rationale: c.rationale as string,
      });
    }

    return { concepts: validatedConcepts };
  }
}

// Concept quality checker
class ConceptAnalyzer {
  static checkConceptDiversity(concepts: MoodboardConcept[]): string[] {
    const issues: string[] = [];
    
    // Check for duplicate names
    const names = concepts.map(c => c.name.toLowerCase());
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      issues.push('Concepts have duplicate or very similar names');
    }

    // Check for style diversity
    const styleApproaches = concepts.map(c => c.style_approach.toLowerCase());
    const uniqueStyles = new Set(styleApproaches);
    if (uniqueStyles.size < 2) {
      issues.push('Concepts lack diversity in style approaches');
    }

    // Check color diversity
    const allColors = concepts.flatMap(c => c.primary_colors.map(color => color.toLowerCase()));
    const uniqueColors = new Set(allColors);
    if (uniqueColors.size < 3) {
      issues.push('Concepts lack color diversity');
    }

    // Check description length variety
    const descLengths = concepts.map(c => c.description.length);
    const avgLength = descLengths.reduce((a, b) => a + b, 0) / descLengths.length;
    if (descLengths.some(len => len < avgLength * 0.7)) {
      issues.push('Some concept descriptions are significantly shorter than others');
    }

    return issues;
  }

  static checkOriginality(concepts: MoodboardConcept[]): string[] {
    const issues: string[] = [];
    
    // Common cliché patterns to avoid
    const cliches = [
      /swoosh/gi,
      /globe.*world/gi,
      /handshake/gi,
      /lightbulb.*idea/gi,
      /arrow.*up.*growth/gi,
      /generic.*symbol/gi,
    ];

    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i];
      const fullText = `${concept.description} ${concept.imagery_elements}`.toLowerCase();
      
      for (const cliche of cliches) {
        if (cliche.test(fullText)) {
          issues.push(`Concept ${i + 1} (${concept.name}) may contain clichéd elements`);
        }
      }
      
      // Check for overly generic descriptions
      if (concept.description.split(' ').length < 20) {
        issues.push(`Concept ${i + 1} (${concept.name}) description is too brief`);
      }
    }

    return issues;
  }

  static scoreConceptQuality(concept: MoodboardConcept): number {
    let score = 100;
    
    // Deduct for short descriptions
    if (concept.description.length < 100) score -= 20;
    if (concept.description.length < 50) score -= 30;
    
    // Deduct for generic names
    if (concept.name.toLowerCase().includes('logo') || concept.name.toLowerCase().includes('design')) {
      score -= 10;
    }
    
    // Deduct for insufficient colors
    if (concept.primary_colors.length < 2) score -= 15;
    
    // Deduct for vague imagery
    if (concept.imagery_elements.length < 20) score -= 20;
    
    // Deduct for short rationale
    if (concept.rationale.length < 30) score -= 15;
    
    return Math.max(0, score);
  }
}

// Retry utility
class StageBRetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = STAGE_B_CONFIG.max_retries,
    baseDelay: number = STAGE_B_CONFIG.retry_delay
  ): Promise<T> {
    let lastError: Error = new Error('Retry operation failed.');

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry validation errors from design spec
        if (error instanceof Error && error.message.includes('Design specification')) {
          throw error;
        }

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, Math.min(delay, 10000)));
        }
      }
    }

    throw new Error(`Stage B: All attempts failed. Last error: ${lastError.message}`);
  }
}

// Main moodboard generation function
export async function generateMoodboard(
  designSpec: DesignSpec
): Promise<StageBOutput> {
  const startTime = Date.now();
  
  try {
    // Validate input
    StageBValidator.validateDesignSpec(designSpec);

    // Initialize Anthropic client
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Construct user message with design requirements
    const userMessage = `
DESIGN REQUIREMENTS:

Brand Name: ${designSpec.brand_name}
Brand Description: ${designSpec.brand_description}
Style Preferences: ${designSpec.style_preferences}
Color Palette: ${designSpec.color_palette}
Imagery Requirements: ${designSpec.imagery}
Target Audience: ${designSpec.target_audience}
Additional Requests: ${designSpec.additional_requests}

Generate 3 distinct visual concepts for this brand's logo based on these requirements.
`;

    // Call Claude API with retry logic
    const completion = await StageBRetryHandler.withRetry(async () => {
      const response = await anthropic.messages.create({
        model: STAGE_B_CONFIG.model,
        max_tokens: STAGE_B_CONFIG.max_tokens,
        temperature: STAGE_B_CONFIG.temperature,
        system: STAGE_B_SYSTEM_PROMPT,
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

    // Validate and parse the moodboard output
    const moodboard = StageBValidator.validateMoodboardOutput(completion.content);

    // Quality checks
    const diversityIssues = ConceptAnalyzer.checkConceptDiversity(moodboard.concepts);
    const originalityIssues = ConceptAnalyzer.checkOriginality(moodboard.concepts);
    
    // Log quality issues in development
    if (process.env.NODE_ENV === 'development') {
      if (diversityIssues.length > 0) {
        console.warn('Stage B diversity issues:', diversityIssues);
      }
      if (originalityIssues.length > 0) {
        console.warn('Stage B originality issues:', originalityIssues);
      }
    }

    // Calculate concept scores
    for (const concept of moodboard.concepts) {
      const score = ConceptAnalyzer.scoreConceptQuality(concept);
      if (process.env.NODE_ENV === 'development') {
        console.log(`Concept "${concept.name}" quality score: ${score}/100`);
      }
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      moodboard,
      tokensUsed: (completion.usage.input_tokens || 0) + (completion.usage.output_tokens || 0),
      processingTime,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    let errorType: 'validation_error' | 'ai_error' | 'system_error' = 'system_error';
    let errorMessage = 'Unknown error occurred during moodboard generation';
    let errorDetails: unknown = undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      if (process.env.NODE_ENV === 'development') {
        errorDetails = error.stack;
      }

      if (error.message.includes('Design specification') || 
          error.message.includes('Invalid design spec')) {
        errorType = 'validation_error';
      } else if (error.message.includes('AI model') || 
                 error.message.includes('AI response') ||
                 error.message.includes('JSON response') ||
                 error.message.includes('Expected') ||
                 error.message.includes('Concept')) {
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

// Utility functions for concept management
export function selectBestConcept(concepts: MoodboardConcept[]): MoodboardConcept {
  if (concepts.length === 0) {
    throw new Error('No concepts to select from');
  }

  // Score all concepts and return the highest scoring one
  let bestConcept = concepts[0];
  let bestScore = ConceptAnalyzer.scoreConceptQuality(bestConcept);

  for (let i = 1; i < concepts.length; i++) {
    const score = ConceptAnalyzer.scoreConceptQuality(concepts[i]);
    if (score > bestScore) {
      bestScore = score;
      bestConcept = concepts[i];
    }
  }

  return bestConcept;
}

export function validateStageBOutput(output: StageBOutput): string {
  if (!output) return "Output is undefined or null";
  
  if (output.success) {
    if (!output.moodboard) return "Successful output missing moodboard";
    if (!output.moodboard.concepts) return "Moodboard missing concepts array";
    if (output.moodboard.concepts.length !== 3) return "Moodboard should have exactly 3 concepts";
    
    for (let i = 0; i < output.moodboard.concepts.length; i++) {
      const concept = output.moodboard.concepts[i];
      if (!concept.name || !concept.description || !concept.style_approach) {
        return `Concept ${i + 1} missing required fields`;
      }
      if (!Array.isArray(concept.primary_colors) || concept.primary_colors.length === 0) {
        return `Concept ${i + 1} missing primary colors`;
      }
    }
    
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
export const STAGE_B_METADATA = {
  name: 'Stage B - Moodboard Generation',
  model: STAGE_B_CONFIG.model,
  expected_tokens_budget: 500, // From claude.md
  timeout_ms: STAGE_B_CONFIG.timeout,
  max_retries: STAGE_B_CONFIG.max_retries,
  required_concepts: STAGE_B_CONFIG.required_concepts,
};
