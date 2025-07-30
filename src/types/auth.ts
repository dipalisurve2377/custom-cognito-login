// User types
export interface User {
  username: string;
  email: string;
  attributes?: {
    email: string;
    email_verified?: boolean;
    sub: string;
    [key: string]: any;
  };
}

// Authentication tokens
export interface AuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Authentication state
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Login credentials
export interface LoginCredentials {
  username: string;
  password: string;
}

// Authentication response
export interface AuthResponse {
  success: boolean;
  user?: User;
  tokens?: AuthTokens;
  error?: string;
}

// Cognito error types
export interface CognitoError {
  code: string;
  name: string;
  message: string;
}

// Form validation errors
export interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

// Environment configuration
export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  region: string;
}
