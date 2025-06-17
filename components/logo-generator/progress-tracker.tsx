'use client'

import React from 'react';
import { ProgressTrackerProps } from '@/lib/types';
import StageItem from './stage-item'; // Corrected import
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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

  const currentStageIndex = stages.findIndex(stage => stage.id === currentStageId);
  const currentStage = stages[currentStageIndex]; // currentStage can be undefined if currentStageId is not found

  return (
    <Card className="w-full sticky top-4 shadow-lg dark:shadow-blue-900/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Logo Generation Progress
        </CardTitle>
        {currentStage && currentStage.status === 'in-progress' && (
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
              key={stage.id}
              stage={stage}
              isCurrent={stage.id === currentStageId}
              isCompleted={stage.status === 'completed' || (currentStageIndex !== -1 && index < currentStageIndex)}
              isUpcoming={ (currentStageIndex === -1 && index === 0 && stage.status === 'pending') || (currentStageIndex !== -1 && index > currentStageIndex && stage.status === 'pending')}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
