// Logo customization types
export interface SVGElement {
  id: string;
  type: 'path' | 'rect' | 'circle' | 'text' | 'polygon' | 'ellipse' | 'line' | 'g';
  attributes: Record<string, string | number>;
  content?: string; // For text elements
}

export interface LogoCustomizationState {
  elements: SVGElement[];
  selectedElementId: string | null;
  history: Array<{
    elements: SVGElement[];
    timestamp: number;
  }>;
  historyIndex: number;
  colorPalette: string[];
  fontOptions: string[];
  logoName: string;
}

// Props for the customization panel
export interface LogoCustomizerProps {
  svgCode: string;
  onCustomizationComplete: (customizedSvgCode: string) => void;
  onCancel?: () => void;
  initialPalette?: string[];
  availableFonts?: string[];
  className?: string;
}

// Props for the element editor
export interface ElementEditorProps {
  element: SVGElement;
  onUpdate: (updatedElement: SVGElement) => void;
  colorPalette: string[];
  fontOptions?: string[];
}

// Props for the color picker component
export interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  presetColors?: string[];
  className?: string;
}

// Props for the element selector
export interface ElementSelectorProps {
  elements: SVGElement[];
  selectedElementId: string | null;
  onSelectElement: (elementId: string) => void;
}

// Props for the positioning controls
export interface PositioningControlsProps {
  element: SVGElement;
  onUpdate: (updatedElement: SVGElement) => void;
}

// Props for the typography controls
export interface TypographyControlsProps {
  element: SVGElement;
  onUpdate: (updatedElement: SVGElement) => void;
  fontOptions: string[];
}

// Props for the history controls
export interface HistoryControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

// Props for the action buttons
export interface ActionButtonsProps {
  onSave: () => void;
  onCancel?: () => void;
  onReset: () => void;
}