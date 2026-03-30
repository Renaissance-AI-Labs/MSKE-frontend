<template>
  <div class="page-shell">
    <div class="page-bg-glow"></div>

    <section class="page-header">
      <h1 class="page-title">{{ t('trade.title') }}</h1>
      <p class="page-subtitle">{{ t('trade.subtitle') }}</p>
    </section>

    <section class="trade-panel">
      <div class="panel-decor"></div>
      <div v-if="showDexscreenerChart" class="chart-frame" v-html="dexscreenerEmbedHtml"></div>
      <div ref="modeTabsRef" class="mode-tabs">
        <button class="mode-btn" :class="{ active: tradeDirection === 'sell' }" @click="setTradeDirection('sell')">
          {{ t('trade.tab.sell') }}
        </button>
        <button class="mode-btn" :class="{ active: tradeDirection === 'buy' }" @click="setTradeDirection('buy')">
          {{ t('trade.tab.buy') }}
        </button>
      </div>

      <div class="input-card">
        <div class="input-head">
          <span class="field-label">{{ t('trade.field.input', { symbol: inputSymbol }) }}</span>
          <button class="max-btn" :disabled="!canUseMax" @click="handleSetMax">MAX</button>
        </div>
        <div class="token-input-wrap">
          <div class="token-selector" v-if="tradeDirection === 'sell'" @click="toggleTokenSelector">
            <div class="token-chip" :class="{ logo: Boolean(inputTokenLogo) }">
              <img
                v-if="inputTokenLogo"
                class="token-logo"
                :class="{ 'token-logo--nb': inputSymbol === 'NB' }"
                :src="inputTokenLogo"
                :alt="inputSymbol"
              />
              <span v-else>{{ inputSymbol }}</span>
            </div>
            <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <div v-else class="token-chip" :class="{ logo: Boolean(inputTokenLogo) }">
            <img
              v-if="inputTokenLogo"
              class="token-logo"
              :class="{ 'token-logo--nb': inputSymbol === 'NB' }"
              :src="inputTokenLogo"
              :alt="inputSymbol"
            />
            <span v-else>{{ inputSymbol }}</span>
          </div>
          
          <input
            v-model="inputAmount"
            class="token-input"
            type="text"
            inputmode="decimal"
            placeholder="0.00"
            @input="onInputAmountChange"
          />
        </div>

        <div v-if="tradeDirection === 'buy'" class="buy-target-card">
          <div class="buy-target-head">
            <span class="field-label">{{ t('trade.buyTarget.label') }}</span>
          </div>
          <div class="buy-target-options">
            <button
              type="button"
              class="buy-target-option"
              :class="{ active: buyToken === 'MSKE' }"
              @click="selectBuyToken('MSKE')"
            >
              <img src="/asset/images/logo/Logo-coin.png" class="buy-target-option-logo" alt="MSKE" />
              <span class="buy-target-option-text">
                <span class="buy-target-option-symbol">MSKE</span>
                <!-- <span class="buy-target-option-path">USDT -> MSKE</span> -->
              </span>
            </button>
            <button
              type="button"
              class="buy-target-option"
              :class="{ active: buyToken === 'NB' }"
              @click="selectBuyToken('NB')"
            >
              <img src="/asset/images/logo/nb_coin.png" class="buy-target-option-logo buy-target-option-logo--nb" alt="NB" />
              <span class="buy-target-option-text">
                <span class="buy-target-option-symbol">NB</span>
                <!-- <span class="buy-target-option-path">USDT -> MSKE -> NB</span> -->
              </span>
            </button>
          </div>
        </div>

        <div class="details-block">
          <div class="summary-row">
            <span>{{ t('trade.summary.balance') }}</span>
            <span>{{ displayBalance }} {{ inputSymbol }}</span>
          </div>
          <div class="summary-row">
            <span>{{ t('trade.summary.estimatedOut') }}</span>
            <span>{{ displayEstimatedOut }} {{ outputSymbol }}</span>
          </div>
          <div v-if="isNbSellMode" class="summary-row">
            <span>{{ t('trade.summary.remainingQuota') }}</span>
            <span>{{ displayNbRemainingQuota }} USDT</span>
          </div>
          <div class="summary-row">
            <span>{{ t('trade.summary.minimumOut') }}</span>
            <span>{{ displayMinimumOut }} {{ outputSymbol }}</span>
          </div>
          <div class="summary-row">
            <span>{{ t('trade.summary.priceImpact') }}</span>
            <span :class="priceImpactClass">{{ displayPriceImpact }}</span>
          </div>
          <div class="summary-row settings-row">
            <span>{{ t('trade.summary.slippage') }}</span>
            <div class="slippage-input-wrap">
              <input
                v-model="slippage"
                class="slippage-input"
                type="text"
                inputmode="decimal"
                @input="onSlippageChange"
              />
              <span class="slippage-unit">%</span>
              <span class="slippage-edit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 20h4l10.2-10.2a1.6 1.6 0 0 0 0-2.3l-1.7-1.7a1.6 1.6 0 0 0-2.3 0L4 16v4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                  <path d="m12.8 7.2 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      <p v-if="configurationHint" class="hint-line warning">{{ configurationHint }}</p>
      <p v-else-if="!walletState.isConnected" class="hint-line">{{ t('trade.hint.connectWallet') }}</p>

      <button class="confirm-btn" :disabled="swapDisabled" @click="handleActionClick">
        {{ actionButtonText }}
      </button>
    </section>

    <transition name="modal">
      <div v-if="isTokenSelectorVisible" class="modal-mask" @click.self="closeTokenSelector">
        <div class="modal-container token-selector-modal">
          <h3 class="modal-title">{{ t('trade.modal.selectTokenTitle') }}</h3>
          <div class="token-list">
            <div class="token-list-item" @click="selectSellToken('MSKE')" :class="{ active: sellToken === 'MSKE' }">
              <img src="/asset/images/logo/Logo-coin.png" class="token-list-logo" alt="MSKE" />
              <div class="token-list-info">
                <span class="token-list-symbol">MSKE</span>
                <span class="token-list-name">{{ t('trade.token.mskeName') }}</span>
              </div>
            </div>
            <div class="token-list-item" @click="selectSellToken('NB')" :class="{ active: sellToken === 'NB' }">
              <img src="/asset/images/logo/nb_coin.png" class="token-list-logo token-list-logo--nb" alt="NB" />
              <div class="token-list-info">
                <span class="token-list-symbol">NB</span>
                <span class="token-list-name">{{ t('trade.token.nbName') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="modal">
      <div v-if="isImpactConfirmVisible" class="modal-mask" @click.self="closeImpactConfirm">
        <div class="modal-container">
          <h3 class="modal-title">{{ t('trade.modal.highImpactTitle') }}</h3>
          <p class="modal-desc">
            {{ t('trade.modal.highImpactPrefix') }}<strong>{{ displayPriceImpact }}</strong>{{ t('trade.modal.highImpactSuffix') }}
          </p>
          <div class="modal-actions">
            <button class="modal-btn" @click="closeImpactConfirm">{{ t('trade.modal.cancel') }}</button>
            <button class="modal-btn primary" @click="confirmImpactAndSwap">{{ t('trade.modal.continue') }}</button>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ethers } from 'ethers';
import { walletState } from '@/services/wallet';
import { getContractAddress } from '@/services/contracts';
import { APP_ENV, ENABLE_BUY_TRADE } from '@/services/environment';
import { showToast } from '@/services/notification';
import { t } from '@/i18n/index.js';
import erc20Abi from '@/abis/erc20.json';
import pancakeRouterV2Abi from '@/abis/pancakeRouterV2.json';
import nbAbi from '@/abis/NB.json';
import nbMskeLpAbi from '@/abis/NB_MSKE_LP.json';

const SLIPPAGE_STORAGE_KEY = 'mske.trade.slippage.byDirection.v1';
const MAX_SLIPPAGE_PERCENT = 99;
const DEFAULT_SLIPPAGE_BY_DIRECTION = {
  sell: '35',
  buy: '5'
};
const PROD_DEXSCREENER_EMBED = `<style>#dexscreener-embed{position:relative;width:100%;padding-bottom:125%;}@media(min-width:1400px){#dexscreener-embed{padding-bottom:65%;}}#dexscreener-embed iframe{position:absolute;width:100%;height:100%;top:0;left:0;border:0;}</style><div id="dexscreener-embed"><iframe src="https://dexscreener.com/bsc/0x9082b8E33785b035e5c1Cb328Bb6b56A6c886813?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=0&chartType=price&interval=15"></iframe></div>`;
const DEV_DEXSCREENER_EMBED = `<style>#dexscreener-embed{position:relative;width:100%;padding-bottom:125%;}@media(min-width:1400px){#dexscreener-embed{padding-bottom:65%;}}#dexscreener-embed iframe{position:absolute;width:100%;height:100%;top:0;left:0;border:0;}</style><div id="dexscreener-embed"><iframe src="https://dexscreener.com/bsc/0x9082b8E33785b035e5c1Cb328Bb6b56A6c886813?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=0&chartType=price&interval=15"></iframe></div>`;

const normalizeSlippageValue = (value, fallback) => {
  const digitsOnly = String(value || '').replace(/[^\d]/g, '');
  const limited = digitsOnly.slice(0, 2);
  if (!limited) return fallback;
  const numeric = Number.parseInt(limited, 10);
  if (!Number.isFinite(numeric) || numeric < 0) return fallback;
  const bounded = numeric > MAX_SLIPPAGE_PERCENT ? MAX_SLIPPAGE_PERCENT : numeric;
  return String(bounded);
};

const loadSlippageCache = () => {
  try {
    const raw = localStorage.getItem(SLIPPAGE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SLIPPAGE_BY_DIRECTION };
    const parsed = JSON.parse(raw);
    return {
      sell: normalizeSlippageValue(parsed?.sell, DEFAULT_SLIPPAGE_BY_DIRECTION.sell),
      buy: normalizeSlippageValue(parsed?.buy, DEFAULT_SLIPPAGE_BY_DIRECTION.buy)
    };
  } catch (error) {
    return { ...DEFAULT_SLIPPAGE_BY_DIRECTION };
  }
};

const tradeDirection = ref('sell');
const sellToken = ref('MSKE');
const buyToken = ref('MSKE');
const isTokenSelectorVisible = ref(false);
const inputAmount = ref('');
const modeTabsRef = ref(null);
const route = useRoute();
const slippageCache = ref(loadSlippageCache());
const slippage = ref(slippageCache.value.sell);
const balanceText = ref('--');
const balanceRaw = ref(0n);
const allowanceRaw = ref(0n);
const estimatedOutText = ref('0');
const minimumOutText = ref('0');
const priceImpactText = ref('--');
const priceImpactValue = ref(null);
const isExecuting = ref(false);
const isQuoting = ref(false);
const isImpactConfirmVisible = ref(false);
const quoteAmountOutRaw = ref(0n);
const quoteRequestId = ref(0);
let quoteTimer = null;
const HIGH_IMPACT_THRESHOLD = 5;
const BALANCE_RESERVE_BPS = 10;
const NB_PAIR_MAX_SELL_BPS = 1000;
const TRADE_TABS_SCROLL_OFFSET = 8;

const tokenDecimals = ref({
  USDT: 18,
  MSKE: 18,
  NB: 18
});

const routerAddress = computed(() => getContractAddress('Router'));
const usdtAddress = computed(() => getContractAddress('USDT'));
const mskeAddress = computed(() => getContractAddress('MSKE'));
const nbAddress = computed(() => getContractAddress('NB'));
const nbMskeLpAddress = computed(() => getContractAddress('NB_MSKE_LP'));
const showDexscreenerChart = computed(() => true);
const dexscreenerEmbedHtml = computed(() => (APP_ENV === 'PROD' ? PROD_DEXSCREENER_EMBED : DEV_DEXSCREENER_EMBED));

const inputSymbol = computed(() => {
  if (tradeDirection.value === 'buy') return 'USDT';
  return sellToken.value;
});
const outputSymbol = computed(() => {
  if (tradeDirection.value === 'buy') return buyToken.value;
  return 'USDT'; // Sell always outputs USDT
});
const inputTokenLogo = computed(() => {
  if (inputSymbol.value === 'MSKE') return '/asset/images/logo/Logo-coin.png';
  if (inputSymbol.value === 'NB') return '/asset/images/logo/nb_coin.png';
  if (inputSymbol.value === 'USDT') return '/asset/images/logo/usdt-coin.png';
  return '';
});

const inputTokenAddress = computed(() => {
  if (tradeDirection.value === 'buy') return usdtAddress.value;
  if (sellToken.value === 'NB') return nbAddress.value;
  return mskeAddress.value;
});
const outputTokenAddress = computed(() => {
  if (tradeDirection.value === 'buy') {
    if (buyToken.value === 'NB') return nbAddress.value;
    return mskeAddress.value;
  }
  return usdtAddress.value;
});
const isNbSellMode = computed(() => tradeDirection.value === 'sell' && sellToken.value === 'NB');
const isBuyNbMode = computed(() => tradeDirection.value === 'buy' && buyToken.value === 'NB');
const currentSwapPath = computed(() => {
  if (isNbSellMode.value) {
    return [nbAddress.value, mskeAddress.value, usdtAddress.value];
  }
  if (isBuyNbMode.value) {
    return [usdtAddress.value, mskeAddress.value, nbAddress.value];
  }
  return [inputTokenAddress.value, outputTokenAddress.value];
});
const currentSlippageCacheKey = computed(() => tradeDirection.value);

const normalizedSlippage = computed(() => {
  const value = Number.parseInt(slippage.value, 10);
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > MAX_SLIPPAGE_PERCENT) return MAX_SLIPPAGE_PERCENT;
  return value;
});

