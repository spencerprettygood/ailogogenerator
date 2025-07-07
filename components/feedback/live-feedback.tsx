'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Camera, AlertCircle, RotateCcw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { IssueType, LiveFeedback } from '@/lib/types-feedback';
import { captureViewportScreenshot, getBrowserInfo } from '@/lib/utils/screenshot';

interface LiveFeedbackProps {
  sessionId: string;
  currentStage?: string;
  onSubmit: (feedback: LiveFeedback) => Promise<void>;
}

export function LiveFeedbackButton({ sessionId, currentStage, onSubmit }: LiveFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Define common issue types with user-friendly labels and icons
  const issueTypes: { type: IssueType; label: string; icon: React.ReactNode }[] = [
    {
      type: 'generationFailed',
      label: 'Generation Failed',
      icon: <AlertCircle className="h-4 w-4" />,
    },
    { type: 'slowResponse', label: 'Slow Response', icon: <Clock className="h-4 w-4" /> },
    {
      type: 'unexpectedResult',
      label: 'Unexpected Result',
      icon: <RotateCcw className="h-4 w-4" />,
    },
    { type: 'uiIssue', label: 'UI Problem', icon: <AlertCircle className="h-4 w-4" /> },
    { type: 'other', label: 'Other Issue', icon: <MessageCircle className="h-4 w-4" /> },
  ];

  // Handle opening the panel with animation
  const openPanel = () => {
    setIsOpen(true);
    // Delay showing the panel content for animation
    setTimeout(() => setIsPanelVisible(true), 50);
  };

  // Handle closing the panel with animation
  const closePanel = () => {
    setIsPanelVisible(false);
    // Delay actual closing for animation to complete
    setTimeout(() => {
      setIsOpen(false);
      resetForm();
    }, 300);
  };

  // Reset the form to its initial state
  const resetForm = () => {
    setIssueType(null);
    setDescription('');
    setScreenshot(null);
    setSubmitted(false);
  };

  // Capture a screenshot of the current viewport
  const captureScreenshot = async () => {
    setIsCapturingScreenshot(true);
    try {
      const screenshotData = await captureViewportScreenshot();
      setScreenshot(screenshotData);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!issueType) return;

    setIsSubmitting(true);

    const feedback: LiveFeedback = {
      sessionId,
      timestamp: new Date().toISOString(),
      currentStage,
      issueType,
      description: description.trim() || undefined,
      screenshot: screenshot || undefined,
      browserInfo: getBrowserInfo(),
    };

    try {
      await onSubmit(feedback);
      setSubmitted(true);
      setTimeout(() => {
        closePanel();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close the panel when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && isOpen) {
        closePanel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Render the feedback button and panel
  return (
    <>
      {/* Feedback Button */}
      <Button
        onClick={openPanel}
        variant="secondary"
        size="sm"
        className="fixed bottom-4 right-4 z-50 rounded-full p-3 shadow-md"
        aria-label="Report an Issue"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>

      {/* Feedback Panel */}
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-end transition-opacity duration-300 ${
            isPanelVisible ? 'bg-black/20 opacity-100' : 'opacity-0'
          }`}
          aria-modal="true"
          role="dialog"
        >
          <div
            ref={panelRef}
            className={`h-full w-full max-w-md transform overflow-auto bg-white p-6 shadow-xl transition-transform duration-300 dark:bg-gray-900 sm:w-96 ${
              isPanelVisible ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Panel Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Report an Issue</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePanel}
                className="h-8 w-8 rounded-full p-0"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Panel Content */}
            {submitted ? (
              <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
                <h3 className="mb-2 text-lg font-semibold">Thank You!</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Your feedback has been submitted successfully.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Issue Type Selection */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    What issue are you experiencing?
                  </label>
                  <div className="space-y-2">
                    {issueTypes.map(issue => (
                      <Button
                        key={issue.type}
                        variant={issueType === issue.type ? 'default' : 'outline'}
                        className="mr-2 flex w-full items-center justify-start"
                        onClick={() => setIssueType(issue.type)}
                      >
                        <span className="mr-2">{issue.icon}</span>
                        {issue.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="mb-2 block text-sm font-medium">
                    Describe the issue (optional)
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Please provide any details that might help us understand the issue..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full"
                  />
                </div>

                {/* Screenshot */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium">Include a Screenshot</label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={captureScreenshot}
                      disabled={isCapturingScreenshot}
                      className="flex items-center"
                    >
                      <Camera className="mr-1 h-4 w-4" />
                      {isCapturingScreenshot ? 'Capturing...' : 'Capture'}
                    </Button>
                  </div>

                  {screenshot && (
                    <div className="relative mt-2 rounded border border-gray-200 p-1 dark:border-gray-700">
                      <img src={screenshot} alt="Screenshot" className="h-auto w-full rounded" />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setScreenshot(null)}
                        className="absolute right-2 top-2 h-6 w-6 rounded-full p-0"
                        aria-label="Remove screenshot"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!issueType || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
