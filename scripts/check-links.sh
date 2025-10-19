#!/bin/bash
# Check for broken internal links in markdown files

echo "🔍 Checking for broken internal links..."

cd "$(dirname "$0")/.."

# Find all markdown files
find docs/WorldBible -name "*.md" -type f | while read -r file; do
  # Extract markdown links [text](link)
  grep -o '\[.*\](\.\/.*\.md)' "$file" | while read -r link; do
    # Extract the path
    link_path=$(echo "$link" | sed -n 's/.*(\(.*\))/\1/p')
    
    # Resolve relative path
    dir=$(dirname "$file")
    full_path="$dir/$link_path"
    
    # Check if file exists
    if [ ! -f "$full_path" ]; then
      echo "❌ Broken link in $file: $link_path"
    fi
  done
done

echo "✅ Link check complete!"