const inputAmountRaw = computed(() => {
  if (!inputAmount.value || Number(inputAmount.value) <= 0) return null;
  try {
    return ethers.parseUnits(inputAmount.value, getInputDecimals());
  } catch (error) {
    return null;
  }
});

const isSwapConfigured = computed(() => {
  if (isNbSellMode.value) {
    return ethers.isAddress(routerAddress.value || '')
      && ethers.isAddress(usdtAddress.value || '')
      && ethers.isAddress(mskeAddress.value || '')
      && ethers.isAddress(nbAddress.value || '')
      && ethers.isAddress(nbMskeLpAddress.value || '');
  }
  if (isBuyNbMode.value) {
    return ethers.isAddress(routerAddress.value || '')
      && ethers.isAddress(usdtAddress.value || '')
      && ethers.isAddress(mskeAddress.value || '')
      && ethers.isAddress(nbAddress.value || '');
  }
  return ethers.isAddress(routerAddress.value || '')
    && ethers.isAddress(usdtAddress.value || '')
    && ethers.isAddress(mskeAddress.value || '');
});

const configurationHint = computed(() => {
  if (!ethers.isAddress(routerAddress.value || '')) return t('trade.config.routerMissing');
  if (!ethers.isAddress(usdtAddress.value || '')) return t('trade.config.usdtMissing');
  if (!ethers.isAddress(mskeAddress.value || '')) return t('trade.config.mskeMissing');
  if ((isNbSellMode.value || isBuyNbMode.value) && !ethers.isAddress(nbAddress.value || '')) return t('trade.config.nbMissing');
  if (isNbSellMode.value && !ethers.isAddress(nbMskeLpAddress.value || '')) return t('trade.config.nbLpMissing');
  return '';
});

