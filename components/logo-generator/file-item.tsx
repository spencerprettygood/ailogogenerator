'use client';

import React from 'react';
import { FileItemProps } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Download, FileText, Image as ImageIcon, Archive, Loader2, AlertCircle } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';

const FileItem: React.FC<FileItemProps> = ({ file, onDownloadAction }) => {
  const getFileIcon = () => {
    if (file.type.includes('svg')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (file.type.includes('png')) return <ImageIcon className="h-5 w-5 text-green-500" />;
    if (file.type.includes('zip')) return <Archive className="h-5 w-5 text-yellow-500" />;
    if (file.type.includes('html')) return <FileText className="h-5 w-5 text-purple-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  return (
    <li className={cn(
      "flex items-center justify-between p-3 rounded-lg transition-all duration-200 ease-in-out",
      file.isPrimary ? "bg-blue-50 dark:bg-blue-900/30" : "bg-gray-50 dark:bg-gray-800/30",
      file.status === 'error' && "bg-red-50 dark:bg-red-900/30"
    )}>
      <div className="flex items-center space-x-3 min-w-0">
        <div className="flex-shrink-0">{getFileIcon()}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {file.type.toUpperCase()} - {formatBytes(file.size)}
            {file.status === 'error' && <span className="ml-2 text-red-500">Error</span>}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant={file.isPrimary ? "default" : "outline"}
        onClick={() => onDownloadAction(file.id)}
        disabled={file.status === 'downloading' || file.status === 'completed'}
        className={cn(
          "ml-2 whitespace-nowrap",
          file.isPrimary && "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600",
          !file.isPrimary && "text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
        )}
      >
        {file.status === 'downloading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {file.status === 'error' && <AlertCircle className="mr-2 h-4 w-4" />}
        {file.status === 'completed' ? 'Downloaded' : (file.status === 'error' ? 'Retry' : 'Download')}
        {(file.status !== 'downloading' && file.status !== 'error' && file.status !== 'completed') && <Download className="ml-2 h-4 w-4" />}
      </Button>
    </li>
  );
};

export default FileItem;
