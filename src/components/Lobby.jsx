import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { SESSION, AT_ROOT, TOPICS } from "../config";

const SESSION_URL = `${window.location.origin}/${SESSION}`;
const HC_KEY = `bingo-hc-${SESSION}`;
const API_URL = import.meta.env.VITE_API_URL;

const genId = () => Math.random().toString(36).slice(2, 8);

export default function Lobby({ name, setName, onJoin, onHostView }) {
  const qrRef = useRef();

  // Session creation (AT_ROOT only)
  const [newId, setNewId] = useState(genId);
  const [newCode, setNewCode] = useState("");
  const [topicsText, setTopicsText] = useState(TOPICS.join("\n"));

  // Existing sessions list
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Host code prompt
  const [showPrompt, setShowPrompt] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    if (!AT_ROOT && qrRef.current) {
      QRCode.toCanvas(qrRef.current, SESSION_URL, {
        width: 160,
        margin: 1,
        color: { dark: "#10b981", light: "#0a0a0f" },
      });
    }
  }, []);

  useEffect(() => {
    if (!AT_ROOT || !API_URL) return;
    setSessionsLoading(true);
    fetch(`${API_URL}/sessions`)
      .then(r => r.json())
      .then(data => setSessions(data.sessions || []))
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, []);

  const parsedTopics = topicsText.split("\n").map(t => t.trim()).filter(Boolean);
  const topicsValid = parsedTopics.length >= 24;
  const idInUse = sessions.some(s => s.id === newId.trim());

  const createSession = () => {
    if (!topicsValid || idInUse) return;
    const id = newId.trim() || genId();
    localStorage.setItem(`bingo-hc-${id}`, newCode);
    localStorage.setItem(`bingo-topics-${id}`, JSON.stringify(parsedTopics));
    window.location.href = `/${id}#host`;
  };

  const handleHostDashboard = () => {
    const stored = localStorage.getItem(HC_KEY);
    if (!stored) { onHostView(); return; }
    setShowPrompt(true);
  };

  const verifyCode = () => {
    if (codeInput === localStorage.getItem(HC_KEY)) {
      setShowPrompt(false);
      onHostView();
    } else {
      setCodeError(true);
    }
  };

  return (
    <>
      <div className="lobby">
        <div>
          <div className="biglogo">BINGO</div>
          <div className="logsub">
            {AT_ROOT ? "presentation edition" : `presentation edition · ${SESSION}`}
          </div>
        </div>

        {AT_ROOT ? (
          <>
            {/* Existing sessions */}
            {(sessionsLoading || sessions.length > 0) && (
              <div className="card">
                <div className="fl">Active sessions</div>
                {sessionsLoading ? (
                  <div style={{ fontSize: 11, color: "var(--mu)" }}>Loading…</div>
                ) : sessions.map(s => (
                  <div key={s.id} className="litem">
                    <div>
                      <div style={{ fontSize: 12 }}>/{s.id}</div>
                      <div style={{ fontSize: 9.5, color: "var(--mu)", marginTop: 2 }}>
                        {s.playerCount} player{s.playerCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <a href={`/${s.id}`} className="btn bg bsm" style={{ textDecoration: "none" }}>Join →</a>
                  </div>
                ))}
              </div>
            )}

            <div className="card">
              <div className="fl">Create a session</div>

              {/* Session ID */}
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  className="inp"
                  value={newId}
                  onChange={e => setNewId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createSession()}
                  style={{ flex: 1, borderColor: idInUse ? "var(--rn)" : undefined }}
                  placeholder="session-id"
                />
                <button className="btn bg bsm" onClick={() => setNewId(genId())} title="Randomize">⟳</button>
              </div>
              {idInUse && (
                <div style={{ color: "var(--rn)", fontSize: 11, marginTop: -6 }}>
                  Session ID already in use — join or host the existing session above
                </div>
              )}

              {/* Host code */}
              <div>
                <div className="fl">Host code</div>
                <input
                  className="inp"
                  placeholder="Optional — leave blank for no code"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                />
              </div>

              {/* Topics */}
              <div>
                <div className="fl" style={{ color: topicsValid ? "var(--mu)" : "var(--rn)" }}>
                  Topics — one per line, min 24 ({parsedTopics.length} entered)
                </div>
                <textarea
                  className="inp"
                  value={topicsText}
                  onChange={e => setTopicsText(e.target.value)}
                  rows={8}
                  style={{ resize: "vertical", minHeight: 160, fontFamily: "var(--fnt)", lineHeight: 1.8 }}
                />
              </div>

              <button className="btn ba" onClick={createSession} disabled={!newId.trim() || !topicsValid || idInUse}>
                Create Session →
              </button>
            </div>
          </>
        ) : (
          <div className="card">
            <div>
              <div className="fl">Your name</div>
              <input
                className="inp"
                placeholder="Enter your name…"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onJoin()}
                autoFocus
              />
            </div>
            <button className="btn ba" onClick={onJoin} disabled={!name.trim()}>
              Get My Board →
            </button>
            <div className="sep" />
            <button className="btn bg" style={{ width: "100%" }} onClick={handleHostDashboard}>
              📊 Host Dashboard
            </button>
          </div>
        )}

        {!AT_ROOT && (
          <>
            <div className="instr">
              Mark squares as topics are covered.<br />
              Rate your prior knowledge on each one.
            </div>
            <canvas ref={qrRef} style={{ borderRadius: 8 }} />
            <div className="hint">{SESSION_URL}</div>
          </>
        )}
      </div>

      {showPrompt && (
        <div className="ov" onClick={e => e.target === e.currentTarget && setShowPrompt(false)}>
          <div className="modal">
            <div className="mtp">Host Dashboard</div>
            <div className="mq">Enter the host code</div>
            <input
              className="inp"
              type="password"
              placeholder="Host code…"
              value={codeInput}
              onChange={e => { setCodeInput(e.target.value); setCodeError(false); }}
              onKeyDown={e => e.key === "Enter" && verifyCode()}
              autoFocus
              style={{ marginBottom: 8 }}
            />
            {codeError && (
              <div style={{ color: "var(--rn)", fontSize: 11, marginBottom: 8 }}>Incorrect code</div>
            )}
            <div className="mbs">
              <button className="btn bg" onClick={() => setShowPrompt(false)}>Cancel</button>
              <button className="btn ba" onClick={verifyCode} disabled={!codeInput}>Enter →</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
