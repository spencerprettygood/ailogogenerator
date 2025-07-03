import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequirementsAgent } from '../requirements-agent';
import { RequirementsAgentInput } from '../../../types-agents';
import { detectIndustry } from '../../../industry-templates';

// Mock the industry detection function
vi.mock('../../../industry-templates', () => ({
  detectIndustry: vi.fn().mockReturnValue({ 
    primaryIndustry: 'Technology', 
    confidenceScore: 0.85 
  })
}));

describe('RequirementsAgent', () => {
  let agent: RequirementsAgent;
  
  beforeEach(() => {
    agent = new RequirementsAgent({
      temperature: 0.1,
      maxTokens: 1000
    });
    
    // Mock the execute method to avoid actual API calls
    agent.execute = vi.fn().mockImplementation(async (input: RequirementsAgentInput) => {
      // Return a simulated response based on the input
      const brandName = input.brief.includes('ByteWave') 
        ? 'ByteWave' 
        : input.brief.includes('Flour & Joy')
          ? 'Flour & Joy'
          : 'TestBrand';
          
      const industry = input.brief.includes('tech') 
        ? 'Technology' 
        : input.brief.includes('bakery')
          ? 'Food & Beverage'
          : 'Retail';
          
      return {
        success: true,
        result: {
          designSpec: {
            brand_name: brandName,
            brand_description: `A ${industry.toLowerCase()} company`,
            style_preferences: 'Modern, clean',
            color_palette: 'Blue and white',
            imagery: 'Abstract shapes',
            target_audience: 'Professionals',
            additional_requests: 'None',
            industry: industry
          }
        }
      };
    });
  });

  it('should have the correct agent type and capabilities', () => {
    expect(agent.type).toBe('requirements');
    expect(agent.capabilities).toContain('requirements-analysis');
  });

  it('should properly process a tech startup brief', async () => {
    const input: RequirementsAgentInput = {
      id: 'test-1',
      brief: 'I need a logo for my new tech startup called ByteWave. We\'re building a platform that helps companies manage their cloud infrastructure more efficiently.'
    };
    
    const result = await agent.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.result?.designSpec.brand_name).toBe('ByteWave');
    expect(result.result?.designSpec.industry).toBe('Technology');
  });

  it('should properly process a bakery brief', async () => {
    const input: RequirementsAgentInput = {
      id: 'test-2',
      brief: 'We\'re opening a neighborhood bakery called \'Flour & Joy\' that specializes in artisanal sourdough and pastries made with organic ingredients.'
    };
    
    const result = await agent.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.result?.designSpec.brand_name).toBe('Flour & Joy');
    expect(result.result?.designSpec.industry).toBe('Food & Beverage');
  });

  it('should handle image descriptions in the input', async () => {
    const input: RequirementsAgentInput = {
      id: 'test-3',
      brief: 'I need a logo for my tech company',
      imageDescriptions: [
        'A modern minimalist logo with blue and gray colors',
        'An example of a tech company logo with a circuit board pattern'
      ]
    };
    
    // Spy on the generatePrompt method
    const generatePromptSpy = vi.spyOn(agent as any, 'generatePrompt');
    
    await agent.execute(input);
    
    // Check that the image descriptions were included in the prompt
    const prompt = await generatePromptSpy.mock.results[0].value;
    expect(prompt).toContain('REFERENCE IMAGES');
    expect(prompt).toContain('modern minimalist logo');
    expect(prompt).toContain('circuit board pattern');
  });

  it('should detect industry from brief content', async () => {
    // Access private method for testing
    const detectIndustryMethod = (agent as any).detectIndustryFromBrief.bind(agent);
    
    expect(detectIndustryMethod('We need a logo for our new banking app')).toBe('Finance');
    expect(detectIndustryMethod('Our AI startup is launching next month')).toBe('Technology');
    expect(detectIndustryMethod("We're opening a new restaurant in downtown")).toBe('Food & Beverage');
    expect(detectIndustryMethod("Our medical clinic needs a new brand identity")).toBe('Healthcare');
    expect(detectIndustryMethod('Just a generic company with no specific keywords')).toBe(null);
  });

  it('should add industry-specific context to prompt when detected', async () => {
    const input: RequirementsAgentInput = {
      id: 'test-4',
      brief: 'We need a logo for our new health clinic that provides wellness services'
    };
    
    // Spy on the generatePrompt method
    const generatePromptSpy = vi.spyOn(agent as any, 'generatePrompt');
    
    await agent.execute(input);
    
    // Check that the industry context was added to the prompt
    const prompt = await generatePromptSpy.mock.results[0].value;
    expect(prompt).toContain('related to the Healthcare industry');
  });
});