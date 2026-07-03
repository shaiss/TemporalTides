#!/bin/bash
# Check for broken relative .md links in WorldBible markdown files.
# Informational only: the VitePress build ignores dead links (ignoreDeadLinks: true)
# because some links are placeholders for future content.

echo "🔍 Checking for broken internal links..."

cd "$(dirname "$0")/.."

broken=0

while IFS= read -r file; do
  dir=$(dirname "$file")
  # Extract relative markdown link targets: [text](path.md), skipping http(s) and site-absolute paths
  while IFS= read -r link_path; do
    target="${link_path%%#*}"   # strip anchor fragment
    [ -z "$target" ] && continue
    if [ ! -f "$dir/$target" ]; then
      echo "❌ Broken link in $file: $link_path"
      broken=$((broken+1))
    fi
  done < <(grep -o ']([^)]*\.md[^)]*)' "$file" | sed 's/^](//; s/)$//' | grep -v '^https\?:' | grep -v '^/')
  # Also validate relative directory links: [text](path/)
  while IFS= read -r link_path; do
    if [ ! -d "$dir/$link_path" ]; then
      echo "❌ Broken directory link in $file: $link_path"
      broken=$((broken+1))
    fi
  done < <(grep -o '][(][^):]*/[)]' "$file" | sed 's/^](//; s/)$//' | grep -v '^/')
done < <(find WorldBible -name "*.md" -type f)

echo ""
if [ "$broken" -eq 0 ]; then
  echo "✅ Link check complete! No broken links found."
else
  echo "⚠️  Link check complete: $broken broken link(s) found (may include intentional placeholders)."
fi
