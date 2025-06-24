'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

// Stage information with descriptions
const STAGE_INFO = {
  'A': {
    title: 'Requirements Analysis',
    description: 'Analyzing your brand description to extract key design requirements including colors, style preferences, industry context, and target audience.',
    icon: 'analysis'
  },
  'B': {
    title: 'Moodboard Creation',
    description: 'Creating multiple design concepts based on your requirements, exploring different visual approaches, color schemes, and style directions.',
    icon: 'design'
  },
  'C': {
    title: 'Concept Selection',
    description: 'Evaluating all design concepts against your requirements to select the most effective direction for your brand identity.',
    icon: 'selection'
  },
  'D': {
    title: 'Logo Generation',
    description: 'Creating your custom SVG logo with precision vector graphics, crafting every element with attention to detail.',
    icon: 'generation'
  },
  'E': {
    title: 'Logo Validation',
    description: 'Optimizing your logo for performance and versatility, ensuring clean vector paths and technical quality.',
    icon: 'validation'
  },
  'F': {
    title: 'Variant Creation',
    description: 'Creating alternative versions of your logo for different contexts - monochrome variants, favicon, and multiple size formats.',
    icon: 'variants'
  },
  'G': {
    title: 'Guidelines',
    description: 'Developing comprehensive brand guidelines that document proper logo usage, color codes, and implementation recommendations.',
    icon: 'guidelines'
  },
  'H': {
    title: 'Asset Packaging',
    description: 'Preparing all your assets for convenient download - organizing files, creating appropriate formats, and packaging everything.',
    icon: 'packaging'
  },
  'I': {
    title: 'Animation',
    description: 'Adding smooth, engaging animations to your logo for digital applications, websites, and presentations.',
    icon: 'animation'
  }
};

interface Stage {
  id: string;
  label?: string;
  name?: string;
  status: 'pending' | 'in_progress' | 'in-progress' | 'completed' | 'error';
  progress: number;
  description?: string;
}

interface ProgressTimelineProps {
  stages: Stage[];
  currentStageId: string | null;
  overallProgress: number;
  estimatedTimeRemaining?: number | null;
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
  onStageClick?: (stageId: string) => void;
}

