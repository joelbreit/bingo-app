# Presentation Bingo

React bingo app for live presentations. Guests join with their name, get a shuffled board of topics, mark squares with prior-knowledge ratings, and submit bingo. The host dashboard shows live player progress (same-browser tabs via `BroadcastChannel` for now; WebSocket server planned).

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). Use two tabs to test: join as a player in one, open **Host Dashboard** in the other.

## Configuration

Edit `src/App.jsx` at the top:

- `SESSION` — session id (e.g. `demo2026`)
- `TOPICS` — list of presentation topics (24+ items for a full board)

## Scripts

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Development server with hot reload |
| `npm run build`   | Production build to `dist/`        |
| `npm run preview` | Serve the production build locally |
