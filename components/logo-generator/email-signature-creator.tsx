'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Copy, 
  ExternalLink, 
  Sun, 
  Moon 
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { SVGLogo } from '@/lib/types';
import { 
  generateEmailSignature, 
  downloadEmailSignature, 
  EMAIL_SIGNATURE_TEMPLATES
} from '@/lib/mockups/email-signature-generator';
import { ErrorCategory, handleError } from '@/lib/utils/error-handler';

interface EmailSignatureCreatorProps {
  logo: string | SVGLogo;
  brandName: string;
  className?: string;
}

export function EmailSignatureCreator({ 
  logo,
  brandName,
  className = ''
}: EmailSignatureCreatorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('minimalist');
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');
  const [userData, setUserData] = useState({
    NAME: '',
    TITLE: '',
    EMAIL: '',
    PHONE: '',
    WEBSITE: '',
    ADDRESS: '',
    LINKEDIN_URL: '',
    TWITTER_URL: '',
    INSTAGRAM_URL: '',
    FACEBOOK_URL: ''
  });
  
  const [previewHtml, setPreviewHtml] = useState<string>('');
  
  // Generate preview when template or data changes
  const generatePreview = useCallback(() => {
    try {
      const html = generateEmailSignature(
        logo,
        selectedTemplateId,
        userData,
        brandName,
        colorScheme
      );
      setPreviewHtml(html);
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.UI,
        context: {
          component: 'EmailSignatureCreator',
          operation: 'generatePreview'
        }
      });
    }
  }, [logo, selectedTemplateId, userData, brandName, colorScheme]);
  
  // Update preview when necessary
  React.useEffect(() => {
    generatePreview();
  }, [generatePreview]);
  
  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };
  
  // Toggle color scheme
  const handleColorSchemeToggle = () => {
    setColorScheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  // Handle download
  const handleDownload = useCallback(() => {
    try {
      downloadEmailSignature(
        logo,
        selectedTemplateId,
        userData,
        brandName,
        colorScheme
      );
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.UI,
        context: {
          component: 'EmailSignatureCreator',
          operation: 'downloadEmailSignature'
        }
      });
    }
  }, [logo, selectedTemplateId, userData, brandName, colorScheme]);
  
  // Copy HTML to clipboard
  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(previewHtml);
      // Could add toast notification here
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.UI,
        context: {
          component: 'EmailSignatureCreator',
          operation: 'copyHtml'
        }
      });
    }
  };
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {/* Left side - Form */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Email Signature Creator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Template Style</Label>
              <div className="grid grid-cols-2 gap-3">
                {EMAIL_SIGNATURE_TEMPLATES.map(template => (
                  <Button
                    key={template.id}
                    variant={selectedTemplateId === template.id ? "default" : "outline"}
                    className="justify-start h-auto py-2 px-3"
                    onClick={() => handleTemplateChange(template.id)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground">{template.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Color scheme toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="color-scheme" className="text-sm font-medium">
                Color Scheme
              </Label>
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <Switch 
                  id="color-scheme" 
                  checked={colorScheme === 'dark'}
                  onCheckedChange={handleColorSchemeToggle}
                />
                <Moon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            {/* Personal info */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Personal Information</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs">Name</Label>
                  <Input 
                    id="name" 
                    value={userData.NAME}
                    onChange={e => handleInputChange('NAME', e.target.value)}
                    placeholder="John Doe"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="title" className="text-xs">Job Title</Label>
                  <Input 
                    id="title" 
                    value={userData.TITLE}
                    onChange={e => handleInputChange('TITLE', e.target.value)}
                    placeholder="Marketing Director"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Contact info */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Contact Information</Label>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={userData.EMAIL}
                    onChange={e => handleInputChange('EMAIL', e.target.value)}
                    placeholder="john@example.com"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs">Phone</Label>
                  <Input 
                    id="phone" 
                    value={userData.PHONE}
                    onChange={e => handleInputChange('PHONE', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="website" className="text-xs">Website</Label>
                  <Input 
                    id="website" 
                    value={userData.WEBSITE}
                    onChange={e => handleInputChange('WEBSITE', e.target.value)}
                    placeholder="www.example.com"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="address" className="text-xs">Address</Label>
                  <Input 
                    id="address" 
                    value={userData.ADDRESS}
                    onChange={e => handleInputChange('ADDRESS', e.target.value)}
                    placeholder="123 Business St, City, State"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Social media */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Social Media (optional)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="linkedin" className="text-xs">LinkedIn URL</Label>
                  <Input 
                    id="linkedin" 
                    value={userData.LINKEDIN_URL}
                    onChange={e => handleInputChange('LINKEDIN_URL', e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="twitter" className="text-xs">Twitter URL</Label>
                  <Input 
                    id="twitter" 
                    value={userData.TWITTER_URL}
                    onChange={e => handleInputChange('TWITTER_URL', e.target.value)}
                    placeholder="https://twitter.com/..."
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Right side - Preview and export */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className={`border rounded-md p-6 mb-4 ${colorScheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
              style={{ minHeight: '200px' }}
            >
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleDownload} 
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download as HTML
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleCopyHtml}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy HTML
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={generatePreview}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Refresh Preview
              </Button>
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground">
              <p>To use this signature in Gmail, Outlook, or other email clients:</p>
              <ol className="list-decimal ml-4 mt-2 space-y-1">
                <li>Click 'Copy HTML' or 'Download as HTML'</li>
                <li>In your email client, go to signature settings</li>
                <li>Paste the HTML into the signature editor</li>
                <li>Save your settings</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}