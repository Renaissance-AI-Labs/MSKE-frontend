<template>
  <section class="staking-card" :class="{ 'is-visible': isVisible }">
    <div class="card-decor"></div>
    
    <div class="card-header">
      <h2 class="card-title">{{ t('staking.title') }}</h2>
      <p class="card-desc">{{ t('staking.desc') }}</p>
    </div>
    
    <!-- 数据看板 (极简数据条) -->
    <div class="mini-dashboard" :class="{ 'compact-dashboard': !SHOW_STAKING_ADVANCED_STATS }">
      <template v-if="SHOW_STAKING_ADVANCED_STATS">
        <div class="stat-row">
          <div class="stat-item">
            <span class="stat-label">{{ t('staking.mskePrice') }}</span>
            <span class="stat-value">{{ tokenPrice }}<span class="unit">U</span></span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-label">{{ t('staking.poolDepth') }}</span>
            <span class="stat-value">{{ reserveU }}<span class="unit">U</span></span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-label">{{ t('staking.dumpTaxRate') }}</span>
            <span class="stat-value highlight">{{ dumpTaxRate }}</span>
          </div>
        </div>
        <div class="stat-row secondary-row">
          <div class="stat-item">
            <span class="stat-label">{{ t('staking.totalStaking') }}</span>
            <span class="stat-value">{{ totalStaking }}<span class="unit">U</span></span>
          </div>
          <div class="stat-divider hidden"></div>
          <div class="stat-item hidden-item">
            <!-- Placeholder to maintain grid alignment -->
          </div>
          <div class="stat-divider hidden"></div>
          <div class="stat-item">
            <span class="stat-label">{{ t('staking.totalBurned') }}</span>
            <span class="stat-value">{{ totalBurned }}<span class="unit">MSKE</span></span>
          </div>
        </div>
      </template>
      <div v-else class="stat-row compact-row">
        <div class="stat-item">
          <span class="stat-label">{{ t('staking.mskePrice') }}</span>
          <span class="stat-value">{{ tokenPrice }}<span class="unit">U</span></span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-label">{{ t('staking.totalBurned') }}</span>
          <span class="stat-value">{{ totalBurned }}<span class="unit">MSKE</span></span>
        </div>
      </div>
    </div>

    <div class="input-wrap">
      <div class="input-header">
        <label class="input-label">{{ t('staking.stakeUsdt') }}</label>
        <span class="balance-hint">{{ t('staking.balance', { amount: usdtBalanceText }) }}</span>
      </div>
      <div class="input-box">
        <input
          v-model="stakeAmount"
          class="amount-input"
          type="text"
          inputmode="decimal"
          :placeholder="amountPlaceholder"
          :disabled="isQuotaExhausted"
          @input="onAmountInput"
        />
        <div class="input-suffix">USDT</div>
      </div>
    </div>

    <div class="actions">
      <button class="action-btn primary" :disabled="actionDisabled" @click="handlePrimaryAction">
        {{ primaryButtonText }}
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
import { SHOW_STAKING_ADVANCED_STATS } from '@/services/environment';
import erc20Abi from '@/abis/erc20.json';
import stakingAbi from '@/abis/staking.json';
import referralAbi from '@/abis/referral.json';
import mskeAbi from '@/abis/mske.json';

const DEFAULT_MIN_STAKE = 200;
const DEFAULT_DECIMALS = 18;
const stakeAmount = ref('');
const usdtBalanceRaw = ref(0n);
const minStakeRaw = ref(ethers.parseUnits(String(DEFAULT_MIN_STAKE), DEFAULT_DECIMALS));
const maxStakeRaw = ref(0n);
const allowanceRaw = ref(0n);
const hasReferrer = ref(false);
const usdtDecimals = ref(DEFAULT_DECIMALS);
const loadingData = ref(false);
const checkingAllowance = ref(false);
const approving = ref(false);
const staking = ref(false);
const isVisible = ref(false);

// Dashboard data
const tokenPrice = ref('0.0000');
const reserveU = ref('0.00');
const dumpTaxRate = ref('0%');
const totalStaking = ref('0.00');
const totalBurned = ref('0.00');
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

const usdtAddress = computed(() => getContractAddress('USDT'));
const stakingAddress = computed(() => getContractAddress('Staking'));
const referralAddress = computed(() => getContractAddress('Referral'));
const mskeAddress = computed(() => getContractAddress('MSKE'));

