/**
 * @file admin/performance/page.tsx
 * @module app/admin/performance
 * @description Admin performance monitoring page
 * 
 * This page displays the performance dashboard for administrators
 * to monitor system performance metrics in real-time.
 * 
 * @author AILogoGenerator Team
 * @version 1.0.0
 */

import React from 'react';
import PerformanceDashboard from '../../../components/admin/performance-dashboard';

/**
 * @page PerformanceMonitoringPage
 * @description Admin page for real-time performance monitoring
 * @returns {JSX.Element} The performance monitoring page
 */
export default function PerformanceMonitoringPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">System Performance Monitoring</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This dashboard provides real-time visibility into system performance metrics 
          including API response times, memory usage, token consumption, and pipeline processing times.
        </p>
        
        <p className="text-gray-600 dark:text-gray-300">
          Data is collected automatically as users interact with the system. You can filter by category
          and time range to focus on specific metrics.
        </p>
      </div>
      
      <PerformanceDashboard
        title="AI Logo Generator Performance"
        autoRefresh={true}
        refreshInterval={5000}
      />
    </main>
  );
}

/**
 * @metadata
 * @description Metadata for the performance monitoring page
 */
export const metadata = {
  title: 'Performance Monitoring | Admin Dashboard',
  description: 'Real-time system performance monitoring for AI Logo Generator'
};