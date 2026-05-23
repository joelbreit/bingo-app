# Roadmap

## Phase 0 — Cleanup (do first)

Upfront refactoring that will make all subsequent phases faster and less error-prone.

- [x] **Extract `config.js`** — move `SESSION`, `TOPICS`, `RATES`, `LINES`, `LINE_NAMES`, `FREE` out of `App.jsx` into `src/config.js`. `SESSION` will later become URL-derived; isolating it now makes that a one-line change.
- [x] **Abstract the transport layer** — create `src/hooks/useSession.js`, a custom hook that wraps the current `BroadcastChannel` logic and exposes `{ players, sendState }`. Swapping in WebSocket in Phase 1 then only touches this one file.
- [x] **Split into components** — extract `Lobby`, `Board`, `HostView`, and `KnowledgeModal` into `src/components/`. Each phase touches a different screen; separate files eliminate merge-style conflicts when editing.
- [x] **Extract CSS** — move the CSS template literal to `src/index.css` and import it normally. Keeps component files focused on logic.

## Phase 1 — Real-time Multiplayer Backend

Replace `BroadcastChannel` with a serverless WebSocket backend so players on different devices can connect.

**Architecture:** API Gateway WebSocket API → Lambda → DynamoDB

- [x] **DynamoDB table** — `connections` table with `connectionId` (PK), `sessionId` (GSI), and full player state (`name`, `board`, `marks`)
- [x] **SAM template** — define the WebSocket API, three Lambda functions, and the DynamoDB table as infrastructure-as-code
- [x] **`$connect` Lambda** — store `connectionId` + `sessionId` (from query string) in DynamoDB
- [x] **`$disconnect` Lambda** — remove the connection record from DynamoDB
- [x] **`playerUpdate` Lambda** — write incoming player state to DynamoDB, then fan out to all other `connectionId`s in the session via the API Gateway Management API
- [x] **Update `useSession.js`** — swap `BroadcastChannel` for a `WebSocket` pointing at the API Gateway URL; keep the same `{ players, sendState }` interface so no other file changes

## Phase 2 — URL-based Sessions & Deployment

Make sessions shareable via link and get the app live.

- [x] Parse session ID from the URL path (`/demo2026`) using `window.location` — no router needed
- [x] Read `SESSION` from the URL in `config.js` with a hardcoded fallback for local dev
- [x] Deploy frontend to AWS Amplify at `bingo.joelbreit.com` with a catch-all rewrite rule
- [x] Host generates a session ID and shares a QR code / short link from the lobby

## Phase 3 — Host Session Control

Give the host tools to manage the game in real time.

- [ ] Host creates a session from the lobby (generates a session ID + optional host code)
- [x] Host can reveal topics one-by-one as they're covered (topics stored in DynamoDB session record, pushed to players)
- [x] Host can reset the game or clear all marks
- [x] Bingo submissions are pushed to the host automatically via WebSocket (no polling)

## Phase 4 — Configurable Topics

Allow the host to customize topics without editing source code.

- [ ] Topic editor UI in the host lobby (textarea or list)
- [ ] Topics stored in the DynamoDB session record and sent to players on join
- [ ] Support variable topic counts (pool size > 24; board draws 24 randomly)

## Phase 5 — Polish & UX

- [ ] Confetti animation on bingo
- [ ] Player disconnect/reconnect — rejoin restores same board from DynamoDB
- [ ] Host view: click a mini-board to see the player's full board in a modal
- [ ] QR code display on the lobby screen
- [ ] Accessibility pass (keyboard nav, ARIA labels)
