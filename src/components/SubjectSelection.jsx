import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./SubjectSelection.css";

const subjects = [
  {
    id: "DSA",
    name: "Data Structures & Algorithms",
    short: "DSA",
    icon: "⟨/⟩",
    color: "#c084fc",
    description: "Arrays, Trees, Graphs, Recursion, Sorting, Searching, and Dynamic Programming",
    concepts: 12,
  },
  {
    id: "OS",
    name: "Operating Systems",
    short: "OS",
    icon: "⚙️",
    color: "#60a5fa",
    description: "Processes, Threads, Scheduling, Synchronization, Deadlocks, and Memory Management",
    concepts: 9,
  },
  {
    id: "DBMS",
    name: "Database Management",
    short: "DBMS",
    icon: "🗃️",
    color: "#34d399",
    description: "Tables, Keys, Joins, Normalization, Transactions, and Indexing",
    concepts: 9,
  },
];

const EDUCATION_LEVELS = [
  { id: "school", label: "School", icon: "🏫", color: "#f472b6", desc: "Classes 6–12, basics & fundamentals" },
  { id: "college", label: "College", icon: "🎒", color: "#60a5fa", desc: "Diploma & intermediate level" },
  { id: "undergraduate", label: "Undergraduate", icon: "📚", color: "#c084fc", desc: "Bachelor's degree courses" },
  { id: "graduate", label: "Graduate", icon: "🎓", color: "#34d399", desc: "Master's & postgraduate level" },
  { id: "phd", label: "PhD", icon: "🔬", color: "#f59e0b", desc: "Research & doctoral level" },
];

const SUBJECT_SUGGESTIONS = {
  school: [
    "Mathematics", "Physics", "Chemistry", "Biology", "English Grammar",
    "History", "Geography", "Computer Science", "Environmental Science",
    "Economics", "Political Science", "Hindi", "Algebra", "Geometry",
    "Trigonometry", "Organic Chemistry", "Mechanics",
  ],
  college: [
    "Calculus", "Linear Algebra", "Statistics", "Economics", "Psychology",
    "Sociology", "Philosophy", "Political Science", "Accounting",
    "Business Studies", "Engineering Drawing", "Communication Skills",
    "Environmental Studies", "Data Analysis", "Financial Management",
  ],
  undergraduate: [
    "Data Structures & Algorithms", "Operating Systems", "Database Management",
    "Computer Networks", "Software Engineering", "Digital Electronics",
    "Machine Learning", "Discrete Mathematics", "Organic Chemistry",
    "Thermodynamics", "Microeconomics", "Macroeconomics", "Linear Algebra",
    "Probability & Statistics", "Signal Processing", "Control Systems",
    "Artificial Intelligence", "Web Development", "Compiler Design",
    "Theory of Computation", "Electromagnetic Theory", "Fluid Mechanics",
  ],
  graduate: [
    "Advanced Algorithms", "Distributed Systems", "Natural Language Processing",
    "Computer Vision", "Deep Learning", "Cloud Computing", "Cryptography",
    "Information Theory", "Advanced Database Systems", "Robotics",
    "Quantum Computing", "Data Mining", "Parallel Computing",
    "Advanced Operating Systems", "Network Security", "Big Data Analytics",
    "Reinforcement Learning", "Game Theory", "Advanced Statistics",
  ],
  phd: [
    "Research Methodology", "Advanced Statistical Methods",
    "Computational Complexity", "Quantum Information", "Theoretical CS",
    "Advanced Machine Learning", "Bayesian Methods", "Causal Inference",
    "Formal Verification", "Type Theory", "Category Theory",
    "Advanced Cryptography", "Computational Biology", "Neuroinformatics",
    "Optimization Theory", "Information Geometry",
  ],
};

