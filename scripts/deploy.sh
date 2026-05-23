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

# Pull the WebSocket URL from stack outputs and write to .env.local
WS_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='WebSocketUrl'].OutputValue" \
  --output text)

echo "VITE_WS_URL=${WS_URL}" > "$PROJECT_DIR/.env.local"

echo ""
echo "Done! WebSocket URL: ${WS_URL}"
echo "Written to .env.local — restart 'npm run dev' to pick it up."
