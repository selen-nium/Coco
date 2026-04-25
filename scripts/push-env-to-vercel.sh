#!/bin/bash
# Reads .env and pushes each variable to Vercel for production + preview environments.
# Usage: bash scripts/push-env-to-vercel.sh [env-file]
#        bash scripts/push-env-to-vercel.sh .env.local

ENV_FILE="${1:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found"
  exit 1
fi

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip comments and blank lines
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue

  key="${line%%=*}"
  value="${line#*=}"

  # Strip surrounding quotes
  value="${value%\"}" ; value="${value#\"}"
  value="${value%\'}" ; value="${value#\'}"

  [[ -z "$key" || -z "$value" ]] && continue

  echo "→ Adding $key ..."
  printf '%s' "$value" | vercel env add "$key" production --force 2>&1
  printf '%s' "$value" | vercel env add "$key" preview   --force 2>&1

done < "$ENV_FILE"

echo ""
echo "Done. Run 'vercel env ls' to verify, then redeploy with 'vercel'."
