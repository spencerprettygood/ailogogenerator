import { z } from 'zod';

// =================================================================================
// Core Logo & Generation Schemas
// =================================================================================

export const SVGLogoSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  svg_code: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  legacy_svg: z.string().optional(),
});

// This now represents the final, successful result
export const GenerationResultSchema = z.object({
  type: z.literal('result'),
  logo: SVGLogoSchema,
  requestId: z.string(),
  prompt: z.string(),
  status: z.enum(['success', 'error']),
  timestamp: z.string().datetime(),
});

export const PipelineProgressSchema = z.object({
  type: z.literal('progress'),
  requestId: z.string(),
  status: z.literal('pending'),
  timestamp: z.string().datetime(),
  progress: z.number(),
  currentStage: z.string(),
  message: z.string().optional(),
});

export const GeneratedAssetsSchema = z.object({
  svg: z.string(),
  png: z.record(z.string(), z.string()), // Record<string, string> for different sizes
  jpg: z.record(z.string(), z.string()),
  legacy_pngVersions: z.array(z.string()).optional(),
});

// =================================================================================
// API Request & Response Schemas
// =================================================================================

export const GenerateLogoRequestSchema = z.object({
  prompt: z.string().min(10, { message: 'Prompt must be at least 10 characters long.' }),
  style: z.string().optional(),
  color_palette: z.array(z.string()).optional(),
  font: z.string().optional(),
});

export const GenerateLogoResponseDataSchema = z.discriminatedUnion('type', [
  GenerationResultSchema,
  PipelineProgressSchema,
]);

export const GenerateLogoResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: GenerateLogoResponseDataSchema.optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(), // Allow for detailed validation errors
    })
    .optional(),
});

// =================================================================================
// Mockup & Customization Schemas
// =================================================================================

export const MockupTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  previewUrl: z.string(),
});

export const MockupCustomizationOptionsSchema = z.object({
  backgroundColor: z.string().optional(),
  logoSize: z.number().optional(),
  logoPosition: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

// = a.	FileDownloadInfo: This type is used for tracking file downloads. It needs a type and category property to classify downloads correctly.
export const FileDownloadInfoSchema = z.object({
  id: z.string(),
  filename: z.string(),
  url: z.string(),
  size: z.number(),
  type: z.string(),
  category: z.string(),
});
