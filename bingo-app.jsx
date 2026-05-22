import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════
   CONFIGURATION — edit per presentation
═══════════════════════════════════════════════════════════ */
const SESSION = "demo2024";
const TOPICS = [
  "Zero-shot prompting","RAG pipelines","Token limits","Embedding models",
  "Fine-tuning basics","Chain-of-thought","Hallucinations","System prompts",
  "RLHF training","Tool calling","Semantic search","Vector databases",
  "Model quantization","Prompt injection","Temperature param",
  "Multimodal AI","Agent loops","Structured outputs",
  "Batch inference","Retrieval-Aug. Gen","Eval frameworks",
  "Inference costs","Open-source LLMs","Safety alignment",
];
/* ═══════════════════════════════════════════════════════════ */

const FREE = 12;
const LINES = [
  [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],
  [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],
  [0,6,12,18,24],[4,8,12,16,20],
];
const LINE_NAMES = [
  "Row 1","Row 2","Row 3","Row 4","Row 5",
  "Col B","Col I","Col N","Col G","Col O",
  "Diagonal ↘","Diagonal ↙",
];
const RATES = [
  { id:"new",     icon:"🚀", label:"New to me",         color:"#ef4444" },
  { id:"partial", icon:"💡", label:"Partly familiar",   color:"#f59e0b" },
  { id:"knew",    icon:"⭐", label:"Already knew this", color:"#22c55e" },
];

const shuffle = a => {
  const b = [...a];
  for (let i=b.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [b[i],b[j]] = [b[j],b[i]];
  }
  return b;
};
const mkBoard = () => { const s=shuffle(TOPICS); return [...s.slice(0,12),"FREE",...s.slice(12)]; };
const getLines = m => LINES.filter(l => l.every(i => i===FREE || !!m[i]));

const makeMock = () => ["Alice","Bob","Cara","Dev","Emma","Frank"].map(name => {
  const board = mkBoard();
  const marks = {};
  let c=0, n=4+Math.floor(Math.random()*8);
  for (let i=0; i<25&&c<n; i++) {
    if (i===FREE) continue;
    if (Math.random()>.48) { marks[i]=RATES[Math.floor(Math.random()*3)].id; c++; }
  }
  return { id:`${name}_mock`, name, board, marks };
});

/* ─── CSS ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=JetBrains+Mono:wght@300;400;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0a0a0f; --s1:#111117; --s2:#18181f; --s3:#1e1e27; --s4:#26263a;
  --a:#10b981; --pi:#e879f9;
  --tx:#f0f0f5; --mu:#64648a;
  --b1:rgba(255,255,255,.06); --b2:rgba(255,255,255,.12);
  --rn:#ef4444; --rp:#f59e0b; --rk:#22c55e;
  --fnt:'JetBrains Mono',monospace; --hfnt:'Syne',sans-serif;
}
html,body{background:var(--bg);min-height:100vh;font-family:var(--fnt);color:var(--tx);overflow-x:hidden}
.app{min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:16px 12px;
  background:radial-gradient(ellipse 80% 50% at 50% -5%,rgba(16,185,129,.06),transparent 70%)}

/* ── LOBBY ── */
.lobby{display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:90vh;gap:28px;width:100%;max-width:380px}
.biglogo{font-family:var(--hfnt);font-weight:900;font-size:72px;letter-spacing:16px;
  color:var(--a);line-height:1;text-align:center;padding-left:16px}
.logsub{font-size:10px;letter-spacing:4px;color:var(--mu);text-transform:uppercase;
  text-align:center;margin-top:-6px}
.card{background:var(--s1);border:1px solid var(--b1);border-radius:16px;padding:22px;
  width:100%;display:flex;flex-direction:column;gap:14px}
.fl{font-size:9.5px;letter-spacing:2px;color:var(--mu);text-transform:uppercase;margin-bottom:5px}
.inp{width:100%;background:var(--s2);border:1.5px solid var(--b1);border-radius:10px;
  padding:12px 14px;color:var(--tx);font-family:var(--fnt);font-size:14px;outline:none;
  transition:border-color .2s,box-shadow .2s}
