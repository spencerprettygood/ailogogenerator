/**
 * @file time-estimation.ts
 * @module lib/time-estimation
 * @description Provides accurate time estimation for logo generation processes
 * 
 * This module implements adaptive time estimation for multi-stage processes,
 * specifically designed for the AI Logo Generator pipeline. It provides:
 * - Accurate remaining time predictions based on historical performance
 * - Stage-based tracking with real-time updates
 * - Adaptive learning from completed stages
 * - Outlier detection and filtering for more stable estimates
 * - Progress-aware calculations that improve as stages complete
 * 
 * @author AILogoGenerator Team
 * @version 1.0.0
 * @copyright 2024
 */

import { LogoStage } from './types';

/**
 * @interface TimeEstimation
 * @description Comprehensive time estimation results for a multi-stage process
 * @property {number} totalEstimated - Total estimated duration in seconds
 * @property {number} elapsed - Time elapsed so far in seconds
 * @property {number} remaining - Estimated remaining time in seconds
 * @property {number} completion - Percentage of the process completed (0-100)
 * @property {number} [stageRemainingTime] - Estimated time to complete current stage in seconds
 * @property {number} reliability - How reliable the estimate is (0-1 scale)
 */
export interface TimeEstimation {
  totalEstimated: number;
  elapsed: number;
  remaining: number;
  completion: number;
  stageRemainingTime?: number;
  reliability: number;
}

/**
 * @constant DEFAULT_STAGE_DURATIONS
 * @description Baseline duration estimates for each pipeline stage in milliseconds
 * 
 * These values serve as initial estimates before any actual performance data
 * is collected. They're based on average observed times during development
 * and will be automatically adjusted as the system learns from real usage.
 */
export const DEFAULT_STAGE_DURATIONS: Record<string, number> = {
  'stage-a': 5000,   // Requirements analysis - fast
  'stage-b': 10000,  // Moodboard generation
  'stage-c': 5000,   // Selection - fast
  'stage-d': 30000,  // SVG generation - slower
  'stage-e': 8000,   // SVG validation
  'stage-f': 15000,  // Variant generation
  'stage-g': 15000,  // Brand guidelines
  'stage-h': 5000    // Packaging - fast
};

/**
 * @constant STAGE_MAPPING
 * @description Maps various stage identifiers to normalized stage IDs
 * 
 * This mapping allows the system to handle different formats of stage IDs
 * that might be used in different parts of the application, ensuring
 * consistent tracking and estimation regardless of the format used.
 */
export const STAGE_MAPPING: Record<string, string> = {
  'stage-a': 'stage-a',
  'stage-b': 'stage-b',
  'stage-c': 'stage-c',
  'stage-d': 'stage-d',
  'stage-e': 'stage-e',
  'stage-f': 'stage-f',
  'stage-g': 'stage-g',
  'stage-h': 'stage-h',
  'a': 'stage-a',
  'b': 'stage-b',
  'c': 'stage-c',
  'd': 'stage-d',
  'e': 'stage-e',
  'f': 'stage-f',
  'g': 'stage-g',
  'h': 'stage-h',
  'A': 'stage-a',
  'B': 'stage-b',
  'C': 'stage-c',
  'D': 'stage-d',
  'E': 'stage-e',
  'F': 'stage-f',
  'G': 'stage-g',
  'H': 'stage-h',
  'requirements': 'stage-a',
  'moodboard': 'stage-b',
  'selection': 'stage-c',
  'generation': 'stage-d',
  'validation': 'stage-e',
  'variants': 'stage-f',
  'guidelines': 'stage-g',
  'packaging': 'stage-h'
};

/**
 * @class TimeEstimator
 * @description Provides adaptive time estimation for multi-stage processes
 * 
 * This class tracks the progress of a multi-stage process and provides
 * increasingly accurate time estimates as stages are completed. It learns
 * from historical performance to adjust future estimates, handles outliers,
 * and provides reliability metrics.
 * 
 * @example
 * // Create an estimator with defined stages
 * const estimator = new TimeEstimator([
 *   { id: 'stage-a', duration: 5000 },
 *   { id: 'stage-b', duration: 10000 },
 *   { id: 'stage-c', duration: 5000 }
 * ]);
 * 
 * // When starting a stage
 * estimator.startStage('stage-a');
 * 
 * // When completing a stage
 * estimator.endStage('stage-a');
 * 
 * // Get current time estimate
 * const timeInfo = estimator.estimate('stage-b', 30);
 * console.log(`Estimated ${timeInfo.remaining} seconds remaining`);
 */
