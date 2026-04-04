<template>
  <div class="page-shell">
    <div class="page-bg-glow"></div>

    <section class="page-header">
      <h1 class="page-title">{{ t('investNB.title') }}</h1>
      <p class="page-subtitle">{{ t('investNB.subtitle') }}</p>
    </section>

    <div class="cards-container">
      <section class="content-panel">
        <div class="panel-decor"></div>
        <h2 class="panel-title">{{ t('investNB.panel.invest') }}</h2>

        <div v-if="hasInvested" class="invested-card">
          <p class="invested-text">{{ t('investNB.investedText', { amount: selfInvestAmountText }) }}</p>
        </div>

        <template v-else>
          <div class="input-card">
            <div class="input-head">
              <span class="field-label">{{ t('investNB.field.amount') }}</span>
            </div>

            <div class="token-input-wrap">
              <div class="token-chip">
                <img src="/asset/images/logo/usdt-coin.png" class="token-logo" alt="USDT" />
              </div>
              <input
                v-model="investAmount"
                class="token-input"
                type="text"
                inputmode="decimal"
                :placeholder="t('investNB.inputPlaceholder', { min: minInvestAmountText, max: maxInvestAmountText })"
                :disabled="hasInvested"
                @input="onInvestAmountChange"
              />
            </div>

            <div class="details-block">
              <div class="summary-row">
                <span>{{ t('investNB.balance.usdt') }}</span>
                <span>{{ usdtBalanceText }} USDT</span>
              </div>
              <div v-if="!hasBoundReferral" class="summary-row">
                <span>{{ t('investNB.referrer') }}</span>
                <span class="text-warning">{{ referralStatusText }}</span>
              </div>
            </div>
          </div>

          <p v-if="!hasBoundReferral" class="hint-line warning">
            {{ t('investNB.referral.bindHint') }}
          </p>

          <button class="confirm-btn" :disabled="investDisabled" @click="handleInvestClick">
            {{ investButtonText }}
          </button>
        </template>
      </section>

      <section class="content-panel data-panel">
        <div class="panel-decor"></div>
        <h2 class="panel-title">{{ t('investNB.panel.data') }}</h2>

        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">{{ t('investNB.data.nbBalance') }}</span>
            <span class="data-value">{{ nbBalanceText }}</span>
            <span class="data-subvalue">≈ {{ nbBalanceUsdtText }} USDT</span>
          </div>
          <div class="data-item">
            <span class="data-label">{{ t('investNB.data.nbFriendResults') }}</span>
            <span class="data-value">{{ directPerfText }} USDT</span>
          </div>
          <div class="data-item">
            <span class="data-label">{{ t('investNB.data.nbTeamPerformance') }}</span>
            <span class="data-value">{{ nbTeamPerformanceText }} USDT</span>
          </div>
          <div class="data-item">
            <span class="data-label">{{ t('investNB.data.nbTeamResults') }}</span>
            <span class="data-value">{{ teamPerfText }} USDT</span>
          </div>
        </div>

        <div class="quota-section">
          <div class="quota-row">
            <span class="quota-title">{{ t('investNB.quota.title') }}</span>
            <span class="quota-value">{{ t('investNB.quota.summary', { used: usedQuotaText, total: totalQuotaText }) }}</span>
          </div>
          <div class="quota-progress-track">
            <div class="quota-progress-fill" :style="{ width: `${quotaProgress}%` }"></div>
          </div>
          <button class="confirm-btn quota-action-btn" @click="handleGoToSellNb">{{ t('investNB.action.sellNb') }}</button>
        </div>
      </section>

      <section class="content-panel dividend-panel">
        <div class="panel-decor"></div>
        <h2 class="panel-title s6-title">{{ t('investNB.panel.s6') }}</h2>
        <p class="panel-desc">{{ t('investNB.s6.desc') }}</p>

        <div class="dividend-status-row single-col" v-if="currentLevel !== 7">
          <div class="status-group">
            <span class="status-label">{{ t('investNB.data.nbLevel') }}</span>
            <span class="status-badge" :class="nbLevelBadgeClass">{{ currentLevelText }}</span>
          </div>
        </div>

        <div class="dividend-stats">
          <div class="stat-box">
            <span class="stat-label">{{ t('investNB.s6.pendingReward') }}</span>
            <span class="stat-value highlight">{{ s6PendingText }} USDT</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">{{ t('investNB.s6.harvestedReward') }}</span>
            <span class="stat-value">{{ s6HarvestedText }} USDT</span>
          </div>
        </div>

        <p v-if="s6HintText" class="hint-line" :class="{ warning: showS6RegisterButton }">
          {{ s6HintText }}
        </p>

        <button
          v-if="showS6RegisterButton"
          class="confirm-btn primary"
          :disabled="!canRegisterS6"
          @click="handleRegisterS6"
        >
          {{ isRegisteringS6 ? t('investNB.s6.action.activating') : t('investNB.s6.action.activate') }}
        </button>
        <button
          v-else
          class="confirm-btn primary"
          :disabled="!canHarvestS6"
          @click="handleHarvestS6"
        >
          {{ isHarvestingS6 ? t('investNB.s6.action.harvesting') : t('investNB.s6.action.harvest') }}
        </button>
      </section>

      <section class="content-panel dividend-panel s7-panel">
        <div class="panel-decor"></div>
        <h2 class="panel-title s7-title">{{ t('investNB.panel.s7') }}</h2>
        <p class="panel-desc">{{ t('investNB.s7.desc') }}</p>

        <div class="dividend-status-row single-col">
          <div class="status-group">
            <span class="status-label">{{ t('investNB.status.shareholder') }}</span>
            <span class="status-badge" :class="s7StatusClass">{{ s7StatusText }}</span>
          </div>
        </div>

        <div class="dividend-stats">
          <div class="stat-box">
            <span class="stat-label">{{ t('investNB.s7.pendingReward') }}</span>
            <span class="stat-value highlight">{{ shareholderPendingText }} USDT</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">{{ t('investNB.s7.harvestedReward') }}</span>
            <span class="stat-value">{{ shareholderHarvestedText }} USDT</span>
          </div>
        </div>

        <p v-if="s7HintText" class="hint-line warning">
          {{ s7HintText }}
        </p>

        <button
          v-if="showShareholderRegisterButton"
          class="confirm-btn primary"
          :disabled="!canRegisterShareholder"
          @click="handleRegisterShareholder"
        >
          {{ isRegisteringShareholder ? t('investNB.s7.action.activating') : t('investNB.s7.action.activate') }}
        </button>
        <button
          v-else
          class="confirm-btn primary"
          :disabled="!canHarvestShareholder"
          @click="handleHarvestShareholder"
        >
          {{ isHarvestingShareholder ? t('investNB.s7.action.harvesting') : t('investNB.s7.action.harvest') }}
        </button>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ethers } from 'ethers';
