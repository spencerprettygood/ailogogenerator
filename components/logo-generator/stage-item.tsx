import React from 'react';
import { CheckCircle, AlertCircle, Loader2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StageItemProps {
  stage: any; // Accept any stage object
  isCurrent: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
}

const StageItem: React.FC<StageItemProps> = ({ stage, isCurrent, isCompleted, isUpcoming }) => {
  const getStatusIcon = () => {
    // Get stage status safely
    const status = typeof stage === 'object' && stage !== null && 'status' in stage 
      ? String(stage.status) // Convert to string to handle any type
      : 'pending';
    
    if (status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (status === 'error') {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    if (status === 'in-progress' || status === 'in_progress') {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
    // Use a dimmer circle for pending stages that are not the current one or upcoming
    if (status === 'pending' && (isCurrent || isUpcoming)) {
      return <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500" />;
    }
    return <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />;
  };

  // Safely get stage properties with fallbacks
  const getStageName = () => {
    if (typeof stage === 'object' && stage !== null) {
      // Try different properties that might contain the name
      if (typeof stage.name === 'string') return stage.name;
      if (typeof stage.label === 'string') return stage.label;
      if (typeof stage.id === 'string') return `Stage ${stage.id}`;
    }
    return 'Unknown Stage';
  };

  const getStageProp = (prop: string, defaultValue: any = undefined) => {
    if (typeof stage === 'object' && stage !== null && prop in stage) {
      return stage[prop];
    }
    return defaultValue;
  };

  // Get stage status with fallback
  const stageStatus = String(getStageProp('status', 'pending')); // Convert to string for safety
  const stageProgress = typeof getStageProp('progress') === 'number' ? getStageProp('progress') : undefined;
  const stageElapsedTime = typeof getStageProp('elapsedTime') === 'number' ? getStageProp('elapsedTime') : undefined;
  const stageEstimatedDuration = typeof getStageProp('estimatedDuration') === 'number' ? getStageProp('estimatedDuration') : 0;
  const stageDetails = typeof getStageProp('details') === 'string' ? getStageProp('details') : '';

  return (
    <li
      className={cn(
        'flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ease-in-out',
        isCurrent && 'bg-blue-50 dark:bg-blue-900/30 shadow-sm',
        isCompleted && 'opacity-70 hover:opacity-100',
        isUpcoming && 'opacity-50',
        stageStatus === 'error' && 'bg-red-50 dark:bg-red-900/30'
      )}
    >
      <div className="flex-shrink-0">{getStatusIcon()}</div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            isCurrent ? 'text-blue-600 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200',
            stageStatus === 'error' && 'text-red-600 dark:text-red-300',
            isCompleted && 'text-gray-600 dark:text-gray-400'
          )}
        >
          {getStageName()}
        </p>
        {(stageStatus === 'in-progress' || stageStatus === 'in_progress') && stageProgress !== undefined && (
          <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span>{stageProgress}%</span>
            {stageElapsedTime !== undefined && (
              <span className="ml-2">({stageElapsedTime}s elapsed)</span>
            )}
          </div>
        )}
        {stageStatus === 'completed' && stageElapsedTime !== undefined && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Completed in {stageElapsedTime}s
          </p>
        )}
        {stageStatus === 'error' && stageDetails && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{stageDetails}</p>
        )}
      </div>
      {isCurrent && stageEstimatedDuration > 0 && (
         <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
           ~{Math.round(stageEstimatedDuration / 60)} min
         </p>
      )}
    </li>
  );
};

export default StageItem;
