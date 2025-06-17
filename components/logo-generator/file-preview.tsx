'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, FileText } from 'lucide-react';
import { formatFileSize, cn } from '@/lib/utils'; // Added cn
import NextImage from 'next/image'; // Renamed to NextImage to avoid conflict

interface FilePreviewProps {
  file: File;
  onRemoveAction: () => void;
  className?: string;
}

export function FilePreview({ file, onRemoveAction, className }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (file.type.startsWith('image/')) {
      objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(null);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [file]);

  const isImage = file.type.startsWith('image/');

  return (
    <div className={cn("relative group w-full h-32 rounded-md overflow-hidden border border-border", className)}>
      {isImage && previewUrl ? (
        <NextImage
          src={previewUrl}
          alt={file.name}
          fill
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <FileText className="h-6 w-6" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background to-transparent">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium truncate">{file.name}</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemoveAction}
            className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {file.type}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </span>
        </div>
      </div>
    </div>
  );
}