const displayBalance = computed(() => balanceText.value);
const displayEstimatedOut = computed(() => estimatedOutText.value);
const displayMinimumOut = computed(() => minimumOutText.value);
const displayPriceImpact = computed(() => priceImpactText.value);
const isHighPriceImpact = computed(() => (priceImpactValue.value ?? 0) >= HIGH_IMPACT_THRESHOLD);
const isBuyTradeEnabled = computed(() => tradeDirection.value !== 'buy' || ENABLE_BUY_TRADE);

// NB Sell Specific State
const nbRemainingQuotaRaw = ref(0n);
const nbLastBuyTime = ref(0);
const nbColdTime = ref(60);
const nbMaxSellRaw = ref(0n);

const isNbCoolingDown = computed(() => {
  if (!isNbSellMode.value) return false;
  const now = Math.floor(Date.now() / 1000);
  return now < (nbLastBuyTime.value + nbColdTime.value);
});
const hasNbSellQuota = computed(() => !isNbSellMode.value || nbRemainingQuotaRaw.value > 0n);
const exceedsNbSellQuota = computed(() => isNbSellMode.value && quoteAmountOutRaw.value > nbRemainingQuotaRaw.value);
const exceedsNbPairLimit = computed(() => {
  if (!isNbSellMode.value || !inputAmountRaw.value) return false;
  if (nbMaxSellRaw.value <= 0n) return false;
  return inputAmountRaw.value > nbMaxSellRaw.value;
});

const priceImpactClass = computed(() => {
  if (priceImpactValue.value === null || priceImpactText.value === '--') return '';
  if (priceImpactValue.value >= 5) return 'impact-high';
  if (priceImpactValue.value >= 1) return 'impact-medium';
  return 'impact-low';
});
const displayNbRemainingQuota = computed(() => formatTokenAmount(nbRemainingQuotaRaw.value, tokenDecimals.value.USDT ?? 18, 2));
const canUseMax = computed(() => walletState.isConnected && isSwapConfigured.value && getSafeMaxAmountRaw() > 0n);

