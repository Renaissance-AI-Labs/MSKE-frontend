<template>
  <div class="page-shell">
    <div class="page-noise"></div>
    <div class="page-bg-glow page-bg-glow--primary"></div>
    <div class="page-bg-glow page-bg-glow--secondary"></div>

    <section class="page-header">
      <h1 class="page-title">{{ text('title') }}</h1>
      <p class="page-subtitle">{{ text('subtitle') }}</p>

      <div v-if="!activated" class="hero-panel hero-panel--compact">
        <div class="hero-copy">
          <span class="status-pill" :class="activationStatusClass">{{ activationStatusText }}</span>
          <h2 class="hero-heading">{{ heroHeadlineText }}</h2>
          <p v-if="heroDescText" class="hero-desc">{{ heroDescText }}</p>
        </div>

        <div class="status-row status-row--compact">
          <div class="status-group">
            <span class="status-label">{{ text('statusQualification') }}</span>
            <span class="status-badge" :class="qualificationBadgeClass">{{ qualificationText }}</span>
          </div>

          <div class="status-group">
            <span class="status-label">{{ text('statusLobster') }}</span>
            <span class="status-badge" :class="lobsterBadgeClass">
              {{ lobsterStatusText }}
            </span>
          </div>
        </div>

        <div class="action-row action-row--compact">
          <button class="action-btn primary" :disabled="activateActionDisabled" @click="handleActivate">
            {{ activateButtonText }}
          </button>
        </div>
      </div>
    </section>

    <div class="cards-container" :class="{ 'cards-container--inactive': !activated }">
      <template v-if="!activated">
        <section class="content-panel content-panel--compact">
          <div class="panel-decor"></div>

          <div class="panel-top panel-top--compact">
            <div>
  
              <p v-if="text('guideDescInactive')" class="panel-desc">{{ text('guideDescInactive') }}</p>
            </div>
          </div>

          <span class="section-tag">{{ text('flowLabel') }}</span>
          <div class="flow-strip">
            <article class="flow-item">
              <span class="flow-index">01</span>
              <span class="flow-text">{{ text('step1Short') }}</span>
            </article>

            <article class="flow-item">
              <span class="flow-index">02</span>
              <span class="flow-text">{{ text('step2Short') }}</span>
            </article>

            <article class="flow-item">
              <span class="flow-index">03</span>
              <span class="flow-text">{{ text('step3Short') }}</span>
            </article>
          </div>

          <span class="section-tag section-tag--benefit">{{ text('benefitLabel') }}</span>
          <div class="benefit-summary">
            <p class="benefit-summary-text">{{ text('benefitSummary') }}</p>
          </div>
        </section>
      </template>

      <template v-else>
        <section class="content-panel content-panel--claim">
          <div class="panel-decor"></div>

          <div class="panel-top panel-top--claim">
            <div>
              <h2 class="panel-title">{{ text('panelClaimTitle') }}</h2>
            </div>

            <span class="hero-chip hero-chip--claim">{{ text('feeLabel') }} {{ currentFeeText }}</span>
          </div>

          <div class="data-grid data-grid--claim">
            <div class="data-item data-item--claim-primary">
              <span class="data-label">{{ text('claimAvailableLabel') }}</span>
              <span class="data-value data-value--claim data-value--highlight">
                {{ pendingTokenDisplayText }}<span class="data-value-unit"> Token</span>
              </span>
            </div>

            <div class="data-item">
              <span class="data-label">{{ text('claimedTotalLabel') }}</span>
              <span class="data-value data-value--claim">
                {{ totalClaimedText }}<span class="data-value-unit"> Token</span>
              </span>
            </div>
          </div>

          <div v-if="showUpgradeHint" class="claim-note">
            <p class="hint-line warning hint-line--left">{{ text('upgradeHint') }}</p>
          </div>

          <button class="action-btn primary action-btn--block action-btn--claim" :disabled="claimActionDisabled" @click="handleClaim">
            {{ claimButtonText }}
          </button>
        </section>

        <section class="content-panel content-panel--feed">
          <div class="panel-decor"></div>

          <div class="panel-top panel-top--feed">
            <div>
              <h2 class="panel-title">{{ text('panelFeedTitle') }}</h2>
            </div>
          </div>

          <div class="yield-grid yield-grid--single yield-grid--feed">
            <div class="yield-card yield-card--feed" :class="{ 'yield-card--accent': hasFeedingYield }">
              <span class="yield-label">{{ currentYieldTitleText }}</span>
              <strong class="yield-value">{{ currentYieldRangeText }}</strong>
              <span v-if="hasFeedingYield" class="yield-meta">{{ text('feededLabel') }} {{ additionalInvestText }} USDT</span>
              <span v-else class="yield-meta">
                {{ text('yieldUpgradeHint', { amount: additionalInvestText, range: text('yieldFeedRange') }) }}
              </span>
            </div>
          </div>

          <div class="input-card">
            <div class="input-head">
              <span class="field-label">{{ text('inputLabel') }}</span>
              <span class="field-range">{{ text('walletBalanceLabel') }}: {{ usdtBalanceText }} USDT</span>
            </div>

            <div class="token-input-wrap">
              <div class="token-chip">
                <img src="/asset/images/logo/usdt-coin.png" class="token-logo" alt="USDT" />
              </div>

              <div class="token-input-main">
                <input
                  v-model="feedAmount"
                  class="token-input"
                  type="text"
                  inputmode="decimal"
                  :placeholder="text('inputPlaceholder', { min: minAdditionalText, max: maxAdditionalText })"
                  @input="onFeedAmountInput"
                />

                <span class="input-token">USDT</span>
              </div>

            </div>

            <button
              type="button"
              class="action-btn primary action-btn--block feed-action-btn"
              :disabled="feedActionDisabled"
              @click="handleFeedAction"
            >
              {{ feedButtonText }}
            </button>

          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ethers } from 'ethers';
import { t } from '@/i18n/index.js';
import { walletState } from '@/services/wallet';
import { getContractAddress } from '@/services/contracts';
import { showToast } from '@/services/notification';
import erc20Abi from '@/abis/erc20.json';
import mskeAbi from '@/abis/mske.json';
import dividendPoolAbi from '@/abis/MSKEDividendPool.json';

