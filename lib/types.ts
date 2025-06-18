// Message types
export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  files?: File[];
  imageUrl?: string;
  isLoading?: boolean;
  actions?: React.ReactNode;
  // Additional properties for chat functionality
  progress?: {
    stage: string;
    message: string;
    progress: number; // Progress percentage 0-100
    stageProgress?: number;
    overallProgress?: number;
  };
  assets?: GeneratedAssets;
}

// Logo generation types
export interface LogoBrief {
  prompt: string;
  image_uploads?: File[];
  style?: string;
  colors?: string;
  keywords?: string[] | string;
  industry?: string;
  includeAnimations?: boolean;
  animationOptions?: any; // Will be typed properly when imported
}

export interface DesignSpec {
  brand_name: string;
  brand_description: string;
  style_preferences: string;
  color_palette: string;
  imagery: string;
  target_audience: string;
  additional_requests: string;
  industry?: string; // Industry category for specialized design templates
  industry_confidence?: number; // Confidence score for industry detection (0-1)
}

export interface SVGLogo {
  svgCode: string;
  width: number;
  height: number;
}

export interface GenerationProgress {
  // Enhanced fields
  currentStage: string;
  stageProgress: number; // 0-100
  overallProgress: number; // 0-100
  statusMessage: string;
  estimatedTimeRemaining?: number; // seconds
  elapsedTime?: number; // seconds
  reliability?: number; // 0-1 indicating reliability of time estimate
  
  // Legacy fields for backward compatibility
  stage?: string;
  message?: string;
  progress?: number; // 0-100, used by UI components
}

export interface LogoGenerationState {
  currentStageId: string | null;
  stages: Stage[]; // Use the Stage interface
  overallProgress: number; // 0-100
  estimatedTimeRemaining: number | null; // seconds
}

export interface FileDownloadInfo {
  id: string;
  name: string;
  type: string; // File type like 'SVG', 'PNG', 'ICO', 'HTML', 'ZIP'
  url: string; // Download URL
  size?: number; // File size in bytes
  description?: string;
  previewUrl?: string;
  isPrimary?: boolean; // Whether this is the primary/main file
  status?: 'pending' | 'downloading' | 'completed' | 'error';
  progress?: number; // Download progress 0-100
}

export interface GeneratedAssets {
  primaryLogoSVG?: SVGLogo;
  monochromeSVGs?: {
    black: SVGLogo;
    white: SVGLogo;
  };
  pngVersions?: {
    size256: string;
    size512: string;
    size1024: string;
  };
  // Enhanced versions
  transparentPngVersions?: {
    size256: string;
    size512: string;
    size1024: string;
  };
  monochromePngVersions?: {
    black: {
      size256: string;
      size512: string;
    };
    white: {
      size256: string;
      size512: string;
    };
  };
  favicon?: {
    ico: string;
    png?: string;
    svg: string;
  };
  // Animation assets
  animatedSvg?: {
    svg: string;
    css: string;
    js?: string;
    previewUrl?: string;
  };
  brandGuidelines?: string;
  individualFiles?: FileDownloadInfo[];
  zipPackageUrl?: string;
  // Uniqueness analysis
  uniquenessAnalysis?: UniquenessAnalysisResult;
}

// Uniqueness analysis types
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

export interface GenerationResult {
  success: boolean;
  brandName?: string;
  logoSvg?: string;
  logoPngUrls?: {
    size256: string;
    size512: string;
    size1024: string;
  };
  // Enhanced variant URLs
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
  faviconIcoUrl?: string; // For backward compatibility
  brandGuidelinesUrl?: string;
  downloadUrl?: string;
  // Animation properties
  animatedSvg?: string;
  animationCss?: string;
  animationJs?: string;
  // Uniqueness analysis
  uniquenessAnalysis?: UniquenessAnalysisResult;
  error?: {
    message: string;
    details?: string;
  };
  // Additional properties that were floating
  content?: string;
  imageUrl?: string;
  isLoading?: boolean;
  timestamp?: Date;
  actions?: React.ReactNode;
  // Additional properties for chat functionality
  files?: File[];
  progress?: GenerationProgress;
  assets?: GeneratedAssets;
}

export interface ChatInterfaceProps {
  messages: Message[];
  isGenerating: boolean;
  onSendMessageAction: (content: string, files?: File[]) => void;
  className?: string;
}

export interface LogoGenerationOptions {
  brandName: string;
  brief: string;
  stylePreferences?: string;
  colorPalette?: string;
  imagery?: string;
  targetAudience?: string;
  referenceImages?: File[];
  includeGuidelines?: boolean;
  includeAnimations?: boolean;
  animationType?: string;
  animationOptions?: any; // Will be typed properly when imported
  industry?: string; // Specific industry category
}

