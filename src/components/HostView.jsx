import { useState, useEffect } from "react";
import { FREE, SESSION, TOPICS as DEFAULT_TOPICS, getLines } from "../config";

export default function HostView({ players, topics, revealedTopics, onRevealTopic, onReset, onSetTopics, onExit }) {
  const TOPICS = topics || DEFAULT_TOPICS;
  const [valid, setValid] = useState({});
  const [editingTopics, setEditingTopics] = useState(false);
  const [topicsText, setTopicsText] = useState(TOPICS.join("\n"));

  useEffect(() => {
    if (topics) setTopicsText(topics.join("\n"));
  }, [topics]);

  const parsedTopics = topicsText.split("\n").map(t => t.trim()).filter(Boolean);
  const topicsEditValid = parsedTopics.length >= 24;

  const saveTopics = () => {
    if (!topicsEditValid) return;
    onSetTopics(parsedTopics);
    setEditingTopics(false);
  };

  const total = players.reduce((s, p) => s + Object.keys(p.marks).length, 0);
  const bPl = players.filter(p => getLines(p.marks).length > 0);
  const revealedSet = new Set(revealedTopics || []);

  // Aggregate knowledge per topic across all players
  const topicMap = {};
  for (const p of players) {
    for (const [k, v] of Object.entries(p.marks)) {
      const t = p.board[+k];
      if (!t || t === "FREE") continue;
      if (!topicMap[t]) topicMap[t] = { new: 0, partial: 0, knew: 0 };
      topicMap[t][v] = (topicMap[t][v] || 0) + 1;
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
    <div className="hp">
      <div className="htop">
        <div>
          <div className="hlog">
            Host Dashboard
            <span className="badge">● Live</span>
          </div>
          <div className="stag">Session · {SESSION}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="btn bg bsm"
            style={{ color: "var(--rn)", borderColor: "rgba(239,68,68,.3)" }}
            onClick={() => window.confirm("Reset the game? This clears all marks and revealed topics.") && onReset()}
          >
            ↻ Reset
          </button>
          <button className="btn bg bsm" onClick={onExit}>← Exit</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="krow">
        <div className="kpi">
          <div className="knum" style={{ color: "var(--a)" }}>{players.length}</div>
          <div className="klbl">Players joined</div>
        </div>
        <div className="kpi">
          <div className="knum" style={{ color: "var(--rp)" }}>{revealedSet.size}/{TOPICS.length}</div>
          <div className="klbl">Topics covered</div>
        </div>
        <div className="kpi">
          <div className="knum" style={{ color: "var(--pi)" }}>{bPl.length}</div>
          <div className="klbl">Bingos claimed</div>
        </div>
      </div>

      {/* Topic Coverage */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div className="sh" style={{ marginBottom: 0 }}>Topic coverage</div>
        <button className="btn bg bsm" onClick={() => setEditingTopics(e => !e)}>
          {editingTopics ? "Cancel" : "✎ Edit topics"}
        </button>
      </div>

      {editingTopics && (
        <div style={{ marginBottom: 16 }}>
          <div className="fl" style={{ color: topicsEditValid ? "var(--mu)" : "var(--rn)" }}>
            One per line, min 24 ({parsedTopics.length} entered) — applies to new players only
          </div>
          <textarea
            className="inp"
            value={topicsText}
            onChange={e => setTopicsText(e.target.value)}
            rows={10}
            style={{ resize: "vertical", minHeight: 200, fontFamily: "var(--fnt)", lineHeight: 1.8, marginBottom: 8 }}
          />
          <button className="btn ba bsm" onClick={saveTopics} disabled={!topicsEditValid}>
            Save topics →
          </button>
        </div>
      )}

      <div className="tpl">
        {TOPICS.map(topic => {
          const covered = revealedSet.has(topic);
          return (
            <div key={topic} className={`litem${covered ? " done" : ""}`}>
              <span style={{ color: covered ? "var(--rk)" : "var(--tx)" }}>
                {covered ? "✓ " : ""}{topic}
              </span>
              <button
                className="btn bg bsm"
                disabled={covered}
                style={covered ? { color: "var(--rk)", borderColor: "var(--rk)" } : {}}
                onClick={() => onRevealTopic(topic)}
              >
                {covered ? "Covered" : "Reveal"}
              </button>
            </div>
          );
        })}
      </div>
      {revealedSet.size < TOPICS.length && (
        <button
          className="btn ba bsm"
          style={{ marginBottom: 24 }}
          onClick={() => onRevealTopic(TOPICS.filter(t => !revealedSet.has(t)))}
        >
          Reveal All ({TOPICS.length - revealedSet.size} remaining)
        </button>
      )}

      {/* Player Mini-Boards */}
      <div className="sh">Live players</div>
      <div className="pg">
        {players.length === 0 ? (
          <div className="empty" style={{ gridColumn: "1/-1" }}>
            Waiting for players to join…<br />
            <span style={{ fontSize: 9 }}>Open a new tab and join as a player to test</span>
          </div>
        ) : players.map(p => {
          const mc = Object.keys(p.marks).length;
          const bl = getLines(p.marks).length;
          return (
            <div key={p.id} className="pc">
              <div className="pn">{p.name}</div>
              <div className="mg">
                {Array.from({ length: 25 }, (_, i) => {
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
                {bl > 0 && <span style={{ color: "var(--pi)" }}>✦×{bl}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Knowledge Breakdown */}
      {topicStats.length > 0 && (
        <>
          <div className="sh">Knowledge breakdown</div>
          <div className="leg" style={{ marginBottom: 10 }}>
            {[["var(--rn)", "🚀", "New to me"], ["var(--rp)", "💡", "Partly familiar"], ["var(--rk)", "⭐", "Already knew"]].map(([c, e, l]) => (
              <div key={l} className="lgi">
                <div className="lgd" style={{ background: c }} />{e} {l}
              </div>
            ))}
          </div>
          <div className="kbars">
            {topicStats.map(({ t, n, p, k, tot }) => (
              <div key={t} className="kbrow">
                <div className="kbtl">{t}</div>
                <div className="kbtr">
                  {n > 0 && <div className="kbseg" style={{ width: `${n / tot * 100}%`, background: "var(--rn)" }} />}
                  {p > 0 && <div className="kbseg" style={{ width: `${p / tot * 100}%`, background: "var(--rp)" }} />}
                  {k > 0 && <div className="kbseg" style={{ width: `${k / tot * 100}%`, background: "var(--rk)" }} />}
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