const DEFAULT_DECIMALS = 18;
const BP_DENOMINATOR = 10000n;
const ONE_TOKEN = 10n ** 18n;
const REWARD_POLL_INTERVAL = 6000;
const VALUE_ANIMATION_DURATION = 1800;

const loadingData = ref(false);
const activating = ref(false);
const approvingFeed = ref(false);
const feeding = ref(false);
const claiming = ref(false);
const hasLoadedInitialState = ref(false);

const usdtDecimals = ref(DEFAULT_DECIMALS);
const usdtBalanceRaw = ref(0n);
const usdtAllowanceRaw = ref(0n);
const mskePriceRaw = ref(0n);
const minAdditionalInvestRaw = ref(ethers.parseUnits('200', DEFAULT_DECIMALS));
const maxAdditionalInvestRaw = ref(ethers.parseUnits('3000', DEFAULT_DECIMALS));
const s6FeeBpRaw = ref(2000n);
const shareholderFeeBpRaw = ref(300n);

const activated = ref(false);
const baseInvestRaw = ref(0n);
const additionalInvestRaw = ref(0n);
const pendingUOnChainRaw = ref(0n);
const pendingTokenOnChainRaw = ref(0n);
const totalClaimedRaw = ref(0n);
const isS6 = ref(false);
const isShareholder = ref(false);
const additionalSellQuotaRaw = ref(0n);

const feedAmount = ref('');
const pendingTokenDisplayValue = ref(0);

let refreshTimer = null;
let rewardTimer = null;
let pendingTokenAnimationFrame = null;
let refreshRequestId = 0;
let pendingRewardRefreshing = false;

const dividendPoolAddress = computed(() => getContractAddress('MSKEDividendPool'));
const usdtAddress = computed(() => getContractAddress('USDT'));
const mskeAddress = computed(() => getContractAddress('MSKE'));

const isContractConfigured = computed(() => (
  ethers.isAddress(dividendPoolAddress.value || '')
  && ethers.isAddress(usdtAddress.value || '')
  && ethers.isAddress(mskeAddress.value || '')
));

const isEligible = computed(() => isS6.value || isShareholder.value);
const currentFeeBpRaw = computed(() => (
  isShareholder.value ? shareholderFeeBpRaw.value : s6FeeBpRaw.value
));

function text(key, params = {}) {
  return t(`investLobster.${key}`, params);
}

function getReadProvider() {
  if (walletState.provider) return walletState.provider;
  if (!window.ethereum) return null;
  return new ethers.BrowserProvider(window.ethereum);
}

async function getWriteSigner() {
  if (walletState.signer) return walletState.signer;
  if (!window.ethereum) return null;
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
}

function sanitizeDecimalInput(value, maxDecimalPlaces = 6) {
  const cleaned = String(value || '').replace(/[^\d.]/g, '');
  const firstDotIndex = cleaned.indexOf('.');

  if (firstDotIndex === -1) {
    return cleaned;
  }

  const integerPart = cleaned.slice(0, firstDotIndex + 1);
  const decimalPart = cleaned.slice(firstDotIndex + 1).replace(/\./g, '');
  return `${integerPart}${decimalPart.slice(0, maxDecimalPlaces)}`;
}

function onFeedAmountInput(event) {
  feedAmount.value = sanitizeDecimalInput(event.target.value);
}

function formatAmount(amountRaw, decimals = 18, precision = 2) {
  const amount = amountRaw ?? 0n;
  const num = Number(ethers.formatUnits(amount, decimals));

  if (!Number.isFinite(num)) {
    return '0';
  }

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
  });
}

function formatAnimatedAmount(value, precision = 2) {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  return safe.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
}

function rawToDisplayNumber(rawValue, decimals = 18) {
  try {
    return Number(ethers.formatUnits(rawValue || 0n, decimals));
  } catch {
    return 0;
  }
}

function easeInOutCubic(progress) {
  if (progress < 0.5) {
    return 4 * progress ** 3;
  }
  return 1 - ((-2 * progress + 2) ** 3) / 2;
}

function runValueAnimation({ from, to, onUpdate, duration = VALUE_ANIMATION_DURATION }) {
  const safeFrom = Number.isFinite(from) ? from : 0;
  const safeTo = Number.isFinite(to) ? to : 0;
  if (Math.abs(safeFrom - safeTo) < 1e-8) {
    onUpdate(safeTo);
    return null;
  }

  const start = performance.now();
  let frameId = null;
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = easeInOutCubic(progress);
    onUpdate(safeFrom + (safeTo - safeFrom) * eased);
    if (progress < 1) {
      frameId = window.requestAnimationFrame(tick);
    }
  };

  frameId = window.requestAnimationFrame(tick);
  return frameId;
}

function stopAnimation(frameId) {
  if (frameId) {
    window.cancelAnimationFrame(frameId);
  }
}

function resetPendingTokenAnimation() {
  stopAnimation(pendingTokenAnimationFrame);
  pendingTokenAnimationFrame = null;
  pendingTokenDisplayValue.value = 0;
}

function animatePendingTokenDisplay(rawValue) {
  const nextValue = rawToDisplayNumber(rawValue, 18);
  const fromValue = pendingTokenDisplayValue.value;
  stopAnimation(pendingTokenAnimationFrame);
  pendingTokenAnimationFrame = runValueAnimation({
    from: fromValue,
    to: nextValue,
    onUpdate: (value) => {
      pendingTokenDisplayValue.value = value;
    }
  });
}

function extractErrorMessage(error) {
  const rawMessage = error?.reason || error?.shortMessage || error?.message || '';
  return String(rawMessage)
    .replace(/^execution reverted:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}

function handleTransactionError(error, { cancelledKey, failedKey }) {
  if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
    showToast(text(cancelledKey), 'warning');
    return;
  }

  const errorMessage = extractErrorMessage(error);
  if (errorMessage) {
    showToast(errorMessage, 'error');
    return;
  }

  showToast(text(failedKey), 'error');
}

