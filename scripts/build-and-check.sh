#!/bin/bash
# Build the site and run checks

echo "🏗️  Building Temporal Tides World Bible..."

cd "$(dirname "$0")/.."

# Run build
echo "📦 Building VitePress site..."
npm run docs:build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  
  # Check build size
  echo ""
  echo "📊 Build size:"
  du -sh .vitepress/dist
  
  echo ""
  echo "💡 You can preview the built site with: npm run docs:preview"
else
  echo "❌ Build failed! Check errors above."
  exit 1
fi
