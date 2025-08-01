import { getTokens, isTokenExpired } from "../utils/tokenStorage";
import { refreshTokens } from "./authService";

// API Configuration
const API_CONFIG = {
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
};

// Request headers interface
interface RequestHeaders {
  [key: string]: string;
}

// API Response interface
interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

// API Error interface
interface ApiError {
  message: string;
  status: number;
  data?: any;
}

// HTTP Methods
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

// Request options interface
interface RequestOptions {
  method: HttpMethod;
  url: string;
  headers?: RequestHeaders;
  body?: any;
  timeout?: number;
  retryAttempts?: number;
}

// Get authentication headers with tokens
export const getAuthHeaders = (): RequestHeaders => {
  const tokens = getTokens();
  const headers: RequestHeaders = {
    "Content-Type": "application/json",
  };

  if (tokens && !isTokenExpired()) {
    // Include ID token in Authorization header (most common for backend verification)
    headers["Authorization"] = `Bearer ${tokens.idToken}`;

    // Optionally include access token if the  backend requires it
    headers["X-Access-Token"] = tokens.accessToken;

    // Include refresh token if needed for backend token refresh
    headers["X-Refresh-Token"] = tokens.refreshToken;
  }

  return headers;
};

// Refresh tokens if expired
const refreshTokensIfNeeded = async (): Promise<boolean> => {
  const tokens = getTokens();

  if (!tokens) {
    return false;
  }

  if (isTokenExpired()) {
    try {
      // console.log("Tokens expired, attempting refresh...");
      const refreshResponse = await refreshTokens();
      return refreshResponse.success;
    } catch (error) {
      // console.error("Failed to refresh tokens:", error);
      return false;
    }
  }

  return true;
};

// Make HTTP request with authentication headers
export const makeAuthenticatedRequest = async <T = any>(
  options: RequestOptions
): Promise<ApiResponse<T>> => {
  const timeout = options.timeout || API_CONFIG.timeout;
  const retryAttempts = options.retryAttempts || API_CONFIG.retryAttempts;

  // Ensure tokens are fresh before making request
  const tokensValid = await refreshTokensIfNeeded();
  if (!tokensValid) {
    throw new Error("Authentication required. Please log in again.");
  }

  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const requestOptions: RequestInit = {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(options.url, {
      ...requestOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        // Token might be invalid, try to refresh
        const refreshSuccess = await refreshTokensIfNeeded();
        if (refreshSuccess && retryAttempts > 0) {
          // Retry the request once after refresh
          return makeAuthenticatedRequest({
            ...options,
            retryAttempts: retryAttempts - 1,
          });
        } else {
          throw new Error("Authentication failed. Please log in again.");
        }
      }

      // Handle other HTTP errors
      const errorData = await response.json().catch(() => ({}));
      throw {
        message:
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        data: errorData,
      } as ApiError;
    }

    const data = await response.json().catch(() => null);

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw {
          message: "Request timeout",
          status: 408,
        } as ApiError;
      }
      throw {
        message: error.message,
        status: 0,
      } as ApiError;
    }

    throw error;
  }
};

// Simple API Service class for making authenticated requests
class ApiService {
  // GET request
  async get<T = any>(
    url: string,
    headers?: RequestHeaders
  ): Promise<ApiResponse<T>> {
    return makeAuthenticatedRequest<T>({
      method: "GET",
      url,
      headers,
    });
  }

  // POST request
  async post<T = any>(
    url: string,
    data?: any,
    headers?: RequestHeaders
  ): Promise<ApiResponse<T>> {
    return makeAuthenticatedRequest<T>({
      method: "POST",
      url,
      headers,
      body: data,
    });
  }

  // PUT request
  async put<T = any>(
    url: string,
    data?: any,
    headers?: RequestHeaders
  ): Promise<ApiResponse<T>> {
    return makeAuthenticatedRequest<T>({
      method: "PUT",
      url,
      headers,
      body: data,
    });
  }

  // DELETE request
  async delete<T = any>(
    url: string,
    headers?: RequestHeaders
  ): Promise<ApiResponse<T>> {
    return makeAuthenticatedRequest<T>({
      method: "DELETE",
      url,
      headers,
    });
  }

  // PATCH request
  async patch<T = any>(
    url: string,
    data?: any,
    headers?: RequestHeaders
  ): Promise<ApiResponse<T>> {
    return makeAuthenticatedRequest<T>({
      method: "PATCH",
      url,
      headers,
      body: data,
    });
  }

  // Upload file with authentication
  async uploadFile<T = any>(
    url: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const tokens = getTokens();
    const headers: RequestHeaders = {};

    if (tokens && !isTokenExpired()) {
      headers["Authorization"] = `Bearer ${tokens.idToken}`;
      headers["X-Access-Token"] = tokens.accessToken;
      headers["X-Refresh-Token"] = tokens.refreshToken;
    }

    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message:
          errorData.message ||
          `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        data: errorData,
      } as ApiError;
    }

    const data = await response.json().catch(() => null);

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types for external use
export type { ApiResponse, ApiError, RequestHeaders, RequestOptions };
