# Testing Guide for AI Logo Generator

This document outlines the testing strategy and provides guidance for writing and running tests for the AI Logo Generator project.

## Testing Strategy

The project uses a comprehensive testing approach with multiple levels:

1. **Unit Tests**: Test individual components, functions, and utilities in isolation
2. **Integration Tests**: Test the integration between components and services
3. **End-to-End Tests**: Test complete user flows

## Testing Tools

- **Vitest**: Fast and lightweight testing framework compatible with Jest APIs
- **Testing Library**: Utilities for testing React components
- **MSW (Mock Service Worker)**: Used for API mocking in tests
- **Vitest Coverage**: Coverage reporting using V8 coverage

## Running Tests

### Using NPM Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage reporting
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run CI test suite (tests + type check)
npm run test:ci
```

### Using the Test Runner Script

For more flexibility, use the test runner script:

```bash
# Make the script executable (if needed)
chmod +x ./test-runner.sh

# Show help
./test-runner.sh --help

# Run all tests
./test-runner.sh --all

# Run unit tests with coverage
./test-runner.sh --unit --coverage

# Run tests matching a pattern
./test-runner.sh --pattern cache
```

## Test Organization

Tests are organized according to the following structure:

- `lib/**/__tests__/*.test.ts` - Unit tests for library code
- `lib/**/*.test.ts` - Unit tests in the same directory as the code
- `app/api/**/*.test.ts` - API route tests
- `components/**/__tests__/*.test.tsx` - Component tests

## Writing Tests

### Unit Tests

Unit tests should focus on testing a single function or component in isolation.

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('myFunction', () => {
  it('should return the expected result', () => {
    const result = myFunction(input);
    expect(result).toBe(expectedOutput);
  });
  
  it('should handle edge cases', () => {
    const result = myFunction(edgeCaseInput);
    expect(result).toBe(edgeCaseOutput);
  });
});
```

### Component Tests

Component tests should focus on component behavior and user interaction.

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('should respond to user interaction', () => {
    render(<MyComponent />);
    fireEvent.click(screen.getByText('Click Me'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### API Route Tests

API route tests should verify the route's behavior with different inputs.

```typescript
import { NextRequest } from 'next/server';
import { POST } from './route';

describe('API Route', () => {
  it('should handle valid requests', async () => {
    const request = new NextRequest('https://example.com/api/my-route', {
      method: 'POST',
      body: JSON.stringify({ key: 'value' })
    });
    
    const response = await POST(request);
    const body = await response.json();
    
    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true });
  });
  
  it('should handle invalid requests', async () => {
    const request = new NextRequest('https://example.com/api/my-route', {
      method: 'POST',
      body: JSON.stringify({ /* invalid data */ })
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(400);
  });
});
```

## Mocking

### Function Mocks

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');

// Mock a module
vi.mock('./path/to/module', () => ({
  exportedFunction: vi.fn().mockReturnValue('mocked')
}));

// Spy on a method
const spy = vi.spyOn(object, 'method');
```

### Time Mocks

```typescript
// Mock Date.now
vi.spyOn(Date, 'now').mockImplementation(() => 1000);

// Mock timers
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.runAllTimers();
vi.restoreAllMocks();
```

### API Mocks

```typescript
// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'value' })
});
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it.
2. **Keep Tests Independent**: Each test should be able to run independently of others.
3. **Use Descriptive Test Names**: Test names should describe the behavior being tested.
4. **Mock External Dependencies**: Isolate your code from external services.
5. **Aim for High Coverage**: Strive for high test coverage, especially for critical paths.
6. **Test Edge Cases**: Include tests for edge cases and error conditions.
7. **Keep Tests Fast**: Tests should run quickly to encourage frequent running.

## Troubleshooting

### Common Issues

1. **Test Environment Issues**: Make sure the test environment is properly configured.
2. **Async Testing Issues**: Use `await` with async operations in tests.
3. **Mocking Issues**: Verify that mocks are correctly setup and restored after use.

### Debugging Tests

```bash
# Run a specific test with more verbose output
npx vitest --test-name="my test name" --reporter=verbose

# Debug a test
node --inspect-brk ./node_modules/.bin/vitest run my.test.ts
```

## Continuous Integration

Tests are automatically run as part of the CI pipeline on GitHub Actions. The pipeline is configured to:

1. Run the test suite (`npm run test:ci`)
2. Generate coverage reports
3. Fail the build if tests fail or coverage drops below thresholds

This ensures that all code meets the project's quality standards before being merged.