#!/bin/bash

# Next.js Compliance Audit Script
# This script checks the codebase for compliance with Next.js 15 best practices

# Color configuration
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Next.js 15 Compliance Audit ===${NC}"
echo "Checking for common issues and non-standard patterns..."
echo ""

# Track issues
ISSUES_FOUND=0
WARNINGS_FOUND=0

# Directory to scan
PROJECT_DIR="/Users/spencerpro/ailogogenerator"

# Create a report file
REPORT_FILE="${PROJECT_DIR}/nextjs-audit-report.md"
echo "# Next.js 15 Compliance Audit Report" > "$REPORT_FILE"
echo "Generated on $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Issues Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Function to add an issue to the report
add_issue() {
  local severity="$1"
  local file="$2"
  local description="$3"
  local solution="$4"
  
  if [ "$severity" == "ERROR" ]; then
    echo -e "${RED}ERROR:${NC} $description in $file"
    echo "### ❌ ERROR: $file" >> "$REPORT_FILE"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
  else
    echo -e "${YELLOW}WARNING:${NC} $description in $file"
    echo "### ⚠️ WARNING: $file" >> "$REPORT_FILE"
    WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
  fi
  
  echo "" >> "$REPORT_FILE"
  echo "$description" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "**Solution:**" >> "$REPORT_FILE"
  echo "$solution" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
}

echo -e "${BLUE}Checking Next.js configuration...${NC}"

# 1. Check for correct next.config.js format
if [ -f "${PROJECT_DIR}/next.config.js" ]; then
  # Check for module.exports
  if ! grep -q "module.exports" "${PROJECT_DIR}/next.config.js"; then
    add_issue "ERROR" "next.config.js" "Invalid next.config.js format - missing module.exports" "Use proper CommonJS export syntax: module.exports = nextConfig;"
  fi
  
  # Check for type annotations
  if ! grep -q "@type {import('next').NextConfig}" "${PROJECT_DIR}/next.config.js"; then
    add_issue "WARNING" "next.config.js" "Missing TypeScript type annotation for NextConfig" "Add proper type annotation: /** @type {import('next').NextConfig} */"
  fi
else
  # Check for ESM version
  if [ -f "${PROJECT_DIR}/next.config.mjs" ]; then
    echo -e "${GREEN}Using next.config.mjs (ESM format)${NC}"
    
    # Check for export default
    if ! grep -q "export default" "${PROJECT_DIR}/next.config.mjs"; then
      add_issue "ERROR" "next.config.mjs" "Invalid next.config.mjs format - missing export default" "Use proper ESM export syntax: export default nextConfig;"
    fi
  else
    add_issue "ERROR" "next.config.js/mjs" "Missing Next.js configuration file" "Create a proper next.config.js or next.config.mjs file following the documentation"
  fi
fi

echo -e "${BLUE}Checking app directory structure...${NC}"

# 2. Check for proper app directory structure
if [ ! -d "${PROJECT_DIR}/app" ]; then
  add_issue "ERROR" "app directory" "Missing app directory for App Router" "Create an app directory at the root level with proper page.tsx and layout.tsx files"
fi

# 3. Check for layout.tsx in app directory
if [ ! -f "${PROJECT_DIR}/app/layout.tsx" ]; then
  add_issue "ERROR" "app/layout.tsx" "Missing root layout.tsx" "Create a root layout.tsx file in the app directory"
else
  # Check if layout.tsx has 'use client' directive (it shouldn't)
  if grep -q "'use client'" "${PROJECT_DIR}/app/layout.tsx"; then
    add_issue "ERROR" "app/layout.tsx" "Root layout should be a server component (remove 'use client' directive)" "Remove the 'use client' directive from app/layout.tsx - it should be a server component"
  fi
  
  # Check if layout.tsx exports metadata
  if ! grep -q "export const metadata" "${PROJECT_DIR}/app/layout.tsx"; then
    add_issue "WARNING" "app/layout.tsx" "Missing metadata export in root layout" "Add metadata export to app/layout.tsx: export const metadata: Metadata = { title: '...', description: '...' };"
  fi
  
  # Check if layout.tsx exports viewport (recommended in Next.js 15)
  if ! grep -q "export const viewport" "${PROJECT_DIR}/app/layout.tsx"; then
    add_issue "WARNING" "app/layout.tsx" "Missing viewport export in root layout" "Add viewport export to app/layout.tsx: export const viewport: Viewport = { width: 'device-width', initialScale: 1 };"
  fi
