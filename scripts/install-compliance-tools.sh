#!/bin/bash

# Script to install and set up Next.js 15 compliance tools

# Color configuration
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Installing Next.js 15 Compliance Tools ===${NC}"

# Directory to work in
PROJECT_DIR="/Users/spencerpro/ailogogenerator"
cd "$PROJECT_DIR"

echo -e "${BLUE}Installing ESLint plugins and dependencies...${NC}"

# Install all dependencies from package.nextjs-compliance.json
npm run install-compliance-tools

echo -e "${BLUE}Setting up Husky pre-commit hooks...${NC}"

# Set up Husky
npx husky install

# Create pre-commit hook
cat > .husky/pre-commit << 'EOL'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged to lint and format changed files
npx lint-staged
EOL

chmod +x .husky/pre-commit

echo -e "${BLUE}Setting up TypeScript project references...${NC}"

# Create tsconfig.eslint.json for better ESLint/TypeScript integration
cat > tsconfig.eslint.json << 'EOL'
{
  "extends": "./tsconfig.json",
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx",
    "**/*.mjs",
    "**/*.cjs",
    ".eslintrc.js",
    "next.config.js",
    "next.config.mjs"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out",
    "dist"
  ]
}
EOL

echo -e "${BLUE}Running Next.js compliance audit...${NC}"

# Run the compliance audit
./scripts/nextjs-compliance-audit.sh

echo -e "${BLUE}Setting up VS Code configuration...${NC}"

# Create VS Code settings for better developer experience
mkdir -p .vscode

cat > .vscode/settings.json << 'EOL'
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "javascript.preferences.importModuleSpecifier": "non-relative",
  "eslint.options": {
    "overrideConfigFile": "eslint.config.next.mjs"
  },
  "eslint.experimental.useFlatConfig": true
}
EOL

echo -e "${BLUE}Creating npm scripts...${NC}"

# Add npm scripts to package.json
npx json -I -f package.json -e '
  this.scripts = {
    ...this.scripts,
    "typecheck": "tsc --noEmit",
    "lint": "ESLINT_USE_FLAT_CONFIG=true eslint --config eslint.config.next.mjs . --ext .ts,.tsx",
    "lint:fix": "ESLINT_USE_FLAT_CONFIG=true eslint --config eslint.config.next.mjs . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,css,scss}\"",
    "nextjs-audit": "./scripts/nextjs-compliance-audit.sh",
    "fix-webpack": "./scripts/standard-webpack-fix.sh"
  };
  this["lint-staged"] = {
    "*.{js,jsx,ts,tsx}": [
      "ESLINT_USE_FLAT_CONFIG=true eslint --config eslint.config.next.mjs --fix",
      "prettier --write"
    ],
    "*.{json,md,css,scss}": [
      "prettier --write"
    ]
  };
'

echo -e "${GREEN}Setup complete!${NC}"
echo -e "You can now use the following npm scripts:"
echo -e "  ${BLUE}npm run lint${NC} - Run ESLint on all TypeScript files"
echo -e "  ${BLUE}npm run lint:fix${NC} - Run ESLint and fix issues automatically"
echo -e "  ${BLUE}npm run typecheck${NC} - Run TypeScript type checking"
echo -e "  ${BLUE}npm run nextjs-audit${NC} - Run Next.js compliance audit"
echo -e "  ${BLUE}npm run fix-webpack${NC} - Fix webpack configuration issues"
echo -e ""
echo -e "Pre-commit hooks are set up to run lint-staged automatically on commit."
echo -e "VS Code settings have been configured for optimal development experience."
echo -e ""
echo -e "For more information, see ${BLUE}NEXTJS_COMPLIANCE_TOOLS.md${NC}"