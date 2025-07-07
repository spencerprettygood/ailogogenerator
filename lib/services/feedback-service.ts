import { LogoFeedback, LiveFeedback, FeedbackResponse } from '@/lib/types-feedback';

/**
 * Service for handling feedback submissions
 */
export class FeedbackService {
  /**
   * Submit logo feedback to the API
   *
   * @param feedback The logo feedback data
   * @returns Promise that resolves with the API response
   */
  static async submitLogoFeedback(feedback: LogoFeedback): Promise<FeedbackResponse> {
    try {
      const response = await fetch('/api/feedback/logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to submit logo feedback:', error);
      throw error;
    }
  }

  /**
   * Submit live issue feedback to the API
   *
   * @param feedback The live issue feedback data
   * @returns Promise that resolves with the API response
   */
  static async submitIssueFeedback(feedback: LiveFeedback): Promise<FeedbackResponse> {
    try {
      const response = await fetch('/api/feedback/issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to submit issue feedback:', error);
      throw error;
    }
  }
}
