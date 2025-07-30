import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import type {
  User,
  AuthTokens,
  AuthState,
  LoginCredentials,
  AuthResponse,
} from "../types/auth";
import * as authService from "../services/authService";

// Action types
type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; tokens: AuthTokens } }
  | { type: "LOGIN_FAILURE"; payload: string }
  | {
      type: "NEW_PASSWORD_REQUIRED";
      payload: {
        userAttributes: any;
        requiredAttributes: any;
        cognitoUser: any;
      };
    }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean };

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  requiresNewPassword: false,
  userAttributes: null,
  requiredAttributes: null,
  cognitoUser: null,
};

// Reducer function
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        requiresNewPassword: false,
        userAttributes: null,
        requiredAttributes: null,
        cognitoUser: null,
      };
    case "NEW_PASSWORD_REQUIRED":
      return {
        ...state,
        isLoading: false,
        error: null,
        requiresNewPassword: true,
        userAttributes: action.payload.userAttributes,
        requiredAttributes: action.payload.requiredAttributes,
        cognitoUser: action.payload.cognitoUser,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Context interface
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setNewPassword: (newPassword: string) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const isAuth = authService.isAuthenticated();
        const currentUser = authService.getCurrentUser();
        const tokens = authService.getStoredTokens();

        if (isAuth && currentUser && tokens) {
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user: currentUser, tokens },
          });
        } else {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: "LOGIN_START" });

    try {
      const response: AuthResponse = await authService.login(credentials);

      if (response.success && response.user && response.tokens) {
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user: response.user, tokens: response.tokens },
        });
      } else if (response.requiresNewPassword) {
        dispatch({
          type: "NEW_PASSWORD_REQUIRED",
          payload: {
            userAttributes: response.userAttributes,
            requiredAttributes: response.requiredAttributes,
            cognitoUser: response.cognitoUser,
          },
        });
      } else {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: response.error || "Login failed",
        });
      }
    } catch (error) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload: error instanceof Error ? error.message : "Login failed",
      });
    }
  };

  // Logout function
  const logout = (): void => {
    authService.logout();
    dispatch({ type: "LOGOUT" });
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // Set new password function
  const setNewPassword = async (newPassword: string): Promise<void> => {
    if (!state.cognitoUser) return;

    console.log("Context state.userAttributes:", state.userAttributes);
    console.log("Full context state:", state);

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response: AuthResponse = await authService.setNewPassword(
        state.cognitoUser,
        newPassword,
        state.userAttributes
      );

      if (response.success && response.user && response.tokens) {
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user: response.user, tokens: response.tokens },
        });
      } else {
        dispatch({
          type: "LOGIN_FAILURE",
          payload: response.error || "Failed to set new password",
        });
      }
    } catch (error) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload:
          error instanceof Error ? error.message : "Failed to set new password",
      });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    clearError,
    setNewPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
