import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { LayoutDashboard, ArrowRight, RefreshCcw, X, LogIn, Loader2 } from "lucide-react";
import { SESSION, AT_ROOT, TOPICS } from "../config";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../hooks/useTheme";

const SESSION_URL = `${window.location.origin}/${SESSION}`;
const HC_KEY = `bingo-hc-${SESSION}`;
const API_URL = import.meta.env.VITE_API_URL;

const genId = () => Math.random().toString(36).slice(2, 8);

export default function Lobby({ name, setName, onJoin, onHostView }) {
  const qrRef = useRef();
  const { theme } = useTheme();

  const [newId, setNewId] = useState(genId);
  const [newCode, setNewCode] = useState("");
  const [topicsText, setTopicsText] = useState(TOPICS.join("\n"));

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [showPrompt, setShowPrompt] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    if (!AT_ROOT && qrRef.current) {
      const isLight = theme === "light";
      QRCode.toCanvas(qrRef.current, SESSION_URL, {
        width: 160,
        margin: 1,
        color: {
          dark: isLight ? "#047857" : "#10b981",
          light: isLight ? "#ffffff" : "#0a0a0f",
        },
      });
    }
  }, [theme]);

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
      <div className="fixed top-3 right-3 z-10">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center justify-center min-h-[90vh] gap-7 w-full max-w-[400px]">
        <div>
          <div className="font-display font-black text-[22px] tracking-[8px] text-tx leading-none text-center pl-2 uppercase">Presentation</div>
          <div className="font-display font-black text-[64px] sm:text-[72px] tracking-[14px] sm:tracking-[16px] text-accent leading-none text-center pl-3">BINGO</div>
          {!AT_ROOT && (
            <div className="font-mono text-sm text-tx/60 text-center mt-2 tracking-wide">/{SESSION}</div>
          )}
        </div>

        {AT_ROOT ? (
          <>
            {(sessionsLoading || sessions.length > 0) && (
              <div className="bg-s1 border border-b1 rounded-2xl p-5 w-full flex flex-col gap-3">
                <div className="text-[9.5px] tracking-[2px] text-mu uppercase">Active sessions</div>
                {sessionsLoading ? (
                  <div className="flex items-center gap-2 text-mu py-1">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-[11px]">Loading…</span>
                  </div>
                ) : sessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-s2 border border-b1 rounded-lg px-3 py-2">
                    <div>
                      <div className="text-[12px]">/{s.id}</div>
                      <div className="text-[9.5px] text-mu mt-0.5">
                        {s.playerCount} player{s.playerCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <a
                      href={`/${s.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-b1 text-mu hover:text-tx hover:border-b2 text-[10px]"
                    >
                      Join <ArrowRight size={10} />
                    </a>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-s1 border border-b1 rounded-2xl p-5 w-full flex flex-col gap-3.5">
              <div className="text-[9.5px] tracking-[2px] text-mu uppercase">Create a session</div>

              <div className="flex gap-1.5">
                <input
                  value={newId}
                  onChange={e => setNewId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createSession()}
                  placeholder="session-id"
                  className="flex-1 bg-s2 border-[1.5px] border-b1 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none rounded-lg px-3.5 py-3 text-[14px]"
                  style={{ borderColor: idInUse ? "var(--color-danger)" : undefined }}
                />
                <button
                  onClick={() => setNewId(genId())}
                  title="Randomize"
                  className="inline-flex items-center justify-center px-3 rounded-lg border border-b1 text-mu hover:text-tx hover:border-b2"
                >
                  <RefreshCcw size={14} />
                </button>
              </div>
              {idInUse && (
                <div className="text-danger text-[11px] -mt-2">
                  Session ID already in use — join or host the existing session above
                </div>
              )}

              <div>
                <div className="text-[9.5px] tracking-[2px] text-mu uppercase mb-1.5">Host code</div>
                <input
                  placeholder="Optional — leave blank for no code"
                  value={newCode}
                  onChange={e => setNewCode(e.target.value)}
                  className="w-full bg-s2 border-[1.5px] border-b1 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none rounded-lg px-3.5 py-3 text-[14px]"
                />
              </div>

              <div>
                <div
                  className="text-[9.5px] tracking-[2px] uppercase mb-1.5"
                  style={{ color: topicsValid ? "var(--color-mu)" : "var(--color-danger)" }}
                >
                  Topics — one per line, min 24 ({parsedTopics.length} entered)
                </div>
                <textarea
                  value={topicsText}
                  onChange={e => setTopicsText(e.target.value)}
                  rows={8}
                  className="w-full bg-s2 border-[1.5px] border-b1 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none rounded-lg px-3.5 py-3 text-[14px] leading-[1.8] resize-y min-h-[160px]"
                />
              </div>

              <button
                onClick={createSession}
                disabled={!newId.trim() || !topicsValid || idInUse}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-accent text-bg font-display font-extrabold text-[14px] tracking-[1.5px] hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Create Session <ArrowRight size={16} />
              </button>
            </div>

            <a
              href="https://github.com/joelbreit/bingo-app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] text-mu hover:text-tx transition-colors"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              joelbreit/bingo-app
            </a>
          </>
        ) : (
          <div className="bg-s1 border border-b1 rounded-2xl p-5 w-full flex flex-col gap-3.5">
            <div>
              <div className="text-[9.5px] tracking-[2px] text-mu uppercase mb-1.5">Your name</div>
              <input
                placeholder="Enter your name…"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onJoin()}
                autoFocus
                className="w-full bg-s2 border-[1.5px] border-b1 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none rounded-lg px-3.5 py-3 text-[14px]"
              />
            </div>
            <button
              onClick={onJoin}
              disabled={!name.trim()}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-accent text-bg font-display font-extrabold text-[14px] tracking-[1.5px] hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Get My Board <ArrowRight size={16} />
            </button>
            <div className="h-px bg-b1" />
            <button
              onClick={handleHostDashboard}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-b1 text-mu hover:text-tx hover:border-b2 text-[11px] tracking-wider"
            >
              <LayoutDashboard size={14} /> Host Dashboard
            </button>
          </div>
        )}

        {!AT_ROOT && (
          <>
            <div className="text-[11px] text-mu leading-[1.9] text-center">
              Mark squares as topics are covered.<br />
              Rate your prior knowledge on each one.
            </div>
            <canvas ref={qrRef} className="rounded-lg" />
            <div className="text-[10px] text-mu text-center break-all">{SESSION_URL}</div>
          </>
        )}
      </div>

      {showPrompt && (
        <div
          className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          onClick={e => e.target === e.currentTarget && setShowPrompt(false)}
        >
          <div className="bg-s1 border border-b2 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md anim-slide">
            <div className="text-[15px] font-semibold mb-1">Host Dashboard</div>
            <div className="text-[9.5px] tracking-[2px] uppercase text-mu mb-4">Enter the host code</div>
            <input
              type="password"
              placeholder="Host code…"
              value={codeInput}
              onChange={e => { setCodeInput(e.target.value); setCodeError(false); }}
              onKeyDown={e => e.key === "Enter" && verifyCode()}
              autoFocus
              className="w-full bg-s2 border-[1.5px] border-b1 focus:border-accent focus:ring-2 focus:ring-accent/15 outline-none rounded-lg px-3.5 py-3 text-[14px] mb-2"
            />
            {codeError && (
              <div className="text-danger text-[11px] mb-2">Incorrect code</div>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowPrompt(false)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-b1 text-mu hover:text-tx hover:border-b2 text-[13px]"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={verifyCode}
                disabled={!codeInput}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-accent text-bg font-display font-extrabold text-[13px] tracking-wider disabled:opacity-30"
              >
                <LogIn size={14} /> Enter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
