# Next.js 15 Error Handling Guide

This document outlines the standardized approach to error handling in our Next.js 15 application.

## Error Handling Hierarchy

Next.js 15 provides a comprehensive error handling system with multiple layers of protection:

1. **Root Level**: `app/global-error.tsx`
   - Catches errors in the root layout
   - Only used as a last resort
   - Completely replaces the root layout when an error occurs

2. **Route Level**: `app/error.tsx`
   - Catches errors in route segments
   - Preserves the root layout
   - Used for route-specific errors

3. **Component Level**: `ErrorBoundary` component
   - Class-based React error boundary
   - Used for specific components that might error
   - More granular control over error handling

## When to Use Each Approach

### 1. Route Error Handlers (error.tsx)

Use route error handlers for:
- Errors in data fetching at the route level
- Errors in route layouts or templates
- Route-specific error states

```tsx
// app/dashboard/error.tsx
'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Dashboard Error: {error.message}</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### 2. Component Error Boundaries

Use component error boundaries for:
- High-risk components that might error
- Third-party components you don't control
- Components with complex state management

```tsx
import { ErrorBoundary } from '@/components/logo-generator/error-boundary'

<ErrorBoundary fallback={<p>Chart failed to load</p>}>
  <ComplexChart data={data} />
</ErrorBoundary>
```

### 3. Global Error Handler

Only used when the root layout crashes. This should be rare and usually indicates a critical application error.

## Best Practices

1. **Always Provide Reset Mechanisms**
   - Give users a way to recover from errors
   - Use the `reset()` function provided by Next.js

2. **Log Errors Appropriately**
   - Use `useEffect` to log errors on the client
   - Consider sending errors to a monitoring service

3. **Graceful Degradation**
   - Show useful information when errors occur
   - Maintain core functionality when possible

4. **Error Reporting**
   - Provide mechanisms for users to report errors
   - Collect context information to help debugging

## Implementation Guidelines

### Route Error Components

1. Place `error.tsx` files in appropriate route segments
2. Always include the `'use client'` directive
3. Accept `error` and `reset` props
4. Log errors and provide reset mechanisms

### Component Error Boundaries

Use our standardized `ErrorBoundary` component:

```tsx
import { ErrorBoundary } from '@/components/logo-generator/error-boundary'

<ErrorBoundary
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => logError(error, errorInfo)}
  resetOnUpdate={true}
>
  {children}
</ErrorBoundary>
```

## Error Handling with Server Actions

For server actions, use try/catch patterns:

```tsx
async function submitForm(formData: FormData) {
  try {
    const result = await saveData(formData)
    return { success: true, data: result }
  } catch (error) {
    // Log error server-side
    console.error('Form submission error:', error)
    
    // Return structured error
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
```

## Debugging Production Errors

1. Use the error digest to identify errors
2. Check server logs for additional context
3. Enable detailed error information temporarily with the environment variable `NEXT_PUBLIC_SHOW_ERROR_DETAILS=true`

---

By following these guidelines, we maintain a consistent error handling approach across the application, improving user experience and developer debugging capabilities.