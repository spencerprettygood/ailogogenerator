import React, { useState, useEffect, useCallback } from 'react';
import { TestComponent, FeedbackSource, TestConfig, TestMetric, TestResults, TestVariant, MetricResult, VariantConfig } from '@/lib/types';
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
      if (mockActiveTests.length > 0 && mockActiveTests[0] && !selectedTestId) {
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
                      {/* Only render test.name, not the whole test object */}
                      {typeof test.name === 'string' ? test.name : String(test.name)}
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
                  <h2 className="text-xl font-medium text-gray-900">
                    {/* Only render selectedTest.name, not the object */}
                    {typeof selectedTest.name === 'string' ? selectedTest.name : String(selectedTest.name)}
                  </h2>
                  <p className="mt-1 text-gray-600">
                    {/* Only render selectedTest.description, not the object */}
                    {typeof selectedTest.description === 'string' ? selectedTest.description : String(selectedTest.description)}
                  </p>
                  
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
                            {typeof selectedResults.winnerConfidence === 'number' &&
                              <span className="ml-2 text-xs text-emerald-500">
                                ({Math.round(selectedResults.winnerConfidence * 100)}% confidence)
                              </span>
                            }
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
                                {calculateDifference(values, metric as TestMetric)}
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
  if (typeof value !== 'number') {
    return '-';
  }
  
  switch (metric) {
    case TestMetric.CONVERSION_RATE:
    case TestMetric.ENGAGEMENT:
      return `${value.toFixed(2)}%`;
    case TestMetric.GENERATION_SPEED:
      return `${Math.round(value)} ms`;
    case TestMetric.LOGO_QUALITY:
      return `${value} / 10`;
    case TestMetric.USER_SATISFACTION:
      return `${value} stars`;
    case TestMetric.TOKEN_EFFICIENCY:
      return `${value.toFixed(2)} tokens`;
    default:
      return value.toString();
  }
}

// Calculate difference between variant values for a metric
function calculateDifference(values: { [key in TestVariant]?: MetricResult }, metric: TestMetric): React.ReactNode {
  const variantKeys = Object.keys(values) as TestVariant[];
  if (variantKeys.length < 2) {
    return '-';
  }

  const firstVariantKey = variantKeys[0];
  const secondVariantKey = variantKeys[1];

  if(!firstVariantKey || !secondVariantKey) return '-';

  const firstValue = values[firstVariantKey]?.mean || 0;
  const secondValue = values[secondVariantKey]?.mean || 0;
  const diff = secondValue - firstValue;

  const sign = diff > 0 ? '+' : '';
  const color = diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-500' : 'text-gray-500';

  return <span className={color}>{`${sign}${diff.toFixed(2)}%`}</span>;
}

// Mock functions for demo
async function getMockTests(): Promise<TestConfig[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        {
          id: 'test1',
          name: 'Test 1',
          description: 'Description for Test 1',
          component: TestComponent.LOGO_GENERATION_UI,
          variants: {
              [TestVariant.A]: { name: 'Control', description: 'Original version' },
              [TestVariant.B]: { name: 'Variant B', description: 'New header' },
              [TestVariant.C]: { name: 'Variant C', description: 'Different CTA' },
          },
          metrics: [TestMetric.CONVERSION_RATE, TestMetric.ENGAGEMENT, TestMetric.USER_SATISFACTION],
          feedbackSources: [FeedbackSource.DIRECT_FEEDBACK, FeedbackSource.SURVEY],
          minimumSampleSize: 100,
          maxDurationDays: 14,
          confidenceThreshold: 0.95
        },
        {
          id: 'test2',
          name: 'Test 2',
          description: 'Description for Test 2',
          component: TestComponent.ONBOARDING_FLOW,
          variants: {
            [TestVariant.A]: { name: 'Control', description: 'Original onboarding' },
            [TestVariant.B]: { name: 'Variant B', description: 'Simplified onboarding' },
          },
          metrics: [TestMetric.CONVERSION_RATE, TestMetric.TIME_TO_CONVERT],
          feedbackSources: [FeedbackSource.USAGE_ANALYTICS],
          minimumSampleSize: 1000,
          maxDurationDays: 30,
          confidenceThreshold: 0.99
        }
      ]);
    }, 1000);
  });
}

async function getMockResults(testId: string): Promise<TestResults> {
  return new Promise(resolve => {
    setTimeout(() => {
      if (testId === 'test1') {
        resolve({
          testId: 'test1',
          status: 'running',
          sampleSize: {
            [TestVariant.A]: 50,
            [TestVariant.B]: 55,
            [TestVariant.C]: 60
          },
          winner: undefined,
          winnerConfidence: 0,
          metrics: {
            [TestMetric.CONVERSION_RATE]: {
              [TestVariant.A]: { mean: 2.5, confidenceInterval: [2.0, 3.0] },
              [TestVariant.B]: { mean: 3.0, confidenceInterval: [2.5, 3.5] },
              [TestVariant.C]: { mean: 3.5, confidenceInterval: [3.0, 4.0] }
            },
            [TestMetric.ENGAGEMENT]: {
              [TestVariant.A]: { mean: 75, confidenceInterval: [70, 80] },
              [TestVariant.B]: { mean: 80, confidenceInterval: [75, 85] },
              [TestVariant.C]: { mean: 85, confidenceInterval: [80, 90] }
            }
          },
          insights: [],
          recommendations: []
        });
      } else {
        resolve({
          testId: 'test2',
          status: 'completed',
          sampleSize: {
            [TestVariant.A]: 150,
            [TestVariant.B]: 160,
            [TestVariant.C]: 170
          },
          winner: TestVariant.C,
          winnerConfidence: 0.95,
          metrics: {
            [TestMetric.CONVERSION_RATE]: {
              [TestVariant.A]: { mean: 2.8, confidenceInterval: [2.3, 3.3] },
              [TestVariant.B]: { mean: 3.2, confidenceInterval: [2.7, 3.7] },
              [TestVariant.C]: { mean: 4.0, confidenceInterval: [3.5, 4.5] }
            },
            [TestMetric.ENGAGEMENT]: {
              [TestVariant.A]: { mean: 78, confidenceInterval: [73, 83] },
              [TestVariant.B]: { mean: 82, confidenceInterval: [77, 87] },
              [TestVariant.C]: { mean: 88, confidenceInterval: [83, 93] }
            }
          },
          insights: ['Variant C showed a significant lift in conversion rate.'],
          recommendations: ['Roll out Variant C to all users.']
        });
      }
    }, 500);
  });
}