const isContractsConfigured = computed(() => {
  return ethers.isAddress(usdtAddress.value || '')
    && ethers.isAddress(stakingAddress.value || '')
    && ethers.isAddress(referralAddress.value || '');
});

const hasWalletReady = computed(() => {
  return walletState.isConnected && Boolean(walletState.address);
});

const isActionReady = computed(() => {
  return hasWalletReady.value && isContractsConfigured.value && hasReferrer.value;
});

const parsedStakeAmount = computed(() => {
  if (!stakeAmount.value) return null;
  try {
    return ethers.parseUnits(stakeAmount.value, usdtDecimals.value);
  } catch (error) {
    return null;
  }
});

const usdtBalanceText = computed(() => formatAmount(usdtBalanceRaw.value, usdtDecimals.value));
const minStakeText = computed(() => formatAmount(minStakeRaw.value, usdtDecimals.value));
const maxStakeText = computed(() => maxStakeRaw.value > 0n ? formatAmount(maxStakeRaw.value, usdtDecimals.value) : '∞');
const isQuotaExhausted = computed(() => {
  if (maxStakeRaw.value === 0n) return true;
  const threshold = ethers.parseUnits("200", usdtDecimals.value);
  return maxStakeRaw.value <= threshold;
});
const amountPlaceholder = computed(() => {
  if (isQuotaExhausted.value) return t('staking.noQuota');
  return t('staking.stakePlaceholder', { min: minStakeText.value, max: maxStakeText.value });
});
const hasValidAmount = computed(() => Boolean(parsedStakeAmount.value && parsedStakeAmount.value > 0n));
const needsApproval = computed(() => {
  if (!hasValidAmount.value) return false;
  return allowanceRaw.value < parsedStakeAmount.value;
});

const primaryButtonText = computed(() => {
  if (loadingData.value || checkingAllowance.value) return t('staking.btn.loading');
  if (approving.value) return t('staking.btn.approving');
  if (staking.value) return t('staking.btn.staking');
  if (!hasWalletReady.value) return t('staking.btn.connectWallet');
  if (!isContractsConfigured.value) return t('staking.btn.contractNotConfigured');
  if (!hasReferrer.value) return t('staking.btn.bindReferrerFirst');
  if (isQuotaExhausted.value) return t('staking.noQuota');
  if (!stakeAmount.value) return t('staking.btn.stake');
  if (!hasValidAmount.value) return t('staking.btn.enterValidAmount');
  if (parsedStakeAmount.value > usdtBalanceRaw.value) return t('staking.btn.insufficientBalance');
  if (needsApproval.value) return t('staking.btn.approve');
  return t('staking.btn.stake');
});

const actionDisabled = computed(() => {
  return approving.value || staking.value || loadingData.value || checkingAllowance.value || !isContractsConfigured.value || isQuotaExhausted.value;
});

function sanitizeDecimalInput(value) {
  const cleaned = String(value || '').replace(/[^\d.]/g, '');
  const firstDotIndex = cleaned.indexOf('.');
  if (firstDotIndex === -1) return cleaned;
  const integerPart = cleaned.slice(0, firstDotIndex + 1);
  const decimalPart = cleaned.slice(firstDotIndex + 1).replace(/\./g, '');
  return `${integerPart}${decimalPart.slice(0, 6)}`;
}

function onAmountInput(event) {
  stakeAmount.value = sanitizeDecimalInput(event.target.value);
}

