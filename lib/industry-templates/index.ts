/**
 * @file industry-templates/index.ts
 * @module lib/industry-templates
 * @description Industry-specific design templates for logo generation
 * 
 * This module defines industry categories and their associated design templates
 * to guide the logo generation process with industry-appropriate styles,
 * color schemes, and design principles.
 * 
 * @author AILogoGenerator Team
 * @version 1.0.0
 * @copyright 2024
 */

import { IndustryDesignPrinciple } from '../types-agents';

/**
 * Industry category definition
 */
export interface IndustryCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  commonColors: string[];
  commonStyles: string[];
  designPrinciples: IndustryDesignPrinciple;
}

/**
 * Industry detection result
 */
export interface IndustryDetectionResult {
  primaryIndustry: string;
  confidenceScore: number;
  alternativeIndustries?: string[];
  matchedKeywords?: string[];
}

/**
 * Industry template configuration
 */
export const INDUSTRY_TEMPLATES: Record<string, IndustryCategory> = {
  'technology': {
    id: 'technology',
    name: 'Technology',
    description: 'Software, hardware, IT services, digital platforms, apps, AI, and tech startups',
    keywords: [
      'tech', 'software', 'app', 'digital', 'computer', 'ai', 'data', 'automation',
      'startup', 'platform', 'saas', 'cloud', 'internet', 'web', 'mobile', 'blockchain',
      'coding', 'programming', 'developer', 'innovation', 'smart', 'cyber', 'virtual',
      'technology', 'artificial intelligence', 'machine learning'
    ],
    commonColors: ['#0066FF', '#00AAFF', '#33CCFF', '#00DD77', '#5A5AFF', '#5E2CE0', '#24292E'],
    commonStyles: ['geometric', 'modern', 'minimalist', 'abstract', 'futuristic', 'dynamic'],
    designPrinciples: {
      colorTheory: `
- Consider using blues, purples, and teals that convey innovation and trust
- Explore gradients that suggest advancement and digital fluidity
- Use high contrast for a modern, digital feel
- Consider how colors will appear on digital screens primarily
- Aim for a forward-looking, clean color palette
- Consider accessibility when using blue/purple combinations`,
      
      composition: `
- Create a sense of movement or forward momentum
- Consider geometric precision and mathematical relationships
- Use clean lines and shapes that suggest technological precision
- Apply asymmetrical balance for a more dynamic, innovative feel
- Consider modular design elements that suggest scalability and connectivity
- Utilize angles and paths that suggest data flow or connectivity`,
      
      visualWeight: `
- Balance visual elements for a clean, efficient appearance
- Create clear focal points that draw attention to key brand elements
- Use negative space strategically to enhance modern feel
- Consider scaling relationships that suggest technological advancement
- Create visual hierarchy that guides the eye through the design
- Use weight contrast to emphasize innovation and forward momentum`,
      
      typography: `
- Select modern, clean sans-serif typography
- Consider custom letterforms with unique technological elements
- Explore geometric or modular type styles
- Maintain excellent legibility across digital environments
- Consider letter spacing that creates a sense of precision
- Use font weights strategically to create visual interest`,
      
      negativeSpace: `
- Use negative space to create clean, uncluttered designs
- Consider hidden meanings through clever negative space use
- Ensure the design maintains clarity at small sizes (app icons)
- Create breathing room that enhances the modern aesthetic
- Consider how negative space can suggest technological concepts
- Balance positive and negative elements for optimal digital display`
    }
  },
  
  'finance': {
    id: 'finance',
    name: 'Finance',
    description: 'Banking, investment, insurance, fintech, financial services, and wealth management',
    keywords: [
      'finance', 'bank', 'investment', 'insurance', 'wealth', 'capital', 'financial',
      'money', 'banking', 'credit', 'loan', 'mortgage', 'trading', 'fintech', 'accounting',
      'asset', 'portfolio', 'economy', 'fiscal', 'budget', 'tax', 'pension', 'fund',
      'broker', 'exchange', 'stock', 'equity', 'retirement', 'payment'
    ],
    commonColors: ['#004080', '#006633', '#1A478C', '#24442C', '#003366', '#000033', '#007700'],
    commonStyles: ['professional', 'stable', 'trustworthy', 'secure', 'traditional', 'sophisticated'],
    designPrinciples: {
      colorTheory: `
- Use blues and greens to convey trust, stability, and growth
- Consider gold or silver accents to suggest value and premium quality
- Apply color consistently with restrained palette (2-3 colors maximum)
- Ensure high contrast for clarity and professionalism
- Use color to suggest stability and reliability
- Consider dark, rich tones for a sense of tradition and establishment`,
      
      composition: `
- Create balanced, stable compositions that suggest security
- Use symmetry or structured asymmetry to convey reliability
- Apply golden ratio for proportions that feel naturally balanced
- Consider upward movement to suggest growth and prosperity
- Use clean, precise geometric forms
- Incorporate shield-like or vault-like elements for security`,
      
      visualWeight: `
- Create a substantial, solid feel through visual weight
- Balance elements to suggest stability and reliability
- Use weight distribution to create a sense of permanence
- Create appropriate emphasis on elements that suggest security
- Consider how the logo projects authority through visual mass
- Balance traditional weight with modern sensibilities for fintech`,
      
      typography: `
- Select serif or high-quality sans-serif fonts that convey tradition and stability
- Apply consistent, moderate letter spacing
- Consider small caps or mixed case for sophistication
- Ensure excellent legibility and clarity
- Balance tradition with modernity depending on target audience
- Use weight contrast to establish hierarchy and authority`,
      
      negativeSpace: `
- Use negative space to create clean, uncluttered designs
- Consider how negative space contributes to a sense of precision
- Ensure the design maintains clarity at all sizes
- Create breathing room that enhances the professional aesthetic
- Use negative space to frame and highlight key elements
- Maintain appropriate balance for financial sector credibility`
    }
  },
  
  'healthcare': {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical services, hospitals, clinics, pharmaceuticals, wellness, and health technology',
    keywords: [
      'health', 'medical', 'doctor', 'hospital', 'wellness', 'pharmacy', 'clinic',
      'care', 'healthcare', 'medicine', 'treatment', 'therapy', 'nurse', 'physician',
      'patient', 'healing', 'wellness', 'diagnostic', 'laboratory', 'dental', 'fitness',
      'holistic', 'nutrition', 'rehabilitation', 'telemedicine', 'biotech'
    ],
    commonColors: ['#0077AA', '#00AA88', '#3FA9F5', '#4CA5D0', '#44BBAA', '#5BC2A7', '#FFFFFF'],
    commonStyles: ['clean', 'professional', 'caring', 'reliable', 'trustworthy', 'modern'],
    designPrinciples: {
      colorTheory: `
- Use blues and greens that convey calm, cleanliness, and care
- Consider pastel tones for gentleness and approachability
- Ensure colors meet accessibility standards (especially important in healthcare)
- Use color temperature to convey appropriate warmth or clinical precision
- Consider calming, trustworthy color harmonies
- Balance clinical blues with warm, human touches`,
      
      composition: `
- Create balanced, stable compositions that suggest reliability
- Use rounded forms and organic shapes for a human-centered feel
- Apply symmetry for stability with subtle dynamic elements
- Consider flowing lines that suggest care and continuity
- Balance clinical precision with human warmth
- Incorporate elements that suggest protection and well-being`,
      
      visualWeight: `
- Balance visual elements to project stability and reliability
- Create a sense of gentle authority through weight distribution
- Use rounded forms to project approachability
- Balance professional weight with human touch
- Consider how weight relationships suggest care and support
- Use appropriate visual emphasis on elements of human connection`,
      
      typography: `
- Select clean, highly legible typography
- Consider humanist sans-serif fonts that balance professionalism with approachability
- Apply generous letter spacing for clarity
- Ensure excellent legibility at all sizes
- Use type weight to create appropriate emphasis without appearing harsh
- Balance clinical precision with warm, human characteristics`,
      
      negativeSpace: `
- Use negative space to create clean, uncluttered designs
- Consider how negative space contributes to a sense of cleanliness
- Create breathing room that enhances the caring aesthetic
- Balance positive and negative space for optimal clinical/human balance
- Use negative space to create a sense of openness and transparency
- Consider how negative space supports healthcare-appropriate symbolism`
    }
  },
  
  'food': {
    id: 'food',
    name: 'Food & Beverage',
    description: 'Restaurants, cafes, bakeries, food products, beverages, catering, and culinary brands',
    keywords: [
      'food', 'restaurant', 'cafe', 'bakery', 'catering', 'cuisine', 'chef',
      'culinary', 'dining', 'kitchen', 'organic', 'gourmet', 'meal', 'taste',
      'fresh', 'delicious', 'flavor', 'recipe', 'menu', 'bistro', 'eatery',
      'coffee', 'tea', 'beverage', 'drink', 'brewery', 'wine', 'cocktail'
    ],
    commonColors: ['#D32F2F', '#F57C00', '#FFC107', '#7CB342', '#8D6E63', '#000000', '#FFFFFF'],
    commonStyles: ['appetizing', 'warm', 'inviting', 'organic', 'traditional', 'artisanal', 'handcrafted'],
    designPrinciples: {
      colorTheory: `
- Use warm, appetizing colors like reds, oranges, and browns
- Consider organic earth tones for natural/organic food brands
- Use vibrant, rich colors that stimulate appetite
- Explore complementary color schemes that create energy
- Balance warm and cool tones based on cuisine type
- Consider cultural color associations for specific cuisines`,
      
      composition: `
- Create organic, flowing compositions for natural food brands
- Consider circular forms that suggest plates, community, gathering
- Use asymmetrical, natural balance for artisanal foods
- Create structured, precise layouts for luxury food brands
- Balance traditional elements with contemporary styling
- Incorporate culinary elements in subtle, stylized ways`,
      
      visualWeight: `
- Create a substantial, appetizing feel through visual weight
- Balance elements to suggest culinary expertise
- Use weight distribution to highlight key brand attributes
- Create appropriate emphasis on artisanal or gourmet elements
- Consider how visual weight suggests flavor intensity
- Balance traditional and contemporary elements appropriately`,
      
      typography: `
- Select typography that reinforces the culinary style
- Consider script fonts for artisanal/handcrafted foods
- Use serif fonts for traditional or luxury food brands
- Apply clean sans-serif for modern, health-focused foods
- Balance legibility with personality and character
- Consider letter spacing that creates appetite appeal`,
      
      negativeSpace: `
- Use negative space to create clean, appetizing designs
- Consider how negative space can suggest freshness
- Create breathing room that enhances the culinary aesthetic
- Consider negative space that suggests culinary motifs
- Balance positive and negative elements for appetite appeal
- Use negative space to create memorable, distinctive forms`
    }
  },
  
  'retail': {
    id: 'retail',
    name: 'Retail & E-commerce',
    description: 'Retail stores, e-commerce, fashion, consumer goods, shopping, and merchandise',
    keywords: [
      'retail', 'shop', 'store', 'boutique', 'fashion', 'clothing', 'merchandise',
      'commerce', 'shopping', 'e-commerce', 'consumer', 'goods', 'products', 'mall',
      'market', 'brand', 'apparel', 'accessories', 'luxury', 'discount', 'department',
      'online', 'shop', 'marketplace', 'outlet', 'sales', 'buyers'
    ],
    commonColors: ['#000000', '#FFFFFF', '#FF5252', '#651FFF', '#2196F3', '#FF4081', '#212121'],
    commonStyles: ['trendy', 'stylish', 'contemporary', 'fashionable', 'clean', 'bold'],
    designPrinciples: {
      colorTheory: `
- Consider bold, attention-grabbing colors for mainstream retail
- Use luxury color schemes (black, gold, silver) for high-end brands
- Apply color psychology to target specific consumer demographics
- Balance trendiness with timelessness for brand longevity
- Consider seasonal color strategies for fashion/apparel brands
- Use color to differentiate from competitors in the retail space`,
      
      composition: `
- Create balanced compositions with appropriate hierarchy
- Use geometric precision for modern retail brands
- Consider dynamic layouts that suggest shopping excitement
- Apply golden ratio for naturally appealing proportions
- Create clear focus points that enhance brand memorability
- Balance traditional retail cues with contemporary design`,
      
      visualWeight: `
- Balance visual elements to create appropriate brand positioning
- Use weight distribution to suggest product quality level
- Create visual emphasis on unique selling propositions
- Consider how weight relationships suggest brand personality
- Balance substantial elements with white space for modern appeal
- Use weight to create appropriate energy for the retail category`,
      
      typography: `
- Select typography that reinforces the retail positioning
- Consider fashion-forward fonts for apparel brands
- Use classic typography for luxury retail
- Apply geometric sans-serif for modern e-commerce
- Balance brand character with excellent legibility
- Consider how typography affects perceived value`,
      
      negativeSpace: `
- Use negative space to create clean, contemporary designs
- Consider how negative space affects perceived brand quality
- Create breathing room appropriate to retail positioning
- Balance positive and negative space for optimal appeal
- Use negative space to enhance brand distinctiveness
- Consider how negative space contributes to brand flexibility`
    }
  },
  
  'education': {
    id: 'education',
    name: 'Education',
    description: 'Schools, universities, educational services, e-learning, tutoring, and academic institutions',
    keywords: [
      'education', 'school', 'university', 'academy', 'learning', 'teaching', 'tutoring',
      'college', 'academic', 'study', 'knowledge', 'research', 'campus', 'degree',
      'course', 'student', 'professor', 'classroom', 'curriculum', 'diploma', 'training',
      'e-learning', 'educational', 'scholarship', 'lecture', 'study', 'book'
    ],
    commonColors: ['#1565C0', '#4CAF50', '#F44336', '#FFC107', '#6A1B9A', '#3F51B5', '#FFFFFF'],
    commonStyles: ['traditional', 'intellectual', 'trustworthy', 'established', 'authoritative'],
    designPrinciples: {
      colorTheory: `
- Consider traditional academic colors like deep blues and burgundies
- Use bright, engaging colors for K-12 or progressive education
- Apply color psychology appropriate to learning environment
- Balance traditional and contemporary color schemes
- Consider institutional colors for established organizations
- Use color to suggest knowledge, growth, and achievement`,
      
      composition: `
- Create balanced, structured compositions for traditional institutions
- Use dynamic layouts for modern educational approaches
- Apply golden ratio for naturally appealing proportions
- Consider symbolic elements related to knowledge and growth
- Balance authoritative presence with approachability
- Use appropriate educational symbolism in abstract forms`,
      
      visualWeight: `
- Balance visual elements to project appropriate authority
- Use weight distribution to suggest institutional stability
- Create visual hierarchy emphasizing core educational values
- Consider how weight relationships project credibility
- Balance tradition with innovation through visual emphasis
- Use weight to create appropriate educational gravitas`,
      
      typography: `
- Select typography that reinforces educational positioning
- Consider serif fonts for traditional academic institutions
- Use clean sans-serif for modern educational approaches
- Apply appropriate typographic hierarchy and structure
- Balance authority with accessibility in type choices
- Consider legibility across multiple contexts and applications`,
      
      negativeSpace: `
- Use negative space to create clean, focused designs
- Consider how negative space contributes to academic credibility
- Create breathing room that enhances institutional quality
- Balance positive and negative elements for optimal learning connotations
- Use negative space to suggest open-mindedness and knowledge expansion
- Consider how negative space supports educational symbolism`
    }
  },
  
  'creative': {
    id: 'creative',
    name: 'Creative Industries',
    description: 'Design, art, photography, media, entertainment, film, music, and creative services',
    keywords: [
      'creative', 'design', 'art', 'studio', 'agency', 'photography', 'film', 'media',
      'artist', 'designer', 'creative', 'visual', 'digital', 'production', 'entertainment',
      'music', 'video', 'animation', 'illustration', 'graphic', 'brand', 'advertising',
      'marketing', 'publishing', 'creative', 'content', 'storytelling', 'production'
    ],
    commonColors: ['#FF4081', '#7C4DFF', '#00BCD4', '#FFC107', '#212121', '#000000', '#FFFFFF'],
    commonStyles: ['artistic', 'expressive', 'innovative', 'dynamic', 'bold', 'distinctive'],
    designPrinciples: {
      colorTheory: `
- Use vibrant, expressive colors for creative impact
- Consider unexpected color combinations that demonstrate creativity
- Apply color psychology that reflects the specific creative field
- Balance artistic expression with brand coherence
- Consider how color showcases creative capabilities
- Use color to differentiate from competitors in the creative space`,
      
      composition: `
- Create dynamic, unexpected compositions for creative impact
- Use asymmetrical balance to demonstrate design sophistication
- Apply visual tension and resolution to showcase creative thinking
- Consider compositions that break conventional boundaries
- Balance artistic expression with functional requirements
- Use composition to demonstrate creative problem-solving`,
      
      visualWeight: `
- Create dynamic visual weight relationships for creative impact
- Use unexpected weight distribution to demonstrate originality
- Create visual focal points that showcase creative strengths
- Consider how weight creates rhythm and movement
- Balance creative expression with clear communication
- Use weight to create appropriate creative energy`,
      
      typography: `
- Select typography that showcases creative sophistication
- Consider custom or modified letterforms for distinctiveness
- Use typography as a primary design element when appropriate
- Apply typographic contrast and hierarchy creatively
- Balance artistic expression with functional requirements
- Consider how typography itself can demonstrate creativity`,
      
      negativeSpace: `
- Use negative space creatively and intentionally
- Consider unexpected negative space relationships
- Create sophisticated figure-ground relationships
- Balance artistic expression with clear communication
- Use negative space to demonstrate design thinking
- Consider how negative space creates meaning and memorability`
    }
  },
  
  'hospitality': {
    id: 'hospitality',
    name: 'Hospitality & Travel',
    description: 'Hotels, resorts, travel, tourism, vacation services, hospitality, and lodging',
    keywords: [
      'hotel', 'resort', 'travel', 'tourism', 'vacation', 'hospitality', 'lodging',
      'accommodation', 'guest', 'leisure', 'destination', 'tour', 'trip', 'journey',
      'holiday', 'adventure', 'experience', 'tourist', 'visitor', 'traveler', 'explorer',
      'luxury', 'comfort', 'relaxation', 'recreation', 'getaway', 'escape'
    ],
    commonColors: ['#03A9F4', '#00BCD4', '#009688', '#FF9800', '#3F51B5', '#607D8B', '#FFFFFF'],
    commonStyles: ['welcoming', 'luxurious', 'professional', 'relaxing', 'sophisticated', 'adventurous'],
    designPrinciples: {
      colorTheory: `
- Use blues and aquas for travel and hospitality brands
- Consider luxury color schemes (gold, deep blues) for high-end hotels
- Apply warm, welcoming colors for hospitality services
- Balance sophistication with approachability
- Consider destination-specific color associations
- Use color to evoke relaxation, adventure, or luxury`,
      
      composition: `
- Create balanced compositions that suggest hospitality and care
- Use flowing lines for travel brands suggesting movement/journey
- Apply golden ratio for naturally pleasing proportions
- Consider symbolic elements that suggest hospitality or adventure
- Balance luxury signifiers with approachability
- Use appropriate hospitality symbolism in refined forms`,
      
      visualWeight: `
- Balance visual elements to project appropriate luxury level
- Use weight distribution to suggest stability and reliability
- Create visual hierarchy emphasizing service quality
- Consider how weight relationships suggest hospitality values
- Balance sophistication with welcoming attributes
- Use weight to create appropriate energy for the hospitality category`,
      
      typography: `
- Select typography that reinforces hospitality positioning
- Consider serif fonts for luxury hospitality brands
- Use clean sans-serif for modern travel services
- Apply appropriate typographic refinement for luxury tier
- Balance sophistication with readability and accessibility
- Consider multilingual typography needs for international brands`,
      
      negativeSpace: `
- Use negative space to create clean, uncluttered designs
- Consider how negative space contributes to luxury perception
- Create breathing room that enhances hospitality quality
- Balance positive and negative elements for optimal appeal
- Use negative space to suggest openness and welcome
- Consider how negative space supports travel-related symbolism`
    }
  },
  
  'manufacturing': {
    id: 'manufacturing',
    name: 'Manufacturing & Industry',
    description: 'Manufacturing, industry, factories, production, industrial goods, machinery, and engineering',
    keywords: [
      'manufacturing', 'industry', 'factory', 'production', 'industrial', 'machinery',
      'engineering', 'equipment', 'construction', 'fabrication', 'assembly', 'plant',
      'processing', 'metal', 'steel', 'tools', 'mechanical', 'automated', 'robotics',
      'precision', 'quality', 'manufacturing', 'industrial', 'heavy', 'materials'
    ],
    commonColors: ['#F44336', '#FFC107', '#607D8B', '#212121', '#FFA000', '#1976D2', '#000000'],
    commonStyles: ['strong', 'reliable', 'industrial', 'durable', 'precise', 'technical'],
    designPrinciples: {
      colorTheory: `
- Use industrial colors like steel grays, deep blues, and safety yellows
- Consider high-contrast color schemes for visibility and impact
- Apply colors associated with industrial strength and reliability
- Balance technical attributes with brand warmth as appropriate
- Consider safety color considerations for industrial contexts
- Use color to suggest precision, strength, and durability`,
      
      composition: `
- Create solid, balanced compositions that suggest stability
- Use geometric precision to convey engineering excellence
- Apply structured grid systems for industrial sophistication
- Consider angular elements that suggest industrial contexts
- Balance strength signifiers with appropriate refinement
- Use structural integrity as a compositional principle`,
      
      visualWeight: `
- Create substantial, solid feel through visual weight
- Use weight distribution to suggest industrial strength
- Create visual emphasis on technical precision
- Consider how weight relationships suggest reliability
- Balance industrial substance with modern refinement
- Use weight to create appropriate technical gravitas`,
      
      typography: `
- Select typography that reinforces industrial positioning
- Consider strong, sturdy fonts that suggest reliability
- Use technical/geometric typography for precision industries
- Apply appropriate typographic structure and alignment
- Balance industrial character with clear communication
- Consider how typography suggests precision and durability`,
      
      negativeSpace: `
- Use negative space to create clean, functional designs
- Consider how negative space enhances industrial clarity
- Create appropriate breathing room for technical contexts
- Balance positive and negative elements for optimal industrial appeal
- Use negative space to enhance technical precision
- Consider how negative space supports industrial symbolism`
    }
  },
  
  'energy': {
    id: 'energy',
    name: 'Energy & Utilities',
    description: 'Energy companies, power utilities, electricity, oil, gas, solar, renewable energy',
    keywords: [
      'energy', 'power', 'utility', 'electricity', 'oil', 'gas', 'solar', 'renewable',
      'wind', 'electric', 'petroleum', 'nuclear', 'coal', 'green', 'clean', 'sustainable',
      'efficiency', 'conservation', 'generation', 'distribution', 'transmission', 'grid',
      'utilities', 'hydroelectric', 'biofuel', 'geothermal', 'battery', 'storage'
    ],
    commonColors: ['#2196F3', '#4CAF50', '#FFC107', '#F44336', '#263238', '#FF9800', '#FFFFFF'],
    commonStyles: ['powerful', 'reliable', 'efficient', 'sustainable', 'innovative', 'clean'],
    designPrinciples: {
      colorTheory: `
- Use blues and greens for renewable/clean energy
- Consider oranges and reds for traditional energy sources
- Apply bright, vibrant colors for innovation-focused energy brands
- Balance technical attributes with future-oriented vision
- Consider environmental messaging through color
- Use color to differentiate energy types and approaches`,
      
      composition: `
- Create dynamic compositions that suggest energy and movement
- Use flowing lines for renewable energy brands
- Apply geometric precision for technical energy companies
- Consider upward movement suggesting growth and innovation
- Balance technical requirements with visual impact
- Use appropriate energy symbolism in refined forms`,
      
      visualWeight: `
- Balance visual elements to project appropriate energy type
- Use weight distribution to suggest reliability and power
- Create visual hierarchy emphasizing innovation or sustainability
- Consider how weight relationships suggest stability or dynamism
- Balance technical substance with future-oriented vision
- Use weight to create appropriate energy dynamics`,
      
      typography: `
- Select typography that reinforces energy positioning
- Consider strong, substantial fonts for traditional energy
- Use clean, progressive typography for renewable energy
- Apply appropriate typographic dynamics for energy type
- Balance technical attributes with accessibility
- Consider how typography itself suggests energy concepts`,
      
      negativeSpace: `
- Use negative space to create clean, efficient designs
- Consider how negative space contributes to energy messaging
- Create breathing room that enhances technical quality
- Balance positive and negative elements appropriately
- Use negative space to suggest flow, movement, or efficiency
- Consider how negative space supports energy-related symbolism`
    }
  },
  
  'real-estate': {
    id: 'real-estate',
    name: 'Real Estate & Construction',
    description: 'Real estate, property, housing, construction, building, and architecture',
    keywords: [
      'real estate', 'property', 'housing', 'construction', 'realty', 'building',
      'home', 'house', 'apartment', 'condominium', 'commercial', 'residential',
      'development', 'builder', 'architecture', 'design', 'land', 'agent', 'broker',
      'mortgage', 'investment', 'renovation', 'construction', 'contractor', 'developer'
    ],
    commonColors: ['#1A237E', '#0D47A1', '#4CAF50', '#00695C', '#212121', '#BF360C', '#FFFFFF'],
    commonStyles: ['professional', 'trustworthy', 'solid', 'established', 'upscale', 'reliable'],
    designPrinciples: {
      colorTheory: `
- Use deep blues and greens for trust and stability
- Consider earth tones for construction and traditional real estate
- Apply luxury color schemes for high-end real estate
- Balance professionalism with warmth for residential real estate
- Consider architectural influences in color selection
- Use color to suggest permanence and quality`,
      
      composition: `
- Create solid, balanced compositions that suggest stability
- Use architectural elements as visual inspiration
- Apply golden ratio for naturally pleasing proportions
- Consider house/building forms abstracted appropriately
- Balance traditional real estate signifiers with contemporary design
- Use structural forms to suggest construction expertise`,
      
      visualWeight: `
- Create substantial feel through appropriate visual weight
- Use weight distribution to suggest stability and permanence
- Create visual hierarchy emphasizing trust and reliability
- Consider how weight relationships suggest quality construction
- Balance substantial elements with refined details
- Use weight to create appropriate real estate positioning`,
      
      typography: `
- Select typography that reinforces real estate positioning
- Consider serif fonts for traditional or luxury real estate
- Use clean sans-serif for modern property development
- Apply appropriate typographic refinement for market tier
- Balance professionalism with accessibility
- Consider how typography suggests property quality level`,
      
      negativeSpace: `
- Use negative space to create clean, professional designs
- Consider how negative space contributes to property perception
- Create breathing room that enhances architectural quality
- Balance positive and negative elements for optimal appeal
- Use negative space to suggest openness and space
- Consider how negative space supports property-related symbolism`
    }
  },
  
  'legal': {
    id: 'legal',
    name: 'Legal Services',
    description: 'Law firms, legal services, attorneys, advocates, justice system, and legal consulting',
    keywords: [
      'legal', 'law', 'attorney', 'advocate', 'justice', 'lawyer', 'firm',
      'counsel', 'litigation', 'court', 'solicitor', 'barrister', 'judicial',
      'practice', 'legal', 'paralegal', 'notary', 'compliance', 'contract',
      'rights', 'defense', 'prosecution', 'justice', 'advocacy', 'jurisprudence'
    ],
    commonColors: ['#1A237E', '#0D47A1', '#4A148C', '#3E2723', '#000000', '#76FF03', '#FFFFFF'],
    commonStyles: ['professional', 'authoritative', 'trustworthy', 'established', 'dignified'],
    designPrinciples: {
      colorTheory: `
- Use deep blues, burgundies, and navy for trust and authority
- Consider gold accents for established legal practices
- Apply restrained color palette (2-3 colors maximum)
- Balance tradition with appropriate modernity
- Consider judiciary influences in color selection
- Use color to suggest trustworthiness and expertise`,
      
      composition: `
- Create balanced compositions that suggest judicial balance
- Use symmetry to convey stability and fairness
- Apply golden ratio for naturally authoritative proportions
- Consider justice-related symbols abstracted appropriately
- Balance legal tradition with contemporary relevance
- Use structural integrity as a compositional principle`,
      
      visualWeight: `
- Create substantial feel through appropriate visual weight
- Use weight distribution to suggest stability and authority
- Create visual hierarchy emphasizing trust and expertise
- Consider how weight relationships project legal gravitas
- Balance substantial elements with refined details
- Use weight to create appropriate legal positioning`,
      
      typography: `
- Select typography that reinforces legal positioning
- Consider serif fonts for traditional legal practices
- Use refined sans-serif for modern legal services
- Apply appropriate typographic structure and discipline
- Balance authority with accessibility
- Consider how typography projects credibility and expertise`,
      
      negativeSpace: `
- Use negative space to create clean, dignified designs
- Consider how negative space contributes to perceived expertise
- Create breathing room that enhances professional quality
- Balance positive and negative elements for optimal authority
- Use negative space to suggest clarity and precision
- Consider how negative space supports legal symbolism`
    }
  },
  
  'transportation': {
    id: 'transportation',
    name: 'Transportation & Logistics',
    description: 'Transport, logistics, shipping, delivery, freight, aviation, and supply chain',
    keywords: [
      'transport', 'logistics', 'shipping', 'delivery', 'freight', 'aviation',
      'cargo', 'supply chain', 'trucking', 'courier', 'fleet', 'distribution',
      'transportation', 'transit', 'shipping', 'maritime', 'railroad', 'rail',
      'air', 'sea', 'road', 'express', 'carrier', 'hauling', 'moving', 'storage'
    ],
    commonColors: ['#0D47A1', '#F57C00', '#D50000', '#004D40', '#212121', '#01579B', '#FFFFFF'],
    commonStyles: ['dynamic', 'efficient', 'reliable', 'fast', 'global', 'precise'],
    designPrinciples: {
      colorTheory: `
- Use blues for reliability and professionalism
- Consider oranges and reds for speed and energy
- Apply global color sensibilities for international logistics
- Balance technical attributes with service quality
- Consider movement and direction through color
- Use color to suggest efficiency and reliability`,
      
      composition: `
- Create dynamic compositions that suggest movement and direction
- Use horizontal lines to suggest speed and efficiency
- Apply directional elements suggesting forward progress
- Consider abstract vehicle or route forms where appropriate
- Balance technical requirements with brand accessibility
- Use appropriate transportation symbolism in refined forms`,
      
      visualWeight: `
- Balance visual elements to project appropriate service level
- Use weight distribution to suggest reliability and efficiency
- Create visual emphasis on speed or global reach
- Consider how weight relationships suggest movement
- Balance technical elements with service attributes
- Use weight to create appropriate transportation dynamics`,
      
      typography: `
- Select typography that reinforces transportation positioning
- Consider dynamic, forward-leaning fonts for express services
- Use sturdy, reliable typography for freight and logistics
- Apply appropriate typographic dynamism for service type
- Balance technical attributes with accessibility
- Consider how typography itself suggests movement concepts`,
      
      negativeSpace: `
- Use negative space to create clean, efficient designs
- Consider how negative space contributes to speed perception
- Create breathing room that enhances service quality
- Balance positive and negative elements appropriately
- Use negative space to suggest movement and flow
- Consider how negative space supports transportation symbolism`
    }
  },
  
  'general': {
    id: 'general',
    name: 'General Business',
    description: 'Multi-industry or general business applications where no specific industry is dominant',
    keywords: [
      'business', 'company', 'enterprise', 'service', 'solution', 'professional',
      'corporate', 'commercial', 'organization', 'firm', 'agency', 'consultancy',
      'group', 'partner', 'associate', 'management', 'operation', 'venture',
      'network', 'alliance', 'international', 'global', 'national', 'local'
    ],
    commonColors: ['#0D47A1', '#006064', '#2E7D32', '#424242', '#000000', '#01579B', '#FFFFFF'],
    commonStyles: ['professional', 'versatile', 'reliable', 'modern', 'balanced', 'clear'],
    designPrinciples: {
      colorTheory: `
- Use versatile color schemes that work across industries
- Consider balanced color harmonies with broad appeal
- Apply color psychology for general business attributes
- Balance professionalism with appropriate brand personality
- Consider color adaptability across various applications
- Use color to suggest reliability and competence`,
      
      composition: `
- Create balanced compositions with universal appeal
- Use golden ratio for naturally pleasing proportions
- Apply clear visual hierarchy and organization
- Consider versatile symbolic elements
- Balance tradition with appropriate modernity
- Use composition to suggest stability and professionalism`,
      
      visualWeight: `
- Create appropriate visual weight for general business contexts
- Use weight distribution to suggest reliability and competence
- Create visual hierarchy emphasizing key brand attributes
- Consider how weight relationships suggest professionalism
- Balance substantial elements with contemporary details
- Use weight to create appropriate business positioning`,
      
      typography: `
- Select typography with versatile business applications
- Consider balanced sans-serif fonts for maximum flexibility
- Use typography that works across various contexts
- Apply appropriate typographic hierarchy and clarity
- Balance professionalism with accessibility
- Consider how typography projects reliability and competence`,
      
      negativeSpace: `
- Use negative space to create clean, professional designs
- Consider how negative space enhances clarity and focus
- Create breathing room that works across applications
- Balance positive and negative elements appropriately
- Use negative space to enhance versatility and adaptability
- Consider how negative space supports general business positioning`
    }
  }
};