const swapDisabled = computed(() => {
  if (!isBuyTradeEnabled.value) return true;
  if (isExecuting.value || isQuoting.value) return true;
  if (!walletState.isConnected || !walletState.address) return true;
  if (!isSwapConfigured.value) return true;
  if (!inputAmountRaw.value || inputAmountRaw.value <= 0n) return true;
  if (inputAmountRaw.value > balanceRaw.value) return true;
  if (isNbCoolingDown.value) return true;
  if (!hasNbSellQuota.value) return true;
  if (exceedsNbPairLimit.value) return true;
  if (exceedsNbSellQuota.value) return true;
  return false;
});

const requiresApproval = computed(() => {
  if (!walletState.isConnected || !walletState.address) return false;
  if (!inputAmountRaw.value || inputAmountRaw.value <= 0n) return false;
  return allowanceRaw.value < inputAmountRaw.value;
});

const actionButtonText = computed(() => {
  if (!isBuyTradeEnabled.value) return t('trade.action.notOpenYet');
  if (isExecuting.value) return t('trade.action.submitting');
  if (isQuoting.value) return t('trade.action.quoting');
  if (isNbCoolingDown.value) return t('trade.action.coolingDown');
  if (isNbSellMode.value && !hasNbSellQuota.value) return t('trade.action.noSellQuota');
  if (inputAmount.value && !inputAmountRaw.value) return t('trade.action.invalidAmount');
  if (inputAmountRaw.value && inputAmountRaw.value > balanceRaw.value) return t('trade.action.insufficientBalance');
  if (exceedsNbPairLimit.value) return t('trade.action.exceedsPairLimit');
  if (exceedsNbSellQuota.value) return t('trade.action.exceedsQuota');
  if (requiresApproval.value) {
    return t('trade.action.approveToken', { symbol: inputSymbol.value });
  }
  return t('trade.action.confirmTrade');
});

const getProvider = () => {
  if (walletState.provider) return walletState.provider;
  if (!window.ethereum) return null;
  return new ethers.BrowserProvider(window.ethereum);
};

const getTokenContract = (address, runner) => new ethers.Contract(address, erc20Abi, runner);
const getRouterContract = (runner) => new ethers.Contract(routerAddress.value, pancakeRouterV2Abi, runner);

const formatTokenAmount = (value, decimals, precision = 6) => {
  const formatted = ethers.formatUnits(value, decimals);
  const numberValue = Number(formatted);
  if (!Number.isFinite(numberValue)) return '0';
  return numberValue.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
  });
};

const sanitizeDecimalInput = (value) => {
  const cleaned = String(value || '').replace(/[^\d.]/g, '');
  const firstDotIndex = cleaned.indexOf('.');
  if (firstDotIndex === -1) return cleaned;
  const integerPart = cleaned.slice(0, firstDotIndex + 1);
  const decimalPart = cleaned.slice(firstDotIndex + 1).replace(/\./g, '');
  return `${integerPart}${decimalPart}`;
};

const limitDecimalPlaces = (value, maxDecimalPlaces) => {
  const normalized = sanitizeDecimalInput(value);
  if (!normalized.includes('.')) return normalized;
  const [integerPart, decimalPart = ''] = normalized.split('.');
  return `${integerPart}.${decimalPart.slice(0, maxDecimalPlaces)}`;
};

const getInputDecimals = () => tokenDecimals.value[inputSymbol.value] ?? 18;
const getOutputDecimals = () => tokenDecimals.value[outputSymbol.value] ?? 18;
const getSafeMaxAmountRaw = () => {
  if (balanceRaw.value <= 0n) return 0n;
  const reserve = balanceRaw.value * BigInt(BALANCE_RESERVE_BPS) / 10000n;
  let safeMax = balanceRaw.value > reserve ? balanceRaw.value - reserve : balanceRaw.value;
  if (isNbSellMode.value && nbMaxSellRaw.value > 0n && safeMax > nbMaxSellRaw.value) {
    safeMax = nbMaxSellRaw.value;
  }
  return safeMax;
};

const clearQuote = () => {
  quoteAmountOutRaw.value = 0n;
  estimatedOutText.value = '0';
  minimumOutText.value = '0';
  priceImpactText.value = '--';
  priceImpactValue.value = null;
};

const refreshTokenMeta = async () => {
  if (!isSwapConfigured.value) return;
  const provider = getProvider();
  if (!provider) return;

  try {
    const usdtContract = getTokenContract(usdtAddress.value, provider);
    const mskeContract = getTokenContract(mskeAddress.value, provider);
    const nbContract = ethers.isAddress(nbAddress.value || '') ? getTokenContract(nbAddress.value, provider) : null;
    const [usdtDecimals, mskeDecimals, nbDecimals] = await Promise.all([
      usdtContract.decimals(),
      mskeContract.decimals(),
      nbContract ? nbContract.decimals().catch(() => 18) : 18
    ]);
    tokenDecimals.value = {
      USDT: Number(usdtDecimals),
      MSKE: Number(mskeDecimals),
      NB: Number(nbDecimals)
    };
  } catch (error) {
    console.warn('[TradeView] Failed to refresh token metadata:', error);
  }
};

const refreshBalance = async () => {
  if (!walletState.isConnected || !walletState.address || !isSwapConfigured.value) {
    balanceRaw.value = 0n;
    balanceText.value = '--';
    return;
  }
  try {
    const provider = getProvider();
    if (!provider) {
      balanceRaw.value = 0n;
      balanceText.value = '--';
      return;
    }
    const tokenContract = getTokenContract(inputTokenAddress.value, provider);
    const raw = await tokenContract.balanceOf(walletState.address);
    balanceRaw.value = raw;
    balanceText.value = formatTokenAmount(raw, getInputDecimals());
  } catch (error) {
    balanceRaw.value = 0n;
    balanceText.value = '--';
  }
};

const refreshAllowance = async () => {
  if (!walletState.isConnected || !walletState.address || !isSwapConfigured.value) {
    allowanceRaw.value = 0n;
    return;
  }
  try {
    const provider = getProvider();
    if (!provider) {
      allowanceRaw.value = 0n;
      return;
    }
    const tokenContract = getTokenContract(inputTokenAddress.value, provider);
    allowanceRaw.value = await tokenContract.allowance(walletState.address, routerAddress.value);
  } catch (error) {
    allowanceRaw.value = 0n;
  }
};

