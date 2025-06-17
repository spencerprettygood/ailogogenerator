import React from 'react';
import { StageItemProps } from '@/lib/types';
import { CheckCircle, AlertCircle, Loader2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const StageItem: React.FC<StageItemProps> = ({ stage, isCurrent, isCompleted, isUpcoming }) => {
  const getStatusIcon = () => {
    if (stage.status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (stage.status === 'error') {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    if (stage.status === 'in-progress') {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
    // Use a dimmer circle for pending stages that are not the current one or upcoming
    if (stage.status === 'pending' && (isCurrent || isUpcoming)) {
      return <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500" />;
    }
    return <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />;
  };

  return (
    <li
      className={cn(
        'flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ease-in-out',
        isCurrent && 'bg-blue-50 dark:bg-blue-900/30 shadow-sm',
        isCompleted && 'opacity-70 hover:opacity-100',
        isUpcoming && 'opacity-50',
        stage.status === 'error' && 'bg-red-50 dark:bg-red-900/30'
      )}
    >
      <div className="flex-shrink-0">{getStatusIcon()}</div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            isCurrent ? 'text-blue-600 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200',
            stage.status === 'error' && 'text-red-600 dark:text-red-300',
            isCompleted && 'text-gray-600 dark:text-gray-400'
          )}
        >
          {stage.name}
        </p>
        {stage.status === 'in-progress' && stage.progress !== undefined && (
          <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span>{stage.progress}%</span>
            {stage.elapsedTime !== undefined && (
              <span className="ml-2">({stage.elapsedTime}s elapsed)</span>
            )}
          </div>
        )}
        {stage.status === 'completed' && stage.elapsedTime !== undefined && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Completed in {stage.elapsedTime}s
          </p>
        )}
        {stage.status === 'error' && stage.details && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{stage.details}</p>
        )}
      </div>
      {isCurrent && stage.estimatedDuration > 0 && (
         <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
           ~{Math.round(stage.estimatedDuration / 60)} min
         </p>
      )}
    </li>
  );
};

export default StageItem;
