import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import type { FormErrors } from "../../types/auth";
import "./NewPasswordForm.css";

interface NewPasswordFormProps {
  cognitoUser?: any;
  userAttributes?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const NewPasswordForm: React.FC<NewPasswordFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { setNewPassword } = useAuth();
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    // Clear general error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!passwords.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwords.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwords.newPassword)) {
      errors.newPassword =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!passwords.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Attempting to set new password...");
      await setNewPassword(passwords.newPassword);
      console.log("Password set successfully!");
      // If we reach here, it means success (context handles the state)
      onSuccess();
    } catch (err) {
      console.error("Error in NewPasswordForm:", err);
      setError(
        err instanceof Error ? err.message : "Failed to set new password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="new-password-container">
      <div className="new-password-card">
        <div className="new-password-header">
          <h1>Set New Password</h1>
          <p>Please set a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="new-password-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password*</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handleInputChange}
              className={formErrors.newPassword ? "error" : ""}
              placeholder="Enter your new password"
              disabled={isLoading}
            />
            {formErrors.newPassword && (
              <span className="error-message">{formErrors.newPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password*</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={handleInputChange}
              className={formErrors.confirmPassword ? "error" : ""}
              placeholder="Confirm your new password"
              disabled={isLoading}
            />
            {formErrors.confirmPassword && (
              <span className="error-message">
                {formErrors.confirmPassword}
              </span>
            )}
          </div>

          {error && (
            <div className="error-banner">
              <span>{error}</span>
            </div>
          )}

          <div className="button-group">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-button"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? "Setting Password..." : "Set Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPasswordForm;
