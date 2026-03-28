import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./components/LoginPage";
import SubjectSelection from "./components/SubjectSelection";
import QuizPage from "./components/QuizPage";
import ResultDashboard from "./components/ResultDashboard";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d0d0d",
        color: "#c084fc",
        fontFamily: "'Inter', sans-serif",
        fontSize: "16px",
        fontWeight: 600,
      }}>
        Loading...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={
          <AuthRoute><LoginPage /></AuthRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute><SubjectSelection /></ProtectedRoute>
        } />
        <Route path="/quiz/:subject" element={
          <ProtectedRoute><QuizPage /></ProtectedRoute>
        } />
        <Route path="/results" element={
          <ProtectedRoute><ResultDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
