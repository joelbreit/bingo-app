import { X, Sparkles, MessageSquareText } from "lucide-react";
import { FREE, RATES, getLines } from "../config";
import RateIcon from "./RateIcon";

export default function PlayerBoardModal({ player, onClose }) {
  if (!player) return null;
  const lines = getLines(player.marks);
  const bingoSq = new Set(lines.flat());
  const marked = Object.keys(player.marks).length;
  const notes = Object.entries(player.marks)
    .filter(([, m]) => m?.n)
    .map(([i, m]) => ({ topic: player.board[+i], note: m.n, r: m.r }));

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-s1 border border-b2 rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-[560px] anim-slide max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-1">
          <div>
            <div className="font-display font-extrabold text-lg">{player.name}</div>
            <div className="text-[10px] text-mu mt-0.5 flex items-center gap-2">
              <span>{marked}/24 marked</span>
              {lines.length > 0 && (
                <span className="text-pink flex items-center gap-1">
                  <Sparkles size={10} /> {lines.length} bingo{lines.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full text-mu hover:text-tx hover:bg-s2"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-1 mt-3">
          {player.board.map((t, i) => {
            const mark = player.marks[i];
            const rate = mark && RATES.find(x => x.id === mark.r);
            const isFree = i === FREE;
            const inBingo = bingoSq.has(i);

            const base = "aspect-square rounded-md border flex flex-col items-center justify-center p-1 text-center overflow-hidden relative";
            let cls = base;
            let style = {};
            if (isFree) cls += " bg-s3 border-s4";
            else if (rate) style = { background: rate.bg, borderColor: rate.color };
            else cls += " bg-s1 border-b1";
            if (inBingo) cls += " outline outline-2 -outline-offset-1 outline-accent";

            return (
              <div key={i} className={cls} style={style}>
                {!isFree && rate && <RateIcon id={rate.id} size={11} strokeWidth={2.25} className="mb-0.5" />}
                <div
                  className={isFree
                    ? "font-display font-black text-[10px] tracking-[2px] text-mu"
                    : "text-[7.5px] leading-[1.35] break-words hyphens-auto"}
                  style={!isFree && rate ? { color: rate.textColor } : undefined}
                >
                  {isFree ? "FREE" : t}
                </div>
                {mark?.n && (
                  <MessageSquareText
                    size={8}
                    className="absolute top-0.5 right-0.5 text-mu"
                  />
                )}
              </div>
            );
          })}
        </div>

        {notes.length > 0 && (
          <>
            <div className="font-display font-extrabold text-[10px] tracking-[2px] text-mu uppercase mt-4 mb-2">Notes</div>
            <div className="flex flex-col gap-1.5">
              {notes.map((n, idx) => {
                const rate = RATES.find(x => x.id === n.r);
                return (
                  <div key={idx} className="bg-s2 border border-b1 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      {rate && <RateIcon id={rate.id} size={11} className="shrink-0" />}
                      <span className="text-[11px] font-semibold" style={{ color: rate?.color }}>{n.topic}</span>
                    </div>
                    <div className="text-[11.5px] leading-relaxed text-tx whitespace-pre-wrap">{n.note}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