function resetUserData() {
  usdtBalanceRaw.value = 0n;
  usdtAllowanceRaw.value = 0n;
  activated.value = false;
  baseInvestRaw.value = 0n;
  additionalInvestRaw.value = 0n;
  pendingUOnChainRaw.value = 0n;
  pendingTokenOnChainRaw.value = 0n;
  totalClaimedRaw.value = 0n;
  isS6.value = false;
  isShareholder.value = false;
  additionalSellQuotaRaw.value = 0n;
  resetPendingTokenAnimation();
}

function resetContractData() {
  usdtDecimals.value = DEFAULT_DECIMALS;
  mskePriceRaw.value = 0n;
  minAdditionalInvestRaw.value = ethers.parseUnits('200', DEFAULT_DECIMALS);
  maxAdditionalInvestRaw.value = ethers.parseUnits('3000', DEFAULT_DECIMALS);
  s6FeeBpRaw.value = 2000n;
  shareholderFeeBpRaw.value = 300n;
}

async function loadData() {
  const requestId = ++refreshRequestId;
  loadingData.value = true;

  const provider = getReadProvider();
  if (!provider || !isContractConfigured.value) {
    if (requestId === refreshRequestId) {
      resetContractData();
      resetUserData();
      hasLoadedInitialState.value = true;
      loadingData.value = false;
    }
    return;
  }

  try {
    const dividendPool = new ethers.Contract(dividendPoolAddress.value, dividendPoolAbi, provider);
    const mske = new ethers.Contract(mskeAddress.value, mskeAbi, provider);
    const usdt = new ethers.Contract(usdtAddress.value, erc20Abi, provider);
    const userAddress = walletState.isConnected && walletState.address ? walletState.address : null;

    const [
      s6Fee,
      shareholderFee,
      minAdditional,
      maxAdditional,
      priceRaw,
      decimalsRaw,
      userInfo,
      pendingToken,
      extraQuota,
      usdtBalance,
      allowance
    ] = await Promise.all([
      dividendPool.S6_CLAIM_FEE_BP().catch(() => 2000n),
      dividendPool.SHAREHOLDER_CLAIM_FEE_BP().catch(() => 300n),
      dividendPool.MIN_ADDITIONAL_INVEST().catch(() => ethers.parseUnits('200', DEFAULT_DECIMALS)),
      dividendPool.MAX_ADDITIONAL_INVEST().catch(() => ethers.parseUnits('3000', DEFAULT_DECIMALS)),
      mske.getTokenPriceUsdt().catch(() => 0n),
      usdt.decimals().catch(() => DEFAULT_DECIMALS),
      userAddress
        ? dividendPool.getUserInfo(userAddress).catch(() => [false, 0n, 0n, 0n, 0n, false, false])
        : Promise.resolve([false, 0n, 0n, 0n, 0n, false, false]),
      userAddress ? dividendPool.pendingRewardMske(userAddress).catch(() => 0n) : Promise.resolve(0n),
      userAddress ? dividendPool.additionalSellQuota(userAddress).catch(() => 0n) : Promise.resolve(0n),
      userAddress ? usdt.balanceOf(userAddress).catch(() => 0n) : Promise.resolve(0n),
      userAddress ? usdt.allowance(userAddress, dividendPoolAddress.value).catch(() => 0n) : Promise.resolve(0n)
    ]);

    if (requestId !== refreshRequestId) {
      return;
    }

    const [
      userActivated,
      baseInvestValue,
      additionalInvestValue,
      pendingUValue,
      totalClaimedValue,
      userIsS6,
      userIsShareholder
    ] = userInfo;

    usdtDecimals.value = Number(decimalsRaw);
    mskePriceRaw.value = BigInt(priceRaw);
    minAdditionalInvestRaw.value = BigInt(minAdditional);
    maxAdditionalInvestRaw.value = BigInt(maxAdditional);
    s6FeeBpRaw.value = BigInt(s6Fee);
    shareholderFeeBpRaw.value = BigInt(shareholderFee);

    activated.value = Boolean(userActivated);
    baseInvestRaw.value = BigInt(baseInvestValue ?? 0n);
    additionalInvestRaw.value = BigInt(additionalInvestValue ?? 0n);
    pendingUOnChainRaw.value = BigInt(pendingUValue ?? 0n);
    pendingTokenOnChainRaw.value = BigInt(pendingToken ?? 0n);
    totalClaimedRaw.value = BigInt(totalClaimedValue ?? 0n);
    isS6.value = Boolean(userIsS6);
    isShareholder.value = Boolean(userIsShareholder);
    additionalSellQuotaRaw.value = BigInt(extraQuota ?? 0n);
    usdtBalanceRaw.value = BigInt(usdtBalance ?? 0n);
    usdtAllowanceRaw.value = BigInt(allowance ?? 0n);
    animatePendingTokenDisplay(pendingTokenTargetRaw.value);
  } catch (error) {
    console.error('Failed to load lobster data:', error);
    if (requestId === refreshRequestId) {
      resetContractData();
      resetUserData();
    }
  } finally {
    if (requestId === refreshRequestId) {
      hasLoadedInitialState.value = true;
      loadingData.value = false;
    }
  }
}

const parsedFeedAmountRaw = computed(() => {
  if (!feedAmount.value) {
    return 0n;
  }

  try {
    return ethers.parseUnits(feedAmount.value, usdtDecimals.value);
  } catch {
    return 0n;
  }
});

const pendingTokenTargetRaw = computed(() => {
  if (!activated.value) {
    return 0n;
  }

  if (mskePriceRaw.value <= 0n) {
    return pendingTokenOnChainRaw.value;
  }

  const grossToken = pendingUOnChainRaw.value * ONE_TOKEN / mskePriceRaw.value;
  const feeAmount = grossToken * currentFeeBpRaw.value / BP_DENOMINATOR;
  return grossToken - feeAmount;
});

const hasClaimableRewards = computed(() => (
  activated.value && pendingTokenOnChainRaw.value > 0n
));

const qualificationText = computed(() => {
  if (!walletState.isConnected) {
    return text('statusAwaitConnect');
  }

  if (isShareholder.value) {
    return text('identityShareholder');
  }

  if (isS6.value) {
    return text('identityS6');
  }

  return text('statusLocked');
});

