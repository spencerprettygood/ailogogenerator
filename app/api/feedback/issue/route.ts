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
    
    // Store feedback in database
    try {
      const { databaseService } = await import('@/lib/services/database-service');
      
      const savedFeedback = await databaseService.createFeedback({
        generationId: feedback.sessionId,
        type: 'issue',
        feedbackText: JSON.stringify({
          issueType: feedback.issueType,
          description: feedback.description,
          currentStage: feedback.currentStage,
          screenshot: feedback.screenshot ? 'Screenshot included' : undefined,
          browserInfo: feedback.browserInfo
        })
      });
      
      // Log the feedback for monitoring
      logger.info('Live issue feedback received and stored', { 
        feedbackId: savedFeedback.id,
        sessionId: feedback.sessionId,
        issueType: feedback.issueType,
        currentStage: feedback.currentStage,
        hasScreenshot: !!feedback.screenshot
      });
      
      // Return a success response
      return NextResponse.json({
        success: true,
        message: 'Issue report received successfully',
        feedbackId: savedFeedback.id
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