/**
 * @function detectIndustry
 * @description Detect the most likely industry from a brand description
 * @param {string} description - The brand description
 * @returns {IndustryDetectionResult} The detected industry with confidence score
 */
export function detectIndustry(description: string): IndustryDetectionResult {
  if (!description) {
    return {
      primaryIndustry: 'general',
      confidenceScore: 0.5
    };
  }
  
  const lowerDescription = description.toLowerCase();
  
  // Calculate keyword matches for each industry
  const industryMatches: Record<string, { 
    count: number, 
    keywords: string[] 
  }> = {};
  
  Object.entries(INDUSTRY_TEMPLATES).forEach(([industry, template]) => {
    const matches = template.keywords.filter(keyword => 
      lowerDescription.includes(keyword.toLowerCase())
    );
    
    if (matches.length > 0) {
      industryMatches[industry] = {
        count: matches.length,
        keywords: matches
      };
    }
  });
  
  // Sort industries by match count
  const sortedIndustries = Object.entries(industryMatches)
    .sort((a, b) => b[1].count - a[1].count);
  
  // If no matches found, return general
  if (sortedIndustries.length === 0) {
    return {
      primaryIndustry: 'general',
      confidenceScore: 0.5
    };
  }
  
  // Calculate confidence score based on keyword matches
  const sortedIndustriesEntry = sortedIndustries[0];
  if (!sortedIndustriesEntry) {
    return { primaryIndustry: 'general', confidenceScore: 0.3 };
  }
  
  const [primaryIndustry, primaryMatches] = sortedIndustriesEntry;
  const totalMatches = Object.values(industryMatches)
    .reduce((sum, { count }) => sum + count, 0);
  
  const confidenceScore = Math.min(
    0.95, // Max confidence
    Math.max(
      0.6, // Min confidence for keyword matches
      primaryMatches.count / totalMatches * 0.9 + 0.1 // Scale from 0.1 to 1.0
    )
  );
  
  // Return the result
  return {
    primaryIndustry,
    confidenceScore,
    alternativeIndustries: sortedIndustries
      .slice(1, 3)
      .map(([industry]) => industry),
    matchedKeywords: primaryMatches.keywords
  };
}

/**
 * @function getIndustryTemplate
 * @description Get industry template by ID
 * @param {string} industryId - The industry ID
 * @returns {IndustryCategory | undefined} The industry template or undefined if not found
 */
export function getIndustryTemplate(industryId: string): IndustryCategory | undefined {
  return INDUSTRY_TEMPLATES[industryId] || INDUSTRY_TEMPLATES['general'];
}

/**
 * @function getDesignPrinciplesForIndustry
 * @description Get design principles for a specific industry
 * @param {string} industryId - The industry ID
 * @returns {DesignPrinciple} The design principles for the industry
 */
export function getDesignPrinciplesForIndustry(industryId: string): IndustryDesignPrinciple {
  const template = getIndustryTemplate(industryId);
  const generalTemplate = INDUSTRY_TEMPLATES['general'];
  return template?.designPrinciples || generalTemplate?.designPrinciples || {
    colorTheory: 'Use appropriate colors for the brand',
    composition: 'Apply balanced layout principles',
    visualWeight: 'Balance elements for visual stability',
    typography: 'Use appropriate typography for the brand',
    negativeSpace: 'Use negative space effectively'
  };
}