import { t } from '@/i18n/index.js';
import { walletState } from '@/services/wallet';
import { getContractAddress } from '@/services/contracts';
import { showToast } from '@/services/notification';
import nbAbi from '@/abis/NB.json';
import nbManagerAbi from '@/abis/NBManager.json';
import pancakeRouterV2Abi from '@/abis/pancakeRouterV2.json';

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)'
];

const REFERRAL_ABI = [
  'function isBindReferral(address) view returns (bool)'
];

const isDataLoading = ref(false);
const isInvesting = ref(false);
const isHarvestingS6 = ref(false);
const isRegisteringS6 = ref(false);
let refreshTimer = null;
const router = useRouter();

const usdtAddress = computed(() => getContractAddress('USDT'));
const routerAddress = computed(() => getContractAddress('Router'));
const mskeAddress = computed(() => getContractAddress('MSKE'));
const nbAddress = computed(() => getContractAddress('NB'));
const referralAddress = computed(() => getContractAddress('Referral'));
const nbManagerAddress = computed(() => getContractAddress('NBManager'));

const hasBoundReferral = ref(false);
const usdtBalanceRaw = ref(0n);
const nbBalanceRaw = ref(0n);
const nbBalanceUsdtRaw = ref(0n);
const investAmount = ref('');
const minInvestRaw = ref(ethers.parseUnits('100', 18));
const maxInvestRaw = ref(ethers.parseUnits('3000', 18));
const hasInvested = ref(false);
const selfInvestRaw = ref(0n);
const usdtAllowanceRaw = ref(0n);
const directPerfRaw = ref(0n);
const nbTeamPerformanceRaw = ref(0n);
const teamPerfRaw = ref(0n);
const currentLevel = ref(0);
const totalQuotaRaw = ref(0n);
const usedQuotaRaw = ref(0n);
const remainingQuotaRaw = ref(0n);
const isS6Registered = ref(false);
const s6PendingRaw = ref(0n);
const s6HarvestedRaw = ref(0n);
const isShareholderQualified = ref(false);
const isShareholder = ref(false);
const shareholderPendingRaw = ref(0n);
const shareholderHarvestedRaw = ref(0n);
const isHarvestingShareholder = ref(false);
const isRegisteringShareholder = ref(false);

