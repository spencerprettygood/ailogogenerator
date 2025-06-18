import React from 'react';
import { TestVariant } from '../types';

interface AbVariantDebuggerProps {
  testId: string;
  componentId: string;
  variant: TestVariant;
  sessionId: string | null;
  metrics?: Record<string, any>;
  events?: Array<{
    type: string;
    timestamp: string;
    data?: any;
  }>;
  className?: string;
}

/**
 * Debug component to display A/B test information (development only)
 */
export const AbVariantDebugger: React.FC<AbVariantDebuggerProps> = ({
  testId,
  componentId,
  variant,
  sessionId,
  metrics,
  events,
  className = ''
}) => {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-64 bg-gray-800 text-white p-3 rounded-lg text-xs opacity-80 hover:opacity-100 transition-opacity ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">A/B Test Debug</h3>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
          variant === TestVariant.A ? 'bg-blue-500' : 
          variant === TestVariant.B ? 'bg-green-500' : 
          variant === TestVariant.C ? 'bg-purple-500' : 'bg-yellow-500'
        }`}>
          Variant {variant}
        </span>
      </div>
      
      <div className="space-y-1 mb-2">
        <p className="truncate"><span className="font-semibold">Test:</span> {testId}</p>
        <p className="truncate"><span className="font-semibold">Component:</span> {componentId}</p>
        <p className="truncate"><span className="font-semibold">Session:</span> {sessionId || 'Not assigned'}</p>
      </div>
      
      {metrics && Object.keys(metrics).length > 0 && (
        <div className="mb-2">
          <h4 className="font-semibold border-b border-gray-600 pb-1 mb-1">Metrics</h4>
          <div className="space-y-1">
            {Object.entries(metrics).map(([key, value]) => (
              <p key={key} className="flex justify-between">
                <span>{key}:</span>
                <span className="font-mono">{typeof value === 'number' ? value.toFixed(2) : String(value)}</span>
              </p>
            ))}
          </div>
        </div>
      )}
      
      {events && events.length > 0 && (
        <div>
          <h4 className="font-semibold border-b border-gray-600 pb-1 mb-1">Recent Events</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {events.slice(-5).map((event, idx) => (
              <div key={idx} className="text-xs border-l-2 border-gray-600 pl-2">
                <p className="font-semibold">{event.type}</p>
                <p className="text-gray-400 text-[10px]">{new Date(event.timestamp).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AbVariantDebugger;