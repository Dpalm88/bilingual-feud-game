import { useState, useEffect, useRef } from "react";

// ── MyMemory translation helper ──────────────────────────────────────────────
async function translate(text, from, to) {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    );
    const data = await res.json();
    return data.responseData?.translatedText || text;
  } catch {
    return text;
  }
}

// ── Pre-written question bank ────────────────────────────────────────────────
const QUESTION_BANK = [
  {
    question: "Name something you find in a kitchen",
    pregunta: "Nombre algo que encuentras en una cocina",
    answers: [
      { en: "Refrigerator", es: "Refrigerador", points: 42 },
      { en: "Stove", es: "Estufa", points: 38 },
      { en: "Microwave", es: "Microondas", points: 31 },
      { en: "Sink", es: "Fregadero", points: 27 },
      { en: "Dishwasher", es: "Lavavajillas", points: 22 },
      { en: "Knife", es: "Cuchillo", points: 18 },
      { en: "Cutting board", es: "Tabla de cortar", points: 14 },
      { en: "Toaster", es: "Tostador", points: 11 },
    ],
  },
  {
    question: "Name a popular vacation destination",
    pregunta: "Nombre un destino de vacaciones popular",
    answers: [
      { en: "Hawaii", es: "Hawái", points: 45 },
      { en: "Paris", es: "París", points: 40 },
      { en: "Mexico", es: "México", points: 35 },
      { en: "Florida", es: "Florida", points: 30 },
      { en: "Las Vegas", es: "Las Vegas", points: 26 },
      { en: "New York", es: "Nueva York", points: 21 },
      { en: "Caribbean", es: "Caribe", points: 16 },
      { en: "Italy", es: "Italia", points: 12 },
    ],
  },
  {
    question: "Name something people do on weekends",
    pregunta: "Nombre algo que la gente hace los fines de semana",
    answers: [
      { en: "Sleep in", es: "Dormir hasta tarde", points: 48 },
      { en: "Watch TV", es: "Ver televisión", points: 43 },
      { en: "Go shopping", es: "Ir de compras", points: 36 },
      { en: "Exercise", es: "Ejercitarse", points: 29 },
      { en: "Cook", es: "Cocinar", points: 23 },
      { en: "Visit family", es: "Visitar a la familia", points: 17 },
      { en: "Go hiking", es: "Hacer senderismo", points: 13 },
      { en: "Read", es: "Leer", points: 9 },
    ],
  },
  {
    question: "Name a reason someone might call in sick",
    pregunta: "Nombre una razón por la que alguien podría llamar al trabajo enfermo",
    answers: [
      { en: "Flu", es: "Gripe", points: 47 },
      { en: "Hangover", es: "Resaca", points: 38 },
      { en: "Headache", es: "Dolor de cabeza", points: 32 },
      { en: "Stomach ache", es: "Dolor de estómago", points: 27 },
      { en: "Family emergency", es: "Emergencia familiar", points: 21 },
      { en: "Just tired", es: "Simplemente cansado", points: 16 },
      { en: "Back pain", es: "Dolor de espalda", points: 11 },
      { en: "Mental health day", es: "Día de salud mental", points: 8 },
    ],
  },
  {
    question: "Name something you find at a birthday party",
    pregunta: "Nombre algo que encuentras en una fiesta de cumpleaños",
    answers: [
      { en: "Cake", es: "Pastel", points: 52 },
      { en: "Balloons", es: "Globos", points: 46 },
      { en: "Gifts", es: "Regalos", points: 41 },
      { en: "Candles", es: "Velas", points: 34 },
      { en: "Music", es: "Música", points: 25 },
      { en: "Ice cream", es: "Helado", points: 19 },
      { en: "Streamers", es: "Serpentinas", points: 14 },
      { en: "Party hats", es: "Sombreros de fiesta", points: 9 },
    ],
  },
];

