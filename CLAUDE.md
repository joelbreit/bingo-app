# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation

- [`docs/roadmap.md`](docs/roadmap.md) — phased feature plan (Phase 0 cleanup → Phase 5 polish)
- [`docs/cloud.md`](docs/cloud.md) — AWS architecture, DynamoDB schema, SAM template skeleton, logging/tagging standards
- [`docs/dev.md`](docs/dev.md) — setup, local dev, deploying the backend, viewing AWS resources and logs

**Always update the relevant docs when making changes.** New Lambda functions → `cloud.md`. Completed features → `roadmap.md`. New setup steps or deploy changes → `dev.md`.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Dev server (http://localhost:5173) with hot reload
npm run build     # Production build to dist/
npm run preview   # Serve production build locally
```

No test or lint scripts are configured.

## Architecture

Single-page React 19 app built with Vite. Code is split: `src/App.jsx` is a thin shell, screens live in `src/components/` (Lobby, Board, HostView, KnowledgeModal, PlayerBoardModal, ThemeToggle, RateIcon), shared state is in `src/hooks/` (`useSession` for transport, `useTheme` for dark/light), and constants are in `src/config.js`.

### Three screens

1. **Lobby** — at the root, host creates a session (id, optional host code, topic list); at `/{id}`, players enter their name
2. **Board** — player's shuffled 5×5 bingo grid; clicking squares opens a knowledge-rating modal with optional note
3. **Host Dashboard** — live view of all players' boards, topic coverage, knowledge breakdown, and bingo submissions; click a mini-board to open the player's full board in a modal

### Key data structures

- `TOPICS` — default topic pool; sessions can override via host editor (stored in DynamoDB session record)
- `marks` — sparse object `{ squareIndex: { r: ratingId, n: noteOrNull } }` tracking each player's rated squares
- `RATES` — 3 rating levels (new/partial/knew); colors and bg/text variants reference CSS variables so they swap with theme
- `LINES` — 12 winning combinations (5 rows + 5 cols + 2 diagonals); `getLines()` finds completed ones
- `revealedTopics` — host-controlled list of topics players can mark off

### Communication

`src/hooks/useSession.js` abstracts transport. With `VITE_WS_URL` set, it uses WebSocket against the AWS backend (see `docs/cloud.md`). Without it, it falls back to `BroadcastChannel` for multi-tab local dev.

### Styling

Tailwind CSS v4 via `@tailwindcss/vite`. Design tokens are declared in `src/index.css` under `@theme` and themed for dark (default) / light by overriding `--color-*` variables inside a `.light` block — Tailwind utility classes auto-track those variables. `useTheme` toggles the `.light` / `.dark` class on `<html>` and persists to localStorage. Initial theme is applied in `src/main.jsx` before the React render to avoid FOUC. Icons from `lucide-react`. Fonts: Syne (display) + JetBrains Mono (body), loaded from Google Fonts. Confetti from `canvas-confetti`.

### Configuration (`src/config.js`)

- `SESSION` — first URL path segment (e.g. `/demo2026` → `demo2026`); falls back to `"demo2026"` at root
- `AT_ROOT` — true when no path segment; lobby shows session-creation UI instead of join UI
- `TOPICS` — default topic pool used when a session has no custom topics
- `FREE` — index of the center free square (always 12)
- `RATES` — rating levels with CSS-variable color references (theme-aware)
