// src/services/contracts.js
import { walletState } from './wallet';
import { APP_ENV } from './environment';

const CONTRACT_ADDRESSES = {
  PROD: {
    Referral: ''
  },
  dev: {
    Referral: '0x91b13B02b9dcc725D6D81afEa31Dd070Da615A98'
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
