export interface LogoBrief {
  prompt: string;
  image_uploads?: File[];
  industry?: string;
  uniqueness_preference?: number; // 0-10, higher means more unique
}

export interface DesignSpec {
  brand_name: string;
  description: string;
  industry?: string;
  color_preferences?: string[];
  style_preferences?: string[];
  keywords?: string[];
  target_audience?: string;
  avoid?: string[];
  inspiration?: string[];
  uniqueness_level?: number; // 0-10 scale
  additional_context?: string;
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

export interface GenerationProgress {
  status: 'queued' | 'analyzing' | 'generating' | 'refining' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  timeRemaining?: number; // in seconds
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