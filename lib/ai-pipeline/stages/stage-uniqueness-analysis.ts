import { DesignSpec } from '../../types';
import { callAIWithRetry } from '../../retry';

export interface UniquenessAnalysisInput {
  svg: string;
  designSpec: DesignSpec;
  industry?: string;
}

export interface CompetitorLogo {
  id: string;
  companyName: string;
  similarityScore: number; // 0-100
  similarElements: string[];
  imageUrl?: string;
}

export interface UniquenessAnalysisResult {
  uniquenessScore: number; // 0-100
  analysis: {
    overallAssessment: string;
    uniqueElements: string[];
    potentialIssues: string[];
    industryConventions: string[];
    differentiators: string[];
  };
  similarLogos: CompetitorLogo[];
  recommendations: {
    text: string;
    severity: 'info' | 'warning' | 'critical';
  }[];
}

export interface UniquenessAnalysisOutput {
  success: boolean;
  result?: UniquenessAnalysisResult;
  tokensUsed?: number;
  processingTime?: number;
  error?: {
    message: string;
    details?: unknown;
  };
}

/**
 * Analyzes a generated logo for uniqueness compared to industry competitors
 * Uses Claude 3.5 Haiku for fast analysis without requiring image generation
 */
export async function analyzeLogoUniqueness(
  input: UniquenessAnalysisInput
): Promise<UniquenessAnalysisOutput> {
  const startTime = Date.now();

  try {
    const { svg, designSpec, industry } = input;

    // Simplified SVG representation (first 500 chars) to avoid token waste
    const svgPreview = svg.slice(0, 500) + (svg.length > 500 ? '...' : '');

    // Create system prompt for industry-specific analysis
    const systemPrompt = `You are an expert logo designer and brand identity specialist with deep knowledge of logo design across various industries. Your task is to analyze a newly generated logo for uniqueness compared to existing logos in the ${industry || designSpec.industry || 'general'} industry.

IMPORTANT: Your analysis should be honest but constructive. Focus on:
1. Uniqueness compared to industry competitors
2. Adherence to industry conventions while maintaining distinction
3. Potential legal or similarity issues with well-known brands
4. Specific elements that make this logo stand out

Base your analysis on your knowledge of major brands and logos in this industry. Return a structured JSON response with the uniqueness analysis.`;

    // Create user prompt with logo details
    const userPrompt = `Analyze this logo for uniqueness in the ${industry || designSpec.industry || 'general'} industry:

Brand name: ${designSpec.brand_name}
Brand description: ${designSpec.brand_description}
Style preferences: ${designSpec.style_preferences}
Color palette: ${designSpec.color_palette}
Target audience: ${designSpec.target_audience}

SVG Preview:
${svgPreview}

Your response should be a valid JSON object with the following structure:
{
  "uniquenessScore": number, // 0-100 where 100 is completely unique
  "analysis": {
    "overallAssessment": string, // 1-2 sentence summary
    "uniqueElements": string[], // List of unique aspects
    "potentialIssues": string[], // Potential similarity concerns
    "industryConventions": string[], // How it follows industry norms
    "differentiators": string[] // What makes it stand out
  },
  "similarLogos": [
    {
      "companyName": string,
      "similarityScore": number, // 0-100 where 100 is identical
      "similarElements": string[] // What elements are similar
    }
  ],
  "recommendations": [
    {
      "text": string, // Recommendation text
      "severity": "info" | "warning" | "critical" // How important this change is
    }
  ]
}

Do not include any explanatory text outside the JSON.`;

    // Call Claude with Haiku model for faster analysis
    const response = await callAIWithRetry({
      model: 'claude-3-5-haiku-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const aiResponse = response.content[0].text;
    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    // Parse the JSON response
    try {
      // Find the first { and last } to extract just the JSON part
      const jsonStart = aiResponse.indexOf('{');
      const jsonEnd = aiResponse.lastIndexOf('}') + 1;

      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonString = aiResponse.substring(jsonStart, jsonEnd);
        const result = JSON.parse(jsonString) as UniquenessAnalysisResult;

        return {
          success: true,
          result,
          tokensUsed,
          processingTime: Date.now() - startTime,
        };
      } else {
        throw new Error('Could not extract valid JSON from AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return {
        success: false,
        error: {
          message: 'Failed to parse uniqueness analysis result',
          details: parseError,
        },
        processingTime: Date.now() - startTime,
      };
    }
  } catch (error) {
    console.error('Logo uniqueness analysis failed:', error);
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : 'Unknown error during uniqueness analysis',
        details: error,
      },
      processingTime: Date.now() - startTime,
    };
  }
}
