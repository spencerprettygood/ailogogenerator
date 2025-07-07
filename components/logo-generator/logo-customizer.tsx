'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LogoCustomizerProps, SVGElement, LogoCustomizationState } from '@/lib/types-customization';
import { parseSvgToElements, elementsToSvgCode, updateElement } from '@/lib/utils/svg-parser';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ElementEditor from './customizer/element-editor';
import ElementSelector from './customizer/element-selector';
import ShapeLibrary from './customizer/shape-library';
import HistoryControls from './customizer/history-controls';
import {
  ArrowLeftIcon,
  UndoIcon,
  RedoIcon,
  SaveIcon,
  Shapes,
  Layers,
  Group,
  MoveUp,
  MoveDown,
  ArrowUpToLine,
  ArrowDownToLine,
} from 'lucide-react';

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
        selectedElementIds: [], // For multi-select
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
        selectedElementIds: [], // For multi-select
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
        customizationState.viewBox || '0 0 100 100',
        customizationState.svgAttrs || {}
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
      const historyItem = prev.history[newIndex];
      if (!historyItem) return prev;
      return {
        ...prev,
        elements: historyItem.elements,
        historyIndex: newIndex,
      };
    });
  }, [canUndo, customizationState.history]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;

    setCustomizationState(prev => {
      const newIndex = prev.historyIndex + 1;
      const historyItem = prev.history[newIndex];
      if (!historyItem) return prev;
      return {
        ...prev,
        elements: historyItem.elements,
        historyIndex: newIndex,
      };
    });
  }, [canRedo, customizationState.history]);

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
  const handleElementSelect = useCallback((elementId: string, isMultiSelect: boolean = false) => {
    setCustomizationState(prev => {
      if (isMultiSelect) {
        // Toggle selection in the multi-select array
        const isAlreadySelected = prev.selectedElementIds.includes(elementId);
        const newSelectedIds = isAlreadySelected
          ? prev.selectedElementIds.filter(id => id !== elementId)
          : [...prev.selectedElementIds, elementId];

        return {
          ...prev,
          selectedElementId: elementId, // Still set as the "primary" selection
          selectedElementIds: newSelectedIds,
        };
      } else {
        // Single selection mode
        return {
          ...prev,
          selectedElementId: elementId,
          selectedElementIds: [elementId], // Reset multi-select to just this element
        };
      }
    });
  }, []);

  // Add new shape handler
  const handleAddShape = useCallback((newElement: SVGElement) => {
    setCustomizationState(prev => {
      const updatedElements = [...prev.elements, newElement];

      // Add to history
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ elements: updatedElements, timestamp: Date.now() });

      return {
        ...prev,
        elements: updatedElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        selectedElementId: newElement.id, // Auto-select the new shape
        selectedElementIds: [newElement.id], // Reset multi-select to just this element
      };
    });
  }, []);

  // Group selected elements
  const handleGroupElements = useCallback(() => {
    setCustomizationState(prev => {
      // Need at least 2 elements to form a group
      if (prev.selectedElementIds.length < 2) return prev;

      // Generate a unique ID for the group
      const groupId = `group_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Create the group element
      const groupElement: SVGElement = {
        id: groupId,
        type: 'g',
        attributes: {
          id: groupId,
        },
        children: [],
      };

      // Filter out the selected elements from the main elements array
      // and collect them to add to the group
      const selectedElements: SVGElement[] = [];
      const remainingElements = prev.elements.filter(el => {
        if (prev.selectedElementIds.includes(el.id)) {
          selectedElements.push(el);
          return false;
        }
        return true;
      });

      // Add the selected elements as children of the group
      // We need to update their attributes to make them relative to the group
      const groupChildren = selectedElements.map(el => ({
        ...el,
        attributes: {
          ...el.attributes,
          parent: groupId, // Mark the parent for SVG rendering
        },
      }));

      // Create the new elements array with the group added
      const updatedElements = [
        ...remainingElements,
        {
          ...groupElement,
          children: groupChildren,
        },
      ];

      // Add to history
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ elements: updatedElements, timestamp: Date.now() });

      return {
        ...prev,
        elements: updatedElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        selectedElementId: groupId, // Select the new group
        selectedElementIds: [groupId], // Reset multi-select to just the group
      };
    });
  }, []);

  // Ungroup elements
  const handleUngroupElements = useCallback(() => {
    setCustomizationState(prev => {
      // Must have a single group selected to ungroup
      if (prev.selectedElementIds.length !== 1) return prev;

      const selectedId = prev.selectedElementId;
      const selectedElement = prev.elements.find(el => el.id === selectedId);

      // Must be a group element with children
      if (
        !selectedElement ||
        selectedElement.type !== 'g' ||
        !selectedElement.children ||
        selectedElement.children.length === 0
      ) {
        return prev;
      }

      // Extract all children from the group and remove the parent attribute
      const ungroupedChildren = selectedElement.children.map(child => {
        const { parent, ...attributes } = child.attributes;
        return {
          ...child,
          attributes,
        };
      });

      // Filter out the group from the elements array and add the children
      const updatedElements = [
        ...prev.elements.filter(el => el.id !== selectedId),
        ...ungroupedChildren,
      ];

      // Add to history
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ elements: updatedElements, timestamp: Date.now() });

      // Select the first child as the new selected element
      const newSelectedId =
        ungroupedChildren.length > 0 && ungroupedChildren[0] ? ungroupedChildren[0].id : null;

      return {
        ...prev,
        elements: updatedElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        selectedElementId: newSelectedId,
        selectedElementIds: newSelectedId ? [newSelectedId] : [],
      };
    });
  }, []);

  // Z-index controls
  const moveElementUp = useCallback(() => {
    setCustomizationState(prev => {
      if (!prev.selectedElementId) return prev;

      const elementIndex = prev.elements.findIndex(el => el.id === prev.selectedElementId);
      if (elementIndex < 0 || elementIndex >= prev.elements.length - 1) return prev;

      // Swap the element with the one above it
      const newElements = [...prev.elements];
      const elementToMove = newElements[elementIndex];
      const elementToSwap = newElements[elementIndex + 1];

      if (elementToMove && elementToSwap) {
        newElements[elementIndex] = elementToSwap;
        newElements[elementIndex + 1] = elementToMove;
      }

      // Add to history
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ elements: newElements, timestamp: Date.now() });

      return {
        ...prev,
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const moveElementDown = useCallback(() => {
    setCustomizationState(prev => {
      if (!prev.selectedElementId) return prev;

      const elementIndex = prev.elements.findIndex(el => el.id === prev.selectedElementId);
      if (elementIndex <= 0) return prev;

      // Swap the element with the one below it
      const newElements = [...prev.elements];
      const elementToMove = newElements[elementIndex];
      const elementToSwap = newElements[elementIndex - 1];

      if (elementToMove && elementToSwap) {
        newElements[elementIndex] = elementToSwap;
        newElements[elementIndex - 1] = elementToMove;
      }

      // Add to history
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ elements: newElements, timestamp: Date.now() });

      return {
        ...prev,
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const moveElementToFront = useCallback(() => {
    setCustomizationState(prev => {
      if (!prev.selectedElementId) return prev;

      const elementIndex = prev.elements.findIndex(el => el.id === prev.selectedElementId);
      const elementToMove = prev.elements[elementIndex];

      if (!elementToMove || elementIndex === -1 || elementIndex === prev.elements.length - 1)
        return prev;

      // Remove the element and add it to the end (top)
      const newElements = [
        ...prev.elements.filter(el => el.id !== prev.selectedElementId),
        elementToMove,
      ].filter((el): el is SVGElement => !!el);

      // Add to history
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ elements: newElements, timestamp: Date.now() });

      return {
        ...prev,
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const moveElementToBack = useCallback(() => {
    setCustomizationState(prev => {
      if (!prev.selectedElementId) return prev;

      const elementIndex = prev.elements.findIndex(el => el.id === prev.selectedElementId);
      const elementToMove = prev.elements[elementIndex];

      if (!elementToMove || elementIndex <= 0) return prev;

      // Remove the element and add it to the beginning (bottom)
      const newElements = [
        elementToMove,
        ...prev.elements.filter(el => el.id !== prev.selectedElementId),
      ].filter((el): el is SVGElement => !!el);

      // Add to history
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push({ elements: newElements, timestamp: Date.now() });

      return {
        ...prev,
        elements: newElements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
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
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="add" className="flex items-center justify-center">
                <Shapes className="h-3.5 w-3.5 mr-1.5" />
                Add Elements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="elements" className="mt-0">
              <div className="space-y-4">
                <div className="flex justify-between mb-2">
                  <h3 className="text-sm font-medium">Elements</h3>
                  <div className="flex flex-col space-y-1">
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={customizationState.selectedElementIds.length < 2}
                        onClick={handleGroupElements}
                        title="Group selected elements"
                      >
                        <Group className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          customizationState.selectedElementIds.length !== 1 ||
                          !customizationState.elements.find(
                            el =>
                              el.id === customizationState.selectedElementId &&
                              el.type === 'g' &&
                              el.children &&
                              el.children.length > 0
                          )
                        }
                        onClick={handleUngroupElements}
                        title="Ungroup selected group"
                      >
                        <Layers className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Z-index controls */}
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!customizationState.selectedElementId}
                        onClick={moveElementToFront}
                        title="Bring to front"
                      >
                        <ArrowUpToLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!customizationState.selectedElementId}
                        onClick={moveElementUp}
                        title="Bring forward"
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!customizationState.selectedElementId}
                        onClick={moveElementDown}
                        title="Send backward"
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!customizationState.selectedElementId}
                        onClick={moveElementToBack}
                        title="Send to back"
                      >
                        <ArrowDownToLine className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <ElementSelector
                  elements={customizationState.elements}
                  selectedElementId={customizationState.selectedElementId}
                  selectedElementIds={customizationState.selectedElementIds}
                  onSelectElement={handleElementSelect}
                  allowMultiSelect={true}
                />
                <div className="text-xs text-muted-foreground mt-2">
                  Hold Shift or Ctrl/Cmd to select multiple elements for grouping
                </div>
              </div>
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
                  <p className="text-gray-600 dark:text-gray-300">Select an element to edit</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="add" className="mt-0">
              <ShapeLibrary
                onAddShape={handleAddShape}
                colorPalette={customizationState.colorPalette}
              />
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
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleSave} className="flex items-center gap-1">
            <SaveIcon className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default LogoCustomizer;
