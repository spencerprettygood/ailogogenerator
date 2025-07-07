/**
 * TypeScript utility functions for type checking and validation
 * These functions provide runtime type checking for better error handling
 */

/**
 * Type guard to check if a value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is a valid Date object
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard to check if a value is an array
 */
export function isArray<T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] {
  if (!Array.isArray(value)) return false;
  if (!itemGuard) return true;
  return value.every(item => itemGuard(item));
}

/**
 * Type guard to check if a value has a specific property
 */
export function hasProperty<K extends string>(
  value: unknown,
  prop: K
): value is { [key in K]: unknown } {
  return isObject(value) && prop in value;
}

/**
 * Type guard to check if a value has a string property
 */
export function hasStringProperty<K extends string>(
  value: unknown,
  prop: K
): value is { [key in K]: string } {
  return isObject(value) && prop in value && typeof value[prop] === 'string';
}

/**
 * Type guard to check if a value is a Record with string keys and values of type T
 */
export function isRecordOfType<T>(
  value: unknown,
  valueGuard: (val: unknown) => val is T
): value is Record<string, T> {
  if (!isObject(value)) return false;
  return Object.values(value).every(val => valueGuard(val));
}

/**
 * Type guard for Message objects
 */
export function isMessage(value: unknown): boolean {
  return (
    isObject(value) &&
    hasStringProperty(value, 'id') &&
    hasProperty(value, 'role') &&
    hasProperty(value, 'content') &&
    hasProperty(value, 'timestamp')
  );
}

/**
 * Type guard to check if a value is a valid stage ID (single letter stages A-H)
 */
export function isStageId(value: unknown): boolean {
  return typeof value === 'string' && /^[A-H]$/.test(value);
}

/**
 * Type guard to check if a value is a valid stage item for progress tracking
 */
export function isStageItem(value: unknown): boolean {
  if (!isObject(value)) return false;

  // Check for required properties
  if (!hasStringProperty(value, 'id')) return false;

  // Check status property if present
  if ('status' in value) {
    const status = value.status;
    if (typeof status !== 'string') return false;
    const validStatuses = ['pending', 'in-progress', 'in_progress', 'completed', 'error'];
    if (!validStatuses.includes(status as string)) return false;
  }

  // Check progress property if present
  if ('progress' in value && !isNumber(value.progress)) return false;

  return true;
}

/**
 * Helper function to normalize stage status values
 */
export function normalizeStageStatus(
  status: unknown
): 'pending' | 'in-progress' | 'completed' | 'error' {
  if (typeof status !== 'string') return 'pending';

  if (status === 'in_progress') return 'in-progress';

  if (['pending', 'in-progress', 'completed', 'error'].includes(status)) {
    return status as 'pending' | 'in-progress' | 'completed' | 'error';
  }

  return 'pending';
}

/**
 * Helper function to safely stringify any value
 */
export function safeStringify(value: unknown): string {
  if (typeof value === 'string') return value;

  if (value === null || value === undefined) return '';

  if (isObject(value) || Array.isArray(value)) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[Object cannot be displayed]';
    }
  }

  return String(value);
}

/**
 * Type assertion function - throws if condition is false
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Type assertion with type guard - throws if type guard fails
 */
export function assertType<T>(
  value: unknown,
  guard: (val: unknown) => val is T,
  message: string
): asserts value is T {
  if (!guard(value)) {
    throw new Error(message);
  }
}
