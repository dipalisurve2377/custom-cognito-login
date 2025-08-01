import { getTokens, isTokenExpired } from "./tokenStorage";
import {
  getAuthHeaders,
  makeAuthenticatedRequest,
} from "../services/apiService";

// Integration utility for other projects
export class AuthIntegration {
  /**
   * Get authentication headers for use in other projects
   * @returns Object containing authentication headers
   */
  static getAuthHeaders() {
    return getAuthHeaders();
  }

  /**
   * Check if user is authenticated
   * @returns boolean indicating if user is authenticated
   */
  static isAuthenticated(): boolean {
    const tokens = getTokens();
    return tokens !== null && !isTokenExpired();
  }

  /**
   * Get current tokens
   * @returns AuthTokens object or null if not authenticated
   */
  static getCurrentTokens() {
    return getTokens();
  }

  /**
   * Make an authenticated request to any URL
   * Useful for integrating with other projects' APIs
   * @param url - The URL to make the request to
   * @param options - Request options
   * @returns Promise with the response
   */
  static async makeRequest<T = any>(
    url: string,
    options: {
      method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
      headers?: Record<string, string>;
      body?: any;
      timeout?: number;
    }
  ) {
    return makeAuthenticatedRequest<T>({
      url,
      method: options.method,
      headers: options.headers,
      body: options.body,
      timeout: options.timeout,
    });
  }

  /**
   * Create a fetch wrapper that automatically includes authentication headers
   * @returns A function that works like fetch but includes auth headers
   */
  static createAuthenticatedFetch() {
    return async (url: string, options: RequestInit = {}) => {
      const authHeaders = getAuthHeaders();

      const headers = {
        ...authHeaders,
        ...options.headers,
      };

      return fetch(url, {
        ...options,
        headers,
      });
    };
  }

  /**
   * Get a simple object with all tokens for manual header construction
   * @returns Object with idToken, accessToken, and refreshToken
   */
  static getTokensForManualUse() {
    const tokens = getTokens();
    if (!tokens) return null;

    return {
      idToken: tokens.idToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }
}

// Export convenience functions
export const getAuthHeadersForIntegration = () =>
  AuthIntegration.getAuthHeaders();
export const isUserAuthenticated = () => AuthIntegration.isAuthenticated();
export const getTokensForIntegration = () => AuthIntegration.getCurrentTokens();
export const createAuthenticatedFetch = () =>
  AuthIntegration.createAuthenticatedFetch();
