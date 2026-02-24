#!/usr/bin/env bash
set -euo pipefail

# Source .env file if present (convenience for local deploys)
if [[ -f ".env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
fi

# AWS resource identifiers — must be provided via env vars or .env file.
# See .env.example for the required variables.
BUCKET_NAME="${BUCKET_NAME:-}"
DIST_ID="${DIST_ID:-}"
DOMAIN_NAME="${DOMAIN_NAME:-}"

if [[ -z "$BUCKET_NAME" || -z "$DIST_ID" || -z "$DOMAIN_NAME" ]]; then
  echo "Error: Missing required environment variables." >&2
  echo "Set BUCKET_NAME, DIST_ID, and DOMAIN_NAME, or copy .env.example to .env and fill in values." >&2
  exit 1
fi

readonly POLICY_NAME="HabitFlow-Security-Headers"
OUT_DIR="${OUT_DIR:-out}"
DRY_RUN="${DRY_RUN:-0}"

if ! command -v aws >/dev/null 2>&1; then
  echo "Error: aws CLI is not installed or not on PATH" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is not installed or not on PATH" >&2
  exit 1
fi

run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] $*"
    return 0
  fi
  "$@"
}

POLICY_ID=""

# Create CloudFront response headers policy if it doesn't exist.
# Sets POLICY_ID for use by attach_policy_to_distribution.
ensure_response_headers_policy() {
  echo "Checking for response headers policy '${POLICY_NAME}'..."

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] aws cloudfront list-response-headers-policies --type custom"
    echo "[dry-run] aws cloudfront create-response-headers-policy (if needed)"
    POLICY_ID="dry-run-policy-id"
    return 0
  fi

  local existing
  existing=$(aws cloudfront list-response-headers-policies \
    --type custom --no-cli-pager 2>/dev/null || echo '{}')

  POLICY_ID=$(echo "$existing" | jq -r \
    ".ResponseHeadersPolicyList.Items[]?
     | select(.ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name == \"${POLICY_NAME}\")
     | .ResponseHeadersPolicy.Id")

  if [[ -n "$POLICY_ID" ]]; then
    echo "Policy '${POLICY_NAME}' already exists (ID: ${POLICY_ID})"
    return 0
  fi

  echo "Creating response headers policy '${POLICY_NAME}'..."

  local policy_config
  # CSP note: 'unsafe-inline' is required for both script-src and style-src.
  # - script-src: Next.js React Server Components inject inline <script> tags for hydration data.
  # - style-src: Recharts v3 applies inline style attributes on SVG chart elements.
  # Removing either will break the app. Nonce-based CSP is not feasible with static export.
  policy_config=$(cat <<'POLICY_JSON'
{
  "Name": "HabitFlow-Security-Headers",
  "Comment": "Security headers for HabitFlow PWA",
  "SecurityHeadersConfig": {
    "ContentSecurityPolicy": {
      "Override": true,
      "ContentSecurityPolicy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
    },
    "ContentTypeOptions": {
      "Override": true
    },
    "FrameOptions": {
      "Override": true,
      "FrameOption": "DENY"
    },
    "ReferrerPolicy": {
      "Override": true,
      "ReferrerPolicy": "strict-origin-when-cross-origin"
    },
    "StrictTransportSecurity": {
      "Override": true,
      "AccessControlMaxAgeSec": 63072000,
      "IncludeSubdomains": true,
      "Preload": true
    }
  },
  "CustomHeadersConfig": {
    "Quantity": 1,
    "Items": [
      {
        "Header": "Permissions-Policy",
        "Value": "camera=(), microphone=(), geolocation=()",
        "Override": true
      }
    ]
  }
}
POLICY_JSON
)

  local result
  result=$(aws cloudfront create-response-headers-policy \
    --response-headers-policy-config "$policy_config" \
    --no-cli-pager)

  POLICY_ID=$(echo "$result" | jq -r '.ResponseHeadersPolicy.Id')
  echo "Created policy '${POLICY_NAME}' (ID: ${POLICY_ID})"
}

# Attach the response headers policy to the distribution's default cache behavior.
# Skips if the policy is already attached.
attach_policy_to_distribution() {
  echo "Checking distribution ${DIST_ID} for response headers policy..."

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] aws cloudfront get-distribution-config --id ${DIST_ID}"
    echo "[dry-run] aws cloudfront update-distribution (if needed)"
    return 0
  fi

  local dist_config_response
  dist_config_response=$(aws cloudfront get-distribution-config \
    --id "${DIST_ID}" --no-cli-pager)

  local etag
  etag=$(echo "$dist_config_response" | jq -r '.ETag')

  local current_policy_id
  current_policy_id=$(echo "$dist_config_response" | jq -r \
    '.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId // empty')

  if [[ "$current_policy_id" == "$POLICY_ID" ]]; then
    echo "Policy already attached to distribution ${DIST_ID}"
    return 0
  fi

  echo "Attaching policy ${POLICY_ID} to distribution ${DIST_ID}..."

  local updated_config
  updated_config=$(echo "$dist_config_response" | jq \
    --arg pid "$POLICY_ID" \
    '.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = $pid | .DistributionConfig')

  if aws cloudfront update-distribution \
    --id "${DIST_ID}" \
    --distribution-config "$updated_config" \
    --if-match "$etag" \
    --no-cli-pager > /dev/null 2>&1; then
    echo "Policy attached to distribution ${DIST_ID}"
  else
    echo "Warning: Could not attach response headers policy (distribution may be on Free pricing plan)." >&2
    echo "Deploy will continue. Re-run after switching to on-demand pricing." >&2
  fi
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

ensure_response_headers_policy
attach_policy_to_distribution

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
