// @ts-check
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importsPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat();

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // Include globals for browser and node environments
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'dist/**'],
  },

  // Base rules for all files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
      globals: {
        React: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      import: importsPlugin,
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@next/next': nextPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {},
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/ban-ts-comment': 'warn',

      // React rules
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/jsx-no-useless-fragment': 'warn',
      'react/jsx-fragments': ['warn', 'syntax'],

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Import rules
      'import/no-unresolved': 'off', // TypeScript handles this
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // Next.js rules
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'warn',
      '@next/next/no-unwanted-polyfillio': 'warn',
      '@next/next/no-css-tags': 'error',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-document-import-in-page': 'error',
      '@next/next/no-head-import-in-document': 'error',
      '@next/next/no-script-component-in-head': 'error',
      '@next/next/no-title-in-document-head': 'error',

      // Accessibility rules
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-role': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',

      // General best practices
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'prefer-const': 'warn',
      'no-var': 'error',
      eqeqeq: ['error', 'smart'],
      'no-unused-expressions': 'warn',
    },
  },

  // Specific rules for Next.js app router files
  {
    files: ['app/**/*.ts', 'app/**/*.tsx'],
    rules: {
      // Enforce proper server/client component patterns
      '@next/next/no-document-import-in-page': 'error',
      '@next/next/no-head-import-in-document': 'error',
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/google-font-display': 'warn',
      '@next/next/google-font-preconnect': 'warn',
      '@next/next/inline-script-id': 'warn',
    },
  },

  // Specific rules for pages
  {
    files: ['app/**/page.tsx'],
    rules: {
      // Enforce proper page structure
      'import/no-default-export': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  // Special rules for layout files
  {
    files: ['app/**/layout.tsx'],
    rules: {
      // Layout specific rules
      'import/no-default-export': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },

  // Rules for API routes
  {
    files: ['app/api/**/*.ts', 'app/api/**/*.tsx'],
    rules: {
      // API routes should not have client-side code
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['next/router', 'next/navigation'],
              message: 'Do not use client-side navigation in API routes',
            },
          ],
        },
      ],
    },
  },

  // Rules specifically for client components
  {
    files: ['**/*.tsx', '**/*.ts'],
    processor: '@next/next/typescript',
    rules: {
      '@next/next/no-client-hooks-in-server-components': 'error',
    },
  },

  // Extra rules from configurations
  ...compat.extends('plugin:@next/next/recommended'),
];
