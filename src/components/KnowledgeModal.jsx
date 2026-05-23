import { RATES } from "../config";

export default function KnowledgeModal({ topic, selectedRating, onSelect, onConfirm, onCancel, isEdit }) {
  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <div className="mtp">{topic}</div>
        <div className="mq">How well did you know this?</div>
        <div className="ropts">
          {RATES.map(r => (
            <div
              key={r.id}
              className={`ropt${selectedRating === r.id ? " rsel" : ""}`}
              style={{ color: r.color }}
              onClick={() => onSelect(r.id)}
            >
              <span className="re">{r.icon}</span>
              <span className="rl">{r.label}</span>
            </div>
          ))}
        </div>
        <div className="mbs">
          <button className="btn bg" onClick={onCancel}>Cancel</button>
          <button className="btn ba" onClick={onConfirm} disabled={!selectedRating}>
            {isEdit ? "Update" : "Mark Off"} ✓
          </button>
        </div>
      </div>
    </div>
  );
}