const lobsterStatusText = computed(() => {
  if (!walletState.isConnected) {
    return text('statusAwaitConnect');
  }

  return activated.value ? text('statusActivated') : text('statusInactive');
});

const activationStatusText = computed(() => {
  if (!walletState.isConnected) {
    return text('statusAwaitConnect');
  }

  if (activated.value) {
    return text('statusActivated');
  }

  if (isEligible.value) {
    return text('statusQualified');
  }

  return text('statusLocked');
});

const heroHeadlineText = computed(() => {
  if (!walletState.isConnected) {
    return text('heroDefaultTitle');
  }

  if (activated.value) {
    return text('heroActiveTitle');
  }

  if (isEligible.value) {
    return text('heroReadyTitle');
  }

  return text('heroLockedTitle');
});

const heroDescText = computed(() => {
  if (!walletState.isConnected) {
    return text('heroDefaultDesc');
  }

  if (activated.value) {
    return text('heroActiveDesc');
  }

  if (isEligible.value) {
    return text('heroReadyDesc');
  }

  return text('heroLockedDesc');
});

const currentFeeText = computed(() => (
  isEligible.value ? `${Number(currentFeeBpRaw.value) / 100}%` : '--'
));

const hasFeedingYield = computed(() => additionalInvestRaw.value > 0n);

const currentYieldTitleText = computed(() => (
  hasFeedingYield.value ? text('yieldFeedTitle') : text('yieldBaseTitle')
));

const currentYieldRangeText = computed(() => (
  hasFeedingYield.value ? text('yieldFeedRange') : text('yieldBaseRange')
));

const yieldStatusText = computed(() => currentYieldTitleText.value);

const baseInvestText = computed(() => formatAmount(baseInvestRaw.value, usdtDecimals.value, 2));
const additionalInvestText = computed(() => formatAmount(additionalInvestRaw.value, usdtDecimals.value, 2));
const usdtBalanceText = computed(() => formatAmount(usdtBalanceRaw.value, usdtDecimals.value, 2));
const minAdditionalText = computed(() => formatAmount(minAdditionalInvestRaw.value, usdtDecimals.value, 2));
const maxAdditionalText = computed(() => formatAmount(maxAdditionalInvestRaw.value, usdtDecimals.value, 2));
const pendingTokenDisplayText = computed(() => formatAnimatedAmount(pendingTokenDisplayValue.value, 4));
const totalClaimedText = computed(() => formatAmount(totalClaimedRaw.value, 18, 4));

const activationStatusClass = computed(() => ({
  'is-success': activated.value,
  'is-warning': !activated.value && isEligible.value,
  'is-locked': !activated.value && !isEligible.value
}));

const qualificationBadgeClass = computed(() => ({
  'is-ready': isEligible.value,
  'is-locked': !isEligible.value
}));

const lobsterBadgeClass = computed(() => ({
  'is-success': activated.value,
  'is-warning': !activated.value && isEligible.value,
  'is-locked': !activated.value && !isEligible.value
}));

const showActivateLoadingState = computed(() => loadingData.value && !hasLoadedInitialState.value);

const activateButtonText = computed(() => {
  if (showActivateLoadingState.value) return text('actionLoading');
  if (activating.value) return text('actionActivating');
  if (!walletState.isConnected) return text('actionConnect');
  if (!isContractConfigured.value) return text('actionUnavailable');
  if (activated.value) return text('actionActivated');
  if (!isEligible.value) return text('actionQualifyFirst');
  return text('actionActivate');
});

const feedButtonText = computed(() => {
  if (approvingFeed.value) return text('actionApproving');
  if (feeding.value) return text('actionFeeding');
  if (!walletState.isConnected) return text('actionConnect');
  if (!isContractConfigured.value) return text('actionUnavailable');
  if (!activated.value) return isEligible.value ? text('actionActivateFirst') : text('actionQualifyFirst');
  if (!feedAmount.value) return text('actionFeed');
  if (parsedFeedAmountRaw.value <= 0n) return text('actionInvalidAmount');
  if (parsedFeedAmountRaw.value < minAdditionalInvestRaw.value) {
    return text('actionMinAmount', { amount: minAdditionalText.value });
  }
  if (parsedFeedAmountRaw.value > maxAdditionalInvestRaw.value) {
    return text('actionMaxAmount', { amount: maxAdditionalText.value });
  }
  if (parsedFeedAmountRaw.value > usdtBalanceRaw.value) return text('actionInsufficientUsdt');
  if (usdtAllowanceRaw.value < parsedFeedAmountRaw.value) return text('actionApproveUsdt');
  return text('actionFeed');
});

const claimButtonText = computed(() => {
  if (claiming.value) return text('actionClaiming');
  if (!walletState.isConnected) return text('actionConnect');
  if (!isContractConfigured.value) return text('actionUnavailable');
  if (!activated.value) return isEligible.value ? text('actionActivateFirst') : text('actionQualifyFirst');
  if (!hasClaimableRewards.value) return text('actionNoRewards');
  return text('actionClaim');
});

const showUpgradeHint = computed(() => isS6.value && !isShareholder.value);

const activateActionDisabled = computed(() => (
  showActivateLoadingState.value || activating.value || !isContractConfigured.value
));

const feedActionDisabled = computed(() => (
  approvingFeed.value || feeding.value || !isContractConfigured.value
));

const claimActionDisabled = computed(() => (
  claiming.value || !isContractConfigured.value
));

async function handleActivate() {
  if (!walletState.isConnected || !walletState.address) {
    showToast(text('toastConnectWallet'), 'warning');
    return;
  }

  if (!isContractConfigured.value) {
    showToast(text('toastContractMissing'), 'error');
    return;
  }

  if (activated.value) {
    showToast(text('toastAlreadyActivated'), 'info');
    return;
  }

  if (!isEligible.value) {
    showToast(text('toastNeedQualification'), 'warning');
    return;
  }

  const signer = await getWriteSigner();
  if (!signer) {
    showToast(text('toastConnectWallet'), 'warning');
    return;
  }

  activating.value = true;
  try {
    const dividendPool = new ethers.Contract(dividendPoolAddress.value, dividendPoolAbi, signer);
    const tx = await dividendPool.activate();
    showToast(text('toastActivateSubmitted'), 'info');
    await tx.wait();
    showToast(text('toastActivateSuccess'), 'success');
    await loadData();
  } catch (error) {
    handleTransactionError(error, {
      cancelledKey: 'toastActivateCancelled',
      failedKey: 'toastActivateFailed'
    });
  } finally {
    activating.value = false;
  }
}