.inp:focus{border-color:var(--a);box-shadow:0 0 0 3px rgba(16,185,129,.1)}
.btn{border:none;border-radius:10px;padding:11px 18px;font-family:var(--hfnt);font-size:14px;
  font-weight:800;cursor:pointer;letter-spacing:1.5px;transition:all .2s;
  display:inline-flex;align-items:center;justify-content:center;gap:7px}
.ba{background:var(--a);color:#0a0a0f}
.ba:hover{filter:brightness(1.1);transform:translateY(-1px)}
.ba:disabled{opacity:.3;cursor:not-allowed;transform:none;filter:none}
.bg{background:transparent;color:var(--mu);border:1px solid var(--b1);
  font-family:var(--fnt);font-size:11px;font-weight:400;letter-spacing:.5px}
.bg:hover{color:var(--tx);border-color:var(--b2)}
.bsm{padding:6px 12px;font-size:10px;border-radius:8px}
.sep{height:1px;background:var(--b1)}
.hint{font-size:10px;color:var(--mu);text-align:center}
.instr{font-size:11px;color:var(--mu);line-height:1.9;text-align:center}

/* ── BOARD PAGE ── */
.bp{width:100%;max-width:540px}
.tbar{display:flex;justify-content:space-between;align-items:center;padding:10px 0 14px}
.tlogo{font-family:var(--hfnt);font-weight:900;font-size:20px;letter-spacing:8px;color:var(--a)}
.chip{background:var(--s1);border:1px solid var(--b1);border-radius:20px;padding:5px 12px;
  font-size:10px;color:var(--mu)}
.chip b{color:var(--tx)}

/* ── GRID ── */
.bingo-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:3px}
.sq{aspect-ratio:1;background:var(--s1);border:1px solid var(--b1);border-radius:6px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  cursor:pointer;transition:border-color .15s,background .15s;padding:3px;
  text-align:center;overflow:hidden;-webkit-tap-highlight-color:transparent;user-select:none}
