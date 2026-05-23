import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { ArrowLeft, RotateCcw, Trash2, Pencil, Check, ArrowRight } from "lucide-react";
import { FREE, SESSION, TOPICS as DEFAULT_TOPICS, RATES, getLines } from "../config";
import { useTheme } from "../hooks/useTheme";
import RateIcon from "./RateIcon";
import ThemeToggle from "./ThemeToggle";
import PlayerBoardModal from "./PlayerBoardModal";

const SESSION_URL = `${window.location.origin}/${SESSION}`;
const rateColorVar = id => id === "new" ? "var(--color-rate-new)" : id === "partial" ? "var(--color-rate-partial)" : id === "knew" ? "var(--color-rate-knew)" : "var(--color-s3)";

export default function HostView({ players, topics, revealedTopics, onRevealTopic, onReset, onSetTopics, onDelete, onExit }) {
  const TOPICS = topics || DEFAULT_TOPICS;
  const [valid, setValid] = useState({});
  const [editingTopics, setEditingTopics] = useState(false);
  const [topicsText, setTopicsText] = useState(TOPICS.join("\n"));
  const [openPlayer, setOpenPlayer] = useState(null);
  const { theme } = useTheme();
  const qrRef = useRef(null);

  useEffect(() => {
    if (topics) setTopicsText(topics.join("\n"));
  }, [topics]);

  useEffect(() => {
    if (!qrRef.current) return;
    const isLight = theme === "light";
    QRCode.toCanvas(qrRef.current, SESSION_URL, {
      width: 224,
      margin: 1,
      color: {
        dark: isLight ? "#047857" : "#10b981",
        light: isLight ? "#ffffff" : "#0a0a0f",
      },
    });
  }, [theme]);

  const parsedTopics = topicsText.split("\n").map(t => t.trim()).filter(Boolean);
  const topicsEditValid = parsedTopics.length >= 24;

  const saveTopics = () => {
    if (!topicsEditValid) return;
    onSetTopics(parsedTopics);
    setEditingTopics(false);
  };

  const bPl = players.filter(p => getLines(p.marks).length > 0);
  const revealedSet = new Set(revealedTopics || []);

  const topicMap = {};
  for (const p of players) {
    for (const [k, v] of Object.entries(p.marks)) {
      const t = p.board[+k];
      if (!t || t === "FREE") continue;
      const rid = v?.r;
      if (!rid) continue;
      if (!topicMap[t]) topicMap[t] = { new: 0, partial: 0, knew: 0 };
      topicMap[t][rid] = (topicMap[t][rid] || 0) + 1;
    }
  }
  const topicStats = Object.entries(topicMap)
    .map(([t, c]) => ({
      t,
      n: c.new || 0, p: c.partial || 0, k: c.knew || 0,
      tot: (c.new || 0) + (c.partial || 0) + (c.knew || 0)
    }))
    .sort((a, b) => b.tot - a.tot)
    .slice(0, 14);

  return (
    <div className="w-full max-w-[1000px]">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-3 py-3.5 pb-5 border-b border-b1 mb-5">
        <div>
          <div className="font-display font-black text-lg tracking-[3px] text-accent flex items-center">
            Host Dashboard
            <span className="inline-flex items-center gap-1 bg-accent/10 text-accent border border-accent/20 rounded-full px-2.5 py-0.5 text-[9.5px] ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Live
            </span>
          </div>
          <div className="font-mono text-sm text-tx/60 tracking-wide mt-0.5">/{SESSION}</div>
        </div>
        <div className="flex gap-1.5 items-center flex-wrap">
          <ThemeToggle />
          <button
            onClick={() => window.confirm("Reset the game? This clears all marks and revealed topics.") && onReset()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] text-danger border-danger/30 hover:border-danger/60 hover:bg-danger/5"
          >
            <RotateCcw size={11} /> Reset
          </button>
          <button
            onClick={onExit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-b1 text-[10px] text-mu hover:text-tx hover:border-b2"
          >
            <ArrowLeft size={11} /> Lobby
          </button>
          <button
            onClick={() => window.confirm("Delete this session? This cannot be undone — all players will be disconnected.") && onDelete()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] text-danger border-danger/50 bg-danger/10 hover:bg-danger/15"
          >
            <Trash2 size={11} /> <span className="hidden sm:inline">Delete session</span><span className="sm:hidden">Delete</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <div className="bg-s1 border border-b1 rounded-xl p-4">
          <div className="font-display font-black text-3xl text-accent">{players.length}</div>
          <div className="text-[9px] text-mu tracking-wider uppercase mt-1">Players joined</div>
        </div>
        <div className="bg-s1 border border-b1 rounded-xl p-4">
          <div className="font-display font-black text-3xl text-rate-partial">{revealedSet.size}/{TOPICS.length}</div>
          <div className="text-[9px] text-mu tracking-wider uppercase mt-1">Topics covered</div>
        </div>
        <div className="bg-s1 border border-b1 rounded-xl p-4">
          <div className="font-display font-black text-3xl text-pink">{bPl.length}</div>
          <div className="text-[9px] text-mu tracking-wider uppercase mt-1">Bingos claimed</div>
        </div>
      </div>

      {/* Two-column layout: sidebar first in DOM (mobile: stacks above), main second */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_256px] lg:gap-6 lg:items-start">

        {/* Sidebar — QR code + Topic coverage */}
        {/* col-start-2 on lg so it appears on the right despite being first in DOM */}
        <div className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-4 flex flex-col gap-4 mb-8 lg:mb-0">

          {/* QR code */}
          <div className="bg-s1 border border-b1 rounded-2xl p-5 flex flex-col items-center gap-3">
            <div className="text-[9.5px] tracking-[2px] text-mu uppercase w-full">Join session</div>
            <canvas ref={qrRef} className="rounded-xl w-full max-w-[224px]" />
            <div className="text-[9px] text-mu font-mono text-center break-all opacity-60">{SESSION_URL}</div>
          </div>

          {/* Topic coverage */}
          <div>
            <div className="flex justify-between items-center mb-2.5">
              <div className="font-display font-extrabold text-[10px] tracking-[2px] text-mu uppercase">Topic coverage</div>
              <button
                onClick={() => setEditingTopics(e => !e)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-b1 text-[10px] text-mu hover:text-tx hover:border-b2"
              >
                {editingTopics ? <>Cancel</> : <><Pencil size={11} /> Edit topics</>}
              </button>
            </div>

            {editingTopics && (
              <div className="mb-4">
                <div className="text-[9.5px] tracking-[2px] uppercase mb-1.5" style={{ color: topicsEditValid ? "var(--color-mu)" : "var(--color-danger)" }}>
                  One per line, min 24 ({parsedTopics.length} entered) — applies to new players only
                </div>
                <textarea
                  value={topicsText}
                  onChange={e => setTopicsText(e.target.value)}
                  rows={10}
                  className="w-full bg-s2 border border-b1 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none rounded-lg px-3.5 py-3 text-[13px] leading-[1.8] resize-y min-h-[200px] mb-2"
                />
                <button
                  onClick={saveTopics}
                  disabled={!topicsEditValid}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg font-display font-extrabold text-[10px] tracking-wider disabled:opacity-30"
                >
                  Save topics <ArrowRight size={11} />
                </button>
              </div>
            )}

            <div className="flex flex-col gap-1 mb-3">
              {TOPICS.map(topic => {
                const covered = revealedSet.has(topic);
                return (
                  <div
                    key={topic}
                    className={`flex items-center justify-between border rounded-lg px-3 py-2 text-[11px] transition-colors ${
                      covered ? "bg-rate-knew/5 border-rate-knew" : "bg-s2 border-b1"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate mr-2" style={{ color: covered ? "var(--color-rate-knew)" : "var(--color-tx)" }}>
                      {covered && <Check size={11} className="shrink-0" />}{topic}
                    </span>
                    <button
                      disabled={covered}
                      onClick={() => onRevealTopic(topic)}
                      className={`shrink-0 px-3 py-1 text-[10px] rounded-lg border transition ${
                        covered
                          ? "text-rate-knew border-rate-knew cursor-default"
                          : "text-mu border-b1 hover:text-tx hover:border-b2"
                      }`}
                    >
                      {covered ? "Covered" : "Reveal"}
                    </button>
                  </div>
                );
              })}
            </div>

            {revealedSet.size < TOPICS.length && (
              <button
                onClick={() => onRevealTopic(TOPICS.filter(t => !revealedSet.has(t)))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-bg font-display font-extrabold text-[10px] tracking-wider"
              >
                Reveal All ({TOPICS.length - revealedSet.size} remaining)
              </button>
            )}
          </div>
        </div>

        {/* Main column — Players, Knowledge breakdown, Bingo submissions */}
        <div className="lg:col-start-1 lg:row-start-1">

          <div className="font-display font-extrabold text-[10px] tracking-[2px] text-mu uppercase mb-2.5">Live players</div>
          <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
            {players.length === 0 ? (
              <div className="text-center text-mu py-16 text-[11px] leading-[2.2] col-span-full">
                Waiting for players to join…<br />
                <span className="text-[9px]">Open a new tab and join as a player to test</span>
              </div>
            ) : players.map(p => {
              const mc = Object.keys(p.marks).length;
              const bl = getLines(p.marks).length;
              return (
                <button
                  key={p.id}
                  onClick={() => setOpenPlayer(p)}
                  className="bg-s1 border border-b1 rounded-xl p-3 text-left hover:border-b2 hover:bg-s2 transition-colors"
                >
                  <div className="font-display font-extrabold text-xs mb-2 truncate">{p.name}</div>
                  <div className="grid grid-cols-5 gap-0.5 mb-1.5">
                    {Array.from({ length: 25 }, (_, i) => {
                      const f = i === FREE;
                      const rid = p.marks[i]?.r;
                      const bg = f ? "var(--color-s4)" : rid ? rateColorVar(rid) : "var(--color-s3)";
                      return <div key={i} className="aspect-square rounded-sm" style={{ background: bg }} />;
                    })}
                  </div>
                  <div className="text-[9px] text-mu flex justify-between">
                    <span>{mc}/24</span>
                    {bl > 0 && <span className="text-pink">✦×{bl}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {topicStats.length > 0 && (
            <>
              <div className="font-display font-extrabold text-[10px] tracking-[2px] text-mu uppercase mb-2.5">Knowledge breakdown</div>
              <div className="flex gap-3.5 flex-wrap mb-3">
                {RATES.map(r => (
                  <div key={r.id} className="flex items-center gap-1.5 text-[9px] text-mu">
                    <div className="w-2 h-2 rounded-sm" style={{ background: r.color }} />
                    <RateIcon id={r.id} size={10} /> {r.label}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5 mb-6">
                {topicStats.map(({ t, n, p, k, tot }) => (
                  <div key={t} className="flex items-center gap-2">
                    <div className="text-[9.5px] text-mu w-[105px] truncate shrink-0">{t}</div>
                    <div className="flex-1 h-3 bg-s2 rounded overflow-hidden flex">
                      {n > 0 && <div className="h-full transition-[width]" style={{ width: `${n / tot * 100}%`, background: "var(--color-rate-new)" }} />}
                      {p > 0 && <div className="h-full transition-[width]" style={{ width: `${p / tot * 100}%`, background: "var(--color-rate-partial)" }} />}
                      {k > 0 && <div className="h-full transition-[width]" style={{ width: `${k / tot * 100}%`, background: "var(--color-rate-knew)" }} />}
                    </div>
                    <div className="text-[9.5px] text-mu w-5 text-right shrink-0">{tot}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {bPl.length > 0 && (
            <>
              <div className="font-display font-extrabold text-[10px] tracking-[2px] text-mu uppercase mb-2.5">Bingo submissions</div>
              <div className="bg-s1 border border-b1 rounded-xl p-3 mb-6">
                {bPl.map((p, idx) => {
                  const ls = getLines(p.marks);
                  return (
                    <div
                      key={p.id}
                      className={`flex justify-between items-center py-2 ${idx < bPl.length - 1 ? "border-b border-b1" : ""}`}
                    >
                      <div>
                        <div className="text-xs font-semibold">{p.name}</div>
                        <div className="text-[9.5px] text-mu mt-0.5">
                          {ls.length} line{ls.length > 1 ? "s" : ""} complete · {Object.keys(p.marks).length}/24 squares marked
                        </div>
                      </div>
                      <button
                        onClick={() => !valid[p.id] && setValid(v => ({ ...v, [p.id]: true }))}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] ${
                          valid[p.id]
                            ? "bg-rate-knew/20 text-rate-knew border-rate-knew/30 cursor-default opacity-70"
                            : "bg-rate-knew/10 text-rate-knew border-rate-knew/25 hover:bg-rate-knew/20"
                        }`}
                      >
                        {valid[p.id] ? <><Check size={11} /> Validated</> : "Validate"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>
      </div>

      {openPlayer && <PlayerBoardModal player={openPlayer} onClose={() => setOpenPlayer(null)} />}
    </div>
  );
}
