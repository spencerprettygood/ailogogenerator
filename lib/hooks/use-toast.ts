import { useState, useCallback } from 'react';

interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface Toast extends ToastProps {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { ...props, id };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, props.duration || 5000);

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toast, toasts, dismiss };
}

export type { ToastProps, Toast };
export const toast = (...args: Parameters<ReturnType<typeof useToast>['toast']>) => {
  // This is a static singleton for non-hook usage
  // In a real app, you might want to use a context or event emitter
  // For now, this is a no-op placeholder to avoid import errors
  return undefined;
};
