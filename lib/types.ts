export interface LogoBrief {
  prompt: string;
  style?: string;
  colors?: string[];
  keywords?: string[];
  image_uploads?: File[];
}

export interface DesignSpec {
  brandName: string;
  slogan?: string;
  industry: string;
  targetAudience: string;
  stylePreferences: string[];
  colorPalette: string[];
  mustHaveElements?: string[];
  avoidElements?: string[];
  moodboardUrls?: string[];
}

export interface MoodboardConcept {
  conceptName: string;
  description: string;
  imageUrl: string;
  colorPalette: string[];
  fonts?: string[];
  keywords: string[];
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
