'use client';

import React from 'react';
import Image from 'next/image';
import { SVGLogo } from '@/lib/types';
import { MockupType } from '@/lib/mockups/mockup-types';
import { MockupSelectorProps } from '@/lib/types-mockups';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MockupService } from '@/lib/mockups/mockup-service';

export function MockupSelector({
  templates,
  selectedTemplateId,
  onSelectTemplateAction,
  logo,
  brandName = 'Brand Name',
  className = ''
}: MockupSelectorProps) {
  // Group templates by type
  const templatesByType = templates.reduce((acc, template) => {
    if (!acc[template.type]) {
      acc[template.type] = [];
    }
    acc[template.type].push(template);
    return acc;
  }, {} as Record<MockupType, typeof templates>);

  // Convert enum to readable names
  const typeNames: Record<MockupType, string> = {
    [MockupType.BUSINESS_CARD]: 'Business Cards',
    [MockupType.WEBSITE]: 'Websites',
    [MockupType.TSHIRT]: 'Apparel',
    [MockupType.STOREFRONT]: 'Storefronts',
    [MockupType.SOCIAL_MEDIA]: 'Social Media',
    [MockupType.MOBILE_APP]: 'Mobile Apps',
    [MockupType.LETTERHEAD]: 'Letterheads',
    [MockupType.BILLBOARD]: 'Billboards',
    [MockupType.PACKAGING]: 'Packaging',
    [MockupType.EMAIL_SIGNATURE]: 'Email Signatures',
    [MockupType.FAVICON]: 'Favicons'
  };

  return (
    <div className={className}>
      {Object.entries(templatesByType).map(([type, typeTemplates]) => (
        <div key={type} className="mb-8">
          <h3 className="text-lg font-medium mb-3">{typeNames[type as MockupType]}</h3>
          <ScrollArea className="w-full whitespace-nowrap pb-4">
            <div className="flex space-x-4 pb-2">
              {typeTemplates.map((template) => {
                const isSelected = template.id === selectedTemplateId;
                
                // Use placeholder or generate a preview
                const previewUrl = template.thumbnailUrl || template.placeholderUrl || '/assets/mockups/placeholder.jpg';
                
                return (
                  <div 
                    key={template.id} 
                    className={cn(
                      "flex-shrink-0 cursor-pointer transition-all duration-200 rounded-lg overflow-hidden border-2",
                      isSelected 
                        ? "border-primary shadow-md" 
                        : "border-transparent hover:border-muted"
                    )}
                    onClick={() => onSelectTemplateAction(template.id)}
                  >
                    <div className="relative w-48 h-32">
                      <Image
                        src={previewUrl}
                        alt={template.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-2 bg-card">
                      <h4 className="text-sm font-medium truncate">{template.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      ))}
    </div>
  );
}