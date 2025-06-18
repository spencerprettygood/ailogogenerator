/**
 * @file index.ts
 * @description Design tokens entry point
 * 
 * This file exports all design tokens from a single entry point
 * for easy imports throughout the application.
 */

import * as colors from './colors';
import * as typography from './typography';
import * as spacing from './spacing';

// Re-export all tokens
export { colors, typography, spacing };

// Export everything under a 'tokens' namespace
const tokens = {
  colors,
  typography,
  spacing,
};

export default tokens;