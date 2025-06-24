/**
 * @file web-search-service.ts
 * @description Service for performing web searches to enrich logo design with current trends and examples
 */

import { Logger } from '../utils/logger';
import { ErrorCategory, handleError } from '../utils/error-handler';
import { WebSearchResultItem, WebSearchResults } from '../types';

/**
 * Vertical-specific search keywords to find relevant design examples and trends
 */
const VERTICAL_SEARCH_KEYWORDS: Record<string, string[]> = {
  technology: [
    'award winning tech company logos',
    'tech startup logo design trends',
    'modern technology company branding',
    'innovative tech visual identity',
    'minimalist tech logo examples'
  ],
  healthcare: [
    'healthcare logo design awards',
    'medical brand identity examples',
    'wellness company logo designs',
    'pharmacy visual identity trends',
    'hospital branding guidelines'
  ],
  finance: [
    'financial services logo awards',
    'banking brand identity examples',
    'fintech logo design trends',
    'investment company visual identity',
    'insurance branding best practices'
  ],
  food_beverage: [
    'food and beverage logo design awards',
    'restaurant branding examples',
    'craft beer visual identity trends',
    'coffee shop logo designs',
    'food delivery service branding'
  ],
  education: [
    'education institution logo awards',
    'school branding best practices',
    'university visual identity examples',
    'online learning platform logos',
    'educational nonprofit branding'
  ],
  entertainment: [
    'entertainment company logo awards',
    'media brand identity trends',
    'streaming service visual design',
    'gaming company logo examples',
    'film production company branding'
  ],
  retail: [
    'retail brand identity awards',
    'e-commerce logo design trends',
    'fashion branding examples',
    'luxury retail visual identity',
    'department store logo redesigns'
  ],
  professional_services: [
    'law firm logo design awards',
    'consulting company branding examples',
    'accounting firm visual identity',
    'creative agency logo trends',
    'professional services branding best practices'
  ],
  real_estate: [
    'real estate agency logo awards',
    'property development branding',
    'architecture firm visual identity',
    'construction company logo design',
    'home services branding examples'
  ],
  manufacturing: [
    'manufacturing company logo design',
    'industrial brand identity examples',
    'engineering firm visual branding',
    'factory logo design trends',
    'heavy industry visual identity'
  ],
  transportation: [
    'transportation company logo awards',
    'logistics brand identity examples',
    'airline visual branding trends',
    'shipping company logo design',
    'automotive brand identity'
  ]
};

// Fallback keywords for generic searches
const FALLBACK_SEARCH_KEYWORDS = [
  'award winning logo design examples',
  'best brand identity design',
  'logo design trends current year',
  'effective visual identity examples',
  'brand logo design principles'
];

// Design award sites to include in searches
const DESIGN_AWARD_SITES = [
  'site:awwwards.com',
  'site:cssdesignawards.com',
  'site:commarts.com',
  'site:red-dot.org',
  'site:dandad.org',
  'site:thedieline.com',
  'site:designweek.co.uk',
  'site:logotournament.com',
  'site:logolounge.com'
];

/**
 * Service for performing web searches to gather design insights
 */
export class WebSearchService {
  private logger: Logger;
  private currentYear: number;
  
  constructor() {
    this.logger = new Logger('WebSearchService');
    this.currentYear = new Date().getFullYear();
    this.logger.info('WebSearchService initialized');
  }
  
