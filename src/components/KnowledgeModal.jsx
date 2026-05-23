import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { RATES } from "../config";
import RateIcon from "./RateIcon";

export default function KnowledgeModal({ topic, selectedRating, initialNote = "", onSelect, onConfirm, onCancel, isEdit }) {
  const [note, setNote] = useState(initialNote);
  useEffect(() => setNote(initialNote), [topic, initialNote]);

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-s1 border border-b2 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md anim-slide">
        <div className="text-base font-semibold leading-snug mb-1">{topic}</div>
        <div className="text-[10px] tracking-[2px] uppercase text-mu mb-4">How well did you know this?</div>

        <div className="flex flex-col gap-1.5 mb-4">
          {RATES.map(r => {
            const sel = selectedRating === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r.id)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl border-[1.5px] bg-s2 hover:border-b2 transition-colors text-left"
                style={{
                  color: r.color,
                  borderColor: sel ? "currentColor" : "transparent",
                }}
              >
                <RateIcon id={r.id} size={20} />
                <span className="text-[13px] text-tx">{r.label}</span>
              </button>
            );
          })}
        </div>

        <label className="block mb-4">
          <span className="block text-[9.5px] tracking-[2px] uppercase text-mu mb-1.5">Note (optional)</span>
          <textarea
            className="w-full bg-s2 border border-b1 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none rounded-lg px-3 py-2 text-[13px] leading-snug resize-y min-h-[64px]"
            placeholder="Any comments?"
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
          />
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-b1 text-mu hover:text-tx hover:border-b2 text-xs tracking-wide"
          >
            <X size={14} /> Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(note.trim() || null)}
            disabled={!selectedRating}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-accent text-bg font-display font-extrabold text-[13px] tracking-[1.5px] hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            {isEdit ? "Update" : "Mark Off"} <Check size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
