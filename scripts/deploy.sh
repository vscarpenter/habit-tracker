#!/usr/bin/env bash
set -euo pipefail

# Deploy defaults (override with env vars if needed)
readonly DEFAULT_BUCKET_NAME="habittracker.vinny.dev"
readonly DEFAULT_DIST_ID="ES4HK16S0OBWF"
readonly DEFAULT_DOMAIN_NAME="habittracker.vinny.dev"
readonly DEFAULT_OUT_DIR="out"

BUCKET_NAME="${BUCKET_NAME:-$DEFAULT_BUCKET_NAME}"
DIST_ID="${DIST_ID:-$DEFAULT_DIST_ID}"
DOMAIN_NAME="${DOMAIN_NAME:-$DEFAULT_DOMAIN_NAME}"
OUT_DIR="${OUT_DIR:-$DEFAULT_OUT_DIR}"
DRY_RUN="${DRY_RUN:-0}"

if ! command -v aws >/dev/null 2>&1; then
  echo "Error: aws CLI is not installed or not on PATH" >&2
  exit 1
fi

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] $*"
    return 0
  fi
  "$@"
}

echo "Building..."
run bun run build

if [[ ! -d "$OUT_DIR" ]]; then
  echo "Error: build output directory '$OUT_DIR' not found" >&2
  exit 1
fi

echo "Syncing static assets to s3://${BUCKET_NAME}..."
run aws s3 sync "${OUT_DIR}/" "s3://${BUCKET_NAME}" \
  --delete \
  --exclude "*.html" \
  --exclude "sw.js" \
  --cache-control "public,max-age=31536000,immutable" \
  --no-progress

echo "Syncing HTML and service worker with revalidation cache policy..."
run aws s3 sync "${OUT_DIR}/" "s3://${BUCKET_NAME}" \
  --exclude "*" \
  --include "*.html" \
  --include "sw.js" \
  --cache-control "public,max-age=0,must-revalidate" \
  --no-progress

echo "Invalidating CloudFront distribution ${DIST_ID}..."
run aws cloudfront create-invalidation \
  --distribution-id "${DIST_ID}" \
  --paths "/*" \
  --no-cli-pager

if [[ "$DRY_RUN" == "1" ]]; then
  echo "Dry run complete. No AWS changes were made."
else
  echo "Deploy complete: https://${DOMAIN_NAME}"
fi
