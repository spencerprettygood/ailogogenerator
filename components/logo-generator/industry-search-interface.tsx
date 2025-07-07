'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  ExternalLink,
  Info,
  Award,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Check,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { WebSearchResults, WebSearchResultItem } from '@/lib/types';
import { ErrorCategory, handleError } from '@/lib/utils/error-handler';

// Common industries for logo design
const COMMON_INDUSTRIES = [
  'technology',
  'finance',
  'healthcare',
  'food & beverage',
  'retail',
  'education',
  'real estate',
  'fitness',
  'beauty',
  'e-commerce',
  'gaming',
  'media',
  'consulting',
  'travel',
  'non-profit',
];

interface IndustrySearchInterfaceProps {
  brandName?: string;
  designSpec?: any;
  svgCode?: string | null;
  onIndustrySelect: (industry: string) => void;
  onInsightSelect?: (insight: string) => void;
  className?: string;
}

export function IndustrySearchInterface({
  brandName = 'Your brand',
  designSpec,
  svgCode,
  onIndustrySelect,
  onInsightSelect,
  className = '',
}: IndustrySearchInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [analysisStarted, setAnalysisStarted] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [designTrends, setDesignTrends] = useState<WebSearchResults | null>(null);
  const [awardWinners, setAwardWinners] = useState<WebSearchResults | null>(null);
  const [activeTab, setActiveTab] = useState<'trends' | 'awards'>('trends');
  const [insights, setInsights] = useState<string[]>([]);

  // Filter industries based on search query
  const filteredIndustries = COMMON_INDUSTRIES.filter(industry =>
    industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      // Simulate search delay
      setTimeout(() => {
        setIsSearching(false);
      }, 1500);
    }
  };

  const handleIndustrySelect = (industry: string) => {
    setSelectedIndustry(industry);
  };

  const handleAnalyzeClick = () => {
    if (selectedIndustry) {
      setAnalysisStarted(true);
      onIndustrySelect(selectedIndustry);

      // When analysis starts, load data for the selected industry
      loadIndustryData(selectedIndustry);
    }
  };

  // Load design trends and award winners for the industry
  const loadIndustryData = async (industry: string) => {
    if (!industry) return;

    setIsLoading(true);

    try {
      // Simulate API calls since actual endpoints aren't implemented yet
      setTimeout(() => {
        // Simulate search results (in production, this would be actual API data)
        const mockTrendsData: WebSearchResults = {
          success: true,
          vertical: industry,
          query: `${industry} logo design trends`,
          results: generateMockResults(industry, 'trends'),
          resultCount: 5,
        };

        const mockAwardsData: WebSearchResults = {
          success: true,
          vertical: industry,
          query: `${industry} award winning logos`,
          results: generateMockResults(industry, 'awards'),
          resultCount: 5,
        };

        setDesignTrends(mockTrendsData);
        setAwardWinners(mockAwardsData);

        // Generate insights
        generateInsights(mockTrendsData, mockAwardsData);
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      handleError(error, {
        category: ErrorCategory.NETWORK,
        context: {
          component: 'IndustrySearchInterface',
          operation: 'loadIndustryData',
          industry,
        },
      });
      setIsLoading(false);
    }
  };

  // Generate mock search results for demo purposes
  const generateMockResults = (
    industry: string,
    type: 'trends' | 'awards'
  ): WebSearchResultItem[] => {
    if (type === 'trends') {
      return [
        {
          title: `${capitalizeWords(industry)} Logo Design Trends for 2024`,
          url: `https://example.com/${industry}-logo-trends-2024`,
          snippet: `The latest trends in ${industry} logos include minimalist designs, bold typography, and geometric shapes. Companies are moving away from complex imagery towards clean, scalable logos.`,
          domain: 'example.com',
        },
        {
          title: `How ${capitalizeWords(industry)} Brands Are Redefining Visual Identity`,
          url: `https://designtrends.com/${industry}-visual-identity`,
          snippet: `Leading ${industry} companies are embracing dynamic logos that adapt to different contexts. Color gradients and responsive design elements feature prominently in recent rebrands.`,
          domain: 'designtrends.com',
        },
        {
          title: `The Evolution of ${capitalizeWords(industry)} Branding: From Traditional to Modern`,
          url: `https://brandingmag.com/${industry}-evolution`,
          snippet: `${capitalizeWords(industry)} logos have evolved from detailed illustrations to simplified forms that work well across digital platforms. Negative space and smart typography are key elements.`,
          domain: 'brandingmag.com',
        },
        {
          title: `Color Psychology in ${capitalizeWords(industry)} Logo Design`,
          url: `https://colormatters.com/${industry}-psychology`,
          snippet: `The choice of colors in ${industry} logos significantly impacts brand perception. Blues convey trust, greens suggest growth, while reds create urgency and excitement.`,
          domain: 'colormatters.com',
        },
        {
          title: `Typography Trends in ${capitalizeWords(industry)} Branding`,
          url: `https://typographyinsight.com/${industry}-fonts`,
          snippet: `Custom typography is becoming a differentiator in ${industry} logos. Sans-serif fonts dominate for their readability across devices, but unique letterforms help brands stand out.`,
          domain: 'typographyinsight.com',
        },
      ];
    } else {
      return [
        {
          title: `Award-Winning ${capitalizeWords(industry)} Logos of 2024`,
          url: `https://designawards.com/${industry}-winners-2024`,
          snippet: `The top ${industry} logos this year demonstrate exceptional versatility and conceptual depth. Winners include startups and established brands that successfully reimagined their visual identities.`,
          domain: 'designawards.com',
        },
        {
          title: `${capitalizeWords(industry)} Brand of the Year: Logo Design Analysis`,
          url: `https://logolounge.com/${industry}-brand-year`,
          snippet: `This year's standout ${industry} logo combines simplicity with meaningful symbolism. The design works effectively across all touchpoints while remaining instantly recognizable.`,
          domain: 'logolounge.com',
        },
        {
          title: `Red Dot Design Award: ${capitalizeWords(industry)} Category Winners`,
          url: `https://red-dot.org/winners/${industry}`,
          snippet: `Red Dot recognized these ${industry} logos for their innovative approach to visual communication. Each winner demonstrated exceptional craftsmanship and strategic thinking.`,
          domain: 'red-dot.org',
        },
        {
          title: `${capitalizeWords(industry)} Rebrand of the Year: Before and After`,
          url: `https://rebrandcase.com/${industry}-transformation`,
          snippet: `This ${industry} company's logo redesign won multiple awards for successfully modernizing while retaining brand equity. The case study reveals their strategic approach to visual evolution.`,
          domain: 'rebrandcase.com',
        },
        {
          title: `The ${capitalizeWords(industry)} Logo Design Showcase: Award Winners`,
          url: `https://awwwards.com/${industry}-logo-showcase`,
          snippet: `Awwwards highlights the most innovative ${industry} logos that push creative boundaries while solving business challenges. These designs represent the pinnacle of ${industry} visual branding.`,
          domain: 'awwwards.com',
        },
      ];
    }
  };

  // Helper function to capitalize words
  const capitalizeWords = (str: string): string => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Generate insights from search results
  const generateInsights = (trends: WebSearchResults, awards: WebSearchResults) => {
    // For this demo, we'll use predetermined insights based on the industry
    const industryInsights: Record<string, string[]> = {
      technology: [
        'Consider using minimalist design elements with a futuristic edge.',
        'Bold, clean typography is trending in technology branding.',
        'Award-winning tech logos often incorporate geometric shapes and negative space.',
        'Balance abstraction with recognizable symbols for tech credibility.',
        'Color choice is critical for technology brand differentiation, with blues dominating the space.',
      ],
      finance: [
        'Consider using stable, symmetrical design elements to convey trust.',
        'Clean typography with appropriate spacing signals professionalism in financial branding.',
        'Award-winning finance logos often use blue and green color palettes.',
        'Balance tradition with modernity to appeal to both established and younger audiences.',
        'Subtle gradients are emerging as a trend in finance logos, adding dimension without complexity.',
      ],
      healthcare: [
        'Consider using rounded, organic shapes to convey care and compassion.',
        'Clean, readable typography is essential for healthcare brand credibility.',
        'Award-winning healthcare logos often incorporate blue and green tones.',
        'Balance professionalism with approachability in healthcare visual identity.',
        'Symbolic elements that subtly represent care or wellness can strengthen recognition.',
      ],
      retail: [
        'Consider using dynamic, adaptable design elements for omnichannel presence.',
        'Bold typography and distinctive lettering are trending in retail branding.',
        'Award-winning retail logos often feature vibrant color palettes to stand out.',
        'Balance memorability with versatility for various applications and merchandise.',
        'Custom letterforms or unique type treatments help retail brands differentiate.',
      ],
    };

    // Set insights based on selected industry, with fallback to generic insights
    if (selectedIndustry && industryInsights[selectedIndustry]) {
      setInsights(industryInsights[selectedIndustry]);
    } else {
      setInsights([
        'Consider balancing industry conventions with unique elements to stand out appropriately.',
        'Typography choice significantly impacts how your brand is perceived.',
        'Award-winning logos often use color strategically rather than decoratively.',
        'Balance simplicity with meaningful symbolism for lasting impact.',
        'Ensure your logo works effectively across all required applications and sizes.',
      ]);
    }
  };

  // Handle insight selection
  const handleInsightClick = (insight: string) => {
    if (onInsightSelect) {
      onInsightSelect(insight);
    }
  };

  // Refresh search results
  const handleRefresh = async () => {
    if (selectedIndustry) {
      loadIndustryData(selectedIndustry);
    }
  };

  return (
    <Card className={`${className}`}>
      {!analysisStarted ? (
        <CardContent className="p-4">
          <div className="mb-3 text-sm font-medium">
            Analyze how your logo compares to industry standards
          </div>

          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search industry (e.g., technology, retail)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full aspect-square"
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            {filteredIndustries.map(industry => (
              <Button
                key={industry}
                variant={selectedIndustry === industry ? 'default' : 'outline'}
                size="sm"
                className="justify-start"
                onClick={() => handleIndustrySelect(industry)}
              >
                {selectedIndustry === industry && <Check className="h-3.5 w-3.5 mr-1.5" />}
                <span className="truncate">{industry}</span>
              </Button>
            ))}
          </div>

          <Button onClick={handleAnalyzeClick} disabled={!selectedIndustry} className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analyze {selectedIndustry || 'selected industry'}
          </Button>
        </CardContent>
      ) : (
        <>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>{selectedIndustry} Industry Research</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            {/* Insights section */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mr-2" />
                <h3 className="text-sm font-medium">Design Insights</h3>
              </div>
              <div className="space-y-2">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start py-1 px-2 rounded-md hover:bg-muted cursor-pointer group"
                    onClick={() => handleInsightClick(insight)}
                  >
                    <div className="mr-2 mt-0.5 text-muted-foreground">•</div>
                    <div className="text-sm flex-1">{insight}</div>
                    <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
                {insights.length === 0 && !isLoading && (
                  <div className="text-sm text-muted-foreground italic">
                    No insights available for this industry yet.
                  </div>
                )}
                {isLoading && (
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs for trends and awards */}
            <div className="border-b mb-3">
              <div className="flex space-x-4">
                <button
                  className={`pb-2 text-sm font-medium flex items-center space-x-1 ${
                    activeTab === 'trends'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => setActiveTab('trends')}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span>Design Trends</span>
                </button>
                <button
                  className={`pb-2 text-sm font-medium flex items-center space-x-1 ${
                    activeTab === 'awards'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => setActiveTab('awards')}
                >
                  <Award className="h-4 w-4 mr-1" />
                  <span>Award Winners</span>
                </button>
              </div>
            </div>

            {/* Results display */}
            <div className="max-h-64 overflow-y-auto pr-1">
              {activeTab === 'trends' && (
                <>
                  {isLoading ? (
                    <ResultSkeleton />
                  ) : designTrends?.success ? (
                    <ResultList results={designTrends.results} />
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 text-center italic">
                      Unable to load design trends for this industry.
                    </div>
                  )}
                </>
              )}

              {activeTab === 'awards' && (
                <>
                  {isLoading ? (
                    <ResultSkeleton />
                  ) : awardWinners?.success ? (
                    <ResultList results={awardWinners.results} />
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 text-center italic">
                      Unable to load award winners for this industry.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer with info */}
            <div className="mt-3 flex items-center text-xs text-muted-foreground">
              <Info className="h-3 w-3 mr-1" />
              <span>Search results are provided to help inspire your logo design decisions.</span>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}

// Component to display search results
function ResultList({ results }: { results: WebSearchResultItem[] }) {
  if (results.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center italic">No results found.</div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-start">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline flex-1 truncate"
            >
              {result.title}
            </a>
            <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0 text-muted-foreground" />
          </div>
          <div className="flex">
            <Badge variant="outline" className="text-xs h-5 mr-2">
              {result.domain}
            </Badge>
          </div>
          {result.snippet && (
            <p className="text-xs text-muted-foreground line-clamp-2">{result.snippet}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// Loading skeleton
function ResultSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
          <div className="h-3 bg-muted rounded animate-pulse w-1/4"></div>
          <div className="h-3 bg-muted rounded animate-pulse w-5/6"></div>
        </div>
      ))}
    </div>
  );
}

export default IndustrySearchInterface;