async function handleFeedAction() {
  if (!walletState.isConnected || !walletState.address) {
    showToast(text('toastConnectWallet'), 'warning');
    return;
  }

  if (!isContractConfigured.value) {
    showToast(text('toastContractMissing'), 'error');
    return;
  }

  if (!activated.value) {
    showToast(isEligible.value ? text('toastActivateFirst') : text('toastNeedQualification'), 'warning');
    return;
  }

  if (!feedAmount.value || parsedFeedAmountRaw.value <= 0n) {
    showToast(text('toastEnterAmount'), 'warning');
    return;
  }

  if (parsedFeedAmountRaw.value < minAdditionalInvestRaw.value) {
    showToast(text('toastMinAmount', { amount: minAdditionalText.value }), 'warning');
    return;
  }

  if (parsedFeedAmountRaw.value > maxAdditionalInvestRaw.value) {
    showToast(text('toastMaxAmount', { amount: maxAdditionalText.value }), 'warning');
    return;
  }

  if (parsedFeedAmountRaw.value > usdtBalanceRaw.value) {
    showToast(text('toastInsufficientUsdt'), 'warning');
    return;
  }

  const signer = await getWriteSigner();
  if (!signer) {
    showToast(text('toastConnectWallet'), 'warning');
    return;
  }

  if (usdtAllowanceRaw.value < parsedFeedAmountRaw.value) {
    approvingFeed.value = true;

    try {
      const usdt = new ethers.Contract(usdtAddress.value, erc20Abi, signer);
      const approveTx = await usdt.approve(dividendPoolAddress.value, ethers.MaxUint256);
      showToast(text('toastApproveSubmitted'), 'info');
      await approveTx.wait();
      showToast(text('toastApproveSuccess'), 'success');
      await loadData();
    } catch (error) {
      handleTransactionError(error, {
        cancelledKey: 'toastApproveCancelled',
        failedKey: 'toastApproveFailed'
      });
    } finally {
      approvingFeed.value = false;
    }

    return;
  }

  feeding.value = true;
  try {
    const dividendPool = new ethers.Contract(dividendPoolAddress.value, dividendPoolAbi, signer);
    const tx = await dividendPool.addInvestment(parsedFeedAmountRaw.value);
    showToast(text('toastFeedSubmitted'), 'info');
    await tx.wait();
    showToast(text('toastFeedSuccess'), 'success');
    feedAmount.value = '';
    await loadData();
  } catch (error) {
    handleTransactionError(error, {
      cancelledKey: 'toastFeedCancelled',
      failedKey: 'toastFeedFailed'
    });
  } finally {
    feeding.value = false;
  }
}

async function handleClaim() {
  if (!walletState.isConnected || !walletState.address) {
    showToast(text('toastConnectWallet'), 'warning');
    return;
  }

  if (!isContractConfigured.value) {
    showToast(text('toastContractMissing'), 'error');
    return;
  }

  if (!activated.value) {
    showToast(isEligible.value ? text('toastActivateFirst') : text('toastNeedQualification'), 'warning');
    return;
  }

  if (!hasClaimableRewards.value) {
    showToast(text('toastNoRewards'), 'warning');
    return;
  }

  const signer = await getWriteSigner();
  if (!signer) {
    showToast(text('toastConnectWallet'), 'warning');
    return;
  }

  claiming.value = true;
  try {
    const dividendPool = new ethers.Contract(dividendPoolAddress.value, dividendPoolAbi, signer);
    const tx = await dividendPool.claim();
    showToast(text('toastClaimSubmitted'), 'info');
    await tx.wait();
    showToast(text('toastClaimSuccess'), 'success');
    await loadData();
  } catch (error) {
    handleTransactionError(error, {
      cancelledKey: 'toastClaimCancelled',
      failedKey: 'toastClaimFailed'
    });
  } finally {
    claiming.value = false;
  }
}

function clearRewardTimer() {
  if (rewardTimer) {
    window.clearInterval(rewardTimer);
    rewardTimer = null;
  }
}

function startRewardPolling() {
  clearRewardTimer();
  if (!walletState.isConnected || !walletState.address) return;
  rewardTimer = window.setInterval(() => {
    refreshPendingRewardOnly();
  }, REWARD_POLL_INTERVAL);
}

async function refreshPendingRewardOnly() {
  if (
    loadingData.value
    || pendingRewardRefreshing
    || activating.value
    || feeding.value
    || claiming.value
    || !walletState.isConnected
    || !walletState.address
    || !isContractConfigured.value
  ) {
    return;
  }

  const provider = getReadProvider();
  if (!provider) return;

  const userAddress = walletState.address;
  const dividendPool = new ethers.Contract(dividendPoolAddress.value, dividendPoolAbi, provider);

  pendingRewardRefreshing = true;
  try {
    const [userInfo, pendingToken] = await Promise.all([
      dividendPool.getUserInfo(userAddress).catch(() => [false, 0n, 0n, 0n, 0n, false, false]),
      dividendPool.pendingRewardMske(userAddress).catch(() => 0n)
    ]);

    if (!walletState.isConnected || walletState.address !== userAddress) {
      return;
    }

    const [
      userActivated,
      baseInvestValue,
      additionalInvestValue,
      pendingUValue,
      totalClaimedValue,
      userIsS6,
      userIsShareholder
    ] = userInfo;

    activated.value = Boolean(userActivated);
    baseInvestRaw.value = BigInt(baseInvestValue ?? 0n);
    additionalInvestRaw.value = BigInt(additionalInvestValue ?? 0n);
    pendingUOnChainRaw.value = BigInt(pendingUValue ?? 0n);
    pendingTokenOnChainRaw.value = BigInt(pendingToken ?? 0n);
    totalClaimedRaw.value = BigInt(totalClaimedValue ?? 0n);
    isS6.value = Boolean(userIsS6);
    isShareholder.value = Boolean(userIsShareholder);

    animatePendingTokenDisplay(pendingTokenTargetRaw.value);
  } catch (error) {
    console.error('Failed to refresh lobster pending reward:', error);
  } finally {
    pendingRewardRefreshing = false;
  }
}

