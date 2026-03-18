<template>
  <section class="shareholder-card" :class="{ 'is-visible': isVisible }">
    <div class="card-decor"></div>

    <div class="card-header">
      <h2 class="card-title">{{ t('shareholder.title') }}</h2>
      <p class="card-desc">{{ t('shareholder.desc') }}</p>
    </div>

    <div class="mini-dashboard">
      <div class="stat-row">
        <div class="stat-item">
          <span class="stat-label">{{ t('shareholder.shareAmount') }}</span>
          <span class="stat-value">{{ userSharesText }}<span class="unit">{{ t('shareholder.shareUnit') }}</span></span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-label">{{ t('shareholder.claimableRewards') }}</span>
          <span class="stat-value highlight">{{ pendingRewardsText }}<span class="unit">USDT</span></span>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="action-btn primary" :disabled="buyActionDisabled" @click="handleBuyAction">
        {{ buyButtonText }}
      </button>
      <button class="action-btn secondary" :disabled="claimActionDisabled" @click="handleClaim">
        {{ claimButtonText }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { ethers } from 'ethers';
import { walletState } from '@/services/wallet';
import { getContractAddress } from '@/services/contracts';
import { showToast } from '@/services/notification';
import { t } from '@/i18n/index.js';
import erc20Abi from '@/abis/erc20.json';
import stakingAbi from '@/abis/staking.json';
import profitPoolAbi from '@/abis/profitPool.json';

const DEFAULT_DECIMALS = 18;
const SHARE_AMOUNT = '500';

const usdtDecimals = ref(DEFAULT_DECIMALS);
const usdtBalanceRaw = ref(0n);
const allowanceRaw = ref(0n);
const userSharesRaw = ref(0n);
const pendingRewardsRaw = ref(0n);
const isQualified = ref(false);
const loadingData = ref(false);
const approving = ref(false);
const buying = ref(false);
const claiming = ref(false);
const isVisible = ref(false);

const usdtAddress = computed(() => getContractAddress('USDT'));
const stakingAddress = computed(() => getContractAddress('Staking'));
const profitPoolAddress = computed(() => getContractAddress('ProfitPool'));

const hasWalletReady = computed(() => walletState.isConnected && Boolean(walletState.address));
const isContractsConfigured = computed(() => {
  return ethers.isAddress(usdtAddress.value || '')
    && ethers.isAddress(stakingAddress.value || '')
    && ethers.isAddress(profitPoolAddress.value || '');
});

const shareAmountRaw = computed(() => ethers.parseUnits(SHARE_AMOUNT, usdtDecimals.value));
const userSharesText = computed(() => formatIntegerUnits(userSharesRaw.value, 18));
const pendingRewardsText = computed(() => formatAmount(pendingRewardsRaw.value, usdtDecimals.value, 4));
const hasPendingRewards = computed(() => pendingRewardsRaw.value > 0n);
const hasEnoughBalance = computed(() => usdtBalanceRaw.value >= shareAmountRaw.value);
const needsApproval = computed(() => allowanceRaw.value < shareAmountRaw.value);

const buyButtonText = computed(() => {
  if (loadingData.value) return t('shareholder.btn.loading');
  if (approving.value) return t('shareholder.btn.approving');
  if (buying.value) return t('shareholder.btn.buying');
  if (!hasWalletReady.value) return t('shareholder.btn.connectWallet');
  if (!isContractsConfigured.value) return t('shareholder.btn.contractNotConfigured');
  if (!hasEnoughBalance.value) return t('shareholder.btn.insufficientBalance');
  if (needsApproval.value) return t('shareholder.btn.approve');
  return t('shareholder.btn.buy');
});

const claimButtonText = computed(() => {
  if (loadingData.value) return t('shareholder.btn.loading');
  if (claiming.value) return t('shareholder.btn.claiming');
  if (!hasWalletReady.value) return t('shareholder.btn.connectWallet');
  if (!isContractsConfigured.value) return t('shareholder.btn.contractNotConfigured');
  if (!hasPendingRewards.value) return t('shareholder.btn.noPendingRewards');
  return t('shareholder.btn.claim');
});

const buyActionDisabled = computed(() => {
  return loadingData.value || approving.value || buying.value || !isContractsConfigured.value;
});

const claimActionDisabled = computed(() => {
  return loadingData.value
    || claiming.value
    || !isContractsConfigured.value
    || !hasWalletReady.value
    || !hasPendingRewards.value;
});

function formatAmount(amountRaw, decimals, precision = 4) {
  const formatted = ethers.formatUnits(amountRaw, decimals);
  const num = Number(formatted);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
  });
}

