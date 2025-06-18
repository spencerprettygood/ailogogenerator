import React, { useState } from 'react';
import { TestVariant, FeedbackSource } from '../types';

interface ComparisonOption {
  id: string;
  variantId: TestVariant;
  name: string;
  description?: string;
  content: React.ReactNode;
}

interface ComparisonTestProps {
  testId: string;
  options: ComparisonOption[];
  onSelectOption: (optionId: string, variantId: TestVariant) => void;
  onSubmitReasoning?: (optionId: string, reasoning: string) => void;
  title?: string;
  description?: string;
  requireReasoning?: boolean;
  className?: string;
}

/**
 * Component for running direct comparison tests between variants
 * Shows multiple options and asks the user to choose which they prefer
 */
export const ComparisonTest: React.FC<ComparisonTestProps> = ({
  testId,
  options,
  onSelectOption,
  onSubmitReasoning,
  title = 'Which option do you prefer?',
  description = 'Please select the option that best meets your needs.',
  requireReasoning = false,
  className = ''
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [reasoning, setReasoning] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [reasoningSubmitted, setReasoningSubmitted] = useState(false);

  const handleSelectOption = (optionId: string) => {
    setSelectedOptionId(optionId);
  };

  const handleSubmit = () => {
    if (!selectedOptionId) return;
    
    const selectedOption = options.find(option => option.id === selectedOptionId);
    if (!selectedOption) return;
    
    onSelectOption(selectedOptionId, selectedOption.variantId);
    setSubmitted(true);
    
    // If reasoning isn't required, we're done
    if (!requireReasoning && !onSubmitReasoning) {
      setReasoningSubmitted(true);
    }
  };

  const handleSubmitReasoning = () => {
    if (!selectedOptionId || !reasoning.trim() || !onSubmitReasoning) return;
    
    onSubmitReasoning(selectedOptionId, reasoning);
    setReasoningSubmitted(true);
  };

  if (reasoningSubmitted) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 text-center ${className}`}>
        <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-green-800 mb-2">Thank you for your feedback!</h3>
        <p className="text-green-700">Your input helps us improve our logo generation process.</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      
      <div className="p-4">
        {submitted && requireReasoning && onSubmitReasoning ? (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">
              Why did you prefer this option?
            </h3>
            
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              rows={4}
              placeholder="Please explain what you liked about your choice..."
            />
            
            <button
              onClick={handleSubmitReasoning}
              disabled={!reasoning.trim()}
              className={`px-4 py-2 rounded-md text-white text-sm font-medium
                ${!reasoning.trim() 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              Submit Feedback
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {options.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`border rounded-lg overflow-hidden cursor-pointer transition-colors
                    ${selectedOptionId === option.id 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-300 hover:border-gray-400'}`}
                >
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{option.name}</h3>
                      
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${
                          selectedOptionId === option.id
                            ? 'bg-blue-600 ring-2 ring-blue-200'
                            : 'border border-gray-400'
                        }`} />
                      </div>
                    </div>
                    
                    {option.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {option.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="p-4">
                    {option.content}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!selectedOptionId}
                className={`px-4 py-2 rounded-md text-white text-sm font-medium
                  ${!selectedOptionId 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                Submit Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonTest;