/**
 * @file performance-dashboard.tsx
 * @module components/admin/performance-dashboard
 * @description Performance monitoring dashboard for administrators
 * 
 * This component provides real-time visibility into system performance metrics
 * including API response times, memory usage, token consumption, and pipeline stages.
 * 
 * @author AILogoGenerator Team
 * @version 1.0.0
 */

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  performanceMonitor, 
  PerformanceMetric,
  // TimingMetric is imported but not used, so removing it
  APIMetric,
  TokenUsageMetric,
  PipelineMetric,
  MemoryMetric
} from '../../lib/utils/performance-monitor';

/**
 * @interface PerformanceDashboardProps
 * @description Props for the PerformanceDashboard component
 * @property {string} [title='Performance Dashboard'] - Dashboard title
 * @property {boolean} [autoRefresh=true] - Whether to auto-refresh metrics
 * @property {number} [refreshInterval=5000] - Refresh interval in milliseconds
 * @property {boolean} [showControls=true] - Whether to show dashboard controls
 */
export interface PerformanceDashboardProps {
  title?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showControls?: boolean;
}

/**
 * @component PerformanceDashboard
 * @description Administrative dashboard for monitoring system performance
 * 
 * @example
 * <PerformanceDashboard
 *   title="System Performance"
 *   autoRefresh={true}
 *   refreshInterval={3000}
 * />
 * 
 * @param {PerformanceDashboardProps} props - Component props
 * @returns {JSX.Element} The dashboard component
 */
export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ 
  title = 'Performance Dashboard',
  autoRefresh = true,
  refreshInterval = 5000,
  showControls = true
}) => {
  // State for metrics and UI
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<number>(30 * 60 * 1000); // 30 minutes
  const [isEnabled, setIsEnabled] = useState<boolean>(performanceMonitor.isEnabled());
  
  // Get unique categories from metrics
  const categories = useMemo(() => {
    const uniqueCategories = new Set(metrics.map(m => m.category));
    return ['all', ...Array.from(uniqueCategories)];
  }, [metrics]);
  
  // Filter metrics by selected category and time range
  const filteredMetrics = useMemo(() => {
    const since = Date.now() - timeRange;
    let filtered = metrics.filter(m => m.timestamp >= since);
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }
    
    return filtered;
  }, [metrics, selectedCategory, timeRange]);
  
  // Compute summaries by metric type
  const summaries = useMemo(() => {
    // API calls summary
    const apiMetrics = filteredMetrics.filter(m => m.category === 'api') as APIMetric[];
    const apiSummary = apiMetrics.length > 0 ? {
      count: apiMetrics.length,
      avgResponseTime: apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length,
      successRate: apiMetrics.filter(m => m.statusCode < 400).length / apiMetrics.length * 100,
      endpoints: Array.from(new Set(apiMetrics.map(m => m.endpoint)))
    } : null;
    
    // Token usage summary
    const tokenMetrics = filteredMetrics.filter(m => m.category === 'tokens') as TokenUsageMetric[];
    const tokenSummary = tokenMetrics.length > 0 ? {
      count: tokenMetrics.length,
      totalTokens: tokenMetrics.reduce((sum, m) => sum + m.totalTokens, 0),
      totalPromptTokens: tokenMetrics.reduce((sum, m) => sum + m.promptTokens, 0),
      totalCompletionTokens: tokenMetrics.reduce((sum, m) => sum + m.completionTokens, 0),
      estimatedCost: tokenMetrics.reduce((sum, m) => sum + (m.cost || 0), 0),
      models: Array.from(new Set(tokenMetrics.map(m => m.model)))
    } : null;
    
    // Pipeline stage summary
    const pipelineMetrics = filteredMetrics.filter(m => m.category === 'pipeline') as PipelineMetric[];
    const pipelineSummary = pipelineMetrics.length > 0 ? {
      count: pipelineMetrics.length,
      avgDuration: pipelineMetrics.reduce((sum, m) => sum + m.duration, 0) / pipelineMetrics.length,
      successRate: pipelineMetrics.filter(m => m.success).length / pipelineMetrics.length * 100,
      stageBreakdown: Object.fromEntries(
        Array.from(new Set(pipelineMetrics.map(m => m.stageId))).map(stageId => {
          const stageMetrics = pipelineMetrics.filter(m => m.stageId === stageId);
          return [stageId, {
            count: stageMetrics.length,
            avgDuration: stageMetrics.reduce((sum, m) => sum + m.duration, 0) / stageMetrics.length,
            successRate: stageMetrics.filter(m => m.success).length / stageMetrics.length * 100
          }];
        })
      )
    } : null;
    
    // Memory usage summary
    const memoryMetrics = filteredMetrics.filter(m => m.category === 'memory') as MemoryMetric[];
    const memorySummary = memoryMetrics.length > 0 ? {
      count: memoryMetrics.length,
      avgHeapUsed: memoryMetrics.reduce((sum, m) => sum + m.heapUsed, 0) / memoryMetrics.length,
      avgHeapTotal: memoryMetrics.reduce((sum, m) => sum + m.heapTotal, 0) / memoryMetrics.length,
      lastRecorded: memoryMetrics.length > 0 ? memoryMetrics.reduce((latest, m) => 
        latest && m.timestamp > latest.timestamp ? m : (latest || m)
      , memoryMetrics[0]) : null
    } : null;
    
    return {
      api: apiSummary,
      tokens: tokenSummary,
      pipeline: pipelineSummary,
      memory: memorySummary
    };
  }, [filteredMetrics]);
  
  // Effect to fetch metrics on mount and refresh interval
  useEffect(() => {
    // Function to fetch metrics
    const fetchMetrics = () => {
      const allMetrics = performanceMonitor.getMetrics();
      setMetrics(allMetrics);
    };
    
    // Fetch metrics immediately
    fetchMetrics();
    
    // Set up interval for auto-refresh
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(fetchMetrics, refreshInterval);
    }
    
    // Clean up interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval]);
  
  // Effect to add real-time metric consumer
  useEffect(() => {
    // Function to handle new metrics in real-time
    const handleNewMetric = (metric: PerformanceMetric) => {
      setMetrics(prevMetrics => [...prevMetrics, metric]);
    };
    
    // Add consumer for real-time updates
    performanceMonitor.addConsumer(handleNewMetric);
    
    // Clean up consumer on unmount
    return () => {
      performanceMonitor.removeConsumer(handleNewMetric);
    };
  }, []);
  
  // Handle toggling monitoring on/off
  const handleToggleMonitoring = () => {
    const newState = !isEnabled;
    performanceMonitor.setEnabled(newState);
    setIsEnabled(newState);
  };
  
  // Handle clearing metrics
  const handleClearMetrics = () => {
    performanceMonitor.clearMetrics();
    setMetrics([]);
  };
  
  // Format bytes to human-readable string
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };
  
  // Format duration to human-readable string
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
        
        {showControls && (
          <div className="flex space-x-4">
            <select
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm"
              value={timeRange.toString()}
              onChange={(e) => setTimeRange(Number(e.target.value))}
            >
              <option value={(5 * 60 * 1000).toString()}>Last 5 minutes</option>
              <option value={(15 * 60 * 1000).toString()}>Last 15 minutes</option>
              <option value={(30 * 60 * 1000).toString()}>Last 30 minutes</option>
              <option value={(60 * 60 * 1000).toString()}>Last hour</option>
              <option value={(24 * 60 * 60 * 1000).toString()}>Last 24 hours</option>
            </select>
            
            <button
              className={`px-3 py-1 text-sm rounded ${
                isEnabled 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
              onClick={handleToggleMonitoring}
            >
              {isEnabled ? 'Monitoring On' : 'Monitoring Off'}
            </button>
            
            <button
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 px-3 py-1 text-sm rounded"
              onClick={handleClearMetrics}
            >
              Clear Metrics
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* API Performance Card */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">API Performance</h3>
          
          {summaries.api ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total Requests:</span>
                <span className="font-medium">{summaries.api.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Avg Response Time:</span>
                <span className="font-medium">{formatDuration(summaries.api.avgResponseTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Success Rate:</span>
                <span className="font-medium">{summaries.api.successRate.toFixed(1)}%</span>
              </div>
              <div className="mt-2">
                <span className="text-gray-600 dark:text-gray-300 text-sm">Top Endpoints:</span>
                <div className="mt-1 text-sm">
                  {summaries.api.endpoints.slice(0, 3).map((endpoint, i) => (
                    <div key={i} className="truncate">{endpoint}</div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No API metrics available</p>
          )}
        </div>
        
        {/* Token Usage Card */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Token Usage</h3>
          
          {summaries.tokens ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total API Calls:</span>
                <span className="font-medium">{summaries.tokens.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total Tokens:</span>
                <span className="font-medium">{summaries.tokens.totalTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Prompt Tokens:</span>
                <span className="font-medium">{summaries.tokens.totalPromptTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Completion Tokens:</span>
                <span className="font-medium">{summaries.tokens.totalCompletionTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Estimated Cost:</span>
                <span className="font-medium">${summaries.tokens.estimatedCost.toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No token metrics available</p>
          )}
        </div>
        
        {/* Pipeline Performance Card */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Pipeline Performance</h3>
          
          {summaries.pipeline ? (
            <div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Pipelines:</span>
                  <span className="font-medium">{summaries.pipeline.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Avg Duration:</span>
                  <span className="font-medium">{formatDuration(summaries.pipeline.avgDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Success Rate:</span>
                  <span className="font-medium">{summaries.pipeline.successRate.toFixed(1)}%</span>
                </div>
              </div>
              
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Stage Breakdown</h4>
              <div className="space-y-2 text-sm">
                {Object.entries(summaries.pipeline.stageBreakdown).map(([stageId, stats]) => (
                  <div key={stageId} className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">{stageId}</span>
                    <span className="font-medium">{formatDuration(stats.avgDuration)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No pipeline metrics available</p>
          )}
        </div>
        
        {/* Memory Usage Card */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Memory Usage</h3>
          
          {summaries.memory ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Heap Used:</span>
                <span className="font-medium">{summaries.memory.lastRecorded ? formatBytes(summaries.memory.lastRecorded.heapUsed) : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Heap Total:</span>
                <span className="font-medium">{summaries.memory.lastRecorded ? formatBytes(summaries.memory.lastRecorded.heapTotal) : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Memory Usage:</span>
                <span className="font-medium">
                  {summaries.memory.lastRecorded ? 
                    ((summaries.memory.lastRecorded.heapUsed / summaries.memory.lastRecorded.heapTotal * 100) || 0).toFixed(1) + '%' 
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">RSS:</span>
                <span className="font-medium">{summaries.memory.lastRecorded ? formatBytes(summaries.memory.lastRecorded.rss || 0) : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Last Updated:</span>
                <span className="font-medium">
                  {summaries.memory.lastRecorded ? new Date(summaries.memory.lastRecorded.timestamp).toLocaleTimeString() : 'N/A'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">No memory metrics available</p>
          )}
        </div>
      </div>
      
      {/* Recent Metrics Table */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Recent Metrics</h3>
        
        {filteredMetrics.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Value</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredMetrics.slice(0, 10).map((metric) => (
                <tr key={metric.id} className="hover:bg-gray-100 dark:hover:bg-gray-600">
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300">
                    {metric.category}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300">
                    {metric.name}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300">
                    {metric.unit === 'ms' ? formatDuration(metric.value) :
                     metric.unit === 'bytes' ? formatBytes(metric.value) :
                     metric.value.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-300">
                    {metric.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">No metrics available for the selected filters</p>
        )}
        
        {filteredMetrics.length > 10 && (
          <div className="mt-4 text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing 10 of {filteredMetrics.length} metrics
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;