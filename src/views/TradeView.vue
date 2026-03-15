<template>
  <div class="page-shell">
    <div class="page-bg-glow"></div>

    <section class="page-header">
      <h1 class="page-title">闪兑</h1>
      <p class="page-subtitle">快捷买卖与一键 Swap</p>
    </section>

    <section class="trade-panel">
      <div class="panel-decor"></div>
      <div v-if="showDexscreenerChart" class="chart-frame" v-html="dexscreenerEmbedHtml"></div>
      <div class="mode-tabs">
        <button class="mode-btn" :class="{ active: tradeDirection === 'sell' }" @click="setTradeDirection('sell')">
          卖出
        </button>
        <button class="mode-btn" :class="{ active: tradeDirection === 'buy' }" @click="setTradeDirection('buy')">
          买入
        </button>
      </div>

      <div class="input-card">
        <div class="input-head">
          <span class="field-label">输入 ({{ inputSymbol }})</span>
          <button class="max-btn" :disabled="!canUseMax" @click="handleSetMax">MAX</button>
        </div>
        <div class="token-input-wrap">
          <div class="token-chip" :class="{ logo: Boolean(inputTokenLogo) }">
            <img v-if="inputTokenLogo" class="token-logo" :src="inputTokenLogo" :alt="inputSymbol" />
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

        <div class="details-block">
          <div class="summary-row">
            <span>余额</span>
            <span>{{ displayBalance }} {{ inputSymbol }}</span>
          </div>
          <div class="summary-row">
            <span>预计到手</span>
            <span>{{ displayEstimatedOut }} {{ outputSymbol }}</span>
          </div>
          <div class="summary-row">
            <span>最低接收</span>
            <span>{{ displayMinimumOut }} {{ outputSymbol }}</span>
          </div>
          <div class="summary-row">
            <span>价格影响</span>
            <span :class="priceImpactClass">{{ displayPriceImpact }}</span>
          </div>
          <div class="summary-row settings-row">
            <span>滑点</span>
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
      <p v-else-if="!walletState.isConnected" class="hint-line">请先连接钱包后再进行交易。</p>

      <button class="confirm-btn" :disabled="swapDisabled" @click="handleActionClick">
        {{ actionButtonText }}
      </button>
    </section>

    <transition name="modal">
      <div v-if="isImpactConfirmVisible" class="modal-mask" @click.self="closeImpactConfirm">
        <div class="modal-container">
          <h3 class="modal-title">高价格影响提醒</h3>
          <p class="modal-desc">
            当前价格影响约为 <strong>{{ displayPriceImpact }}</strong>，继续交易可能导致较大滑点损耗。
          </p>
          <div class="modal-actions">
            <button class="modal-btn" @click="closeImpactConfirm">取消</button>
            <button class="modal-btn primary" @click="confirmImpactAndSwap">继续交易</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ethers } from 'ethers';
import { walletState } from '@/services/wallet';
import { getContractAddress } from '@/services/contracts';
import { APP_ENV, ENABLE_BUY_TRADE } from '@/services/environment';
import { showToast } from '@/services/notification';
import { t } from '@/i18n/index.js';
import erc20Abi from '@/abis/erc20.json';
import pancakeRouterV2Abi from '@/abis/pancakeRouterV2.json';

const SLIPPAGE_STORAGE_KEY = 'mske.trade.slippage.byDirection.v1';
const MAX_SLIPPAGE_PERCENT = 99;
const DEFAULT_SLIPPAGE_BY_DIRECTION = {
  sell: '35',
  buy: '5'
};
const PROD_DEXSCREENER_EMBED = `<style>#dexscreener-embed{position:relative;width:100%;padding-bottom:125%;}@media(min-width:1400px){#dexscreener-embed{padding-bottom:65%;}}#dexscreener-embed iframe{position:absolute;width:100%;height:100%;top:0;left:0;border:0;}</style><div id="dexscreener-embed"><iframe src="https://dexscreener.com/bsc/0x9082b8E33785b035e5c1Cb328Bb6b56A6c886813?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15"></iframe></div>`;
const DEV_DEXSCREENER_EMBED = `<style>#dexscreener-embed{position:relative;width:100%;padding-bottom:125%;}@media(min-width:1400px){#dexscreener-embed{padding-bottom:65%;}}#dexscreener-embed iframe{position:absolute;width:100%;height:100%;top:0;left:0;border:0;}</style><div id="dexscreener-embed"><iframe src="https://dexscreener.com/bsc/0x9082b8E33785b035e5c1Cb328Bb6b56A6c886813?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartDefaultOnMobile=1&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=15"></iframe></div>`;

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
const inputAmount = ref('');
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
const MAX_RESERVE_BPS = 10;