export class TimeEstimator {
  /**
   * @private
   * @property {Date} startTime - When the entire process started
   */
  private startTime: Date;
  
  /**
   * @private
   * @property {Array<{id: string, duration: number}>} stages - Defined stages with initial duration estimates
   */
  private stages: { id: string; duration: number }[];
  
  /**
   * @private
   * @property {Record<string, number>} stageStartTimes - Timestamps when each stage started
   */
  private stageStartTimes: Record<string, number> = {};
  
  /**
   * @private
   * @property {Record<string, {duration: number, speed: number}>} stageHistory
   * History of completed stages with actual duration and speed factor
   */
  private stageHistory: Record<string, { duration: number; speed: number }> = {};
  
  /**
   * @constructor
   * @description Creates a new time estimator with defined stages
   * @param {Array<{id: string, duration: number}>} stages - The stages of the process with initial duration estimates
   */
  constructor(stages: { id: string; duration: number }[]) {
    this.startTime = new Date();
    this.stages = stages;
  }

  /**
   * @method startStage
   * @description Starts timing for a specific stage
   * 
   * Records the start time for a stage to later calculate its actual duration.
   * Automatically normalizes stage IDs for consistent tracking.
   * 
   * @param {string} stageId - The identifier of the stage being started
   * @returns {void}
   * 
   * @example
   * estimator.startStage('stage-a');
   * // or using alternative formats
   * estimator.startStage('a');
   * estimator.startStage('requirements');
   */
  startStage(stageId: string): void {
    const normalizedStageId = STAGE_MAPPING[stageId] || stageId;
    this.stageStartTimes[normalizedStageId] = Date.now();
  }

  /**
   * @method endStage
   * @description Ends timing for a specific stage and records performance data
   * 
   * Calculates the actual duration of the stage, compares it to the expected
   * duration, and records this information in the stage history. This data
   * is used to improve future estimates.
   * 
   * @param {string} stageId - The identifier of the stage being completed
   * @returns {void}
   * 
   * @example
   * estimator.endStage('stage-a');
   */
  endStage(stageId: string): void {
    const normalizedStageId = STAGE_MAPPING[stageId] || stageId;
    const startTime = this.stageStartTimes[normalizedStageId];
    
    if (startTime) {
      const duration = Date.now() - startTime;
      const configuredStage = this.stages.find(s => s.id === normalizedStageId);
      const configuredDuration = configuredStage ? configuredStage.duration : DEFAULT_STAGE_DURATIONS[normalizedStageId] || 10000;
      
      // Calculate speed as a ratio of actual/expected duration (1.0 means exactly as expected)
      const speed = configuredDuration > 0 ? duration / configuredDuration : 1.0;
      
      this.stageHistory[normalizedStageId] = { duration, speed };
      delete this.stageStartTimes[normalizedStageId];
    }
  }

  /**
   * @method getStageEstimate
   * @description Estimates the duration of a stage based on history and configuration
   * 
   * Uses historical performance data to provide an adjusted estimate for how long
   * a specific stage should take. This accounts for factors like network conditions,
   * server load, and complexity of the current request.
   * 
   * @param {string} stageId - The identifier of the stage to estimate
   * @returns {number} Estimated duration in milliseconds
   * 
   * @example
   * const estimatedDuration = estimator.getStageEstimate('stage-d');
   * console.log(`SVG generation should take about ${estimatedDuration/1000}s`);
   */
  getStageEstimate(stageId: string): number {
    const normalizedStageId = STAGE_MAPPING[stageId] || stageId;
    const configuredStage = this.stages.find(s => s.id === normalizedStageId);
    const configuredDuration = configuredStage ? configuredStage.duration : DEFAULT_STAGE_DURATIONS[normalizedStageId] || 10000;
    
    // If we have history for similar stages, adjust the estimate
    const avgSpeed = this.calculateAverageSpeed();
    if (avgSpeed > 0) {
      return configuredDuration * avgSpeed;
    }
    
    return configuredDuration;
  }