const refreshQuote = async () => {
  if (!walletState.isConnected || !walletState.address || !isSwapConfigured.value) {
    clearQuote();
    return;
  }
  if (!inputAmount.value || Number(inputAmount.value) <= 0) {
    clearQuote();
    return;
  }

  let amountInRaw;
  try {
    amountInRaw = ethers.parseUnits(inputAmount.value, getInputDecimals());
  } catch (error) {
    clearQuote();
    return;
  }

  let requestId = 0;
  try {
    isQuoting.value = true;
    requestId = ++quoteRequestId.value;
    const provider = getProvider();
    if (!provider) {
      clearQuote();
      return;
    }
    const routerContract = getRouterContract(provider);
    
    const path = currentSwapPath.value;
    const amountsOut = await routerContract.getAmountsOut(amountInRaw, path);
    const outRaw = amountsOut[amountsOut.length - 1];
    if (requestId !== quoteRequestId.value) return;
    quoteAmountOutRaw.value = outRaw;

    const slippageBps = Math.round(normalizedSlippage.value * 100);
    const minOutRaw = outRaw * BigInt(10000 - slippageBps) / 10000n;
    estimatedOutText.value = formatTokenAmount(outRaw, getOutputDecimals());
    minimumOutText.value = formatTokenAmount(minOutRaw, getOutputDecimals());

    // Price impact calculation (simplified for sell_nb)
    if (tradeDirection.value === 'sell' && sellToken.value === 'NB') {
      priceImpactValue.value = 0; // Or implement proper 2-hop price impact calculation
      priceImpactText.value = '--';
    } else {
      const unitAmountRaw = 10n ** BigInt(getInputDecimals());
      const unitAmountsOut = await routerContract.getAmountsOut(unitAmountRaw, path);
      if (requestId !== quoteRequestId.value) return;
      const unitOutRaw = unitAmountsOut[unitAmountsOut.length - 1];
      if (unitOutRaw > 0n) {
        const expectedOutBySpot = amountInRaw * unitOutRaw / unitAmountRaw;
        if (expectedOutBySpot > 0n && outRaw <= expectedOutBySpot) {
          const impactBps = Number((expectedOutBySpot - outRaw) * 10000n / expectedOutBySpot);
          const impact = impactBps / 100;
          priceImpactValue.value = impact;
          priceImpactText.value = `${impact.toFixed(2)}%`;
        } else {
          priceImpactValue.value = 0;
          priceImpactText.value = '0.00%';
        }
      } else {
        priceImpactValue.value = null;
        priceImpactText.value = '--';
      }
    }
  } catch (error) {
    if (requestId === quoteRequestId.value) {
      clearQuote();
    }
  } finally {
    if (requestId === quoteRequestId.value) {
      isQuoting.value = false;
    }
  }
};

const scheduleQuoteRefresh = () => {
  if (quoteTimer) clearTimeout(quoteTimer);
  quoteTimer = setTimeout(() => {
    refreshQuote();
  }, 250);
};

const getDefaultSlippage = (direction) => DEFAULT_SLIPPAGE_BY_DIRECTION[direction] || DEFAULT_SLIPPAGE_BY_DIRECTION.sell;

const saveSlippageCache = () => {
  try {
    localStorage.setItem(SLIPPAGE_STORAGE_KEY, JSON.stringify(slippageCache.value));
  } catch (error) {
    // Ignore storage errors (private mode / quota)
  }
};

const getCachedSlippage = (direction) => {
  const fallback = getDefaultSlippage(direction);
  return normalizeSlippageValue(slippageCache.value[direction], fallback);
};

const updateSlippageForDirection = (direction, value) => {
  const fallback = getDefaultSlippage(direction);
  const normalized = normalizeSlippageValue(value, fallback);
  slippageCache.value = {
    ...slippageCache.value,
    [direction]: normalized
  };
  saveSlippageCache();
  return normalized;
};

const setTradeDirection = (direction) => {
  if (tradeDirection.value !== direction) {
    slippage.value = getCachedSlippage(direction);
  }
  quoteRequestId.value += 1;
  tradeDirection.value = direction;
};

const toggleTokenSelector = () => {
  if (tradeDirection.value === 'sell') {
    isTokenSelectorVisible.value = true;
  }
};

const closeTokenSelector = () => {
  isTokenSelectorVisible.value = false;
};

const selectSellToken = (token) => {
  sellToken.value = token;
  closeTokenSelector();
  quoteRequestId.value += 1;
  slippage.value = getCachedSlippage('sell');
};

const selectBuyToken = (token) => {
  if (buyToken.value === token) return;
  buyToken.value = token;
  quoteRequestId.value += 1;
  slippage.value = getCachedSlippage('buy');
};