export default function SubjectSelection() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1 = education, 2 = subject
  const [selectedEducation, setSelectedEducation] = useState(null);
  const [subjectInput, setSubjectInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Filter suggestions based on input
  const suggestions = selectedEducation
    ? (SUBJECT_SUGGESTIONS[selectedEducation.id] || []).filter(s =>
        s.toLowerCase().includes(subjectInput.toLowerCase())
      )
    : [];

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when step 2 appears
  useEffect(() => {
    if (wizardStep === 2 && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 350);
    }
  }, [wizardStep]);

  const handleEducationSelect = (edu) => {
    setSelectedEducation(edu);
    setSubjectInput("");
    setTimeout(() => setWizardStep(2), 200);
  };

  const handleSubjectSelect = (subject) => {
    setSubjectInput(subject);
    setShowSuggestions(false);
  };

  const handleStartCustomQuiz = () => {
    if (!subjectInput.trim()) return;
    navigate("/quiz/custom", {
      state: {
        educationLevel: selectedEducation,
        customSubject: subjectInput.trim(),
      },
    });
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setSelectedEducation(null);
    setSubjectInput("");
  };

  const handleOpenWizard = () => {
    setShowWizard(true);
    setWizardStep(1);
    setSelectedEducation(null);
    setSubjectInput("");
  };

  return (
    <div className="ss-root">
      <div className="ss-noise" />

      {/* Header */}
      <header className="ss-header">
        <div className="ss-brand">
          <div className="ss-logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#c084fc" opacity="0.15"/>
              <path d="M10 10l6 6-6 6" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 10l6 6-6 6" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
            </svg>
          </div>
          <span className="ss-brand-text">
            LearnLens <span className="ss-brand-ai">AI</span>
          </span>
        </div>
        <div className="ss-user">
          <div className="ss-user-info">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="ss-avatar" />
            ) : (
              <div className="ss-avatar-placeholder">
                {(user?.displayName || user?.email || "U")[0].toUpperCase()}
              </div>
            )}
            <span className="ss-user-name">{user?.displayName || user?.email}</span>
          </div>
          <button className="ss-logout" onClick={signOut}>Sign Out</button>
        </div>
      </header>

      {/* Hero */}
      <section className="ss-hero">
        <h1 className="ss-title">Root Cause Learning Diagnosis</h1>
        <p className="ss-desc">
          Discover <strong>why</strong> you're struggling, not just what. Our AI-powered diagnostic pinpoints
          the foundational gaps holding you back and creates a personalized learning path.
        </p>
      </section>

      {/* Subject Cards */}
      <div className="ss-grid">
        {subjects.map((s, i) => (
          <div
            key={s.id}
            className="ss-card"
            style={{ "--accent": s.color, animationDelay: `${i * 0.1}s` }}
            onClick={() => navigate(`/quiz/${s.id}`)}
            id={`subject-${s.id}`}
          >
            <div className="ss-card-icon">{s.icon}</div>
            <h2 className="ss-card-title">{s.name}</h2>
            <p className="ss-card-desc">{s.description}</p>
            <div className="ss-card-meta">
              <span className="ss-card-concepts">{s.concepts} concepts</span>
              <span className="ss-card-badge">Diagnostic Quiz</span>
            </div>
            <button className="ss-card-btn">
              Start Diagnosis →
            </button>
          </div>
        ))}

        {/* Custom Topic Card */}
        <div
          className="ss-card ss-card-custom"
          style={{ "--accent": "#f59e0b", animationDelay: "0.3s" }}
          onClick={handleOpenWizard}
          id="subject-custom"
        >
          <div className="ss-card-icon">✨</div>
          <h2 className="ss-card-title">Custom Topic</h2>
          <p className="ss-card-desc">
            Choose your education level and enter any subject or topic — AI will generate a personalized diagnostic quiz just for you.
          </p>
          <div className="ss-card-meta">
            <span className="ss-card-concepts">Any subject</span>
            <span className="ss-card-badge">Personalized</span>
          </div>
          <button className="ss-card-btn">
            Create Your Quiz ✨
          </button>
        </div>
      </div>

      {/* ── Custom Topic Wizard Overlay ── */}
      {showWizard && (
        <div className="ss-wizard-overlay" onClick={handleCloseWizard}>
          <div className="ss-wizard-panel" onClick={e => e.stopPropagation()}>
            <button className="ss-wizard-close" onClick={handleCloseWizard}>✕</button>

            {/* Step Indicator */}
            <div className="ss-wizard-steps">
              <div className={`ss-wizard-step-dot ${wizardStep >= 1 ? "active" : ""}`}>
                <span>1</span>
              </div>
              <div className={`ss-wizard-step-line ${wizardStep >= 2 ? "active" : ""}`} />
              <div className={`ss-wizard-step-dot ${wizardStep >= 2 ? "active" : ""}`}>
                <span>2</span>
              </div>
            </div>

            {/* Step 1: Education Level */}
            <div className={`ss-wizard-content ${wizardStep === 1 ? "visible" : "hidden-left"}`}>
              <h2 className="ss-wizard-title">What's your education level?</h2>
              <p className="ss-wizard-subtitle">This helps us calibrate question difficulty and depth.</p>

              <div className="ss-edu-grid">
                {EDUCATION_LEVELS.map((edu, i) => (
                  <button
                    key={edu.id}
                    className={`ss-edu-card ${selectedEducation?.id === edu.id ? "selected" : ""}`}
                    style={{ "--edu-color": edu.color, animationDelay: `${i * 0.06}s` }}
                    onClick={() => handleEducationSelect(edu)}
                    id={`edu-${edu.id}`}
                  >
                    <span className="ss-edu-icon">{edu.icon}</span>
                    <span className="ss-edu-label">{edu.label}</span>
                    <span className="ss-edu-desc">{edu.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Subject Input with Autocomplete */}
            <div className={`ss-wizard-content ${wizardStep === 2 ? "visible" : "hidden-right"}`}>
              <button className="ss-wizard-back" onClick={() => setWizardStep(1)}>
                ← Back
              </button>
              <h2 className="ss-wizard-title">What subject do you want to study?</h2>
              <p className="ss-wizard-subtitle">
                Type your subject or pick from suggestions for
                <span className="ss-wizard-edu-badge" style={{ color: selectedEducation?.color }}>
                  {" "}{selectedEducation?.icon} {selectedEducation?.label}
                </span>
              </p>

              <div className="ss-subject-input-wrap">
                <input
                  ref={inputRef}
                  type="text"
                  className="ss-subject-input"
                  placeholder="e.g. Organic Chemistry, Machine Learning, World History..."
                  value={subjectInput}
                  onChange={(e) => {
                    setSubjectInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && subjectInput.trim()) {
                      handleStartCustomQuiz();
                    }
                  }}
                  id="subject-input"
                />
                <span className="ss-subject-input-icon">🔍</span>

                {/* Autocomplete suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="ss-suggestions" ref={suggestionsRef}>
                    {suggestions.slice(0, 8).map((s, i) => (
                      <button
                        key={i}
                        className="ss-suggestion-item"
                        onClick={() => handleSubjectSelect(s)}
                        style={{ animationDelay: `${i * 0.03}s` }}
                      >
                        <span className="ss-suggestion-icon">📘</span>
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular suggestions chips */}
              {!subjectInput && selectedEducation && (
                <div className="ss-popular">
                  <span className="ss-popular-label">Popular choices:</span>
                  <div className="ss-popular-chips">
                    {(SUBJECT_SUGGESTIONS[selectedEducation.id] || []).slice(0, 6).map((s, i) => (
                      <button
                        key={i}
                        className="ss-popular-chip"
                        onClick={() => handleSubjectSelect(s)}
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary & Start */}
              {subjectInput.trim() && (
                <div className="ss-summary-card">
                  <div className="ss-summary-row">
                    <span className="ss-summary-label">Education</span>
                    <span className="ss-summary-value" style={{ color: selectedEducation?.color }}>
                      {selectedEducation?.icon} {selectedEducation?.label}
                    </span>
                  </div>
                  <div className="ss-summary-row">
                    <span className="ss-summary-label">Subject</span>
                    <span className="ss-summary-value">{subjectInput}</span>
                  </div>
                  <button
                    className="ss-start-btn"
                    onClick={handleStartCustomQuiz}
                    id="start-custom-quiz"
                  >
                    🚀 Continue to Quiz Setup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="ss-footer">
        <p>LearnLens uses concept dependency graphs and multi-signal analysis for accurate diagnosis.</p>
      </footer>
    </div>
  );
}
