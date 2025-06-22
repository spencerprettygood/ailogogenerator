'use client'

import React from 'react';
import StageItem from './stage-item';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Define the expected shape of a stage item
interface StageItemData {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  progress?: number;
  elapsedTime?: number;
  estimatedDuration?: number;
  details?: string;
}

// Define the props for the ProgressTracker component
interface ProgressTrackerProps {
  stages: any[]; // Accept any array of stage data
  currentStageId: string | null;
  overallProgress: number;
  estimatedRemainingTime: number | null;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  stages,
  currentStageId,
  overallProgress,
  estimatedRemainingTime,
}) => {
  if (!stages || stages.length === 0) {
    return (
      <Card className="w-full sticky top-4">
        <CardHeader>
          <CardTitle>Generation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">Waiting for generation to start...</p>
        </CardContent>
      </Card>
    );
  }

  // Safely find current stage index
  const currentStageIndex = Array.isArray(stages) 
    ? stages.findIndex(stage => stage && typeof stage === 'object' && 'id' in stage && stage.id === currentStageId)
    : -1;
  
  // Get current stage safely
  const currentStage = currentStageIndex >= 0 && currentStageIndex < stages.length 
    ? stages[currentStageIndex] 
    : null; // currentStage can be null if currentStageId is not found

  return (
    <Card className="w-full sticky top-4 shadow-lg dark:shadow-blue-900/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Logo Generation Progress
        </CardTitle>
        {currentStage && (currentStage.status === 'in-progress' || currentStage.status === 'in_progress') && (
          <CardDescription className="text-xs text-blue-600 dark:text-blue-400">
            Current Stage: {currentStage.name}
          </CardDescription>
        )}
        {estimatedRemainingTime !== null && estimatedRemainingTime > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Estimated time remaining: {Math.max(0, Math.ceil(estimatedRemainingTime / 60))} min
            {Math.max(0, Math.ceil(estimatedRemainingTime % 60))}s
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Progress value={overallProgress} className="w-full h-2 bg-gray-200 dark:bg-gray-700" />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Overall Progress
            </p>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{overallProgress}%</p>
          </div>
        </div>
        <ul className="space-y-1.5 max-h-[calc(100vh-20rem)] overflow-y-auto pr-1">
          {stages.map((stage, index) => (
            <StageItem
              key={stage && typeof stage === 'object' && 'id' in stage ? stage.id : `stage-${index}`}
              stage={stage}
              isCurrent={stage && typeof stage === 'object' && 'id' in stage && stage.id === currentStageId}
              isCompleted={
                stage && typeof stage === 'object' && 'status' in stage && 
                (String(stage.status) === 'completed' || (currentStageIndex !== -1 && index < currentStageIndex))
              }
              isUpcoming={
                stage && typeof stage === 'object' && 'status' in stage && 
                ((currentStageIndex === -1 && index === 0 && String(stage.status) === 'pending') || 
                 (currentStageIndex !== -1 && index > currentStageIndex && String(stage.status) === 'pending'))
              }
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
