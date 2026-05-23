import { useState, useCallback } from "react";
import { SESSION, mkBoard, makeMock } from "./config";
import { useSession } from "./hooks/useSession";
import Lobby from "./components/Lobby";
import Board from "./components/Board";
import HostView from "./components/HostView";

// Only the creator's device sends topics to the server (they have the HC key in localStorage)
const isCreator = localStorage.getItem(`bingo-hc-${SESSION}`) !== null;
const localTopicsStr = localStorage.getItem(`bingo-topics-${SESSION}`);
const topicsToSet = isCreator && localTopicsStr ? JSON.parse(localTopicsStr) : null;

export default function App() {
  const [screen, setScreen] = useState("lobby");
  const [name, setName] = useState("");
  const [board, setBoard] = useState([]);
  const [marks, setMarks] = useState({});
  const [subs, setSubs] = useState([]);

  const handleReset = useCallback(() => {
    setMarks({});
    setSubs([]);
  }, []);

  const { players: livePl, topics, revealedTopics, sendState, revealTopic, resetGame, setSessionTopics, isLive } =
    useSession(handleReset, topicsToSet);

  const [mockPl] = useState(() => isLive ? [] : makeMock());
  const allPl = [...mockPl, ...livePl];

  // Prefer server topics → local creator topics → default (null = use config TOPICS)
  const activeTopics = topics || topicsToSet || null;

  const join = () => {
    if (!name.trim()) return;
    const b = mkBoard(activeTopics);
    setBoard(b); setMarks({}); setSubs([]);
    setScreen("board");
    setTimeout(() => sendState({ id: `${name}_${SESSION}`, name, board: b, marks: {} }), 60);
  };

  const handleMark = (squareIndex, rating) => {
    const m = { ...marks, [squareIndex]: rating };
    setMarks(m);
    sendState({ id: `${name}_${SESSION}`, name, board, marks: m });
  };

  return (
    <div className="app">
      {screen === "lobby" && (
        <Lobby
          name={name}
          setName={setName}
          onJoin={join}
          onHostView={() => setScreen("host")}
        />
      )}
      {screen === "board" && (
        <Board
          name={name}
          board={board}
          marks={marks}
          subs={subs}
          players={allPl}
          revealedTopics={revealedTopics}
          onMark={handleMark}
          onSubmitBingo={li => setSubs(p => [...p, li])}
          onLeave={() => setScreen("lobby")}
        />
      )}
      {screen === "host" && (
        <HostView
          players={allPl}
          topics={activeTopics}
          revealedTopics={revealedTopics}
          onRevealTopic={revealTopic}
          onReset={resetGame}
          onSetTopics={setSessionTopics}
          onExit={() => setScreen("lobby")}
        />
      )}
    </div>
  );
}
