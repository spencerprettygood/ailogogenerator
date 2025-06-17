import { describe, it, expect } from 'vitest';
import { generateBrandGuidelines } from '../stages/stage-g-guidelines';

const mockVariants = {
  primary: '<svg>...</svg>',
  monochrome: {
    black: '<svg>...</svg>',
    white: '<svg>...</svg>'
  },
  favicon: {
    svg: '<svg>...</svg>',
    png32: Buffer.from('mock'),
    ico: Buffer.from('mock')
  },
  pngVariants: {
    png256: Buffer.from('mock'),
    png512: Buffer.from('mock'),
    png1024: Buffer.from('mock')
  }
};

const mockDesignSpec = {
  brand_name: 'TestBrand',
  brand_description: 'A test brand for unit testing.',
  style_preferences: 'Modern, minimal',
  color_palette: '#123456, #abcdef',
  imagery: 'Abstract shapes',
  target_audience: 'Developers',
  additional_requests: 'Accessible design',
};

describe('generateBrandGuidelines', () => {
  it('returns a valid BrandGuidelines object with HTML and all sections', async () => {
    const input = {
      variants: mockVariants,
      designSpec: mockDesignSpec
    };
    const result = await generateBrandGuidelines(input);
    expect(result).toHaveProperty('html');
    expect(result.sections).toHaveProperty('brand_overview');
    expect(result.sections).toHaveProperty('logo_usage');
    expect(result.sections).toHaveProperty('color_palette');
    expect(result.sections).toHaveProperty('typography');
    expect(result.sections).toHaveProperty('spacing_guidelines');
    expect(result.sections).toHaveProperty('usage_examples');
    expect(result.sections).toHaveProperty('dos_and_donts');
    expect(result.html).toContain('<html');
    expect(result.html).toContain('Brand Guidelines');
  });
});