const tokenDecimals = ref({
  USDT: 18,
  MSKE: 18
});

const routerAddress = computed(() => getContractAddress('Router'));
const usdtAddress = computed(() => getContractAddress('USDT'));
const mskeAddress = computed(() => getContractAddress('MSKE'));
const showDexscreenerChart = computed(() => true);
const dexscreenerEmbedHtml = computed(() => (APP_ENV === 'PROD' ? PROD_DEXSCREENER_EMBED : DEV_DEXSCREENER_EMBED));

const inputSymbol = computed(() => (tradeDirection.value === 'buy' ? 'USDT' : 'MSKE'));
const outputSymbol = computed(() => (tradeDirection.value === 'buy' ? 'MSKE' : 'USDT'));
const inputTokenLogo = computed(() => {
  if (inputSymbol.value === 'MSKE') return '/asset/images/logo/Logo-coin.png';
  if (inputSymbol.value === 'USDT') return '/asset/images/logo/usdt-coin.png';
  return '';
});

const inputTokenAddress = computed(() => (tradeDirection.value === 'buy' ? usdtAddress.value : mskeAddress.value));
const outputTokenAddress = computed(() => (tradeDirection.value === 'buy' ? mskeAddress.value : usdtAddress.value));

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
  return ethers.isAddress(routerAddress.value || '')
    && ethers.isAddress(usdtAddress.value || '')
    && ethers.isAddress(mskeAddress.value || '');
});

const configurationHint = computed(() => {
  if (!ethers.isAddress(routerAddress.value || '')) return 'Router 地址未配置，请先在 contracts.js 中完善。';
  if (!ethers.isAddress(usdtAddress.value || '')) return 'USDT 地址未配置，请先在 contracts.js 中完善。';
  if (!ethers.isAddress(mskeAddress.value || '')) return 'MSKE 地址未配置，请先在 contracts.js 中完善。';
  return '';
});

const displayBalance = computed(() => balanceText.value);
const displayEstimatedOut = computed(() => estimatedOutText.value);
const displayMinimumOut = computed(() => minimumOutText.value);
const displayPriceImpact = computed(() => priceImpactText.value);
const canUseMax = computed(() => walletState.isConnected && isSwapConfigured.value && balanceRaw.value > 0n);
const isHighPriceImpact = computed(() => (priceImpactValue.value ?? 0) >= HIGH_IMPACT_THRESHOLD);
const isBuyTradeEnabled = computed(() => tradeDirection.value !== 'buy' || ENABLE_BUY_TRADE);

const priceImpactClass = computed(() => {
  if (priceImpactValue.value === null) return '';
  if (priceImpactValue.value >= 5) return 'impact-high';
  if (priceImpactValue.value >= 1) return 'impact-medium';
  return 'impact-low';
});

const swapDisabled = computed(() => {
  if (!isBuyTradeEnabled.value) return true;
  if (isExecuting.value || isQuoting.value) return true;
  if (!walletState.isConnected || !walletState.address) return true;
  if (!isSwapConfigured.value) return true;
  if (!inputAmountRaw.value || inputAmountRaw.value <= 0n) return true;
  if (inputAmountRaw.value > balanceRaw.value) return true;
  return false;
});

