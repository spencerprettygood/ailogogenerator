import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface MockupPreviewSimplifiedProps {
  logo: string;
  brandName: string;
  onDownload: (mockupId: string, format: string) => void;
}

// Mockup contexts
const MOCKUP_CONTEXTS = [
  { 
    id: 'digital', 
    name: 'Digital', 
    mockups: [
      { id: 'website', name: 'Website', image: '/assets/mockups/website.jpg' },
      { id: 'app', name: 'Mobile App', image: '/assets/mockups/app.jpg' },
      { id: 'social', name: 'Social Media', image: '/assets/mockups/social.jpg' }
    ]
  },
  {
    id: 'print',
    name: 'Print',
    mockups: [
      { id: 'business-card', name: 'Business Card', image: '/assets/mockups/business-card.jpg' },
      { id: 'letterhead', name: 'Letterhead', image: '/assets/mockups/letterhead.jpg' },
      { id: 'brochure', name: 'Brochure', image: '/assets/mockups/brochure.jpg' }
    ]
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    mockups: [
      { id: 'tshirt', name: 'T-Shirt', image: '/assets/mockups/tshirt.jpg' },
      { id: 'mug', name: 'Mug', image: '/assets/mockups/mug.jpg' },
      { id: 'tote', name: 'Tote Bag', image: '/assets/mockups/tote.jpg' }
    ]
  }
];

export const MockupPreviewSimplified: React.FC<MockupPreviewSimplifiedProps> = ({
  logo,
  brandName,
  onDownload
}) => {
  const [selectedTab, setSelectedTab] = useState('digital');
  
  // Create a mockup preview by overlaying the logo on a mockup template
  const createMockupPreview = (mockupId: string, mockupImage: string) => {
    // This is a simplified approach - in a real implementation, you would position 
    // the logo appropriately on the mockup template
    return (
      <div className="relative h-48 rounded-md overflow-hidden bg-gray-100">
        {/* Placeholder for mockup - in production this would show an actual mockup with the logo */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-400">
            <p className="text-xs">{mockupId} mockup preview</p>
            <p className="text-xs">Would show {brandName} logo applied to this context</p>
          </div>
        </div>
        
        {/* Download button */}
        <div className="absolute bottom-2 right-2">
          <Button 
            variant="secondary" 
            size="sm"
            className="text-xs"
            onClick={() => onDownload(mockupId, 'png')}
          >
            <Download className="h-3 w-3 mr-1" />
            PNG
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Tabs defaultValue="digital" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          {MOCKUP_CONTEXTS.map(context => (
            <TabsTrigger key={context.id} value={context.id}>
              {context.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {MOCKUP_CONTEXTS.map(context => (
          <TabsContent key={context.id} value={context.id} className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {context.mockups.map(mockup => (
                <Card key={mockup.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="font-medium text-sm mb-2">{mockup.name}</div>
                    {createMockupPreview(mockup.id, mockup.image)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};