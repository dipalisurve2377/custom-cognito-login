import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { FormErrors } from "../../types/auth";
import "./LoginForm.css";

const LoginForm: React.FC = () => {
  const { login, isLoading, error, clearError } = useAuth();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: "",
  });

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    let label = "";
    let color = "";

    if (password.length === 0) {
      return { score: 0, label: "", color: "" };
    }

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Determine label and color
    if (score <= 2) {
      label = "Weak";
      color = "#ff4444";
    } else if (score <= 4) {
      label = "Fair";
      color = "#ffaa00";
    } else if (score <= 6) {
      label = "Good";
      color = "#00aa00";
    } else {
      label = "Strong";
      color = "#008800";
    }

    return { score, label, color };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));

    // Calculate password strength for password field
    if (name === "password") {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }

    // Clear field-specific error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Clear general error when user starts typing
    if (formErrors.general) {
      setFormErrors((prev) => ({ ...prev, general: undefined }));
      clearError();
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!credentials.username.trim()) {
      errors.username = "Username/Email is required";
    }

    if (!credentials.password) {
      errors.password = "Password is required";
    } else if (credentials.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(credentials);
    } catch (err) {
      // Error is handled by the context
      console.error("Login error:", err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon">
            <img
              src="https://rdps-aws-prd-cdn.roadpost.ca/media/og_image/stores/1/square-roadpost-logo.png"
              alt="Roadpost Logo"
              className="brand-logo"
              style={{
                width: "100px",
                height: "100px",
                maxWidth: "100px",
              }}
            />
          </div>
        </div>
        <div className="login-header">
          <h1>Login</h1>
          <p>Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">
              Username or Email<span className="required-asterisk">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              className={formErrors.username ? "error" : ""}
              placeholder="Enter your username or email"
              disabled={isLoading}
            />
            {formErrors.username && (
              <span className="error-message">{formErrors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password<span className="required-asterisk">*</span>
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleInputChange}
                className={formErrors.password ? "error" : ""}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {credentials.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${(passwordStrength.score / 7) * 100}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  ></div>
                </div>
                <span
                  className="strength-label"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.label}
                </span>
              </div>
            )}

            {formErrors.password && (
              <span className="error-message">{formErrors.password}</span>
            )}
          </div>

          {error && (
            <div className="error-banner">
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <span>Signing In...</span>
              </div>
            ) : (
              "Continue"
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Copyright © 2025 Custom Cognito Login</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
