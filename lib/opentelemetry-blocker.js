/**
 * OpenTelemetry Blocker Module
 * 
 * This module creates mock implementations of OpenTelemetry packages
 * and prevents them from being loaded in the application.
 * 
 * It is used to replace real OpenTelemetry packages with no-op implementations
 * to avoid issues with Node.js-specific modules in browser environments.
 */

// Create a no-op implementation of the OpenTelemetry API
const noopTracer = {
  startSpan: () => noopSpan,
  startActiveSpan: (name, options, fn) => {
    if (typeof options === 'function') {
      fn = options;
      options = undefined;
    }
    return fn(noopSpan);
  },
};

const noopSpan = {
  setAttribute: () => {},
  setAttributes: () => {},
  addEvent: () => {},
  setStatus: () => {},
  updateName: () => {},
  end: () => {},
  isRecording: () => false,
  recordException: () => {},
};

const noopTracerProvider = {
  getTracer: () => noopTracer,
};

// Create a complete mock API object
const opentelemetryApi = {
  trace: {
    getTracer: () => noopTracer,
    getTracerProvider: () => noopTracerProvider,
    setTracerProvider: () => {},
    setGlobalTracerProvider: () => noopTracerProvider,
    SpanKind: {
      INTERNAL: 0,
      SERVER: 1,
      CLIENT: 2,
      PRODUCER: 3,
      CONSUMER: 4,
    },
    SpanStatusCode: {
      UNSET: 0,
      OK: 1,
      ERROR: 2,
    },
  },
  context: {
    active: () => ({}),
    bind: (context, target) => target,
    with: (context, fn) => fn(),
    createContextKey: (description) => Symbol(description || 'context-key'),
  },
  propagation: {
    setText: () => {},
    getText: () => null,
    inject: () => {},
    extract: () => ({}),
  },
  createContextKey: (description) => Symbol(description || 'context-key'),
  _DiagAPI: function() {},
  diag: {
    createComponentLogger: () => ({}),
    verbose: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  },
};

// Export both default and named exports to cover all usage patterns
module.exports = opentelemetryApi;
module.exports.default = opentelemetryApi;
module.exports.trace = opentelemetryApi.trace;
module.exports.context = opentelemetryApi.context;
module.exports.propagation = opentelemetryApi.propagation;
module.exports.createContextKey = opentelemetryApi.createContextKey;
module.exports._DiagAPI = opentelemetryApi._DiagAPI;
module.exports.diag = opentelemetryApi.diag;