const applyRoutePresetFromQuery = async () => {
  const targetDirection = route.query.direction === 'buy' || route.query.direction === 'sell'
    ? route.query.direction
    : '';
  const targetToken = route.query.token === 'NB' || route.query.token === 'MSKE'
    ? route.query.token
    : '';
  const shouldScrollToTabs = route.query.focus === 'mode-tabs';

  if (targetDirection && tradeDirection.value !== targetDirection) {
    setTradeDirection(targetDirection);
  }

  if ((targetDirection === 'sell' || tradeDirection.value === 'sell') && targetToken && sellToken.value !== targetToken) {
    selectSellToken(targetToken);
  }

  if ((targetDirection === 'buy' || tradeDirection.value === 'buy') && targetToken && buyToken.value !== targetToken) {
    selectBuyToken(targetToken);
  }

  if (shouldScrollToTabs) {
    await nextTick();
    window.requestAnimationFrame(() => {
      const tabsElement = modeTabsRef.value;
      if (!tabsElement) return;
      const tabsTop = tabsElement.getBoundingClientRect().top + window.scrollY;
      const targetTop = Math.max(tabsTop - TRADE_TABS_SCROLL_OFFSET, 0);
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  }
};

const onInputAmountChange = (event) => {
  inputAmount.value = limitDecimalPlaces(event.target.value, getInputDecimals());
};

const onSlippageChange = (event) => {
  const edited = String(event.target.value || '').replace(/[^\d]/g, '').slice(0, 2);
  if (edited === '') {
    slippage.value = updateSlippageForDirection(currentSlippageCacheKey.value, '0');
    return;
  }
  slippage.value = updateSlippageForDirection(currentSlippageCacheKey.value, edited);
};

const handleSetMax = () => {
  if (!canUseMax.value) return;
  const safeMax = getSafeMaxAmountRaw();
  inputAmount.value = limitDecimalPlaces(ethers.formatUnits(safeMax, getInputDecimals()), getInputDecimals());
};

const closeImpactConfirm = () => {
  isImpactConfirmVisible.value = false;
};

const executeApprove = async () => {
  if (!walletState.isConnected || !walletState.address || !walletState.signer) {
    showToast(t('toast.trade.connectWallet'), 'warning');
    return;
  }
  if (!isSwapConfigured.value) {
    showToast(t('toast.trade.contractNotConfigured'), 'error');
    return;
  }
  if (!inputAmountRaw.value || inputAmountRaw.value <= 0n) {
    showToast(t('toast.trade.enterValidAmount'), 'warning');
    return;
  }

  try {
    isExecuting.value = true;
    const signer = walletState.signer;
    const inputToken = getTokenContract(inputTokenAddress.value, signer);
    console.log('[Contract Call] approve() params:', {
      token: inputTokenAddress.value,
      spender: routerAddress.value,
      amount: ethers.MaxUint256.toString(),
      inputSymbol: inputSymbol.value
    });
    const approveTx = await inputToken.approve(routerAddress.value, ethers.MaxUint256);
    showToast(t('toast.trade.approveSubmitted'), 'info');
    await approveTx.wait();
    showToast(t('toast.trade.approveSuccess'), 'success');
    await refreshAllowance();
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast(t('toast.trade.approveCancelled'), 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast(t('toast.trade.approveFailed'), 'error');
    }
  } finally {
    isExecuting.value = false;
  }
};

const executeSwap = async (skipImpactConfirm = false) => {
  if (!walletState.isConnected || !walletState.address || !walletState.signer) {
    showToast(t('toast.trade.connectWallet'), 'warning');
    return;
  }
  if (!isSwapConfigured.value) {
    showToast(t('toast.trade.contractNotConfigured'), 'error');
    return;
  }
  if (!inputAmount.value || Number(inputAmount.value) <= 0) {
    showToast(t('toast.trade.enterValidAmount'), 'warning');
    return;
  }
  const amountInRaw = inputAmountRaw.value;
  if (!amountInRaw) {
    showToast(t('toast.trade.invalidAmountFormat'), 'error');
    return;
  }
  if (amountInRaw <= 0n) {
    showToast(t('toast.trade.amountGreaterThanZero'), 'warning');
    return;
  }
  if (amountInRaw > balanceRaw.value) {
    showToast(t('toast.trade.insufficientBalance'), 'warning');
    return;
  }
  if (isNbSellMode.value && nbMaxSellRaw.value > 0n && amountInRaw > nbMaxSellRaw.value) {
    showToast(t('toast.trade.nbPairLimit'), 'warning');
    return;
  }
  if (requiresApproval.value) {
    showToast(t('toast.trade.approveFirst'), 'warning');
    return;
  }

  try {
    isExecuting.value = true;
    if (isNbSellMode.value) {
      await refreshNbData();
      if (nbMaxSellRaw.value > 0n && amountInRaw > nbMaxSellRaw.value) {
        showToast(t('toast.trade.nbPairLimit'), 'warning');
        return;
      }
      if (!hasNbSellQuota.value) {
        showToast(t('toast.trade.nbQuotaUnlock'), 'warning');
        return;
      }
    }
    await refreshBalance();
    if (amountInRaw > balanceRaw.value) {
      showToast(t('toast.trade.insufficientBalance'), 'warning');
      return;
    }

    await refreshQuote();
    if (quoteAmountOutRaw.value <= 0n) throw new Error('INVALID_QUOTE');
    if (isNbSellMode.value && exceedsNbSellQuota.value) {
      showToast(t('toast.trade.nbQuotaExceeded'), 'warning');
      return;
    }
    if (!skipImpactConfirm && isHighPriceImpact.value && !(tradeDirection.value === 'sell' && sellToken.value === 'NB')) {
      isImpactConfirmVisible.value = true;
      return;
    }

    const signer = walletState.signer;
    const routerContract = getRouterContract(signer);
    const address = walletState.address;

    const slippageBps = Math.round(normalizedSlippage.value * 100);
    const minOutRaw = quoteAmountOutRaw.value * BigInt(10000 - slippageBps) / 10000n;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);
    
    const path = currentSwapPath.value;

    console.log('[Contract Call] swapExactTokensForTokensSupportingFeeOnTransferTokens params:', {
      tradeDirection: tradeDirection.value,
      inputSymbol: inputSymbol.value,
      outputSymbol: outputSymbol.value,
      amountInRaw: amountInRaw.toString(),
      minOutRaw: minOutRaw.toString(),
      slippagePercent: normalizedSlippage.value.toFixed(2),
      slippageBps,
      path,
      to: address,
      deadline: deadline.toString()
    });
    const swapTx = await routerContract.swapExactTokensForTokensSupportingFeeOnTransferTokens(
      amountInRaw,
      minOutRaw,
      path,
      address,
      deadline
    );
    showToast(t('toast.trade.swapSubmitted'), 'success');
    await swapTx.wait();
    showToast(t('toast.trade.swapSuccess'), 'success');

    inputAmount.value = '';
    clearQuote();
    await refreshBalance();
    if (tradeDirection.value === 'sell' && sellToken.value === 'NB') {
      await refreshNbData();
    }
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast(t('toast.trade.swapCancelled'), 'warning');
    } else if (error?.message === 'INVALID_QUOTE') {
      showToast(t('toast.trade.invalidQuote'), 'error');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast(t('toast.trade.swapFailed'), 'error');
    }
  } finally {
    isExecuting.value = false;
  }
};

