import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { SESSION } from "../config";

const SESSION_URL = `${window.location.origin}/${SESSION}`;

export default function Lobby({ name, setName, onJoin, onHostView }) {
  const qrRef = useRef();

  useEffect(() => {
    QRCode.toCanvas(qrRef.current, SESSION_URL, {
      width: 160,
      margin: 1,
      color: { dark: "#10b981", light: "#0a0a0f" },
    });
  }, []);

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
      <canvas ref={qrRef} style={{ borderRadius: 8 }} />
      <div className="hint">{SESSION_URL}</div>
    </div>
  );
}
