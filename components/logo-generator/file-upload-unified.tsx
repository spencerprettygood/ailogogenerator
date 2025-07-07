'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { FilePreview } from './file-preview';
import { UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFiles, FileValidationRule } from '@/lib/file-validation';

interface FileUploadUnifiedProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxFileSizeMb?: number;
  acceptedFileTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFilesChange,
  maxFiles = 3,
  maxFileSizeMb = 10,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className,
  disabled = false,
}: FileUploadUnifiedProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validationOptions: FileValidationRule = useMemo(
    () => ({
      maxCount: maxFiles,
      maxSize: maxFileSizeMb * 1024 * 1024,
      allowedTypes: acceptedFileTypes,
    }),
    [maxFiles, maxFileSizeMb, acceptedFileTypes]
  );

  const handleFiles = (selectedFiles: File[]) => {
    const allFiles = [...files, ...selectedFiles];
    const validation = validateFiles(allFiles, validationOptions);
    if (validation.isValid) {
      setFiles(allFiles);
      onFilesChange(allFiles);
      setErrors([]);
    } else {
      setErrors(validation.errors);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    handleFiles(selectedFiles);
    if (event.target) {
      event.target.value = '';
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      handleFiles(acceptedFiles);
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
    [files, validationOptions]
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
    onFilesChange(newFiles);
    setErrors([]);
  };

  const clearAll = () => {
    setFiles([]);
    onFilesChange([]);
    setErrors([]);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Upload Images</h3>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
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
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        <UploadCloud className="h-10 w-10" />
        <p className="font-semibold">
          {isDragActive ? 'Drop the files here ...' : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-xs">
          Up to {maxFiles} images, {maxFileSizeMb}MB per file.
        </p>
        <p className="text-xs">
          Supported types:{' '}
          {acceptedFileTypes
            .map(t => t.split('/')[1])
            .join(', ')
            .toUpperCase()}
        </p>
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