const handleActionClick = async () => {
  if (!isBuyTradeEnabled.value) {
    return;
  }

  if (requiresApproval.value) {
    await executeApprove();
    return;
  }
  await executeSwap();
};

const confirmImpactAndSwap = async () => {
  closeImpactConfirm();
  await executeSwap(true);
};

const refreshNbData = async () => {
  if (!walletState.isConnected || !walletState.address || !nbAddress.value) {
    nbRemainingQuotaRaw.value = 0n;
    nbLastBuyTime.value = 0;
    nbColdTime.value = 60;
    nbMaxSellRaw.value = 0n;
    return;
  }
  try {
    const provider = getProvider();
    if (!provider) return;
    const nbContract = new ethers.Contract(nbAddress.value, nbAbi, provider);
    const [remQuota, lastBuy, cTime] = await Promise.all([
      nbContract.remainingSellQuotaU(walletState.address).catch(() => 0n),
      nbContract.lastBuyTime(walletState.address).catch(() => 0),
      nbContract.coldTime().catch(() => 60)
    ]);

    let pairLimit = 0n;
    if (ethers.isAddress(nbMskeLpAddress.value || '')) {
      const pairContract = new ethers.Contract(nbMskeLpAddress.value, nbMskeLpAbi, provider);
      const [pairToken0, pairToken1, reserves] = await Promise.all([
        pairContract.token0().catch(() => ''),
        pairContract.token1().catch(() => ''),
        pairContract.getReserves().catch(() => [0n, 0n, 0])
      ]);

      const reserve0 = reserves?.[0] ?? 0n;
      const reserve1 = reserves?.[1] ?? 0n;
      const lowerNbAddress = String(nbAddress.value).toLowerCase();
      let nbReserve = 0n;

      if (String(pairToken0).toLowerCase() === lowerNbAddress) {
        nbReserve = reserve0;
      } else if (String(pairToken1).toLowerCase() === lowerNbAddress) {
        nbReserve = reserve1;
      }

      pairLimit = nbReserve * BigInt(NB_PAIR_MAX_SELL_BPS) / 10000n;
    }

    nbRemainingQuotaRaw.value = remQuota;
    nbLastBuyTime.value = Number(lastBuy);
    nbColdTime.value = Number(cTime);
    nbMaxSellRaw.value = pairLimit;
  } catch (error) {
    console.warn('[TradeView] Failed to refresh NB data:', error);
  }
};

watch(
  () => [walletState.address, walletState.isConnected, tradeDirection.value, sellToken.value],
  async () => {
    await refreshBalance();
    await refreshAllowance();
    if (tradeDirection.value === 'sell' && sellToken.value === 'NB') {
      await refreshNbData();
    }
    scheduleQuoteRefresh();
  }
);

watch(
  () => [inputAmount.value, slippage.value, tradeDirection.value, sellToken.value, buyToken.value],
  () => {
    scheduleQuoteRefresh();
  }
);

watch(
  () => [route.query.direction, route.query.token, route.query.focus],
  () => {
    applyRoutePresetFromQuery();
  }
);

onMounted(async () => {
  await applyRoutePresetFromQuery();
  await refreshTokenMeta();
  await refreshBalance();
  await refreshAllowance();
  await refreshNbData();
  await refreshQuote();
});

onBeforeUnmount(() => {
  if (quoteTimer) {
    clearTimeout(quoteTimer);
    quoteTimer = null;
  }
});
</script>

<style scoped>
.page-shell {
  /* min-height: 100vh; */
  padding: 10px 16px;
  position: relative;
  background-color: #050302;
  overflow-x: hidden;
}

.page-bg-glow {
  position: absolute;
  top: -170px;
  left: 50%;
  transform: translateX(-50%);
  width: min(720px, 100vw);
  height: 440px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 74, 28, 0.2) 0%, rgba(255, 74, 28, 0) 70%);
  filter: blur(6px);
  pointer-events: none;
}

.trade-panel {
  position: relative;
  z-index: 1;
  max-width: 520px;
  margin: 0 auto;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 69, 0, 0.2);
  background: rgba(21, 11, 6, 0.35);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.panel-decor {
  height: 3px;
  margin: -14px -14px 12px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 69, 0, 0.55) 50%, transparent 100%);
}

.chart-frame {
  height: 50vh;
  min-height: 320px;
  max-height: 540px;
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 99, 50, 0.24);
  background: rgba(0, 0, 0, 0.24);
}

.chart-frame :deep(#dexscreener-embed) {
  height: 100%;
  padding-bottom: 0 !important;
}

.chart-frame :deep(#dexscreener-embed iframe) {
  height: 100% !important;
}

.page-header {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 10px auto 10px;
  text-align: center;
}

