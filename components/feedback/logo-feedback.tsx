'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { FeedbackCategory, LogoFeedback } from '@/lib/types-feedback';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LogoFeedbackProps {
  logoId?: string;
  sessionId: string;
  onClose: () => void;
  onSubmit: (feedback: LogoFeedback) => Promise<void>;
}

export function LogoFeedback({ logoId, sessionId, onClose, onSubmit }: LogoFeedbackProps) {
  const [overallRating, setOverallRating] = useState<number>(0);
  const [designQualityRating, setDesignQualityRating] = useState<number>(0);
  const [relevanceRating, setRelevanceRating] = useState<number>(0);
  const [uniquenessRating, setUniquenessRating] = useState<number>(0);
  const [selectedCategories, setSelectedCategories] = useState<FeedbackCategory[]>([]);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const feedbackCategories: { label: string; value: FeedbackCategory }[] = [
    { label: 'Design Quality', value: 'designQuality' },
    { label: 'Color Choice', value: 'colorChoice' },
    { label: 'Typography', value: 'typography' },
    { label: 'Uniqueness', value: 'uniqueness' },
    { label: 'Relevance', value: 'relevance' },
    { label: 'Overall Experience', value: 'overall' },
  ];

  const toggleCategory = (category: FeedbackCategory) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSubmit = async () => {
    if (overallRating === 0) return;

    setIsSubmitting(true);
    
    const feedback: LogoFeedback = {
      sessionId,
      timestamp: new Date().toISOString(),
      logoId,
      overallRating,
      designQualityRating: designQualityRating || undefined,
      relevanceRating: relevanceRating || undefined,
      uniquenessRating: uniquenessRating || undefined,
      feedbackCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
      additionalComments: comments.trim() || undefined,
    };

    try {
      await onSubmit(feedback);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, setRating, size = 24 }: { rating: number; setRating: (r: number) => void; size?: number }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          className="focus:outline-none"
          aria-label={`Rate ${star} stars`}
        >
          <Star
            size={size}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );

  if (submitted) {
    return (
      <Card className="p-6 max-w-md mx-auto bg-green-50 dark:bg-green-900/20">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Thank You!</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Your feedback has been submitted successfully.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold mb-1">How do you like your logo?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your feedback helps us improve our logo generation.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Overall Rating
            </label>
            <StarRating rating={overallRating} setRating={setOverallRating} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Design Quality
              </label>
              <StarRating 
                rating={designQualityRating} 
                setRating={setDesignQualityRating} 
                size={20} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Relevance
              </label>
              <StarRating 
                rating={relevanceRating} 
                setRating={setRelevanceRating} 
                size={20} 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Uniqueness
              </label>
              <StarRating 
                rating={uniquenessRating} 
                setRating={setUniquenessRating} 
                size={20} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              What aspects would you like to provide feedback on?
            </label>
            <div className="flex flex-wrap gap-2">
              {feedbackCategories.map((category) => (
                <Badge
                  key={category.value}
                  variant={selectedCategories.includes(category.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(category.value)}
                >
                  {category.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="comments"
              className="block text-sm font-medium mb-2"
            >
              Additional Comments
            </label>
            <Textarea
              id="comments"
              placeholder="Tell us more about your experience..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={overallRating === 0 || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </div>
    </Card>
  );
}