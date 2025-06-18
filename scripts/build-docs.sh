#!/bin/bash

# Set default error handling
set -eo pipefail

echo "🔍 Building API documentation..."

# Create docs directory if it doesn't exist
mkdir -p docs

# Function to handle errors
handle_error() {
  echo "❌ Error occurred during documentation generation."
  echo "💡 Try running: npm install --save-dev typedoc@latest"
  exit 1
}

# Set up error trap
trap handle_error ERR

# Build HTML documentation
echo "📝 Generating HTML documentation..."
npm run docs || handle_error

# Check if the documentation was generated successfully
if [ -d "docs/api" ]; then
  echo "✅ Documentation built successfully!"
  echo "📚 Documentation available at: docs/api/index.html"
  echo "🌐 To serve the documentation locally, run: npm run docs:serve"
else
  echo "❌ Failed to build documentation."
  exit 1
fi

# Fix permissions
chmod -R 755 docs/api