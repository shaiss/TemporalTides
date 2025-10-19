#!/bin/bash
# Sync WorldBible folder to docs folder when you make changes

echo "🔄 Syncing WorldBible to docs..."

cd "$(dirname "$0")/.."

# Sync WorldBible (preserving directory structure)
rsync -av --delete WorldBible/ docs/WorldBible/

# Sync assets
rsync -av --delete assets/ docs/public/assets/

echo "✅ Sync complete! Your changes are ready."
echo "💡 Run 'npm run docs:dev' to see them in the browser."
