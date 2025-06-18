import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  TimeEstimator, 
  TimeEstimation,
  DEFAULT_STAGE_DURATIONS,
  STAGE_MAPPING,
  estimateRemainingTime
} from './time-estimation';
import { LogoStage } from './types';

describe('TimeEstimator', () => {
  let estimator: TimeEstimator;
  
  // Sample stages for testing
  const testStages = [
    { id: 'stage-a', duration: 5000 },
    { id: 'stage-b', duration: 10000 },
    { id: 'stage-c', duration: 5000 },
    { id: 'stage-d', duration: 30000 },
    { id: 'stage-e', duration: 8000 },
    { id: 'stage-f', duration: 15000 },
    { id: 'stage-g', duration: 15000 },
    { id: 'stage-h', duration: 5000 }
  ];
  
  beforeEach(() => {
    // Create a new estimator instance for each test
    estimator = new TimeEstimator(testStages);
    
    // Mock Date.now to have consistent time behavior
    let currentTime = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => {
      // Increment time by 1000ms on each call to simulate time passing
      currentTime += 1000;
      return currentTime;
    });
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('Basic estimation', () => {
    it('should provide initial estimation with default reliability', () => {
      const estimation = estimator.estimate('stage-a', 0);
      
      expect(estimation).toEqual(expect.objectContaining({
        totalEstimated: expect.any(Number),
        elapsed: expect.any(Number),
        remaining: expect.any(Number),
        completion: 0,
        reliability: 0.5 // Default reliability
      }));
    });
    
    it('should calculate progress based on completed stages and current stage progress', () => {
      // First estimate stage-a at 50% complete
      const estimation1 = estimator.estimate('stage-a', 50);
      
      expect(estimation1.completion).toBeCloseTo(3.1, 0); // ~3% of total
      
      // Move to stage-b (implies stage-a is completed)
      estimator.startStage('stage-a');
      estimator.endStage('stage-a');
      const estimation2 = estimator.estimate('stage-b', 50);
      
      // Now we've completed stage-a and 50% of stage-b
      expect(estimation2.completion).toBeCloseTo(12, 0); // ~12% of total
    });
    
    it('should adjust estimates based on actual stage durations', () => {
      // Start and complete stage-a twice as fast as expected
      estimator.startStage('stage-a');
      
      // Manipulate Date.now to simulate stage-a taking half the expected time
      vi.spyOn(Date, 'now').mockImplementationOnce(() => 1000 + 2500); // 2.5s instead of 5s
      
      estimator.endStage('stage-a');
      
      // Get estimate for stage-b
      const estimation = estimator.estimate('stage-b', 0);
      
      // The total estimated time should be adjusted downward
      expect(estimation.totalEstimated).toBeLessThan(
        testStages.reduce((sum, stage) => sum + stage.duration, 0) / 1000
      );
    });
  });
  
  describe('Stage timing', () => {
    it('should track stage timing correctly', () => {
      // Start timing stage-a
      estimator.startStage('stage-a');
      
      // Fast-forward time by 3000ms
      vi.advanceTimersByTime(3000);
      
      // End timing stage-a
      estimator.endStage('stage-a');
      
      // Get the stage estimate for next stage
      const stageEstimate = estimator.getStageEstimate('stage-b');
      
      // Stage-a took 3000ms instead of 5000ms (0.6x the expected time)
      // So stage-b should be estimated at around 0.6x its original duration
      // But this depends on the averaging algorithm, so we just check it's reduced
      expect(stageEstimate).toBeLessThan(10000);
    });
    
    it('should normalize stage IDs correctly', () => {
      // Test with different stage ID formats
      estimator.startStage('A'); // Capital letter format
      estimator.endStage('A');
      
      estimator.startStage('requirements'); // Name format
      estimator.endStage('requirements');
      
      // Both should map to stage-a and affect its timing data
      const stageEstimate = estimator.getStageEstimate('stage-a');
      
      // The estimate should be different from the original
      expect(stageEstimate).not.toBe(testStages[0].duration);
    });
  });
  
  describe('Reliability calculation', () => {
    it('should increase reliability as more stages complete', () => {
      // Initial estimate has default reliability
      const estimation1 = estimator.estimate('stage-a', 0);
      expect(estimation1.reliability).toBe(0.5);
      
      // Complete stage-a
      estimator.startStage('stage-a');
      estimator.endStage('stage-a');
      
      // Complete stage-b
      estimator.startStage('stage-b');
      estimator.endStage('stage-b');
      
      // Estimate stage-c
      const estimation2 = estimator.estimate('stage-c', 0);
      
      // Reliability should increase as we've completed 2/8 stages
      expect(estimation2.reliability).toBeGreaterThan(estimation1.reliability);
    });
    
    it('should increase reliability as current stage progresses', () => {
      // Estimate at 0% of current stage
      const estimation1 = estimator.estimate('stage-d', 0);
      
      // Estimate at 50% of current stage
      const estimation2 = estimator.estimate('stage-d', 50);
      
      // Reliability should increase as the stage progresses
      expect(estimation2.reliability).toBeGreaterThan(estimation1.reliability);
    });
  });
  
  describe('Reset functionality', () => {
    it('should reset timing data', () => {
      // Complete some stages
      estimator.startStage('stage-a');
      estimator.endStage('stage-a');
      
      // Reset the estimator
      estimator.reset();
      
      // Get fresh estimate
      const estimation = estimator.estimate('stage-a', 0);
      
      // Should use default timings again
      expect(estimation.totalEstimated).toBeCloseTo(
        testStages.reduce((sum, stage) => sum + stage.duration, 0) / 1000,
        0
      );
    });
    
    it('should optionally preserve history when reset', () => {
      // Complete a stage
      estimator.startStage('stage-a');
      estimator.endStage('stage-a');
      
      // Reset without clearing history
      estimator.reset(undefined, false);
      
      // Get estimate that should still reflect previous timing
      const stageEstimate = estimator.getStageEstimate('stage-a');
      
      // Should not be the default duration
      expect(stageEstimate).not.toBe(testStages[0].duration);
    });
  });
});

describe('estimateRemainingTime function', () => {
  beforeEach(() => {
    // Mock Date.now to have consistent behavior
    vi.spyOn(Date, 'now').mockImplementation(() => 1000);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should estimate time based on provided stages', () => {
    const mockStages: LogoStage[] = [
      {
        id: 'stage-a',
        name: 'Requirements',
        status: 'completed',
        estimatedDuration: 5000,
        order: 0
      },
      {
        id: 'stage-b',
        name: 'Moodboard',
        status: 'in-progress',
        estimatedDuration: 10000,
        order: 1
      },
      {
        id: 'stage-c',
        name: 'Selection',
        status: 'pending',
        estimatedDuration: 5000,
        order: 2
      }
    ];
    
    const stageHistory = {
      'stage-a': { 
        startTime: 0, 
        endTime: 4000, 
        progress: 100 
      },
      'stage-b': { 
        startTime: 4000, 
        progress: 50 
      }
    };
    
    const remainingTime = estimateRemainingTime(
      mockStages,
      'stage-b',
      50,
      stageHistory
    );
    
    // Should return a reasonable time estimate
    expect(remainingTime).toBeGreaterThan(0);
    
    // Stage-a took 4000ms instead of 5000ms (20% faster)
    // Stage-b is 50% complete with 50% remaining
    // Stage-c is still pending
    // Total remaining should be approximately 5000ms (stage-b remaining) + 4000ms (stage-c adjusted) = 9000ms
    expect(remainingTime).toBeCloseTo(9000, -3); // Allow 1s margin of error
  });
  
  it('should use default durations when stages not provided', () => {
    const remainingTime = estimateRemainingTime(
      undefined,
      'stage-c',
      50
    );
    
    // Should use DEFAULT_STAGE_DURATIONS
    const stageC = DEFAULT_STAGE_DURATIONS['stage-c'] || 0;
    const stageD = DEFAULT_STAGE_DURATIONS['stage-d'] || 0;
    const stageE = DEFAULT_STAGE_DURATIONS['stage-e'] || 0;
    const stageF = DEFAULT_STAGE_DURATIONS['stage-f'] || 0;
    const stageG = DEFAULT_STAGE_DURATIONS['stage-g'] || 0;
    const stageH = DEFAULT_STAGE_DURATIONS['stage-h'] || 0;
    
    // Expected remaining: 50% of stage-c + full stages d-h
    const expectedRemaining = (stageC * 0.5) + stageD + stageE + stageF + stageG + stageH;
    
    // Allow for some variation due to how the estimator works
    expect(remainingTime).toBeGreaterThan(0);
    expect(remainingTime).toBeCloseTo(expectedRemaining, -3); // Allow 1s margin of error
  });
  
  it('should handle stage aliases correctly', () => {
    // Test with different stage ID formats
    const remainingTimeA = estimateRemainingTime(undefined, 'A', 50);
    const remainingTimeStageA = estimateRemainingTime(undefined, 'stage-a', 50);
    
    // Both should return the same estimate
    expect(remainingTimeA).toEqual(remainingTimeStageA);
  });
});