.page-title {
  margin: 0 0 6px;
  font-size: clamp(1.6rem, 6.2vw, 2.25rem);
  font-weight: 800;
  background: linear-gradient(180deg, #fff 0%, #ffcda5 50%, #ff4500 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.page-subtitle {
  margin: 0;
  color: rgba(234, 215, 198, 0.78);
  letter-spacing: 0.04em;
  font-size: 0.84rem;
}

.mode-tabs {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  border: 1px solid rgba(255, 99, 50, 0.26);
  border-radius: 11px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
}

.mode-btn {
  border: none;
  background: transparent;
  color: #cfb49c;
  width: 50%;
  min-height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.mode-btn.active {
  color: #ffe0c7;
  background: rgba(255, 69, 0, 0.22);
}

.mode-btn + .mode-btn {
  border-left: 1px solid rgba(255, 99, 50, 0.26);
}

.input-card {
  border: 1px solid rgba(255, 99, 50, 0.24);
  border-radius: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.24);
}

.input-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.field-label {
  color: #d7c0b0;
  font-size: 0.82rem;
}

.max-btn {
  border: 1px solid rgba(255, 130, 60, 0.45);
  background: rgba(255, 92, 31, 0.14);
  color: #ffd0a9;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 700;
  min-width: 62px;
  min-height: 32px;
  padding: 0 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.max-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.token-input-wrap {
  border: 1px solid rgba(255, 114, 67, 0.32);
  border-radius: 10px;
  min-height: 54px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  background: rgba(14, 9, 7, 0.8);
}

.buy-target-card {
  margin-top: 10px;
}

.buy-target-head {
  margin-bottom: 8px;
}

.buy-target-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.buy-target-option {
  border: 1px solid rgba(255, 114, 67, 0.24);
  border-radius: 12px;
  padding: 10px;
  background: rgba(14, 9, 7, 0.78);
  color: #f3dfcf;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.buy-target-option:hover {
  border-color: rgba(255, 120, 70, 0.45);
  background: rgba(255, 69, 0, 0.12);
}

.buy-target-option.active {
  border-color: rgba(255, 120, 70, 0.55);
  background: rgba(255, 69, 0, 0.18);
  color: #fff0e1;
}

.buy-target-option-logo {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.buy-target-option-logo--nb {
  transform: scale(0.9);
}

.buy-target-option-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.buy-target-option-symbol {
  font-size: 0.92rem;
  font-weight: 700;
  color: inherit;
}

.buy-target-option-path {
  font-size: 0.72rem;
  color: rgba(243, 223, 207, 0.72);
  line-height: 1.35;
}

.token-chip {
  min-width: 54px;
  height: 34px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  background: rgba(255, 69, 0, 0.2);
  border: 1px solid rgba(255, 120, 70, 0.4);
  color: #ffd8bc;
  font-size: 0.72rem;
  font-weight: 700;
}

.token-chip.logo {
  min-width: 34px;
  width: 34px;
  padding: 0;
  overflow: hidden;
  border-color: rgba(255, 130, 60, 0.5);
}

.token-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.token-logo--nb {
  transform: scale(0.9);
}

.token-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: 1.5rem;
  font-weight: 700;
}

.details-block {
  margin-top: 9px;
  border-top: 1px dashed rgba(255, 129, 68, 0.2);
  padding-top: 5px;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.83rem;
  color: #dec5b1;
  min-height: 27px;
}

.summary-row + .summary-row {
  border-top: 1px dashed rgba(255, 129, 68, 0.18);
}

.impact-low {
  color: #a6f3be;
}

.impact-medium {
  color: #ffc983;
}

.impact-high {
  color: #ff8d8d;
}

.settings-row {
  min-height: 34px;
}

.slippage-input-wrap {
  min-width: 112px;
  height: 32px;
  padding: 0 6px 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 114, 67, 0.35);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  background: rgba(14, 9, 7, 0.82);
}

.slippage-input {
  width: 54px;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  text-align: right;
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
}

.slippage-unit {
  color: #f3dfcf;
  font-size: 0.82rem;
}

.slippage-edit-icon {
  width: 18px;
  height: 18px;
  margin-left: 2px;
  padding-left: 6px;
  border-left: 1px solid rgba(255, 130, 60, 0.28);
  color: rgba(255, 208, 169, 0.85);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.slippage-edit-icon svg {
  width: 100%;
  height: 100%;
}

.hint-line {
  margin: 10px 2px 0;
  color: #bba392;
  font-size: 0.78rem;
  text-align: center;
}

.hint-line.warning {
  color: #ffb38d;
}

.hint-line + .hint-line {
  margin-top: 6px;
}

.confirm-btn {
  width: 100%;
  margin-top: 10px;
  border: 1px solid rgba(255, 130, 60, 0.45);
  border-radius: 10px;
  min-height: 44px;
  background: rgba(255, 92, 31, 0.14);
  color: #ffd0a9;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.confirm-btn:hover:not(:disabled) {
  border-color: #ff4500;
  background: rgba(255, 69, 0, 0.28);
  color: #fff;
}

.confirm-btn:disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 2200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.modal-container {
  width: 100%;
  max-width: 420px;
  border-radius: 14px;
  border: 1px solid rgba(255, 69, 0, 0.25);
  background: linear-gradient(180deg, rgba(20, 10, 5, 0.96), rgba(9, 6, 5, 0.96));
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.55);
  color: #fff;
  padding: 14px;
}

.modal-title {
  margin: 0;
  font-size: 1rem;
  color: #ffd2a4;
}

.modal-desc {
  margin: 10px 0 0;
  color: #d7c0b0;
  font-size: 0.86rem;
  line-height: 1.45;
}

.modal-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.modal-btn {
  border: 1px solid rgba(201, 179, 162, 0.45);
  background: rgba(160, 130, 110, 0.1);
  color: #f2dac6;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.token-selector {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px 4px 4px;
  border-radius: 999px;
  background: rgba(255, 69, 0, 0.1);
  border: 1px solid rgba(255, 120, 70, 0.3);
  margin-right: 8px;
  transition: all 0.2s ease;
}

.token-selector:hover {
  background: rgba(255, 69, 0, 0.2);
  border-color: rgba(255, 120, 70, 0.5);
}

.token-selector .token-chip {
  margin-right: 4px;
  border: none;
  background: transparent;
}

.dropdown-icon {
  width: 16px;
  height: 16px;
  color: #ffd8bc;
}

.token-selector-modal {
  max-width: 320px;
}

.token-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.token-list-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.token-list-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.token-list-item.active {
  background: rgba(255, 69, 0, 0.15);
  border-color: rgba(255, 69, 0, 0.4);
}

.token-list-logo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.token-list-logo--nb {
  transform: scale(0.8);
}

.token-list-info {
  display: flex;
  flex-direction: column;
}

.token-list-symbol {
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
}

.token-list-name {
  font-size: 0.8rem;
  color: #a0a0a0;
}

.modal-btn.primary {
  border-color: rgba(255, 130, 60, 0.45);
  background: rgba(255, 92, 31, 0.14);
  color: #ffd0a9;
}
</style>
