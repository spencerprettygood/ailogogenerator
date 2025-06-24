import { MockupType } from './mockup-types';

/**
 * Background image registry for realistic mockups
 * Provides a library of background images for different mockup types
 */

/**
 * Background image details
 */
export interface BackgroundImage {
  id: string;
  url: string;
  type: MockupType;
  name: string;
  description: string;
  tags: string[];
  preview?: string; // Optional thumbnail URL
}

/**
 * Background image collection grouped by mockup type
 */
export const BACKGROUND_IMAGES: Record<MockupType, BackgroundImage[]> = {
  [MockupType.BUSINESS_CARD]: [
    {
      id: 'business-card-desk-1',
      url: '/assets/mockups/backgrounds/business-card-desk-1.jpg',
      type: MockupType.BUSINESS_CARD,
      name: 'Business Card on Desk',
      description: 'Business card on a wooden desk with stationery',
      tags: ['desk', 'professional', 'wood', 'stationery'],
      preview: '/assets/mockups/backgrounds/previews/business-card-desk-1-thumb.jpg'
    },
    {
      id: 'business-card-hand-1',
      url: '/assets/mockups/backgrounds/business-card-hand-1.jpg',
      type: MockupType.BUSINESS_CARD,
      name: 'Business Card in Hand',
      description: 'Business card held in hand against neutral background',
      tags: ['hand', 'holding', 'professional', 'neutral'],
      preview: '/assets/mockups/backgrounds/previews/business-card-hand-1-thumb.jpg'
    },
    {
      id: 'business-card-stack-1',
      url: '/assets/mockups/backgrounds/business-card-stack-1.jpg',
      type: MockupType.BUSINESS_CARD,
      name: 'Business Card Stack',
      description: 'Stack of business cards with top card visible',
      tags: ['stack', 'professional', 'multiple', 'clean'],
      preview: '/assets/mockups/backgrounds/previews/business-card-stack-1-thumb.jpg'
    }
  ],
  [MockupType.WEBSITE]: [
    {
      id: 'website-macbook-1',
      url: '/assets/mockups/backgrounds/website-macbook-1.jpg',
      type: MockupType.WEBSITE,
      name: 'Website on MacBook',
      description: 'Website displayed on a MacBook on desk',
      tags: ['laptop', 'macbook', 'desk', 'digital'],
      preview: '/assets/mockups/backgrounds/previews/website-macbook-1-thumb.jpg'
    },
    {
      id: 'website-desktop-1',
      url: '/assets/mockups/backgrounds/website-desktop-1.jpg',
      type: MockupType.WEBSITE,
      name: 'Website on Desktop',
      description: 'Website displayed on a desktop monitor',
      tags: ['desktop', 'monitor', 'office', 'screen'],
      preview: '/assets/mockups/backgrounds/previews/website-desktop-1-thumb.jpg'
    },
    {
      id: 'website-responsive-1',
      url: '/assets/mockups/backgrounds/website-responsive-1.jpg',
      type: MockupType.WEBSITE,
      name: 'Responsive Website',
      description: 'Website shown on multiple devices',
      tags: ['responsive', 'multiple', 'devices', 'cross-platform'],
      preview: '/assets/mockups/backgrounds/previews/website-responsive-1-thumb.jpg'
    }
  ],
  [MockupType.TSHIRT]: [
    {
      id: 'tshirt-model-1',
      url: '/assets/mockups/backgrounds/tshirt-model-1.jpg',
      type: MockupType.TSHIRT,
      name: 'T-shirt on Model',
      description: 'T-shirt worn by model against white background',
      tags: ['model', 'person', 'clothing', 'apparel'],
      preview: '/assets/mockups/backgrounds/previews/tshirt-model-1-thumb.jpg'
    },
    {
      id: 'tshirt-hanging-1',
      url: '/assets/mockups/backgrounds/tshirt-hanging-1.jpg',
      type: MockupType.TSHIRT,
      name: 'Hanging T-shirt',
      description: 'T-shirt on hanger against wall',
      tags: ['hanger', 'clothing', 'display', 'retail'],
      preview: '/assets/mockups/backgrounds/previews/tshirt-hanging-1-thumb.jpg'
    },
    {
      id: 'tshirt-folded-1',
      url: '/assets/mockups/backgrounds/tshirt-folded-1.jpg',
      type: MockupType.TSHIRT,
      name: 'Folded T-shirt',
      description: 'Folded t-shirt on retail display',
      tags: ['folded', 'retail', 'display', 'shop'],
      preview: '/assets/mockups/backgrounds/previews/tshirt-folded-1-thumb.jpg'
    }
  ],
  [MockupType.STOREFRONT]: [
    {
      id: 'storefront-urban-1',
      url: '/assets/mockups/backgrounds/storefront-urban-1.jpg',
      type: MockupType.STOREFRONT,
      name: 'Urban Storefront',
      description: 'Modern store in urban setting',
      tags: ['urban', 'city', 'modern', 'retail'],
      preview: '/assets/mockups/backgrounds/previews/storefront-urban-1-thumb.jpg'
    },
    {
      id: 'storefront-mall-1',
      url: '/assets/mockups/backgrounds/storefront-mall-1.jpg',
      type: MockupType.STOREFRONT,
      name: 'Mall Storefront',
      description: 'Store in shopping mall',
      tags: ['mall', 'shopping', 'retail', 'indoor'],
      preview: '/assets/mockups/backgrounds/previews/storefront-mall-1-thumb.jpg'
    },
    {
      id: 'storefront-night-1',
      url: '/assets/mockups/backgrounds/storefront-night-1.jpg',
      type: MockupType.STOREFRONT,
      name: 'Night Storefront',
      description: 'Store at night with illuminated signage',
      tags: ['night', 'illuminated', 'dark', 'evening'],
      preview: '/assets/mockups/backgrounds/previews/storefront-night-1-thumb.jpg'
    }
  ],
  [MockupType.SOCIAL_MEDIA]: [
    {
      id: 'social-profile-1',
      url: '/assets/mockups/backgrounds/social-profile-1.jpg',
      type: MockupType.SOCIAL_MEDIA,
      name: 'Social Media Profile',
      description: 'Social media profile page mockup',
      tags: ['profile', 'platform', 'digital', 'social'],
      preview: '/assets/mockups/backgrounds/previews/social-profile-1-thumb.jpg'
    },
    {
      id: 'social-post-1',
      url: '/assets/mockups/backgrounds/social-post-1.jpg',
      type: MockupType.SOCIAL_MEDIA,
      name: 'Social Media Post',
      description: 'Social media post with engagement metrics',
      tags: ['post', 'engagement', 'likes', 'social'],
      preview: '/assets/mockups/backgrounds/previews/social-post-1-thumb.jpg'
    },
    {
      id: 'social-mobile-1',
      url: '/assets/mockups/backgrounds/social-mobile-1.jpg',
      type: MockupType.SOCIAL_MEDIA,
      name: 'Social Media on Mobile',
      description: 'Social media profile on smartphone',
      tags: ['mobile', 'phone', 'smartphone', 'hand'],
      preview: '/assets/mockups/backgrounds/previews/social-mobile-1-thumb.jpg'
    }
  ],
  [MockupType.MOBILE_APP]: [
    {
      id: 'mobile-app-hand-1',
      url: '/assets/mockups/backgrounds/mobile-app-hand-1.jpg',
      type: MockupType.MOBILE_APP,
      name: 'App in Hand',
      description: 'Mobile app on smartphone held in hand',
      tags: ['hand', 'smartphone', 'mobile', 'person'],
      preview: '/assets/mockups/backgrounds/previews/mobile-app-hand-1-thumb.jpg'
    },
    {
      id: 'mobile-app-desk-1',
      url: '/assets/mockups/backgrounds/mobile-app-desk-1.jpg',
      type: MockupType.MOBILE_APP,
      name: 'App on Desk',
      description: 'Smartphone with app on desk with accessories',
      tags: ['desk', 'workspace', 'accessories', 'flat-lay'],
      preview: '/assets/mockups/backgrounds/previews/mobile-app-desk-1-thumb.jpg'
    },
    {
      id: 'mobile-app-devices-1',
      url: '/assets/mockups/backgrounds/mobile-app-devices-1.jpg',
      type: MockupType.MOBILE_APP,
      name: 'App on Multiple Devices',
      description: 'Mobile app shown on smartphone and tablet',
      tags: ['multiple', 'devices', 'tablet', 'smartphone'],
      preview: '/assets/mockups/backgrounds/previews/mobile-app-devices-1-thumb.jpg'
    }
  ],
  [MockupType.PACKAGING]: [
    {
      id: 'packaging-box-1',
      url: '/assets/mockups/backgrounds/packaging-box-1.jpg',
      type: MockupType.PACKAGING,
      name: 'Product Box',
      description: 'Product box on white background',
      tags: ['box', 'product', 'cardboard', 'retail'],
      preview: '/assets/mockups/backgrounds/previews/packaging-box-1-thumb.jpg'
    },
    {
      id: 'packaging-display-1',
      url: '/assets/mockups/backgrounds/packaging-display-1.jpg',
      type: MockupType.PACKAGING,
      name: 'Retail Display',
      description: 'Product packaging in retail display',
      tags: ['retail', 'display', 'shelf', 'store'],
      preview: '/assets/mockups/backgrounds/previews/packaging-display-1-thumb.jpg'
    },
    {
      id: 'packaging-unboxing-1',
      url: '/assets/mockups/backgrounds/packaging-unboxing-1.jpg',
      type: MockupType.PACKAGING,
      name: 'Unboxing Experience',
      description: 'Product being unboxed showing packaging',
      tags: ['unboxing', 'experience', 'hands', 'opening'],
      preview: '/assets/mockups/backgrounds/previews/packaging-unboxing-1-thumb.jpg'
    }
  ],
  [MockupType.LETTERHEAD]: [
    {
      id: 'letterhead-desk-1',
      url: '/assets/mockups/backgrounds/letterhead-desk-1.jpg',
      type: MockupType.LETTERHEAD,
      name: 'Letterhead on Desk',
      description: 'Business letterhead on desk with stationery',
      tags: ['desk', 'stationery', 'business', 'paper'],
      preview: '/assets/mockups/backgrounds/previews/letterhead-desk-1-thumb.jpg'
    },
    {
      id: 'letterhead-closeup-1',
      url: '/assets/mockups/backgrounds/letterhead-closeup-1.jpg',
      type: MockupType.LETTERHEAD,
      name: 'Letterhead Closeup',
      description: 'Close-up view of letterhead header',
      tags: ['closeup', 'detail', 'header', 'paper'],
      preview: '/assets/mockups/backgrounds/previews/letterhead-closeup-1-thumb.jpg'
    }
  ],
  [MockupType.BILLBOARD]: [
    {
      id: 'billboard-urban-1',
      url: '/assets/mockups/backgrounds/billboard-urban-1.jpg',
      type: MockupType.BILLBOARD,
      name: 'Urban Billboard',
      description: 'Billboard in urban setting with traffic',
      tags: ['urban', 'city', 'traffic', 'large'],
      preview: '/assets/mockups/backgrounds/previews/billboard-urban-1-thumb.jpg'
    },
    {
      id: 'billboard-highway-1',
      url: '/assets/mockups/backgrounds/billboard-highway-1.jpg',
      type: MockupType.BILLBOARD,
      name: 'Highway Billboard',
      description: 'Billboard alongside highway',
      tags: ['highway', 'road', 'travel', 'large'],
      preview: '/assets/mockups/backgrounds/previews/billboard-highway-1-thumb.jpg'
    }
  ],
  [MockupType.EMAIL_SIGNATURE]: [
    {
      id: 'email-laptop-1',
      url: '/assets/mockups/backgrounds/email-laptop-1.jpg',
      type: MockupType.EMAIL_SIGNATURE,
      name: 'Email on Laptop',
      description: 'Email with signature displayed on laptop',
      tags: ['laptop', 'digital', 'screen', 'electronic'],
      preview: '/assets/mockups/backgrounds/previews/email-laptop-1-thumb.jpg'
    }
  ],
  [MockupType.FAVICON]: [
    {
      id: 'favicon-browser-1',
      url: '/assets/mockups/backgrounds/favicon-browser-1.jpg',
      type: MockupType.FAVICON,
      name: 'Favicon in Browser',
      description: 'Favicon shown in browser tab',
      tags: ['browser', 'tab', 'website', 'digital'],
      preview: '/assets/mockups/backgrounds/previews/favicon-browser-1-thumb.jpg'
    }
  ]
};

