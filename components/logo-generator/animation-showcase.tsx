'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  AnimationType, 
  AnimationOptions,
  AnimationEasing,
  AnimationTrigger
} from '@/lib/animation/types';
import { animationTemplates } from '@/lib/animation/animation-service';

interface AnimationShowcaseProps {
  onSelectAnimation: (animationOptions: AnimationOptions) => void;
  svgPreview: string | null;
}

export const AnimationShowcase: React.FC<AnimationShowcaseProps> = ({
  onSelectAnimation,
  svgPreview
}) => {
  const [selectedTab, setSelectedTab] = useState('simple');
  
  const simpleAnimations = animationTemplates.filter(t => 
    t.id === 'fade-in' || t.id === 'zoom-in' || t.id === 'draw' || 
    t.id === 'sequential' || t.id === 'spin' || t.id === 'bounce'
  );
  
  const advancedAnimations = animationTemplates.filter(t => 
    t.id === 'morph' || t.id === 'pulse' || t.id === 'sequential'
  );
  
  const interactiveAnimations = animationTemplates.filter(t => 
    t.defaultOptions.trigger === AnimationTrigger.HOVER || 
    t.defaultOptions.trigger === AnimationTrigger.CLICK
  );

  // Create preview animation by applying it to the SVG
  const createPreview = (template: any) => {
    if (!svgPreview) return null;
    
    // This is a simplified approach - in a real app, you'd use the animation service
    const previewId = `animation-preview-${template.id}`;
    const animationClass = `animate-${template.id}`;
    
    // Add animation class to SVG
    const animatedSvg = svgPreview.replace('<svg', `<svg id="${previewId}" class="${animationClass}"`);
    
    return (
      <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-md p-4 flex items-center justify-center h-32">
        <div dangerouslySetInnerHTML={{ __html: animatedSvg }} />
      </div>
    );
  };

  return (
    <div>
      <Tabs defaultValue="simple" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="simple">Simple</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="interactive">Interactive</TabsTrigger>
        </TabsList>
        
        <TabsContent value="simple" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {simpleAnimations.map(template => (
              <Card key={template.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="font-medium mb-2">{template.name}</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{template.description}</p>
                  
                  {createPreview(template)}
                  
                  <Button 
                    onClick={() => onSelectAnimation(template.defaultOptions)}
                    className="w-full mt-3"
                    size="sm"
                  >
                    Apply to Logo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {advancedAnimations.map(template => (
              <Card key={template.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="font-medium mb-2">{template.name}</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{template.description}</p>
                  
                  {createPreview(template)}
                  
                  <Button 
                    onClick={() => onSelectAnimation(template.defaultOptions)}
                    className="w-full mt-3"
                    size="sm"
                  >
                    Apply to Logo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="interactive" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {interactiveAnimations.length > 0 ? (
              interactiveAnimations.map(template => (
                <Card key={template.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="font-medium mb-2">{template.name}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{template.description}</p>
                    
                    {createPreview(template)}
                    
                    <Button 
                      onClick={() => onSelectAnimation(template.defaultOptions)}
                      className="w-full mt-3"
                      size="sm"
                    >
                      Apply to Logo
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center p-8 text-gray-500 dark:text-gray-400">
                Interactive animations coming soon! These will respond to user actions like hover and click.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};