  /**
   * @method calculateAverageSpeed
   * @private
   * @description Calculates the average performance speed from completed stages
   * 
   * Analyzes the history of completed stages to determine the average speed
   * factor (actual/expected duration). Includes outlier detection to filter
   * out extremely fast or slow stages that might skew the average.
   * 
   * @returns {number} Average speed factor (1.0 means exactly as expected)
   */
  private calculateAverageSpeed(): number {
    const speeds = Object.values(this.stageHistory).map(h => h.speed);
    if (speeds.length === 0) return 1.0;
    
    // Calculate average, filtering out extreme outliers using IQR method
    const sortedSpeeds = [...speeds].sort((a, b) => a - b);
    const q1Index = Math.floor(sortedSpeeds.length * 0.25);
    const q3Index = Math.floor(sortedSpeeds.length * 0.75);
    const q1 = sortedSpeeds[q1Index];
    const q3 = sortedSpeeds[q3Index];
    const iqr = q3 - q1;
    const lowerBound = Math.max(0.1, q1 - 1.5 * iqr);
    const upperBound = Math.min(10, q3 + 1.5 * iqr);
    
    const filteredSpeeds = speeds.filter(s => s >= lowerBound && s <= upperBound);
    if (filteredSpeeds.length === 0) return 1.0;
    
    return filteredSpeeds.reduce((sum, s) => sum + s, 0) / filteredSpeeds.length;
  }

  /**
   * @method estimate
   * @description Estimates remaining time based on current progress
   * 
   * Provides comprehensive time estimation data including total duration,
   * elapsed time, remaining time, completion percentage, and reliability
   * metrics. This method combines static configuration data with dynamic
   * observations to provide increasingly accurate estimates.
   * 
   * @param {string} currentStageId - The ID of the current active stage
   * @param {number} [stageProgressPercent=0] - Progress within current stage (0-100)
   * @returns {TimeEstimation} Comprehensive time estimation data
   * 
   * @example
   * // Get time estimate at 50% through the SVG generation stage
   * const estimate = estimator.estimate('stage-d', 50);
   * console.log(`About ${estimate.remaining}s remaining (${estimate.completion}% complete)`);
   * console.log(`Estimate reliability: ${estimate.reliability * 100}%`);
   */
  estimate(currentStageId: string, stageProgressPercent: number = 0): TimeEstimation {
    const normalizedStageId = STAGE_MAPPING[currentStageId] || currentStageId;
    const currentStageIndex = this.stages.findIndex(s => s.id === normalizedStageId);
    const elapsedMs = Date.now() - this.startTime.getTime();
    const elapsedSeconds = elapsedMs / 1000;
    
    // Start timing the current stage if not already started
    if (!this.stageStartTimes[normalizedStageId]) {
      this.startStage(normalizedStageId);
    }
    
    // Calculate total configured duration based on speed-adjusted estimates
    const totalConfiguredDuration = this.stages.reduce((sum, stage) => {
      return sum + this.getStageEstimate(stage.id);
    }, 0) / 1000; // Convert to seconds
    
    // Calculate duration up to current stage
    let durationUpToCurrentStage = 0;
    for (let i = 0; i < currentStageIndex; i++) {
      durationUpToCurrentStage += this.getStageEstimate(this.stages[i].id) / 1000; // Convert to seconds
    }
    
    // Calculate current stage info
    const currentStageConfiguredDuration = currentStageIndex >= 0 ? 
      this.getStageEstimate(normalizedStageId) / 1000 : 0; // Convert to seconds
    const currentStageCompletedDuration = (stageProgressPercent / 100) * currentStageConfiguredDuration;
    
    // Calculate overall completion
    const totalCompletedConfiguredDuration = durationUpToCurrentStage + currentStageCompletedDuration;
    const completionPercentage = totalConfiguredDuration > 0 ? 
      (totalCompletedConfiguredDuration / totalConfiguredDuration) * 100 : 0;
    
    // If we have actual elapsed time and some progress, adjust total estimation
    let dynamicallyEstimatedTotalDuration = totalConfiguredDuration;
    let reliability = 0.5; // Default reliability
    
    if (elapsedSeconds > 0 && completionPercentage > 0) {
      // Weighted blend of configured and observed durations
      const observedTotalDuration = (elapsedSeconds / (completionPercentage / 100));
      const historyWeight = Math.min(0.8, Object.keys(this.stageHistory).length * 0.2);
      
      // As we complete more stages, favor observed durations more
      dynamicallyEstimatedTotalDuration = 
        (observedTotalDuration * historyWeight) + 
        (totalConfiguredDuration * (1 - historyWeight));
      
      // Calculate reliability based on consistency and amount of data
      const stageCount = this.stages.length;
      const completedStageCount = Object.keys(this.stageHistory).length;
      const progressWeight = Math.min(1, completionPercentage / 30); // More reliable after 30% completion
      reliability = Math.min(1, (completedStageCount / stageCount) * 0.6 + progressWeight * 0.4);
    }
    
    // Calculate remaining time
    const remainingSeconds = Math.max(0, dynamicallyEstimatedTotalDuration - elapsedSeconds);
    
    // Calculate stage remaining time
    const stageElapsedMs = Date.now() - (this.stageStartTimes[normalizedStageId] || Date.now());
    const stageRemainingTime = currentStageConfiguredDuration > 0 ?
      (currentStageConfiguredDuration * (1 - stageProgressPercent / 100)) * 1000 - stageElapsedMs : 0;
    
    return {
      totalEstimated: Math.round(dynamicallyEstimatedTotalDuration),
      elapsed: Math.round(elapsedSeconds),
      remaining: Math.round(remainingSeconds),
      completion: Math.round(completionPercentage),
      stageRemainingTime: Math.max(0, Math.round(stageRemainingTime / 1000)),
      reliability
    };
  }

