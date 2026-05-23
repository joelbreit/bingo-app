import { useState, useCallback } from "react";
import { SESSION, mkBoard, makeMock } from "./config";
import { useSession } from "./hooks/useSession";
import Lobby from "./components/Lobby";
import Board from "./components/Board";
import HostView from "./components/HostView";

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

  const { players: livePl, revealedTopics, sendState, revealTopic, resetGame, isLive } = useSession(handleReset);
  const [mockPl] = useState(() => isLive ? [] : makeMock());
  const allPl = [...mockPl, ...livePl];

  const join = () => {
    if (!name.trim()) return;
    const b = mkBoard();
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
          revealedTopics={revealedTopics}
          onMark={handleMark}
          onSubmitBingo={li => setSubs(p => [...p, li])}
          onLeave={() => setScreen("lobby")}
        />
      )}
      {screen === "host" && (
        <HostView
          players={allPl}
          revealedTopics={revealedTopics}
          onRevealTopic={revealTopic}
          onReset={resetGame}
          onExit={() => setScreen("lobby")}
        />
      )}
    </div>
  );
}