const formatU = (val, decimals = 18) => {
  const num = Number(ethers.formatUnits(val, decimals));
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const formatNB = (val, decimals = 18) => {
  const num = Number(ethers.formatUnits(val, decimals));
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
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

const usdtBalanceText = computed(() => formatU(usdtBalanceRaw.value));
const nbBalanceText = computed(() => formatNB(nbBalanceRaw.value));
const nbBalanceUsdtText = computed(() => {
  if (nbBalanceUsdtRaw.value === null) return '--';
  return formatU(nbBalanceUsdtRaw.value);
});
const selfInvestAmountText = computed(() => formatU(selfInvestRaw.value));
const minInvestAmountText = computed(() => formatU(minInvestRaw.value));
const maxInvestAmountText = computed(() => formatU(maxInvestRaw.value));
const directPerfText = computed(() => formatU(directPerfRaw.value));
const nbTeamPerformanceText = computed(() => formatU(nbTeamPerformanceRaw.value));
const teamPerfText = computed(() => formatU(teamPerfRaw.value));
const totalQuotaText = computed(() => formatU(totalQuotaRaw.value));
const usedQuotaText = computed(() => formatU(usedQuotaRaw.value));
const quotaProgress = computed(() => {
  if (totalQuotaRaw.value <= 0n) return 0;
  const progressBps = Number((usedQuotaRaw.value * 10000n) / totalQuotaRaw.value);
  return Math.min(Math.max(progressBps / 100, 0), 100);
});
const referralStatusText = computed(() => t('investNB.referral.unbound'));
const currentLevelText = computed(() => {
  if (currentLevel.value <= 0) return t('investNB.level.none');
  if (currentLevel.value === 7) return t('investNB.level.shareholder');
  return `S${currentLevel.value}`;
});

const isS6Eligible = computed(() => currentLevel.value === 6 || isS6Registered.value);
const s6PendingText = computed(() => formatU(s6PendingRaw.value));
const s6HarvestedText = computed(() => formatU(s6HarvestedRaw.value));
const showS6RegisterButton = computed(() => currentLevel.value === 6 && !isS6Registered.value);
const s6StatusText = computed(() => {
  if (!isS6Eligible.value) return t('investNB.s6.status.notReached');
  if (showS6RegisterButton.value) return t('investNB.s6.status.pendingActivation');
  if (s6PendingRaw.value > 0n) return t('investNB.s6.status.claimable');
  return t('investNB.s6.status.activated');
});
const s6StatusClass = computed(() => {
  if (!isS6Eligible.value) return 'is-locked';
  if (showS6RegisterButton.value) return 'is-warning';
  if (s6PendingRaw.value > 0n) return 'is-success';
  return 'is-ready';
});
const nbLevelBadgeClass = computed(() => (currentLevel.value > 0 ? 'is-ready' : 'is-locked'));
const s6HintText = computed(() => {
  if (!isS6Eligible.value) return '';
  if (showS6RegisterButton.value) return t('investNB.s6.hint.activate');
  if (s6PendingRaw.value > 0n) return '';
  if (currentLevel.value === 7) return '';
  return t('investNB.s6.hint.empty');
});
const canRegisterS6 = computed(() => walletState.isConnected && showS6RegisterButton.value && !isRegisteringS6.value);
const canHarvestS6 = computed(() => walletState.isConnected && isS6Registered.value && s6PendingRaw.value > 0n && !isHarvestingS6.value);

const shareholderPendingText = computed(() => formatU(shareholderPendingRaw.value));
const shareholderHarvestedText = computed(() => formatU(shareholderHarvestedRaw.value));
const isShareholderEligible = computed(() => isShareholderQualified.value || isShareholder.value || currentLevel.value === 7);
const showShareholderRegisterButton = computed(() => isShareholderQualified.value && !isShareholder.value);
const s7StatusText = computed(() => {
  if (showShareholderRegisterButton.value) return t('investNB.s7.status.pendingActivation');
  if (isShareholderEligible.value) return t('investNB.s7.status.reached');
  return t('investNB.s7.status.notReached');
});
const s7StatusClass = computed(() => {
  if (showShareholderRegisterButton.value) return 'is-warning';
  if (isShareholderEligible.value) return 'is-ready';
  return 'is-locked';
});
const s7HintText = computed(() => {
  if (showShareholderRegisterButton.value) return t('investNB.s7.hint.activate');
  return '';
});
const canRegisterShareholder = computed(() => walletState.isConnected && showShareholderRegisterButton.value && !isRegisteringShareholder.value);
const canHarvestShareholder = computed(() => walletState.isConnected && isShareholder.value && shareholderPendingRaw.value > 0n && !isHarvestingShareholder.value);

const canQuoteNbUsdt = computed(() => (
  ethers.isAddress(routerAddress.value || '')
  && ethers.isAddress(nbAddress.value || '')
  && ethers.isAddress(mskeAddress.value || '')
  && ethers.isAddress(usdtAddress.value || '')
));

let nbBalanceQuoteRequestId = 0;

const investAmountRaw = computed(() => {
  if (!investAmount.value || Number(investAmount.value) <= 0) return 0n;
  try {
    return ethers.parseUnits(investAmount.value, 18);
  } catch {
    return 0n;
  }
});

const investDisabled = computed(() => {
  if (!walletState.isConnected || !walletState.address) return true;
  if (isDataLoading.value || isInvesting.value) return true;
  if (!ethers.isAddress(nbManagerAddress.value || '')) return true;
  if (hasInvested.value) return true;
  if (!hasBoundReferral.value) return true;
  if (investAmountRaw.value < minInvestRaw.value || investAmountRaw.value > maxInvestRaw.value) return true;
  if (investAmountRaw.value > usdtBalanceRaw.value) return true;
  return false;
});

const investButtonText = computed(() => {
  if (!walletState.isConnected) return t('investNB.action.connectWallet');
  if (isDataLoading.value) return t('investNB.action.loadingData');
  if (hasInvested.value) return t('investNB.action.alreadyInvested');
  if (!hasBoundReferral.value) return t('investNB.action.bindReferrerFirst');
  if (isInvesting.value) return usdtAllowanceRaw.value < investAmountRaw.value
    ? t('investNB.action.approving')
    : t('investNB.action.investing');
  if (investAmount.value && investAmountRaw.value === 0n) return t('investNB.action.invalidAmount');
  if (investAmountRaw.value > 0n && investAmountRaw.value < minInvestRaw.value) {
    return t('investNB.action.minInvest', { amount: minInvestAmountText.value });
  }
  if (investAmountRaw.value > maxInvestRaw.value) {
    return t('investNB.action.maxInvest', { amount: maxInvestAmountText.value });
  }
  if (investAmountRaw.value > usdtBalanceRaw.value) return t('investNB.action.insufficientUsdt');
  if (investAmountRaw.value > 0n && usdtAllowanceRaw.value < investAmountRaw.value) return t('investNB.action.approveUsdt');
  return t('investNB.action.invest');
});

const getProvider = () => {
  if (walletState.provider) return walletState.provider;
  if (window.ethereum) return new ethers.BrowserProvider(window.ethereum);
  return null;
};

const refreshNbBalanceUsdtQuote = async (provider, nbAmountRaw) => {
  const requestId = ++nbBalanceQuoteRequestId;

  if (nbAmountRaw <= 0n) {
    nbBalanceUsdtRaw.value = 0n;
    return;
  }

  if (!provider || !canQuoteNbUsdt.value) {
    nbBalanceUsdtRaw.value = null;
    return;
  }

  try {
    const routerContract = new ethers.Contract(routerAddress.value, pancakeRouterV2Abi, provider);
    const amountsOut = await routerContract.getAmountsOut(nbAmountRaw, [
      nbAddress.value,
      mskeAddress.value,
      usdtAddress.value
    ]);

    if (requestId !== nbBalanceQuoteRequestId) return;
    nbBalanceUsdtRaw.value = amountsOut[amountsOut.length - 1] ?? 0n;
  } catch (error) {
    if (requestId === nbBalanceQuoteRequestId) {
      nbBalanceUsdtRaw.value = null;
    }
  }
};

const resetUserData = () => {
  nbBalanceQuoteRequestId += 1;
  hasBoundReferral.value = false;
  usdtBalanceRaw.value = 0n;
  nbBalanceRaw.value = 0n;
  nbBalanceUsdtRaw.value = 0n;
  hasInvested.value = false;
  selfInvestRaw.value = 0n;
  usdtAllowanceRaw.value = 0n;
  directPerfRaw.value = 0n;
  nbTeamPerformanceRaw.value = 0n;
  teamPerfRaw.value = 0n;
  currentLevel.value = 0;
  totalQuotaRaw.value = 0n;
  usedQuotaRaw.value = 0n;
  remainingQuotaRaw.value = 0n;
  isS6Registered.value = false;
  s6PendingRaw.value = 0n;
  s6HarvestedRaw.value = 0n;
  isShareholderQualified.value = false;
  isShareholder.value = false;
  shareholderPendingRaw.value = 0n;
  shareholderHarvestedRaw.value = 0n;
};

const onInvestAmountChange = (event) => {
  investAmount.value = limitDecimalPlaces(event.target.value, 18);
};

const handleGoToSellNb = () => {
  router.push({
    name: 'Trade',
    query: {
      direction: 'sell',
      token: 'NB',
      focus: 'mode-tabs'
    }
  });
};

const loadData = async () => {
  isDataLoading.value = true;
  const provider = getProvider();

  if (!provider || !nbAddress.value || !ethers.isAddress(nbManagerAddress.value || '')) {
    resetUserData();
    isDataLoading.value = false;
    return;
  }

  try {
    const nbContract = new ethers.Contract(nbAddress.value, nbAbi, provider);

    if (!walletState.isConnected || !walletState.address || !nbManagerAddress.value) {
      resetUserData();
      return;
    }

    const user = walletState.address;
    const usdtContract = new ethers.Contract(usdtAddress.value, ERC20_ABI, provider);
    const referralContract = new ethers.Contract(referralAddress.value, REFERRAL_ABI, provider);
    const nbManager = new ethers.Contract(nbManagerAddress.value, nbManagerAbi, provider);

    const [
      uBal,
      nBal,
      uAllow,
      isBound,
      minInv,
      maxInv,
      invested,
      selfInvestAmount,
      directPerf,
      nbTeamPerformance,
      teamInfo,
      teamPerf,
      s6Reg,
      s6Pend,
      s6Harv,
      totalQuota,
      remainingQuota,
      usedQuota,
      isShareholderQual,
      isShareholderReg,
      shareholderPend,
      shareholderHarv
    ] = await Promise.all([
      usdtContract.balanceOf(user).catch(() => 0n),
      nbContract.balanceOf(user).catch(() => 0n),
      usdtContract.allowance(user, nbManagerAddress.value).catch(() => 0n),
      referralContract.isBindReferral(user).catch(() => false),
      nbManager.minInvestAmount().catch(() => ethers.parseUnits('100', 18)),
      nbManager.maxInvestAmount().catch(() => ethers.parseUnits('3000', 18)),
      nbManager.hasInvested(user).catch(() => false),
      nbManager.selfTotalInvestValue(user).catch(() => 0n),
      nbManager.directTotalInvestValue(user).catch(() => 0n),
      nbManager.referralTotalInvestValue(user).catch(() => 0n),
      nbManager.getTeamRewardInfo(user).catch(() => [0n, 0, 0]),
      nbManager.getTeamPerformance(user).catch(() => 0n),
      nbManager.isS6Registered(user).catch(() => false),
      nbManager.s6PendingReward(user).catch(() => 0n),
      nbManager.userHarvestedReward(user).catch(() => 0n),
      nbContract.totalUnlockedSellQuotaU(user).catch(() => 0n),
      nbContract.remainingSellQuotaU(user).catch(() => 0n),
      nbContract.usedSellQuotaU(user).catch(() => 0n),
      nbManager.isShareholderQualified(user).catch(() => false),
      nbManager.isShareholder(user).catch(() => false),
      nbManager.shareholderPendingReward(user).catch(() => 0n),
      nbManager.shareholderUserHarvestedReward(user).catch(() => 0n)
    ]);

    usdtBalanceRaw.value = uBal;
    nbBalanceRaw.value = nBal;
    await refreshNbBalanceUsdtQuote(provider, nBal);
    usdtAllowanceRaw.value = uAllow;
    hasBoundReferral.value = isBound;
    minInvestRaw.value = minInv;
    maxInvestRaw.value = maxInv;
    selfInvestRaw.value = selfInvestAmount;
    hasInvested.value = invested || selfInvestAmount > 0n;
    directPerfRaw.value = directPerf;
    nbTeamPerformanceRaw.value = nbTeamPerformance;
    teamPerfRaw.value = teamPerf > 0n ? teamPerf : (teamInfo?.[0] ?? 0n);
    currentLevel.value = Number(teamInfo?.[1] ?? 0);
    isS6Registered.value = s6Reg;
    s6PendingRaw.value = s6Pend;
    s6HarvestedRaw.value = s6Harv;
    totalQuotaRaw.value = totalQuota;
    remainingQuotaRaw.value = remainingQuota;
    usedQuotaRaw.value = usedQuota;
    isShareholderQualified.value = isShareholderQual;
    isShareholder.value = isShareholderReg;
    shareholderPendingRaw.value = shareholderPend;
    shareholderHarvestedRaw.value = shareholderHarv;
  } catch (error) {
    console.error('Failed to load NB data:', error);
  } finally {
    isDataLoading.value = false;
  }
};

const handleInvestClick = async () => {
  if (investDisabled.value) return;
  const signer = walletState.signer;
  if (!signer || !ethers.isAddress(nbManagerAddress.value || '')) return;

  try {
    isInvesting.value = true;

    if (usdtAllowanceRaw.value < investAmountRaw.value) {
      const usdtContract = new ethers.Contract(usdtAddress.value, ERC20_ABI, signer);
      const tx = await usdtContract.approve(nbManagerAddress.value, ethers.MaxUint256);
      showToast(t('toast.investNB.approveSubmitted'), 'info');
      await tx.wait();
      showToast(t('toast.investNB.approveSuccess'), 'success');
      usdtAllowanceRaw.value = ethers.MaxUint256;
      return;
    }

    const nbManager = new ethers.Contract(nbManagerAddress.value, nbManagerAbi, signer);
    const tx = await nbManager.invest(investAmountRaw.value, 0, 0);
    showToast(t('toast.investNB.investSubmitted'), 'info');
    await tx.wait();
    showToast(t('toast.investNB.investSuccess'), 'success');
    investAmount.value = '';
    await loadData();
  } catch (error) {
    console.error(error);
    showToast(t('toast.investNB.actionFailed'), 'error');
  } finally {
    isInvesting.value = false;
  }
};

const handleRegisterS6 = async () => {
  if (!canRegisterS6.value) return;
  const signer = walletState.signer;
  if (!signer || !walletState.address || !ethers.isAddress(nbManagerAddress.value || '')) return;

  try {
    isRegisteringS6.value = true;
    const nbManager = new ethers.Contract(nbManagerAddress.value, nbManagerAbi, signer);
    const tx = await nbManager.registerS6(walletState.address);
    showToast(t('toast.investNB.s6ActivateSubmitted'), 'info');
    await tx.wait();
    showToast(t('toast.investNB.s6ActivateSuccess'), 'success');
    await loadData();
  } catch (error) {
    console.error(error);
    showToast(t('toast.investNB.s6ActivateFailed'), 'error');
  } finally {
    isRegisteringS6.value = false;
  }
};

const handleHarvestS6 = async () => {
  if (!canHarvestS6.value) return;
  const signer = walletState.signer;
  if (!signer || !ethers.isAddress(nbManagerAddress.value || '')) return;

  try {
    isHarvestingS6.value = true;
    const nbManager = new ethers.Contract(nbManagerAddress.value, nbManagerAbi, signer);
    const tx = await nbManager.s6Harvest();
    showToast(t('toast.investNB.s6HarvestSubmitted'), 'info');
    await tx.wait();
    showToast(t('toast.investNB.s6HarvestSuccess'), 'success');
    await loadData();
  } catch (error) {
    console.error(error);
    showToast(t('toast.investNB.s6HarvestFailed'), 'error');
  } finally {
    isHarvestingS6.value = false;
  }
};

const handleRegisterShareholder = async () => {
  if (!canRegisterShareholder.value) return;
  const signer = walletState.signer;
  if (!signer || !walletState.address || !ethers.isAddress(nbManagerAddress.value || '')) return;

  try {
    isRegisteringShareholder.value = true;
    const nbManager = new ethers.Contract(nbManagerAddress.value, nbManagerAbi, signer);
    const tx = await nbManager.registerShareholder(walletState.address);
    showToast(t('toast.investNB.s7ActivateSubmitted'), 'info');
    await tx.wait();
    showToast(t('toast.investNB.s7ActivateSuccess'), 'success');
    await loadData();
  } catch (error) {
    console.error(error);
    showToast(t('toast.investNB.s7ActivateFailed'), 'error');
  } finally {
    isRegisteringShareholder.value = false;
  }
};

const handleHarvestShareholder = async () => {
  if (!canHarvestShareholder.value) return;
  const signer = walletState.signer;
  if (!signer || !ethers.isAddress(nbManagerAddress.value || '')) return;

  try {
    isHarvestingShareholder.value = true;
    const nbManager = new ethers.Contract(nbManagerAddress.value, nbManagerAbi, signer);
    const tx = await nbManager.shareholderHarvest();
    showToast(t('toast.investNB.s7HarvestSubmitted'), 'info');
    await tx.wait();
    showToast(t('toast.investNB.s7HarvestSuccess'), 'success');
    await loadData();
  } catch (error) {
    console.error(error);
    showToast(t('toast.investNB.s7HarvestFailed'), 'error');
  } finally {
    isHarvestingShareholder.value = false;
  }
};

watch(() => [walletState.address, walletState.isConnected], () => {
  loadData();
});

onMounted(() => {
  loadData();
  refreshTimer = window.setInterval(loadData, 15000);
});

onBeforeUnmount(() => {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }
});
</script>

<style scoped>
.page-shell {
  padding: 10px 16px 100px;
  position: relative;
  background-color: #050302;
  overflow-x: hidden;
  min-height: 100vh;
}

.page-bg-glow {
  position: absolute;
  top: -170px;
  left: 50%;
  transform: translateX(-50%);
  width: min(720px, 100vw);
  height: 440px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 74, 28, 0.15) 0%, rgba(255, 74, 28, 0) 70%);
  filter: blur(6px);
  pointer-events: none;
}

