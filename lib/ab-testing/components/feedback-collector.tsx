import React, { useState } from 'react';
import { FeedbackSource, TestMetric } from '../types';

interface FeedbackCollectorProps {
  sessionId: string | null;
  onSubmitFeedback: (
    metric: string, 
    value: number | string | boolean, 
    source: string,
    context?: Record<string, any>
  ) => void;
  variant?: string;
  brandName?: string;
  className?: string;
}

/**
 * Component for collecting explicit user feedback on logo generations
 */
export const FeedbackCollector: React.FC<FeedbackCollectorProps> = ({
  sessionId,
  onSubmitFeedback,
  variant,
  brandName,
  className = ''
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  
  // Individual quality aspect ratings
  const [aspectRatings, setAspectRatings] = useState({
    aesthetics: 0,
    relevance: 0,
    uniqueness: 0,
    memorability: 0,
    simplicity: 0
  });

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleAspectRatingChange = (aspect: string, value: number) => {
    setAspectRatings(prev => ({
      ...prev,
      [aspect]: value
    }));
  };

  const handleSubmit = () => {
    if (!sessionId || rating === null) return;
    
    // Submit overall satisfaction rating
    onSubmitFeedback(
      TestMetric.USER_SATISFACTION, 
      rating, 
      FeedbackSource.EXPLICIT_RATING
    );
    
    // Submit detailed feedback if provided
    if (showDetailedFeedback) {
      Object.entries(aspectRatings).forEach(([aspect, value]) => {
        onSubmitFeedback(
          `quality_${aspect}`,
          value,
          FeedbackSource.EXPLICIT_RATING
        );
      });
    }
    
    // Submit text feedback if provided
    if (feedbackText.trim()) {
      onSubmitFeedback(
        'text_feedback',
        feedbackText,
        FeedbackSource.EXPLICIT_RATING
      );
    }
    
    setSubmitted(true);
  };

  if (!sessionId) return null;
  
  if (submitted) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 mb-4 ${className}`}>
        <p className="text-green-600 font-medium">Thanks for your feedback!</p>
        <p className="text-sm text-gray-600">
          Your input helps us improve our logo generation.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-lg p-4 mb-4 ${className}`}>
      <h3 className="font-medium text-gray-900 mb-2">
        How satisfied are you with {brandName ? `the ${brandName} logo` : 'your logo'}?
      </h3>
      
      <div className="flex space-x-2 mb-4">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => handleRatingClick(value)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors
              ${rating === value 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            aria-label={`${value} star${value !== 1 ? 's' : ''}`}
          >
            {value}
          </button>
        ))}
      </div>
      
      <button
        onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
        className="text-sm text-blue-600 hover:text-blue-800 mb-4"
      >
        {showDetailedFeedback ? 'Hide detailed feedback' : 'Give detailed feedback'}
      </button>
      
      {showDetailedFeedback && (
        <div className="mb-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Please rate these aspects of your logo:</p>
          
          {Object.entries({
            aesthetics: 'Visual appeal',
            relevance: 'Relevance to brand',
            uniqueness: 'Uniqueness',
            memorability: 'Memorability',
            simplicity: 'Simplicity'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center">
              <span className="text-sm text-gray-600 w-32">{label}</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={`${key}-${value}`}
                    onClick={() => handleAspectRatingChange(key, value)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                      ${aspectRatings[key as keyof typeof aspectRatings] === value 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    aria-label={`${value} for ${label}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="feedback-text" className="block text-sm font-medium text-gray-700 mb-1">
          Any additional comments?
        </label>
        <textarea
          id="feedback-text"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md text-sm"
          rows={3}
          placeholder="What did you like or dislike about the logo?"
        />
      </div>
      
      <button
        onClick={handleSubmit}
        disabled={rating === null}
        className={`px-4 py-2 rounded-md text-white text-sm font-medium
          ${rating === null 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        Submit Feedback
      </button>
    </div>
  );
};

export default FeedbackCollector;