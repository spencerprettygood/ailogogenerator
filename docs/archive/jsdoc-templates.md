# JSDoc Documentation Templates

This document provides standardized templates for JSDoc documentation in the AI Logo Generator project. These templates should be used consistently across the codebase to maintain clear and useful documentation.

## Table of Contents

- [Function Documentation](#function-documentation)
- [Class Documentation](#class-documentation)
- [Interface Documentation](#interface-documentation)
- [Type Documentation](#type-documentation)
- [Component Documentation](#component-documentation)
- [Hook Documentation](#hook-documentation)
- [Module Documentation](#module-documentation)
- [API Route Documentation](#api-route-documentation)

## Function Documentation

```typescript
/**
 * Brief description of what the function does.
 * 
 * @param {Type} paramName - Description of the parameter
 * @param {Type} [optionalParam] - Description of the optional parameter
 * @returns {ReturnType} Description of the return value
 * @throws {ErrorType} Description of when this error is thrown
 * 
 * @example
 * ```typescript
 * const result = myFunction('input', 123);
 * // result: expected output
 * ```
 */
function myFunction(paramName: Type, optionalParam?: Type): ReturnType {
  // Implementation
}
```

## Class Documentation

```typescript
/**
 * Brief description of the class and its purpose.
 * 
 * Detailed description that explains more about what this class does,
 * when to use it, and any important implementation details.
 * 
 * @example
 * ```typescript
 * const instance = new MyClass('constructor param');
 * instance.method();
 * ```
 */
class MyClass {
  /**
   * Brief description of the property.
   */
  propertyName: Type;
  
  /**
   * Brief description of what the constructor does.
   * 
   * @param {Type} paramName - Description of the parameter
   */
  constructor(paramName: Type) {
    // Implementation
  }
  
  /**
   * Brief description of what the method does.
   * 
   * @param {Type} paramName - Description of the parameter
   * @returns {ReturnType} Description of the return value
   */
  method(paramName: Type): ReturnType {
    // Implementation
  }
}
```

## Interface Documentation

```typescript
/**
 * Brief description of what this interface represents.
 * 
 * Detailed description that explains more about the interface,
 * its purpose, and how it should be used.
 */
interface InterfaceName {
  /**
   * Brief description of the property.
   */
  propertyName: Type;
  
  /**
   * Brief description of the optional property.
   */
  optionalProperty?: Type;
  
  /**
   * Brief description of what the method does.
   * 
   * @param {Type} paramName - Description of the parameter
   * @returns {ReturnType} Description of the return value
   */
  methodName(paramName: Type): ReturnType;
}
```

## Type Documentation

```typescript
/**
 * Brief description of what this type represents.
 * 
 * @example
 * ```typescript
 * const value: MyType = {
 *   property: 'value'
 * };
 * ```
 */
type MyType = {
  /**
   * Brief description of the property.
   */
  property: string;
  
  /**
   * Brief description of the optional property.
   */
  optionalProperty?: number;
};

/**
 * Brief description of what this union type represents.
 */
type UnionType = TypeA | TypeB;

/**
 * Brief description of what this enum represents.
 */
enum MyEnum {
  /**
   * Description of this enum value.
   */
  VALUE_A = 'a',
  
  /**
   * Description of this enum value.
   */
  VALUE_B = 'b'
}
```

## Component Documentation

```typescript
/**
 * Component that displays a specific UI element.
 * 
 * Detailed description of what this component does, when to use it,
 * and any important considerations or limitations.
 * 
 * @example
 * ```tsx
 * <MyComponent
 *   prop1="value"
 *   prop2={123}
 * />
 * ```
 */
interface MyComponentProps {
  /**
   * Brief description of the prop.
   */
  prop1: string;
  
  /**
   * Brief description of the optional prop.
   * @default 0
   */
  prop2?: number;
  
  /**
   * Brief description of the callback prop.
   */
  onSomething?: (value: string) => void;
}

/**
 * Component that displays a specific UI element.
 */
export function MyComponent({ prop1, prop2 = 0, onSomething }: MyComponentProps) {
  // Implementation
}
```

## Hook Documentation

```typescript
/**
 * Custom hook that provides specific functionality.
 * 
 * Detailed description of what this hook does, when to use it,
 * what state it manages, and any important considerations.
 * 
 * @param {Type} param - Description of the parameter
 * @returns {ReturnType} Object containing the hook's values and functions
 * 
 * @example
 * ```tsx
 * const { value, setValue } = useMyHook('initial');
 * ```
 */
function useMyHook(param: Type): ReturnType {
  // Implementation
}
```

## Module Documentation

Add this at the top of a file to document the entire module:

```typescript
/**
 * @fileoverview Brief description of the module.
 * 
 * Detailed description of what this module contains,
 * its purpose, and how it should be used.
 * 
 * @module ModuleName
 */
```

## API Route Documentation

```typescript
/**
 * API route handler for specific functionality.
 * 
 * Detailed description of what this API route does, what
 * parameters it accepts, and what responses it returns.
 * 
 * @route POST /api/route-path
 * @param {NextRequest} req - The request object
 * @returns {Promise<Response>} The response object
 * 
 * @example
 * Request:
 * ```json
 * {
 *   "param1": "value",
 *   "param2": 123
 * }
 * ```
 * 
 * Success Response:
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "key": "value"
 *   }
 * }
 * ```
 * 
 * Error Response:
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Error message",
 *     "code": "ERROR_CODE"
 *   }
 * }
 * ```
 */
export async function POST(req: NextRequest): Promise<Response> {
  // Implementation
}
```