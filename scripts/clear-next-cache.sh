#!/bin/bash

# Clear Next.js caches and reinstall dependencies to fix webpack issues
echo "🧹 Cleaning Next.js caches and temporary files..."
rm -rf .next
rm -rf node_modules/.cache

echo "📋 Verifying proper export in logo-generator-app.tsx..."
grep -q "export default function LogoGeneratorApp" components/logo-generator/logo-generator-app.tsx
if [ $? -ne 0 ]; then
  echo "⚠️  Warning: LogoGeneratorApp is not exported as default in components/logo-generator/logo-generator-app.tsx"
  echo "   Please make sure the component uses 'export default function LogoGeneratorApp()'"
else
  echo "✅ LogoGeneratorApp is properly exported as default"
fi

echo "📋 Verifying proper import in logo-generator-wrapper.tsx..."
grep -q "import LogoGeneratorApp from" components/logo-generator-wrapper.tsx
if [ $? -ne 0 ]; then
  echo "⚠️  Warning: LogoGeneratorApp is not imported correctly in components/logo-generator-wrapper.tsx"
  echo "   Please make sure it uses 'import LogoGeneratorApp from '@/components/logo-generator/logo-generator-app''"
else
  echo "✅ LogoGeneratorApp is properly imported in wrapper"
fi

echo "📂 Verifying server component boundaries..."
# Check if layout.tsx has any client directives
grep -q "'use client'" app/layout.tsx
if [ $? -eq 0 ]; then
  echo "⚠️  Warning: app/layout.tsx should be a server component and should not have 'use client' directive"
else
  echo "✅ app/layout.tsx is correctly set up as a server component"
fi

echo "🔄 Starting the application with clean cache..."
echo "   Run: npm run dev"