  /**
   * @method reset
   * @description Resets the estimator with a fresh start time and optionally new stages
   * 
   * Resets the internal timing state, optionally with new stage configuration.
   * Can selectively preserve or reset historical performance data.
   * 
   * @param {Array<{id: string, duration: number}>} [stages] - Optional new stage configuration
   * @param {boolean} [resetHistory=false] - Whether to also reset stage history
   * @returns {void}
   * 
   * @example
   * // Reset timer but keep stage history for better future estimates
   * estimator.reset();
   * 
   * // Reset everything including history
   * estimator.reset(undefined, true);
   * 
   * // Reset with new stage configuration
   * estimator.reset([
   *   { id: 'stage-a', duration: 3000 }, // Faster than default
   *   { id: 'stage-b', duration: 15000 } // Slower than default
   * ]);
   */
  reset(stages?: { id: string; duration: number }[], resetHistory: boolean = false): void {
    this.startTime = new Date();
    this.stageStartTimes = {};
    
    if (stages) {
      this.stages = stages;
    }
    
    if (resetHistory) {
      this.stageHistory = {};
    }
  }
}

/**
 * @function estimateRemainingTime
 * @description Utility function to estimate remaining time for logo generation
 * 
 * This function creates a TimeEstimator instance with the provided stages,
 * incorporates any historical timing data, and returns the estimated
 * remaining time for the generation process.
 * 
 * @param {LogoStage[] | undefined} stages - Defined stages of the logo generation process
 * @param {string} currentStageId - The ID of the current active stage
 * @param {number} stageProgressPercent - Progress percentage within current stage (0-100)
 * @param {Record<string, { startTime: number; endTime?: number; progress: number }>} [stageHistory] - Optional history of stage timing
 * @returns {number} Estimated time remaining in milliseconds
 * 
 * @example
 * // Estimate remaining time from the EnhancedStreamProcessor
 * const remainingMs = estimateRemainingTime(
 *   pipelineStages,
 *   'stage-d',
 *   60, // 60% through current stage
 *   stageHistory
 * );
 * console.log(`Approximately ${remainingMs/1000} seconds remaining`);
 */
export function estimateRemainingTime(
  stages: LogoStage[] | undefined,
  currentStageId: string,
  stageProgressPercent: number,
  stageHistory?: Record<string, { startTime: number; endTime?: number; progress: number }>
): number {
  // Map stages to format expected by TimeEstimator
  const mappedStages = stages?.map(stage => ({
    id: stage.id,
    duration: stage.estimatedDuration || DEFAULT_STAGE_DURATIONS[stage.id] || 10000
  })) || Object.entries(DEFAULT_STAGE_DURATIONS).map(([id, duration]) => ({ id, duration }));
  
  // Create estimator
  const estimator = new TimeEstimator(mappedStages);
  
  // Incorporate stage history if available
  if (stageHistory) {
    for (const [stageId, history] of Object.entries(stageHistory)) {
      if (history.endTime) {
        // This stage is completed, add to history
        estimator.startStage(stageId);
        estimator.endStage(stageId);
      } else if (stageId !== currentStageId) {
        // Stage is in progress but not the current one
        estimator.startStage(stageId);
      }
    }
  }
  
  // Estimate based on current progress
  const estimation = estimator.estimate(currentStageId, stageProgressPercent);
  
  // Convert seconds to milliseconds for return value
  return estimation.remaining * 1000;
}