function formatAmount(amountRaw, decimals, precision = 4, exact = false) {
  const formatted = ethers.formatUnits(amountRaw, decimals);
  const num = Number(formatted);
  if (!Number.isFinite(num)) return '0';
  
  if (exact) {
    // Keep exact precision without rounding up/down
    const str = formatted.toString();
    const parts = str.split('.');
    if (parts.length === 1) {
      return parts[0] + '.' + '0'.repeat(precision);
    }
    const decimalPart = parts[1].padEnd(precision, '0').slice(0, precision);
    return `${parts[0]}.${decimalPart}`;
  }
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
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

async function fetchDashboardData() {
  const provider = getReadProvider();
  if (!provider) return;

  if (!ethers.isAddress(mskeAddress.value) || !ethers.isAddress(stakingAddress.value)) {
    return;
  }

  try {
    const mskeContract = new ethers.Contract(mskeAddress.value, mskeAbi, provider);
    const stakingContract = new ethers.Contract(stakingAddress.value, stakingAbi, provider);

    const [
      priceRaw,
      reserveURaw,
      changeData,
      taxRatioRaw,
      burnedRaw,
      totalStakingRaw,
      mskeDecimals,
      maxStakeAmountRaw
    ] = await Promise.all([
      mskeContract.getTokenPriceUsdt().catch(() => 0n),
      mskeContract.getReserveU().catch(() => 0n),
      mskeContract.percentChangeFrom24hLowest().catch(() => [0n, 0n]),
      mskeContract.dumpTaxRatio().catch(() => 5n),
      mskeContract.balanceOf(DEAD_ADDRESS).catch(() => 0n),
      stakingContract.totalSupply().catch(() => 0n),
      mskeContract.decimals().catch(() => 18n),
      stakingContract.maxStakeAmount().catch(() => 0n)
    ]);

    tokenPrice.value = formatAmount(priceRaw, 18, 6, true);
    reserveU.value = formatAmount(reserveURaw, 18, 2, true);
    totalStaking.value = formatAmount(totalStakingRaw, 18, 2, true);
    totalBurned.value = formatAmount(burnedRaw, Number(mskeDecimals), 2, true);

    console.log('[StakingAreaCard] Current Max Stake Amount:', formatAmount(maxStakeAmountRaw, 18, 2, true));

    const [pctScaled, position] = changeData;
    if (position === 0n || position === 0) {
      dumpTaxRate.value = '0%';
    } else {
      let effectivePercent = pctScaled < 100n ? 100n : pctScaled;
      let taxRate = effectivePercent * taxRatioRaw;
      if (taxRate > 8000n) taxRate = 8000n;
      dumpTaxRate.value = `${Number(taxRate) / 100}%`;
    }
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  }
}

async function refreshCardData() {
  if (!hasWalletReady.value || !isContractsConfigured.value) {
    usdtBalanceRaw.value = 0n;
    minStakeRaw.value = ethers.parseUnits(String(DEFAULT_MIN_STAKE), DEFAULT_DECIMALS);
    maxStakeRaw.value = 0n;
    allowanceRaw.value = 0n;
    hasReferrer.value = false;
    return;
  }

  loadingData.value = true;
  try {
    const provider = getReadProvider();
    if (!provider) return;

    const usdt = new ethers.Contract(usdtAddress.value, erc20Abi, provider);
    const stake = new ethers.Contract(stakingAddress.value, stakingAbi, provider);
    const referral = new ethers.Contract(referralAddress.value, referralAbi, provider);

    const [decimalsRaw, balanceRaw, minStakeAmountRaw, maxStakeAmountRaw, referrerAddress, starLevel] = await Promise.all([
      usdt.decimals(),
      usdt.balanceOf(walletState.address),
      stake.minStakeAmount(),
      stake.maxStakeAmount(),
      referral.getReferral(walletState.address),
      stake.userStarLevel(walletState.address)
    ]);
    
    console.log('[StakingAreaCard] User Data:', {
      address: walletState.address,
      maxStakeAmount: ethers.formatUnits(maxStakeAmountRaw, Number(decimalsRaw)),
      starLevel: Number(starLevel),
      referrer: referrerAddress,
      hasReferrer: Boolean(referrerAddress && referrerAddress !== ethers.ZeroAddress)
    });

    usdtDecimals.value = Number(decimalsRaw);
    usdtBalanceRaw.value = balanceRaw;
    minStakeRaw.value = minStakeAmountRaw > 0n
      ? minStakeAmountRaw
      : ethers.parseUnits(String(DEFAULT_MIN_STAKE), usdtDecimals.value);
    maxStakeRaw.value = maxStakeAmountRaw > 0n ? maxStakeAmountRaw : 0n;
    hasReferrer.value = Boolean(referrerAddress && referrerAddress !== ethers.ZeroAddress);
    allowanceRaw.value = await usdt.allowance(walletState.address, stakingAddress.value);
  } catch (error) {
    usdtBalanceRaw.value = 0n;
    minStakeRaw.value = ethers.parseUnits(String(DEFAULT_MIN_STAKE), usdtDecimals.value);
    maxStakeRaw.value = 0n;
    allowanceRaw.value = 0n;
    hasReferrer.value = false;
  } finally {
    loadingData.value = false;
  }
}

async function refreshAllowance() {
  if (!hasWalletReady.value || !isContractsConfigured.value) {
    allowanceRaw.value = 0n;
    return;
  }
  checkingAllowance.value = true;
  try {
    const provider = getReadProvider();
    if (!provider) return;
    const usdt = new ethers.Contract(usdtAddress.value, erc20Abi, provider);
    allowanceRaw.value = await usdt.allowance(walletState.address, stakingAddress.value);
  } catch (error) {
    allowanceRaw.value = 0n;
  } finally {
    checkingAllowance.value = false;
  }
}

async function handleApprove() {
  if (!isActionReady.value || !hasValidAmount.value) return;
  if (!parsedStakeAmount.value || parsedStakeAmount.value <= 0n) return;

  const signer = await getWriteSigner();
  if (!signer) {
    showToast(t('toast.staking.connectWallet'), 'warning');
    return;
  }

  approving.value = true;
  try {
    const usdt = new ethers.Contract(usdtAddress.value, erc20Abi, signer);
    const tx = await usdt.approve(stakingAddress.value, ethers.MaxUint256);
    showToast(t('toast.staking.approveSubmitted'), 'success');
    await tx.wait();
    await refreshAllowance();
    showToast(t('toast.staking.approveSuccess'), 'success');
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast(t('toast.staking.approveCancelled'), 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast(t('toast.staking.approveFailed'), 'error');
    }
  } finally {
    approving.value = false;
  }
}

async function handleStake() {
  if (!isActionReady.value) return;
  if (!parsedStakeAmount.value || parsedStakeAmount.value <= 0n) return;

  const signer = await getWriteSigner();
  if (!signer) {
    showToast(t('toast.staking.connectWallet'), 'warning');
    return;
  }

  staking.value = true;
  try {
    const usdt = new ethers.Contract(usdtAddress.value, erc20Abi, signer);
    const stakeContract = new ethers.Contract(stakingAddress.value, stakingAbi, signer);
    const userAddress = walletState.address;
    const allowance = await usdt.allowance(userAddress, stakingAddress.value);

    if (allowance < parsedStakeAmount.value) {
      showToast(t('toast.staking.insufficientAllowance'), 'warning');
      return;
    }

    console.log('[Contract Call] stake() params:', {
      amount: parsedStakeAmount.value.toString(),
      amountOutMin: '0'
    });
    const tx = await stakeContract.stake(parsedStakeAmount.value, 0n);
    showToast(t('toast.staking.stakeSubmitted'), 'success');
    await tx.wait();
    showToast(t('toast.staking.stakeSuccess'), 'success');
    stakeAmount.value = '';
    await refreshCardData();
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast(t('toast.staking.stakeCancelled'), 'warning');
    } else if (
      String(error?.reason || '').toLowerCase().includes('maxstakeamount')
      || String(error?.message || '').toLowerCase().includes('maxstakeamount')
    ) {
      showToast(t('toast.staking.maxStakeLimit'), 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast(t('toast.staking.stakeFailed'), 'error');
    }
  } finally {
    staking.value = false;
  }
}

async function handlePrimaryAction() {
  if (!hasWalletReady.value) {
    showToast(t('toast.staking.connectWallet'), 'warning');
    return;
  }
  if (!isContractsConfigured.value) {
    showToast(t('toast.staking.contractNotConfigured'), 'error');
    return;
  }
  if (!hasReferrer.value) {
    showToast(t('toast.staking.bindReferrerFirst'), 'warning');
    return;
  }
  if (isQuotaExhausted.value) {
    showToast(t('toast.staking.maxStakeLimit'), 'warning');
    return;
  }
  if (!hasValidAmount.value) {
    showToast(t('toast.staking.enterValidAmount'), 'warning');
    return;
  }
  if (parsedStakeAmount.value < minStakeRaw.value) {
    showToast(t('toast.staking.minStakeLimit', { amount: minStakeText.value }), 'warning');
    return;
  }
  if (maxStakeRaw.value > 0n && parsedStakeAmount.value > maxStakeRaw.value) {
    showToast(t('toast.staking.maxStakeLimit'), 'warning');
    return;
  }
  if (parsedStakeAmount.value > usdtBalanceRaw.value) {
    showToast(t('toast.staking.insufficientBalance'), 'warning');
    return;
  }

  if (needsApproval.value) {
    await handleApprove();
    return;
  }

  await handleStake();
}

watch(
  () => [walletState.isConnected, walletState.address],
  async () => {
    await refreshCardData();
    fetchDashboardData();
  }
);

watch(
  () => [walletState.address, parsedStakeAmount.value],
  async () => {
    if (hasWalletReady.value && isContractsConfigured.value) {
      await refreshAllowance();
    }
  }
);

onMounted(async () => {
  // 触发入场动画
  setTimeout(() => {
    isVisible.value = true;
  }, 100);

  await refreshCardData();
  fetchDashboardData();
  setInterval(fetchDashboardData, 30000);
});
</script>

<style scoped>
.staking-card {
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  border: 1px solid rgba(255, 69, 0, 0.4);
  background: rgba(30, 15, 5, 0.5);
  box-shadow: 0 12px 40px rgba(255, 69, 0, 0.15);
  backdrop-filter: blur(12px);
  padding: 16px;
  color: #fff;
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  position: relative;
  
  /* 初始状态：向上偏移且透明 */
  opacity: 0;
  transform: translateY(-40px) scale(0.96);
}

.staking-card.is-visible {
  /* 最终状态：回到原位且完全不透明 */
  opacity: 1;
  transform: translateY(0) scale(1);
}

.staking-card.is-visible:hover {
  border-color: rgba(255, 69, 0, 0.6);
  box-shadow: 0 12px 40px rgba(255, 69, 0, 0.25);
  transform: translateY(-2px) scale(1);
}

.card-decor {
  height: 4px;
  margin: -16px -16px 14px;
  background: linear-gradient(90deg, rgba(255, 69, 0, 0.1) 0%, rgba(255, 69, 0, 0.8) 50%, rgba(255, 69, 0, 0.1) 100%);
}

.card-header {
  margin-bottom: 16px;
  text-align: center;
}

.card-title {
  margin: 0 0 6px 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 69, 0, 0.5);
  letter-spacing: 1px;
}

