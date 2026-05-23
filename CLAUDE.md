# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation

- [`docs/roadmap.md`](docs/roadmap.md) — phased feature plan (Phase 0 cleanup → Phase 5 polish)
- [`docs/cloud.md`](docs/cloud.md) — AWS architecture, DynamoDB schema, SAM template skeleton, logging/tagging standards
- [`docs/dev.md`](docs/dev.md) — setup, local dev, deploying the backend, viewing AWS resources and logs

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Dev server (http://localhost:5173) with hot reload
npm run build     # Production build to dist/
npm run preview   # Serve production build locally
```

No test or lint scripts are configured.

## Architecture

Single-page React 19 app built with Vite. The entire application lives in `src/App.jsx` (~600 lines) — all state, components, and styles are in one file.

### Three screens

1. **Lobby** — player enters name to join or goes to host dashboard
2. **Board** — player's shuffled 5×5 bingo grid; clicking squares opens a knowledge-rating modal
3. **Host Dashboard** — live view of all players' boards, topic knowledge breakdown, and bingo submissions

### Key data structures

- `TOPICS` — 24 topic strings; shuffled into a 5×5 board with a FREE center square
- `marks` — sparse object `{ squareIndex: rateIndex }` tracking which squares a player has rated
- `RATES` — 3 rating levels (new/partly/already knew) with colors and emojis
- `LINES` — 12 winning combinations (5 rows + 5 cols + 2 diagonals); `getLines()` finds completed ones
- `livePl` — players received over `BroadcastChannel`; `mockPl` — hardcoded demo players

### Communication

Uses the browser `BroadcastChannel` API so multiple tabs on the same device can simulate multiplayer. A player tab broadcasts its state on every update; the host tab listens and aggregates. A WebSocket backend is planned for real multi-device use (see `docs/plan.md`).

### Styling

All CSS is a single template-literal string injected via a `<style>` tag inside the component. Dark theme with emerald/magenta accents, uses Google Fonts (Syne + JetBrains Mono).

### Configuration (top of App.jsx)

- `SESSION` — session ID string used as the `BroadcastChannel` name
- `TOPICS` — swap these out to change the bingo content
- `FREE` — index of the center free square (always 12)
