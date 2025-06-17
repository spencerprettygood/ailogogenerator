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
  progress?: GenerationProgress;
  assets?: GeneratedAssets;
}

// Logo generation types
export interface LogoBrief {
  prompt: string;
  image_uploads?: File[];
  style?: string;
  colors?: string;
  keywords?: string[];
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
  width?: number;
  height?: number;
  name?: string;
}

export interface GenerationProgress {
  stage: string;
  stageProgress: number; // 0-100
  overallProgress: number; // 0-100
  message: string;
  progress: number; // 0-100, used in the UI
  estimatedTimeRemaining?: number; // seconds
}

export interface LogoGenerationState {
  isLoading?: boolean;
  error?: APIError | null;
  progress?: number; // Overall progress 0-100
  currentStage?: string | null; // Name of the current stage
  currentStageId: string | null;
  stages: Stage[];
  overallProgress: number; // 0-100
  estimatedTimeRemaining: number | null; // seconds
  generatedLogoSvg?: string | null; // SVG code of the primary logo
  assets?: LogoGenerationAssets | null;
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
  favicon?: {
    ico: string;
    svg: string;
  };
  brandGuidelines?: string;
  individualFiles?: FileDownloadInfo[];
  zipPackageUrl?: string;
}

export interface GenerationResult {
  success: boolean;
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
  brandGuidelinesUrl?: string;
  downloadUrl?: string;
  error?: {
    message: string;
    details?: string;
  };
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

// SVGLogo interface is already defined above

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

// LogoGenerationState interface is already defined above

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
  size?: number; // in bytes
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
