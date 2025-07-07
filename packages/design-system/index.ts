/**
 * @file index.ts
 * @description Design system package entry point
 *
 * This file exports all components, tokens, and utilities from the design system.
 */

// Export all tokens
export * from './tokens';

// Export configuration
export { default as tailwindConfig } from './tailwind.config';

// Export package version
export const version = '0.1.0';
