<template>
  <section class="dividend-card" :class="{ 'is-visible': isVisible }">
    <h2 class="card-title">{{ t('dividend.title') }}</h2>
    <p class="card-desc">{{ t('dividend.desc') }}</p>

    <div class="info-wrap">
      <div class="info-item">
        <span class="info-label">{{ t('dividend.pendingRewards') }}</span>
        <span class="info-value highlight">{{ pendingRewardsText }}</span>
      </div>
    </div>

    <div class="actions">
      <button class="action-btn primary" :disabled="actionDisabled" @click="handleHarvest">
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
import nodeDividendPoolAbi from '@/abis/nodeDividendPool.json';
import erc20Abi from '@/abis/erc20.json';
import stakingAbi from '@/abis/staking.json';

const DEFAULT_DECIMALS = 18;
const pendingRewardsRaw = ref(0n);
const usdtDecimals = ref(DEFAULT_DECIMALS);
const loadingData = ref(false);
const harvesting = ref(false);
const isVisible = ref(false);

const usdtAddress = computed(() => getContractAddress('USDT'));
const dividendPoolAddress = computed(() => getContractAddress('NodeDividendPool'));
const stakingAddress = computed(() => getContractAddress('Staking'));

const isContractsConfigured = computed(() => {
  return ethers.isAddress(usdtAddress.value || '')
    && ethers.isAddress(dividendPoolAddress.value || '')
    && ethers.isAddress(stakingAddress.value || '');
});

const hasWalletReady = computed(() => {
  return walletState.isConnected && Boolean(walletState.address);
});

const pendingRewardsText = computed(() => formatAmount(pendingRewardsRaw.value, usdtDecimals.value));

const hasPendingRewards = computed(() => pendingRewardsRaw.value > 0n);

const primaryButtonText = computed(() => {
  if (loadingData.value) return t('dividend.btn.loading');
  if (harvesting.value) return t('dividend.btn.harvesting');
  if (!hasWalletReady.value) return t('dividend.btn.connectWallet');
  if (!isContractsConfigured.value) return t('dividend.btn.contractNotConfigured');
  if (!hasPendingRewards.value) return t('dividend.btn.noPendingRewards');
  return t('dividend.btn.harvest');
});

const actionDisabled = computed(() => {
  return harvesting.value || loadingData.value || !isContractsConfigured.value || !hasPendingRewards.value || !hasWalletReady.value;
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

async function refreshCardData() {
  if (!hasWalletReady.value || !isContractsConfigured.value) {
    pendingRewardsRaw.value = 0n;
    return;
  }

  loadingData.value = true;
  try {
    const provider = getReadProvider();
    if (!provider) return;

    const usdt = new ethers.Contract(usdtAddress.value, erc20Abi, provider);
    const dividendPool = new ethers.Contract(dividendPoolAddress.value, nodeDividendPoolAbi, provider);
    const userAddress = walletState.address;

    const [decimalsRaw, pendingRaw] = await Promise.all([
      usdt.decimals().catch(() => DEFAULT_DECIMALS),
      dividendPool.getTokenRewards(userAddress, usdtAddress.value)
    ]);

    usdtDecimals.value = Number(decimalsRaw);
    pendingRewardsRaw.value = pendingRaw;
  } catch (error) {
    console.error('Failed to fetch dividend data:', error);
    pendingRewardsRaw.value = 0n;
  } finally {
    loadingData.value = false;
  }
}

async function handleHarvest() {
  if (actionDisabled.value) return;

  const signer = await getWriteSigner();
  if (!signer) {
    showToast(t('toast.dividend.connectWallet'), 'warning');
    return;
  }

  harvesting.value = true;
  try {
    const userAddress = walletState.address;
    
    // Check if user is a valid preacher
    const provider = getReadProvider();
    if (provider) {
      const stakingContract = new ethers.Contract(stakingAddress.value, stakingAbi, provider);
      const isPreacher = await stakingContract.isPreacher(userAddress);
      if (!isPreacher) {
        showToast(t('toast.dividend.notEligible'), 'warning');
        harvesting.value = false;
        return;
      }
    }

    const dividendPool = new ethers.Contract(dividendPoolAddress.value, nodeDividendPoolAbi, signer);
    
    console.log('[Contract Call] dividendPool.harvest() params:', {
      token: usdtAddress.value
    });
    const tx = await dividendPool.harvest(usdtAddress.value);
    showToast(t('toast.dividend.harvestSubmitted'), 'success');
    await tx.wait();
    showToast(t('toast.dividend.harvestSuccess'), 'success');
    
    await refreshCardData();
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast(t('toast.dividend.harvestCancelled'), 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast(t('toast.dividend.harvestFailed'), 'error');
    }
  } finally {
    harvesting.value = false;
  }
}

watch(
  () => [walletState.isConnected, walletState.address],
  async () => {
    await refreshCardData();
  }
);

onMounted(async () => {
  // 延迟触发入场动画，比质押卡片晚一点，形成错落感
  setTimeout(() => {
    isVisible.value = true;
  }, 300);

  await refreshCardData();
});
</script>

<style scoped>
.dividend-card {
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.03);
  background: rgba(10, 10, 10, 0.2);
  backdrop-filter: blur(4px);
  padding: 12px 14px;
  color: #fff;
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, background-color 0.3s ease;
  overflow: hidden;
  
  /* 初始状态：向上偏移且透明 */
  opacity: 0;
  transform: translateY(-30px) scale(0.96);
}

.dividend-card.is-visible {
  /* 最终状态：回到原位且完全不透明 */
  opacity: 1;
  transform: translateY(0) scale(1);
}

.dividend-card.is-visible:hover {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(15, 15, 15, 0.3);
}

.card-title {
  margin: 0;
  font-size: 1rem;
  color: #bfa897;
  text-align: center;
}

.card-desc {
  margin: 6px 0 0;
  color: #8f7c70;
  font-size: 0.8rem;
  line-height: 1.4;
  text-align: center;
}

.info-wrap {
  margin-top: 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-item:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-label {
  font-size: 0.9rem;
  color: #d7c0b0;
}

.info-value {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
}

.info-value.highlight {
  color: #ff823c;
  font-size: 1.1rem;
}

.actions {
  margin-top: 16px;
  display: block;
}

.action-btn {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  min-height: 40px;
  background: rgba(255, 255, 255, 0.05);
  color: #bfa897;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn.primary {
  background: rgba(255, 255, 255, 0.08);
  color: #d7c0b0;
}

.action-btn:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .dividend-card {
    padding: 12px;
  }
}
</style>
