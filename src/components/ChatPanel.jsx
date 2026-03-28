import React, { useState, useRef, useEffect } from "react";
import { chatWithTutor } from "../services/groqService";
import "./ChatPanel.css";

const SUGGESTED_QUESTIONS = [
  "Why is {rootCause} my weakest area?",
  "What should I study first?",
  "Can you explain {rootCause} simply?",
  "How are my weak concepts connected?",
  "Give me a study plan for this week",
];

export default function ChatPanel({ diagnosisContext }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const rootCause = diagnosisContext?.rootCause?.concept || "the weak concept";

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const greeting = `Hi! 👋 I'm your LearnLens AI Tutor. I've analyzed your ${diagnosisContext?.subject || ""} diagnosis and I'm ready to help you understand your results. Ask me anything about your weak areas, learning path, or any concept you'd like explained!`;
    setMessages([{ role: "assistant", content: greeting }]);
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: "user", content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithTutor(text.trim(), diagnosisContext, chatHistory);
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't process that. Please try again. 🔄",
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (q) => {
    const processed = q.replace("{rootCause}", rootCause);
    sendMessage(processed);
  };

  return (
    <div className="cp-container" id="chat-panel">
      <div className="cp-header">
        <div className="cp-header-icon">🤖</div>
        <div>
          <h3 className="cp-header-title">AI Learning Tutor</h3>
          <p className="cp-header-sub">Ask about your diagnosis & concepts</p>
        </div>
      </div>

      {/* Messages */}
      <div className="cp-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`cp-msg cp-msg-${msg.role}`}>
            {msg.role === "assistant" && <div className="cp-msg-avatar">🤖</div>}
            <div className="cp-msg-bubble">
              <div className="cp-msg-content">{formatMessage(msg.content)}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="cp-msg cp-msg-assistant">
            <div className="cp-msg-avatar">🤖</div>
            <div className="cp-msg-bubble">
              <div className="cp-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="cp-suggestions">
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              className="cp-suggestion-btn"
              onClick={() => handleSuggestion(q)}
            >
              {q.replace("{rootCause}", rootCause)}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form className="cp-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="cp-input"
          placeholder="Ask about your diagnosis..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          id="chat-input"
        />
        <button
          type="submit"
          className="cp-send-btn"
          disabled={!input.trim() || loading}
          id="chat-send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </form>
    </div>
  );
}

function formatMessage(text) {
  // Simple markdown-like formatting
  return text.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="cp-bold">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return <p key={i} className="cp-list-item">• {line.slice(2)}</p>;
    }
    if (line.trim() === "") return <br key={i} />;
    // Bold inline
    const parts = line.split(/\*\*(.*?)\*\*/g);
    if (parts.length > 1) {
      return (
        <p key={i}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
        </p>
      );
    }
    return <p key={i}>{line}</p>;
  });
}