export function ProgressTimeline({
  stages,
  currentStageId,
  overallProgress,
  estimatedTimeRemaining,
  className = '',
  showLabels = true,
  compact = false,
  onStageClick
}: ProgressTimelineProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(!compact);
  
  // Update expanded stage when current stage changes
  useEffect(() => {
    if (currentStageId && !expandedStage) {
      setExpandedStage(currentStageId);
    }
  }, [currentStageId, expandedStage]);
  
  // Format estimated time remaining
  const formatTimeRemaining = (seconds: number | null | undefined) => {
    if (!seconds) return 'Calculating...';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    return `${Math.round(seconds / 60)} minute${Math.round(seconds / 60) !== 1 ? 's' : ''}`;
  };
  
  // Get stage title from our mapping or fallback to the stage label/name
  const getStageTitle = (stage: Stage) => {
    const stageKey = stage.id.replace('stage-', '');
    return STAGE_INFO[stageKey as keyof typeof STAGE_INFO]?.title || 
           stage.label || 
           stage.name || 
           `Stage ${stage.id}`;
  };
  
  // Get stage description from our mapping or use provided description
  const getStageDescription = (stage: Stage) => {
    const stageKey = stage.id.replace('stage-', '');
    return stage.description || 
           STAGE_INFO[stageKey as keyof typeof STAGE_INFO]?.description || 
           `Processing stage ${stage.id}`;
  };
  
  // Toggle expanded state for a stage
  const toggleStageExpand = (stageId: string) => {
    setExpandedStage(expandedStage === stageId ? null : stageId);
    if (onStageClick) {
      onStageClick(stageId);
    }
  };
  
  // Status icon for each stage
  const StatusIcon = ({ stage }: { stage: Stage }) => {
    const normalizedStatus = stage.status === 'in-progress' ? 'in_progress' : stage.status;
    
    switch (normalizedStatus) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <PlayCircle className="h-5 w-5 text-primary animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  // Sort stages by their ID to ensure proper order
  const sortedStages = [...stages].sort((a, b) => {
    // Extract letters from stage IDs (e.g., "stage-A" -> "A")
    const stageAId = a.id.replace('stage-', '');
    const stageBId = b.id.replace('stage-', '');
    return stageAId.localeCompare(stageBId);
  });
  
  return (
    <div className={`w-full ${className}`}>
      {/* Compact view (mobile-friendly) */}
      <div className="mb-4 bg-muted/30 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {estimatedTimeRemaining !== undefined && estimatedTimeRemaining !== null
                ? `Estimated time: ${formatTimeRemaining(estimatedTimeRemaining)}`
                : 'Generating your logo...'}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-2"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <>
                <span className="text-xs mr-1">Hide details</span>
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                <span className="text-xs mr-1">Show details</span>
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
        
        {/* Overall progress bar */}
        <div className="w-full bg-muted rounded-full h-2.5 mt-3 overflow-hidden">
          <motion.div 
            className="bg-primary h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: `${Math.max(0, Math.min(100, overallProgress))}%` 
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-xs text-right text-muted-foreground mt-1">
          {Math.round(overallProgress || 0)}% complete
        </div>
      </div>
      
      {/* Detailed timeline view */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-1">
              {sortedStages.map((stage, index) => {
                const isCurrentStage = currentStageId === stage.id;
                const isExpanded = expandedStage === stage.id;
                const isLastStage = index === sortedStages.length - 1;
                
                // Normalize status (handle both "in_progress" and "in-progress")
                const normalizedStatus = stage.status === 'in-progress' ? 'in_progress' : stage.status;
                
                return (
                  <div key={stage.id} className="relative">
                    {/* Connecting line between stages */}
                    {!isLastStage && (
                      <div 
                        className={`absolute left-2.5 top-5 w-0.5 h-full -z-10 ${
                          normalizedStatus === 'completed' ? 'bg-green-500' : 'bg-muted'
                        }`}
                      />
                    )}
                    
                    <div 
                      className={`relative ${isCurrentStage ? 'z-10' : 'z-0'}`}
                    >
                      <motion.div
                        initial={false}
                        animate={{
                          backgroundColor: isCurrentStage ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          boxShadow: isCurrentStage ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                        className={`rounded-md p-2 cursor-pointer transition-colors 
                          ${isCurrentStage ? 'bg-blue-100/50 dark:bg-blue-900/20' : ''}
                          ${isExpanded ? 'border border-muted' : ''}
                        `}
                        onClick={() => toggleStageExpand(stage.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <StatusIcon stage={stage} />
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm truncate">
                                {getStageTitle(stage)}
                              </h4>
                              <div className="flex items-center space-x-2">
                                {normalizedStatus === 'in_progress' && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    {Math.round(stage.progress)}%
                                  </span>
                                )}
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                            
                            {showLabels && !isExpanded && (
                              <p className="text-xs text-muted-foreground truncate">
                                {getStageDescription(stage).split('.')[0]}.
                              </p>
                            )}
                            
                            {/* Stage progress bar */}
                            {normalizedStatus === 'in_progress' && (
                              <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                                <motion.div 
                                  className="bg-primary h-1.5 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.max(0, Math.min(100, stage.progress))}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Expanded stage details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden mt-3"
                            >
                              <div className="pl-8 pr-2 pb-1">
                                <div className="flex items-start space-x-2">
                                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-muted-foreground">
                                    {getStageDescription(stage)}
                                  </p>
                                </div>
                                
                                {normalizedStatus === 'in_progress' && (
                                  <div className="mt-3 bg-blue-50 dark:bg-blue-900/10 p-2 rounded text-xs">
                                    <span className="font-medium">Currently processing:</span> This stage is {Math.round(stage.progress)}% complete
                                  </div>
                                )}
                                
                                {normalizedStatus === 'completed' && (
                                  <div className="mt-3 bg-green-50 dark:bg-green-900/10 p-2 rounded text-xs">
                                    <span className="font-medium">Completed:</span> This stage has been successfully processed
                                  </div>
                                )}
                                
                                {normalizedStatus === 'error' && (
                                  <div className="mt-3 bg-red-50 dark:bg-red-900/10 p-2 rounded text-xs">
                                    <span className="font-medium">Error:</span> There was an issue processing this stage
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}