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
    if (!feedback.sessionId || !feedback.timestamp || feedback.overallRating < 1 || feedback.overallRating > 5) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid feedback data. Session ID, timestamp, and valid overall rating (1-5) are required.' 
        },
        { status: 400 }
      );
    }
    
    // TODO: In a production environment, store the feedback in a database
    // For now, we'll just log it and return a success response
    
    // Generate a unique ID for the feedback (in production, this would come from the database)
    const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Log the feedback (replace with database storage in production)
    logger.info('Logo feedback received', { 
      feedbackId,
      sessionId: feedback.sessionId,
      logoId: feedback.logoId,
      overallRating: feedback.overallRating
    });
    
    // Return a success response
    return NextResponse.json({
      success: true,
      message: 'Feedback received successfully',
      feedbackId
    });
  } catch (error) {
    // Log the error
    logger.error('Error processing logo feedback', { error });
    
    // Return an error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process feedback. Please try again later.' 
      },
      { status: 500 }
    );
  }
}