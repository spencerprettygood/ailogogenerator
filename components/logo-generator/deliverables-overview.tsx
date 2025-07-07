'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { H3, H4, Paragraph, SmallText } from '@/components/ui/typography';
import type { FileDownloadInfo, GeneratedAssets, GenerationProgress } from '@/lib/types';

// Define the deliverable category types
type DeliverableCategory = 'Logo Files' | 'Favicon' | 'Brand Guidelines' | 'Mockups' | 'Animations';

// Interface for a single deliverable item
interface DeliverableItem {
  id: string;
  name: string;
  description: string;
  category: DeliverableCategory;
  type: FileDownloadInfo['type'];
  status: 'pending' | 'generating' | 'completed';
  icon?: React.ReactNode;
}

interface DeliverablesOverviewProps {
  brandName?: string;
  generatedAssets?: GeneratedAssets;
  progress?: GenerationProgress;
  className?: string;
}

export function DeliverablesOverview({
  brandName = 'Your Brand',
  generatedAssets,
  progress,
  className = '',
}: DeliverablesOverviewProps) {
  // Determine overall generation status
  const isGenerating =
    progress?.status === 'analyzing' ||
    progress?.status === 'generating' ||
    progress?.status === 'refining';

  const isCompleted = progress?.status === 'completed';

  // Map of deliverable categories with their icons and descriptions
  const deliverableCategories: Record<
    DeliverableCategory,
    {
      icon: React.ReactNode;
      description: string;
      items: DeliverableItem[];
    }
  > = {
    'Logo Files': {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5Z" />
          <path d="m2 17 10 5 10-5" />
          <path d="m2 12 10 5 10-5" />
        </svg>
      ),
      description: 'Professional logo files in multiple formats',
      items: [
        {
          id: 'primary-svg',
          name: 'Primary Logo (SVG)',
          description: 'Vector format for print and digital use',
          category: 'Logo Files',
          type: 'svg',
          status: generatedAssets?.primaryLogoSVG
            ? 'completed'
            : isGenerating
              ? 'generating'
              : 'pending',
        },
        {
          id: 'primary-png',
          name: 'Primary Logo (PNG)',
          description: 'High-resolution transparent background',
          category: 'Logo Files',
          type: 'png',
          status: generatedAssets?.individualFiles?.some(f => f.type === 'png')
            ? 'completed'
            : isGenerating
              ? 'generating'
              : 'pending',
        },
      ],
    },
    Favicon: {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      ),
      description: 'Browser tab icon for your website',
      items: [
        {
          id: 'favicon-ico',
          name: 'Favicon (ICO)',
          description: 'For website browser tabs',
          category: 'Favicon',
          type: 'ico',
          status: generatedAssets?.favicon?.ico
            ? 'completed'
            : isGenerating
              ? 'generating'
              : 'pending',
        },
      ],
    },
    'Brand Guidelines': {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
      description: 'Instructions for consistent brand usage',
      items: [
        {
          id: 'guidelines-pdf',
          name: 'Brand Guidelines (PDF)',
          description: 'Color codes, typography, and usage rules',
          category: 'Brand Guidelines',
          type: 'pdf',
          status: generatedAssets?.guidelines
            ? 'completed'
            : isGenerating
              ? 'generating'
              : 'pending',
        },
      ],
    },
    Mockups: {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      ),
      description: 'See your logo in real-world applications',
      items: [
        {
          id: 'mockups-pack',
          name: 'Mockup Pack',
          description: 'Business cards, social media, and more',
          category: 'Mockups',
          type: 'png',
          status: generatedAssets?.individualFiles?.some(f => f.name?.includes('Mockup'))
            ? 'completed'
            : isGenerating
              ? 'generating'
              : 'pending',
        },
      ],
    },
    Animations: {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m10 8 6 4-6 4V8z" />
        </svg>
      ),
      description: 'Animated versions of your logo',
      items: [
        {
          id: 'animated-svg',
          name: 'Animated Logo (SVG)',
          description: 'For websites and digital presentations',
          category: 'Animations',
          type: 'svg',
          status: generatedAssets?.individualFiles?.some(f => f.category === 'animation')
            ? 'completed'
            : isGenerating
              ? 'generating'
              : 'pending',
        },
      ],
    },
  };

  // Helper function to get the appropriate status badge
  const getStatusBadge = (status: DeliverableItem['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Ready</Badge>;
      case 'generating':
        return (
          <Badge variant="info" animation="pulse">
            Generating
          </Badge>
        );
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card variant="elevated" className={`w-full ${className}`} padding="lg">
      <CardHeader>
        <CardTitle>Deliverables for {brandName}</CardTitle>
        {progress && (
          <div className="mt-4">
            <Progress
              value={progress.progress}
              max={100}
              variant="accent"
              showValue={true}
              label={progress.message}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="grid gap-6">
        {Object.entries(deliverableCategories).map(([category, { icon, description, items }]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="text-accent">{icon}</div>
              <H4>{category}</H4>
            </div>
            <SmallText className="text-muted-foreground">{description}</SmallText>

            <div className="grid gap-2">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium">{item.name}</div>
                    <SmallText className="text-muted-foreground">{item.description}</SmallText>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Package download section */}
        <div className="mt-6 rounded-md bg-accent/10 p-4">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 8v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8" />
              <path d="m9 19 3 3 3-3" />
              <path d="m9 14 3 3 3-3" />
              <path d="M10 4h4l2 4H8l2-4z" />
            </svg>
            <H4>Complete Package</H4>
          </div>
          <Paragraph className="mt-1 text-muted-foreground">
            All files bundled in a single download
          </Paragraph>
          <div className="mt-3">
            {generatedAssets?.zipPackageUrl ? (
              <Badge variant="success" shape="asymmetric" size="lg">
                Ready for Download
              </Badge>
            ) : isGenerating ? (
              <Badge variant="info" animation="pulse" shape="asymmetric" size="lg">
                Preparing Package
              </Badge>
            ) : (
              <Badge variant="secondary" shape="asymmetric" size="lg">
                Pending
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DeliverablesOverview;