.card-desc {
  margin: 0;
  color: rgba(208, 185, 168, 0.8);
  font-size: 0.75rem;
  line-height: 1.5;
  font-weight: 400;
}

/* Mini Dashboard Styles - Extremely Compact & Premium */
.mini-dashboard {
  background: linear-gradient(180deg, rgba(20, 10, 5, 0.6) 0%, rgba(10, 5, 2, 0.4) 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 114, 67, 0.12);
  padding: 10px 14px;
  margin-bottom: 20px;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.2);
}

.mini-dashboard.compact-dashboard {
  padding: 12px 14px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-row.compact-row {
  min-height: 48px;
}

.stat-row.secondary-row {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(255, 255, 255, 0.06);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1;
}

.stat-item.hidden-item {
  visibility: hidden;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.08);
}

.stat-divider.hidden {
  visibility: hidden;
}

.stat-label {
  font-size: 0.65rem;
  color: #a89486;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  font-family: 'Courier New', Courier, monospace; /* Monospace for numbers looks premium */
}

.stat-value .unit {
  font-size: 0.6rem;
  color: #8f7c70;
  margin-left: 2px;
  font-family: system-ui, -apple-system, sans-serif;
}

.stat-value.highlight {
  color: #ff5c1f;
  text-shadow: 0 0 8px rgba(255, 92, 31, 0.4);
}

