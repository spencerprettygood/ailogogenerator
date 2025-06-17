import React from 'react';
import { DownloadManagerProps } from '@/lib/types';
import FileItem from './file-item';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Package } from 'lucide-react';

const DownloadManager: React.FC<DownloadManagerProps> = ({
  files,
  packageUrl,
  onDownloadFileAction,
  onDownloadAllAction,
  brandName = 'Your Logo',
}) => {
  if (!files || files.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Downloads</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">No files available for download yet.</p>
        </CardContent>
      </Card>
    );
  }

  const primaryFile = files.find(f => f.isPrimary);
  const otherFiles = files.filter(f => !f.isPrimary);

  return (
    <Card className="w-full shadow-lg dark:shadow-indigo-900/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Download Your Assets
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
              Your generated logo package for {brandName}.
            </CardDescription>
          </div>
          {packageUrl && (
            <Button 
              onClick={onDownloadAllAction} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 whitespace-nowrap"
              aria-label="Download all assets as a ZIP package"
            >
              <Package className="mr-2 h-4 w-4" />
              Download All (.zip)
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {primaryFile && (
            <FileItem 
              file={primaryFile} 
              onDownloadAction={onDownloadFileAction} 
            />
          )}
          {otherFiles.map((file) => (
            <FileItem 
              key={file.id} 
              file={file} 
              onDownloadAction={onDownloadFileAction} 
            />
          ))}
        </ul>
        {!packageUrl && files.length > 0 && (
            <div className="mt-4 text-center">
                 <p className="text-xs text-gray-500 dark:text-gray-400">Package (ZIP) is being prepared...</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DownloadManager;
