export interface LogoBrief {
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
      lineHeight: number;
      letterSpacing?: string;
    };
    body?: {
      size: string;
      weight: number;
      lineHeight: number;
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
  width: number;
  height: number;
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

export interface GenerationProgress {
  status: 'queued' | 'analyzing' | 'generating' | 'refining' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  timeRemaining?: number; // in seconds
  stage?: string; // Stage identifier (A, B, C, etc.)
  estimatedTimeRemaining?: number; // in milliseconds
  stages?: Array<Record<string, unknown>>; // Array of stage objects for multi-stage progress
  currentStageId?: string; // Current stage ID
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
  category?: 'logo' | 'favicon' | 'guideline' | 'animation' | 'package' | 'other';
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
}

export interface GenerationResult {
  success: boolean;
  id?: string;
  brandName?: string;
  logos?: SVGLogo[];
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
  details?: any;
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

export interface AnimationOptions {
  type: string; // 'fade', 'rotate', 'pulse', etc.
  timing: {
    duration: number; // in seconds
    delay?: number; // in seconds
    easing?: string;
    iterations?: number;
    direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  };
  trigger?: string; // 'load', 'hover', 'click'
  elements?: string[];
  stagger?: number;
  customKeyframes?: string;
  customCSS?: string;
  jsCode?: string;
  transformOrigin?: string;
  sequenceOrder?: string[];
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

export interface ProgressStage {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
}

export interface SVGValidationResult {
  isValid: boolean;
  errors: string[];
  violations: string[];
  warnings: string[];
  issues: string[];
  details?: Record<string, any>;
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

export { MockupType } from './mockups/mockup-types';