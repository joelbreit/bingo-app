# Developer Guide

## Setup

```bash
git clone <repo>
cd bingo-app
npm install
```

## Run locally

```bash
npm run dev        # http://localhost:5173
```

Open a second tab and click **Host Dashboard** to simulate multiplayer. The app uses `BroadcastChannel` locally — no backend needed for frontend dev.

## View AWS resources

```bash
# List all resources tagged project=presentation-bingo
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=project,Values=presentation-bingo \
  --query 'ResourceTagMappingList[].ResourceARN'
```

Or in the console: **Resource Groups & Tag Editor** → search tag `project: presentation-bingo`.

## View logs

**Frontend (browser)**
Open DevTools → Console. WebSocket connection events and errors are logged there.

**Lambda (CloudWatch)**

```bash
# Tail logs for a specific function (replace FUNCTION_NAME)
aws logs tail /aws/lambda/FUNCTION_NAME --follow

# Or filter by session
aws logs filter-log-events \
  --log-group-name /aws/lambda/bingo-updateHandler \
  --filter-pattern '{ $.sessionId = "demo2026" }'
```

**API Gateway access logs**

```bash
aws logs tail /aws/apigateway/bingo-ws --follow
```

## Deploy backend

```bash
cd infra/
sam build && sam deploy --guided   # first time
sam build && sam deploy            # subsequent
```

The WebSocket endpoint URL is printed in the SAM output. Set it as `VITE_WS_URL` in a `.env.local` file for local dev against the live backend.
