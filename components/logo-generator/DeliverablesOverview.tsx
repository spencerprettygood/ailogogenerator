'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { GeneratedAssets, GenerationProgress } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface DeliverablesOverviewProps {
  /** Brand name */
  brandName?: string;
  /** Current generation progress */
  progress?: GenerationProgress;
  /** Generated assets */
  generatedAssets?: GeneratedAssets;
  /** Whether to show detailed descriptions */
  showDetails?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Callback for download package */
  onDownloadPackage?: () => void;
}

/**
 * DeliverablesOverview Component
 *
 * Displays an overview of all deliverables that will be generated,
 * with their current status and descriptions.
 */
function DeliverablesOverview({
  brandName = 'Your Brand',
  progress,
  generatedAssets,
  showDetails = true,
  className,
  onDownloadPackage,
}: DeliverablesOverviewProps) {
  // Helper to determine if a deliverable is ready
  const isReady = (key: string): boolean => {
    if (!generatedAssets) return false;

    switch (key) {
      case 'logoSVG':
        return !!generatedAssets.primaryLogoSVG;
      case 'logoPNG':
        return !!generatedAssets.primaryLogoSVG;
      case 'favicon':
        return !!generatedAssets.favicon;
      case 'guidelines':
        return !!generatedAssets.guidelines;
      case 'animations':
        return generatedAssets.individualFiles?.some(f => f.category === 'animation') || false;
      case 'mockups':
        return generatedAssets.individualFiles?.some(f => f.category === 'mockup') || false;
      case 'package':
        return !!generatedAssets.zipPackageUrl;
      default:
        return false;
    }
  };

  // Helper to determine the status badge for a deliverable
  const getStatusBadge = (key: string) => {
    if (isReady(key)) {
      return <Badge className="bg-green-500 hover:bg-green-600">Ready</Badge>;
    }

    if (progress?.status === 'generating' || progress?.status === 'refining') {
      return <Badge className="bg-blue-500 hover:bg-blue-600 animate-pulse">Generating</Badge>;
    }

    return <Badge variant="outline">Pending</Badge>;
  };

  // Calculate overall progress percentage
  const progressPercentage = progress?.progress || 0;

  // Deliverables categories
  const deliverableCategories = [
    {
      id: 'logos',
      title: 'Logo Files',
      icon: <LogoIcon className="w-5 h-5" />,
      items: [
        {
          id: 'logoSVG',
          name: 'Primary Logo (SVG)',
          description: 'Scalable vector graphics format for perfect rendering at any size',
        },
        {
          id: 'logoPNG',
          name: 'Logo PNG Set',
          description: 'Transparent background PNGs in multiple sizes (256px, 512px, 1024px)',
        },
        {
          id: 'logoMonochrome',
          name: 'Monochrome Variants',
          description: 'Black and white versions for different backgrounds and printing',
        },
      ],
    },
    {
      id: 'favicon',
      title: 'Favicon Package',
      icon: <FaviconIcon className="w-5 h-5" />,
      items: [
        {
          id: 'favicon',
          name: 'Website Favicon',
          description: 'ICO, PNG, and SVG formats for browser tabs and bookmarks',
        },
      ],
    },
    {
      id: 'guidelines',
      title: 'Brand Guidelines',
      icon: <GuidelinesIcon className="w-5 h-5" />,
      items: [
        {
          id: 'guidelines',
          name: 'Brand Guidelines Document',
          description: 'Comprehensive guide with color codes, typography, and usage rules',
        },
      ],
    },
    {
      id: 'mockups',
      title: 'Mockup Previews',
      icon: <MockupIcon className="w-5 h-5" />,
      items: [
        {
          id: 'mockups',
          name: 'Application Mockups',
          description: 'See your logo in real-world scenarios (business cards, signage, etc.)',
        },
      ],
    },
    {
      id: 'animations',
      title: 'Logo Animations',
      icon: <AnimationIcon className="w-5 h-5" />,
      items: [
        {
          id: 'animations',
          name: 'Animated Logo',
          description: 'Subtle, professional animations for digital platforms',
        },
      ],
    },
  ];

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Your Logo Package</CardTitle>
        <CardDescription>Everything you'll receive for {brandName}</CardDescription>

        {progress && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span>
                {progress.status === 'completed' ? 'Generation complete' : progress.status}
              </span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {deliverableCategories.map(category => (
          <div key={category.id} className="space-y-3">
            <div className="flex items-center space-x-2 font-medium">
              {category.icon}
              <h3>{category.title}</h3>
            </div>

            <div className="space-y-2 pl-7">
              {category.items.map(item => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className={showDetails ? 'space-y-1' : ''}>
                    <div className="font-medium text-sm">{item.name}</div>
                    {showDetails && (
                      <p className="text-xs text-muted-foreground max-w-md">{item.description}</p>
                    )}
                  </div>
                  {getStatusBadge(item.id)}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium flex items-center">
                <PackageIcon className="w-5 h-5 mr-2" />
                Complete Package (ZIP)
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                All files in a single download for easy access
              </p>
            </div>

            {isReady('package') ? (
              <Button
                onClick={onDownloadPackage}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <DownloadIcon className="w-4 h-4 mr-1" />
                Download All
              </Button>
            ) : (
              getStatusBadge('package')
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/50 px-6 py-4 text-xs text-muted-foreground">
        <p>
          All assets are royalty-free for commercial and personal use. Brand guidelines include
          color codes, spacing rules, and usage instructions.
        </p>
      </CardFooter>
    </Card>
  );
}

// Icon components
function LogoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12L20 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12L4 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FaviconIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 9H9.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 9H15.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 15L15 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GuidelinesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M19.5 14.25V11.625C19.5 9.76104 18.5518 8.01125 17 6.92157"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 3.2998C15.7478 3.10453 14.3948 3 13 3C7.75 3 3.5 5.5 3.5 11.625V14.25C3.5 17.5302 2.5034 18.4147 2 19C3.25 19 5.75 19.5 7 20.25H19C20.25 19.5 22.75 19 24 19C23.4976 18.4167 22.5 17.5312 22.5 14.25V11.625C22.5 8.3123 20.7145 5.799 18.0686 4.40369"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 10.5V10.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 10.5V10.6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 16.5C10.4665 17.1667 13.5335 17.1667 14.5 16.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MockupIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 8V16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 12H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AnimationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M7 8L3 12L7 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 8L21 12L17 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 4L10 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PackageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M21 16V8.00002C20.9996 7.6493 20.9071 7.30483 20.7315 7.00119C20.556 6.69754 20.3037 6.44539 20 6.27002L13 2.27002C12.696 2.09449 12.3511 2.00208 12 2.00208C11.6489 2.00208 11.304 2.09449 11 2.27002L4 6.27002C3.69626 6.44539 3.44398 6.69754 3.26846 7.00119C3.09294 7.30483 3.00036 7.6493 3 8.00002V16C3.00036 16.3508 3.09294 16.6952 3.26846 16.9989C3.44398 17.3025 3.69626 17.5547 4 17.73L11 21.73C11.304 21.9056 11.6489 21.998 12 21.998C12.3511 21.998 12.696 21.9056 13 21.73L20 17.73C20.3037 17.5547 20.556 17.3025 20.7315 16.9989C20.9071 16.6952 20.9996 16.3508 21 16Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.27002 6.96002L12 12.01L20.73 6.96002"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 22.08V12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 10L12 15L17 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15V3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default DeliverablesOverview;
