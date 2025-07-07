// DEPRECATED: Use the new FileUpload component instead.
// This file is retained temporarily for migration purposes and will be removed after all usages are updated.

'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileUpload as FileUploadUnified } from './file-upload-unified';

interface FileUploadSimpleProps {
  onFilesChangeAction: (files: File[]) => void;
  maxFiles?: number;
  maxFileSizeMb?: number;
  acceptedFileTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export function FileUploadSimple({
  onFilesChangeAction,
  maxFiles = 3,
  maxFileSizeMb = 10,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className,
  disabled = false,
}: FileUploadSimpleProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles = [...files, ...selectedFiles];

    // Simple validation
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    for (const file of selectedFiles) {
      if (newFiles.length > maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`);
        break;
      }

      if (file.size > maxFileSizeMb * 1024 * 1024) {
        newErrors.push(`File ${file.name} is too large (max ${maxFileSizeMb}MB)`);
        continue;
      }

      if (!acceptedFileTypes.includes(file.type)) {
        newErrors.push(`File type ${file.type} not supported`);
        continue;
      }

      validFiles.push(file);
    }

    if (newErrors.length === 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesChangeAction(updatedFiles);
      setErrors([]);
    } else {
      setErrors(newErrors);
    }

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChangeAction(updatedFiles);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <UploadCloud className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">Click to upload or drag and drop</p>
        <p className="text-xs text-muted-foreground mb-4">
          PNG, JPG, WEBP up to {maxFileSizeMb}MB each (max {maxFiles} files)
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || files.length >= maxFiles}
        >
          Select Files
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-2 bg-muted rounded"
            >
              <span className="text-sm truncate">{file.name}</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-sm text-red-500">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
