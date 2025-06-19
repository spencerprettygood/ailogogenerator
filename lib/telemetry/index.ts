/**
 * Simple Telemetry System - Main Export
 * A lightweight, Next.js-compatible telemetry solution
 */

export { telemetry, SimpleTelemetry } from './simple-telemetry';
export { useTelemetry, usePageTracking, useRenderTracking, withTelemetry } from './hooks';
export type { TelemetryEvent, PerformanceMetric, TelemetryProperties } from './simple-telemetry';

// Re-export for convenience
import { telemetry } from './simple-telemetry';
export default telemetry;
