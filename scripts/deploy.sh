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
readonly CF_FUNCTION_NAME="HabitFlow-URL-Rewrite"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
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
CF_FUNCTION_ARN=""

# Create or update the CloudFront Function that rewrites extensionless
# URLs to .html (e.g. /settings → /settings.html) so S3 can serve
# Next.js static-export pages.  Sets CF_FUNCTION_ARN.
ensure_url_rewrite_function() {
  echo "Checking for CloudFront Function '${CF_FUNCTION_NAME}'..."

  local function_code="${SCRIPT_DIR}/cf-url-rewrite.js"
  if [[ ! -f "$function_code" ]]; then
    echo "Error: ${function_code} not found" >&2
    exit 1
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] aws cloudfront describe-function --name ${CF_FUNCTION_NAME}"
    echo "[dry-run] aws cloudfront create-function / update-function (if needed)"
    echo "[dry-run] aws cloudfront publish-function"
    CF_FUNCTION_ARN="dry-run-function-arn"
    return 0
  fi

  local function_config='{"Comment":"Rewrite extensionless paths to .html for Next.js static export","Runtime":"cloudfront-js-2.0"}'

  # Check if the function already exists
  local existing_etag=""
  local describe_result
  if describe_result=$(aws cloudfront describe-function \
    --name "${CF_FUNCTION_NAME}" --no-cli-pager 2>/dev/null); then
    existing_etag=$(echo "$describe_result" | jq -r '.ETag')
    CF_FUNCTION_ARN=$(echo "$describe_result" | jq -r '.FunctionSummary.FunctionMetadata.FunctionARN')
    echo "Function '${CF_FUNCTION_NAME}' exists (updating)..."

    aws cloudfront update-function \
      --name "${CF_FUNCTION_NAME}" \
      --function-config "$function_config" \
      --function-code "fileb://${function_code}" \
      --if-match "$existing_etag" \
      --no-cli-pager > /dev/null

    # Get fresh ETag after update for publish
    describe_result=$(aws cloudfront describe-function \
      --name "${CF_FUNCTION_NAME}" --stage DEVELOPMENT --no-cli-pager)
    existing_etag=$(echo "$describe_result" | jq -r '.ETag')
  else
    echo "Creating CloudFront Function '${CF_FUNCTION_NAME}'..."

    local create_result
    create_result=$(aws cloudfront create-function \
      --name "${CF_FUNCTION_NAME}" \
      --function-config "$function_config" \
      --function-code "fileb://${function_code}" \
      --no-cli-pager)

    existing_etag=$(echo "$create_result" | jq -r '.ETag')
    CF_FUNCTION_ARN=$(echo "$create_result" | jq -r '.FunctionSummary.FunctionMetadata.FunctionARN')
  fi

  echo "Publishing function '${CF_FUNCTION_NAME}'..."
  aws cloudfront publish-function \
    --name "${CF_FUNCTION_NAME}" \
    --if-match "$existing_etag" \
    --no-cli-pager > /dev/null

  echo "Function published (ARN: ${CF_FUNCTION_ARN})"
}

# Create CloudFront response headers policy if it doesn't exist.
# Sets POLICY_ID for use by update_distribution_config.
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
      "ContentSecurityPolicy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://*.supabase.co; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
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

# Apply the URL-rewrite function and response headers policy to the distribution
# in a single update to avoid ETag conflicts.
update_distribution_config() {
  echo "Updating distribution ${DIST_ID} config..."

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

  # Check what's already configured
  local current_function_arn
  current_function_arn=$(echo "$dist_config_response" | jq -r \
    '.DistributionConfig.DefaultCacheBehavior.FunctionAssociations.Items[]?
     | select(.EventType == "viewer-request")
     | .FunctionARN // empty')

  local current_policy_id
  current_policy_id=$(echo "$dist_config_response" | jq -r \
    '.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId // empty')

  local needs_function_update="false"
  local needs_policy_update="false"

  if [[ "$current_function_arn" != "$CF_FUNCTION_ARN" ]]; then
    needs_function_update="true"
  fi
  if [[ -n "$POLICY_ID" && "$current_policy_id" != "$POLICY_ID" ]]; then
    needs_policy_update="true"
  fi

  if [[ "$needs_function_update" == "false" && "$needs_policy_update" == "false" ]]; then
    echo "Distribution ${DIST_ID} already up to date"
    return 0
  fi

  # Build jq filter: conditionally set function association and/or headers policy
  local updated_config
  updated_config=$(echo "$dist_config_response" | jq \
    --arg arn "$CF_FUNCTION_ARN" \
    --arg pid "$POLICY_ID" \
    --argjson updateFn "$needs_function_update" \
    --argjson updatePolicy "$needs_policy_update" \
    '
    (if $updateFn then
      .DistributionConfig.DefaultCacheBehavior.FunctionAssociations.Items =
        ([.DistributionConfig.DefaultCacheBehavior.FunctionAssociations.Items[]?
          | select(.EventType != "viewer-request")]
         + [{"EventType": "viewer-request", "FunctionARN": $arn}])
      | .DistributionConfig.DefaultCacheBehavior.FunctionAssociations.Quantity =
          (.DistributionConfig.DefaultCacheBehavior.FunctionAssociations.Items | length)
    else . end)
    | (if $updatePolicy then
        .DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = $pid
      else . end)
    | .DistributionConfig
    ')

  local update_err
  if update_err=$(aws cloudfront update-distribution \
    --id "${DIST_ID}" \
    --distribution-config "$updated_config" \
    --if-match "$etag" \
    --no-cli-pager 2>&1 >/dev/null); then
    [[ "$needs_function_update" == "true" ]] && echo "URL-rewrite function attached"
    [[ "$needs_policy_update" == "true" ]] && echo "Response headers policy attached"
  else
    echo "Warning: Could not update distribution config:" >&2
    echo "$update_err" >&2
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

ensure_url_rewrite_function
ensure_response_headers_policy
update_distribution_config

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
