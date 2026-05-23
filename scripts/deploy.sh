#!/usr/bin/env bash
set -euo pipefail

STACK_NAME="bingo-app"
INFRA_DIR="$(cd "$(dirname "$0")/../infra" && pwd)"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$INFRA_DIR"

echo "Building..."
sam build

echo "Deploying..."
sam deploy \
  --stack-name "$STACK_NAME" \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --tags "project=presentation-bingo" \
  --no-confirm-changeset

# Pull outputs from stack and write to .env.local
WS_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='WebSocketUrl'].OutputValue" \
  --output text)

HTTP_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='HttpApiUrl'].OutputValue" \
  --output text)

{
  echo "VITE_WS_URL=${WS_URL}"
  echo "VITE_API_URL=${HTTP_URL}"
} > "$PROJECT_DIR/.env.local"

echo ""
echo "Done!"
echo "  WebSocket URL: ${WS_URL}"
echo "  HTTP API URL:  ${HTTP_URL}"
echo "Written to .env.local — restart 'npm run dev' to pick it up."
