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
let userPool: CognitoUserPool | null = null;

try {
  const config = getCognitoConfig();
  userPool = new CognitoUserPool({
    UserPoolId: config.userPoolId,
    ClientId: config.clientId,
  });
} catch (error) {
  console.warn(
    "Cognito not initialized - will show login form but authentication will fail:",
    error
  );
  // userPool will remain null, but the app will still show the login form
}

// Convert Cognito session to our AuthTokens format
const sessionToTokens = (session: CognitoUserSession): AuthTokens => {
  return {
    idToken: session.getIdToken().getJwtToken(),
    accessToken: session.getAccessToken().getJwtToken(),
    refreshToken: session.getRefreshToken().getToken(),
    expiresIn: session.getAccessToken().getExpiration(),
  };
};

// Get user attributes from ID token
const getUserAttributesFromToken = (session: CognitoUserSession): any => {
  try {
    const idToken = session.getIdToken();
    const payload = idToken.decodePayload();
    return payload;
  } catch (error) {
    console.warn("Failed to decode ID token payload:", error);
    return {};
  }
};

// Get user attributes from stored token string
const getUserAttributesFromStoredToken = (tokenString: string): any => {
  try {
    // Decode JWT token (without verification for client-side use)
    const base64Url = tokenString.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.warn("Failed to decode stored token payload:", error);
    return {};
  }
};

// Convert Cognito user to our User format
const cognitoUserToUser = (
  cognitoUser: CognitoUser,
  session?: CognitoUserSession
): User => {
  const username = cognitoUser.getUsername();
  let email = username;
  let attributes: any = {
    email: username,
    sub: username,
  };

  // If we have a session, try to get attributes from the ID token
  if (session) {
    try {
      const tokenAttributes = getUserAttributesFromToken(session);
      if (tokenAttributes.email) {
        email = tokenAttributes.email;
        attributes = { ...attributes, ...tokenAttributes };
      }
    } catch (error) {
      console.warn("Failed to get attributes from session:", error);
    }
  }

  return {
    username: username,
    email: email,
    attributes: attributes,
  };
};

// Login function
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  return new Promise((resolve, reject) => {
    console.log("Attempting login with username:", credentials.username);
    console.log("UserPool configured:", !!userPool);

    if (!userPool) {
      reject({
        success: false,
        error:
          "Authentication service not configured. Please check your AWS Cognito credentials.",
      });
      return;
    }

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
        const user = cognitoUserToUser(cognitoUser, session);

        // Store tokens
        storeTokens(tokens);

        resolve({
          success: true,
          user,
          tokens,
        });
      },
      onFailure: (error: CognitoError) => {
        console.error("Cognito authentication error:", error);
        reject({
          success: false,
          error: error.message,
        });
      },
      newPasswordRequired: (userAttributes: any, requiredAttributes: any) => {
        console.log("New password required for user:", userAttributes);
        resolve({
          success: false,
          requiresNewPassword: true,
          userAttributes,
          requiredAttributes,
          cognitoUser,
        });
      },
    });
  });
};

// Logout function
export const logout = (): void => {
  if (userPool) {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
    }
  }
  clearTokens();
};

// Get current user
export const getCurrentUser = (): User | null => {
  if (!userPool) return null;

  const currentUser = userPool.getCurrentUser();
  if (!currentUser) return null;

  // Get tokens to extract user attributes
  const tokens = getTokens();
  if (!tokens) return null;

  // Create a mock session from stored tokens to extract attributes
  try {
    const idToken = tokens.idToken;
    const tokenAttributes = getUserAttributesFromStoredToken(idToken);

    return {
      username: currentUser.getUsername(),
      email: tokenAttributes.email || currentUser.getUsername(),
      attributes: {
        email: tokenAttributes.email || currentUser.getUsername(),
        sub: tokenAttributes.sub || currentUser.getUsername(),
        ...tokenAttributes,
      },
    };
  } catch (error) {
    console.warn("Failed to get user attributes from stored token:", error);
    // Fallback to basic user info
    return {
      username: currentUser.getUsername(),
      email: currentUser.getUsername(),
      attributes: {
        email: currentUser.getUsername(),
        sub: currentUser.getUsername(),
      },
    };
  }
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
    if (!userPool) {
      reject({
        success: false,
        error: "Authentication service not configured",
      });
      return;
    }

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

// Set new password
export const setNewPassword = async (
  cognitoUser: any,
  newPassword: string,
  userAttributes?: any
): Promise<AuthResponse> => {
  return new Promise((resolve, reject) => {
    // Prepare attributes for the challenge
    const attributes = userAttributes || {};

    console.log("User attributes received:", userAttributes);

    // Filter out non-mutable attributes that cannot be modified
    const mutableAttributes: any = {};
    Object.keys(attributes).forEach((key) => {
      // Skip read-only attributes and already provided attributes
      if (
        key !== "email_verified" &&
        key !== "sub" &&
        key !== "cognito:username" &&
        key !== "email" // Email is already provided and cannot be modified
      ) {
        mutableAttributes[key] = attributes[key];
      }
    });

    // Ensure required attributes are present
    if (!mutableAttributes.name && attributes.email) {
      // Use email prefix as name if name is missing (use original attributes for email)
      mutableAttributes.name = attributes.email.split("@")[0];
      console.log("Generated name from email:", mutableAttributes.name);
    }

    console.log("Mutable attributes being sent to Cognito:", mutableAttributes);

    cognitoUser.completeNewPasswordChallenge(newPassword, mutableAttributes, {
      onSuccess: (session: CognitoUserSession) => {
        const tokens = sessionToTokens(session);
        const user = cognitoUserToUser(cognitoUser, session);

        // Store tokens
        storeTokens(tokens);

        resolve({
          success: true,
          user,
          tokens,
        });
      },
      onFailure: (error: CognitoError) => {
        console.error("Set new password error:", error);
        reject({
          success: false,
          error: error.message,
        });
      },
    });
  });
};

// Get stored tokens
export const getStoredTokens = (): AuthTokens | null => {
  return getTokens();
};
