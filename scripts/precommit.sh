#!/usr/bin/env sh
set -e

staged_files=$(mktemp)
trap 'rm -f "$staged_files"' EXIT

git diff --cached --name-only --diff-filter=ACMR -z > "$staged_files"

if [ ! -s "$staged_files" ]; then
  echo "No staged files to check."
  exit 0
fi

echo "Checking staged files..."
xargs -0 bunx prettier --check --ignore-unknown -- < "$staged_files"
xargs -0 bunx eslint --no-warn-ignored -- < "$staged_files"
