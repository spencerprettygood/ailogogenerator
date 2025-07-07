'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimationDownloadManagerProps, AnimationExportOptions } from '@/lib/types';
import { Download, FileVideo, FileImage, FileCode, ChevronDown, Check } from 'lucide-react';
import { AnimationType, AnimationTrigger } from '@/lib/animation/types';
import { ErrorCategory, handleError } from '@/lib/utils/error-handler';

const AnimationDownloadManager: React.FC<AnimationDownloadManagerProps> = ({
  animatedSvg,
  animationCss,
  animationJs,
  animationOptions,
  brandName = 'Your Logo',
  onExport,
}) => {
  const [exportFormat, setExportFormat] = useState<string>('svg');
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<Partial<AnimationExportOptions>>({
    format: 'svg',
    duration: 3000,
    quality: 75,
  });

  const formatMenuRef = useRef<HTMLDivElement>(null);

  // Close format menu when clicking outside
  useEffect(() => {
    if (!showFormatOptions) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (formatMenuRef.current && !formatMenuRef.current.contains(event.target as Node)) {
        setShowFormatOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFormatOptions]);

  if (!animatedSvg) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Animated Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No animated logo available. Please generate an animation first.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleExport = useCallback(() => {
    try {
      onExport(exportFormat, exportOptions as AnimationExportOptions);
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.UI,
        context: {
          component: 'AnimationDownloadManager',
          operation: 'export',
          format: exportFormat,
          options: exportOptions,
        },
      });
    }
  }, [exportFormat, exportOptions, onExport]);

  const selectFormat = useCallback((format: string) => {
    setExportFormat(format);
    setExportOptions(prev => ({ ...prev, format: format as any }));
    setShowFormatOptions(false);
  }, []);

  return (
    <Card className="w-full shadow-lg dark:shadow-indigo-900/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Animated Logo
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
              Export your animated logo for {brandName} in different formats.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Animation Type</p>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium dark:bg-indigo-900 dark:text-indigo-200">
              {animationOptions?.type || AnimationType.FADE_IN}
            </span>
            {animationOptions?.trigger && (
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium dark:bg-gray-800 dark:text-gray-200">
                Trigger: {animationOptions.trigger}
              </span>
            )}
            {animationOptions?.timing?.duration && (
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium dark:bg-gray-800 dark:text-gray-200">
                {animationOptions.timing.duration}ms
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative" ref={formatMenuRef}>
            <Button
              onClick={() => setShowFormatOptions(!showFormatOptions)}
              variant="outline"
              className="flex items-center gap-2"
            >
              {exportFormat === 'svg' && <FileCode size={16} />}
              {exportFormat === 'html' && <FileCode size={16} />}
              {exportFormat === 'gif' && <FileImage size={16} />}
              {exportFormat === 'mp4' && <FileVideo size={16} />}
              {exportFormat.toUpperCase()}
              <ChevronDown size={16} />
            </Button>

            {showFormatOptions && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                <ul className="py-1">
                  <li
                    className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 ${exportFormat === 'svg' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    onClick={() => selectFormat('svg')}
                  >
                    <FileCode size={16} />
                    SVG
                    {exportFormat === 'svg' && <Check size={16} className="ml-auto" />}
                  </li>
                  <li
                    className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 ${exportFormat === 'html' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    onClick={() => selectFormat('html')}
                  >
                    <FileCode size={16} />
                    HTML
                    {exportFormat === 'html' && <Check size={16} className="ml-auto" />}
                  </li>
                  <li
                    className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 ${exportFormat === 'gif' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    onClick={() => selectFormat('gif')}
                  >
                    <FileImage size={16} />
                    GIF (Coming Soon)
                    {exportFormat === 'gif' && <Check size={16} className="ml-auto" />}
                  </li>
                  <li
                    className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 ${exportFormat === 'mp4' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                    onClick={() => selectFormat('mp4')}
                  >
                    <FileVideo size={16} />
                    MP4 (Coming Soon)
                    {exportFormat === 'mp4' && <Check size={16} className="ml-auto" />}
                  </li>
                </ul>
              </div>
            )}
          </div>

          <Button
            onClick={handleExport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600"
          >
            <Download size={16} className="mr-2" />
            Export Animation
          </Button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
          <p className="text-sm font-medium mb-2">Preview</p>
          <div
            className="flex justify-center items-center bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-4 overflow-hidden"
            style={{ minHeight: '200px' }}
            dangerouslySetInnerHTML={{ __html: animatedSvg }}
          />

          {(animationCss || animationJs) && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This animation includes custom {animationCss ? 'CSS' : ''}
                {animationCss && animationJs ? ' and ' : ''}
                {animationJs ? 'JavaScript' : ''} that will be included in the export.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnimationDownloadManager;
