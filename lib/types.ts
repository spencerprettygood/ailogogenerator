// Re-export MockupType from mockup-types.ts for backward compatibility
export { MockupType } from "./mockups/mockup-types";
export type { AnimationOptions } from './animation/types';

// Pipeline progress interface
export interface PipelineProgress {
  currentStage: PipelineStage;
  stageProgress: number; // 0-100
  overallProgress: number; // 0-100
  statusMessage: string;
  startTime?: number;
  estimatedTimeRemaining?: number; // in seconds
}

// Logo brief interface for logo generation requests
export interface LogoBrief {
  prompt: string;
  image_uploads?: File[];
  preferences?: LogoGenerationPreferences;
  industry?: string;
  includeAnimations?: boolean;
  animationOptions?: AnimationOptions;
}

// Complete generation result
export interface GenerationResult {
  brandName: string;
  sessionId: string;
  assets: GeneratedAssets;
  completionTime: number; // milliseconds
  uniquenessScore?: number; // 0-100
  designNotes?: string;
}

// General types for messages (compatible with AI SDK v5)
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  TOOL = 'tool',
  DATA = 'data',
  FUNCTION = 'function'
}

export interface Message {
  id: string;
  role: string;
  content: string | MessageContent[] | Record<string, any>;
  timestamp: Date;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  progress?: GenerationProgress;
  assets?: GeneratedAssets;
  files?: File[];
}

export interface MessageContent {
  type: 'text' | 'image' | 'file' | 'tool_call' | 'tool_result';
  text?: string;
  image_url?: string;
  file_url?: string;
  tool_call?: ToolCall;
  tool_result?: ToolResult;
}

export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  call_id: string;
  type: string;
  content: string;
}

// Pipeline status and progress
export enum PipelineStage {
  IDLE = 'idle',
  DISTILLATION = 'distillation',
  MOODBOARD = 'moodboard',
  SELECTION = 'selection',
  GENERATION = 'generation',
  VALIDATION = 'validation',
  VARIANTS = 'variants',
  GUIDELINES = 'guidelines',
  PACKAGING = 'packaging',
  ANIMATION = 'animation',
  COMPLETE = 'complete',
  FAILED = 'failed',
  // Stage mapping from letters
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  H = 'H',
  CACHED = 'cached'
}

export interface GenerationProgress {
  stage: PipelineStage;
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // in seconds
}

// Logo and assets
export interface SVGLogo {
  id: string;
  name: string;
  svgCode: string;
  width?: number;
  height?: number;
}

export interface LogoVariant {
  id: string;
  name: string; // e.g., "Monochrome", "Favicon", etc.
  svgCode: string;
  type: 'color' | 'monochrome' | 'favicon' | 'simplified' | 'custom';
}

export interface FileDownloadInfo {
  id: string;
  name: string;
  description?: string;
  url: string;
  size?: number; // in bytes
  format: 'svg' | 'png' | 'ico' | 'html' | 'zip' | 'other';
  type: 'logo' | 'variant' | 'guideline' | 'package';
  thumbnailUrl?: string;
}

// Animation-related types
export interface AnimatedLogo {
  svgCode: string;
  cssCode: string;
  jsCode?: string;
  animationOptions: AnimationOptions;
}

// Uniqueness analysis
export interface UniquenessAnalysis {
  score: number; // 0-100
  similarLogos?: SimilarLogo[];
  suggestedChanges?: string[];
  industryDistinctiveness?: number; // 0-100
  uniquenessFactors?: {
    shape: number; // 0-100
    color: number; // 0-100
    style: number; // 0-100
    concept: number; // 0-100
  };
}

export interface SimilarLogo {
  name: string;
  similarity: number; // 0-100
  imageUrl?: string;
  description?: string;
}

// Generated assets
export interface GeneratedAssets {
  brandName?: string;
  primaryLogoSVG?: SVGLogo;
  variants?: LogoVariant[];
  monochrome?: {
    black: SVGLogo;
    white: SVGLogo;
  };
  favicon?: SVGLogo;
  pngVersions?: {
    small: string; // base64 or URL
    medium: string; // base64 or URL
    large: string; // base64 or URL
  };
  individualFiles?: FileDownloadInfo[];
  zipPackageUrl?: string;
  brandGuidelines?: string; // HTML content
  
  // Animation-related assets
  animatedSvg?: string;
  animationCss?: string;
  animationJs?: string;
  animationOptions?: AnimationOptions;
  
  // Analysis and additional data
  uniquenessAnalysis?: UniquenessAnalysis;
  inspirationSources?: string[];
  designNotes?: string;
}

// Logo generation state (for persistent state tracking)
export interface LogoGenerationState {
  id: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  currentStage: PipelineStage;
  stageProgress: number; // 0-100
  userPrompt: string;
  assets?: GeneratedAssets;
  error?: string;
  cancelled?: boolean;
}

// User preferences for logo generation
export interface LogoGenerationPreferences {
  industry?: string;
  style?: string;
  colorScheme?: string;
  includeAnimations?: boolean;
  animationOptions?: AnimationOptions;
  includeGuidelines?: boolean;
  includeUniquenessAnalysis?: boolean;
  includeStandardVariants?: boolean;
}

// Animation export options
export interface AnimationExportOptions {
  format: 'svg' | 'html' | 'gif' | 'mp4';
  duration?: number; // in milliseconds
  fps?: number; // frames per second for video/GIF
  quality?: 'low' | 'medium' | 'high';
  loop?: boolean;
  width?: number;
  height?: number;
}

// Download manager props
export interface DownloadManagerProps {
  files: {
    id: string;
    name: string;
    description?: string;
    url: string;
    size?: number;
    format: string;
    type: string;
    isPrimary?: boolean;
    thumbnailUrl?: string;
  }[];
  packageUrl?: string;
  onDownloadFileAction: (fileId: string) => void;
  onDownloadAllAction: () => void;
  brandName?: string;
}

// Animation download manager props
export interface AnimationDownloadManagerProps {
  animatedSvg?: string;
  animationCss?: string;
  animationJs?: string;
  animationOptions?: AnimationOptions;
  brandName?: string;
  onExport: (format: string, options?: AnimationExportOptions) => void;
}

// API response types
export interface GenerationResponse {
  success: boolean;
  sessionId?: string;
  message?: string;
  progress?: GenerationProgress;
  assets?: GeneratedAssets;
  preview?: string; // SVG preview during generation
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
}