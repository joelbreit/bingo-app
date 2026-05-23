import { useState, useEffect, useRef, useCallback } from "react";
import { SESSION } from "../config";

// Wraps the current-device BroadcastChannel transport.
// In Phase 1, swap the internals here for a WebSocket connection —
// the { players, sendState } interface stays the same so no other file changes.
export function useSession() {
  const [players, setPlayers] = useState([]);
  const ch = useRef(null);

  useEffect(() => {
    try {
      const c = new BroadcastChannel(`bingo-${SESSION}`);
      ch.current = c;
      c.onmessage = ({ data }) => {
        if (data.t === "ps") {
          setPlayers(prev => {
            const i = prev.findIndex(p => p.id === data.p.id);
            if (i >= 0) { const a = [...prev]; a[i] = data.p; return a; }
            return [...prev, data.p];
          });
        }
      };
      return () => c.close();
    } catch (_) {}
  }, []);

  const sendState = useCallback((player) => {
    ch.current?.postMessage({ t: "ps", p: player });
  }, []);

  return { players, sendState };
}
