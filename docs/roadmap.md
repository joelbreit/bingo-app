# Roadmap

## Phase 1 — Real-time Multiplayer Backend

Replace the current `BroadcastChannel` (same-device only) with a WebSocket server so players on different devices can connect.

- [ ] Set up a Node.js WebSocket server (e.g. `ws` or `socket.io`) that manages sessions by ID
- [ ] Add session join/leave events and player state broadcast
- [ ] Update `App.jsx` to connect via WebSocket instead of `BroadcastChannel`
- [ ] Deploy server alongside the frontend (EC2, Fly.io, or AWS App Runner)

## Phase 2 — URL-based Sessions

Make sessions shareable via URL so players can just tap a link on their phone.

- [ ] Add React Router (or use `window.location`) to parse session ID from the path (e.g. `/demo2026`)
- [ ] Auto-populate `SESSION` from the URL param instead of the hardcoded constant
- [ ] Host generates a session and shares a QR code / link
- [ ] Set up `bingo.joelbreit.com` on AWS Amplify with wildcard routing

## Phase 3 — Host Session Control

Give the host tools to manage the game in real time.

- [ ] Host creates/starts a session from a dedicated host page (with password or join code)
- [ ] Host can reveal topics one-by-one as they're covered in the presentation (rather than showing all upfront)
- [ ] Host can reset the game or clear all marks
- [ ] Bingo submission notification pushes to host automatically (rather than polling)

## Phase 4 — Configurable Topics

Allow the host to customize topics without editing source code.

- [ ] Build a pre-session topic editor UI (textarea or drag-and-drop list)
- [ ] Persist topics to the server session so all players get the same topic pool
- [ ] Support more/fewer than 24 topics (adjust board size or pool randomly)

## Phase 5 — Polish & UX

Small improvements that make the experience feel complete.

- [ ] Mobile QR code scanner shortcut on the lobby screen
- [ ] Confetti animation when a player gets bingo
- [ ] Player disconnect/reconnect handling (rejoin with same board preserved)
- [ ] Host view: click a player's mini-board to see their full board in a modal
- [ ] Accessibility pass (keyboard nav, ARIA labels, focus management)

## Phase 6 — Code Quality

Refactor as the app grows beyond a single file.

- [ ] Split `App.jsx` into separate components (`Lobby`, `Board`, `HostView`, `KnowledgeModal`)
- [ ] Extract CSS into a `.css` file or use CSS Modules
- [ ] Add ESLint + Prettier
- [ ] Add Vitest unit tests for `shuffle`, `mkBoard`, `getLines`
