// i18n configuration and language management
import { reactive, computed } from 'vue';

// Language state management
export const i18nState = reactive({
  currentLanguage: 'en', // Default to English
  languages: {
    'en': { name: 'English', code: 'en' },
    'zh-cn': { name: '简体中文', code: 'zh-cn' },
  }
});

// Empty language packs
const languagePacks = {
  'en': {
    // Basic wallet UI keys retained as placeholders
    'header.connectWallet': 'Connect Wallet',
    'wallet.connectTitle': 'Connect Wallet',
    'wallet.connectSubtitle': 'Select a wallet',
    'wallet.connectedTitle': 'Connected',
    'wallet.address': 'Address',
    'wallet.network': 'Network',
    'wallet.disconnect': 'Disconnect',
    'wallet.noWalletDetected': 'No wallet detected',
  },
  'zh-cn': {
     'header.connectWallet': '连接钱包',
     'wallet.connectTitle': '连接钱包',
     'wallet.connectSubtitle': '请选择钱包',
     'wallet.connectedTitle': '已连接',
     'wallet.address': '地址',
     'wallet.network': '网络',
     'wallet.disconnect': '断开连接',
     'wallet.noWalletDetected': '未检测到钱包',
  }
};

// Translation function
export function t(key, params = {}) {
  const currentPack = languagePacks[i18nState.currentLanguage];
  if (!currentPack) return key;
  
  let translation = currentPack[key];
  if (translation === undefined) return key;
  
  Object.keys(params).forEach(param => {
    translation = translation.replace(`{${param}}`, params[param]);
  });
  
  return translation;
}

export function setLanguage(languageCode) {
  if (i18nState.languages[languageCode]) {
    i18nState.currentLanguage = languageCode;
    localStorage.setItem('pgnlz_language', languageCode);
    window.location.reload();
  }
}

export function initializeLanguage() {
  const savedLanguage = localStorage.getItem('pgnlz_language');
  if (savedLanguage && i18nState.languages[savedLanguage]) {
    i18nState.currentLanguage = savedLanguage;
  }
}

export const currentLanguage = computed(() => i18nState.currentLanguage);
export const availableLanguages = computed(() => Object.values(i18nState.languages));
