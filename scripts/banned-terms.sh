#!/bin/bash
# Deterministic check for §9.12 banned temporal terms in PR-added prose.
#
# Source of truth: WorldBible/02_CivilizationalElements/04_Terminology.md §9.12.
# The banned phrases are parsed from that file at runtime, never hardcoded here,
# so the term list stays the single source of truth (and this script doesn't
# reproduce banned phrases itself).
#
# Scope: only the §9.12 temporal terms. The §9.9 mental-health phrases
# ("suffering from", etc.) are deliberately excluded — §9.9 itself marks them
# contextual ("unless character is genuinely suffering"), so a context-free grep
# would produce false positives. Those are judged by the claude-judge job instead.
#
# Exits 1 if any banned term is found in an added line; 0 otherwise.

set -euo pipefail

cd "$(dirname "$0")/.."

TERMS_FILE="WorldBible/02_CivilizationalElements/04_Terminology.md"

if [ ! -f "$TERMS_FILE" ]; then
  echo "❌ banned-terms: source file not found: $TERMS_FILE" >&2
  exit 2
fi

# --- Parse §9.12 banned phrases -------------------------------------------
# §9.12 is the last numbered section. Use awk to slice from the `### 9.12`
# heading to end-of-file, then literal-grep the ❌ marker (a plain substring
# match — robust regardless of locale), and extract the quoted phrase with bash
# parameter expansion (no regex on the multi-byte marker).
section="$(awk '/^### 9\.12[[:space:]]/{flag=1} flag' "$TERMS_FILE")"
if [ -z "$section" ]; then
  echo "⚠️  banned-terms: §9.12 not found in $TERMS_FILE — skipping." >&2
  exit 0
fi

BANNED=()
while IFS= read -r marked_line; do
  [ -z "$marked_line" ] && continue
  # Strip everything up to and including the first quote, then drop the tail
  # after the closing quote. Yields the bare phrase, e.g. `Time travel`.
  rest="${marked_line#*\"}"
  phrase="${rest%%\"*}"
  [ -n "$phrase" ] && BANNED+=("$phrase")
done < <(printf '%s\n' "$section" | grep '❌')

if [ "${#BANNED[@]}" -eq 0 ]; then
  echo "⚠️  banned-terms: no banned terms parsed from §9.12 — check the format." >&2
  exit 0
fi

echo "🔍 banned-terms: enforcing ${#BANNED[@]} term(s) from §9.12."

# --- Determine the PR diff range ------------------------------------------
# Prefer the GitHub-provided commit range; fall back to HEAD so the script is
# testable outside CI (e.g. BASE_SHA=HEAD~1 to check the last commit).
BASE_SHA="${BASE_SHA:-}"
HEAD_SHA="${HEAD_SHA:-HEAD}"
DIFF_RANGE="${BASE_SHA:+$BASE_SHA...}$HEAD_SHA"

# --- Paths that legitimately contain the banned phrases (skip them) --------
# The canonical term list, plus historical archives (out of scope per AGENTS.md).
EXCLUDE_RE='WorldBible/02_CivilizationalElements/04_Terminology\.md|(^|/)deprecated/|(^|/)docs/reports/|(^|/)docs/superpowers/'

# --- Scan added lines -----------------------------------------------------
violations=0
files="$(git diff --diff-filter=d --name-only "$DIFF_RANGE" -- '*.md' '*.mdc' 2>/dev/null || true)"

for term in "${BANNED[@]}"; do
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    if printf '%s' "$file" | grep -qE "$EXCLUDE_RE"; then
      continue
    fi
    # Walk the diff hunks with awk: track the new-file line number from each
    # `@@ ... +line,count @@` header and emit matching `+` lines as `lineno:text`.
    while IFS= read -r hit; do
      [ -z "$hit" ] && continue
      lineno="${hit%%:*}"
      echo "❌ $file:$lineno: banned term \"$term\" — see §9.12 ($TERMS_FILE) for approved replacements"
      violations=$((violations + 1))
    done < <(
      git diff -U0 --diff-filter=d "$DIFF_RANGE" -- "$file" 2>/dev/null \
        | awk -v term="$(printf '%s' "$term" | tr '[:upper:]' '[:lower:]')" '
            /^@@/ {
              if (match($0, /\+[0-9]+/)) {
                line = substr($0, RSTART + 1, RLENGTH - 1) + 0
              }
              next
            }
            /^\+\+\+/ { next }
            /^\+/ {
              content = tolower(substr($0, 2))
              if (index(content, term) > 0) {
                printf "%d:%s\n", line, substr($0, 2)
              }
              line++
            }
          '
    )
  done <<< "$files"
done

echo ""
if [ "$violations" -gt 0 ]; then
  echo "❌ banned-terms: $violations violation(s) found."
  exit 1
fi

echo "✅ banned-terms: no §9.12 temporal terms in added prose."
