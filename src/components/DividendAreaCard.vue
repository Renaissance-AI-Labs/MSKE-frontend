<template>
  <section class="dividend-card">
    <div class="card-decor"></div>
    <h2 class="card-title">联创分红</h2>
    <p class="card-desc">满足三星及以上的用户可享受分红池收益。</p>

    <div class="info-wrap">
      <div class="info-item">
        <span class="info-label">待领取收益 (USDT)</span>
        <span class="info-value highlight">{{ pendingRewardsText }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">历史总收益 (USDT)</span>
        <span class="info-value">{{ totalRewardsText }}</span>
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
import nodeDividendPoolAbi from '@/abis/nodeDividendPool.json';
import erc20Abi from '@/abis/erc20.json';

const DEFAULT_DECIMALS = 18;
const pendingRewardsRaw = ref(0n);
const totalRewardsRaw = ref(0n);
const usdtDecimals = ref(DEFAULT_DECIMALS);
const loadingData = ref(false);
const harvesting = ref(false);

const usdtAddress = computed(() => getContractAddress('USDT'));
const dividendPoolAddress = computed(() => getContractAddress('NodeDividendPool'));

const isContractsConfigured = computed(() => {
  return ethers.isAddress(usdtAddress.value || '')
    && ethers.isAddress(dividendPoolAddress.value || '');
});

const hasWalletReady = computed(() => {
  return walletState.isConnected && Boolean(walletState.address);
});

const pendingRewardsText = computed(() => formatAmount(pendingRewardsRaw.value, usdtDecimals.value));
const totalRewardsText = computed(() => formatAmount(totalRewardsRaw.value, usdtDecimals.value));

const hasPendingRewards = computed(() => pendingRewardsRaw.value > 0n);

const primaryButtonText = computed(() => {
  if (loadingData.value) return '数据加载中...';
  if (harvesting.value) return '领取中...';
  if (!hasWalletReady.value) return '请先连接钱包';
  if (!isContractsConfigured.value) return '合约未配置';
  if (!hasPendingRewards.value) return '暂无待领取收益';
  return '领取分红';
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
    totalRewardsRaw.value = 0n;
    return;
  }

  loadingData.value = true;
  try {
    const provider = getReadProvider();
    if (!provider) return;

    const usdt = new ethers.Contract(usdtAddress.value, erc20Abi, provider);
    const dividendPool = new ethers.Contract(dividendPoolAddress.value, nodeDividendPoolAbi, provider);
    const userAddress = walletState.address;

    const [decimalsRaw, pendingRaw, totalRaw] = await Promise.all([
      usdt.decimals().catch(() => DEFAULT_DECIMALS),
      dividendPool.getTokenRewards(userAddress, usdtAddress.value),
      dividendPool.getTokenTotalRewards(userAddress, usdtAddress.value)
    ]);

    usdtDecimals.value = Number(decimalsRaw);
    pendingRewardsRaw.value = pendingRaw;
    totalRewardsRaw.value = totalRaw;
  } catch (error) {
    console.error('Failed to fetch dividend data:', error);
    pendingRewardsRaw.value = 0n;
    totalRewardsRaw.value = 0n;
  } finally {
    loadingData.value = false;
  }
}

async function handleHarvest() {
  if (actionDisabled.value) return;

  const signer = await getWriteSigner();
  if (!signer) {
    showToast('请先连接钱包', 'warning');
    return;
  }

  harvesting.value = true;
  try {
    const dividendPool = new ethers.Contract(dividendPoolAddress.value, nodeDividendPoolAbi, signer);
    
    const tx = await dividendPool.harvest(usdtAddress.value);
    showToast('领取交易已提交', 'success');
    await tx.wait();
    showToast('分红领取成功', 'success');
    
    await refreshCardData();
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast('已取消领取', 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast('领取失败，请稍后重试', 'error');
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
  await refreshCardData();
});
</script>

<style scoped>
.dividend-card {
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  border: 1px solid rgba(255, 69, 0, 0.18);
  background: rgba(20, 10, 5, 0.35);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  padding: 14px;
  color: #fff;
  transition: all 0.2s ease;
  overflow: hidden;
}

.dividend-card:hover {
  border-color: rgba(255, 69, 0, 0.35);
}

.card-decor {
  height: 3px;
  margin: -14px -14px 12px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 69, 0, 0.55) 50%, transparent 100%);
}

.card-title {
  margin: 0;
  font-size: 1.2rem;
  color: #ffd6b5;
}

.card-desc {
  margin: 8px 0 0;
  color: #d0b9a8;
  font-size: 0.84rem;
  line-height: 1.5;
}

.info-wrap {
  margin-top: 16px;
  background: rgba(14, 9, 7, 0.6);
  border-radius: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 114, 67, 0.15);
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
  border: 1px solid rgba(255, 130, 60, 0.45);
  border-radius: 10px;
  min-height: 44px;
  background: rgba(255, 92, 31, 0.14);
  color: #ffd0a9;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn.primary {
  background: rgba(255, 69, 0, 0.22);
  color: #ffe3cd;
}

.action-btn:hover:not(:disabled) {
  border-color: #ff4500;
  background: rgba(255, 69, 0, 0.28);
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

  .card-decor {
    margin: -12px -12px 12px;
  }
}
</style>
