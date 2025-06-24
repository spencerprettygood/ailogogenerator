import React from 'react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center w-full h-[70vh]">
      <div className="relative flex flex-col gap-4 items-center">
        <div className="w-16 h-16 border-4 border-primary border-solid rounded-full border-t-transparent animate-spin"></div>
        <div className="text-lg font-medium text-muted-foreground">Loading components...</div>
      </div>
    </div>
  );
}