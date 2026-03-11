// src/services/contracts.js
import { walletState } from './wallet';
import { APP_ENV } from './environment';

const CONTRACT_ADDRESSES = {
  PROD: {
    Referral: '',
    Router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    MSKE: '',
    LPPool: '',
    NodeDividendPool: '',
    Staking: '',
    MSKEX: '',
    USDT_MSKE_LP: ''
  },
  dev: {
    Referral: '0x91b13B02b9dcc725D6D81afEa31Dd070Da615A98',
    Router: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
    USDT: '0x9D72C1858D1d8D90E51826AA5e8c4b3295714fF3',
    MSKE: '0x40721fAaD2CFA2A52B4249Dd673e5a1E4921913d',
    LPPool: '0xe79D7eaE2eAb3565b21dA30D7Db69fed0d7d8F4A',
    NodeDividendPool: '0xcc2aCB3E5146443505361b9CF3cd9D3bA82C7828',
    Staking: '0x526F92BD6a05bfF8b5537F469e47Cb77EE7B9404',
    MSKEX: '0xBDb80E48039c31ad9D5F0a27f60b77c49266Dce2',
    USDT_MSKE_LP: '0x6cD73E45a57Db16394BD11b36C824325e53a4008'
  }
};

export const getContractAddress = (contractName) => {
  const envAddresses = CONTRACT_ADDRESSES[APP_ENV] || {};
  if (envAddresses[contractName]) {
    return envAddresses[contractName];
  }

  const matchedKey = Object.keys(envAddresses).find(
    (key) => key.toLowerCase() === String(contractName).toLowerCase()
  );
  return matchedKey ? envAddresses[matchedKey] : '';
};

/**
 * Initializes all contract instances.
 * Cleaned up for new project structure.
 */
export const initializeContracts = async () => {
  if (!walletState.isConnected || !walletState.signer) {
    return;
  }
  console.log("Contracts initialization skipped (Cleaned).");
  walletState.contractsInitialized = true;
};

export const resetContracts = () => {
  console.log("Contracts reset.");
};

// Placeholder for referrer check to prevent wallet.js errors
export const checkIfUserHasReferrer = async () => {
  return true; // Default to true or false depending on desired default behavior
};

// Exporting other potential placeholders if wallet.js calls them directly, 
// though wallet.js mainly calls initializeContracts and checkIfUserHasReferrer in the connect flow.
