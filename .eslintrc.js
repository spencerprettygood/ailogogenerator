module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    // Disable no-unused-vars and use TypeScript's version instead
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],

    // Allows for gradual adoption of no-explicit-any
    '@typescript-eslint/no-explicit-any': 'warn',

    // Allow require in non-TypeScript files
    '@typescript-eslint/no-require-imports': [
      'error',
      {
        allow: ['*.js'],
      },
    ],

    // Ensure proper ts-comment usage
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'never',
        'ts-nocheck': 'never',
        'ts-check': 'allow',
        minimumDescriptionLength: 3,
      },
    ],

    // Enforce hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // Nextjs specific rules
    '@next/next/no-html-link-for-pages': 'error',
    '@next/next/no-img-element': 'warn',

    // Other common rules
    'react/prop-types': 'off', // Not needed with TypeScript
    'react/react-in-jsx-scope': 'off', // Not needed with Next.js
    'react/display-name': 'off', // Can cause issues with HOCs
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      // Enable specific rules only for TypeScript files
      files: ['*.ts', '*.tsx'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'warn',
      },
    },
    {
      // Disable TypeScript rules in JavaScript files
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'public/',
    '*.d.ts',
    'app-backup/',
    'app-consolidated/',
  ],
};