export interface DesignSpec {
  brand_name: string;
  brand_description: string;
  style_preferences: string;
  color_palette: string;
  imagery: string;
  target_audience: string;
  additional_requests: string;
  industry?: string; // Industry category for specialized design templates
  industry_confidence?: number; // Confidence score for industry detection (0-1)
}

export interface SVGLogo {
  svgCode: string;
  name: string;
}

export interface PNGVariant extends SVGLogo {
  width: number;
  height: number;
  url: string; // URL to the PNG file
  buffer?: Blob | Buffer; // Raw PNG data, can be Blob in browser or Buffer on server
}

export interface Favicon extends PNGVariant {
  icoUrl: string; // URL to the ICO file
}

export interface BrandGuidelines {
  htmlContent: string;
  name: string;
}

// Defines a single stage in the logo generation pipeline
export interface LogoStage {
  id: string; // e.g., "stage-a", "stage-b", etc.
  name: string; // User-friendly name, e.g., "Understanding Your Brief"
  status: 'pending' | 'in-progress' | 'completed' | 'error' | 'skipped';
  estimatedDuration: number; // in milliseconds
  elapsedTime?: number; // in milliseconds, for the current or completed stage
  progress?: number; // 0-100, for the 'in-progress' stage
  details?: string; // Optional details or error messages
  order: number; // Order in the pipeline (0-based)
  allowParallel?: boolean; // Whether this stage can run in parallel with others
  isCritical?: boolean; // Whether this stage is critical for the final result
  previewType?: 'svg' | 'image' | 'html' | 'text'; // Type of preview this stage can generate
}

// For backward compatibility
export interface Stage extends Omit<LogoStage, 'estimatedDuration' | 'elapsedTime' | 'order' | 'allowParallel' | 'isCritical' | 'previewType'> {
  estimatedDuration: number; // in seconds
  elapsedTime?: number; // in seconds, for the current or completed stage
}

// Props for the individual stage item component
export interface StageItemProps {
  stage: Stage;
  isCurrent: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
}

// Props for the overall progress tracker component
export interface ProgressTrackerProps {
  stages: Stage[];
  currentStageId: string | null;
  overallProgress: number; // 0-100, overall progress
  estimatedRemainingTime: number | null; // in seconds
  onStageClick?: (stageId: string) => void; // Optional: for future interactivity
}


export interface LogoGenerationAssets {
  primaryLogoSVG?: SVGLogo;
  pngVariants?: PNGVariant[];
  favicon?: Favicon;
  brandGuidelines?: BrandGuidelines;
  zipPackageUrl?: string;
  individualFiles?: Array<{ name: string; url: string; type: string; size: number }>;
}

// This LogoGenerationState interface is already defined above
export interface LogoGenerationStateExtended {
  isLoading: boolean;
  error: APIError | null;
  progress: number; // Overall progress 0-100
  currentStage: string | null; // Name of the current stage
  estimatedTimeRemaining: number | null; // In seconds
  generatedLogoSvg: string | null; // SVG code of the primary logo
  assets: LogoGenerationAssets | null;
  // These properties are already in LogoGenerationState
  stages: Stage[];
  currentStageId: string | null;
  overallProgress: number; // 0-100
}

export interface LogoGenerationResult extends LogoGenerationAssets {
  success: boolean;
  message?: string;
  // Ensure these are part of the result if they are to be used by the download manager
  finalPackageUrl?: string;
  // individualFiles should be part of LogoGenerationAssets
}


export interface UseLogoGenerationProps {
  onSuccess?: (result: LogoGenerationResult) => void;
  onError?: (error: APIError) => void;
  onProgress?: (progressData: Partial<LogoGenerationState>) => void;
}

export interface APIError {
  message: string;
  statusCode?: number;
  details?: Record<string, unknown> | string;
}

export interface FileValidationRule {
  maxSizeMb?: number;
  allowedTypes?: string[]; // MIME types e.g. ['image/jpeg', 'image/png']
  maxSize?: number; // Size in bytes
  maxCount?: number; // Maximum number of files
  acceptedFileTypes?: string[]; // Alternative name for allowedTypes
}

export interface ValidatedFile extends File {
  previewUrl?: string;
  errors?: string[];
}

// FileDownloadInfo interface is already defined above

