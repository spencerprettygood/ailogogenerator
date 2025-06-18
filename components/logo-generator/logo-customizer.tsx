'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { LogoCustomizerProps, SVGElement, LogoCustomizationState } from '@/lib/types-customization';
import { parseSvgToElements, elementsToSvgCode, updateElement } from '@/lib/utils/svg-parser';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ElementEditor from './customizer/element-editor';
import ElementSelector from './customizer/element-selector';
import HistoryControls from './customizer/history-controls';
import { ArrowLeftIcon, UndoIcon, RedoIcon, SaveIcon } from 'lucide-react';

// Default color palette if none provided
const DEFAULT_COLOR_PALETTE = [
  '#000000', // Black
  '#FFFFFF', // White
  '#3B82F6', // Blue
  '#10B981', // Green
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
];

// Default font options if none provided
const DEFAULT_FONT_OPTIONS = [
  'Arial',
  'Helvetica',
  'Verdana',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Tahoma',
  'Trebuchet MS',
];

const LogoCustomizer: React.FC<LogoCustomizerProps> = ({
  svgCode,
  onCustomizationComplete,
  onCancel,
  initialPalette = DEFAULT_COLOR_PALETTE,
  availableFonts = DEFAULT_FONT_OPTIONS,
  className = '',
}) => {
  // Parse SVG and initialize state
  const [customizationState, setCustomizationState] = useState<LogoCustomizationState>(() => {
    try {
      const { elements, viewBox, svgAttrs } = parseSvgToElements(svgCode);
      return {
        elements,
        viewBox,
        svgAttrs,
        selectedElementId: null,
        history: [{ elements, timestamp: Date.now() }],
        historyIndex: 0,
        colorPalette: initialPalette,
        fontOptions: availableFonts,
        logoName: 'My Custom Logo',
      };
    } catch (error) {
      console.error('Error parsing SVG:', error);
      return {
        elements: [],
        viewBox: '0 0 100 100',
        svgAttrs: {},
        selectedElementId: null,
        history: [],
        historyIndex: -1,
        colorPalette: initialPalette,
        fontOptions: availableFonts,
        logoName: 'My Custom Logo',
      };
    }
  });

  // Preview SVG code
  const [previewSvgCode, setPreviewSvgCode] = useState<string>(svgCode);

  // Update preview when elements change
  useEffect(() => {
    try {
      const newSvgCode = elementsToSvgCode(
        customizationState.elements,
        customizationState.viewBox,
        customizationState.svgAttrs
      );
      setPreviewSvgCode(newSvgCode);
    } catch (error) {
      console.error('Error generating SVG code:', error);
    }
  }, [customizationState.elements, customizationState.viewBox, customizationState.svgAttrs]);

  // Selected element
  const selectedElement = customizationState.selectedElementId
    ? customizationState.elements.find(el => el.id === customizationState.selectedElementId)
    : null;

  // History management
  const canUndo = customizationState.historyIndex > 0;
  const canRedo = customizationState.historyIndex < customizationState.history.length - 1;

  const addToHistory = useCallback((elements: SVGElement[]) => {
    setCustomizationState(prev => {
      // Truncate future history if we're not at the end
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ elements, timestamp: Date.now() });
      
      return {
        ...prev,
        elements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    
    setCustomizationState(prev => {
      const newIndex = prev.historyIndex - 1;
      return {
        ...prev,
        elements: prev.history[newIndex].elements,
        historyIndex: newIndex,
      };
    });
  }, [canUndo]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    
    setCustomizationState(prev => {
      const newIndex = prev.historyIndex + 1;
      return {
        ...prev,
        elements: prev.history[newIndex].elements,
        historyIndex: newIndex,
      };
    });
  }, [canRedo]);

  // Element update handler
  const handleElementUpdate = useCallback((updatedElement: SVGElement) => {
    setCustomizationState(prev => {
      const updatedElements = prev.elements.map(el => 
        el.id === updatedElement.id ? updatedElement : el
      );
      
      // Add to history
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ elements: updatedElements, timestamp: Date.now() });
      
      return {
        ...prev,
        elements: updatedElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  // Element selection handler
  const handleElementSelect = useCallback((elementId: string) => {
    setCustomizationState(prev => ({
      ...prev,
      selectedElementId: elementId,
    }));
  }, []);

  // Save handler
  const handleSave = useCallback(() => {
    onCustomizationComplete(previewSvgCode);
  }, [previewSvgCode, onCustomizationComplete]);

  // Reset handler
  const handleReset = useCallback(() => {
    try {
      const { elements, viewBox, svgAttrs } = parseSvgToElements(svgCode);
      setCustomizationState(prev => ({
        ...prev,
        elements,
        viewBox,
        svgAttrs,
        selectedElementId: null,
        history: [{ elements, timestamp: Date.now() }],
        historyIndex: 0,
      }));
    } catch (error) {
      console.error('Error resetting SVG:', error);
    }
  }, [svgCode]);

  return (
    <Card className={`w-full max-w-5xl mx-auto shadow-lg ${className}`}>
      <CardHeader className="bg-gray-50 dark:bg-gray-800">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Logo Customizer</CardTitle>
          <HistoryControls
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </div>
      </CardHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {/* Logo Preview */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 min-h-[300px] rounded-md">
              <div
                className="max-w-full max-h-full w-auto h-auto"
                dangerouslySetInnerHTML={{ __html: previewSvgCode }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Customization Controls */}
        <div className="md:col-span-1">
          <Tabs defaultValue="elements" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
            </TabsList>

            <TabsContent value="elements" className="mt-0">
              <ElementSelector
                elements={customizationState.elements}
                selectedElementId={customizationState.selectedElementId}
                onSelectElement={handleElementSelect}
              />
            </TabsContent>

            <TabsContent value="editor" className="mt-0">
              {selectedElement ? (
                <ElementEditor
                  element={selectedElement}
                  onUpdate={handleElementUpdate}
                  colorPalette={customizationState.colorPalette}
                  fontOptions={customizationState.fontOptions}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 bg-gray-100 dark:bg-gray-700 rounded-md">
                  <p className="text-gray-600 dark:text-gray-300">
                    Select an element to edit
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CardFooter className="bg-gray-50 dark:bg-gray-800 flex justify-between">
        <Button 
          variant="outline" 
          onClick={onCancel || handleReset}
          className="flex items-center gap-1"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {onCancel ? 'Cancel' : 'Reset'}
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button 
            onClick={handleSave}
            className="flex items-center gap-1"
          >
            <SaveIcon className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LogoCustomizer;