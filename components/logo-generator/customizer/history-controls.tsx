'use client';

import React from 'react';
import { HistoryControlsProps } from '@/lib/types-customization';
import { Button } from '@/components/ui/button';
import { UndoIcon, RedoIcon } from 'lucide-react';

const HistoryControls: React.FC<HistoryControlsProps> = ({ canUndo, canRedo, onUndo, onRedo }) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onUndo}
        disabled={!canUndo}
        className="h-8 w-8"
        title="Undo"
      >
        <UndoIcon className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onRedo}
        disabled={!canRedo}
        className="h-8 w-8"
        title="Redo"
      >
        <RedoIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default HistoryControls;
