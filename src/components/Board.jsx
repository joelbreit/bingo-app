import { useState } from "react";
import { FREE, RATES, LINES, LINE_NAMES, getLines } from "../config";
import KnowledgeModal from "./KnowledgeModal";

export default function Board({ name, board, marks, subs, onMark, onSubmitBingo, onLeave }) {
  const [pending, setPending] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);

  const lines = getLines(marks);
  const bingoSq = new Set(lines.flat());

  const clickSq = i => {
    if (i === FREE) return;
    setSelectedRating(marks[i] || null);
    setPending(i);
  };

  const confirm = () => {
    if (pending == null || !selectedRating) return;
    onMark(pending, selectedRating);
    setPending(null);
    setSelectedRating(null);
  };

  const cancelModal = () => { setPending(null); setSelectedRating(null); };

  return (
    <>
      <div className="bp">
        <div className="tbar">
          <div className="tlogo">BINGO</div>
          <div className="chip">Playing as <b>{name}</b></div>
        </div>

        {/* Grid */}
        <div className="bingo-grid">
          {board.map((t, i) => {
            const r = marks[i];
            const isFree = i === FREE;
            const inBingo = bingoSq.has(i);
            const ri = RATES.find(x => x.id === r);
            let cls = "sq";
            if (isFree) cls += " sqF";
            else if (r === "new") cls += " sqN";
            else if (r === "partial") cls += " sqP";
            else if (r === "knew") cls += " sqK";
            if (inBingo) cls += " sqB";
            return (
              <div key={i} className={cls} onClick={() => clickSq(i)}>
                {!isFree && ri && <div className="sqe">{ri.icon}</div>}
                <div className="sqt">{isFree ? "FREE" : t}</div>
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="prow">
          <span>{Object.keys(marks).length}/24 marked</span>
          {lines.length > 0 && (
            <span style={{ color: "var(--pi)" }}>
              ✦ {lines.length} bingo{lines.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="pbar">
          <div className="pfil" style={{ width: `${Object.keys(marks).length / 24 * 100}%` }} />
        </div>

        {/* Legend */}
        <div className="leg">
          {RATES.map(r => (
            <div key={r.id} className="lgi">
              <div className="lgd" style={{ background: r.color }} />
              {r.icon} {r.label}
            </div>
          ))}
        </div>

        {/* Bingo Zone */}
        {lines.length > 0 && (
          <div className="bzone">
            <div className="bh">BINGO!</div>
            <div className="bsub2">Select a completed line to notify the host</div>
            <div className="ll">
              {lines.map((line, idx) => {
                const li = LINES.findIndex(l => l.every((v, j) => v === line[j]));
                const done = subs.includes(li);
                return (
                  <div key={idx} className={`litem${done ? " done" : ""}`}>
                    <span style={{ color: done ? "var(--rk)" : "var(--tx)" }}>
                      {LINE_NAMES[li] || `Bingo ${idx + 1}`}
                    </span>
                    <button
                      className="btn bg bsm"
                      disabled={done}
                      style={done ? { color: "var(--rk)", borderColor: "var(--rk)" } : {}}
                      onClick={() => onSubmitBingo(li)}
                    >
                      {done ? "✓ Submitted" : "Submit →"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button className="btn bg bsm" onClick={onLeave}>← Leave</button>
        </div>
      </div>

      {pending != null && (
        <KnowledgeModal
          topic={board[pending]}
          selectedRating={selectedRating}
          onSelect={setSelectedRating}
          onConfirm={confirm}
          onCancel={cancelModal}
          isEdit={!!marks[pending]}
        />
      )}
    </>
  );
}
