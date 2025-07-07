'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Info, TrendingUp, Palette, Plus, Minus, ExternalLink } from 'lucide-react';

interface DesignPrinciple {
  id: string;
  title: string;
  description: string;
  link?: string;
}

interface DesignTrend {
  id: string;
  title: string;
  description: string;
  year: string;
  link?: string;
}

interface ColorTheory {
  id: string;
  title: string;
  description: string;
  colors: string[];
  link?: string;
}

interface DesignCitationsProps {
  designPrinciples?: DesignPrinciple[];
  designTrends?: DesignTrend[];
  colorTheory?: ColorTheory[];
  className?: string;
}

export function DesignCitations({
  designPrinciples = [],
  designTrends = [],
  colorTheory = [],
  className = '',
}: DesignCitationsProps) {
  const [activeTab, setActiveTab] = useState<'principles' | 'trends' | 'colors'>('principles');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Default design principles
  const defaultPrinciples: DesignPrinciple[] = [
    {
      id: 'simplicity',
      title: 'Simplicity',
      description:
        'Simple logos are more recognizable, memorable, and versatile. They work well across different media and sizes, from large billboards to small mobile icons.',
      link: 'https://www.nngroup.com/articles/simplicity-vs-complexity/',
    },
    {
      id: 'scalability',
      title: 'Scalability',
      description:
        'Effective logos maintain their integrity and legibility at any size, from a tiny favicon to a large billboard. Vector formats ensure logos remain crisp at any scale.',
      link: 'https://www.logodesignlove.com/logo-design-tips',
    },
    {
      id: 'versatility',
      title: 'Versatility',
      description:
        'A good logo works across all required applications, backgrounds, and contexts without losing its impact or recognition value.',
      link: 'https://99designs.com/blog/tips/5-characteristics-of-an-effective-logo/',
    },
  ];

  // Default design trends
  const defaultTrends: DesignTrend[] = [
    {
      id: 'minimalism',
      title: 'Minimalism',
      description:
        'Clean designs with ample white space, simple color schemes, and reduced elements continue to dominate logo design in the digital era.',
      year: '2023',
      link: 'https://www.creativebloq.com/features/logo-design-trends',
    },
    {
      id: 'responsive-logos',
      title: 'Responsive Logos',
      description:
        'Logos that adapt and simplify for different contexts and screen sizes, maintaining brand recognition even in their most minimalist form.',
      year: '2023',
      link: 'https://designshack.net/articles/trends/responsive-logo-design/',
    },
  ];

  // Default color theory
  const defaultColors: ColorTheory[] = [
    {
      id: 'complementary',
      title: 'Complementary Colors',
      description:
        'Colors opposite each other on the color wheel create strong contrast and visual interest when used together.',
      colors: ['#0066ff', '#ff9900'],
      link: 'https://www.colormatters.com/color-and-design/basic-color-theory',
    },
    {
      id: 'analogous',
      title: 'Analogous Colors',
      description:
        'Colors adjacent to each other on the color wheel create harmonious, cohesive designs with less contrast.',
      colors: ['#0066ff', '#0099ff', '#00ccff'],
      link: 'https://www.canva.com/colors/color-wheel/',
    },
  ];

  // Use provided arrays or fallback to defaults
  const principles = designPrinciples.length > 0 ? designPrinciples : defaultPrinciples;
  const trends = designTrends.length > 0 ? designTrends : defaultTrends;
  const colors = colorTheory.length > 0 ? colorTheory : defaultColors;

  // Toggle expanded state for an item
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center space-x-1 mb-4 border-b">
        <Button
          variant={activeTab === 'principles' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          data-state={activeTab === 'principles' ? 'active' : 'inactive'}
          onClick={() => setActiveTab('principles')}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Design Principles
        </Button>

        <Button
          variant={activeTab === 'trends' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          data-state={activeTab === 'trends' ? 'active' : 'inactive'}
          onClick={() => setActiveTab('trends')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          2023 Trends
        </Button>

        <Button
          variant={activeTab === 'colors' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
          data-state={activeTab === 'colors' ? 'active' : 'inactive'}
          onClick={() => setActiveTab('colors')}
        >
          <Palette className="h-4 w-4 mr-2" />
          Color Theory
        </Button>
      </div>

      {/* Design Principles */}
      {activeTab === 'principles' && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground mb-2">
            <Info className="h-4 w-4 inline-block mr-1" />
            Applied design principles in your logo:
          </div>

          {principles.map(principle => (
            <div key={principle.id} className="border rounded-lg p-3">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpanded(principle.id)}
              >
                <h3 className="font-medium">{principle.title}</h3>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {expandedItems[principle.id] ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedItems[principle.id] && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>{principle.description}</p>
                  {principle.link && (
                    <a
                      href={principle.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary flex items-center mt-2 text-xs"
                    >
                      Learn more
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Design Trends */}
      {activeTab === 'trends' && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4 inline-block mr-1" />
            Current design trends incorporated:
          </div>

          {trends.map(trend => (
            <div key={trend.id} className="border rounded-lg p-3">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpanded(trend.id)}
              >
                <div>
                  <h3 className="font-medium">{trend.title}</h3>
                  <span className="text-xs text-muted-foreground">{trend.year}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {expandedItems[trend.id] ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedItems[trend.id] && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>{trend.description}</p>
                  {trend.link && (
                    <a
                      href={trend.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary flex items-center mt-2 text-xs"
                    >
                      View examples
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Color Theory */}
      {activeTab === 'colors' && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground mb-2">
            <Palette className="h-4 w-4 inline-block mr-1" />
            Color theory applied in your logo:
          </div>

          {colors.map(color => (
            <div key={color.id} className="border rounded-lg p-3">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleExpanded(color.id)}
              >
                <div className="flex items-center">
                  <h3 className="font-medium mr-2">{color.title}</h3>
                  <div className="flex">
                    {color.colors.map((c, i) => (
                      <div
                        key={i}
                        className="h-4 w-4 rounded-full border"
                        style={{ backgroundColor: c, marginLeft: i > 0 ? '-4px' : '0' }}
                      />
                    ))}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {expandedItems[color.id] ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {expandedItems[color.id] && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>{color.description}</p>
                  {color.link && (
                    <a
                      href={color.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary flex items-center mt-2 text-xs"
                    >
                      Color theory details
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
