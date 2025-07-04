'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Undo2 } from 'lucide-react';
import { EnhancedEffectsConfig } from '@/lib/mockups/mockup-types';
import { EnhancedMockupService } from '@/lib/mockups/enhanced-mockup-service';
import { EnhancedEffectsCustomizerProps } from '@/lib/types-mockups';

export function EnhancedEffectsCustomizer({
  effectsConfig,
  onEffectsChange,
  templateId,
  className = ''
}: EnhancedEffectsCustomizerProps) {
  const [localConfig, setLocalConfig] = useState<EnhancedEffectsConfig>(effectsConfig);

  // Update local config when props change
  useEffect(() => {
    setLocalConfig(effectsConfig);
  }, [effectsConfig]);

  // Apply changes to the parent component
  const applyChanges = (newConfig: Partial<EnhancedEffectsConfig>) => {
    const updatedConfig = { ...localConfig, ...newConfig };
    setLocalConfig(updatedConfig);
    onEffectsChange(updatedConfig);
  };

  // Reset to defaults
  const handleReset = () => {
    const defaultConfig = EnhancedMockupService.getRecommendedEffects(templateId);
    setLocalConfig(defaultConfig);
    onEffectsChange(defaultConfig);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex justify-between items-center">
          <span>Visual Effects</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="h-8 px-2 text-xs"
          >
            <Undo2 className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="lighting" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="lighting">Lighting</TabsTrigger>
            <TabsTrigger value="shadow">Shadow</TabsTrigger>
            <TabsTrigger value="perspective">3D</TabsTrigger>
          </TabsList>

          {/* Lighting Tab */}
          <TabsContent value="lighting" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="lighting-toggle" className="flex items-center gap-2">
                <span>Enable Lighting</span>
              </Label>
              <Switch 
                id="lighting-toggle" 
                checked={localConfig.applyLighting}
                onCheckedChange={(checked) => applyChanges({ applyLighting: checked })}
              />
            </div>

            {localConfig.applyLighting && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">Light Direction</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={localConfig.lightDirection === 'top' ? 'default' : 'outline'}
                      onClick={() => applyChanges({ lightDirection: 'top' })}
                    >
                      Top
                    </Button>
                    <Button
                      size="sm"
                      variant={localConfig.lightDirection === 'right' ? 'default' : 'outline'}
                      onClick={() => applyChanges({ lightDirection: 'right' })}
                    >
                      Right
                    </Button>
                    <Button
                      size="sm"
                      variant={localConfig.lightDirection === 'bottom' ? 'default' : 'outline'}
                      onClick={() => applyChanges({ lightDirection: 'bottom' })}
                    >
                      Bottom
                    </Button>
                    <Button
                      size="sm"
                      variant={localConfig.lightDirection === 'left' ? 'default' : 'outline'}
                      onClick={() => applyChanges({ lightDirection: 'left' })}
                    >
                      Left
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="light-intensity" className="text-xs">Light Intensity</Label>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(localConfig.lightIntensity * 100)}%
                    </span>
                  </div>
                  <Slider
                    id="light-intensity"
                    min={0}
                    max={1}
                    step={0.05}
                    value={[localConfig.lightIntensity]}
                    onValueChange={(value) => applyChanges({ lightIntensity: value[0] })}
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* Shadow Tab */}
          <TabsContent value="shadow" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="shadow-toggle" className="flex items-center gap-2">
                <span>Enable Shadow</span>
              </Label>
              <Switch 
                id="shadow-toggle" 
                checked={localConfig.applyShadow}
                onCheckedChange={(checked) => applyChanges({ applyShadow: checked })}
              />
            </div>

            {localConfig.applyShadow && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="shadow-blur" className="text-xs">Shadow Blur</Label>
                    <span className="text-xs text-muted-foreground">
                      {localConfig.shadowBlur}px
                    </span>
                  </div>
                  <Slider
                    id="shadow-blur"
                    min={0}
                    max={20}
                    step={1}
                    value={[localConfig.shadowBlur]}
                    onValueChange={(value) => applyChanges({ shadowBlur: value[0] })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="shadow-opacity" className="text-xs">Shadow Opacity</Label>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(localConfig.shadowOpacity * 100)}%
                    </span>
                  </div>
                  <Slider
                    id="shadow-opacity"
                    min={0}
                    max={1}
                    step={0.05}
                    value={[localConfig.shadowOpacity]}
                    onValueChange={(value) => applyChanges({ shadowOpacity: value[0] })}
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* Perspective Tab */}
          <TabsContent value="perspective" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="perspective-toggle" className="flex items-center gap-2">
                <span>Enable 3D Perspective</span>
              </Label>
              <Switch 
                id="perspective-toggle" 
                checked={localConfig.applyPerspective}
                onCheckedChange={(checked) => applyChanges({ applyPerspective: checked })}
              />
            </div>

            {localConfig.applyPerspective && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="rotate-x" className="text-xs">Rotate X</Label>
                    <span className="text-xs text-muted-foreground">
                      {localConfig.perspectiveTransform?.rotateX || 0}°
                    </span>
                  </div>
                  <Slider
                    id="rotate-x"
                    min={-45}
                    max={45}
                    step={1}
                    value={[localConfig.perspectiveTransform?.rotateX || 0]}
                    onValueChange={(value) => applyChanges({ 
                      perspectiveTransform: { 
                        ...(localConfig.perspectiveTransform || { rotateY: 0, rotateZ: 0, translateZ: 0 }),
                        rotateX: value[0] || 0 
                      } 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="rotate-y" className="text-xs">Rotate Y</Label>
                    <span className="text-xs text-muted-foreground">
                      {localConfig.perspectiveTransform?.rotateY || 0}°
                    </span>
                  </div>
                  <Slider
                    id="rotate-y"
                    min={-45}
                    max={45}
                    step={1}
                    value={[localConfig.perspectiveTransform?.rotateY || 0]}
                    onValueChange={(value) => applyChanges({ 
                      perspectiveTransform: { 
                        ...(localConfig.perspectiveTransform || { rotateX: 0, rotateZ: 0, translateZ: 0 }),
                        rotateY: value[0] || 0 
                      } 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="rotate-z" className="text-xs">Rotate Z</Label>
                    <span className="text-xs text-muted-foreground">
                      {localConfig.perspectiveTransform?.rotateZ || 0}°
                    </span>
                  </div>
                  <Slider
                    id="rotate-z"
                    min={-45}
                    max={45}
                    step={1}
                    value={[localConfig.perspectiveTransform?.rotateZ || 0]}
                    onValueChange={(value) => applyChanges({ 
                      perspectiveTransform: { 
                        ...(localConfig.perspectiveTransform || { rotateX: 0, rotateY: 0, translateZ: 0 }),
                        rotateZ: value[0] || 0 
                      } 
                    })}
                  />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}