fi

echo -e "${BLUE}Checking for client/server component boundaries...${NC}"

# 4. Check for proper 'use client' directives in components
CLIENT_COMPONENTS_MISSING_DIRECTIVE=0
COMPONENT_FILES=$(find "${PROJECT_DIR}/components" -type f -name "*.tsx" -not -path "*/node_modules/*")

for component in $COMPONENT_FILES; do
  # Skip checking UI components that might be intended as server components
  if [[ "$component" == *"/ui/"* ]]; then
    continue
  fi
  
  # Check for useState, useEffect, onClick etc. which indicate client components
  if grep -q "useState\|useEffect\|onClick\|onChange\|useRouter\|navigator\|window\|document" "$component"; then
    # Check for 'use client' with either single or double quotes
    if ! grep -q "^[\"']use client[\"']" "$component"; then
      add_issue "ERROR" "$component" "Component uses client-side features but is missing 'use client' directive" "Add 'use client' directive at the top of the file"
      CLIENT_COMPONENTS_MISSING_DIRECTIVE=$((CLIENT_COMPONENTS_MISSING_DIRECTIVE + 1))
      
      if [ $CLIENT_COMPONENTS_MISSING_DIRECTIVE -ge 5 ]; then
        echo -e "${YELLOW}Too many components missing 'use client' directive. Stopping this check.${NC}"
        break
      fi
    fi
  fi
done

echo -e "${BLUE}Checking API routes...${NC}"

# 5. Check API routes for proper Next.js 15 format
API_ROUTES=$(find "${PROJECT_DIR}/app/api" -type f -name "route.ts" -o -name "route.tsx" -not -path "*/node_modules/*")

for route in $API_ROUTES; do
  # Check for correct handlers (GET, POST, etc.)
  if ! grep -q "export async function GET\|export async function POST\|export const GET\|export const POST\|export const runtime" "$route"; then
    add_issue "WARNING" "$route" "API route may not be using correct Next.js 15 handler format" "Use export async function GET/POST/etc. or export const GET/POST/etc. = async function..."
  fi
  
  # Check for use of NextRequest/NextResponse
  if ! grep -q "NextRequest\|NextResponse" "$route"; then
    add_issue "WARNING" "$route" "API route may not be using NextRequest/NextResponse types" "Import and use { NextRequest, NextResponse } from 'next/server'"
  fi
done

echo -e "${BLUE}Checking for middleware implementation...${NC}"

# 6. Check middleware.ts for proper format
if [ -f "${PROJECT_DIR}/middleware.ts" ]; then
  # Check for export function middleware
  if ! grep -q "export function middleware" "${PROJECT_DIR}/middleware.ts"; then
    add_issue "ERROR" "middleware.ts" "Invalid middleware.ts format - missing export function middleware" "Use proper middleware export: export function middleware(request: NextRequest) {...}"
  fi
  
  # Check for matcher config
  if ! grep -q "export const config" "${PROJECT_DIR}/middleware.ts"; then
    add_issue "WARNING" "middleware.ts" "Missing matcher configuration in middleware.ts" "Add matcher config: export const config = { matcher: [...] }"
  fi
fi

echo -e "${BLUE}Checking for deprecated features and patterns...${NC}"

# 7. Check for deprecated imports and APIs
DEPRECATED_IMPORTS=("next/router" "getInitialProps" "_app.tsx" "_document.tsx" "next/head")

for pattern in "${DEPRECATED_IMPORTS[@]}"; do
  results=$(grep -r "$pattern" --include="*.tsx" --include="*.ts" "${PROJECT_DIR}" 2>/dev/null | grep -v "node_modules" | grep -v "README")
  
  if [ ! -z "$results" ]; then
    add_issue "WARNING" "Multiple files" "Using deprecated Next.js pattern: $pattern" "Update to App Router patterns, see Next.js migration guide"
    echo "**Found in:**" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "$results" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
  fi
