// src/services/environment.js

/**
 * Determines the application's current running environment.
 * It checks Vercel's system environment variable and maps to two modes:
 * PROD and dev.
 */
const getAppEnv = () => {
  const vercelEnv = import.meta.env.VITE_VERCEL_ENV;
  if (vercelEnv === 'production') {
    return 'PROD';
  }
  // Preview and local both use dev configuration.
  return 'dev';
};

export const APP_ENV = getAppEnv();

/**
 * Disable console logs in production
 */
export const DISABLE_CONSOLE_IN_PROD = true;
