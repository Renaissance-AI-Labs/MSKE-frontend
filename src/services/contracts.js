// src/services/contracts.js
import { walletState } from './wallet';
import { APP_ENV } from './environment';

const CONTRACT_ADDRESSES = {
  PROD: {
    Referral: '0xBDb80E48039c31ad9D5F0a27f60b77c49266Dce2',
    Router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    MSKE: '0x3078F9a2f578D22bddd3f64d7C34356915f328e1',
    LPPool: '0x91b13B02b9dcc725D6D81afEa31Dd070Da615A98',
    NodeDividendPool: '0xe79D7eaE2eAb3565b21dA30D7Db69fed0d7d8F4A',
    Staking: '0xcc2aCB3E5146443505361b9CF3cd9D3bA82C7828',
    MSKEX: '0x72866cA20C8A1142e13596e64D66589429c1DDb2',
    USDT_MSKE_LP: '0x9082b8E33785b035e5c1Cb328Bb6b56A6c886813',
    ProfitPool: '0x32e6660BeE08703b25F4674F3A4f0F0ba4Bc0912',
    NB: '0xa113A719Ff1C4e75FD3C2C5208A3b4703B334956',
    NB_MSKE_LP: '0x6381964C81a5E4f0403fe335BE7A09ec5EBA2192',
    NBManager: '0x884D4CF7Cf80dE1F6b0086A3b7dbc4fF72734b35'
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
    USDT_MSKE_LP: '0x6cD73E45a57Db16394BD11b36C824325e53a4008',
    ProfitPool: '0x602f13D518Dfe8F1E2d57D07E78838e4DA95d7Ba',
    NB: '0xB7837C9b04ec958B8cfc34841B6E5b9b0700E502',
    NB_MSKE_LP: '0x7d772506e227bF3498AeeDAa0F79b5321a042D85',
    NBManager:'0xAD67046f42542518922AEF5E5e96CC529DE9E683'
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