done

echo -e "${BLUE}Checking tsconfig.json...${NC}"

# 8. Check tsconfig.json for proper configuration
if [ -f "${PROJECT_DIR}/tsconfig.json" ]; then
  # Check for moduleResolution
  if ! grep -q '"moduleResolution": "bundler"' "${PROJECT_DIR}/tsconfig.json"; then
    add_issue "WARNING" "tsconfig.json" "tsconfig.json should use moduleResolution: bundler for Next.js 15" "Update tsconfig.json to use \"moduleResolution\": \"bundler\""
  fi
  
  # Check for next plugin - use grep -A for context to find properly
  if ! grep -A 5 '"plugins"' "${PROJECT_DIR}/tsconfig.json" | grep -q '"name": "next"'; then
    add_issue "WARNING" "tsconfig.json" "tsconfig.json missing Next.js plugin" "Add Next.js plugin to tsconfig.json: \"plugins\": [{ \"name\": \"next\" }]"
  fi
  
  # Check for @/* path
  if ! grep -q '"@/\*": \["\./\*"\]' "${PROJECT_DIR}/tsconfig.json"; then
    add_issue "WARNING" "tsconfig.json" "tsconfig.json missing @/* path alias" "Add path alias to tsconfig.json: \"paths\": { \"@/*\": [\"./*\"] }"
  fi
fi

# 9. Check for multiple instances of theme provider
THEME_PROVIDER_COUNT=$(grep -r "ThemeProvider" --include="*.tsx" "${PROJECT_DIR}" | wc -l)

if [ $THEME_PROVIDER_COUNT -gt 5 ]; then
  add_issue "WARNING" "Multiple files" "Multiple ThemeProvider implementations found" "Consider consolidating to a single ThemeProvider implementation"
fi

# Summary
echo ""
echo -e "${BLUE}=== Audit Summary ===${NC}"
echo -e "${RED}Issues found: $ISSUES_FOUND${NC}"
echo -e "${YELLOW}Warnings found: $WARNINGS_FOUND${NC}"

if [ $ISSUES_FOUND -eq 0 ] && [ $WARNINGS_FOUND -eq 0 ]; then
  echo -e "${GREEN}No issues found! Your project follows Next.js 15 conventions.${NC}"
  echo "## ✅ No issues found!" >> "$REPORT_FILE"
  echo "Your project follows Next.js 15 conventions." >> "$REPORT_FILE"
else
  echo -e "See detailed report in ${BLUE}nextjs-audit-report.md${NC}"
  
  # Add summary to report
  echo "## Summary" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "- 🔴 **Issues found:** $ISSUES_FOUND" >> "$REPORT_FILE"
  echo "- 🟡 **Warnings found:** $WARNINGS_FOUND" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  # Add recommended tools
  echo "## Recommended Tools" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "To automatically fix many of these issues, consider using:" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "1. **@next/eslint-plugin-next** - Official ESLint plugin for Next.js" >> "$REPORT_FILE"
  echo "   \`\`\`" >> "$REPORT_FILE"
  echo "   npm install --save-dev @next/eslint-plugin-next" >> "$REPORT_FILE"
  echo "   \`\`\`" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "2. **@vercel/style-guide** - Official Vercel style guide with Next.js rules" >> "$REPORT_FILE"
  echo "   \`\`\`" >> "$REPORT_FILE"
  echo "   npm install --save-dev @vercel/style-guide" >> "$REPORT_FILE"
  echo "   \`\`\`" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "3. **next-transpile-modules** - For handling external modules in Next.js" >> "$REPORT_FILE"
  echo "   \`\`\`" >> "$REPORT_FILE"
  echo "   npm install --save-dev next-transpile-modules" >> "$REPORT_FILE"
  echo "   \`\`\`" >> "$REPORT_FILE"
fi

echo ""
echo -e "${GREEN}Audit complete! Report saved to nextjs-audit-report.md${NC}"