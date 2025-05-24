/**
 * Application configuration based on environment variables
 */

// Helper to safely access environment variables
const getEnv = (key: string, defaultValue: string = ''): string => {
  // Next.js automatically handles NEXT_PUBLIC_ variables for both client and server
  return process.env[key] || defaultValue;
};

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005/api';

// Authentication Configuration
export const AUTH_ENDPOINTS = {
  login: `${API_BASE_URL}/token/`,
  refresh: `${API_BASE_URL}/token/refresh/`,
  register: `${API_BASE_URL}/users/`,
  me: `${API_BASE_URL}/users/me/`,
};

// JWT Configuration
export const JWT_CONFIG = {
  tokenKey: 'speedrun_coding_token',
  refreshTokenKey: 'speedrun_coding_refresh_token',
  tokenExpiry: 60 * 60, // 1 hour in seconds
};

// Feature Flags
export const FEATURES = {
  darkMode: getEnv('NEXT_PUBLIC_ENABLE_DARK_MODE', 'true') === 'true',
};

// App Metadata
export const APP_CONFIG = {
  name: 'Speedrun Coding v2',
  description: 'A LeetCode-style web application focused on coding speed',
}; 