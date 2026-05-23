import { SESSION } from "../config";

export default function Lobby({ name, setName, onJoin, onHostView }) {
  return (
    <div className="lobby">
      <div>
        <div className="biglogo">BINGO</div>
        <div className="logsub">presentation edition · {SESSION}</div>
      </div>
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
        <button className="btn bg" style={{ width: "100%" }} onClick={onHostView}>
          📊 Host Dashboard
        </button>
      </div>
      <div className="instr">
        Mark squares as topics are covered.<br />
        Rate your prior knowledge on each one.
      </div>
      <div className="hint">bingo.joelbreit.com/{SESSION}</div>
    </div>
  );
}
