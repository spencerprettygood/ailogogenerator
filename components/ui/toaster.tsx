'use client';

import React from 'react';
import { useToast } from '@/lib/hooks/use-toast';
import { Button } from './button';
import { Card } from './card';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Card
          key={toast.id}
          className={`
            p-4 min-w-[300px] max-w-[500px] shadow-lg
            ${
              toast.variant === 'destructive'
                ? 'border-destructive bg-destructive text-destructive-foreground'
                : 'bg-background'
            }
          `}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {toast.variant === 'destructive' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium">{toast.title}</div>
              {toast.description && (
                <div className="text-sm opacity-90 mt-1">{toast.description}</div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-70 hover:opacity-100"
              onClick={() => dismiss(toast.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
