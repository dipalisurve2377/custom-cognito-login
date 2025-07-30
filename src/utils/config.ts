import type { CognitoConfig } from "../types/auth";

// Load environment variables
export const getCognitoConfig = (): CognitoConfig => {
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const region = import.meta.env.VITE_COGNITO_REGION;

  // Check if using placeholder values
  if (
    userPoolId === "your-user-pool-id-here" ||
    clientId === "your-client-id-here"
  ) {
    throw new Error(
      "Please update your .env file with your actual AWS Cognito credentials. Replace the placeholder values with your real User Pool ID and Client ID."
    );
  }

  if (!userPoolId || !clientId || !region) {
    throw new Error(
      "Missing required environment variables. Please check your .env file and ensure VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID, and VITE_COGNITO_REGION are set."
    );
  }

  return {
    userPoolId,
    clientId,
    region,
  };
};

// Validate environment variables
export const validateEnvironment = (): boolean => {
  try {
    getCognitoConfig();
    return true;
  } catch (error) {
    console.error("Environment validation failed:", error);
    return false;
  }
};