// Types for Download Manager
export interface DownloadableFile {
  id: string;
  name: string;
  url: string;
  type: string; // e.g., 'SVG', 'PNG', 'ZIP', 'HTML'
  size?: number; // in bytes, made optional to match FileDownloadInfo
  status?: 'pending' | 'downloading' | 'completed' | 'error';
  progress?: number; // 0-100 for downloading status
  isPrimary?: boolean; // e.g. the main SVG or ZIP
}

export interface DownloadManagerProps {
  files: DownloadableFile[];
  packageUrl?: string; // URL for "Download All" ZIP
  onDownloadFileAction: (fileId: string) => void;
  onDownloadAllAction: () => void;
  brandName?: string;
}

export interface FileItemProps {
  file: DownloadableFile;
  onDownloadAction: (fileId: string) => void;
}

// Types for Logo Display
export interface LogoDisplayProps {
  svgCode: string | null;
  variants?: Array<{ id: string; name: string; svgCode: string }>; // Ensure id is part of the variant type
  availableBackgrounds?: string[]; // Array of color strings or class names
  initialBackground?: string;
  className?: string;
  onCustomize?: (customizedSvgCode: string) => void;
}

export interface VariantSwitcherProps {
  variants: Array<{ id: string; name: string; svgCode: string }>;
  selectedVariantId: string;
  onSelectVariantAction: (variantId: string) => void;
}

export interface BackgroundSelectorProps {
  backgrounds: string[]; // Hex codes or Tailwind color classes
  selectedBackground: string;
  onSelectBackgroundAction: (background: string) => void;
}

export interface FileValidationOptions {
  maxCount?: number;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

export interface FileUploadProps {
  onFilesChange?: (files: File[]) => void;
  maxFiles?: number;
  maxFileSizeMb?: number;
  acceptedFileTypes?: string[];
  className?: string;
  disabled?: boolean;
}

/**
 * Stage preview data interface
 */
export interface StagePreview {
  stageId: string;
  content: string;
  contentType: 'svg' | 'png' | 'html' | 'text';
  timestamp: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Pipeline progress information
 */
export interface PipelineProgress {
  currentStage: string;
  stageProgress: number; // 0-100
  overallProgress: number; // 0-100
  statusMessage: string;
}

/**
 * Streaming update types for the enhanced streaming implementation
 */
export enum StreamUpdateType {
  START = 'start',
  PROGRESS = 'progress',
  PREVIEW = 'preview',
  STAGE_COMPLETE = 'stage_complete',
  RESULT = 'result',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  CACHE = 'cache',
  HEARTBEAT = 'heartbeat',
  END = 'end'
}

// Mockup Preview System Types
export enum MockupType {
  BUSINESS_CARD = 'business_card',
  WEBSITE = 'website',
  TSHIRT = 'tshirt',
  STOREFRONT = 'storefront',
  SOCIAL_MEDIA = 'social_media',
  MOBILE_APP = 'mobile_app',
  LETTERHEAD = 'letterhead',
  BILLBOARD = 'billboard',
  PACKAGING = 'packaging'
}

export interface MockupTemplate {
  id: string;
  type: MockupType;
  name: string;
  description: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  placeholderUrl?: string;
  aspectRatio: number; // width/height
  logoPlacement: {
    x: number; // percentage (0-100)
    y: number; // percentage (0-100)
    width: number; // percentage of mockup width
    height: number; // percentage of mockup height
    rotation?: number; // degrees
    preserveAspectRatio: boolean;
  };
  colorVariants?: string[]; // List of background colors or themes available
  textPlaceholders?: Array<{
    id: string;
    name: string;
    default: string;
    x: number; // percentage
    y: number; // percentage
    maxWidth: number; // percentage
    fontSize: number; // in pixels or relative units
    color: string;
    fontFamily?: string;
  }>;
}

export interface MockupPreviewProps {
  logo: string | SVGLogo; // SVG code or SVGLogo object
  template: MockupTemplate;
  customText?: Record<string, string>; // Key is textPlaceholder.id, value is custom text
  selectedColorVariant?: string;
  brandName?: string;
  className?: string;
  onDownload?: () => void;
}

export interface MockupSelectorProps {
  templates: MockupTemplate[];
  selectedTemplateId: string | null;
  onSelectTemplate: (templateId: string) => void;
  logo: string | SVGLogo;
  brandName?: string;
  className?: string;
}

export interface MockupPreviewSystemProps {
  logo: string | SVGLogo;
  brandName?: string;
  templates?: MockupTemplate[];
  className?: string;
  onDownload?: (mockupId: string, format: 'png' | 'jpg') => void;
  initialTemplateId?: string;
}