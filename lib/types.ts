// Error categories for error handling middleware
export enum ErrorCategory {
  VALIDATION_ERROR = 'validation_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  NOT_FOUND = 'not_found',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  // Add more as needed for future error types
}
import { SVGDesignQualityScore } from './types-agents';
import {
  AnimationOptions as AnimationConfig,
  AnimationEasing,
  AnimationDirection,
} from './animation/types';
import { MockupInstance, MockupTemplate } from './mockups/mockup-types';

export { AnimationEasing, AnimationDirection };
export type { MockupTemplate, MockupInstance };
export type AnimationOptions = AnimationConfig;

export interface MessageProgress {
  stage?: string;
  message: string;
  progress: number;
}

export interface ProgressStage {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number; // 0-100
  details?: string;
}

export interface ProgressLog {
  timestamp: number;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  details?: unknown;
}

export interface PipelineProgress {
  status: 'queued' | 'analyzing' | 'generating' | 'refining' | 'completed' | 'failed';
  progress: number; // 0-100, overall progress
  overallProgress?: number; // For backward compatibility
  message: string;
  currentStage: string;
  stage?: string; // for compatibility with MessageProgress
  stageProgress: number; // 0-100, progress within the current stage
  timeRemaining?: number; // in seconds
  estimatedTimeRemaining?: number; // in milliseconds
  stages?: ProgressStage[];
  logs?: ProgressLog[];
  startTime?: number;
}

export type GenerationProgress = PipelineProgress;

