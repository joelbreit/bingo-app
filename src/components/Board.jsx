import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Sparkles, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { FREE, SESSION, RATES, LINES, LINE_NAMES, getLines } from "../config";
import KnowledgeModal from "./KnowledgeModal";
import RateIcon from "./RateIcon";
import ThemeToggle from "./ThemeToggle";

const fireConfetti = () => {
  const colors = ["#10b981", "#e879f9", "#8b5cf6", "#f59e0b"];
  confetti({ particleCount: 120, spread: 90, origin: { y: 0.65 }, colors });
  setTimeout(() => confetti({ particleCount: 60, spread: 60, angle: 60, origin: { x: 0, y: 0.7 }, colors }), 180);
  setTimeout(() => confetti({ particleCount: 60, spread: 60, angle: 120, origin: { x: 1, y: 0.7 }, colors }), 360);
};

export default function Board({ name, board, marks, subs, players, revealedTopics, onMark, onSubmitBingo, onLeave }) {
  const [pending, setPending] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);

  const lines = getLines(marks);
  const bingoSq = new Set(lines.flat());
  const others = (players || []).filter(p => p.name !== name);

  const prevBingoCount = useRef(0);
  useEffect(() => {
    if (lines.length > prevBingoCount.current && lines.length > 0) fireConfetti();
    prevBingoCount.current = lines.length;
  }, [lines.length]);

  const clickSq = i => {
    if (i === FREE) return;
    if (revealedTopics && !revealedTopics.includes(board[i])) return;
    setSelectedRating(marks[i]?.r || null);
    setPending(i);
  };

  const confirm = (note) => {
    if (pending == null || !selectedRating) return;
    onMark(pending, selectedRating, note);
    setPending(null);
    setSelectedRating(null);
  };

  const cancelModal = () => { setPending(null); setSelectedRating(null); };

  const marked = Object.keys(marks).length;

  return (
    <>
      <div className="w-full max-w-[560px]">
        <div className="flex justify-between items-center py-2 pb-3.5">
          <div>
            <div className="font-display font-black text-xl tracking-[8px] text-accent">BINGO</div>
            <div className="font-mono text-[11px] text-tx/50 tracking-wide mt-0.5">/{SESSION}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-s1 border border-b1 rounded-full px-3 py-1 text-[10px] text-mu">
              Playing as <b className="text-tx">{name}</b>
            </div>
            <button
              onClick={onLeave}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-b1 text-[10px] text-mu hover:text-tx hover:border-b2"
            >
              <ArrowLeft size={11} /> Lobby
            </button>
            <ThemeToggle />
          </div>
        </div>

        {others.length > 0 && (
          <div className="flex gap-1.5 flex-wrap items-center mb-2.5">
            <span className="text-[9px] text-mu shrink-0">Also here:</span>
            {others.map(p => (
              <span key={p.id} className="bg-s1 border border-b1 rounded-full px-2.5 py-0.5 text-[10px] text-mu">
                <span className="text-tx">{p.name}</span>
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-5 gap-1">
          {board.map((t, i) => {
            const mark = marks[i];
            const r = mark?.r;
            const isFree = i === FREE;
            const isRevealed = isFree || !revealedTopics || revealedTopics.includes(t);
            const inBingo = bingoSq.has(i);
            const rate = RATES.find(x => x.id === r);

            const baseCls = "aspect-square rounded-md border flex flex-col items-center justify-center cursor-pointer transition-colors p-1 text-center overflow-hidden select-none active:scale-[.93]";
            let cls = baseCls;
            let style = {};

            if (isFree) {
              cls += " bg-s3 border-s4 cursor-default";
            } else if (!isRevealed) {
              cls += " bg-s1 border-b1 opacity-30 cursor-not-allowed pointer-events-none";
            } else if (rate) {
              style = { background: rate.bg, borderColor: rate.color, color: rate.textColor };
            } else {
              cls += " bg-s1 border-b1 hover:border-accent/40 hover:bg-accent/5";
            }
            if (inBingo) cls += " outline outline-2 -outline-offset-1 outline-accent anim-pulse-ring";

            return (
              <div
                key={i}
                className={cls}
                style={style}
                onClick={() => clickSq(i)}
              >
                {!isFree && rate && <RateIcon id={rate.id} size={12} strokeWidth={2.25} className="mb-0.5" />}
                <div
                  className={isFree
                    ? "font-display font-black text-[11px] tracking-[2px] text-mu pointer-events-none"
                    : "text-[8px] leading-[1.4] pointer-events-none break-words hyphens-auto"}
                  style={!isFree && rate ? { color: rate.textColor } : undefined}
                >
                  {isFree ? "FREE" : t}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-[10px] text-mu mt-3 mb-1">
          <span>{marked}/24 marked</span>
          {lines.length > 0 && (
            <span className="text-pink flex items-center gap-1">
              <Sparkles size={10} /> {lines.length} bingo{lines.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="h-0.5 bg-s2 rounded overflow-hidden mb-3">
          <div className="h-full bg-accent rounded transition-[width] duration-500" style={{ width: `${marked / 24 * 100}%` }} />
        </div>

        <div className="flex gap-3.5 flex-wrap mb-3.5">
          {RATES.map(r => (
            <div key={r.id} className="flex items-center gap-1.5 text-[9px] text-mu">
              <div className="w-2 h-2 rounded-sm" style={{ background: r.color }} />
              <RateIcon id={r.id} size={10} /> {r.label}
            </div>
          ))}
        </div>

        {lines.length > 0 && (
          <div className="bg-s1 border border-pink/20 rounded-2xl p-4 mb-2.5 anim-fade">
            <div className="font-display font-black text-2xl tracking-[10px] text-pink text-center pl-3">BINGO!</div>
            <div className="text-[10px] text-mu text-center mt-1 mb-3.5">Select a completed line to notify the host</div>
            <div className="flex flex-col gap-1.5">
              {lines.map((line, idx) => {
                const li = LINES.findIndex(l => l.every((v, j) => v === line[j]));
                const done = subs.includes(li);
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between border rounded-lg px-3 py-2 text-[11px] transition-colors ${
                      done ? "bg-rate-knew/5 border-rate-knew" : "bg-s2 border-b1"
                    }`}
                  >
                    <span style={{ color: done ? "var(--color-rate-knew)" : "var(--color-tx)" }}>
                      {LINE_NAMES[li] || `Bingo ${idx + 1}`}
                    </span>
                    <button
                      disabled={done}
                      onClick={() => onSubmitBingo(li)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 text-[10px] rounded-lg border transition ${
                        done
                          ? "text-rate-knew border-rate-knew cursor-default"
                          : "text-mu border-b1 hover:text-tx hover:border-b2"
                      }`}
                    >
                      {done ? <><Check size={10} /> Submitted</> : <>Submit <ArrowRight size={10} /></>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {pending != null && (
        <KnowledgeModal
          topic={board[pending]}
          selectedRating={selectedRating}
          initialNote={marks[pending]?.n || ""}
          onSelect={setSelectedRating}
          onConfirm={confirm}
          onCancel={cancelModal}
          isEdit={!!marks[pending]}
        />
      )}
    </>
  );
}
