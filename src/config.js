const pathSegment = window.location.pathname.split("/").filter(Boolean)[0];
export const SESSION = pathSegment || "demo2026";
export const AT_ROOT = !pathSegment;

export const TOPICS = [
  "Zero-shot prompting", "RAG pipelines", "Token limits", "Embedding models",
  "Fine-tuning basics", "Chain-of-thought", "Hallucinations", "System prompts",
  "RLHF training", "Tool calling", "Semantic search", "Vector databases",
  "Model quantization", "Prompt injection", "Temperature param",
  "Multimodal AI", "Agent loops", "Structured outputs",
  "Batch inference", "Retrieval-Aug. Gen", "Eval frameworks",
  "Inference costs", "Open-source LLMs", "Safety alignment",
];

export const FREE = 12;

export const LINES = [
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
];

export const LINE_NAMES = [
  "Row 1", "Row 2", "Row 3", "Row 4", "Row 5",
  "Col B", "Col I", "Col N", "Col G", "Col O",
  "Diagonal ↘", "Diagonal ↙",
];

export const RATES = [
  { id: "new", icon: "🚀", label: "New to me", color: "#ef4444" },
  { id: "partial", icon: "💡", label: "Partly familiar", color: "#f59e0b" },
  { id: "knew", icon: "⭐", label: "Already knew this", color: "#22c55e" },
];

const shuffle = a => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

export const mkBoard = () => {
  const s = shuffle(TOPICS);
  return [...s.slice(0, 12), "FREE", ...s.slice(12)];
};

export const getLines = m => LINES.filter(l => l.every(i => i === FREE || !!m[i]));

export const makeMock = () => ["Alice", "Bob", "Cara", "Dev", "Emma", "Frank"].map(name => {
  const board = mkBoard();
  const marks = {};
  let c = 0, n = 4 + Math.floor(Math.random() * 8);
  for (let i = 0; i < 25 && c < n; i++) {
    if (i === FREE) continue;
    if (Math.random() > .48) { marks[i] = RATES[Math.floor(Math.random() * 3)].id; c++; }
  }
  return { id: `${name}_mock`, name, board, marks };
});