.page-header {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 10px auto 20px;
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

.cards-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 520px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.content-panel {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 69, 0, 0.2);
  background: rgba(21, 11, 6, 0.35);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}

.panel-decor {
  height: 3px;
  margin: -16px -16px 16px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 69, 0, 0.55) 50%, transparent 100%);
}

.panel-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffd2a4;
  margin: 0 0 16px 0;
  text-align: center;
}

.data-panel {
  padding: 12px;
}

.data-panel .panel-decor {
  margin: -12px -12px 12px;
}

.data-panel .panel-title {
  margin-bottom: 12px;
  font-size: 1.02rem;
}

.s6-title {
  color: #ffb38d;
  text-shadow: 0 0 10px rgba(255, 69, 0, 0.3);
}

.s7-title {
  color: #ffd2a4;
  text-shadow: 0 0 10px rgba(255, 140, 0, 0.3);
}

.panel-desc {
  font-size: 0.8rem;
  color: #bba392;
  margin-bottom: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  text-align: left;
}

.input-card {
  border: 1px solid rgba(255, 99, 50, 0.24);
  border-radius: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.24);
}

.invested-card {
  border: 1px solid rgba(255, 99, 50, 0.24);
  border-radius: 12px;
  padding: 18px 14px;
  background: rgba(0, 0, 0, 0.24);
  text-align: center;
}

