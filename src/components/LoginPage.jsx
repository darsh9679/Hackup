import React, { useState } from "react";
import { signInWithGoogle, signInWithEmail, registerWithEmail, resetPassword } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import "./LoginPage.css";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const EyeIcon = ({ show }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {show ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </>
    )}
  </svg>
);

const SpinnerIcon = () => (
  <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#c084fc" opacity="0.15"/>
    <path d="M8 12h16M8 16h12M8 20h8" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="22" cy="20" r="4" fill="#c084fc" opacity="0.3" stroke="#c084fc" strokeWidth="1.5"/>
    <path d="M20 20l1.5 1.5L24 18.5" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const getFriendlyError = (code) => {
  const errors = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Try again.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
    "auth/popup-blocked": "Popup was blocked by your browser. Please allow popups and try again.",
    "auth/cancelled-popup-request": "Sign-in was cancelled. Please try again.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/operation-not-allowed": "Google sign-in is not enabled. Please enable it in Firebase Console.",
    "auth/unauthorized-domain": "This domain is not authorised. Add localhost to Firebase Console → Authentication → Settings → Authorised domains.",
  };
  return errors[code] || `An error occurred (${code}). Please try again.`;
};

export default function LoginPage() {
  const { user, signOut } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' | 'register' | 'reset'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = () => { setError(""); setSuccess(""); };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    clearMessages();
    try {
      await signInWithGoogle();
      setSuccess("Signed in with Google! 🎉");
    } catch (err) {
      console.error("Google sign-in error:", err.code, err.message);
      setError(getFriendlyError(err.code));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      if (mode === "reset") {
        await resetPassword(email);
        setSuccess("Password reset email sent! Check your inbox 📧");
        setMode("login");
      } else if (mode === "register") {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password);
        setSuccess("Account created successfully! 🎉");
      } else {
        await signInWithEmail(email, password);
        setSuccess("Welcome back! 👋");
      }
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    clearMessages();
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  /* ---- DASHBOARD ---- */
  if (user) {
    return (
      <div className="lp-root">
        <div className="lp-noise" />
        <div className="lp-card dashboard-card" id="dashboard-card">
          <div className="dashboard-avatar">
            {user.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                {(user.displayName || user.email || "U")[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="dashboard-badge">✓ Authenticated</div>
          <h1 className="dashboard-title">
            Welcome{user.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}!
          </h1>
          <p className="dashboard-email">{user.email}</p>
          <div className="dashboard-info">
            <div className="info-item">
              <span className="info-label">Provider</span>
              <span className="info-value">
                {user.providerData[0]?.providerId === "google.com" ? "🔵 Google" : "📧 Email"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">UID</span>
              <span className="info-value uid">{user.uid.slice(0, 16)}…</span>
            </div>
          </div>
          <button className="btn btn-signout" onClick={signOut} id="signout-btn">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  /* ---- AUTH CARD ---- */
  return (
    <div className="lp-root">
      <div className="lp-noise" />

      {/* Subtle corner crosshairs */}
      <div className="crosshair crosshair-tl" />
      <div className="crosshair crosshair-tr" />
      <div className="crosshair crosshair-bl" />
      <div className="crosshair crosshair-br" />

      <div className="lp-card" id="auth-card">

        {/* ── Brand header ── */}
        <div className="lp-header">
          <div className="lp-brand">
            <LogoIcon />
            <span className="lp-brand-name">
              LearnLens <span className="brand-ai">AI</span>
            </span>
          </div>
          <p className="lp-subtitle">
            {mode === "login" && "Root cause learning diagnosis"}
            {mode === "register" && "Start your learning journey"}
            {mode === "reset" && "Reset your password"}
          </p>
        </div>

        {/* ── Alerts ── */}
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="alert">{success}</div>}

        {/* ── Email Form ── */}
        <form className="lp-form" onSubmit={handleEmailAuth} noValidate>
          <div className="form-group">
            <label htmlFor="email-input" className="form-label">Email</label>
            <input
              id="email-input"
              type="email"
              className="form-input"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode !== "reset" && (
            <div className="form-group">
              <label htmlFor="password-input" className="form-label">Password</label>
              <div className="input-wrapper">
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  id="toggle-password"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon show={showPassword} />
                </button>
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="form-group">
              <label htmlFor="confirm-password-input" className="form-label">Confirm Password</label>
              <div className="input-wrapper">
                <input
                  id="confirm-password-input"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className="forgot-link-wrapper">
              <button
                type="button"
                className="forgot-link"
                onClick={() => switchMode("reset")}
                id="forgot-password-link"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || googleLoading}
            id="submit-auth-btn"
          >
            {loading ? (
              <><SpinnerIcon /> Processing…</>
            ) : (
              <>
                {mode === "login" && "Sign In"}
                {mode === "register" && "Create Account"}
                {mode === "reset" && "Send Reset Link"}
              </>
            )}
          </button>
        </form>

        {/* ── Divider ── */}
        {mode !== "reset" && (
          <>
            <div className="divider"><span>or</span></div>

            {/* ── Google Sign-In ── */}
            <button
              className="btn btn-google"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              id="google-signin-btn"
            >
              {googleLoading ? <SpinnerIcon /> : <GoogleIcon />}
              <span>Continue with Google</span>
            </button>
          </>
        )}

        {/* ── Back to login ── */}
        {mode === "reset" && (
          <button
            type="button"
            className="back-link"
            onClick={() => switchMode("login")}
            id="back-to-login"
          >
            ← Back to Sign In
          </button>
        )}

        {/* ── Footer switch ── */}
        {mode !== "reset" && (
          <p className="lp-footer">
            {mode === "login" ? (
              <>No account yet?{" "}
                <button className="switch-link" onClick={() => switchMode("register")} id="switch-to-register">
                  Sign Up
                </button>
              </>
            ) : (
              <>Already have an account?{" "}
                <button className="switch-link" onClick={() => switchMode("login")} id="switch-to-login">
                  Sign In
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
