'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Sparkles,
  Wand2,
  Palette,
  LayoutGrid,
  CheckCircle,
  FileText,
  Package,
  PlayCircle,
  Loader2,
  Images,
  FileSymlink,
  Bot,
  FileImage,
  BadgeCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

const STAGE_ICONS: Record<string, React.ReactNode> = {
  A: <Bot className="w-8 h-8" />,
  B: <Palette className="w-8 h-8" />,
  C: <CheckCircle className="w-8 h-8" />,
  D: <Wand2 className="w-8 h-8" />,
  E: <BadgeCheck className="w-8 h-8" />,
  F: <FileSymlink className="w-8 h-8" />,
  G: <FileText className="w-8 h-8" />,
  H: <Package className="w-8 h-8" />,
  I: <PlayCircle className="w-8 h-8" />,
};

const STAGE_DETAILS: Record<string, { title: string; description: string; color: string }> = {
  A: {
    title: 'Requirements Analysis',
    description: 'Analyzing your brand to extract key design elements',
    color: 'bg-blue-500 dark:bg-blue-600',
  },
  B: {
    title: 'Moodboard Creation',
    description: 'Creating design concepts based on your requirements',
    color: 'bg-purple-500 dark:bg-purple-600',
  },
  C: {
    title: 'Concept Selection',
    description: 'Selecting the optimal design direction',
    color: 'bg-amber-500 dark:bg-amber-600',
  },
  D: {
    title: 'Logo Generation',
    description: 'Creating your custom logo with precision',
    color: 'bg-emerald-500 dark:bg-emerald-600',
  },
  E: {
    title: 'Logo Validation',
    description: 'Ensuring your logo meets quality standards',
    color: 'bg-indigo-500 dark:bg-indigo-600',
  },
  F: {
    title: 'Variant Creation',
    description: 'Creating versatile versions of your logo',
    color: 'bg-rose-500 dark:bg-rose-600',
  },
  G: {
    title: 'Guidelines Creation',
    description: 'Developing brand usage guidelines',
    color: 'bg-teal-500 dark:bg-teal-600',
  },
  H: {
    title: 'Asset Packaging',
    description: 'Packaging all assets for download',
    color: 'bg-orange-500 dark:bg-orange-600',
  },
  I: {
    title: 'Animation Creation',
    description: 'Adding motion to bring your logo to life',
    color: 'bg-cyan-500 dark:bg-cyan-600',
  },
};

interface StageTransitionProps {
  currentStage: string | null;
  previousStage: string | null;
  progress: number;
  className?: string;
  isGenerating: boolean;
  onAnimationComplete?: () => void;
}

export function StageTransition({
  currentStage,
  previousStage,
  progress,
  className = '',
  isGenerating,
  onAnimationComplete,
}: StageTransitionProps) {
  const [showTransition, setShowTransition] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Show transition when stage changes
  useEffect(() => {
    if (currentStage && previousStage && currentStage !== previousStage) {
      setShowTransition(true);
      setAnimationKey(prev => prev + 1);

      // Hide after animation completes
      const timer = setTimeout(() => {
        setShowTransition(false);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 2500); // Animation duration + extra time

      return () => clearTimeout(timer);
    }
  }, [currentStage, previousStage, onAnimationComplete]);

  // Get stage letter from ID (e.g., "stage-A" -> "A")
  const getStageKey = (stageId: string | null) => {
    if (!stageId) return null;
    return stageId.replace('stage-', '');
  };

  const currentStageKey = getStageKey(currentStage);
  const previousStageKey = getStageKey(previousStage);

  // Don't render if no current stage or not showing transition
  if (!currentStageKey || !isGenerating || !showTransition) {
    return null;
  }

  // Get current stage details
  const stageDetails = STAGE_DETAILS[currentStageKey] || {
    title: `Stage ${currentStageKey}`,
    description: 'Processing your logo',
    color: 'bg-gray-500 dark:bg-gray-600',
  };

  // Get stage icon
  const stageIcon = STAGE_ICONS[currentStageKey] || <Sparkles className="w-8 h-8" />;

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        when: 'afterChildren',
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeIn' },
    },
  };

  const iconVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        type: 'spring',
        stiffness: 200,
        damping: 10,
      },
    },
    exit: {
      scale: 1.2,
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  const progressVariants: Variants = {
    hidden: { width: 0 },
    visible: {
      width: `${progress}%`,
      transition: { duration: 0.8, ease: 'easeInOut' },
    },
  };

  // Particle effect for the stage transition
  const particles = Array.from({ length: 15 }, (_, i) => i);

  return (
    <AnimatePresence mode="wait">
      {showTransition && (
        <motion.div
          key={`transition-${animationKey}`}
          className={`fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm ${className}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <Card className="relative p-8 max-w-md w-full bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
            {/* Background particles */}
            {particles.map(i => (
              <motion.div
                key={`particle-${i}`}
                className={`absolute w-2 h-2 rounded-full ${stageDetails.color}`}
                initial={{
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 400 - 200,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  x: Math.random() * 600 - 300,
                  y: Math.random() * 600 - 300,
                  opacity: [0, 0.8, 0],
                  scale: [0, Math.random() * 0.8 + 0.2, 0],
                }}
                transition={{
                  duration: 1.5 + Math.random(),
                  ease: 'easeInOut',
                  repeat: 1,
                  repeatType: 'reverse',
                }}
              />
            ))}

            <div className="relative z-10 text-center">
              {/* Previous stage -> Current stage */}
              {previousStageKey && (
                <motion.div
                  className="text-sm text-muted-foreground mb-3 flex items-center justify-center"
                  variants={itemVariants}
                >
                  <span>Stage {previousStageKey}</span>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-2">
                    <motion.path
                      d="M5 12H19M19 12L13 6M19 12L13 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </svg>
                  <span>Stage {currentStageKey}</span>
                </motion.div>
              )}

              {/* Icon */}
              <motion.div
                className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center text-white mb-4 ${stageDetails.color}`}
                variants={iconVariants}
              >
                {stageIcon}
              </motion.div>

              {/* Title */}
              <motion.h3 className="text-xl font-bold mb-2" variants={itemVariants}>
                {stageDetails.title}
              </motion.h3>

              {/* Description */}
              <motion.p className="text-muted-foreground mb-6" variants={itemVariants}>
                {stageDetails.description}
              </motion.p>

              {/* Progress bar */}
              <motion.div
                className="h-1 bg-muted rounded-full overflow-hidden mb-4"
                variants={itemVariants}
              >
                <motion.div
                  className={`h-full ${stageDetails.color}`}
                  variants={progressVariants}
                />
              </motion.div>

              {/* Loading indicator */}
              <motion.div
                className="flex items-center justify-center text-sm text-muted-foreground"
                variants={itemVariants}
              >
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Processing...
              </motion.div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
