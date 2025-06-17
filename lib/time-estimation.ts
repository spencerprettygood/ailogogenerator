export interface TimeEstimation {
  totalEstimated: number;
  elapsed: number;
  remaining: number;
  completion: number; // percentage
}

export class TimeEstimator {
  private startTime: Date;
  private stages: { id: string; duration: number }[];
  
  constructor(stages: { id: string; duration: number }[]) {
    this.startTime = new Date();
    this.stages = stages;
  }

  estimate(currentStageId: string, stageProgressPercent: number = 0): TimeEstimation {
    const currentStageIndex = this.stages.findIndex(s => s.id === currentStageId);
    const elapsedSeconds = (Date.now() - this.startTime.getTime()) / 1000;
    
    const totalConfiguredDuration = this.stages.reduce((sum, stage) => sum + stage.duration, 0);
    
    let durationUpToCurrentStage = 0;
    for (let i = 0; i < currentStageIndex; i++) {
      durationUpToCurrentStage += this.stages[i].duration;
    }
    
    const currentStageConfiguredDuration = currentStageIndex >= 0 ? this.stages[currentStageIndex].duration : 0;
    const currentStageCompletedDuration = (stageProgressPercent / 100) * currentStageConfiguredDuration;
    
    const totalCompletedConfiguredDuration = durationUpToCurrentStage + currentStageCompletedDuration;
    const completionPercentage = totalConfiguredDuration > 0 ? (totalCompletedConfiguredDuration / totalConfiguredDuration) * 100 : 0;
    
    // If we have actual elapsed time and some progress, adjust total estimation
    let dynamicallyEstimatedTotalDuration = totalConfiguredDuration;
    if (elapsedSeconds > 0 && completionPercentage > 0) {
      dynamicallyEstimatedTotalDuration = (elapsedSeconds / completionPercentage) * 100;
    }
    
    const remainingSeconds = Math.max(0, dynamicallyEstimatedTotalDuration - elapsedSeconds);
    
    return {
      totalEstimated: Math.round(dynamicallyEstimatedTotalDuration),
      elapsed: Math.round(elapsedSeconds),
      remaining: Math.round(remainingSeconds),
      completion: Math.round(completionPercentage)
    };
  }

  reset(): void {
    this.startTime = new Date();
  }
}
