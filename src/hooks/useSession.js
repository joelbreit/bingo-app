import { useState, useEffect, useRef, useCallback } from "react";
import { SESSION } from "../config";

const WS_URL = import.meta.env.VITE_WS_URL;

export function useSession(onReset) {
  const [players, setPlayers] = useState([]);
  const [revealedTopics, setRevealedTopics] = useState(null);
  const conn = useRef(null);
  const revealedRef = useRef(null);
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;

  useEffect(() => {
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
          revealedRef.current = msg.revealedTopics ?? null;
          setRevealedTopics(msg.revealedTopics ?? null);
          if (msg.reset) onResetRef.current?.();
        }
      };
      ws.onclose = () => console.log("[ws] disconnected");
      ws.onerror = (e) => console.error("[ws] error", e);

      return () => ws.close();
    }

    // BroadcastChannel fallback for local dev
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
        if (data.t === "revealed") {
          revealedRef.current = data.topics;
          setRevealedTopics(data.topics);
        }
        if (data.t === "reset") {
          revealedRef.current = null;
          setRevealedTopics(null);
          setPlayers([]);
          onResetRef.current?.();
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

  const revealTopic = useCallback((topicOrTopics) => {
    const c = conn.current;
    if (!c) return;
    const topics = Array.isArray(topicOrTopics) ? topicOrTopics : [topicOrTopics];
    if (c.type === "ws" && c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(JSON.stringify({ t: "reveal", topics }));
    } else if (c.type === "bc") {
      const list = revealedRef.current || [];
      const updated = [...list];
      for (const t of topics) {
        if (!updated.includes(t)) updated.push(t);
      }
      revealedRef.current = updated;
      setRevealedTopics(updated);
      c.bc.postMessage({ t: "revealed", topics: updated });
    }
  }, []);

  const resetGame = useCallback(() => {
    const c = conn.current;
    if (!c) return;
    if (c.type === "ws" && c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(JSON.stringify({ t: "reset" }));
    } else if (c.type === "bc") {
      revealedRef.current = null;
      setRevealedTopics(null);
      setPlayers([]);
      onResetRef.current?.();
      c.bc.postMessage({ t: "reset" });
    }
  }, []);

  return { players, revealedTopics, sendState, revealTopic, resetGame, isLive: !!WS_URL };
}