.invested-text {
  margin: 0;
  color: #ffcda5;
  font-size: 0.96rem;
  font-weight: 600;
}

.input-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.field-label {
  color: #d7c0b0;
  font-size: 0.85rem;
}

.field-range {
  color: #a08c7f;
  font-size: 0.75rem;
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
  width: 34px;
  height: 34px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 10px;
  border: 1px solid rgba(255, 130, 60, 0.5);
}

.token-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.token-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  /* font-size: 1.5rem; */
  font-weight: 700;
  width: 100%;
  height: 54px;
  line-height: 54px;
  padding: 0;
  margin: 0;
}

.token-input::placeholder {
  color: rgba(215, 192, 176, 0.52);
  font-size: 0.88rem;
  font-weight: 500;
}

.token-input:disabled {
  color: #888;
}

.details-block {
  margin-top: 12px;
  border-top: 1px dashed rgba(255, 129, 68, 0.2);
  padding-top: 8px;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #dec5b1;
}

.summary-row + .summary-row {
  margin-top: 8px;
}

.hint-line {
  margin: 12px 2px 0;
  color: #bba392;
  font-size: 0.78rem;
  text-align: center;
}

.hint-line.warning {
  color: #ffb38d;
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}

.data-item {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 99, 50, 0.15);
  border-radius: 9px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.data-label {
  color: #bba392;
  font-size: 0.7rem;
  margin-bottom: 4px;
}

