'use client'

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FilePreview } from './file-preview';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFiles } from '@/lib/file-validation';

interface FileUploadProps {
  onFilesChangeAction: (files: File[]) => void;
  maxFiles?: number;
  maxFileSizeMb?: number;
  acceptedFileTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFilesChangeAction,
  maxFiles = 3,
  maxFileSizeMb = 10,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className,
  disabled,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles];

      const validation = validateFiles(newFiles, {
        maxCount: maxFiles,
        maxSize: maxFileSizeMb * 1024 * 1024,
        acceptedFileTypes,
      });

      if (validation.isValid) {
        setFiles(newFiles);
        onFilesChangeAction(newFiles);
        setErrors([]);
      } else {
        setErrors(validation.errors);
      }

      setDragActive(false);
    },
    [files, maxFiles, maxFileSizeMb, acceptedFileTypes, onFilesChangeAction]
  );

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChangeAction(newFiles);
    setErrors([]);
  };

  const clearAll = () => {
    setFiles([]);
    onFilesChangeAction([]);
    setErrors([]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files: selectedFiles } = e.target;

    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);

      const validation = validateFiles(newFiles, {
        maxCount: maxFiles,
        maxSize: maxFileSizeMb * 1024 * 1024,
        acceptedFileTypes,
      });

      if (validation.isValid) {
        setFiles((prev) => [...prev, ...newFiles]);
        onFilesChangeAction((prev) => [...prev, ...newFiles]);
        setErrors([]);
      } else {
        setErrors(validation.errors);
      }
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Upload Inspiration Images</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <UploadCloud className="h-5 w-5" />
        </Button>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center p-6 border-2 border-dashed transition-all',
          {
            'cursor-pointer': !disabled,
            'opacity-50 cursor-not-allowed': disabled,
            'border-primary bg-primary/5': isDragActive || dragActive,
            'border-muted-foreground/25': !(isDragActive || dragActive),
          }
        )}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
      >
        <input
          {...getInputProps()}
          onChange={handleFileInputChange}
          ref={fileInputRef}
          className="hidden"
        />
        <div className="flex flex-col items-center text-center">
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium">Click to upload</span> or drag and drop
          </div>
          <div className="text-xs text-muted-foreground">
            PNG, JPG, WEBP up to {maxFileSizeMb}MB ({maxFiles - files.length}{' '}
            remaining)
          </div>
        </div>
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Selected Files ({files.length}/{maxFiles})
            </span>
            {files.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {files.map((file, index) => (
              <FilePreview
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => removeFile(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-muted-foreground">
        Upload reference images that inspire your logo design. These will help the
        AI understand your style preferences.
      </div>
    </div>
  );
}
