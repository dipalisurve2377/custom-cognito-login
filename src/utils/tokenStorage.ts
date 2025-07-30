import type { AuthTokens } from "../types/auth";
import Cookies from "js-cookie";

// Cookie configuration
const COOKIE_OPTIONS = {
  secure: import.meta.env.PROD, // Only secure in production
  sameSite: "strict" as const, // CSRF protection
  expires: 7, // 7 days
};

// Token storage keys
const TOKEN_KEYS = {
  ID_TOKEN: "cognito_id_token",
  ACCESS_TOKEN: "cognito_access_token",
  REFRESH_TOKEN: "cognito_refresh_token",
  EXPIRES_IN: "cognito_expires_in",
} as const;

// In-memory storage for tokens (for performance)
let memoryStorage: Partial<AuthTokens> = {};

// Store tokens in memory and cookies
export const storeTokens = (tokens: AuthTokens): void => {
  // Store in memory for quick access
  memoryStorage = { ...tokens };

  // Store in cookies with security options
  try {
    Cookies.set(TOKEN_KEYS.ID_TOKEN, tokens.idToken, COOKIE_OPTIONS);
    Cookies.set(TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken, COOKIE_OPTIONS);
    Cookies.set(TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken, COOKIE_OPTIONS);
    Cookies.set(
      TOKEN_KEYS.EXPIRES_IN,
      tokens.expiresIn.toString(),
      COOKIE_OPTIONS
    );
  } catch (error) {
    console.warn("Failed to store tokens in cookies:", error);
  }
};

// Retrieve tokens from memory first, then cookies
export const getTokens = (): AuthTokens | null => {
  // Check memory first for performance
  if (
    memoryStorage.idToken &&
    memoryStorage.accessToken &&
    memoryStorage.refreshToken
  ) {
    return memoryStorage as AuthTokens;
  }

  // Fallback to cookies
  try {
    const idToken = Cookies.get(TOKEN_KEYS.ID_TOKEN);
    const accessToken = Cookies.get(TOKEN_KEYS.ACCESS_TOKEN);
    const refreshToken = Cookies.get(TOKEN_KEYS.REFRESH_TOKEN);
    const expiresIn = Cookies.get(TOKEN_KEYS.EXPIRES_IN);

    if (idToken && accessToken && refreshToken && expiresIn) {
      const tokens: AuthTokens = {
        idToken,
        accessToken,
        refreshToken,
        expiresIn: parseInt(expiresIn, 10),
      };

      // Restore to memory
      memoryStorage = tokens;
      return tokens;
    }
  } catch (error) {
    console.warn("Failed to retrieve tokens from cookies:", error);
  }

  return null;
};

// Clear tokens from both memory and cookies
export const clearTokens = (): void => {
  memoryStorage = {};

  try {
    Cookies.remove(TOKEN_KEYS.ID_TOKEN);
    Cookies.remove(TOKEN_KEYS.ACCESS_TOKEN);
    Cookies.remove(TOKEN_KEYS.REFRESH_TOKEN);
    Cookies.remove(TOKEN_KEYS.EXPIRES_IN);
  } catch (error) {
    console.warn("Failed to clear tokens from cookies:", error);
  }
};

// Check if tokens are expired
export const isTokenExpired = (): boolean => {
  const tokens = getTokens();
  if (!tokens) return true;

  const now = Math.floor(Date.now() / 1000);
  return now >= tokens.expiresIn;
};

// Get token expiration time
export const getTokenExpiration = (): number | null => {
  const tokens = getTokens();
  return tokens ? tokens.expiresIn : null;
};

// Get remaining time until token expires (in seconds)
export const getTokenTimeRemaining = (): number => {
  const tokens = getTokens();
  if (!tokens) return 0;

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, tokens.expiresIn - now);
};