.data-value {
  color: #fff;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.15;
}

.data-subvalue {
  margin-top: 2px;
  color: #bba392;
  font-size: 0.7rem;
  line-height: 1.1;
}

.highlight {
  color: #ffcda5;
  text-shadow: 0 0 8px rgba(255, 69, 0, 0.4);
}

.highlight-text {
  color: #ffcda5;
  font-weight: 600;
}

.text-success {
  color: #a6f3be;
}

.text-warning {
  color: #ffb38d;
}

.quota-section {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 99, 50, 0.15);
  border-radius: 9px;
  padding: 10px 12px;
}

.quota-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.quota-title {
  color: #dec5b1;
  font-size: 0.8rem;
  font-weight: 600;
}

.quota-value {
  font-size: 0.8rem;
  color: #ffcda5;
  text-align: right;
}

.quota-progress-track {
  margin-top: 8px;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
}

.quota-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ff6a00, #ffb347);
  transition: width 0.25s ease;
}

.quota-action-btn {
  margin-top: 8px;
  min-height: 38px;
  font-size: 0.88rem;
}

.dividend-status-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.dividend-status-row.single-col {
  grid-template-columns: 1fr;
}

.status-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 99, 50, 0.15);
  background: rgba(0, 0, 0, 0.2);
}

.status-label {
  color: #d7c0b0;
  font-size: 0.82rem;
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
  letter-spacing: 0.02em;
}