  /**
   * Perform a web search for design trends in a specific vertical
   * 
   * @param vertical - The industry vertical to search for
   * @param additionalContext - Additional context to refine the search
   * @returns Search results
   */
  async searchDesignTrends(
    vertical: string,
    additionalContext?: string
  ): Promise<WebSearchResults> {
    try {
      this.logger.info('Starting design trends search', { vertical });
      
      // Normalize vertical name to match our keyword dictionary
      const normalizedVertical = this.normalizeVertical(vertical);
      
      // Get search keywords for this vertical
      const searchQueries = this.getSearchQueries(normalizedVertical, additionalContext);
      
      const allResults: WebSearchResultItem[] = [];
      
      // Execute multiple searches with different queries
      for (const query of searchQueries.slice(0, 3)) { // Limit to 3 queries to avoid rate limits
        try {
          const results = await this.executeSearch(query);
          allResults.push(...results);
          
          // If we have enough results, we can stop
          if (allResults.length >= 15) {
            break;
          }
        } catch (error) {
          this.logger.warn('Search query failed, trying next query', { 
            query, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Deduplicate results by URL
      const uniqueResults = this.deduplicateResults(allResults);
      
      // Sort by relevance (currently prioritizing results with award mentions)
      const sortedResults = this.sortResultsByRelevance(uniqueResults, normalizedVertical);
      
      return {
        success: true,
        vertical: normalizedVertical,
        query: searchQueries[0],
        results: sortedResults.slice(0, 10), // Return top 10 results
        resultCount: sortedResults.length
      };
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.EXTERNAL,
        context: {
          service: 'WebSearchService',
          operation: 'searchDesignTrends',
          vertical
        }
      });
      
      return {
        success: false,
        vertical: this.normalizeVertical(vertical),
        error: {
          message: error instanceof Error ? error.message : 'Search failed',
          details: error instanceof Error ? error.stack : undefined
        },
        results: [],
        resultCount: 0
      };
    }
  }
  
  /**
   * Search for award-winning logos in a specific vertical
   * 
   * @param vertical - The industry vertical to search for
   * @returns Search results
   */
  async searchAwardWinningLogos(vertical: string): Promise<WebSearchResults> {
    try {
      this.logger.info('Starting award-winning logos search', { vertical });
      
      // Normalize vertical name to match our keyword dictionary
      const normalizedVertical = this.normalizeVertical(vertical);
      
      // Construct award-specific search queries
      const awardQueries = this.getAwardSearchQueries(normalizedVertical);
      
      const allResults: WebSearchResultItem[] = [];
      
      // Execute multiple searches with different queries
      for (const query of awardQueries.slice(0, 3)) { // Limit to 3 queries
        try {
          const results = await this.executeSearch(query);
          allResults.push(...results);
          
          // If we have enough results, we can stop
          if (allResults.length >= 15) {
            break;
          }
        } catch (error) {
          this.logger.warn('Award search query failed, trying next query', { 
            query, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // Deduplicate results by URL
      const uniqueResults = this.deduplicateResults(allResults);
      
      // Sort by relevance (prioritizing award sites)
      const sortedResults = this.sortResultsByRelevance(uniqueResults, normalizedVertical, true);
      
      return {
        success: true,
        vertical: normalizedVertical,
        query: awardQueries[0],
        results: sortedResults.slice(0, 10), // Return top 10 results
        resultCount: sortedResults.length
      };
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.EXTERNAL,
        context: {
          service: 'WebSearchService',
          operation: 'searchAwardWinningLogos',
          vertical
        }
      });
      
      return {
        success: false,
        vertical: this.normalizeVertical(vertical),
        error: {
          message: error instanceof Error ? error.message : 'Award search failed',
          details: error instanceof Error ? error.stack : undefined
        },
        results: [],
        resultCount: 0
      };
    }
  }
  
  /**
   * Execute a search query using the WebSearch tool
   * 
   * @param query - The search query
   * @returns Search results
   */
  private async executeSearch(query: string): Promise<WebSearchResultItem[]> {
    try {
      // Check if mcp__WebSearch is available and use it if possible
      if (typeof window !== 'undefined' && 'mcp__WebSearch' in window) {
        const mcp = (window as any).mcp__WebSearch;
        const mpcResults = await mcp({ query });
        
        // Transform results to our format
        return (mpcResults.results || []).map((result: any) => ({
          title: result.title,
          url: result.url,
          snippet: result.snippet || result.description,
          domain: this.extractDomain(result.url)
        }));
      }
      
      // Here we'd add fallback search implementation for non-MPC environments
      // For now, we'll throw an error so we know we need to handle this case
      throw new Error('WebSearch tool not available in this environment');
    } catch (error) {
      this.logger.error('Search execution failed', {
        query,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * Generate search queries for a specific vertical
   * 
   * @param vertical - The industry vertical
   * @param additionalContext - Additional context to refine the search
   * @returns Array of search queries
   */
  private getSearchQueries(vertical: string, additionalContext?: string): string[] {
    const keywords = VERTICAL_SEARCH_KEYWORDS[vertical] || FALLBACK_SEARCH_KEYWORDS;
    const year = this.currentYear;
    
    const queries = keywords.map(keyword => {
      // Add year to make results more current
      let query = `${keyword} ${year}`;
      
      // Add additional context if provided
      if (additionalContext) {
        query += ` ${additionalContext}`;
      }
      
      return query;
    });
    
    // Add an award-specific query
    queries.push(`award winning ${vertical} logo design ${year}`);
    
    return queries;
  }
  
  /**
   * Generate award-specific search queries
   * 
   * @param vertical - The industry vertical
   * @returns Array of search queries
   */
  private getAwardSearchQueries(vertical: string): string[] {
    const awardQueries = [];
    
    // Add design award site-specific queries
    for (const site of DESIGN_AWARD_SITES) {
      awardQueries.push(`${site} ${vertical} logo design award`);
    }
    
    // Add general award queries
    awardQueries.push(`award winning ${vertical} logo design ${this.currentYear}`);
    awardQueries.push(`best ${vertical} brand identity design ${this.currentYear}`);
    awardQueries.push(`${vertical} logo design case study award`);
    
    return awardQueries;
  }
  
  /**
   * Normalize vertical name to match our keyword dictionary
   * 
   * @param vertical - The industry vertical
   * @returns Normalized vertical name
   */
  private normalizeVertical(vertical: string): string {
    // Convert to lowercase and replace spaces with underscores
    const normalized = vertical.toLowerCase().replace(/\s+/g, '_');
    
    // Map common synonyms to our standard verticals
    const verticalMap: Record<string, string> = {
      'tech': 'technology',
      'information_technology': 'technology',
      'software': 'technology',
      'it': 'technology',
      'medical': 'healthcare',
      'health': 'healthcare',
      'wellness': 'healthcare',
      'hospital': 'healthcare',
      'financial': 'finance',
      'banking': 'finance',
      'investment': 'finance',
      'insurance': 'finance',
      'food': 'food_beverage',
      'restaurant': 'food_beverage',
      'catering': 'food_beverage',
      'educational': 'education',
      'school': 'education',
      'university': 'education',
      'college': 'education',
      'media': 'entertainment',
      'gaming': 'entertainment',
      'movie': 'entertainment',
      'music': 'entertainment',
      'streaming': 'entertainment',
      'fashion': 'retail',
      'e-commerce': 'retail',
      'ecommerce': 'retail',
      'store': 'retail',
      'legal': 'professional_services',
      'law': 'professional_services',
      'consulting': 'professional_services',
      'accounting': 'professional_services',
      'agency': 'professional_services',
      'real_estate': 'real_estate',
      'property': 'real_estate',
      'construction': 'real_estate',
      'architecture': 'real_estate',
      'industrial': 'manufacturing',
      'factory': 'manufacturing',
      'production': 'manufacturing',
      'logistics': 'transportation',
      'shipping': 'transportation',
      'automotive': 'transportation',
      'travel': 'transportation'
    };
    
    // Return mapped vertical or the original if no mapping exists
    return verticalMap[normalized] || normalized;
  }
  
  /**
   * Deduplicate search results by URL
   * 
   * @param results - Array of search results
   * @returns Deduplicated results
   */
  private deduplicateResults(results: WebSearchResultItem[]): WebSearchResultItem[] {
    const seen = new Set<string>();
    return results.filter(result => {
      // Normalize URL to avoid duplicates with trailing slashes or www prefixes
      const normalizedUrl = result.url.replace(/\/$/, '').replace(/^https?:\/\/(www\.)?/, '');
      if (seen.has(normalizedUrl)) {
        return false;
      }
      seen.add(normalizedUrl);
      return true;
    });
  }
  
  /**
   * Sort search results by relevance
   * 
   * @param results - Array of search results
   * @param vertical - The industry vertical
   * @param prioritizeAwards - Whether to prioritize award sites
   * @returns Sorted results
   */
  private sortResultsByRelevance(
    results: WebSearchResultItem[], 
    vertical: string, 
    prioritizeAwards = false
  ): WebSearchResultItem[] {
    // Keywords that indicate higher relevance
    const relevanceKeywords = [
      'award', 'winner', 'best', 'top', 'trend', 'case study', 
      vertical, 'design', 'logo', 'brand', 'identity'
    ];
    
    // Award site domains
    const awardDomains = [
      'awwwards.com', 'cssdesignawards.com', 'commarts.com', 'red-dot.org',
      'dandad.org', 'thedieline.com', 'designweek.co.uk', 'logotournament.com',
      'logolounge.com', 'pentawards.org', 'graphis.com', 'tdc.org', 'oneclub.org',
      'creativityawards.com', 'theroseawards.com'
    ];
    
    return results.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      
      // Score based on keywords in title and snippet
      relevanceKeywords.forEach(keyword => {
        const regExp = new RegExp(keyword, 'i');
        
        if (regExp.test(a.title)) scoreA += 2;
        if (regExp.test(b.title)) scoreB += 2;
        
        if (regExp.test(a.snippet || '')) scoreA += 1;
        if (regExp.test(b.snippet || '')) scoreB += 1;
      });
      
      // Score based on year in title or snippet
      const yearRegExp = new RegExp(`${this.currentYear}|${this.currentYear - 1}`, 'i');
      if (yearRegExp.test(a.title) || yearRegExp.test(a.snippet || '')) scoreA += 3;
      if (yearRegExp.test(b.title) || yearRegExp.test(b.snippet || '')) scoreB += 3;
      
      // Bonus for award domains if prioritizing awards
      if (prioritizeAwards) {
        if (awardDomains.some(domain => a.domain.includes(domain))) scoreA += 5;
        if (awardDomains.some(domain => b.domain.includes(domain))) scoreB += 5;
      }
      
      // Return comparison (higher score first)
      return scoreB - scoreA;
    });
  }
  
  /**
   * Extract domain from URL
   * 
   * @param url - The URL to extract domain from
   * @returns Domain name
   */
  private extractDomain(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, '');
    } catch (error) {
      return url.split('/')[2] || '';
    }
  }
}