.input-wrap {
  margin-bottom: 20px;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 8px;
}

.input-label {
  font-size: 0.8rem;
  color: #d7c0b0;
  font-weight: 500;
}

.balance-hint {
  color: rgba(222, 197, 177, 0.6);
  font-size: 0.7rem;
}

.input-box {
  position: relative;
  display: flex;
  align-items: center;
}

.amount-input {
  width: 100%;
  height: 48px;
  line-height: 48px;
  border-radius: 12px;
  border: 1px solid rgba(255, 114, 67, 0.25);
  background: rgba(0, 0, 0, 0.4);
  outline: none;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 0 60px 0 16px;
  transition: border-color 0.2s;
}

.amount-input:focus {
  border-color: rgba(255, 114, 67, 0.6);
  box-shadow: 0 0 0 2px rgba(255, 114, 67, 0.1);
}

.amount-input::placeholder {
  color: #6b5a50;
  font-size: 0.9rem;
  font-weight: 400;
}

.input-suffix {
  position: absolute;
  right: 16px;
  color: #ff823c;
  font-size: 0.85rem;
  font-weight: 600;
  pointer-events: none;
}

.actions {
  display: block;
}

.action-btn {
  width: 100%;
  border: none;
  border-radius: 12px;
  height: 50px;
  background: linear-gradient(90deg, #ff4500 0%, #ff7243 100%);
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(255, 69, 0, 0.3);
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(255, 69, 0, 0.4);
  background: linear-gradient(90deg, #ff5c1f 0%, #ff8255 100%);
}

.action-btn:disabled {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.3);
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .staking-card {
    padding: 16px;
  }

  .card-decor {
    margin: -16px -16px 16px;
  }
  
  .stat-value {
    font-size: 0.85rem;
  }
}
</style>