const requiresApproval = computed(() => {
  if (!walletState.isConnected || !walletState.address) return false;
  if (!inputAmountRaw.value || inputAmountRaw.value <= 0n) return false;
  return allowanceRaw.value < inputAmountRaw.value;
});

const actionButtonText = computed(() => {
  if (!isBuyTradeEnabled.value) return t('trade.action.notOpenYet');
  if (isExecuting.value) return '交易提交中...';
  if (isQuoting.value) return '报价计算中...';
  if (inputAmount.value && !inputAmountRaw.value) return '输入金额无效';
  if (inputAmountRaw.value && inputAmountRaw.value > balanceRaw.value) return '余额不足';
  if (requiresApproval.value) {
    return `授权 ${inputSymbol.value}`;
  }
  return '确认交易';
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
    const [usdtDecimals, mskeDecimals] = await Promise.all([usdtContract.decimals(), mskeContract.decimals()]);
    tokenDecimals.value = { USDT: Number(usdtDecimals), MSKE: Number(mskeDecimals) };
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
    const path = [inputTokenAddress.value, outputTokenAddress.value];
    const amountsOut = await routerContract.getAmountsOut(amountInRaw, path);
    const outRaw = amountsOut[amountsOut.length - 1];
    if (requestId !== quoteRequestId.value) return;
    quoteAmountOutRaw.value = outRaw;

    const slippageBps = Math.round(normalizedSlippage.value * 100);
    const minOutRaw = outRaw * BigInt(10000 - slippageBps) / 10000n;
    estimatedOutText.value = formatTokenAmount(outRaw, getOutputDecimals());
    minimumOutText.value = formatTokenAmount(minOutRaw, getOutputDecimals());

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

const onInputAmountChange = (event) => {
  inputAmount.value = limitDecimalPlaces(event.target.value, getInputDecimals());
};

const onSlippageChange = (event) => {
  const edited = String(event.target.value || '').replace(/[^\d]/g, '').slice(0, 2);
  if (edited === '') {
    slippage.value = updateSlippageForDirection(tradeDirection.value, '0');
    return;
  }
  slippage.value = updateSlippageForDirection(tradeDirection.value, edited);
};

const handleSetMax = () => {
  if (!canUseMax.value) return;
  const reserve = balanceRaw.value * BigInt(MAX_RESERVE_BPS) / 10000n;
  const safeMax = balanceRaw.value > reserve ? balanceRaw.value - reserve : balanceRaw.value;
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
  if (requiresApproval.value) {
    showToast(t('toast.trade.approveFirst'), 'warning');
    return;
  }

  try {
    isExecuting.value = true;
    await refreshBalance();
    if (amountInRaw > balanceRaw.value) {
      showToast(t('toast.trade.insufficientBalance'), 'warning');
      return;
    }

    await refreshQuote();
    if (quoteAmountOutRaw.value <= 0n) throw new Error('INVALID_QUOTE');
    if (!skipImpactConfirm && isHighPriceImpact.value) {
      isImpactConfirmVisible.value = true;
      return;
    }

    const signer = walletState.signer;
    const routerContract = getRouterContract(signer);
    const address = walletState.address;

    const slippageBps = Math.round(normalizedSlippage.value * 100);
    const minOutRaw = quoteAmountOutRaw.value * BigInt(10000 - slippageBps) / 10000n;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);
    const path = [inputTokenAddress.value, outputTokenAddress.value];
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

watch(
  () => [walletState.address, walletState.isConnected, tradeDirection.value],
  async () => {
    await refreshBalance();
    await refreshAllowance();
    scheduleQuoteRefresh();
  }
);

watch(
  () => [inputAmount.value, slippage.value, tradeDirection.value],
  () => {
    scheduleQuoteRefresh();
  }
);

onMounted(async () => {
  await refreshTokenMeta();
  await refreshBalance();
  await refreshAllowance();
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

.modal-btn.primary {
  border-color: rgba(255, 130, 60, 0.45);
  background: rgba(255, 92, 31, 0.14);
  color: #ffd0a9;
}
</style>
