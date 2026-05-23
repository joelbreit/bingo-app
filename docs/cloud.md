# Cloud Architecture

## AWS Services

| Service | Role |
|---|---|
| API Gateway (WebSocket) | Manages persistent player connections; routes `$connect`, `$disconnect`, and all message types |
| API Gateway (HTTP) | REST endpoint for session listing (`GET /sessions`) |
| Lambda (×4) | `bingo-connect`, `bingo-disconnect`, `bingo-message`, `bingo-list-sessions` |
| DynamoDB | `bingo-connections` table — connection records and session state records |

## DynamoDB Schema

**Table: `bingo-connections`** — single table, two record types.

### Connection records (one per active WebSocket connection)

| Attribute | Type | Notes |
|---|---|---|
| `connectionId` | String (PK) | Assigned by API Gateway on `$connect` |
| `sessionId` | String (GSI PK) | From WebSocket query string; used to fan out to all players |
| `playerState` | Map | `{ id, name, board, marks }` — set on first player update |
| `ttl` | Number | Unix epoch; set to +4 hours on connect |

### Session records (one per session)

| Attribute | Type | Notes |
|---|---|---|
| `connectionId` | String (PK) | `"session#<sessionId>"` |
| `sessionId` | String (GSI PK) | Same as the session ID (enables GSI lookup) |
| `topics` | List | Custom topic pool for this session |
| `revealedTopics` | List | Topics the host has revealed so far |
| `ttl` | Number | Rolling +8 hours, updated on every session action |

The `sessionId` GSI covers both record types. `getConnections()` filters out session records by checking `connectionId.startsWith("session#")`.

## Lambda Functions

### `bingo-connect`
Triggered on WebSocket `$connect`. Writes `{ connectionId, sessionId, ttl: now+4h }` to DynamoDB.

### `bingo-disconnect`
Triggered on WebSocket `$disconnect`. Deletes the connection record.

### `bingo-message`
Triggered on all other WebSocket messages (route key = `$default`, matched by `t` field). Handles:

| Message `t` | Action |
|---|---|
| `getState` | Read session + all connections; broadcast current state to caller |
| `ps` | Write `playerState` to caller's connection record; broadcast updated player list |
| `setTopics` | Validate ≥24 topics; write to session record; broadcast updated state |
| `reveal` | Append topic(s) to `revealedTopics` in session record; broadcast |
| `reset` | Clear `revealedTopics` and all `playerState` fields; broadcast reset |

All broadcasts send `{ t: "players", players, revealedTopics, topics }` to every connection in the session. Stale connections (410 from API Gateway) are auto-deleted.

### `bingo-list-sessions`
Triggered on HTTP `GET /sessions`. Scans DynamoDB for session records (`begins_with(connectionId, "session#")`, not expired). For each session, queries the `sessionId-index` GSI with `attribute_exists(playerState)` to count active players. Returns `{ sessions: [{ id, playerCount }] }`.

## Resource Tagging

Tag **all** resources with:

```
Key: project   Value: presentation-bingo
```

Set at `Globals` in the SAM template so Lambda functions inherit it automatically. Tag the DynamoDB table and API Gateway stages explicitly.

## Logging

**Lambda** — CloudWatch Logs enabled by default. `LogFormat: JSON` set in SAM Globals. Each invocation logs at minimum: `action`, `connectionId`, `sessionId`, `playerCount`.

**API Gateway** — access logging can be enabled on both the WebSocket and HTTP stages via `AccessLogDestination`.

**Useful log fields:**
- `action` — message type or lifecycle event
- `sessionId`, `connectionId`
- `playerCount` — connections with `playerState` in the session
- `error` — any caught exception

## Environment Variables (frontend)

Written to `.env.local` by `scripts/deploy.sh` after each deploy:

| Variable | Value |
|---|---|
| `VITE_WS_URL` | `wss://<api-id>.execute-api.<region>.amazonaws.com/prod` |
| `VITE_API_URL` | `https://<http-api-id>.execute-api.<region>.amazonaws.com` |