export interface LogoBrief {
  prompt: string;
  style?: string;
  colors?: string[];
  font?: string;
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
  // Add width/height aliases for compatibility with existing code
  width?: number; // Alias for inlineSize
  height?: number; // Alias for blockSize
  svg?: string; // Legacy alias for svgCode for backward compatibility
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface Message {
  role: MessageRole;
  content: string | any[] | Record<string, any>;
  timestamp: Date;
  files?: File[];
  id?: string;
  progress?: MessageProgress;
  assets?: GeneratedAssets;
}

export interface ExtendedFile extends Omit<File, 'name'> {
  id: string;
  name: string;
  status?: 'pending' | 'downloading' | 'completed' | 'error';
  isPrimary?: boolean;
}

export interface FileDownloadInfo {
  id: string;
  name: string;
  url: string;
  size: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  isPrimary?: boolean;
  // Add missing properties that are being accessed
  type: string; // File MIME type
  category?: string; // File category ('animation', 'mockup', etc)
}

export interface DownloadManagerProps {
  files: FileDownloadInfo[];
  packageUrl?: string;
  onDownloadFileAction: (fileId: string) => void;
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
  // Legacy properties for backward compatibility
  pngVersions?: {
    size256?: string | Blob | Uint8Array;
    size512?: string | Blob | Uint8Array;
    size1024?: string | Blob | Uint8Array;
  };
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
  uniquenessAnalysis?: import('./ai-pipeline/stages/stage-uniqueness-analysis').UniquenessAnalysisResult;
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
  COMPLETE = 'complete',
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
  issues: { level: 'error' | 'warning' | 'info'; message: string }[];
}

// A/B Testing Types
export enum TestComponent {
  LOGO_GENERATION_UI = 'logo_generation_ui',
  ONBOARDING_FLOW = 'onboarding_flow',
  PRICING_PAGE = 'pricing_page',
}

export enum TestMetric {
  CONVERSION_RATE = 'conversion_rate',
  ENGAGEMENT = 'engagement',
  USER_SATISFACTION = 'user_satisfaction',
  TIME_TO_CONVERT = 'time_to_convert',
  TOKEN_EFFICIENCY = 'token_efficiency',
}

export enum FeedbackSource {
  SURVEY = 'survey',
  DIRECT_FEEDBACK = 'direct_feedback',
  USAGE_ANALYTICS = 'usage_analytics',
}

export enum TestVariant {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

export interface VariantConfig {
  name: string;
  description: string;
}

export interface MetricResult {
  mean: number;
  median?: number;
  standardDeviation?: number;
  confidenceInterval?: [number, number];
}

export interface TestConfig {
  id: string;
  name: string;
  description: string;
  component: TestComponent;
  variants: {
    [key in TestVariant]?: VariantConfig;
  };
  metrics: TestMetric[];
  feedbackSources: FeedbackSource[];
  minimumSampleSize: number;
  maxDurationDays: number;
  confidenceThreshold: number;
}

export interface TestResults {
  testId: string;
  status: 'running' | 'completed' | 'paused';
  sampleSize: { [key in TestVariant]?: number };
  winner?: TestVariant;
  winnerConfidence?: number;
  metrics: {
    [key in TestMetric]?: {
      [key in TestVariant]?: MetricResult;
    };
  };
  insights: string[];
  recommendations: string[];
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

export interface ApplicationError {
  errorId: string; // Unique identifier for this error instance
  message: string; // Human-readable error message
  category: string; // Error category for grouping similar errors
  code: string; // Error code for programmatic handling
  context?: Record<string, any>; // Additional context for debugging
  timestamp: string; // When the error occurred
  isOperational: boolean; // Whether this is an expected operational error
  isRetryable: boolean; // Whether the operation can be retried
  requestId?: string; // Associated request ID for tracing
  stack?: string; // Stack trace in development
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    category?: string;
    context?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
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
  file: ExtendedFile | FileDownloadInfo;
  onDownloadAction?: (fileId: string) => void;
  className?: string;
}

export interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
  // For backward compatibility with deprecated components
  acceptedFileTypes?: string[];
  maxFileSizeMb?: number;
  disabled?: boolean;
}

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  // For react-dropzone and validation
  maxSize?: number;
  maxCount?: number;
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

// Legacy stage interfaces for backward compatibility
export interface LogoStage {
  id: string;
  name: string;
  duration?: number;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  estimatedTime?: number;
}

export interface StagePreview {
  stageId: string;
  previewData: string;
  contentType?: 'svg' | 'png' | 'html';
  content?: string; // Alias for previewData
  timestamp: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface EffectsConfig {
  applyLighting: boolean;
  lightDirection: 'top' | 'left' | 'right' | 'bottom';
  lightIntensity: number;
  applyPerspective: boolean;
  perspectiveTransform?: {
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    translateZ: number;
  };
  applyShadow: boolean;
  shadowBlur: number;
  shadowOpacity: number;
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

export interface ApplicationError {
  errorId: string; // Unique identifier for this error instance
  message: string; // Human-readable error message
  category: string; // Error category for grouping similar errors
  code: string; // Error code for programmatic handling
  context?: Record<string, any>; // Additional context for debugging
  timestamp: string; // When the error occurred
  isOperational: boolean; // Whether this is an expected operational error
  isRetryable: boolean; // Whether the operation can be retried
  requestId?: string; // Associated request ID for tracing
  stack?: string; // Stack trace in development
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    category?: string;
    context?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
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
  file: ExtendedFile | FileDownloadInfo;
  onDownloadAction?: (fileId: string) => void;
  className?: string;
}

export interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
  // For backward compatibility with deprecated components
  acceptedFileTypes?: string[];
  maxFileSizeMb?: number;
  disabled?: boolean;
}

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  // For react-dropzone and validation
  maxSize?: number;
  maxCount?: number;
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

// Legacy stage interfaces for backward compatibility
export interface LogoStage {
  id: string;
  name: string;
  duration?: number;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  estimatedTime?: number;
}

export interface StagePreview {
  stageId: string;
  previewData: string;
  contentType?: 'svg' | 'png' | 'html';
  content?: string; // Alias for previewData
  timestamp: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface EffectsConfig {
  applyLighting: boolean;
  lightDirection: 'top' | 'left' | 'right' | 'bottom';
  lightIntensity: number;
  applyPerspective: boolean;
  perspectiveTransform?: {
    rotateX: number;
    rotateY: number;
    rotateZ: number;
    translateZ: number;
  };
  applyShadow: boolean;
  shadowBlur: number;
  shadowOpacity: number;
}
