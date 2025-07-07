'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { MockupType } from '@/lib/mockups/mockup-types';
import {
  BackgroundImage,
  getAllBackgroundImages,
  getBackgroundsByType,
  getBackgroundsByTags,
} from '@/lib/mockups/background-image-registry';

interface EnhancedBackgroundSelectorProps {
  initialBackgroundId?: string;
  mockupType: MockupType;
  onSelectBackground: (backgroundId: string) => void;
  className?: string;
}

export function EnhancedBackgroundSelector({
  initialBackgroundId,
  mockupType,
  onSelectBackground,
  className = '',
}: EnhancedBackgroundSelectorProps) {
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | undefined>(
    initialBackgroundId
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredBackgrounds, setFilteredBackgrounds] = useState<BackgroundImage[]>([]);
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundImage[]>([]);

  // Load available backgrounds
  useEffect(() => {
    // Get backgrounds for this mockup type
    const backgroundsForType = getBackgroundsByType(mockupType);
    setAvailableBackgrounds(backgroundsForType);

    // Apply initial filtering
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      setFilteredBackgrounds(backgroundsForType);
    }
  }, [mockupType, searchQuery]);

  // Handle background selection
  const handleSelectBackground = (backgroundId: string) => {
    setSelectedBackgroundId(backgroundId);
    onSelectBackground(backgroundId);
  };

  // Handle search
  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredBackgrounds(availableBackgrounds);
      return;
    }

    // Search by name, description, and tags
    const lowerQuery = query.toLowerCase();
    const searchResults = availableBackgrounds.filter(
      bg =>
        bg.name.toLowerCase().includes(lowerQuery) ||
        bg.description.toLowerCase().includes(lowerQuery) ||
        bg.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );

    setFilteredBackgrounds(searchResults);
  };

  // Group backgrounds by their primary tag
  const groupedBackgrounds = filteredBackgrounds.reduce(
    (acc, background) => {
      // Use the first tag as the primary category
      const primaryTag = background.tags[0] || 'other';

      if (!acc[primaryTag]) {
        acc[primaryTag] = [];
      }

      acc[primaryTag].push(background);
      return acc;
    },
    {} as Record<string, BackgroundImage[]>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Background Selection</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search backgrounds..."
            className="pl-8"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
          />
        </div>

        {/* Background grid */}
        {Object.keys(groupedBackgrounds).length > 0 ? (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-3 w-full justify-start overflow-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              {Object.keys(groupedBackgrounds).map(tag => (
                <TabsTrigger key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {filteredBackgrounds.map(background => (
                  <div
                    key={background.id}
                    className={`relative rounded-md overflow-hidden cursor-pointer border-2 transition-all aspect-square ${
                      selectedBackgroundId === background.id
                        ? 'border-primary'
                        : 'border-transparent hover:border-muted'
                    }`}
                    onClick={() => handleSelectBackground(background.id)}
                    title={background.name}
                  >
                    <Image
                      src={background.preview || background.url}
                      alt={background.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            {Object.entries(groupedBackgrounds).map(([tag, backgrounds]) => (
              <TabsContent key={tag} value={tag} className="mt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                  {backgrounds.map(background => (
                    <div
                      key={background.id}
                      className={`relative rounded-md overflow-hidden cursor-pointer border-2 transition-all aspect-square ${
                        selectedBackgroundId === background.id
                          ? 'border-primary'
                          : 'border-transparent hover:border-muted'
                      }`}
                      onClick={() => handleSelectBackground(background.id)}
                      title={background.name}
                    >
                      <Image
                        src={background.preview || background.url}
                        alt={background.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No backgrounds found for this mockup type.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
