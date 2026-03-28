import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { generateQuestions } from "../services/groqService";
import { runDiagnosis } from "../engine/diagnosisEngine";
import "./QuizPage.css";

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy", emoji: "🟢", desc: "Definitions & basics" },
  { value: "medium", label: "Medium", emoji: "🟡", desc: "Application & analysis" },
  { value: "hard", label: "Hard", emoji: "🔴", desc: "Edge cases & synthesis" },
];

export default function QuizPage() {
  const { subject } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Custom subject data from location state
  const customOptions = location.state?.educationLevel ? {
    educationLevel: location.state.educationLevel.id || location.state.educationLevel,
    customSubject: location.state.customSubject,
  } : null;
  const isCustom = subject === "custom" && customOptions;

  // Display name for the subject
  const subjectDisplay = isCustom ? customOptions.customSubject : subject;
  const educationDisplay = isCustom
    ? (location.state.educationLevel.label || location.state.educationLevel.id || location.state.educationLevel)
    : null;

  // Check if retake with same questions
  const retakeQuestions = location.state?.retakeQuestions || null;
  const retakeDifficulty = location.state?.retakeDifficulty || "medium";
  const retakeCount = location.state?.retakeCount || 10;
  const retakeConcepts = location.state?.retakeConcepts || null;

  // Config phase
  const [phase, setPhase] = useState(retakeQuestions ? "quiz" : "config");
  const [numQuestions, setNumQuestions] = useState(retakeCount);
  const [difficulty, setDifficulty] = useState(retakeDifficulty);
  const [loadingMsg, setLoadingMsg] = useState("");

  // Quiz phase
  const [questions, setQuestions] = useState(retakeQuestions || []);
  const [generatedConcepts, setGeneratedConcepts] = useState(retakeConcepts || null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState(retakeQuestions ? new Array(retakeQuestions.length).fill(null) : []);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [error, setError] = useState("");

  const timerRef = useRef(null);

  const currentQuestion = questions[currentIdx];

  // Timer
  useEffect(() => {
    if (phase !== "quiz" || !currentQuestion) return;
    setTimeLeft(currentQuestion.timeLimitSeconds);
    setQuestionStartTime(Date.now());

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Time up — auto-submit with current selection or null
          autoSubmitTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIdx, phase]);

  const autoSubmitTimeUp = () => {
    const timeTaken = currentQuestion?.timeLimitSeconds || 45;
    const newAnswers = [...answers];
    newAnswers[currentIdx] = {
      selected: selectedOption, // might be null if nothing selected
      timeTaken,
      confidence: "low",
    };
    setAnswers(newAnswers);
    goNext(newAnswers);
  };

  // Generate questions
  const handleStartQuiz = async () => {
    setPhase("loading");
    setLoadingMsg(isCustom
      ? `Generating concepts & questions for "${customOptions.customSubject}"...`
      : "Generating questions with AI..."
    );
    setError("");

    try {
      const result = await generateQuestions(subject, numQuestions, difficulty, isCustom ? customOptions : null);

      // result is now { questions, concepts }
      const q = result.questions;
      const concepts = result.concepts;

      setQuestions(q);
      setGeneratedConcepts(concepts);
      setAnswers(new Array(q.length).fill(null));
      setCurrentIdx(0);
      setSelectedOption(null);
      setPhase("quiz");
    } catch (err) {
      console.error("Question generation error:", err);
      setError(err.message || "Failed to generate questions. Please try again.");
      setPhase("config");
    }
  };

  // Select/switch answer option (can change before confirming)
  const handleSelectOption = (option) => {
    setSelectedOption(option);
  };

  // Confirm answer and proceed automatically
  const handleConfirmAnswer = () => {
    if (selectedOption === null) return;
    clearInterval(timerRef.current);
    
    // Automatically record answer and trigger advance
    // Base legacy 'confidence' is left alone; confidence engine overwrites it.
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    const newAnswers = [...answers];
    newAnswers[currentIdx] = {
      selected: selectedOption,
      timeTaken,
      confidence: "low",
    };
    setAnswers(newAnswers);

    setTimeout(() => goNext(newAnswers), 300);
  };

  const goNext = (updatedAnswers) => {
    if (currentIdx + 1 >= questions.length) {
      // Quiz complete — run diagnosis
      const diagnosis = runDiagnosis(subject, updatedAnswers, questions, generatedConcepts);
      // Attach extra info for custom subjects
      if (isCustom) {
        diagnosis.customSubject = customOptions.customSubject;
        diagnosis.educationLevel = customOptions.educationLevel;
        diagnosis.generatedConcepts = generatedConcepts;
      }
      navigate("/results", { state: { diagnosis } });
    } else {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
    }
  };

  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;
  const timerPercent = currentQuestion ? (timeLeft / currentQuestion.timeLimitSeconds) * 100 : 100;
  const timerColor = timerPercent > 50 ? "#22c55e" : timerPercent > 20 ? "#eab308" : "#ef4444";

  /* ─── CONFIG PHASE ─── */
  if (phase === "config") {
    return (
      <div className="qz-root">
        <div className="qz-noise" />
        <div className="qz-config-card" id="quiz-config">
          <button className="qz-back" onClick={() => navigate("/")} id="back-to-subjects">← Back</button>
          <div className="qz-config-header">
            <h1 className="qz-config-title">{subjectDisplay} Diagnosis</h1>
            <p className="qz-config-desc">
              Configure your diagnostic quiz. AI will generate personalized questions.
            </p>
            {isCustom && educationDisplay && (
              <div className="qz-config-edu-badge">
                📎 Education Level: <strong>{educationDisplay}</strong>
              </div>
            )}
          </div>

          {error && <div className="qz-error">{error}</div>}

          <div className="qz-config-section">
            <label className="qz-config-label">Number of Questions</label>
            <div className="qz-num-input">
              <button onClick={() => setNumQuestions(Math.max(5, numQuestions - 1))} className="qz-num-btn">−</button>
              <span className="qz-num-value">{numQuestions}</span>
              <button onClick={() => setNumQuestions(Math.min(25, numQuestions + 1))} className="qz-num-btn">+</button>
            </div>
            <div className="qz-num-range">
              <span>5</span>
              <input
                type="range"
                min="5"
                max="25"
                value={numQuestions}
                onChange={e => setNumQuestions(Number(e.target.value))}
                className="qz-slider"
              />
              <span>25</span>
            </div>
            <p className="qz-hint">💡 More questions = better diagnosis. Recommended: 15–20 for accurate results.</p>
          </div>

          <div className="qz-config-section">
            <label className="qz-config-label">Difficulty Level</label>
            <div className="qz-diff-grid">
              {DIFFICULTY_OPTIONS.map(d => (
                <button
                  key={d.value}
                  className={`qz-diff-btn ${difficulty === d.value ? "active" : ""}`}
                  onClick={() => setDifficulty(d.value)}
                  id={`diff-${d.value}`}
                >
                  <span className="qz-diff-emoji">{d.emoji}</span>
                  <span className="qz-diff-label">{d.label}</span>
                  <span className="qz-diff-desc">{d.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button className="qz-start-btn" onClick={handleStartQuiz} id="start-quiz-btn">
            🚀 Generate & Start Quiz
          </button>
        </div>
      </div>
    );
  }

  /* ─── LOADING PHASE ─── */
  if (phase === "loading") {
    return (
      <div className="qz-root">
        <div className="qz-noise" />
        <div className="qz-loading-card">
          <div className="qz-loading-spinner" />
          <h2 className="qz-loading-title">Generating Questions</h2>
          <p className="qz-loading-msg">{loadingMsg}</p>
          <p className="qz-loading-sub">
            AI is crafting {numQuestions} {difficulty} {subjectDisplay} questions...
            {isCustom && " (generating concept graph first)"}
          </p>
        </div>
      </div>
    );
  }

  /* ─── QUIZ PHASE ─── */
  return (
    <div className="qz-root">
      <div className="qz-noise" />
      <div className="qz-container">
        {/* Top bar */}
        <div className="qz-topbar">
          <span className="qz-subject-badge">{subjectDisplay}</span>
          <span className="qz-progress-text">
            {currentIdx + 1} / {questions.length}
          </span>
          <div className="qz-timer" style={{ "--timer-color": timerColor }}>
            <svg viewBox="0 0 36 36" className="qz-timer-svg">
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="16"
                fill="none"
                stroke={timerColor}
                strokeWidth="3"
                strokeDasharray={`${timerPercent} ${100 - timerPercent}`}
                strokeDashoffset="25"
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 0.5s" }}
              />
            </svg>
            <span className="qz-timer-text">{timeLeft}s</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="qz-progress-bar">
          <div className="qz-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Question card */}
        <div className="qz-question-card" key={currentIdx}>
          <div className="qz-q-meta">
            <span className="qz-q-diff">{difficulty}</span>
            {currentQuestion?.concepts?.length > 0 && (
              <span className="qz-q-concepts">
                {currentQuestion.concepts.join(" · ")}
              </span>
            )}
          </div>
          <h2 className="qz-q-text">{currentQuestion?.text}</h2>

          <div className="qz-options">
            {currentQuestion?.options?.map((opt, i) => (
              <button
                key={i}
                className={`qz-option ${selectedOption === opt ? "selected" : ""}`}
                onClick={() => handleSelectOption(opt)}
                id={`option-${i}`}
              >
                <span className="qz-option-letter">{String.fromCharCode(65 + i)}</span>
                <span className="qz-option-text">{opt}</span>
                {selectedOption === opt && (
                  <span className="qz-option-check">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Confirm button — visible after selecting an option */}
          {selectedOption && (
            <button className="qz-confirm-btn" onClick={handleConfirmAnswer} id="confirm-answer">
              Confirm Answer →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
