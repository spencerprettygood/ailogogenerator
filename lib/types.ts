// Error categories for error handling middleware
export enum ErrorCategory {
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  NOT_FOUND = 'not_found',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  // Add more as needed for future error types
}
import { SVGDesignQualityScore } from './types-agents';
import { AnimationOptions as AnimationConfig, AnimationEasing, AnimationDirection } from './animation/types';
import { MockupInstance, MockupTemplate } from './mockups/mockup-types';

export { AnimationEasing, AnimationDirection };
export type { MockupTemplate, MockupInstance };
export type AnimationOptions = AnimationConfig;

export interface LogoBrief {
  prompt: string;
  image_uploads?: File[];
  industry?: string;
  uniqueness_preference?: number; // 0-10, higher means more unique
  includeAnimations?: boolean;
  animationOptions?: AnimationOptions;
  includeUniquenessAnalysis?: boolean;
}

// Base agent interfaces
export interface AgentInput {
  prompt: string;
  image_uploads?: File[];
  industry?: string;
  uniqueness_preference?: number; // 0-10, higher means more unique
  includeAnimations?: boolean;
  animationOptions?: AnimationOptions;
  includeUniquenessAnalysis?: boolean;
}

export interface DesignSpec {
  brand_name: string;
  brand_description: string;
  style_preferences: string;
  color_palette: string;
  imagery: string;
  target_audience: string;
  additional_requests: string;
  industry?: string;
  industry_confidence?: number;
  uniqueness_level?: number; // 0-10 scale
}

export interface LogoColors {
  primary: string;
  secondary?: string;
  tertiary?: string;
  background?: string;
  accent?: string;
}

export interface Typography {
  fontFamily: string;
  fontCategory: string;
  fallbackFonts: string;
  weights: number[];
  styles: {
    heading?: {
      size: string;
      weight: number;
      blockSize: string; // Changed from lineHeight to blockSize
      letterSpacing?: string;
    };
    body?: {
      size: string;
      weight: number;
      blockSize: string; // Changed from lineHeight to blockSize
      letterSpacing?: string;
    };
  };
}

export interface LogoElement {
  id: string;
  type: 'path' | 'circle' | 'rect' | 'ellipse' | 'polygon' | 'text' | 'group';
  attributes: Record<string, string | number>;
  children?: LogoElement[];
}

export interface SVGLogo {
  svgCode: string;
  inlineSize: number;
  blockSize: number;
  elements: LogoElement[];
  colors: LogoColors;
  name: string;
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: Date;
  files?: File[];
  id?: string;
}

export interface ProgressStage {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number; // 0-100
  details?: string;
}

export interface GenerationProgress {
  status: 'queued' | 'analyzing' | 'generating' | 'refining' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  timeRemaining?: number; // in seconds
  stage?: string; // Stage identifier (A, B, C, etc.)
  estimatedTimeRemaining?: number; // in milliseconds
  stages?: ProgressStage[]; // Array of stage objects for multi-stage progress
  currentStageId?: string; // Current stage ID
  // Backward compatibility properties
  currentStage?: string; // Alias for currentStageId
  overallProgress?: number; // Alias for progress
  stageProgress?: number; // Progress within current stage
  statusMessage?: string; // Alias for message
}

export interface FileDownloadInfo {
  id: string;
  name: string;
  type: 'svg' | 'png' | 'ico' | 'html' | 'pdf' | 'zip' | 'css' | 'js';
  size?: number;
  url: string;
  description?: string;
  isPrimary?: boolean;
  icon?: string;
  category?: 'logo' | 'favicon' | 'guideline' | 'animation' | 'mockup' | 'package' | 'other';
}

export interface DownloadManagerProps {
  files: FileDownloadInfo[];
  packageUrl?: string;
  onDownloadFileAction: (file: FileDownloadInfo) => void;
  onDownloadAllAction: () => void;
  brandName?: string;
  includeFavicon?: boolean;
}

export interface AnimationDownloadManagerProps {
  animatedSvg: string;
  animationCss?: string;
  animationJs?: string;
  animationOptions?: AnimationOptions;
  brandName?: string;
  onExport: (format: string, options?: AnimationExportOptions) => void;
}

export interface GeneratedAssets {
  brandName?: string;
  primaryLogoSVG?: SVGLogo;
  logos?: SVGLogo[];
  favicon?: {
    svg: string;
    png32?: Buffer | string;
    ico?: Buffer | string;
  };
  guidelines?: DesignGuidelines;
  individualFiles?: FileDownloadInfo[];
  zipPackageUrl?: string;
  animatedSvg?: string;
  animationCss?: string;
  animationJs?: string;
  animationOptions?: AnimationOptions;
  uniquenessAnalysis?: IndustryAnalysis;
  mockups?: MockupInstance[];
}

export interface GenerationResult {
  logoPngUrls?: {
    size256: string;
    size512: string;
    size1024: string;
  };
  transparentPngUrls?: {
    size256: string;
    size512: string;
    size1024: string;
  };
  monochromePngUrls?: {
    black: {
      size256: string;
      size512: string;
    };
    white: {
      size256: string;
      size512: string;
    };
  };
  monochromeVariants?: {
    blackSvg: string;
    whiteSvg: string;
  };
  faviconUrls?: {
    ico: string;
    png: string;
    svg: string;
  };
  success: boolean;
  id?: string;
  brandName?: string;
  logos?: SVGLogo[];
  logoSvg?: string; // Backward compatibility
  designRationale?: string;
  industryContext?: string;
  downloadUrl?: string; // Download URL for generated assets
  brandGuidelinesUrl?: string; // URL to brand guidelines
  favicon?: {
    svg: string;
    png32?: Buffer | string;
    ico?: Buffer | string;
  };
  guidelines?: DesignGuidelines;
  error?: {
    message: string;
    code?: string;
    details?: string;
  };
  processingTime?: number; // in milliseconds
  // Animation-related fields (for compatibility with orchestrator output)
  animatedSvg?: string;
  animationCss?: string;
  animationJs?: string;
  animationOptions?: AnimationOptions;
  uniquenessAnalysis?: import("@/lib/ai-pipeline/stages/stage-uniqueness-analysis").UniquenessAnalysisResult;
  mockups?: MockupInstance[];
}

