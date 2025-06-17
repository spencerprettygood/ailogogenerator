'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, FileText, AlertCircle } from 'lucide-react';
import { formatFileSize, cn } from '@/lib/utils'; // Added cn
import NextImage from 'next/image'; // Renamed to NextImage to avoid conflict

interface FilePreviewProps {
  file: File;
  previewUrl: string;
  error?: string;
  onRemoveAction: () => void;
  className?: string;
}

export function FilePreview({ file, previewUrl, error, onRemoveAction, className }: FilePreviewProps) {
  const isImage = file.type.startsWith('image/');

  return (
    <div className={cn("relative group w-full h-32 rounded-md overflow-hidden border border-border", className)}>
      {isImage ? (
        <NextImage // Changed to NextImage
          src={previewUrl}
          alt={file.name}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          {error ? (
            <AlertCircle className="h-6 w-6" />
          ) : (
            <FileText className="h-6 w-6" />
          )}
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background to-transparent">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{file.name}</div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemoveAction}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
