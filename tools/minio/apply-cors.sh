#!/usr/bin/env bash
set -euo pipefail

if ! command -v mc >/dev/null 2>&1; then
  echo "⚠️  Le client MinIO (mc) doit être installé pour appliquer la configuration CORS." >&2
  exit 1
fi

MINIO_ALIAS=${MINIO_ALIAS:-local}
MINIO_ENDPOINT=${MINIO_ENDPOINT:-http://localhost:9000}
MINIO_ROOT_USER=${MINIO_ROOT_USER:-${MINIO_ACCESS_KEY:-}}
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD:-${MINIO_SECRET_KEY:-}}
CORS_FILE=${CORS_FILE:-$(dirname "$0")/cors.json}

if [[ -z "${MINIO_ROOT_USER}" || -z "${MINIO_ROOT_PASSWORD}" ]]; then
  echo "MINIO_ROOT_USER et MINIO_ROOT_PASSWORD doivent être définis." >&2
  exit 1
fi

mc alias set "$MINIO_ALIAS" "$MINIO_ENDPOINT" "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"
CORS_DIR=$(cd "$(dirname "$CORS_FILE")" && pwd)
CORS_PATH="$CORS_DIR/$(basename "$CORS_FILE")"
mc admin config set "$MINIO_ALIAS"/ api cors="$CORS_PATH"
mc admin service restart "$MINIO_ALIAS"

echo "✅ Configuration CORS appliquée sur $MINIO_ENDPOINT"
