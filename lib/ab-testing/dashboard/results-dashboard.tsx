import React, { useState, useEffect, useCallback } from 'react';
import { 
  TestResults, 
  TestConfig, 
  TestVariant,
  TestMetric 
} from '../types';
import { getTestManager } from '../index';

interface ResultsDashboardProps {
  testIds?: string[];
  className?: string;
}

/**
 * Dashboard for viewing A/B test results
 * For internal use by the team to analyze test performance
 */
export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  testIds,
  className = ''
}) => {
  const [activeTests, setActiveTests] = useState<TestConfig[]>([]);
  const [testResults, setTestResults] = useState<Record<string, TestResults>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  // Load active tests
  const loadTests = useCallback(async () => {
    try {
      setLoading(true);
      const testManager = getTestManager();
      
      // Mock implementation for demo
      const mockActiveTests = await getMockTests();
      setActiveTests(mockActiveTests);
      
      // Set first test as selected by default
      if (mockActiveTests.length > 0 && !selectedTestId) {
        setSelectedTestId(mockActiveTests[0].id);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load tests');
      setLoading(false);
    }
  }, [selectedTestId]);

  // Load results for a specific test
  const loadTestResults = useCallback(async (testId: string) => {
    try {
      setLoading(true);
      const testManager = getTestManager();
      
      // Mock implementation for demo
      const results = await getMockResults(testId);
      
      setTestResults(prev => ({
        ...prev,
        [testId]: results
      }));
      
      setLoading(false);
    } catch (err) {
      setError(`Failed to load results for test ${testId}`);
      setLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    loadTests();
  }, [loadTests]);

  // Load results when selected test changes
  useEffect(() => {
    if (selectedTestId) {
      loadTestResults(selectedTestId);
    }
  }, [selectedTestId, loadTestResults]);

  // Handle test selection
  const handleSelectTest = (testId: string) => {
    setSelectedTestId(testId);
  };

  // Get currently selected test
  const selectedTest = selectedTestId 
    ? activeTests.find(test => test.id === selectedTestId) 
    : null;
  
  // Get results for selected test
  const selectedResults = selectedTestId 
    ? testResults[selectedTestId] 
    : null;

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h2 className="text-lg font-medium text-gray-900">A/B Test Results Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          View and analyze the results of your A/B tests
        </p>
      </div>
      
      {loading && (
        <div className="flex justify-center items-center p-8">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 p-4 border-l-4 border-red-500">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div className="flex">
          {/* Test list sidebar */}
          <div className="w-64 border-r border-gray-200 bg-gray-50 p-4">
            <h3 className="font-medium text-gray-700 mb-2">Active Tests</h3>
            
            {activeTests.length === 0 ? (
              <p className="text-sm text-gray-500">No active tests found</p>
            ) : (
              <ul className="space-y-1">
                {activeTests.map(test => (
                  <li key={test.id}>
                    <button
                      onClick={() => handleSelectTest(test.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedTestId === test.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {test.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Test results content */}
          <div className="flex-1 p-6">
            {!selectedTest ? (
              <div className="text-center py-8 text-gray-500">
                <p>Select a test to view results</p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-medium text-gray-900">{selectedTest.name}</h2>
                  <p className="mt-1 text-gray-600">{selectedTest.description}</p>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-700 font-medium">Status</p>
                      <p className="mt-1 font-medium">
                        {selectedResults?.status === 'running' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Running
                          </span>
                        )}
                        {selectedResults?.status === 'completed' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        )}
                        {selectedResults?.status === 'inconclusive' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inconclusive
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <p className="text-sm text-indigo-700 font-medium">Sample Size</p>
                      <p className="mt-1 font-medium">
                        {selectedResults && (
                          <span>
                            {Object.values(selectedResults.sampleSize).reduce((sum, val) => sum + val, 0)}
                            <span className="text-xs text-indigo-500 ml-1">
                              ({selectedTest.minimumSampleSize} min)
                            </span>
                          </span>
                        )}
                      </p>
                    </div>
                    
                    <div className="bg-emerald-50 p-3 rounded-lg">
                      <p className="text-sm text-emerald-700 font-medium">Winner</p>
                      <p className="mt-1 font-medium">
                        {selectedResults?.winner ? (
                          <span className="flex items-center">
                            Variant {selectedResults.winner}
                            <span className="ml-2 text-xs text-emerald-500">
                              ({Math.round(selectedResults.winnerConfidence * 100)}% confidence)
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-500">Not determined</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Metrics */}
                {selectedResults && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Metrics</h3>
                    
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                              Metric
                            </th>
                            {Object.keys(selectedResults.sampleSize).map(variant => (
                              <th key={variant} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                Variant {variant} 
                                <span className="ml-2 text-xs text-gray-500">
                                  (n={selectedResults.sampleSize[variant as TestVariant] || 0})
                                </span>
                              </th>
                            ))}
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                              Difference
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {Object.entries(selectedResults.metrics).map(([metric, values]) => (
                            <tr key={metric}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                {formatMetricName(metric)}
                              </td>
                              {Object.keys(selectedResults.sampleSize).map(variant => (
                                <td key={`${metric}-${variant}`} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                  {values[variant as TestVariant] ? (
                                    <span>
                                      {formatMetricValue(metric, values[variant as TestVariant]?.mean)}
                                      <span className="block text-xs text-gray-400">
                                        ±{formatMetricValue(metric, (values[variant as TestVariant]?.confidenceInterval?.[1] || 0) - (values[variant as TestVariant]?.mean || 0))}
                                      </span>
                                    </span>
                                  ) : (
                                    <span>-</span>
                                  )}
                                </td>
                              ))}
                              <td className="whitespace-nowrap px-3 py-4 text-sm">
                                {calculateDifference(values, metric)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Insights and Recommendations */}
                {selectedResults && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-sm font-medium text-gray-900">Insights</h3>
                      </div>
                      <div className="px-4 py-4">
                        {selectedResults.insights.length === 0 ? (
                          <p className="text-gray-500 text-sm">No insights available yet</p>
                        ) : (
                          <ul className="space-y-2">
                            {selectedResults.insights.map((insight, idx) => (
                              <li key={idx} className="text-sm text-gray-700">
                                • {insight}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-sm font-medium text-gray-900">Recommendations</h3>
                      </div>
                      <div className="px-4 py-4">
                        {selectedResults.recommendations.length === 0 ? (
                          <p className="text-gray-500 text-sm">No recommendations available yet</p>
                        ) : (
                          <ul className="space-y-2">
                            {selectedResults.recommendations.map((recommendation, idx) => (
                              <li key={idx} className="text-sm text-gray-700">
                                • {recommendation}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions

// Format metric names for display
function formatMetricName(metric: string): string {
  switch (metric) {
    case TestMetric.USER_SATISFACTION:
      return 'User Satisfaction';
    case TestMetric.GENERATION_SPEED:
      return 'Generation Speed (ms)';
    case TestMetric.LOGO_QUALITY:
      return 'Logo Quality Score';
    case TestMetric.CONVERSION_RATE:
      return 'Conversion Rate (%)';
    case TestMetric.ENGAGEMENT:
      return 'Engagement Score';
    case TestMetric.TOKEN_EFFICIENCY:
      return 'Token Efficiency';
    default:
      return metric.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
  }
}

// Format metric values based on metric type
function formatMetricValue(metric: string, value: number | undefined): string {
  if (value === undefined) return '-';
  
  if (metric === TestMetric.GENERATION_SPEED) {
    return Math.round(value).toLocaleString() + 'ms';
  }
  
  if (metric === TestMetric.CONVERSION_RATE) {
    return value.toFixed(1) + '%';
  }
  
  if (metric === TestMetric.USER_SATISFACTION || metric === TestMetric.LOGO_QUALITY) {
    return value.toFixed(2);
  }
  
  return value.toFixed(2);
}

// Calculate difference between variants with styling
function calculateDifference(
  values: Record<string, any>,
  metric: string
): JSX.Element | null {
  const variants = Object.keys(values);
  if (variants.length < 2) return null;
  
  // Use A as baseline and B as comparison by default
  const baselineVariant = TestVariant.A;
  const comparisonVariant = TestVariant.B;
  
  if (!values[baselineVariant] || !values[comparisonVariant]) return null;
  
  const baselineValue = values[baselineVariant].mean;
  const comparisonValue = values[comparisonVariant].mean;
  
  if (baselineValue === undefined || comparisonValue === undefined) return null;
  
  const absoluteDiff = comparisonValue - baselineValue;
  const percentDiff = (absoluteDiff / baselineValue) * 100;
  
  const isPositive = 
    (metric === TestMetric.GENERATION_SPEED) 
      ? absoluteDiff < 0 // Lower is better for speed
      : absoluteDiff > 0; // Higher is better for other metrics
  
  const color = isPositive ? 'text-green-600' : 'text-red-600';
  const sign = absoluteDiff > 0 ? '+' : '';
  
  return (
    <span className={color}>
      {sign}{absoluteDiff.toFixed(2)} ({sign}{Math.abs(percentDiff).toFixed(1)}%)
    </span>
  );
}

// Mock data functions for demo purposes

async function getMockTests(): Promise<TestConfig[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'svg_generation_test',
      name: 'SVG Generation Approach',
      description: 'Testing different prompt techniques for SVG generation',
      component: TestComponent.SVG_GENERATION_APPROACH,
      variants: {},
      metrics: [TestMetric.LOGO_QUALITY, TestMetric.USER_SATISFACTION],
      feedbackSources: [FeedbackSource.EXPLICIT_RATING],
      trafficAllocation: { A: 50, B: 50 },
      startDate: new Date('2025-06-01'),
      minimumSampleSize: 30,
      isActive: true
    },
    {
      id: 'ui_layout_test',
      name: 'UI Layout Comparison',
      description: 'Testing centered vs asymmetrical layout designs',
      component: TestComponent.UI_LAYOUT,
      variants: {},
      metrics: [TestMetric.USER_SATISFACTION, TestMetric.ENGAGEMENT],
      feedbackSources: [FeedbackSource.EXPLICIT_RATING],
      trafficAllocation: { A: 50, B: 50 },
      startDate: new Date('2025-06-05'),
      minimumSampleSize: 50,
      isActive: true
    }
  ];
}

async function getMockResults(testId: string): Promise<TestResults> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 700));
  
  if (testId === 'svg_generation_test') {
    return {
      testId,
      status: 'running',
      sampleSize: {
        [TestVariant.A]: 21,
        [TestVariant.B]: 19
      },
      metrics: {
        [TestMetric.LOGO_QUALITY]: {
          [TestVariant.A]: {
            mean: 3.85,
            median: 4.00,
            standardDeviation: 0.75,
            confidenceInterval: [3.52, 4.18]
          },
          [TestVariant.B]: {
            mean: 4.32,
            median: 4.50,
            standardDeviation: 0.68,
            confidenceInterval: [4.02, 4.62]
          }
        },
        [TestMetric.USER_SATISFACTION]: {
          [TestVariant.A]: {
            mean: 4.05,
            median: 4.00,
            standardDeviation: 0.80,
            confidenceInterval: [3.69, 4.41]
          },
          [TestVariant.B]: {
            mean: 4.42,
            median: 4.50,
            standardDeviation: 0.61,
            confidenceInterval: [4.15, 4.69]
          }
        },
        [TestMetric.GENERATION_SPEED]: {
          [TestVariant.A]: {
            mean: 63200,
            median: 62100,
            standardDeviation: 5400,
            confidenceInterval: [60800, 65600]
          },
          [TestVariant.B]: {
            mean: 68900,
            median: 67800,
            standardDeviation: 6200,
            confidenceInterval: [66100, 71700]
          }
        }
      },
      winner: undefined,
      winnerConfidence: 0,
      insights: [
        'Variant B shows a 12.2% improvement in Logo Quality scores',
        'Variant B has 9.1% higher User Satisfaction ratings',
        'Variant B takes 9.0% longer to generate logos on average'
      ],
      recommendations: [
        'Continue the test to reach minimum sample size of 30 per variant',
        'Consider analyzing the trade-off between generation speed and quality'
      ]
    };
  }
  
  if (testId === 'ui_layout_test') {
    return {
      testId,
      status: 'completed',
      sampleSize: {
        [TestVariant.A]: 52,
        [TestVariant.B]: 54
      },
      metrics: {
        [TestMetric.USER_SATISFACTION]: {
          [TestVariant.A]: {
            mean: 3.92,
            median: 4.00,
            standardDeviation: 0.85,
            confidenceInterval: [3.69, 4.15]
          },
          [TestVariant.B]: {
            mean: 4.36,
            median: 4.50,
            standardDeviation: 0.74,
            confidenceInterval: [4.16, 4.56]
          }
        },
        [TestMetric.ENGAGEMENT]: {
          [TestVariant.A]: {
            mean: 4.2,
            median: 4.0,
            standardDeviation: 1.9,
            confidenceInterval: [3.7, 4.7]
          },
          [TestVariant.B]: {
            mean: 6.8,
            median: 7.0,
            standardDeviation: 2.1,
            confidenceInterval: [6.2, 7.4]
          }
        },
        [TestMetric.CONVERSION_RATE]: {
          [TestVariant.A]: {
            mean: 82.3,
            median: 82.3,
            standardDeviation: 3.8,
            confidenceInterval: [81.2, 83.4]
          },
          [TestVariant.B]: {
            mean: 89.1,
            median: 89.1,
            standardDeviation: 3.2,
            confidenceInterval: [88.2, 90.0]
          }
        }
      },
      winner: TestVariant.B,
      winnerConfidence: 0.95,
      insights: [
        'Asymmetrical layout (B) resulted in 11.2% higher user satisfaction',
        'Engagement metrics were 61.9% higher with asymmetrical layout',
        'Conversion rate improved by 8.3% with the new layout design',
        'Both mobile and desktop users preferred the asymmetrical layout'
      ],
      recommendations: [
        'Implement asymmetrical layout as the default UI design',
        'Apply similar UI principles to other parts of the application',
        'Consider additional refinements to the asymmetrical layout',
        'Monitor long-term engagement after implementation'
      ]
    };
  }
  
  return {
    testId,
    status: 'running',
    sampleSize: {
      [TestVariant.A]: 0,
      [TestVariant.B]: 0
    },
    metrics: {},
    insights: [],
    recommendations: []
  };
}

export default ResultsDashboard;