// ── Claude-powered dynamic question generator ────────────────────────────────
async function generateDynamicQuestion() {
  const themes = [
    "everyday household items", "food and cooking", "sports and fitness",
    "technology", "travel", "animals", "movies and entertainment", "school"
  ];
  const theme = themes[Math.floor(Math.random() * themes.length)];

  const prompt = `You are generating content for a bilingual Family Feud trivia game (English/Spanish).

Create ONE survey question about the theme: "${theme}"

Respond with ONLY a valid JSON object, no markdown, no explanation:
{
  "question": "Name something related to ${theme} (English question)",
  "pregunta": "Spanish translation of the question",
  "answers": [
    {"en": "Answer1", "es": "Spanish translation", "points": 45},
    {"en": "Answer2", "es": "Spanish translation", "points": 38},
    {"en": "Answer3", "es": "Spanish translation", "points": 31},
    {"en": "Answer4", "es": "Spanish translation", "points": 25},
    {"en": "Answer5", "es": "Spanish translation", "points": 19},
    {"en": "Answer6", "es": "Spanish translation", "points": 14},
    {"en": "Answer7", "es": "Spanish translation", "points": 9},
    {"en": "Answer8", "es": "Spanish translation", "points": 6}
  ]
}

Rules:
- Points must be between 5-55 and decrease from answer 1 to 8
- Answers should be realistic survey-style responses
- Spanish translations must be accurate
- The question must start with "Name" or "We surveyed 100 people..."`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ── Fuzzy match helper ───────────────────────────────────────────────────────
function normalize(str) {
  return str.toLowerCase().trim()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i").replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u").replace(/ñ/g, "n")
    .replace(/[^a-z0-9\s]/g, "");
}

function fuzzyMatch(guess, answer) {
  const g = normalize(guess);
  const a = normalize(answer);
  if (g === a) return true;
  if (a.includes(g) || g.includes(a)) return true;
  // Levenshtein for typo tolerance
  if (Math.abs(g.length - a.length) > 4) return false;
  let matrix = Array.from({ length: g.length + 1 }, (_, i) =>
    Array.from({ length: a.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= g.length; i++)
    for (let j = 1; j <= a.length; j++)
      matrix[i][j] = g[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
  return matrix[g.length][a.length] <= 2;
}

function checkGuess(guess, answers, revealed) {
  const unrevealedIndexes = answers
    .map((a, i) => i)
    .filter(i => !revealed.has(i));

  for (const i of unrevealedIndexes) {
    const ans = answers[i];
    if (fuzzyMatch(guess, ans.en) || fuzzyMatch(guess, ans.es)) {
      return i;
    }
  }
  return -1;
}

// ── X mark component ─────────────────────────────────────────────────────────
function XMark() {
  return (
    <div style={{
      fontSize: "4rem", color: "#ff2222", fontFamily: "'Georgia', serif",
      textShadow: "0 0 20px #ff000088", animation: "xAppear 0.3s ease-out",
      lineHeight: 1
    }}>✗</div>
  );
}

// ── Score flip tile ──────────────────────────────────────────────────────────
function AnswerTile({ answer, revealed, index }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (revealed) {
      const t = setTimeout(() => setFlipped(true), index * 80);
      return () => clearTimeout(t);
    } else {
      setFlipped(false);
    }
  }, [revealed, index]);

  return (
    <div style={{
      perspective: "600px",
      height: "64px",
      marginBottom: "6px",
    }}>
      <div style={{
        position: "relative",
        width: "100%",
        height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.5s cubic-bezier(0.4,0,0.2,1)",
        transform: flipped ? "rotateX(0deg)" : "rotateX(-90deg)",
      }}>
        {/* Front (revealed) */}
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          background: "linear-gradient(135deg, #1a3a6e 0%, #0d2347 100%)",
          border: "2px solid #4a7fd4",
          borderRadius: "6px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
          boxShadow: "0 0 15px #4a7fd433, inset 0 1px 0 #ffffff22",
        }}>
          <span style={{
            fontFamily: "'Trebuchet MS', sans-serif",
            fontSize: "1rem", fontWeight: "bold",
            color: "#e8d48a",
            letterSpacing: "0.05em",
            textShadow: "0 0 10px #e8d48a66",
          }}>
            {answer?.en}
            <span style={{ color: "#a0c4ff", fontSize: "0.8rem", marginLeft: "8px", fontStyle: "italic" }}>
              / {answer?.es}
            </span>
          </span>
          <span style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: "1.3rem", color: "#fff",
            background: "linear-gradient(135deg, #e8d48a, #b8960a)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            {answer?.points}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Hidden tile ──────────────────────────────────────────────────────────────
function HiddenTile({ number }) {
  return (
    <div style={{
      height: "64px", marginBottom: "6px",
      background: "linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)",
      border: "2px solid #1e3a5f",
      borderRadius: "6px",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "inset 0 2px 4px #00000066",
    }}>
      <span style={{
        fontFamily: "'Impact', 'Arial Black', sans-serif",
        fontSize: "1.4rem", color: "#1e3a5f",
        letterSpacing: "0.15em",
      }}>
        {String(number).padStart(2, "0")}
      </span>
    </div>
  );
}

// ── Strike display ───────────────────────────────────────────────────────────
function Strikes({ count }) {
  return (
    <div style={{ display: "flex", gap: "12px", justifyContent: "center", margin: "12px 0" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: "48px", height: "48px", borderRadius: "50%",
          border: `3px solid ${i < count ? "#ff3333" : "#1e3a5f"}`,
          background: i < count ? "radial-gradient(circle, #ff222288, #44000088)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.6rem", color: i < count ? "#ff4444" : "#1e3a5f",
          transition: "all 0.3s",
          boxShadow: i < count ? "0 0 16px #ff222266" : "none",
        }}>
          {i < count ? "✗" : ""}
        </div>
      ))}
    </div>
  );
}

