import { NextRequest, NextResponse } from 'next/server';
import { LiveFeedback, FeedbackResponse } from '@/lib/types-feedback';
import { logger } from '@/lib/utils/logger';

/**
 * API endpoint for saving live feedback about issues
 * 
 * @param request The incoming request with feedback data
 * @returns Response with success status and message
 */
export async function POST(request: NextRequest): Promise<NextResponse<FeedbackResponse>> {
  try {
    // Parse the request body
    const feedback: LiveFeedback = await request.json();
    
    // Validate the feedback data
    if (!feedback.sessionId || !feedback.timestamp || !feedback.issueType) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid feedback data. Session ID, timestamp, and issue type are required.' 
        },
        { status: 400 }
      );
    }
    
    // Check if the screenshot is too large (if included)
    if (feedback.screenshot && feedback.screenshot.length > 5 * 1024 * 1024) { // 5MB limit
      // Remove the screenshot if it's too large
      feedback.screenshot = 'Screenshot too large, removed';
    }
    
    // TODO: In a production environment, store the feedback in a database
    // For now, we'll just log it and return a success response
    
    // Generate a unique ID for the feedback (in production, this would come from the database)
    const feedbackId = `issue-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Log the feedback (replace with database storage in production)
    logger.info('Live issue feedback received', { 
      feedbackId,
      sessionId: feedback.sessionId,
      issueType: feedback.issueType,
      currentStage: feedback.currentStage,
      hasScreenshot: !!feedback.screenshot
    });
    
    // Return a success response
    return NextResponse.json({
      success: true,
      message: 'Issue report received successfully',
      feedbackId
    });
  } catch (error) {
    // Log the error
    logger.error('Error processing issue feedback', { error });
    
    // Return an error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process issue report. Please try again later.' 
      },
      { status: 500 }
    );
  }
}