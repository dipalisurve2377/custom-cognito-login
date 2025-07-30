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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));

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
            />
          </div>
        </div>
        <div className="login-header">
          <h1>Login</h1>
          <p>Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username or Email*</label>
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
            <label htmlFor="password">Password*</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              className={formErrors.password ? "error" : ""}
              placeholder="Enter your password"
              disabled={isLoading}
            />
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
            {isLoading ? "Signing In..." : "Continue"}
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