// ── Round header ─────────────────────────────────────────────────────────────
function RoundHeader({ round, totalRounds, score }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 20px",
      background: "linear-gradient(90deg, #0a0e1a, #0d1f3c, #0a0e1a)",
      borderBottom: "2px solid #1e3a5f",
      borderTop: "2px solid #1e3a5f",
      marginBottom: "16px",
    }}>
      <div style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", color: "#4a7fd4", fontSize: "0.9rem", letterSpacing: "0.1em" }}>
        ROUND {round} / {totalRounds}
      </div>
      <div style={{
        fontFamily: "'Impact', 'Arial Black', sans-serif",
        fontSize: "1.1rem",
        background: "linear-gradient(135deg, #e8d48a, #b8960a)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>
        SCORE: {score}
      </div>
    </div>
  );
}

// ── Main game ────────────────────────────────────────────────────────────────
export default function FamilyFeudBilingue() {
  const [gameState, setGameState] = useState("loading"); // loading | playing | roundOver | gameOver
  const [questions, setQuestions] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [revealed, setRevealed] = useState(new Set());
  const [strikes, setStrikes] = useState(0);
  const [score, setScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState(null); // {type: 'hit'|'miss', text}
  const [loadingMsg, setLoadingMsg] = useState("Generating your game…");
  const [wrongAnim, setWrongAnim] = useState(false);
  const inputRef = useRef(null);

  // Build 3 questions: 1 AI + 2 prewritten
  useEffect(() => {
    async function buildQuestions() {
      setLoadingMsg("Loading questions…");
      const bankIndexes = [...QUESTION_BANK.keys()];
      const shuffled = bankIndexes.sort(() => Math.random() - 0.5);
      const q1 = QUESTION_BANK[shuffled[0]];
      const q2 = QUESTION_BANK[shuffled[1]];

      setLoadingMsg("Generating AI question…");
      const aiQ = await generateDynamicQuestion();
      const allQ = aiQ ? [aiQ, q1, q2] : [q1, q2, QUESTION_BANK[shuffled[2]]];

      setQuestions(allQ);
      setGameState("playing");
    }
    buildQuestions();
  }, []);

  useEffect(() => {
    if (gameState === "playing") inputRef.current?.focus();
  }, [gameState, currentRound]);

  const currentQ = questions[currentRound];

  function handleGuess(e) {
    e.preventDefault();
    if (!guess.trim() || gameState !== "playing") return;

    const idx = checkGuess(guess.trim(), currentQ.answers, revealed);
    if (idx >= 0) {
      const pts = currentQ.answers[idx].points;
      setRevealed(prev => new Set([...prev, idx]));
      setRoundScore(prev => prev + pts);
      setFeedback({ type: "hit", text: `+${pts} points!` });
      setTimeout(() => setFeedback(null), 1500);

      // Check if all revealed
      const newRevealed = new Set([...revealed, idx]);
      if (newRevealed.size === currentQ.answers.length) {
        setTimeout(() => endRound(roundScore + pts), 800);
      }
    } else {
      const newStrikes = strikes + 1;
      setStrikes(newStrikes);
      setWrongAnim(true);
      setTimeout(() => setWrongAnim(false), 600);
      setFeedback({ type: "miss", text: "Not on the board!" });
      setTimeout(() => setFeedback(null), 1500);
      if (newStrikes >= 3) {
        setTimeout(() => endRound(roundScore), 800);
      }
    }
    setGuess("");
  }

  function endRound(finalRoundScore) {
    // Reveal all
    setRevealed(new Set(currentQ.answers.map((_, i) => i)));
    setScore(prev => prev + finalRoundScore);
    setGameState("roundOver");
  }

  function nextRound() {
    if (currentRound + 1 >= questions.length) {
      setGameState("gameOver");
    } else {
      setCurrentRound(prev => prev + 1);
      setRevealed(new Set());
      setStrikes(0);
      setRoundScore(0);
      setFeedback(null);
      setGuess("");
      setGameState("playing");
    }
  }

  function restartGame() {
    setGameState("loading");
    setCurrentRound(0);
    setRevealed(new Set());
    setStrikes(0);
    setScore(0);
    setRoundScore(0);
    setFeedback(null);
    setGuess("");

    async function rebuild() {
      setLoadingMsg("Shuffling new questions…");
      const bankIndexes = [...QUESTION_BANK.keys()];
      const shuffled = bankIndexes.sort(() => Math.random() - 0.5);
      const q1 = QUESTION_BANK[shuffled[0]];
      const q2 = QUESTION_BANK[shuffled[1]];
      setLoadingMsg("Generating AI question…");
      const aiQ = await generateDynamicQuestion();
      const allQ = aiQ ? [aiQ, q1, q2] : [q1, q2, QUESTION_BANK[shuffled[2]]];
      setQuestions(allQ);
      setGameState("playing");
    }
    rebuild();
  }

  const styles = {
    wrapper: {
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top, #0d1f3c 0%, #050a14 60%)",
      fontFamily: "'Trebuchet MS', sans-serif",
      color: "#e8f0ff",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 0 40px 0",
    },
    header: {
      width: "100%",
      background: "linear-gradient(180deg, #0a0e1a 0%, #0d1f3c 100%)",
      borderBottom: "3px solid #e8d48a",
      padding: "18px 0 12px 0",
      textAlign: "center",
      boxShadow: "0 4px 30px #e8d48a22",
      marginBottom: "20px",
    },
    title: {
      fontFamily: "'Impact', 'Arial Black', sans-serif",
      fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
      letterSpacing: "0.12em",
      background: "linear-gradient(135deg, #e8d48a 0%, #fff8e1 50%, #b8960a 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      margin: 0,
      textShadow: "none",
    },
    subtitle: {
      color: "#a0c4ff",
      fontSize: "0.85rem",
      letterSpacing: "0.25em",
      marginTop: "4px",
      textTransform: "uppercase",
    },
    card: {
      width: "min(600px, 95vw)",
      background: "linear-gradient(160deg, #0d1f3c 0%, #080f1e 100%)",
      border: "2px solid #1e3a5f",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 8px 40px #00000088, 0 0 60px #1a3a6e22",
    },
    questionBox: {
      background: "linear-gradient(135deg, #1a3a6e22, #0d2347aa)",
      border: "2px solid #4a7fd4",
      borderRadius: "8px",
      padding: "14px 20px",
      marginBottom: "16px",
      textAlign: "center",
      boxShadow: "0 0 20px #4a7fd422, inset 0 1px 0 #4a7fd433",
    },
    questionText: {
      fontFamily: "'Impact', 'Arial Black', sans-serif",
      fontSize: "clamp(1rem, 3vw, 1.25rem)",
      color: "#fff",
      letterSpacing: "0.05em",
      lineHeight: 1.3,
      margin: 0,
    },
    questionTextEs: {
      fontSize: "clamp(0.85rem, 2.5vw, 1rem)",
      color: "#a0c4ff",
      fontStyle: "italic",
      marginTop: "6px",
      margin: "6px 0 0 0",
    },
    inputRow: {
      display: "flex", gap: "10px", marginTop: "16px",
    },
    input: {
      flex: 1,
      background: "#050a14",
      border: `2px solid ${wrongAnim ? "#ff3333" : "#1e3a5f"}`,
      borderRadius: "6px",
      color: "#e8f0ff",
      fontSize: "1rem",
      padding: "10px 14px",
      outline: "none",
      fontFamily: "'Trebuchet MS', sans-serif",
      transition: "border-color 0.2s",
    },
    btn: {
      background: "linear-gradient(135deg, #1a3a6e, #0d2347)",
      border: "2px solid #4a7fd4",
      borderRadius: "6px",
      color: "#e8d48a",
      fontFamily: "'Impact', 'Arial Black', sans-serif",
      fontSize: "1rem",
      letterSpacing: "0.1em",
      padding: "10px 20px",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    feedback: {
      textAlign: "center",
      fontFamily: "'Impact', 'Arial Black', sans-serif",
      fontSize: "1.1rem",
      letterSpacing: "0.1em",
      minHeight: "28px",
      marginTop: "8px",
    },
  };

  // ── Loading screen ───────────────────────────────────────────────────────
  if (gameState === "loading") {
    return (
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>FEUD BILINGÜE</h1>
          <p style={styles.subtitle}>English · Español</p>
        </div>
        <div style={{ ...styles.card, textAlign: "center", padding: "40px 20px" }}>
          <div style={{
            fontSize: "3rem", marginBottom: "16px",
            animation: "spin 1.5s linear infinite",
            display: "inline-block",
          }}>🎯</div>
          <p style={{ color: "#a0c4ff", letterSpacing: "0.1em", fontSize: "0.95rem" }}>
            {loadingMsg}
          </p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Game Over screen ─────────────────────────────────────────────────────
  if (gameState === "gameOver") {
    const maxPossible = questions.reduce((sum, q) =>
      sum + q.answers.reduce((s, a) => s + a.points, 0), 0);
    const pct = Math.round((score / maxPossible) * 100);
    const grades = [
      [90, "🏆 Survey SAYS… CHAMPION!", "#e8d48a"],
      [70, "🎉 Great Game! Survey Savant", "#4a7fd4"],
      [50, "👍 Not Bad! Keep Practicing", "#a0c4ff"],
      [0, "💪 Try Again — You'll Get It!", "#ff8888"],
    ];
    const [, label, col] = grades.find(([min]) => pct >= min);

    return (
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <h1 style={styles.title}>FEUD BILINGÜE</h1>
          <p style={styles.subtitle}>English · Español</p>
        </div>
        <div style={{ ...styles.card, textAlign: "center" }}>
          <h2 style={{
            fontFamily: "'Impact','Arial Black',sans-serif", fontSize: "1.8rem",
            color: col, letterSpacing: "0.1em", margin: "0 0 8px 0"
          }}>
            GAME OVER
          </h2>
          <p style={{ color: "#a0c4ff", fontSize: "0.9rem", margin: "0 0 20px 0" }}>JUEGO TERMINADO</p>
          <div style={{
            fontSize: "3.5rem", fontFamily: "'Impact','Arial Black',sans-serif",
            background: "linear-gradient(135deg,#e8d48a,#fff8e1,#b8960a)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: "8px"
          }}>
            {score}
          </div>
          <div style={{ color: "#4a7fd4", fontSize: "0.85rem", marginBottom: "20px" }}>
            {pct}% of possible points • {pct}% de puntos posibles
          </div>
          <div style={{
            fontSize: "1.1rem", color: col, marginBottom: "24px",
            fontFamily: "'Impact','Arial Black',sans-serif", letterSpacing: "0.05em"
          }}>
            {label}
          </div>
          <button style={{ ...styles.btn, fontSize: "1rem", padding: "12px 32px", width: "100%" }}
            onClick={restartGame}>
            PLAY AGAIN · JUGAR DE NUEVO
          </button>
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  // ── Round Over banner ────────────────────────────────────────────────────
  const roundOverBanner = gameState === "roundOver" && (
    <div style={{
      background: "linear-gradient(135deg, #0d2347, #1a3a6e)",
      border: "2px solid #e8d48a",
      borderRadius: "8px",
      padding: "16px",
      textAlign: "center",
      marginBottom: "16px",
      boxShadow: "0 0 30px #e8d48a33",
    }}>
      <div style={{
        fontFamily: "'Impact','Arial Black',sans-serif",
        fontSize: "1.4rem", color: "#e8d48a", letterSpacing: "0.1em"
      }}>
        ROUND OVER · +{roundScore} PTS
      </div>
      <div style={{ color: "#a0c4ff", fontSize: "0.85rem", margin: "4px 0 12px 0" }}>
        {strikes >= 3 ? "Three strikes! · ¡Tres errores!" : "Board cleared! · ¡Tablero completado!"}
      </div>
      <button style={{ ...styles.btn, padding: "10px 28px" }} onClick={nextRound}>
        {currentRound + 1 >= questions.length ? "SEE FINAL SCORE" : "NEXT ROUND →"}
      </button>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes xAppear { from { transform: scale(2); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        input:focus { border-color: #4a7fd4 !important; box-shadow: 0 0 12px #4a7fd433; }
        button:hover { opacity: 0.85; transform: translateY(-1px); }
      `}</style>

      <div style={styles.header}>
        <h1 style={styles.title}>FEUD BILINGÜE</h1>
        <p style={styles.subtitle}>English · Español · Family Feud</p>
      </div>

      <div style={styles.card}>
        <RoundHeader round={currentRound + 1} totalRounds={questions.length} score={score + roundScore} />

        {roundOverBanner}

        {/* Question */}
        <div style={styles.questionBox}>
          <p style={styles.questionText}>{currentQ.question}</p>
          <p style={styles.questionTextEs}>{currentQ.pregunta}</p>
        </div>

        {/* Strikes */}
        <Strikes count={strikes} />

        {/* Answer board */}
        <div style={{ marginTop: "12px" }}>
          {currentQ.answers.map((ans, i) => (
            revealed.has(i)
              ? <AnswerTile key={i} answer={ans} revealed={true} index={i} />
              : <HiddenTile key={i} number={i + 1} />
          ))}
        </div>

        {/* Input */}
        {gameState === "playing" && (
          <form onSubmit={handleGuess} style={styles.inputRow}>
            <input
              ref={inputRef}
              style={{ ...styles.input, animation: wrongAnim ? "shake 0.4s ease" : "none" }}
              value={guess}
              onChange={e => setGuess(e.target.value)}
              placeholder="Your answer / Tu respuesta…"
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" style={styles.btn}>GO</button>
          </form>
        )}

        {/* Feedback */}
        <div style={{
          ...styles.feedback,
          color: feedback?.type === "hit" ? "#e8d48a" : "#ff6666",
        }}>
          {feedback?.text || ""}
        </div>

        {/* Hint */}
        {gameState === "playing" && (
          <div style={{ textAlign: "center", color: "#1e3a5f", fontSize: "0.75rem", marginTop: "8px" }}>
            Guess in English OR Spanish · Adivina en inglés O español
          </div>
        )}
      </div>
    </div>
  );
}
