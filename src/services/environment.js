// src/services/environment.js

/**
 * Determines the application's current running environment.
 * It checks Vercel's system environment variable to distinguish between
 * production, preview, and local development environments.
 */
const getAppEnv = () => {
  const vercelEnv = import.meta.env.VITE_VERCEL_ENV;
  if (vercelEnv === 'production') {
    return 'PROD';
  }
  if (vercelEnv === 'preview') {
    return 'test';
  }
  return 'dev';
};

export const APP_ENV = getAppEnv();

/**
 * Disable console logs in production
 */
export const DISABLE_CONSOLE_IN_PROD = true;
