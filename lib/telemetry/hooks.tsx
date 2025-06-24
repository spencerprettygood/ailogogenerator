'use client'

/**
 * React hooks for telemetry
 */

import { useCallback, useEffect } from 'react';
import { telemetry, type TelemetryProperties } from './simple-telemetry';

/**
 * Hook to track page views and user interactions
 */
export function useTelemetry() {
  const trackEvent = useCallback((name: string, properties?: TelemetryProperties) => {
    telemetry.recordEvent(name, properties);
  }, []);

  const trackError = useCallback((error: Error, context?: string) => {
    telemetry.recordError(error, context);
  }, []);

  const startTimer = useCallback((name: string) => {
    return telemetry.startTimer(name);
  }, []);

  return {
    trackEvent,
    trackError,
    startTimer,
    telemetry
  };
}

/**
 * Hook to track page views
 */
export function usePageTracking(pageName: string, properties?: TelemetryProperties) {
  useEffect(() => {
    telemetry.recordEvent('page_view', {
      page: pageName,
      ...properties
    });
  }, [pageName, properties]);
}

/**
 * Hook to track component render performance
 */
export function useRenderTracking(componentName: string) {
  useEffect(() => {
    const endTimer = telemetry.startTimer(`${componentName}_render`);
    return endTimer;
  }, [componentName]);
}

/**
 * Higher-order component to add telemetry to any component
 */
export function withTelemetry(
  Component: React.ComponentType,
  componentName: string
) {
  return function TelemetryWrappedComponent(props: {}) {
    useRenderTracking(componentName);
    return <Component {...props} />;
  };
}