watch(() => [walletState.address, walletState.isConnected], () => {
  feedAmount.value = '';
  hasLoadedInitialState.value = false;
  loadData();
  startRewardPolling();
});

onMounted(() => {
  loadData();
  refreshTimer = window.setInterval(loadData, 15000);
  startRewardPolling();
});

onBeforeUnmount(() => {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }

  clearRewardTimer();
  resetPendingTokenAnimation();
});
</script>

<style scoped>
.page-shell {
  --lobster-accent-rgb: 255, 109, 63;
  --lobster-accent-deep-rgb: 217, 68, 39;
  --lobster-accent-soft-rgb: 255, 173, 118;
  --lobster-heading: #fff0e8;
  --lobster-text: #ffd9c8;
  --lobster-muted: #d8af9d;
  --lobster-subtle: #bc8a79;
  position: relative;
  min-height: 100vh;
  padding: 16px 16px 120px;
  background:
    radial-gradient(circle at 20% 0%, rgba(var(--lobster-accent-rgb), 0.16), transparent 34%),
    radial-gradient(circle at 80% 16%, rgba(var(--lobster-accent-soft-rgb), 0.12), transparent 26%),
    #060201;
  overflow-x: hidden;
}

.page-noise {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.9), transparent 92%);
  opacity: 0.45;
  pointer-events: none;
}

.page-bg-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(18px);
  pointer-events: none;
}

.page-bg-glow--primary {
  top: -140px;
  left: 50%;
  width: min(760px, 100vw);
  height: 360px;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(var(--lobster-accent-rgb), 0.24) 0%, rgba(var(--lobster-accent-rgb), 0) 72%);
}

.page-bg-glow--secondary {
  top: 240px;
  right: -100px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(var(--lobster-accent-soft-rgb), 0.16) 0%, rgba(var(--lobster-accent-soft-rgb), 0) 74%);
}

.page-header {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 8px auto 20px;
  text-align: center;
}

.page-title {
  margin: 0;
  font-size: clamp(1.6rem, 6.2vw, 2.25rem);
  font-weight: 800;
  background: linear-gradient(180deg, #fff8f4 0%, #ffd8c4 42%, #ff8b52 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.page-subtitle {
  max-width: 560px;
  margin: 10px auto 0;
  color: var(--lobster-muted);
  font-size: 0.84rem;
  line-height: 1.68;
}

.hero-panel {
  margin-top: 16px;
  padding: 16px;
  border-radius: 24px;
  border: 1px solid rgba(var(--lobster-accent-rgb), 0.22);
  background: linear-gradient(180deg, rgba(25, 11, 8, 0.92), rgba(10, 5, 4, 0.78));
  box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(16px);
  overflow: hidden;
  text-align: left;
  position: relative;
}

.hero-panel--compact {
  border-radius: 20px;
}

.hero-panel::before {
  content: '';
  position: absolute;
  inset: auto auto -80px -20px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--lobster-accent-rgb), 0.2), rgba(var(--lobster-accent-rgb), 0));
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.status-pill.is-success {
  background: rgba(86, 196, 123, 0.16);
  color: #aaf4c0;
}

.status-pill.is-warning {
  background: rgba(255, 166, 94, 0.16);
  color: #ffd5b6;
}

.status-pill.is-locked {
  background: rgba(140, 157, 168, 0.16);
  color: #d4e0e8;
}

.hero-heading {
  margin: 10px 0 6px;
  color: var(--lobster-heading);
  font-size: clamp(1.08rem, 4.2vw, 1.46rem);
  line-height: 1.35;
}

.hero-desc {
  margin: 0;
  color: var(--lobster-muted);
  font-size: 0.8rem;
  line-height: 1.56;
}

.hero-metrics {
  position: relative;
  z-index: 1;
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.hero-metric {
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(var(--lobster-accent-rgb), 0.14);
  background: rgba(255, 255, 255, 0.03);
}

.hero-metric-label {
  display: block;
  margin-bottom: 6px;
  color: var(--lobster-subtle);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}

.hero-metric-value {
  display: block;
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.28;
}

.cards-container {
  position: relative;
  z-index: 1;
  max-width: 620px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cards-container--inactive {
  gap: 12px;
}

.content-panel {
  padding: 14px;
  border-radius: 20px;
  border: 1px solid rgba(var(--lobster-accent-rgb), 0.18);
  background: rgba(18, 10, 7, 0.7);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.34);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.content-panel--compact {
  padding: 12px;
}

.content-panel--claim {
  padding: 12px;
}

.content-panel--feed {
  padding: 12px;
}

.panel-decor {
  height: 3px;
  margin: -14px -14px 14px;
  background: linear-gradient(90deg, transparent 0%, rgba(var(--lobster-accent-soft-rgb), 0.78) 50%, transparent 100%);
}

.content-panel--claim .panel-decor {
  margin: -12px -12px 12px;
}

.content-panel--compact .panel-decor {
  margin: -12px -12px 12px;
}

.content-panel--feed .panel-decor {
  margin: -12px -12px 10px;
}

.panel-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.panel-title {
  margin: 0 0 8px;
  color: var(--lobster-heading);
  font-size: 1.02rem;
  font-weight: 700;
}

.panel-desc {
  margin: 0;
  color: var(--lobster-muted);
  font-size: 0.8rem;
  line-height: 1.65;
}

.panel-top--compact .panel-title {
  margin-bottom: 6px;
}

.panel-top--claim {
  gap: 10px;
}

.panel-top--claim .panel-title {
  margin-bottom: 0;
}

.panel-top--feed {
  gap: 8px;
}

.panel-top--feed .panel-title {
  margin-bottom: 0;
}

.section-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 10px;
  margin-top: 12px;
  border-radius: 999px;
  background: rgba(var(--lobster-accent-rgb), 0.14);
  color: var(--lobster-text);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.section-tag--benefit {
  background: rgba(var(--lobster-accent-soft-rgb), 0.16);
  color: #ffe3d3;
}

.hero-chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 12px;
  background: rgba(var(--lobster-accent-rgb), 0.14);
  border: 1px solid rgba(var(--lobster-accent-rgb), 0.2);
  color: var(--lobster-text);
  font-size: 0.76rem;
  font-weight: 700;
}

.hero-chip--soft {
  background: rgba(var(--lobster-accent-soft-rgb), 0.14);
  border-color: rgba(var(--lobster-accent-soft-rgb), 0.22);
  color: #ffe1d0;
}

.hero-chip--claim {
  min-height: 30px;
  padding: 0 10px;
  font-size: 0.72rem;
  white-space: nowrap;
}

.status-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.status-row--compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 12px;
  gap: 8px;
}

