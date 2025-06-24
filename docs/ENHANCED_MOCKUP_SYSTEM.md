# Enhanced Mockup System

This document provides an overview of the enhanced mockup system for the AI Logo Generator, including implementation details, usage guidelines, and optimization recommendations.

## Overview

The enhanced mockup system provides realistic logo previews by incorporating:

1. Real background images instead of solid colors
2. Lighting effects with customizable direction and intensity
3. Shadow effects with adjustable blur and opacity
4. 3D perspective transforms for angled surfaces
5. Performance optimizations based on device capabilities

## System Architecture

The enhanced mockup system consists of the following components:

### Core Modules

- `enhanced-mockup-generator.ts`: Core module for generating enhanced mockups with realistic effects
- `enhanced-mockup-service.ts`: Service layer for managing mockup generation and templates
- `background-image-registry.ts`: Registry of background images organized by mockup type
- `mockup-performance-optimizer.ts`: Performance optimizations for different devices and browsers

### UI Components

- `enhanced-mockup-preview.tsx`: Preview component for displaying enhanced mockups
- `enhanced-mockup-preview-system.tsx`: Full mockup preview system with templates and customization
- `enhanced-background-selector.tsx`: Component for selecting background images
- `enhanced-effects-customizer.tsx`: Component for customizing visual effects
- `enhanced-mockup-integration.tsx`: Integration component for the main app

### Testing & Optimization

- `mockup-test-utils.ts`: Utilities for testing mockup generation with different SVG types
- `mockup-performance-test.tsx`: Component for testing and benchmarking mockup performance

## Implementation Details

### Background Images

Background images are stored in the `/public/assets/mockups/backgrounds/` directory, organized by mockup type. Each background image has a corresponding thumbnail in the `/public/assets/mockups/backgrounds/previews/` directory.

The background image registry (`background-image-registry.ts`) provides methods for retrieving backgrounds by type, tag, or ID.

### Visual Effects

The enhanced mockup generator supports three main types of visual effects:

1. **Lighting Effects**: Applies directional lighting to the logo, creating highlights and shadows based on the specified light direction and intensity.

2. **Shadow Effects**: Adds a drop shadow to the logo, with customizable blur radius and opacity.

3. **Perspective Transforms**: Applies 3D perspective transformations to make the logo appear correctly on angled surfaces.

### Performance Optimization

The mockup performance optimizer (`mockup-performance-optimizer.ts`) provides several optimization strategies:

1. **Device Capability Detection**: Detects the capabilities of the user's device and browser to determine the optimal rendering settings.

2. **SVG Optimization**: Reduces the complexity of SVG content for better rendering performance.

3. **Effect Simplification**: Simplifies or disables complex effects on lower-end devices.

4. **Image Size Optimization**: Adjusts image dimensions based on the device's screen resolution and capabilities.

## Usage Guidelines

### Basic Usage

To use the enhanced mockup system in your component:

```tsx
import { EnhancedMockupIntegration } from '@/components/logo-generator/enhanced-mockup-integration';

function MyComponent() {
  return (
    <EnhancedMockupIntegration
      logo={svgCode}
      brandName="My Brand"
    />
  );
}
```

### Advanced Usage

For more control over the mockup generation process:

```tsx
import { EnhancedMockupService } from '@/lib/mockups/enhanced-mockup-service';
import { EnhancedMockupPreview } from '@/components/logo-generator/enhanced-mockup-preview';

function MyAdvancedComponent() {
  // Get available templates
  const templates = EnhancedMockupService.getAllTemplates();
  
  // Select a template
  const selectedTemplate = templates[0];
  
  // Configure effects
  const effectsConfig = {
    applyLighting: true,
    lightDirection: 'top',
    lightIntensity: 0.3,
    applyPerspective: false,
    applyShadow: true,
    shadowBlur: 8,
    shadowOpacity: 0.3
  };
  
  return (
    <EnhancedMockupPreview
      logo={svgCode}
      template={selectedTemplate}
      backgroundId="business-card-desk-1"
      customText={{ 'company-name': 'My Company' }}
      brandName="My Brand"
      showEffectsControls={true}
      effectsConfig={effectsConfig}
    />
  );
}
```

## Performance Recommendations

1. **Mobile Optimization**: On mobile devices, reduce or disable complex effects to maintain good performance.

2. **SVG Complexity**: Complex SVGs with many paths, gradients, or filters will render more slowly. Consider simplifying SVGs for better performance.

3. **Background Image Size**: Use appropriately sized background images for different devices. High-resolution images should only be loaded on devices with high-DPI displays.

4. **Effect Intensity**: Adjust effect intensity based on device capabilities. The mockup performance optimizer can help with this.

5. **Progressive Loading**: Implement progressive loading for slower connections by showing a simpler version first and enhancing it as resources load.

## Adding New Background Images

To add new background images to the system:

1. Place the background image in `/public/assets/mockups/backgrounds/` with a descriptive filename.

2. Create a thumbnail version (300x200px recommended) in `/public/assets/mockups/backgrounds/previews/` with the suffix `-thumb`.

3. Update the `BACKGROUND_IMAGES` object in `background-image-registry.ts` with the new image's metadata:

```typescript
{
  id: 'business-card-desk-2',
  url: '/assets/mockups/backgrounds/business-card-desk-2.jpg',
  type: MockupType.BUSINESS_CARD,
  name: 'Business Card on Wood Desk',
  description: 'Business card on a wooden desk with office supplies',
  tags: ['desk', 'wood', 'office', 'supplies'],
  preview: '/assets/mockups/backgrounds/previews/business-card-desk-2-thumb.jpg'
}
```

## Testing

To test the enhanced mockup system with different SVG types and device capabilities, use the test page at `/test-mockups`.

This page provides:

1. A showcase of different logo types rendered with the enhanced mockup system
2. A performance testing tool for benchmarking rendering performance
3. A device capability detector for optimizing the user experience

## Future Enhancements

1. **WebP Support**: Add support for WebP image format with fallbacks for better performance.

2. **More Background Types**: Expand the background image library with more realistic scenarios.

3. **AI-Generated Backgrounds**: Integrate with AI image generation to create custom backgrounds based on the logo's industry or style.

4. **3D Mockup Generation**: Add support for generating 3D mockups with realistic materials and lighting.

5. **Animation Integration**: Integrate with the animation system to preview animated logos in realistic contexts.