/**
 * Get all background images
 */
export function getAllBackgroundImages(): BackgroundImage[] {
  return Object.values(BACKGROUND_IMAGES).flat();
}

/**
 * Get background images by mockup type
 */
export function getBackgroundsByType(type: MockupType): BackgroundImage[] {
  return BACKGROUND_IMAGES[type] || [];
}

/**
 * Get a background image by ID
 */
export function getBackgroundById(id: string): BackgroundImage | undefined {
  return getAllBackgroundImages().find(bg => bg.id === id);
}

/**
 * Get background images by tags
 */
export function getBackgroundsByTags(tags: string[]): BackgroundImage[] {
  if (!tags.length) return [];
  
  return getAllBackgroundImages().filter(bg => {
    return tags.some(tag => bg.tags.includes(tag.toLowerCase()));
  });
}

/**
 * Get a random background image for a mockup type
 */
export function getRandomBackground(type: MockupType): BackgroundImage | undefined {
  const backgroundsForType = BACKGROUND_IMAGES[type] || [];
  if (backgroundsForType.length === 0) return undefined;
  
  const randomIndex = Math.floor(Math.random() * backgroundsForType.length);
  return backgroundsForType[randomIndex];
}

/**
 * Get background image placeholders for development when actual images are not available
 */
export function getPlaceholderBackground(type: MockupType): string {
  // Return a placeholder image URL based on mockup type
  return `/assets/mockups/backgrounds/placeholder-${type.toLowerCase()}.jpg`;
}