'use client';

import React from 'react';
import { ElementSelectorProps, SVGElement } from '@/lib/types-customization';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const ElementSelector: React.FC<ElementSelectorProps> = ({
  elements,
  selectedElementId,
  selectedElementIds = [],
  onSelectElement,
  allowMultiSelect = false,
}) => {
  // Group elements by type for better organization
  const groupedElements: Record<string, SVGElement[]> = elements.reduce(
    (groups, element) => {
      const type = element.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(element);
      return groups;
    },
    {} as Record<string, SVGElement[]>
  );

  // Get friendly element names for display
  const getElementName = (element: SVGElement): string => {
    // Try to get user-friendly name
    const id = element.id;
    const nameMatch = id.match(/([a-zA-Z]+)_\d+/);

    if (element.type === 'text' && element.content) {
      // For text elements, show content snippet
      const contentPreview = element.content.substring(0, 15);
      return `Text: "${contentPreview}${element.content.length > 15 ? '...' : ''}"`;
    }

    if (element.attributes.class) {
      // Use class if available
      return `${element.type.charAt(0).toUpperCase() + element.type.slice(1)}: ${element.attributes.class}`;
    }

    if (nameMatch) {
      // Use name part of the ID
      return `${(nameMatch?.[1] || '').charAt(0).toUpperCase() + (nameMatch?.[1] || '').slice(1)}`;
    }

    // Default to element type and ID
    return `${element.type.charAt(0).toUpperCase() + element.type.slice(1)} ${id.split('_').pop() || ''}`;
  };

  // Get element preview color
  const getElementColor = (element: SVGElement): string => {
    if (element.attributes.fill && element.attributes.fill !== 'none') {
      return element.attributes.fill as string;
    }
    if (element.attributes.stroke) {
      return element.attributes.stroke as string;
    }
    return '#888888'; // Default gray
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Logo Elements</h3>

      <ScrollArea className="h-[300px] rounded-md border">
        <div className="p-4 space-y-4">
          {Object.entries(groupedElements).map(([type, typeElements]) => (
            <div key={type} className="space-y-1">
              <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                {type}
              </h4>

              <div className="space-y-1">
                {typeElements.map(element => (
                  <Button
                    key={element.id}
                    variant={selectedElementIds.includes(element.id) ? 'default' : 'outline'}
                    className={`w-full justify-start text-left h-auto py-2 px-3 ${
                      selectedElementId === element.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={e => {
                      // Handle multi-select with Shift or Ctrl/Cmd key
                      const isMultiSelect =
                        allowMultiSelect && (e.shiftKey || e.ctrlKey || e.metaKey);
                      onSelectElement(element.id, isMultiSelect);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getElementColor(element) }}
                      />
                      <span className="text-sm truncate">{getElementName(element)}</span>
                      {element.type === 'g' && element.children && element.children.length > 0 && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          Group ({element.children.length})
                        </span>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ElementSelector;
