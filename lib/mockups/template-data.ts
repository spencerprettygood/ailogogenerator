import { MockupTemplate, MockupType } from './mockup-types';

// Default mockup templates for the system
export const DEFAULT_MOCKUP_TEMPLATES: MockupTemplate[] = [
  {
    id: 'business-card-1',
    type: MockupType.BUSINESS_CARD,
    name: 'Classic Business Card',
    description: 'Elegant, minimalist business card design',
    placeholderUrl: '/assets/mockups/business-card-placeholder.jpg',
    thumbnailUrl: '/assets/mockups/business-card-thumb.jpg',
    aspectRatio: 1.778, // Standard business card ratio
    logoPlacement: {
      x: 10, // 10% from left
      y: 50, // 50% from top
      width: 30, // 30% of card width
      height: 30, // Auto-calculated based on logo aspect ratio
      preserveAspectRatio: true
    },
    colorVariants: ['#FFFFFF', '#000000', '#F5F5F5', '#2D3748'],
    textPlaceholders: [
      {
        id: 'company-name',
        name: 'Company Name',
        default: '{BRAND_NAME}',
        x: 65,
        y: 40,
        maxWidth: 30,
        fontSize: 14,
        color: '#000000',
        fontFamily: 'Arial, sans-serif'
      },
      {
        id: 'tagline',
        name: 'Tagline',
        default: 'Your brand tagline here',
        x: 65,
        y: 50,
        maxWidth: 30,
        fontSize: 10,
        color: '#666666',
        fontFamily: 'Arial, sans-serif'
      },
      {
        id: 'contact',
        name: 'Contact Information',
        default: 'www.example.com\ninfo@example.com\n(123) 456-7890',
        x: 65,
        y: 70,
        maxWidth: 30,
        fontSize: 8,
        color: '#666666',
        fontFamily: 'Arial, sans-serif'
      }
    ]
  },
  {
    id: 'website-header-1',
    type: MockupType.WEBSITE,
    name: 'Modern Website Header',
    description: 'Clean website header with logo and navigation',
    placeholderUrl: '/assets/mockups/website-header-placeholder.jpg',
    thumbnailUrl: '/assets/mockups/website-header-thumb.jpg',
    aspectRatio: 2.5, // Widescreen header
    logoPlacement: {
      x: 5,
      y: 50,
      width: 15,
      height: 60,
      preserveAspectRatio: true
    },
    colorVariants: ['#FFFFFF', '#F8FAFC', '#1E293B', '#0F172A'],
    textPlaceholders: [
      {
        id: 'nav-item-1',
        name: 'Navigation Item 1',
        default: 'Home',
        x: 40,
        y: 50,
        maxWidth: 10,
        fontSize: 16,
        color: '#000000'
      },
      {
        id: 'nav-item-2',
        name: 'Navigation Item 2',
        default: 'Products',
        x: 55,
        y: 50,
        maxWidth: 10,
        fontSize: 16,
        color: '#000000'
      },
      {
        id: 'nav-item-3',
        name: 'Navigation Item 3',
        default: 'About',
        x: 70,
        y: 50,
        maxWidth: 10,
        fontSize: 16,
        color: '#000000'
      },
      {
        id: 'nav-item-4',
        name: 'Navigation Item 4',
        default: 'Contact',
        x: 85,
        y: 50,
        maxWidth: 10,
        fontSize: 16,
        color: '#000000'
      }
    ]
  },
  {
    id: 'tshirt-1',
    type: MockupType.TSHIRT,
    name: 'Classic T-shirt',
    description: 'T-shirt mockup with centered logo',
    placeholderUrl: '/assets/mockups/tshirt-placeholder.jpg',
    thumbnailUrl: '/assets/mockups/tshirt-thumb.jpg',
    aspectRatio: 0.8, // Portrait orientation
    logoPlacement: {
      x: 50,
      y: 30,
      width: 40,
      height: 40,
      preserveAspectRatio: true
    },
    colorVariants: ['#FFFFFF', '#000000', '#2563EB', '#DC2626', '#22C55E']
  },
  {
    id: 'storefront-1',
    type: MockupType.STOREFRONT,
    name: 'Retail Storefront',
    description: 'Store sign and window display',
    placeholderUrl: '/assets/mockups/storefront-placeholder.jpg',
    thumbnailUrl: '/assets/mockups/storefront-thumb.jpg',
    aspectRatio: 1.5,
    logoPlacement: {
      x: 50,
      y: 15,
      width: 50,
      height: 20,
      preserveAspectRatio: true
    }
  },
  {
    id: 'social-media-1',
    type: MockupType.SOCIAL_MEDIA,
    name: 'Social Media Profile',
    description: 'Social media profile with logo and header',
    placeholderUrl: '/assets/mockups/social-media-placeholder.jpg',
    thumbnailUrl: '/assets/mockups/social-media-thumb.jpg',
    aspectRatio: 1.91, // Standard social media cover ratio
    logoPlacement: {
      x: 15,
      y: 70,
      width: 20,
      height: 40,
      preserveAspectRatio: true
    },
    textPlaceholders: [
      {
        id: 'profile-name',
        name: 'Profile Name',
        default: '{BRAND_NAME}',
        x: 40,
        y: 70,
        maxWidth: 40,
        fontSize: 24,
        color: '#FFFFFF',
        fontFamily: 'Arial, sans-serif'
      },
      {
        id: 'profile-description',
        name: 'Profile Description',
        default: 'Official account for {BRAND_NAME}',
        x: 40,
        y: 80,
        maxWidth: 40,
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'Arial, sans-serif'
      }
    ]
  },
  {
    id: 'mobile-app-1',
    type: MockupType.MOBILE_APP,
    name: 'Mobile App Icon',
    description: 'App icon on a smartphone screen',
    placeholderUrl: '/assets/mockups/mobile-app-placeholder.jpg',
    thumbnailUrl: '/assets/mockups/mobile-app-thumb.jpg',
    aspectRatio: 0.5, // Portrait phone
    logoPlacement: {
      x: 50,
      y: 20,
      width: 20,
      height: 10,
      preserveAspectRatio: true
    }
  },
  {
    id: 'packaging-1',
    type: MockupType.PACKAGING,
    name: 'Product Packaging',
    description: 'Product box with logo and branding',
    placeholderUrl: '/assets/mockups/packaging-placeholder.jpg',
    thumbnailUrl: '/assets/mockups/packaging-thumb.jpg',
    aspectRatio: 1.2,
    logoPlacement: {
      x: 50,
      y: 30,
      width: 50,
      height: 30,
      preserveAspectRatio: true
    },
    textPlaceholders: [
      {
        id: 'product-name',
        name: 'Product Name',
        default: 'Product Name',
        x: 50,
        y: 70,
        maxWidth: 80,
        fontSize: 24,
        color: '#000000',
        fontFamily: 'Arial, sans-serif'
      },
      {
        id: 'product-description',
        name: 'Product Description',
        default: 'Premium quality product by {BRAND_NAME}',
        x: 50,
        y: 80,
        maxWidth: 80,
        fontSize: 14,
        color: '#666666',
        fontFamily: 'Arial, sans-serif'
      }
    ]
  }
];

/**
 * Get a filtered list of mockup templates by type
 */
export function getTemplatesByType(type: MockupType): MockupTemplate[] {
  return DEFAULT_MOCKUP_TEMPLATES.filter(template => template.type === type);
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): MockupTemplate | undefined {
  return DEFAULT_MOCKUP_TEMPLATES.find(template => template.id === id);
}

/**
 * Group templates by type
 */
export function getTemplatesGroupedByType(): Record<MockupType, MockupTemplate[]> {
  const grouped = {} as Record<MockupType, MockupTemplate[]>;
  
  // Initialize with empty arrays for all types
  Object.values(MockupType).forEach(type => {
    grouped[type] = [];
  });
  
  // Fill in the templates
  DEFAULT_MOCKUP_TEMPLATES.forEach(template => {
    grouped[template.type].push(template);
  });
  
  return grouped;
}