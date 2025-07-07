'use client';

// DEPRECATED: Use the new FileUpload component instead.
// This file is retained temporarily for migration purposes and will be removed after all usages are updated.

import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { FilePreview } from './file-preview';
import { UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFiles } from '@/lib/file-validation';
import type { FileUploadProps, FileValidationOptions } from '@/lib/types';
import { FileUpload as FileUploadUnified } from './file-upload-unified';

export function FileUpload({
  onFilesChange,
  maxFiles = 3,
  maxFileSizeMb = 10,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className,
  disabled,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const validationOptions: FileValidationOptions = useMemo(
    () => ({
      maxCount: maxFiles,
      maxSize: maxFileSizeMb * 1024 * 1024,
      allowedTypes: acceptedFileTypes,
    }),
    [maxFiles, maxFileSizeMb, acceptedFileTypes]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      const currentFiles = files;
      const allFiles = [...currentFiles, ...acceptedFiles];

      const validation = validateFiles(allFiles, validationOptions);

      if (validation.isValid) {
        setFiles(allFiles);
        if (onFilesChange) {
          onFilesChange(allFiles);
        }
        setErrors([]);
      } else {
        setErrors(validation.errors);
      }

      if (fileRejections.length > 0) {
        const rejectionErrors = fileRejections.map(
          rejection =>
            `File ${rejection.file.name} was rejected: ${rejection.errors
              .map(e => e.message)
              .join(', ')}`
        );
        setErrors(prevErrors => [...prevErrors, ...rejectionErrors]);
      }
    },
    [files, onFilesChange, validationOptions]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce(
      (acc: Record<string, string[]>, type: string) => ({ ...acc, [type]: [] }),
      {}
    ),
    maxSize: validationOptions.maxSize,
    maxFiles: validationOptions.maxCount,
    disabled,
    noClick: true,
    noKeyboard: true,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (onFilesChange) {
      onFilesChange(newFiles);
    }
    setErrors([]);
  };

  const clearAll = () => {
    setFiles([]);
    if (onFilesChange) {
      onFilesChange([]);
    }
    setErrors([]);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Upload Inspiration Images</h3>
        <Button
          type="button"
          variant="outline"
          onClick={open}
          disabled={disabled || files.length >= maxFiles}
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          Select Files
        </Button>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'flex min-h-[150px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition-colors hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500',
          {
            'border-blue-500 bg-blue-50 dark:bg-blue-900/20': isDragActive,
            'cursor-not-allowed opacity-50': disabled,
          }
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
          <UploadCloud className="h-10 w-10" />
          <p className="font-semibold">
            {isDragActive
              ? 'Drop the files here ...'
              : 'Drag & drop files here, or click to select'}
          </p>
          <p className="text-xs">
            Up to {maxFiles} images, {maxFileSizeMb}MB per file.
          </p>
          <p className="text-xs">
            Supported types:{' '}
            {acceptedFileTypes
              .map((t: string) => t.split('/')[1])
              .join(', ')
              .toUpperCase()}
          </p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-2 space-y-1 text-sm text-red-600 dark:text-red-400">
          {errors.map((error, i) => (
            <p key={i}>• {error}</p>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Uploaded Files</h4>
            <Button variant="link" onClick={clearAll} className="text-sm">
              Clear All
            </Button>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {files.map((file, index) => (
              <FilePreview key={index} file={file} onRemoveAction={() => removeFile(index)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
