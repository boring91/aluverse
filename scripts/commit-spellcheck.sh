#!/usr/bin/env sh
set -eu

commit_msg_file="${1:?Commit message file is required}"

if [ ! -f "$commit_msg_file" ]; then
  echo "Commit message file does not exist: $commit_msg_file" >&2
  exit 1
fi

grep -v '^[[:space:]]*#' "$commit_msg_file" | cspell lint \
  --config ./cspell.json \
  --language-id markdown \
  --no-progress \
  --no-summary \
  stdin://commit-message.md
