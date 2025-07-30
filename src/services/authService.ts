import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoRefreshToken,
} from "amazon-cognito-identity-js";

import type {
  User,
  AuthTokens,
  LoginCredentials,
  AuthResponse,
  CognitoError,
} from "../types/auth";

import { getCognitoConfig } from "../utils/config";
import {
  storeTokens,
  getTokens,
  clearTokens,
  isTokenExpired,
} from "../utils/tokenStorage";

// Initialize Cognito User Pool

const config = getCognitoConfig();

const userPool = new CognitoUserPool({
  UserPoolId: config.userPoolId,
  ClientId: config.clientId,
});

// Convert Cognito session to our AuthTokens format
const sessionToTokens = (session: CognitoUserSession): AuthTokens => {
  return {
    idToken: session.getIdToken().getJwtToken(),
    accessToken: session.getAccessToken().getJwtToken(),
    refreshToken: session.getRefreshToken().getToken(),
    expiresIn: session.getAccessToken().getExpiration(),
  };
};

// Convert Cognito user to our User format
const cognitoUserToUser = (cognitoUser: CognitoUser): User => {
  return {
    username: cognitoUser.getUsername(),
    email: cognitoUser.getUsername(), // Assuming username is email
    attributes: {
      email: cognitoUser.getUsername(),
      sub: cognitoUser.getUsername(),
    },
  };
};

// Login function
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: credentials.username,
      Password: credentials.password,
    });

    const cognitoUser = new CognitoUser({
      Username: credentials.username,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session: CognitoUserSession) => {
        const tokens = sessionToTokens(session);
        const user = cognitoUserToUser(cognitoUser);

        // Store tokens
        storeTokens(tokens);

        resolve({
          success: true,
          user,
          tokens,
        });
      },
      onFailure: (error: CognitoError) => {
        reject({
          success: false,
          error: error.message,
        });
      },
    });
  });
};

// Logout function
export const logout = (): void => {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
  clearTokens();
};

// Get current user
export const getCurrentUser = (): User | null => {
  const currentUser = userPool.getCurrentUser();
  if (!currentUser) return null;

  return cognitoUserToUser(currentUser);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const tokens = getTokens();
  if (!tokens) return false;

  return !isTokenExpired();
};

// Refresh tokens
export const refreshTokens = async (): Promise<AuthResponse> => {
  return new Promise((resolve, reject) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      reject({
        success: false,
        error: "No current user found",
      });
      return;
    }

    const tokens = getTokens();
    if (!tokens) {
      reject({
        success: false,
        error: "No tokens found",
      });
      return;
    }

    const refreshToken = new CognitoRefreshToken({
      RefreshToken: tokens.refreshToken,
    });

    currentUser.refreshSession(refreshToken, (error, session) => {
      if (error) {
        reject({
          success: false,
          error: error.message,
        });
        return;
      }

      if (session) {
        const newTokens = sessionToTokens(session);
        storeTokens(newTokens);

        resolve({
          success: true,
          tokens: newTokens,
        });
      } else {
        reject({
          success: false,
          error: "Failed to refresh session",
        });
      }
    });
  });
};

// Get stored tokens
export const getStoredTokens = (): AuthTokens | null => {
  return getTokens();
};