.status-badge.is-locked {
  color: #d7c0b0;
  background: rgba(187, 163, 146, 0.16);
}

.status-badge.is-warning {
  color: #ffcfab;
  background: rgba(255, 140, 0, 0.18);
}

.status-badge.is-success {
  color: #a6f3be;
  background: rgba(86, 196, 123, 0.18);
}

.status-badge.is-ready {
  color: #ffcda5;
  background: rgba(255, 69, 0, 0.16);
}

.dividend-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stat-box {
  flex: 1;
  background: rgba(255, 69, 0, 0.05);
  border: 1px solid rgba(255, 69, 0, 0.2);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
}

.stat-label {
  color: #d7c0b0;
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.stat-value {
  color: #fff;
  font-size: 1.2rem;
  font-weight: 700;
}

.confirm-btn {
  width: 100%;
  margin-top: 12px;
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
}

.confirm-btn:hover:not(:disabled) {
  border-color: #ff4500;
  background: rgba(255, 69, 0, 0.28);
  color: #fff;
}

.confirm-btn.primary {
  background: linear-gradient(135deg, rgba(255, 69, 0, 0.8), rgba(255, 140, 0, 0.8));
  color: #fff;
  border: none;
}

.confirm-btn.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #ff4500, #ff8c00);
  box-shadow: 0 0 15px rgba(255, 69, 0, 0.4);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