export interface DesignGuidelines {
  brandName: string;
  logoDescription: string;
  colorPalette: LogoColors;
  typography: Typography;
  spacing: {
    minSize: string;
    clearSpace: string;
    recommendations: string[];
  };
  usage: {
    doList: string[];
    dontList: string[];
  };
  rationale: string;
}

export interface PipelineProgress {
  currentStage: string;
  stageProgress: number; // 0-100
  overallProgress: number; // 0-100
  statusMessage: string;
  estimatedTimeRemaining?: number; // in milliseconds
  startTime?: number; // timestamp when generation started
  logs?: ProgressLog[];
}

export interface ProgressLog {
  timestamp: number;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  details?: unknown;
}

export interface WebSearchResultItem {
  title: string;
  url: string;
  snippet?: string;
  domain: string;
  imageUrl?: string;
}

export interface WebSearchResults {
  success: boolean;
  vertical: string;
  query?: string;
  results: WebSearchResultItem[];
  resultCount: number;
  error?: {
    message: string;
    details?: string;
  };
}

export interface DesignTrend {
  name: string;
  description: string;
  prevalence: number; // 0-100
  examples: string[];
  relevance: number; // 0-100, how relevant for current brief
}

export interface IndustryAnalysis {
  industryName: string;
  confidence: number; // 0-1
  competitorLogos: CompetitorLogo[];
  industryTrends: DesignTrend[];
  designRecommendations: string[];
  uniquenessScore: number; // 0-100
  conventionScore: number; // 0-100
  balanceAnalysis: string;
  score: number;
  potential_issues: PotentialIssue[];
  verification_details: string;
}

export interface PotentialIssue {
  description: string;
  severity: 'low' | 'medium' | 'high';
  elementType: 'color' | 'shape' | 'typography' | 'concept';
  recommendations: string[];
}

export interface CompetitorLogo {
  companyName: string;
  logoDescription: string;
  dominantColors: string[];
  styleCategory: string;
  visualElements: string[];
}

// Animation and Pipeline related types
export interface AnimationExportOptions {
  svgContent: string;
  animationType: string;
  format: 'svg' | 'gif' | 'mp4' | 'webm';
  quality?: number;
  duration?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  includeSource?: boolean;
  fps?: number;
  loop?: boolean;
}

export enum PipelineStage {
  IDLE = 'idle',
  A = 'distillation',
  B = 'moodboard',
  C = 'selection',
  D = 'generation',
  E = 'validation',
  F = 'variants',
  G = 'guidelines',
  H = 'packaging',
  I = 'animation',
  UNIQUENESS = 'uniqueness',
  CACHED = 'cached',
  COMPLETE = 'complete'
}

export interface SVGValidationResult {
  isValid: boolean;
  errors: string[];
  violations: string[];
  warnings: string[];
  issues: { severity: 'critical' | 'warning' | 'info'; message: string }[];
  details?: Record<string, any>;
  securityScore?: number;
  optimizationScore?: number;
  accessibilityScore?: number;
  overallScore?: number;
  designQualityScore?: any; // Using any for now to avoid circular dependencies
  designFeedback?: string;
  repairedSvg?: string;
  modifications?: string[];
  accessibilityAssessment?: SVGAccessibilityAssessment;
}

export interface SVGAccessibilityAssessment {
  contrastRatio: number;
  colorBlindnessFriendly: boolean;
  hasTitle: boolean;
  hasDesc: boolean;
  issues: { level: 'error' | 'warning' | 'info', message: string }[];
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    processingTime?: number;
    apiVersion?: string;
    timestamp?: string;
  };
}

// Error handling types
export interface ErrorDetails {
  code: string;
  message: string;
  context?: Record<string, any>;
  stack?: string;
  timestamp?: string;
}

// Component Props Types
export interface BackgroundSelectorProps {
  backgrounds: Array<{
    id: string;
    name: string;
    gradient: string;
    previewStyle: React.CSSProperties;
  }>;
  selectedBackgroundId?: string;
  onBackgroundChange?: (backgroundId: string) => void;
  className?: string;
}

export interface FileItemProps {
  file: File;
  onRemove: () => void;
  className?: string;
}

export interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export interface VariantSwitcherProps {
  variants: Array<{
    id: string;
    name: string;
    svgCode: string;
    previewUrl?: string;
  }>;
  selectedVariantId?: string;
  onVariantChange?: (variantId: string) => void;
  className?: string;
}

export interface MockupPreviewProps {
  logo: string | SVGLogo;
  template: MockupTemplate;
  customText?: Record<string, string>;
  selectedColorVariant?: string;
  brandName?: string;
  className?: string;
  onDownload?: () => void;
}

// MockupTemplate, MockupType, LogoPlacement, and TextPlaceholder are now defined in lib/mockups/mockup-types.ts

export interface ColorVariant {
  id: string;
  name: string;
  colors: Record<string, string>;
}