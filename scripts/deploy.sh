#!/usr/bin/env bash
set -euo pipefail

# Required environment variables:
#   BUCKET_NAME  — S3 bucket for static hosting
#   DIST_ID      — CloudFront distribution ID

if [[ -z "${BUCKET_NAME:-}" ]]; then
  echo "Error: BUCKET_NAME is not set" >&2
  exit 1
fi

if [[ -z "${DIST_ID:-}" ]]; then
  echo "Error: DIST_ID is not set" >&2
  exit 1
fi

echo "Building..."
npm run build

echo "Syncing to s3://${BUCKET_NAME}..."
aws s3 sync out/ "s3://${BUCKET_NAME}" --delete

echo "Invalidating CloudFront distribution ${DIST_ID}..."
aws cloudfront create-invalidation \
  --distribution-id "${DIST_ID}" \
  --paths "/*" \
  --no-cli-pager

echo "Deploy complete!"
