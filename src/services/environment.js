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
 * Feature toggles
 *
 * SHOW_STAKING_ADVANCED_STATS:
 * Controls whether advanced metrics in the staking area are visible to users.
 * false: hide pool depth, anti-dump tax rate, and total staking.
 * true: show the full staking dashboard.
 *
 * ENABLE_ORDER_HARVEST:
 * Controls whether the harvest button on the orders page is available.
 * false: the harvest button is disabled and shown as grayed out.
 * true: users can click harvest normally.
 *
 * ENABLE_BUY_TRADE:
 * Controls whether the buy tab confirm button on the trade page is available.
 * false: the buy confirm button is disabled and shows "Coming Soon"/"暂未开放".
 * true: users can execute the buy flow normally.
 */
export const SHOW_STAKING_ADVANCED_STATS = false;
export const ENABLE_ORDER_HARVEST = false;
export const ENABLE_BUY_TRADE = true;

/**
 * Disable console logs in production
 */
export const DISABLE_CONSOLE_IN_PROD = true;
