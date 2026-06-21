import { useEffect, useRef, useState } from "react";
import { GameEngine, CANVAS_W, CANVAS_H, type GameSnapshot } from "./game/engine";

const DEFAULT_SNAP: GameSnapshot = {
  state: "idle",
  score: 0,
  highScore: parseInt(localStorage.getItem("bh_highscore") ?? "0", 10),
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [snap, setSnap] = useState<GameSnapshot>(DEFAULT_SNAP);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new GameEngine(canvasRef.current, setSnap);
    engineRef.current = engine;
    return () => engine.destroy();
  }, []);

  const handleInput = () => engineRef.current?.jump();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        handleInput();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div style={styles.root}>
      <div style={styles.hud}>
        <span style={styles.hudItem}>
          Best: <strong style={{ color: "#ffffff" }}>{snap.highScore}</strong>
        </span>
        <span style={styles.title}>Bug Hunter</span>
        <span style={styles.hudItem}>
          Score: <strong style={{ color: "#ffffff" }}>{snap.score}</strong>
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={styles.canvas}
        onPointerDown={handleInput}
        tabIndex={0}
      />

      <p style={styles.hint}>
        {snap.state === "running"
          ? "SPACE / ↑ / tap to jump"
          : snap.state === "gameOver"
          ? "Press SPACE / ↑ or tap to restart"
          : "Press SPACE / ↑ or tap to start"}
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#0a0a0a",
    fontFamily: "monospace",
    userSelect: "none",
    padding: "16px",
    boxSizing: "border-box",
  },
  hud: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: CANVAS_W,
    marginBottom: 0,
    padding: "6px 12px",
    background: "#111111",
    borderRadius: "8px 8px 0 0",
    border: "1px solid #333333",
    borderBottom: "none",
    boxSizing: "border-box",
  },
  title: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 2,
  },
  hudItem: {
    color: "#aaaaaa",
    fontSize: 14,
  },
  canvas: {
    display: "block",
    width: "100%",
    maxWidth: CANVAS_W,
    border: "1px solid #333333",
    borderRadius: "0 0 8px 8px",
    cursor: "pointer",
    outline: "none",
  },
  hint: {
    marginTop: 10,
    color: "#666666",
    fontSize: 13,
  },
};
