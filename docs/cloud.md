# Cloud Architecture

## AWS Services

| Service | Role |
|---|---|
| API Gateway (WebSocket) | Manages persistent player connections; routes `$connect`, `$disconnect`, `playerUpdate` |
| Lambda (×3) | `connectHandler`, `disconnectHandler`, `updateHandler` |
| DynamoDB | `connections` table — one record per active connection |

## DynamoDB Schema

**Table: `bingo-connections`**

| Attribute | Type | Notes |
|---|---|---|
| `connectionId` | String (PK) | Assigned by API Gateway |
| `sessionId` | String (GSI PK) | From WebSocket query string; used to fan out to all players in a session |
| `name` | String | Player display name |
| `board` | List | Shuffled topic array |
| `marks` | Map | `{ squareIndex: rateId }` |

TTL attribute: `ttl` — set to +4 hours on connect; auto-cleans stale records.

## Lambda Flow

1. **`$connect`** — write `connectionId` + `sessionId` + empty player state to DynamoDB
2. **`playerUpdate`** — update caller's record, then query the `sessionId` GSI and post the full player list to every other `connectionId` via the API Gateway Management API
3. **`$disconnect`** — delete the connection record

## Resource Tagging

Tag **all** resources (API Gateway stage, Lambda functions, DynamoDB table, CloudWatch log groups) with:

```
Key: project   Value: presentation-bingo
```

In the SAM template, set this at the globals level so it applies automatically:

```yaml
Globals:
  Function:
    Tags:
      project: presentation-bingo
```

Tag the DynamoDB table and API Gateway stage explicitly since they don't inherit `Globals`.

## Logging

**Lambda** — CloudWatch Logs enabled by default. Set `LoggingConfig.LogFormat: JSON` in the SAM template for structured output. Log at least: `connectionId`, `sessionId`, and action on every invocation.

**API Gateway** — enable access logging on the WebSocket stage. Create a dedicated log group `/aws/apigateway/bingo-ws` and point the stage's `AccessLogDestination` at its ARN.

**Useful log fields to emit from Lambda:**
- `action` — `connect | disconnect | update`
- `sessionId`
- `connectionId`
- `playerCount` — number of connections in the session after the action
- `error` — any caught exception

## SAM Template Skeleton

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Runtime: nodejs20.x
    Timeout: 10
    Environment:
      Variables:
        TABLE_NAME: !Ref ConnectionsTable
        API_ENDPOINT: !Sub 'https://${BingoApi}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Tags:
      project: presentation-bingo

Resources:
  BingoApi:
    Type: AWS::ApiGatewayV2::Api
    Properties:
      Name: bingo-ws
      ProtocolType: WEBSOCKET
      RouteSelectionExpression: "$request.body.t"

  ConnectionsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: bingo-connections
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: connectionId
          AttributeType: S
        - AttributeName: sessionId
          AttributeType: S
      KeySchema:
        - AttributeName: connectionId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: sessionId-index
          KeySchema:
            - AttributeName: sessionId
              KeyType: HASH
          Projection:
            ProjectionType: ALL
      TimeToLiveSpecification:
        AttributeName: ttl
        Enabled: true
      Tags:
        - Key: project
          Value: presentation-bingo
```
