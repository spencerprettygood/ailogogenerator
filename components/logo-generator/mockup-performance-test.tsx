'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { SVGLogo } from '@/lib/types';
import { EnhancedMockupPreview } from './enhanced-mockup-preview';
import { EnhancedMockupService } from '@/lib/mockups/enhanced-mockup-service';
import { TEST_SVG_LOGOS, testMockupPerformance } from '@/lib/mockups/mockup-test-utils';
import { getOptimizedEffectsConfig, detectDeviceCapabilities } from '@/lib/mockups/mockup-performance-optimizer';

interface MockupPerformanceTestProps {
  className?: string;
}

export function MockupPerformanceTest({
  className = ''
}: MockupPerformanceTestProps) {
  const [selectedSvgKey, setSelectedSvgKey] = useState<string>('simple');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [performanceResults, setPerformanceResults] = useState<Record<string, number> | null>(null);
  const [isTestRunning, setIsTestRunning] = useState<boolean>(false);
  const [deviceCapabilities, setDeviceCapabilities] = useState<any>(null);
  const [effectsIntensity, setEffectsIntensity] = useState<number>(50);
  
  // Get templates
  const templates = EnhancedMockupService.getAllTemplates();
  
  // Set initial template
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      const firstTemplate = templates[0];
      if (firstTemplate) {
        setSelectedTemplateId(firstTemplate.id);
      }
    }
    
    // Detect device capabilities
    if (typeof window !== 'undefined') {
      setDeviceCapabilities(detectDeviceCapabilities());
    }
  }, [templates, selectedTemplateId]);
  
  // Calculate effects config based on intensity
  const effectsConfig = React.useMemo(() => {
    const intensity = effectsIntensity / 100;
    
    const baseConfig = {
      applyLighting: intensity > 0.1,
      lightDirection: 'top' as const,
      lightIntensity: intensity * 0.6,
      applyPerspective: intensity > 0.4,
      perspectiveTransform: {
        rotateX: intensity > 0.4 ? 10 * intensity : 0,
        rotateY: intensity > 0.4 ? 15 * intensity : 0,
        rotateZ: 0,
        translateZ: 0
      },
      applyShadow: intensity > 0.2,
      shadowBlur: intensity > 0.2 ? 8 * intensity : 0,
      shadowOpacity: intensity > 0.2 ? 0.5 * intensity : 0
    };
    
    // Apply optimizations based on device capabilities
    return getOptimizedEffectsConfig(baseConfig);
  }, [effectsIntensity]);
  
  // Run performance test
  const runPerformanceTest = async () => {
    setIsTestRunning(true);
    
    try {
      const results = await testMockupPerformance(3);
      setPerformanceResults(results);
    } catch (error) {
      console.error('Performance test failed:', error);
    } finally {
      setIsTestRunning(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Mockup Performance Testing</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="test">Performance Test</TabsTrigger>
            <TabsTrigger value="device">Device Capabilities</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4 py-4">
            <div className="space-y-4">
              <div>
                <Label>SVG Complexity</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {Object.keys(TEST_SVG_LOGOS).map(key => (
                    <Button
                      key={key}
                      variant={selectedSvgKey === key ? 'default' : 'outline'}
                      onClick={() => setSelectedSvgKey(key)}
                      className="text-xs"
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Effects Intensity</Label>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm">Simple</span>
                  <Slider
                    value={[effectsIntensity]}
                    onValueChange={(values) => {
                      if (values[0] !== undefined) {
                        setEffectsIntensity(values[0])
                      }
                    }}
                    min={0}
                    max={100}
                    step={10}
                    className="flex-1"
                  />
                  <span className="text-sm">Complex</span>
                </div>
              </div>
              
              <div>
                <Label>Template</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {templates.slice(0, 6).map(template => (
                    <Button
                      key={template.id}
                      variant={selectedTemplateId === template.id ? 'default' : 'outline'}
                      onClick={() => setSelectedTemplateId(template.id)}
                      className="text-xs"
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            {selectedTemplateId && selectedSvgKey && TEST_SVG_LOGOS[selectedSvgKey] && (
              <div className="mt-6">
                <EnhancedMockupPreview
                  logo={TEST_SVG_LOGOS[selectedSvgKey]!}
                  template={templates.find(t => t.id === selectedTemplateId)!}
                  brandName="Test Brand"
                  showEffectsControls={true}
                  effectsConfig={effectsConfig}
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="test" className="space-y-4 py-4">
            <div className="flex justify-center mb-4">
              <Button 
                onClick={runPerformanceTest} 
                disabled={isTestRunning}
              >
                {isTestRunning ? 'Running Test...' : 'Run Performance Test'}
              </Button>
            </div>
            
            {performanceResults && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Test Results (avg ms per render)</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(performanceResults).map(([key, value]) => (
                    <div key={key} className="bg-muted p-4 rounded-md">
                      <div className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                      <div className="text-2xl font-bold">{value.toFixed(2)}ms</div>
                      <div className="text-xs text-muted-foreground">
                        {value < 20 ? 'Excellent' : value < 50 ? 'Good' : value < 100 ? 'Fair' : 'Poor'} performance
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-muted p-4 rounded-md mt-4">
                  <h4 className="font-medium mb-2">Performance Insights</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Basic mockups render in {performanceResults.basic?.toFixed(2)}ms</li>
                    <li>• Adding lighting effects adds {((performanceResults.lighting || 0) - (performanceResults.basic || 0)).toFixed(2)}ms</li>
                    <li>• Adding shadows adds {((performanceResults.shadow || 0) - (performanceResults.basic || 0)).toFixed(2)}ms</li>
                    <li>• Adding perspective adds {((performanceResults.perspective || 0) - (performanceResults.basic || 0)).toFixed(2)}ms</li>
                    <li>• All effects combined add {((performanceResults.allEffects || 0) - (performanceResults.basic || 0)).toFixed(2)}ms</li>
                  </ul>
                  
                  <h4 className="font-medium mt-4 mb-2">Recommendations</h4>
                  <ul className="text-sm space-y-1">
                    {(performanceResults.allEffects || 0) > 100 && (
                      <li>• Consider limiting effects on low-end devices</li>
                    )}
                    {(performanceResults.lighting || 0) > 50 && (
                      <li>• Lighting effects are expensive - consider optimizing or disabling for better performance</li>
                    )}
                    {(performanceResults.perspective || 0) > 50 && (
                      <li>• Perspective transforms are expensive - use with caution</li>
                    )}
                    {(performanceResults.shadow || 0) > 30 && (
                      <li>• Reduce shadow blur radius for better performance</li>
                    )}
                    {(performanceResults.allEffects || 0) < 50 && (
                      <li>• All effects perform well - no optimizations needed</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="device" className="space-y-4 py-4">
            {deviceCapabilities ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Device Capabilities</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-md">
                    <div className="font-medium">Complex Effects Support</div>
                    <div className="text-xl font-bold">
                      {deviceCapabilities.supportsComplexEffects ? 'Yes' : 'Limited'}
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <div className="font-medium">High Resolution Support</div>
                    <div className="text-xl font-bold">
                      {deviceCapabilities.supportsHighResolution ? 'Yes' : 'No'}
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <div className="font-medium">Memory Constrained</div>
                    <div className="text-xl font-bold">
                      {deviceCapabilities.memoryConstrained ? 'Yes' : 'No'}
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <div className="font-medium">Recommended Quality</div>
                    <div className="text-xl font-bold">
                      {deviceCapabilities.recommendedQuality.charAt(0).toUpperCase() + 
                        deviceCapabilities.recommendedQuality.slice(1)}
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md mt-4">
                  <h4 className="font-medium mb-2">Recommendations for this Device</h4>
                  <ul className="text-sm space-y-1">
                    {deviceCapabilities.memoryConstrained && (
                      <>
                        <li>• Use simplified effects for better performance</li>
                        <li>• Reduce shadow blur and complexity</li>
                        <li>• Limit or disable perspective transforms</li>
                      </>
                    )}
                    {!deviceCapabilities.supportsComplexEffects && (
                      <li>• Disable or minimize complex lighting effects</li>
                    )}
                    {deviceCapabilities.supportsHighResolution && (
                      <li>• High-DPI display detected - higher quality mockups recommended</li>
                    )}
                    {!deviceCapabilities.memoryConstrained && deviceCapabilities.supportsComplexEffects && (
                      <li>• This device supports all advanced effects - no limitations needed</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p>Device capabilities detection only works in browser environments.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}