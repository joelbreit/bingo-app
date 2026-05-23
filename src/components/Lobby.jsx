import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { SESSION, AT_ROOT } from "../config";

const SESSION_URL = `${window.location.origin}/${SESSION}`;
const HC_KEY = `bingo-hc-${SESSION}`;

const genId = () => Math.random().toString(36).slice(2, 8);

export default function Lobby({ name, setName, onJoin, onHostView }) {
  const qrRef = useRef();

  // Session creation (only used when AT_ROOT)
  const [newId, setNewId] = useState(genId);
  const [newCode, setNewCode] = useState("");

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

  const createSession = () => {
    const id = newId.trim() || genId();
    localStorage.setItem(`bingo-hc-${id}`, newCode);
    window.location.href = `/${id}`;
  };

  const handleHostDashboard = () => {
    const stored = localStorage.getItem(HC_KEY);
    // stored === null → key never set → no code required
    // stored === ""   → created with no code → no code required
    if (!stored) {
      onHostView();
    } else {
      setShowPrompt(true);
    }
  };

  const verifyCode = () => {
    const stored = localStorage.getItem(HC_KEY);
    if (codeInput === stored) {
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
          /* ── Create session ── */
          <div className="card">
            <div className="fl">Create a session</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                className="inp"
                value={newId}
                onChange={e => setNewId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createSession()}
                style={{ flex: 1 }}
                placeholder="session-id"
              />
              <button className="btn bg bsm" onClick={() => setNewId(genId())} title="Randomize">
                ⟳
              </button>
            </div>
            <div>
              <div className="fl">Host code</div>
              <input
                className="inp"
                placeholder="Optional — leave blank for no code"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createSession()}
                type="text"
              />
            </div>
            <button className="btn ba" onClick={createSession} disabled={!newId.trim()}>
              Create Session →
            </button>
          </div>
        ) : (
          /* ── Join session ── */
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

      {/* Host code prompt */}
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
              <div style={{ color: "var(--rn)", fontSize: 11, marginBottom: 8 }}>
                Incorrect code
              </div>
            )}
            <div className="mbs">
              <button className="btn bg" onClick={() => setShowPrompt(false)}>Cancel</button>
              <button className="btn ba" onClick={verifyCode} disabled={!codeInput}>
                Enter →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
