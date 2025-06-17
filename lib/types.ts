export interface LogoBrief {
  prompt: string;
  style?: string;
  colors?: string[];
  keywords?: string[];
  image_uploads?: File[];
}

export interface DesignSpec {
  brand_name: string;
  brand_description: string;
  style_preferences: string;
  color_palette: string;
  imagery: string;
  target_audience: string;
  additional_requests: string;
}

export interface MoodboardConcept {
  conceptName: string;
  description: string;
  imageUrl: string;
  colorPalette: string[];
  fonts?: string[];
  keywords: string[];
}

export type LogoConcept = MoodboardConcept;

export interface LogoVariants {
  monochrome: {
    black: string;
    white: string;
  };
  favicon: {
    svg: string;
    png32: Buffer;
    ico: Buffer;
  };
  pngVariants: {
    png256: Buffer;
    png512: Buffer;
    png1024: Buffer;
  };
}

export interface GenerationResult {
  success: boolean;
  message?: string;
  logoSvg?: string;
  logoPngUrls?: {
    size256: string;
    size512: string;
    size1024: string;
  };
  monochromeVariants?: {
    blackSvg: string;
    whiteSvg: string;
  };
  faviconIcoUrl?: string;
  brandGuidelinesUrl?: string; // URL to HTML/PDF
  downloadUrl?: string; // URL to ZIP package
  error?: {
    stage: string;
    message: string;
  };
}

export interface GenerationProgress {
  stage: string;
  progress: number;
  message: string;
  preview?: string;
  // Additional properties for ProgressTracker compatibility
  stages?: Stage[];
  currentStageId?: string | null;
  overallProgress?: number;
  estimatedTimeRemaining?: number | null;
}

export interface GeneratedAssets {
  logo_svg: string;
  logo_mono_light: string;
  logo_mono_dark: string;
  favicon_svg: string;
  png_exports: {
    png_256: Blob;
    png_512: Blob;
    png_1024: Blob;
  };
  favicon_ico: Blob;
  brand_guidelines: string;
  // Additional properties for component compatibility
  primaryLogoSVG?: SVGLogo;
  individualFiles?: FileDownloadInfo[];
  zipPackageUrl?: string;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'error';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  imageUrl?: string;
  isLoading?: boolean;
  timestamp: Date;
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
}

export interface DesignSpec {
  brand_name: string;
  brand_description: string;
  style_preferences: string;
  color_palette: string;
  imagery: string;
  target_audience: string;
  additional_requests: string;
}

export interface SVGLogo {
  svgCode: string;
  name: string;
}

export interface PNGVariant extends SVGLogo {
  width: number;
  height: number;
  url: string; // URL to the PNG file
}

export interface Favicon extends PNGVariant {
  icoUrl: string; // URL to the ICO file
}

export interface BrandGuidelines {
  htmlContent: string;
  name: string;
}

// Defines a single stage in the logo generation pipeline
export interface Stage {
  id: string; // e.g., "distillation", "moodboard", "generation"
  name: string; // User-friendly name, e.g., "Understanding Your Brief"
  status: 'pending' | 'in-progress' | 'completed' | 'error' | 'skipped';
  estimatedDuration: number; // in seconds
  elapsedTime?: number; // in seconds, for the current or completed stage
  progress?: number; // 0-100, for the 'in-progress' stage
  details?: string; // Optional details or error messages
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

export interface LogoGenerationState {
  isLoading: boolean;
  error: APIError | null;
  progress: number; // Overall progress 0-100
  currentStage: string | null; // Name of the current stage
  estimatedTimeRemaining: number | null; // In seconds
  generatedLogoSvg: string | null; // SVG code of the primary logo
  assets: LogoGenerationAssets | null;
  // New detailed progress state
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

// File download information type for assets
export interface FileDownloadInfo {
  id: string;
  name: string;
  type: string; // File type like 'SVG', 'PNG', 'ICO', 'HTML', 'ZIP'
  size: number; // File size in bytes
  url: string; // Download URL
  isPrimary?: boolean; // Whether this is the primary/main file
  status?: 'pending' | 'downloading' | 'completed' | 'error';
  progress?: number; // Download progress 0-100
}

// Types for Download Manager
export interface DownloadableFile {
  id: string;
  name: string;
  url: string;
  type: string; // e.g., 'SVG', 'PNG', 'ZIP', 'HTML'
  size: number; // in bytes
  status?: 'pending' | 'downloading' | 'completed' | 'error'; // Made optional to match FileDownloadInfo
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