.status-row--compact .status-group {
  padding: 8px 10px;
  border-radius: 12px;
}

.status-row--compact .status-label {
  font-size: 0.7rem;
  white-space: nowrap;
}

.status-row--compact .status-badge {
  min-height: 24px;
  padding: 0 8px;
  font-size: 0.68rem;
  white-space: nowrap;
}

.status-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
}

.status-label {
  color: var(--lobster-muted);
  font-size: 0.8rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
}

.status-badge.is-ready,
.status-badge.is-success {
  color: #aaf4c0;
  background: rgba(86, 196, 123, 0.18);
}

.status-badge.is-warning {
  color: #ffd4b5;
  background: rgba(255, 166, 94, 0.18);
}

.status-badge.is-locked {
  color: #d4e0e8;
  background: rgba(140, 157, 168, 0.18);
}

.state-box {
  margin-top: 14px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.state-box--info {
  background: rgba(var(--lobster-accent-rgb), 0.08);
  border-color: rgba(var(--lobster-accent-rgb), 0.14);
}

.state-box--success {
  background: rgba(48, 114, 86, 0.14);
  border-color: rgba(86, 196, 123, 0.18);
}

.state-box--accent {
  background: rgba(var(--lobster-accent-rgb), 0.12);
  border-color: rgba(var(--lobster-accent-rgb), 0.18);
}

.state-box--warning {
  background: rgba(138, 86, 49, 0.14);
  border-color: rgba(255, 166, 94, 0.18);
}

.state-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.state-title {
  margin: 0 0 8px;
  color: var(--lobster-heading);
  font-size: 0.96rem;
}

.state-desc {
  margin: 0;
  color: var(--lobster-muted);
  font-size: 0.8rem;
  line-height: 1.65;
}

.mini-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.mini-item {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.mini-label {
  display: block;
  margin-bottom: 8px;
  color: var(--lobster-subtle);
  font-size: 0.72rem;
}

.mini-value {
  display: block;
  color: #ffffff;
  font-size: 0.9rem;
  line-height: 1.4;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.action-row--compact {
  margin-top: 12px;
}

.action-row--compact .action-btn {
  min-height: 42px;
  font-size: 0.95rem;
}

.flow-strip {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.flow-item {
  min-height: 38px;
  padding: 6px 8px;
  border-radius: 12px;
  border: 1px solid rgba(var(--lobster-accent-rgb), 0.12);
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: left;
}

.flow-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 22px;
  min-height: 22px;
  border-radius: 999px;
  background: rgba(var(--lobster-accent-rgb), 0.16);
  color: #ffe2d1;
  font-size: 0.62rem;
  font-weight: 700;
}

.flow-text {
  display: block;
  color: var(--lobster-heading);
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.15;
}

.benefit-summary {
  margin-top: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.03);
}

.benefit-summary-text {
  margin: 0;
  color: var(--lobster-muted);
  font-size: 0.76rem;
  line-height: 1.6;
}

.action-btn {
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(var(--lobster-accent-rgb), 0.18);
  background: rgba(var(--lobster-accent-rgb), 0.1);
  color: var(--lobster-text);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
}

.action-btn.primary {
  flex: 1;
  border: none;
  background: linear-gradient(135deg, rgba(var(--lobster-accent-soft-rgb), 0.96), rgba(var(--lobster-accent-deep-rgb), 0.96));
  color: #1a0905;
}

.action-btn.ghost {
  min-width: 136px;
  background: rgba(255, 255, 255, 0.02);
  color: var(--lobster-text);
}

.action-btn--block {
  width: 100%;
  margin-top: 14px;
}

.content-panel--feed .action-btn--block {
  margin-top: 10px;
}

.action-btn--claim {
  margin-top: 10px;
  min-height: 44px;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(var(--lobster-accent-rgb), 0.2);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.reward-showcase {
  margin-top: 16px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(var(--lobster-accent-rgb), 0.14);
  background: linear-gradient(180deg, rgba(39, 18, 12, 0.82), rgba(11, 6, 4, 0.88));
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 14px;
}

.reward-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.reward-label {
  color: var(--lobster-subtle);
  font-size: 0.76rem;
  margin-bottom: 12px;
}

.reward-value-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.reward-value {
  color: #ffffff;
  font-size: clamp(1.35rem, 5.4vw, 1.9rem);
  font-weight: 800;
  line-height: 1;
}

.reward-unit {
  color: var(--lobster-muted);
  font-size: 0.86rem;
  line-height: 1.4;
}

.reward-side {
  display: grid;
  gap: 10px;
}

.reward-side-item {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.reward-side-label {
  display: block;
  color: var(--lobster-subtle);
  font-size: 0.72rem;
  margin-bottom: 8px;
}

.reward-side-value {
  display: block;
  color: #ffffff;
  font-size: 0.92rem;
  font-weight: 700;
}

.data-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.data-item {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(var(--lobster-accent-rgb), 0.12);
  background: rgba(255, 255, 255, 0.03);
  text-align: left;
}

.data-label {
  display: block;
  margin-bottom: 8px;
  color: var(--lobster-subtle);
  font-size: 0.72rem;
}

.data-value {
  display: block;
  color: #ffffff;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.45;
}

.yield-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.yield-grid--single {
  grid-template-columns: 1fr;
}

.yield-grid--feed {
  margin-top: 8px;
}

.yield-card {
  padding: 16px 14px;
  border-radius: 16px;
  border: 1px solid rgba(var(--lobster-accent-rgb), 0.12);
  background: rgba(255, 255, 255, 0.03);
}

.yield-card--feed {
  padding: 12px 14px;
}

.yield-card--accent {
  border-color: rgba(255, 148, 106, 0.16);
  background: rgba(255, 148, 106, 0.07);
}

.yield-label {
  display: block;
  color: var(--lobster-muted);
  font-size: 0.78rem;
  margin-bottom: 8px;
}

.yield-card--feed .yield-label {
  margin-bottom: 4px;
}

.yield-value {
  display: block;
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.yield-meta {
  display: block;
  margin-top: 4px;
  color: var(--lobster-subtle);
  font-size: 0.74rem;
  line-height: 1.45;
}

.input-card {
  margin-top: 14px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(var(--lobster-accent-rgb), 0.14);
  background: rgba(255, 255, 255, 0.03);
}

.content-panel--feed .input-card {
  margin-top: 10px;
  padding: 12px;
}

.input-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.content-panel--feed .input-head {
  margin-bottom: 8px;
}

.field-label {
  color: var(--lobster-text);
  font-size: 0.85rem;
}

.field-range {
  color: var(--lobster-subtle);
  font-size: 0.75rem;
  text-align: right;
  white-space: nowrap;
}

.token-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 0 12px;
  border-radius: 14px;
  border: 1px solid rgba(var(--lobster-accent-rgb), 0.16);
  background: rgba(9, 4, 3, 0.86);
}

.token-chip {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  aspect-ratio: 1;
  box-sizing: border-box;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(255, 213, 112, 0.4);
}

.token-logo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.token-input-main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.token-input {
  flex: 1;
  min-width: 0;
  height: 56px;
  border: none;
  outline: none;
  background: transparent;
  color: #ffffff;
  font-size: 0.96rem;
  font-weight: 700;
  padding: 0;
}

.token-input::placeholder {
  color: rgba(255, 220, 205, 0.42);
  font-size: 0.88rem;
  font-weight: 500;
}

.input-token {
  color: var(--lobster-subtle);
  font-size: 0.8rem;
  font-weight: 700;
}

.feed-action-btn {
  min-height: 40px;
  border-radius: 12px;
}

.data-grid--claim {
  margin-top: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.data-grid--claim .data-item {
  padding: 12px 12px;
  text-align: center;
}

.data-grid--claim .data-label {
  margin-bottom: 0px;
}

.data-item--claim-primary {
  border-color: rgba(var(--lobster-accent-rgb), 0.2);
  background: linear-gradient(180deg, rgba(56, 24, 16, 0.92), rgba(15, 7, 5, 0.96));
}

.data-value--claim {
  font-size: clamp(1.08rem, 4.2vw, 1.35rem);
  line-height: 1.2;
}

.data-value--highlight {
  color: #fff4ee;
  text-shadow: 0 0 18px rgba(var(--lobster-accent-rgb), 0.24);
}

.data-value-unit {
  display: block;
  margin-top: 2px;
  color: var(--lobster-subtle);
  font-size: 0.76rem;
  font-weight: 600;
}

.claim-note {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255, 148, 106, 0.14);
  background: rgba(255, 148, 106, 0.08);
}

.claim-note .hint-line {
  margin: 0;
}

.fee-card {
  margin-top: 14px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
}

.hint-line {
  margin: 12px 2px 0;
  color: var(--lobster-muted);
  font-size: 0.78rem;
  line-height: 1.7;
}

.hint-line.warning {
  color: #ffd0b7;
}

.hint-line--left {
  margin-left: 0;
  margin-right: 0;
  text-align: left;
}

.feature-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.feature-card {
  min-height: 154px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(var(--lobster-accent-rgb), 0.14);
  background: linear-gradient(180deg, rgba(43, 18, 12, 0.74), rgba(11, 6, 4, 0.92));
}

.feature-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  min-height: 28px;
  border-radius: 999px;
  background: rgba(var(--lobster-accent-rgb), 0.14);
  color: #ffe2d1;
  font-size: 0.78rem;
  font-weight: 700;
}

.feature-title {
  margin: 14px 0 8px;
  color: var(--lobster-heading);
  font-size: 0.98rem;
}

.feature-desc {
  margin: 0;
  color: var(--lobster-muted);
  font-size: 0.82rem;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .panel-top,
  .state-head,
  .reward-showcase {
    flex-direction: column;
    align-items: stretch;
  }

  .input-head {
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .field-label {
    flex: 1;
    min-width: 0;
  }

  .field-range {
    flex-shrink: 0;
    font-size: 0.72rem;
  }

  .action-row:not(.action-row--compact) {
    flex-direction: column;
    align-items: stretch;
  }

  .reward-showcase {
    display: flex;
  }

  .hero-chip,
  .hero-chip--soft {
    align-self: flex-start;
  }

  .panel-top--claim {
    flex-direction: row;
    align-items: flex-start;
  }

  .action-btn.ghost {
    min-width: 0;
    width: 100%;
  }

  .action-row--compact .action-btn.ghost {
    width: auto;
  }
}

@media (max-width: 520px) {
  .page-shell {
    padding-left: 14px;
    padding-right: 14px;
  }

  .page-subtitle {
    font-size: 0.82rem;
  }

  .hero-panel,
  .content-panel {
    border-radius: 18px;
  }

  .hero-metrics,
  .mini-grid,
  .data-grid:not(.data-grid--claim),
  .yield-grid {
    grid-template-columns: 1fr;
  }

  .data-grid--claim {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .status-row:not(.status-row--compact) {
    grid-template-columns: 1fr;
  }

  .status-row--compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .reward-value,
  .data-value--claim {
    font-size: 1.45rem;
  }

  .field-label {
    font-size: 0.8rem;
  }

  .field-range {
    font-size: 0.68rem;
  }
}
</style>
