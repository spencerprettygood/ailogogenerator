// Utility functions for converting between camelCase and snake_case objects

type AnyObject = Record<string, unknown>;

export function camelToSnake<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake) as T;
  } else if (obj && typeof obj === 'object' && !Buffer.isBuffer(obj)) {
    return Object.fromEntries(
      Object.entries(obj as AnyObject).map(([k, v]) => [
        k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`),
        camelToSnake(v),
      ])
    ) as T;
  }
  return obj;
}

export function snakeToCamel<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel) as T;
  } else if (obj && typeof obj === 'object' && !Buffer.isBuffer(obj)) {
    return Object.fromEntries(
      Object.entries(obj as AnyObject).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
        snakeToCamel(v),
      ])
    ) as T;
  }
  return obj;
}
