import { useState, useEffect, useRef, useCallback } from "react";
import { SESSION } from "../config";

const WS_URL = import.meta.env.VITE_WS_URL;

export function useSession() {
  const [players, setPlayers] = useState([]);
  const conn = useRef(null);

  useEffect(() => {
    // Use WebSocket if VITE_WS_URL is set, otherwise fall back to BroadcastChannel
    if (WS_URL) {
      const ws = new WebSocket(`${WS_URL}?sessionId=${SESSION}`);
      conn.current = { type: "ws", ws };

      ws.onopen = () => {
        console.log("[ws] connected");
        ws.send(JSON.stringify({ t: "getState" }));
      };
      ws.onmessage = ({ data }) => {
        const msg = JSON.parse(data);
        if (msg.t === "players") {
          setPlayers(msg.players);
        }
      };
      ws.onclose = () => console.log("[ws] disconnected");
      ws.onerror = (e) => console.error("[ws] error", e);

      return () => ws.close();
    }

    // BroadcastChannel fallback for local dev without backend
    try {
      const c = new BroadcastChannel(`bingo-${SESSION}`);
      conn.current = { type: "bc", bc: c };
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
    const c = conn.current;
    if (!c) return;
    if (c.type === "ws" && c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(JSON.stringify({ t: "ps", p: player }));
    } else if (c.type === "bc") {
      c.bc.postMessage({ t: "ps", p: player });
    }
  }, []);

  return { players, sendState, isLive: !!WS_URL };
}