.sq:hover:not(.sqF){border-color:rgba(16,185,129,.4);background:rgba(16,185,129,.04)}
.sq:active:not(.sqF){transform:scale(.93)}
.sqt{font-size:8px;line-height:1.4;color:var(--tx);pointer-events:none;word-break:break-word;hyphens:auto}
.sqe{font-size:12px;pointer-events:none;line-height:1;margin-bottom:2px}
.sqF{background:var(--s3);border-color:var(--s4);cursor:default}
.sqF .sqt{font-family:var(--hfnt);font-size:11px;font-weight:900;color:var(--mu);letter-spacing:2px}
.sqN{background:rgba(239,68,68,.12) !important;border-color:var(--rn) !important}
.sqN .sqt{color:#fca5a5}
.sqP{background:rgba(245,158,11,.12) !important;border-color:var(--rp) !important}
.sqP .sqt{color:#fcd34d}
.sqK{background:rgba(34,197,94,.12) !important;border-color:var(--rk) !important}
.sqK .sqt{color:#86efac}
.sqB{outline:2px solid var(--a);outline-offset:-1px;animation:pulse 2s ease infinite}
@keyframes pulse{0%,100%{outline-color:rgba(16,185,129,.5)}50%{outline-color:rgba(16,185,129,1)}}

.prow{display:flex;justify-content:space-between;font-size:10px;color:var(--mu);margin:12px 0 4px}
.pbar{height:2px;background:var(--s2);border-radius:2px;overflow:hidden;margin-bottom:12px}
.pfil{height:100%;background:var(--a);border-radius:2px;transition:width .5s}
.leg{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px}
.lgi{display:flex;align-items:center;gap:5px;font-size:9px;color:var(--mu)}
.lgd{width:8px;height:8px;border-radius:2px}

/* ── BINGO ZONE ── */
.bzone{background:var(--s1);border:1px solid rgba(232,121,249,.18);border-radius:14px;
  padding:18px;margin-bottom:10px;animation:fadeIn .3s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.bh{font-family:var(--hfnt);font-size:28px;font-weight:900;letter-spacing:12px;
  color:var(--pi);text-align:center;padding-left:12px}
.bsub2{font-size:10px;color:var(--mu);text-align:center;margin:5px 0 14px;letter-spacing:.3px}
.ll{display:flex;flex-direction:column;gap:6px}
.litem{display:flex;align-items:center;justify-content:space-between;background:var(--s2);
  border:1px solid var(--b1);border-radius:8px;padding:9px 12px;font-size:11px;transition:border-color .2s}
.litem.done{border-color:var(--rk);background:rgba(34,197,94,.05)}

/* ── MODAL ── */
.ov{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(5px);
  display:flex;align-items:flex-end;justify-content:center;z-index:999;padding:0}
@media(min-width:520px){.ov{align-items:center;padding:16px}}
.modal{background:var(--s1);border:1px solid var(--b2);border-radius:16px 16px 0 0;
  padding:24px;width:100%;max-width:400px;animation:slideUp .22s ease}
@media(min-width:520px){.modal{border-radius:16px;animation:fadeIn .2s ease}}
@keyframes slideUp{from{transform:translateY(50px);opacity:0}to{transform:translateY(0);opacity:1}}
.mtp{font-size:15px;font-weight:600;margin-bottom:3px;line-height:1.5}
.mq{font-size:9.5px;color:var(--mu);letter-spacing:2px;text-transform:uppercase;margin-bottom:16px}
.ropts{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
.ropt{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;
  border:1.5px solid transparent;cursor:pointer;transition:all .15s;background:var(--s2)}
.ropt:hover{border-color:var(--b2)}
.ropt.rsel{border-color:currentColor}
.re{font-size:20px;flex-shrink:0;line-height:1}
.rl{font-size:13px;color:var(--tx)}
.mbs{display:flex;gap:8px}
.mbs .btn{flex:1;padding:11px}

/* ── HOST ── */
.hp{width:100%;max-width:920px}
.htop{display:flex;justify-content:space-between;align-items:flex-start;
  padding:14px 0 20px;border-bottom:1px solid var(--b1);margin-bottom:20px}
.hlog{font-family:var(--hfnt);font-size:18px;font-weight:900;letter-spacing:3px;color:var(--a)}
.stag{font-size:10px;color:var(--mu);letter-spacing:1px;margin-top:3px}
.krow{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:24px}
.kpi{background:var(--s1);border:1px solid var(--b1);border-radius:12px;padding:16px}
.knum{font-family:var(--hfnt);font-size:30px;font-weight:900}
.klbl{font-size:9px;color:var(--mu);letter-spacing:1.5px;text-transform:uppercase;margin-top:4px}
.sh{font-family:var(--hfnt);font-size:10px;font-weight:800;letter-spacing:2px;
  color:var(--mu);text-transform:uppercase;margin-bottom:10px}
.pg{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-bottom:24px}
.pc{background:var(--s1);border:1px solid var(--b1);border-radius:12px;padding:12px}
.pn{font-family:var(--hfnt);font-size:12px;font-weight:800;margin-bottom:8px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mg{display:grid;grid-template-columns:repeat(5,1fr);gap:2px;margin-bottom:6px}
.ms{aspect-ratio:1;border-radius:2px;background:var(--s3)}
.ms.new{background:var(--rn)}.ms.partial{background:var(--rp)}.ms.knew{background:var(--rk)}.ms.free{background:var(--s4)}
.ps{font-size:9px;color:var(--mu);display:flex;justify-content:space-between}
.kbars{display:flex;flex-direction:column;gap:6px;margin-bottom:24px}
.kbrow{display:flex;align-items:center;gap:8px}
.kbtl{font-size:9.5px;color:var(--mu);width:105px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:0}
.kbtr{flex:1;height:12px;background:var(--s2);border-radius:3px;overflow:hidden;display:flex}
.kbseg{height:100%;transition:width .4s ease}
.kbcnt{font-size:9.5px;color:var(--mu);width:22px;text-align:right;flex-shrink:0}
.bsec{background:var(--s1);border:1px solid var(--b1);border-radius:12px;padding:12px;margin-bottom:24px}
.bi{display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--b1)}
.bi:last-child{border-bottom:none}
.bin{font-size:12px;font-weight:600}
.bid{font-size:9.5px;color:var(--mu);margin-top:2px}
.vbtn{background:rgba(34,197,94,.1);color:var(--rk);border:1px solid rgba(34,197,94,.25);
  border-radius:7px;padding:6px 12px;font-family:var(--fnt);font-size:10px;cursor:pointer;transition:all .2s}
.vbtn:hover{background:rgba(34,197,94,.2)}
.vbtn.vd{opacity:.5;cursor:default}
.empty{text-align:center;color:var(--mu);padding:60px 0;font-size:11px;line-height:2.5}
.badge{display:inline-flex;align-items:center;gap:4px;background:rgba(16,185,129,.12);
  color:var(--a);border:1px solid rgba(16,185,129,.2);border-radius:20px;
  padding:3px 10px;font-size:9.5px;margin-left:8px}
`;

/* ═══════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════ */
export default function App() {
  const [screen, setScreen]   = useState("lobby");
  const [name,   setName]     = useState("");
  const [board,  setBoard]    = useState([]);
  const [marks,  setMarks]    = useState({});
  const [pending,setPending]  = useState(null);
  const [pr,     setPr]       = useState(null);  // pending rating
  const [subs,   setSubs]     = useState([]);    // submitted bingo line indices
  const [livePl, setLivePl]   = useState([]);    // players from BroadcastChannel / WS
  const [mockPl]              = useState(makeMock);
  const [valid,  setValid]    = useState({});
  const ch = useRef(null);

  // ── BroadcastChannel (same-device multi-tab demo) ──
  // In production, swap this for a WebSocket connection to bingo-server.js
  useEffect(() => {
    try {
      const c = new BroadcastChannel(`bingo-${SESSION}`);
      ch.current = c;
      c.onmessage = ({ data }) => {
        if (data.t === "ps") {
          setLivePl(prev => {
            const i = prev.findIndex(p => p.id === data.p.id);
            if (i >= 0) { const a=[...prev]; a[i]=data.p; return a; }
            return [...prev, data.p];
          });
        }
      };
      return () => c.close();
    } catch (_) {}
  }, []);

  const send = useCallback((b, m) => {
    ch.current?.postMessage({ t:"ps", p:{ id:`${name}_${SESSION}`, name, board:b||board, marks:m||marks } });
  }, [name, board, marks]);

  // ── Actions ──
  const join = () => {
    if (!name.trim()) return;
    const b = mkBoard();
    setBoard(b); setMarks({}); setSubs([]);
    setScreen("board");
    setTimeout(() => send(b, {}), 60);
  };

  const clickSq = i => {
    if (i === FREE) return;
    setPr(marks[i] || null);
    setPending(i);
  };

  const confirm = () => {
    if (pending == null || !pr) return;
    const m = { ...marks, [pending]: pr };
    setMarks(m);
    send(board, m);
    setPending(null); setPr(null);
  };

  const cancelModal = () => { setPending(null); setPr(null); };

  const lines  = getLines(marks);
  const bingoSq = new Set(lines.flat());
  const allPl  = [...mockPl, ...livePl];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="app">

        {/* ─────────────── LOBBY ─────────────── */}
        {screen === "lobby" && (
          <div className="lobby">
            <div>
              <div className="biglogo">BINGO</div>
              <div className="logsub">presentation edition · {SESSION}</div>
            </div>
            <div className="card">
              <div>
                <div className="fl">Your name</div>
                <input className="inp" placeholder="Enter your name…"
                  value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && join()} autoFocus />
              </div>
              <button className="btn ba" onClick={join} disabled={!name.trim()}>
                Get My Board →
              </button>
              <div className="sep" />
              <button className="btn bg" style={{ width:"100%" }} onClick={() => setScreen("host")}>
                📊 Host Dashboard
              </button>
            </div>
            <div className="instr">
              Mark squares as topics are covered.<br />
              Rate your prior knowledge on each one.
            </div>
            <div className="hint">bingo.joelbreit.com/{SESSION}</div>
          </div>
        )}

        {/* ─────────────── BOARD ─────────────── */}
        {screen === "board" && (
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
                  if (isFree)          cls += " sqF";
                  else if (r==="new")  cls += " sqN";
                  else if (r==="partial") cls += " sqP";
                  else if (r==="knew") cls += " sqK";
                  if (inBingo)         cls += " sqB";
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
                  <span style={{ color:"var(--pi)" }}>
                    ✦ {lines.length} bingo{lines.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="pbar">
                <div className="pfil" style={{ width:`${Object.keys(marks).length/24*100}%` }} />
              </div>

              {/* Legend */}
              <div className="leg">
                {RATES.map(r => (
                  <div key={r.id} className="lgi">
                    <div className="lgd" style={{ background:r.color }} />
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
                      const li = LINES.findIndex(l => l.every((v,j) => v === line[j]));
                      const done = subs.includes(li);
                      return (
                        <div key={idx} className={`litem${done ? " done" : ""}`}>
                          <span style={{ color: done ? "var(--rk)" : "var(--tx)" }}>
                            {LINE_NAMES[li] || `Bingo ${idx+1}`}
                          </span>
                          <button
                            className="btn bg bsm"
                            disabled={done}
                            style={done ? { color:"var(--rk)", borderColor:"var(--rk)" } : {}}
                            onClick={() => setSubs(p => [...p, li])}
                          >
                            {done ? "✓ Submitted" : "Submit →"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginTop:16 }}>
                <button className="btn bg bsm" onClick={() => setScreen("lobby")}>
                  ← Leave
                </button>
              </div>
            </div>

            {/* Knowledge Modal */}
            {pending != null && (
              <div className="ov" onClick={e => e.target === e.currentTarget && cancelModal()}>
                <div className="modal">
                  <div className="mtp">{board[pending]}</div>
                  <div className="mq">How well did you know this?</div>
                  <div className="ropts">
                    {RATES.map(r => (
                      <div
                        key={r.id}
                        className={`ropt${pr === r.id ? " rsel" : ""}`}
                        style={{ color: r.color }}
                        onClick={() => setPr(r.id)}
                      >
                        <span className="re">{r.icon}</span>
                        <span className="rl">{r.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mbs">
                    <button className="btn bg" onClick={cancelModal}>Cancel</button>
                    <button className="btn ba" onClick={confirm} disabled={!pr}>
                      {marks[pending] ? "Update" : "Mark Off"} ✓
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ─────────────── HOST ─────────────── */}
        {screen === "host" && (
          <HostView
            players={allPl}
            valid={valid}
            setValid={setValid}
            onExit={() => setScreen("lobby")}
          />
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOST DASHBOARD
═══════════════════════════════════════════════════════════ */
function HostView({ players, valid, setValid, onExit }) {
  const total  = players.reduce((s,p) => s + Object.keys(p.marks).length, 0);
  const bPl    = players.filter(p => getLines(p.marks).length > 0);

  // Aggregate knowledge per topic across all players
  const topicMap = {};
  for (const p of players) {
    for (const [k, v] of Object.entries(p.marks)) {
      const t = p.board[+k];
      if (!t || t === "FREE") continue;
      if (!topicMap[t]) topicMap[t] = { new:0, partial:0, knew:0 };
      topicMap[t][v] = (topicMap[t][v] || 0) + 1;
    }
  }
  const topicStats = Object.entries(topicMap)
    .map(([t, c]) => ({
      t,
      n: c.new||0, p: c.partial||0, k: c.knew||0,
      tot: (c.new||0)+(c.partial||0)+(c.knew||0)
    }))
    .sort((a,b) => b.tot - a.tot)
    .slice(0, 14);

  return (
    <div className="hp">
      <div className="htop">
        <div>
          <div className="hlog">
            Host Dashboard
            <span className="badge">● Live</span>
          </div>
          <div className="stag">Session · {SESSION}</div>
        </div>
        <button className="btn bg bsm" onClick={onExit}>← Exit</button>
      </div>

      {/* KPIs */}
      <div className="krow">
        <div className="kpi">
          <div className="knum" style={{ color:"var(--a)" }}>{players.length}</div>
          <div className="klbl">Players joined</div>
        </div>
        <div className="kpi">
          <div className="knum" style={{ color:"var(--rp)" }}>{total}</div>
          <div className="klbl">Topics marked</div>
        </div>
        <div className="kpi">
          <div className="knum" style={{ color:"var(--pi)" }}>{bPl.length}</div>
          <div className="klbl">Bingos claimed</div>
        </div>
      </div>

      {/* Player Mini-Boards */}
      <div className="sh">Live players</div>
      <div className="pg">
        {players.length === 0 ? (
          <div className="empty" style={{ gridColumn:"1/-1" }}>
            Waiting for players to join…<br />
            <span style={{ fontSize:9 }}>Open a new tab and join as a player to test</span>
          </div>
        ) : players.map(p => {
          const mc = Object.keys(p.marks).length;
          const bl = getLines(p.marks).length;
          return (
            <div key={p.id} className="pc">
              <div className="pn">{p.name}</div>
              <div className="mg">
                {Array.from({ length:25 }, (_, i) => {
                  const f = i === FREE;
                  const r = p.marks[i];
                  let cls = "ms";
                  if (f) cls += " free";
                  else if (r) cls += ` ${r}`;
                  return <div key={i} className={cls} />;
                })}
              </div>
              <div className="ps">
                <span>{mc}/24</span>
                {bl > 0 && <span style={{ color:"var(--pi)" }}>✦×{bl}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Knowledge Breakdown */}
      {topicStats.length > 0 && (
        <>
          <div className="sh">Knowledge breakdown</div>
          <div className="leg" style={{ marginBottom:10 }}>
            {[["var(--rn)","🚀","New to me"],["var(--rp)","💡","Partly familiar"],["var(--rk)","⭐","Already knew"]].map(([c,e,l]) => (
              <div key={l} className="lgi">
                <div className="lgd" style={{ background:c }}/>{e} {l}
              </div>
            ))}
          </div>
          <div className="kbars">
            {topicStats.map(({ t, n, p, k, tot }) => (
              <div key={t} className="kbrow">
                <div className="kbtl">{t}</div>
                <div className="kbtr">
                  {n>0 && <div className="kbseg" style={{ width:`${n/tot*100}%`, background:"var(--rn)" }}/>}
                  {p>0 && <div className="kbseg" style={{ width:`${p/tot*100}%`, background:"var(--rp)" }}/>}
                  {k>0 && <div className="kbseg" style={{ width:`${k/tot*100}%`, background:"var(--rk)" }}/>}
                </div>
                <div className="kbcnt">{tot}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Bingo Submissions */}
      {bPl.length > 0 && (
        <>
          <div className="sh">Bingo submissions</div>
          <div className="bsec">
            {bPl.map(p => {
              const ls = getLines(p.marks);
              return (
                <div key={p.id} className="bi">
                  <div>
                    <div className="bin">{p.name}</div>
                    <div className="bid">
                      {ls.length} line{ls.length > 1 ? "s" : ""} complete ·{" "}
                      {Object.keys(p.marks).length}/24 squares marked
                    </div>
                  </div>
                  <button
                    className={`vbtn${valid[p.id] ? " vd" : ""}`}
                    onClick={() => !valid[p.id] && setValid(v => ({ ...v, [p.id]: true }))}
                  >
                    {valid[p.id] ? "✓ Validated" : "Validate"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