function formatIntegerUnits(amountRaw, decimals) {
  const formatted = ethers.formatUnits(amountRaw, decimals);
  const [integerPart = '0'] = formatted.split('.');
  const num = Number(integerPart);
  if (!Number.isFinite(num)) return integerPart || '0';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
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

function resetCardData() {
  usdtDecimals.value = DEFAULT_DECIMALS;
  usdtBalanceRaw.value = 0n;
  allowanceRaw.value = 0n;
  userSharesRaw.value = 0n;
  pendingRewardsRaw.value = 0n;
  isQualified.value = false;
}

async function refreshCardData() {
  if (!hasWalletReady.value || !isContractsConfigured.value) {
    resetCardData();
    return;
  }

  loadingData.value = true;
  try {
    const provider = getReadProvider();
    if (!provider) return;

    const userAddress = walletState.address;
    const usdt = new ethers.Contract(usdtAddress.value, erc20Abi, provider);
    const staking = new ethers.Contract(stakingAddress.value, stakingAbi, provider);
    const profitPool = new ethers.Contract(profitPoolAddress.value, profitPoolAbi, provider);

    const [decimalsRaw, balanceRaw, allowance, sharesRaw, rewardsRaw, qualified] = await Promise.all([
      usdt.decimals().catch(() => DEFAULT_DECIMALS),
      usdt.balanceOf(userAddress).catch(() => 0n),
      usdt.allowance(userAddress, profitPoolAddress.value).catch(() => 0n),
      profitPool.userStakes(userAddress).catch(() => 0n),
      profitPool.getTokenRewards(userAddress, usdtAddress.value).catch(() => 0n),
      staking.isPreacher(userAddress).catch(() => false)
    ]);

    usdtDecimals.value = Number(decimalsRaw);
    usdtBalanceRaw.value = balanceRaw;
    allowanceRaw.value = allowance;
    userSharesRaw.value = sharesRaw;
    pendingRewardsRaw.value = rewardsRaw;
    isQualified.value = qualified;
    console.log('成为股东待领取分红:', ethers.formatUnits(rewardsRaw, Number(decimalsRaw)), 'USDT');
  } catch (error) {
    console.error('Failed to fetch shareholder data:', error);
    resetCardData();
  } finally {
    loadingData.value = false;
  }
}

async function handleApprove() {
  const signer = await getWriteSigner();
  if (!signer) {
    showToast(t('toast.shareholder.connectWallet'), 'warning');
    return;
  }

  approving.value = true;
  try {
    const usdt = new ethers.Contract(usdtAddress.value, erc20Abi, signer);
    const tx = await usdt.approve(profitPoolAddress.value, ethers.MaxUint256);
    showToast(t('toast.shareholder.approveSubmitted'), 'success');
    await tx.wait();
    showToast(t('toast.shareholder.approveSuccess'), 'success');
    await refreshCardData();
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast(t('toast.shareholder.approveCancelled'), 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast(t('toast.shareholder.approveFailed'), 'error');
    }
  } finally {
    approving.value = false;
  }
}

async function handleBuy() {
  const signer = await getWriteSigner();
  if (!signer) {
    showToast(t('toast.shareholder.connectWallet'), 'warning');
    return;
  }

  buying.value = true;
  try {
    const profitPool = new ethers.Contract(profitPoolAddress.value, profitPoolAbi, signer);
    const tx = await profitPool.stake();
    showToast(t('toast.shareholder.buySubmitted'), 'success');
    await tx.wait();
    showToast(t('toast.shareholder.buySuccess'), 'success');
    await refreshCardData();
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast(t('toast.shareholder.buyCancelled'), 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast(t('toast.shareholder.buyFailed'), 'error');
    }
  } finally {
    buying.value = false;
  }
}

async function handleBuyAction() {
  if (!hasWalletReady.value) {
    showToast(t('toast.shareholder.connectWallet'), 'warning');
    return;
  }
  if (!isContractsConfigured.value) {
    showToast(t('toast.shareholder.contractNotConfigured'), 'error');
    return;
  }
  if (!hasEnoughBalance.value) {
    showToast(t('toast.shareholder.insufficientBalance'), 'warning');
    return;
  }

  if (needsApproval.value) {
    await handleApprove();
    return;
  }

  await handleBuy();
}

async function handleClaim() {
  if (!hasWalletReady.value) {
    showToast(t('toast.shareholder.connectWallet'), 'warning');
    return;
  }
  if (!isContractsConfigured.value) {
    showToast(t('toast.shareholder.contractNotConfigured'), 'error');
    return;
  }
  if (!hasPendingRewards.value) {
    return;
  }
  if (!isQualified.value) {
    showToast(t('toast.shareholder.claimRequirementHint'), 'warning');
    return;
  }

  const signer = await getWriteSigner();
  if (!signer) {
    showToast(t('toast.shareholder.connectWallet'), 'warning');
    return;
  }

  claiming.value = true;
  try {
    const provider = getReadProvider();
    if (provider) {
      const staking = new ethers.Contract(stakingAddress.value, stakingAbi, provider);
      const qualified = await staking.isPreacher(walletState.address);
      if (!qualified) {
        isQualified.value = false;
        showToast(t('toast.shareholder.claimRequirementHint'), 'warning');
        return;
      }
    }

    const profitPool = new ethers.Contract(profitPoolAddress.value, profitPoolAbi, signer);
    const tx = await profitPool.harvest(usdtAddress.value);
    showToast(t('toast.shareholder.claimSubmitted'), 'success');
    await tx.wait();
    showToast(t('toast.shareholder.claimSuccess'), 'success');
    await refreshCardData();
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast(t('toast.shareholder.claimCancelled'), 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast(t('toast.shareholder.claimFailed'), 'error');
    }
  } finally {
    claiming.value = false;
  }
}

watch(
  () => [walletState.isConnected, walletState.address],
  async () => {
    await refreshCardData();
  }
);

onMounted(async () => {
  setTimeout(() => {
    isVisible.value = true;
  }, 200);

  await refreshCardData();
});
</script>

<style scoped>
.shareholder-card {
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  border: 1px solid rgba(255, 133, 72, 0.26);
  background:
    linear-gradient(180deg, rgba(36, 18, 8, 0.62) 0%, rgba(18, 9, 4, 0.48) 100%);
  box-shadow: 0 16px 48px rgba(255, 102, 32, 0.14);
  backdrop-filter: blur(10px);
  padding: 16px;
  color: #fff;
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  position: relative;
  opacity: 0;
  transform: translateY(-36px) scale(0.96);
}

.shareholder-card.is-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.shareholder-card.is-visible:hover {
  border-color: rgba(255, 133, 72, 0.48);
  box-shadow: 0 18px 56px rgba(255, 102, 32, 0.2);
  transform: translateY(-2px) scale(1);
}

.card-decor {
  height: 4px;
  margin: -16px -16px 14px;
  background: linear-gradient(90deg, rgba(255, 115, 52, 0.08) 0%, rgba(255, 187, 122, 0.88) 50%, rgba(255, 115, 52, 0.08) 100%);
}

.card-header {
  margin-bottom: 16px;
  text-align: center;
}

.card-title {
  margin: 0 0 6px;
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff5ea;
  letter-spacing: 1px;
  text-shadow: 0 0 14px rgba(255, 143, 82, 0.35);
}

.card-desc {
  margin: 0;
  color: rgba(232, 206, 184, 0.8);
  font-size: 0.75rem;
  line-height: 1.5;
}

.mini-dashboard {
  background: linear-gradient(180deg, rgba(24, 12, 6, 0.72) 0%, rgba(12, 6, 3, 0.46) 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 166, 102, 0.12);
  padding: 12px 14px;
  margin-bottom: 16px;
  box-shadow: inset 0 2px 12px rgba(0, 0, 0, 0.22);
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
}

.stat-item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.65rem;
  color: #bea08c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 0.98rem;
  font-weight: 700;
  color: #fff;
  font-family: 'Courier New', Courier, monospace;
}

.stat-value.highlight {
  color: #ffb26d;
  text-shadow: 0 0 10px rgba(255, 157, 86, 0.28);
}

.unit {
  margin-left: 4px;
  font-size: 0.62rem;
  color: #937968;
  font-family: system-ui, -apple-system, sans-serif;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.08);
}

.actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.action-btn {
  width: 100%;
  min-height: 48px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn.primary {
  border: none;
  background: linear-gradient(90deg, #ff5a1f 0%, #ff8a4f 100%);
  color: #fff;
  box-shadow: 0 8px 24px rgba(255, 90, 31, 0.26);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.05);
  color: #e8d0c0;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.action-btn.primary:hover:not(:disabled) {
  box-shadow: 0 10px 28px rgba(255, 90, 31, 0.34);
}

.action-btn.secondary:hover:not(:disabled) {
  border-color: rgba(255, 185, 132, 0.24);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.action-btn:disabled {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: none;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .shareholder-card {
    padding: 16px;
  }

  .card-decor {
    margin: -16px -16px 14px;
  }

  .actions {
    grid-template-columns: 1fr;
  }
}
</style>
