import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ConceptGraph from "./ConceptGraph";
import ChatPanel from "./ChatPanel";
import "./ResultDashboard.css";

export default function ResultDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const diagnosis = location.state?.diagnosis;
  const [showReview, setShowReview] = useState(false);

  if (!diagnosis) {
    return (
      <div className="rd-root">
        <div className="rd-empty">
          <h2>No diagnosis data</h2>
          <p>Please take a quiz first to see your results.</p>
          <button className="rd-btn-primary" onClick={() => navigate("/")}>Go to Subjects</button>
        </div>
      </div>
    );
  }

  const {
    subject, overallScore, totalQuestions, correctAnswers,
    conceptScores, weakConcepts, strongConcepts, rootCause,
    behaviorAnalysis, learningPath, graphData, chatContext,
    answers, questions,
    customSubject, educationLevel, generatedConcepts,
  } = diagnosis;

  // Resolve display names
  const isCustom = subject === "custom" && customSubject;
  const subjectDisplay = isCustom ? customSubject : subject;
  const EDUCATION_LABELS = {
    school: { label: "School", icon: "🏫", color: "#f472b6" },
    college: { label: "College", icon: "🎒", color: "#60a5fa" },
    undergraduate: { label: "Undergraduate", icon: "📚", color: "#c084fc" },
    graduate: { label: "Graduate", icon: "🎓", color: "#34d399" },
    phd: { label: "PhD", icon: "🔬", color: "#f59e0b" },
  };
  const eduInfo = educationLevel ? EDUCATION_LABELS[educationLevel] : null;

  const scoreColor = overallScore >= 80 ? "#22c55e" : overallScore >= 50 ? "#eab308" : "#ef4444";
  const wrongAnswers = totalQuestions - correctAnswers;

  // Calculate detailed stats
  const avgTime = answers.filter(Boolean).length > 0
    ? Math.round(answers.filter(Boolean).reduce((sum, a) => sum + (a.timeTaken || 0), 0) / answers.filter(Boolean).length)
    : 0;

  const totalTime = answers.filter(Boolean).reduce((sum, a) => sum + (a.timeTaken || 0), 0);

  // Confidence breakdown
  const confBreakdown = { low: 0, medium: 0, high: 0 };
  const confCorrect = { low: 0, medium: 0, high: 0 };
  answers.forEach((a, i) => {
    if (!a) return;
    const conf = a.confidence || "low";
    confBreakdown[conf]++;
    if (a.selected === questions[i]?.correctAnswer) confCorrect[conf]++;
  });

  // Handle retake with same questions
  const handleRetake = () => {
    if (isCustom) {
      navigate(`/quiz/custom`, {
        state: {
          educationLevel: { id: educationLevel, label: eduInfo?.label || educationLevel, color: eduInfo?.color },
          customSubject,
          retakeQuestions: questions,
          retakeDifficulty: questions[0]?.difficulty || "medium",
          retakeCount: questions.length,
          retakeConcepts: generatedConcepts,
        }
      });
    } else {
      navigate(`/quiz/${subject}`, {
        state: {
          retakeQuestions: questions,
          retakeDifficulty: questions[0]?.difficulty || "medium",
          retakeCount: questions.length,
        }
      });
    }
  };

  return (
    <div className="rd-root">
      <div className="rd-noise" />

      {/* Header */}
      <header className="rd-header">
        <div className="rd-header-left">
          <button className="rd-back" onClick={() => navigate("/")}>← Back to Subjects</button>
          <h1 className="rd-title">
            <span className="rd-brand">LearnLens</span> Diagnosis Report
          </h1>
          {eduInfo && (
            <span className="rd-edu-badge" style={{ color: eduInfo.color, borderColor: `${eduInfo.color}33`, background: `${eduInfo.color}11` }}>
              {eduInfo.icon} {eduInfo.label} Level
            </span>
          )}
        </div>
        <span className="rd-subject-badge" title={isCustom ? `Custom: ${subjectDisplay}` : subjectDisplay}>
          {subjectDisplay.length > 20 ? subjectDisplay.slice(0, 18) + "…" : subjectDisplay}
        </span>
      </header>

      <div className="rd-content">
        {/* ── Overview Section ── */}
        <section className="rd-section">
          <div className="rd-overview-grid">
            {/* Overall Score */}
            <div className="rd-score-card">
              <div className="rd-score-ring" style={{ "--score-color": scoreColor }}>
                <svg viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="8"
                    strokeDasharray={`${overallScore * 3.26} ${326 - overallScore * 3.26}`}
                    strokeDashoffset="81.5" strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 1s ease" }} />
                </svg>
                <div className="rd-score-value">
                  <span className="rd-score-num" style={{ color: scoreColor }}>{overallScore}%</span>
                  <span className="rd-score-label">Score</span>
                </div>
              </div>
              <div className="rd-score-stats">
                <div className="rd-stat">
                  <span className="rd-stat-num rd-stat-correct">{correctAnswers}</span>
                  <span className="rd-stat-label">Correct</span>
                </div>
                <div className="rd-stat-divider" />
                <div className="rd-stat">
                  <span className="rd-stat-num rd-stat-wrong">{wrongAnswers}</span>
                  <span className="rd-stat-label">Wrong</span>
                </div>
                <div className="rd-stat-divider" />
                <div className="rd-stat">
                  <span className="rd-stat-num">{totalQuestions}</span>
                  <span className="rd-stat-label">Total</span>
                </div>
              </div>
              <div className="rd-score-extra">
                <span>⏱️ Avg: {avgTime}s/question</span>
                <span>⏰ Total: {Math.floor(totalTime / 60)}m {totalTime % 60}s</span>
              </div>
            </div>

            {/* Root Cause */}
            <div className="rd-root-card">
              <div className="rd-card-label">🎯 Root Cause</div>
              {rootCause ? (
                <>
                  <h2 className="rd-root-concept">{rootCause.concept}</h2>
                  <div className="rd-root-confidence">
                    <span className="rd-conf-bar">
                      <span className="rd-conf-fill" style={{ width: `${rootCause.confidence * 100}%` }} />
                    </span>
                    <span className="rd-conf-text">{Math.round(rootCause.confidence * 100)}% confidence</span>
                  </div>
                  <p className="rd-root-reason">{rootCause.reason}</p>
                  {rootCause.supportingWeakConcepts?.length > 0 && (
                    <div className="rd-root-supports">
                      <span className="rd-root-supports-label">Affects:</span>
                      {rootCause.supportingWeakConcepts.map(c => (
                        <span key={c} className="rd-root-support-tag">{c}</span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="rd-root-reason">No clear root cause detected — performance is relatively balanced.</p>
              )}
            </div>
          </div>
        </section>

        {/* ── Confidence Analysis ── */}
        <section className="rd-section">
          <h2 className="rd-section-title">🧠 Confidence Analysis</h2>
          <div className="rd-conf-grid">
            <ConfidenceCard
              label="Not Sure"
              emoji="😟"
              total={confBreakdown.low}
              correct={confCorrect.low}
              color="#ef4444"
              insight={confCorrect.low > 0
                ? `${confCorrect.low} correct despite low confidence — uncertain knowledge detected`
                : confBreakdown.low > 0
                  ? `${confBreakdown.low - confCorrect.low} wrong with low confidence — weak foundation`
                  : "No responses"}
            />
            <ConfidenceCard
              label="Maybe"
              emoji="🤔"
              total={confBreakdown.medium}
              correct={confCorrect.medium}
              color="#eab308"
              insight={confBreakdown.medium > 0
                ? `${confCorrect.medium}/${confBreakdown.medium} correct — partial understanding`
                : "No responses"}
            />
            <ConfidenceCard
              label="Confident"
              emoji="😄"
              total={confBreakdown.high}
              correct={confCorrect.high}
              color="#22c55e"
              insight={confBreakdown.high > confCorrect.high
                ? `${confBreakdown.high - confCorrect.high} wrong despite high confidence — misconceptions!`
                : confBreakdown.high > 0
                  ? `${confCorrect.high}/${confBreakdown.high} correct — solid mastery`
                  : "No responses"}
            />
          </div>
        </section>

        {/* ── Behavior Analysis ── */}
        <section className="rd-section">
          <h2 className="rd-section-title">📊 Behavior Analysis</h2>
          <div className="rd-behavior-grid">
            <BehaviorBadge
              active={behaviorAnalysis.guessing}
              icon="🎲"
              label="Guessing"
              desc="Fast answers that were wrong"
              color="#ef4444"
              count={behaviorAnalysis.timeCounts?.guessingCount || 0}
            />
            <BehaviorBadge
              active={behaviorAnalysis.lowFluency}
              icon="🐢"
              label="Low Fluency"
              desc="Slow but correct answers"
              color="#eab308"
              count={behaviorAnalysis.timeCounts?.lowFluencyCount || 0}
            />
            <BehaviorBadge
              active={behaviorAnalysis.confusion}
              icon="😵"
              label="Confusion"
              desc="Slow and incorrect answers"
              color="#f97316"
              count={behaviorAnalysis.timeCounts?.confusionCount || 0}
            />
            <BehaviorBadge
              active={behaviorAnalysis.stable}
              icon="✅"
              label="Stable"
              desc="Good pace, correct answers"
              color="#22c55e"
              count={behaviorAnalysis.timeCounts?.stableCount || 0}
            />
          </div>
          {behaviorAnalysis.misconceptions?.length > 0 && (
            <div className="rd-misconceptions">
              <span className="rd-misc-label">⚠️ Misconceptions detected in:</span>
              <div className="rd-misc-tags">
                {behaviorAnalysis.misconceptions.map(c => (
                  <span key={c} className="rd-misc-tag">{c}</span>
                ))}
              </div>
              <p className="rd-misc-explain">You answered confidently but incorrectly — review these concepts carefully.</p>
            </div>
          )}
          {behaviorAnalysis.uncertainKnowledge?.length > 0 && (
            <div className="rd-uncertain">
              <span className="rd-misc-label">🤷 Uncertain knowledge in:</span>
              <div className="rd-misc-tags">
                {behaviorAnalysis.uncertainKnowledge.map(c => (
                  <span key={c} className="rd-uncertain-tag">{c}</span>
                ))}
              </div>
              <p className="rd-misc-explain">You got these right but weren't confident — practice more to solidify.</p>
            </div>
          )}
        </section>

        {/* ── Concept Mastery ── */}
        <section className="rd-section">
          <h2 className="rd-section-title">📈 Concept Mastery</h2>
          <div className="rd-mastery-list">
            {Object.entries(conceptScores)
              .sort(([,a], [,b]) => a - b)
              .map(([concept, score]) => {
                const color = score >= 80 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
                const isRoot = rootCause?.concept === concept;
                const status = score >= 80 ? "Strong" : score >= 50 ? "Moderate" : score < 30 ? "Very Weak" : "Weak";
                return (
                  <div key={concept} className={`rd-mastery-item ${isRoot ? "root-cause" : ""}`}>
                    <div className="rd-mastery-info">
                      <span className="rd-mastery-name">
                        {concept}
                        {isRoot && <span className="rd-root-tag">ROOT CAUSE</span>}
                        <span className="rd-mastery-status" style={{ color }}>{status}</span>
                      </span>
                      <span className="rd-mastery-score" style={{ color }}>{score}%</span>
                    </div>
                    <div className="rd-mastery-bar">
                      <div className="rd-mastery-fill" style={{ width: `${score}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        {/* ── Learning Path ── */}
        {learningPath.length > 0 && (
          <section className="rd-section">
            <h2 className="rd-section-title">🛤️ Recommended Learning Path</h2>
            <div className="rd-path">
              {learningPath.map((item, i) => (
                <div key={item.concept} className="rd-path-item">
                  <div className="rd-path-number">{i + 1}</div>
                  <div className="rd-path-content">
                    <div className="rd-path-header">
                      <span className="rd-path-name">{item.concept}</span>
                      <span className="rd-path-score" style={{
                        color: (conceptScores[item.concept] || 0) >= 50 ? "#eab308" : "#ef4444"
                      }}>
                        {conceptScores[item.concept] || 0}% mastery
                      </span>
                    </div>
                    {item.prereqsToCover && item.prereqsToCover.length > 0 && (
                      <div className="rd-path-prereqs">
                        <span className="rd-path-prereqs-label">Review Prerequisites First:</span>
                        <div className="rd-path-prereq-tags">
                          {item.prereqsToCover.map(p => (
                            <span key={p} className="rd-path-prereq-tag">
                              {p} ({conceptScores[p] || 0}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {i < learningPath.length - 1 && <div className="rd-path-connector" />}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Concept Graph ── */}
        <section className="rd-section">
          <h2 className="rd-section-title">🔗 Concept Dependency Graph</h2>
          <ConceptGraph
            graphData={graphData}
            conceptScores={conceptScores}
            rootCause={rootCause}
            weakConcepts={weakConcepts}
            learningPath={learningPath}
          />
        </section>

        {/* ── Question Review ── */}
        <section className="rd-section">
          <div className="rd-review-header">
            <h2 className="rd-section-title">📋 Question Review</h2>
            <button className="rd-toggle-btn" onClick={() => setShowReview(!showReview)}>
              {showReview ? "Hide Details" : "Show All Questions"}
            </button>
          </div>

          {/* Quick wrong answers summary */}
          <div className="rd-wrong-summary">
            <div className="rd-wrong-header">
              <span className="rd-wrong-count">❌ {wrongAnswers} Wrong Answer{wrongAnswers !== 1 ? "s" : ""}</span>
              <span className="rd-right-count">✅ {correctAnswers} Correct</span>
            </div>
            {/* Show wrong answers briefly */}
            <div className="rd-wrong-list">
              {questions.map((q, i) => {
                const answer = answers[i];
                if (!answer || answer.selected === q.correctAnswer) return null;
                return (
                  <div key={i} className="rd-wrong-item">
                    <div className="rd-wrong-q">
                      <span className="rd-wrong-num">Q{i + 1}</span>
                      <span className="rd-wrong-text">{q.text}</span>
                    </div>
                    <div className="rd-wrong-answers">
                      <span className="rd-wrong-yours">Your answer: <strong>{answer.selected || "No answer"}</strong></span>
                      <span className="rd-wrong-correct">Correct: <strong>{q.correctAnswer}</strong></span>
                    </div>
                    <div className="rd-wrong-meta">
                      <span>⏱️ {answer.timeTaken}s</span>
                      <span>🎯 {answer.confidence === "high" ? "Confident" : answer.confidence === "medium" ? "Maybe" : "Not Sure"}</span>
                      <span className="rd-wrong-concepts">{q.concepts.join(", ")}</span>
                    </div>
                  </div>
                );
              })}
              {wrongAnswers === 0 && (
                <div className="rd-perfect">🎉 Perfect score! All answers were correct.</div>
              )}
            </div>
          </div>

          {/* Full review (toggle) */}
          {showReview && (
            <div className="rd-full-review">
              {questions.map((q, i) => {
                const answer = answers[i];
                const isCorrect = answer?.selected === q.correctAnswer;
                return (
                  <div key={i} className={`rd-review-item ${isCorrect ? "correct" : "wrong"}`}>
                    <div className="rd-review-top">
                      <span className={`rd-review-badge ${isCorrect ? "correct" : "wrong"}`}>
                        {isCorrect ? "✓ Correct" : "✗ Wrong"}
                      </span>
                      <span className="rd-review-num">Q{i + 1}</span>
                      <span className="rd-review-time">⏱️ {answer?.timeTaken || 0}s</span>
                      <span className="rd-review-conf">
                        {answer?.confidence === "high" ? "😄 Confident" : answer?.confidence === "medium" ? "🤔 Maybe" : "😟 Not Sure"}
                      </span>
                    </div>
                    <p className="rd-review-question">{q.text}</p>
                    <div className="rd-review-options">
                      {q.options.map((opt, j) => {
                        const isSelected = answer?.selected === opt;
                        const isCorrectOpt = q.correctAnswer === opt;
                        let cls = "rd-review-opt";
                        if (isCorrectOpt) cls += " correct-opt";
                        if (isSelected && !isCorrect) cls += " wrong-opt";
                        return (
                          <div key={j} className={cls}>
                            <span className="rd-review-opt-letter">{String.fromCharCode(65 + j)}</span>
                            <span>{opt}</span>
                            {isCorrectOpt && <span className="rd-review-correct-mark">✓ Correct</span>}
                            {isSelected && !isCorrect && <span className="rd-review-wrong-mark">✗ Your Answer</span>}
                            {isSelected && isCorrect && <span className="rd-review-correct-mark">✓ Your Answer</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="rd-review-concepts">
                      Concepts: {q.concepts.join(", ")}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Chat Panel ── */}
        <section className="rd-section">
          <h2 className="rd-section-title">💬 Ask Your AI Tutor</h2>
          <ChatPanel diagnosisContext={diagnosis} />
        </section>
      </div>

      {/* Footer buttons */}
      <div className="rd-footer">
        <button className="rd-btn-retake" onClick={handleRetake}>
          🔄 Retake Same Quiz
        </button>
        {isCustom ? (
          <button className="rd-btn-secondary" onClick={() =>
            navigate("/quiz/custom", {
              state: {
                educationLevel: { id: educationLevel, label: eduInfo?.label || educationLevel, color: eduInfo?.color },
                customSubject,
              }
            })
          }>
            🆕 New Quiz (Same Topic)
          </button>
        ) : (
          <button className="rd-btn-secondary" onClick={() => navigate(`/quiz/${subject}`)}>
            🆕 New Quiz
          </button>
        )}
        <button className="rd-btn-primary" onClick={() => navigate("/")}>
          Choose Another Subject
        </button>
      </div>
    </div>
  );
}

function BehaviorBadge({ active, icon, label, desc, color, count }) {
  return (
    <div className={`rd-behavior-badge ${active ? "active" : ""}`} style={{ "--badge-color": color }}>
      <span className="rd-badge-icon">{icon}</span>
      <span className="rd-badge-label">{label}</span>
      <span className="rd-badge-desc">{desc}</span>
      {active && <span className="rd-badge-status">Detected ({count})</span>}
    </div>
  );
}

function ConfidenceCard({ label, emoji, total, correct, color, insight }) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="rd-conf-card">
      <div className="rd-conf-card-header">
        <span className="rd-conf-card-emoji">{emoji}</span>
        <span className="rd-conf-card-label">{label}</span>
      </div>
      <div className="rd-conf-card-stats">
        <span className="rd-conf-card-num">{correct}/{total}</span>
        <span className="rd-conf-card-pct" style={{ color }}>{accuracy}%</span>
      </div>
      <div className="rd-conf-card-bar">
        <div className="rd-conf-card-fill" style={{ width: `${accuracy}%`, background: color }} />
      </div>
      <p className="rd-conf-card-insight">{insight}</p>
    </div>
  );
}
