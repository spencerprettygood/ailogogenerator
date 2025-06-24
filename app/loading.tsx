/**
 * Default loading component for the entire app
 * Follows Next.js 15 loading UI conventions with Suspense
 */
export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        <div className="text-xl font-medium text-primary">Loading your experience...</div>
      </div>
    </div>
  );
}