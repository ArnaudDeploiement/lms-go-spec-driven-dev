#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <url_pre_signee> <fichier_a_upload> [content-type]" >&2
  exit 1
fi

SIGNED_URL="$1"
FILE_PATH="$2"
CONTENT_TYPE="${3:-$(file --brief --mime-type "$FILE_PATH" 2>/dev/null || echo application/octet-stream)}"

curl -X PUT \
  -H "Content-Type: ${CONTENT_TYPE}" \
  --data-binary "@${FILE_PATH}" \
  -v \
  "${SIGNED_URL}"
