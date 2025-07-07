import { NextRequest, NextResponse } from 'next/server';
import { LogoFeedback, FeedbackResponse } from '@/lib/types-feedback';
import { logger } from '@/lib/utils/logger';

/**
 * API endpoint for saving logo feedback
 *
 * @param request The incoming request with feedback data
 * @returns Response with success status and message
 */
export async function POST(request: NextRequest): Promise<NextResponse<FeedbackResponse>> {
  try {
    // Parse the request body
    const feedback: LogoFeedback = await request.json();

    // Validate the feedback data
    if (
      !feedback.sessionId ||
      !feedback.timestamp ||
      feedback.overallRating < 1 ||
      feedback.overallRating > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Invalid feedback data. Session ID, timestamp, and valid overall rating (1-5) are required.',
        },
        { status: 400 }
      );
    }

    // Store feedback in database
    try {
      const { databaseService } = await import('@/lib/services/database-service');

      const savedFeedback = await databaseService.createFeedback({
        generationId: feedback.sessionId,
        type: 'logo',
        rating: feedback.overallRating,
        feedbackText: JSON.stringify({
          logoId: feedback.logoId,
          designQualityRating: feedback.designQualityRating,
          relevanceRating: feedback.relevanceRating,
          uniquenessRating: feedback.uniquenessRating,
          feedbackCategories: feedback.feedbackCategories,
          additionalComments: feedback.additionalComments,
        }),
      });

      // Log the feedback for monitoring
      logger.info('Logo feedback received and stored', {
        feedbackId: savedFeedback.id,
        sessionId: feedback.sessionId,
        logoId: feedback.logoId,
        overallRating: feedback.overallRating,
      });

      // Return a success response
      return NextResponse.json({
        success: true,
        message: 'Feedback received successfully',
        feedbackId: savedFeedback.id,
      });
    } catch (error) {
      // Log the error
      logger.error('Error processing logo feedback', { error });

      // Return an error response
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to process feedback. Please try again later.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Log the error
    logger.error('Error processing logo feedback', { error });

    // Return an error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process feedback. Please try again later.',
      },
      { status: 500 }
    );
  }
}
