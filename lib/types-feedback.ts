/**
 * Types for the feedback systems
 */

/**
 * Self-reporting feedback data structure
 */
export interface LogoFeedback {
  // Metadata
  sessionId: string;
  timestamp: string;
  logoId?: string;

  // Rating data
  overallRating: number; // 1-5 stars

  // Category ratings
  designQualityRating?: number;
  relevanceRating?: number;
  uniquenessRating?: number;

  // Additional information
  feedbackCategories?: FeedbackCategory[];
  additionalComments?: string;
}

/**
 * Categories of feedback for the self-reporting system
 */
export type FeedbackCategory =
  | 'designQuality'
  | 'colorChoice'
  | 'typography'
  | 'uniqueness'
  | 'relevance'
  | 'overall';

/**
 * Live feedback data structure for reporting issues during generation
 */
export interface LiveFeedback {
  // Metadata
  sessionId: string;
  timestamp: string;
  currentStage?: string;

  // Issue data
  issueType: IssueType;

  // Additional information
  description?: string;
  screenshot?: string; // Base64 encoded image
  browserInfo?: BrowserInfo;
}

/**
 * Types of issues that can be reported in the live feedback system
 */
export type IssueType =
  | 'generationFailed'
  | 'slowResponse'
  | 'unexpectedResult'
  | 'uiIssue'
  | 'other';

/**
 * Browser information for debugging purposes
 */
export interface BrowserInfo {
  userAgent: string;
  windowWidth: number;
  windowHeight: number;
  url: string;
}

/**
 * Response from the feedback API endpoints
 */
export interface FeedbackResponse {
  success: boolean;
  message: string;
  feedbackId?: string;
}
