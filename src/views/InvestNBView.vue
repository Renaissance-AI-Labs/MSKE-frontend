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
        <h2 class="panel-title">参与投资</h2>

        <div v-if="hasInvested" class="invested-card">
          <p class="invested-text">当前地址已参与NB投资</p>
        </div>

        <template v-else>
          <div class="input-card">
            <div class="input-head">
              <span class="field-label">投资金额 (USDT)</span>
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
                :placeholder="`范围 ${minInvestAmountText} - ${maxInvestAmountText}`"
                :disabled="hasInvested"
                @input="onInvestAmountChange"
              />
            </div>

            <div class="details-block">
              <div class="summary-row">
                <span>USDT 余额</span>
                <span>{{ usdtBalanceText }} USDT</span>
              </div>
              <div v-if="!hasBoundReferral" class="summary-row">
                <span>推荐人</span>
                <span class="text-warning">{{ referralStatusText }}</span>
              </div>
            </div>
          </div>

          <p v-if="!hasBoundReferral" class="hint-line warning">
            请先通过邀请链接在好友页面绑定推荐人
          </p>

          <button class="confirm-btn" :disabled="investDisabled" @click="handleInvestClick">
            {{ investButtonText }}
          </button>
        </template>
      </section>

      <section class="content-panel data-panel">
        <div class="panel-decor"></div>
        <h2 class="panel-title">我的数据</h2>

        <div class="data-grid">
          <div class="data-item">
            <span class="data-label">NB 余额</span>
            <span class="data-value">{{ nbBalanceText }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">当前等级</span>
            <span class="data-value highlight">{{ currentLevelText }}</span>
          </div>
          <div class="data-item">
            <span class="data-label">好友成果</span>
            <span class="data-value">{{ directPerfText }} USDT</span>
          </div>
          <div class="data-item">
            <span class="data-label">组队成果</span>
            <span class="data-value">{{ teamPerfText }} USDT</span>
          </div>
        </div>

        <div class="quota-section">
          <div class="quota-row">
            <span class="quota-title">卖出额度</span>
            <span class="quota-value">已用 {{ usedQuotaText }} USDT / 共 {{ totalQuotaText }} USDT</span>
          </div>
          <div class="quota-progress-track">
            <div class="quota-progress-fill" :style="{ width: `${quotaProgress}%` }"></div>
          </div>
          <button class="confirm-btn quota-action-btn" @click="handleGoToSellNb">卖出NB</button>
        </div>
      </section>

      <section class="content-panel dividend-panel">
        <div class="panel-decor"></div>
        <h2 class="panel-title s6-title">S6 分红池</h2>

        <div class="dividend-status-row">
          <span class="status-label">当前状态</span>
          <span class="status-badge" :class="s6StatusClass">{{ s6StatusText }}</span>
        </div>

        <div class="dividend-stats">
          <div class="stat-box">
            <span class="stat-label">待领取分红</span>
            <span class="stat-value highlight">{{ s6PendingText }} USDT</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">已领取分红</span>
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
          {{ isRegisteringS6 ? '激活中...' : '激活 S6' }}
        </button>
        <button
          v-else-if="isS6Registered"
          class="confirm-btn primary"
          :disabled="!canHarvestS6"
          @click="handleHarvestS6"
        >
          {{ isHarvestingS6 ? '领取中...' : '领取分红' }}
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

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)'
];

const REFERRAL_ABI = [
  'function isBindReferral(address) view returns (bool)'
];

const NBMANAGER_ABI = [
  'function minInvestAmount() view returns (uint256)',
  'function maxInvestAmount() view returns (uint256)',
  'function hasInvested(address) view returns (bool)',
  'function directTotalInvestValue(address) view returns (uint256)',
  'function getTeamRewardInfo(address) view returns (uint256 performance, uint8 level, uint256 rewardRateBP)',
  'function getTeamPerformance(address) view returns (uint256)',
  'function isS6Registered(address) view returns (bool)',
  'function s6PendingReward(address) view returns (uint256)',
  'function userHarvestedReward(address) view returns (uint256)',
  'function invest(uint256 amountIn, uint256 minMskeOut, uint256 minNbOut)',
  'function registerS6(address user)',
  'function s6Harvest()'
];

const isDataLoading = ref(false);
const isInvesting = ref(false);
const isHarvestingS6 = ref(false);
const isRegisteringS6 = ref(false);
let refreshTimer = null;
const router = useRouter();

const usdtAddress = computed(() => getContractAddress('USDT'));
const nbAddress = computed(() => getContractAddress('NB'));
const referralAddress = computed(() => getContractAddress('Referral'));
const nbManagerAddress = ref('');

const hasBoundReferral = ref(false);
const usdtBalanceRaw = ref(0n);
const nbBalanceRaw = ref(0n);
const investAmount = ref('');
const minInvestRaw = ref(ethers.parseUnits('100', 18));
const maxInvestRaw = ref(ethers.parseUnits('3000', 18));
const hasInvested = ref(false);
const usdtAllowanceRaw = ref(0n);
const directPerfRaw = ref(0n);
const teamPerfRaw = ref(0n);
const currentLevel = ref(0);
const totalQuotaRaw = ref(0n);
const usedQuotaRaw = ref(0n);
const remainingQuotaRaw = ref(0n);
const isS6Registered = ref(false);
const s6PendingRaw = ref(0n);
const s6HarvestedRaw = ref(0n);

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
const minInvestAmountText = computed(() => formatU(minInvestRaw.value));
const maxInvestAmountText = computed(() => formatU(maxInvestRaw.value));
const directPerfText = computed(() => formatU(directPerfRaw.value));
const teamPerfText = computed(() => formatU(teamPerfRaw.value));
const totalQuotaText = computed(() => formatU(totalQuotaRaw.value));
const usedQuotaText = computed(() => formatU(usedQuotaRaw.value));
const quotaProgress = computed(() => {
  if (totalQuotaRaw.value <= 0n) return 0;
  const progressBps = Number((usedQuotaRaw.value * 10000n) / totalQuotaRaw.value);
  return Math.min(Math.max(progressBps / 100, 0), 100);
});
const referralStatusText = computed(() => '未绑定');
const currentLevelText = computed(() => {
  if (currentLevel.value <= 0) return '无';
  return `S${currentLevel.value}`;
});

const isS6Eligible = computed(() => currentLevel.value === 6 || isS6Registered.value);
const s6PendingText = computed(() => formatU(s6PendingRaw.value));
const s6HarvestedText = computed(() => formatU(s6HarvestedRaw.value));
const showS6RegisterButton = computed(() => currentLevel.value === 6 && !isS6Registered.value);
const s6StatusText = computed(() => {
  if (!isS6Eligible.value) return '未达到 S6';
  if (showS6RegisterButton.value) return '待激活';
  if (s6PendingRaw.value > 0n) return '可领取';
  return '已激活';
});
const s6StatusClass = computed(() => {
  if (!isS6Eligible.value) return 'is-locked';
  if (showS6RegisterButton.value) return 'is-warning';
  if (s6PendingRaw.value > 0n) return 'is-success';
  return 'is-ready';
});
const s6HintText = computed(() => {
  if (!isS6Eligible.value) return '';
  if (showS6RegisterButton.value) return '达到 S6 后若未自动注册，可先手动激活，再领取分红。';
  if (s6PendingRaw.value > 0n) return '';
  return '已激活 S6 分红资格，当前暂无可领取分红。';
});
const canRegisterS6 = computed(() => walletState.isConnected && showS6RegisterButton.value && !isRegisteringS6.value);
const canHarvestS6 = computed(() => walletState.isConnected && isS6Registered.value && s6PendingRaw.value > 0n && !isHarvestingS6.value);

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
  if (!nbManagerAddress.value) return true;
  if (hasInvested.value) return true;
  if (!hasBoundReferral.value) return true;
  if (investAmountRaw.value < minInvestRaw.value || investAmountRaw.value > maxInvestRaw.value) return true;
  if (investAmountRaw.value > usdtBalanceRaw.value) return true;
  return false;
});

const investButtonText = computed(() => {
  if (!walletState.isConnected) return '请先连接钱包';
  if (isDataLoading.value) return '数据加载中...';
  if (hasInvested.value) return '已参与投资';
  if (!hasBoundReferral.value) return '请先绑定推荐人';
  if (isInvesting.value) return usdtAllowanceRaw.value < investAmountRaw.value ? '授权中...' : '投资中...';
  if (investAmount.value && investAmountRaw.value === 0n) return '输入金额无效';
  if (investAmountRaw.value > 0n && investAmountRaw.value < minInvestRaw.value) return `最低投资 ${minInvestAmountText.value} USDT`;
  if (investAmountRaw.value > maxInvestRaw.value) return `最高投资 ${maxInvestAmountText.value} USDT`;
  if (investAmountRaw.value > usdtBalanceRaw.value) return 'USDT 余额不足';
  if (investAmountRaw.value > 0n && usdtAllowanceRaw.value < investAmountRaw.value) return '授权 USDT';
  return '参与投资';
});

const getProvider = () => {
  if (walletState.provider) return walletState.provider;
  if (window.ethereum) return new ethers.BrowserProvider(window.ethereum);
  return null;
};

const resetUserData = () => {
  hasBoundReferral.value = false;
  usdtBalanceRaw.value = 0n;
  nbBalanceRaw.value = 0n;
  hasInvested.value = false;
  usdtAllowanceRaw.value = 0n;
  directPerfRaw.value = 0n;
  teamPerfRaw.value = 0n;
  currentLevel.value = 0;
  totalQuotaRaw.value = 0n;
  usedQuotaRaw.value = 0n;
  remainingQuotaRaw.value = 0n;
  isS6Registered.value = false;
  s6PendingRaw.value = 0n;
  s6HarvestedRaw.value = 0n;
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

  if (!provider || !nbAddress.value) {
    resetUserData();
    isDataLoading.value = false;
    return;
  }

  try {
    const nbContract = new ethers.Contract(nbAddress.value, nbAbi, provider);

    if (!nbManagerAddress.value) {
      nbManagerAddress.value = await nbContract.NBManager().catch(() => '');
    }

    if (!walletState.isConnected || !walletState.address || !nbManagerAddress.value) {
      resetUserData();
      return;
    }

    const user = walletState.address;
    const usdtContract = new ethers.Contract(usdtAddress.value, ERC20_ABI, provider);
    const referralContract = new ethers.Contract(referralAddress.value, REFERRAL_ABI, provider);
    const nbManager = new ethers.Contract(nbManagerAddress.value, NBMANAGER_ABI, provider);

    const [
      uBal,
      nBal,
      uAllow,
      isBound,
      minInv,
      maxInv,
      invested,
      directPerf,
      teamInfo,
      teamPerf,
      s6Reg,
      s6Pend,
      s6Harv,
      totalQuota,
      remainingQuota,
      usedQuota
    ] = await Promise.all([
      usdtContract.balanceOf(user).catch(() => 0n),
      nbContract.balanceOf(user).catch(() => 0n),
      usdtContract.allowance(user, nbManagerAddress.value).catch(() => 0n),
      referralContract.isBindReferral(user).catch(() => false),
      nbManager.minInvestAmount().catch(() => ethers.parseUnits('100', 18)),
      nbManager.maxInvestAmount().catch(() => ethers.parseUnits('3000', 18)),
      nbManager.hasInvested(user).catch(() => false),
      nbManager.directTotalInvestValue(user).catch(() => 0n),
      nbManager.getTeamRewardInfo(user).catch(() => [0n, 0, 0]),
      nbManager.getTeamPerformance(user).catch(() => 0n),
      nbManager.isS6Registered(user).catch(() => false),
      nbManager.s6PendingReward(user).catch(() => 0n),
      nbManager.userHarvestedReward(user).catch(() => 0n),
      nbContract.totalUnlockedSellQuotaU(user).catch(() => 0n),
      nbContract.remainingSellQuotaU(user).catch(() => 0n),
      nbContract.usedSellQuotaU(user).catch(() => 0n)
    ]);

    usdtBalanceRaw.value = uBal;
    nbBalanceRaw.value = nBal;
    usdtAllowanceRaw.value = uAllow;
    hasBoundReferral.value = isBound;
    minInvestRaw.value = minInv;
    maxInvestRaw.value = maxInv;
    hasInvested.value = invested;
    directPerfRaw.value = directPerf;
    teamPerfRaw.value = teamPerf > 0n ? teamPerf : (teamInfo?.[0] ?? 0n);
    currentLevel.value = Number(teamInfo?.[1] ?? 0);
    isS6Registered.value = s6Reg;
    s6PendingRaw.value = s6Pend;
    s6HarvestedRaw.value = s6Harv;
    totalQuotaRaw.value = totalQuota;
    remainingQuotaRaw.value = remainingQuota;
    usedQuotaRaw.value = usedQuota;
  } catch (error) {
    console.error('Failed to load NB data:', error);
  } finally {
    isDataLoading.value = false;
  }
};

const handleInvestClick = async () => {
  if (investDisabled.value) return;
  const signer = walletState.signer;
  if (!signer || !nbManagerAddress.value) return;

  try {
    isInvesting.value = true;

    if (usdtAllowanceRaw.value < investAmountRaw.value) {
      const usdtContract = new ethers.Contract(usdtAddress.value, ERC20_ABI, signer);
      const tx = await usdtContract.approve(nbManagerAddress.value, ethers.MaxUint256);
      showToast('授权交易已提交', 'info');
      await tx.wait();
      showToast('授权成功', 'success');
      usdtAllowanceRaw.value = ethers.MaxUint256;
      return;
    }

    const nbManager = new ethers.Contract(nbManagerAddress.value, NBMANAGER_ABI, signer);
    const tx = await nbManager.invest(investAmountRaw.value, 0, 0);
    showToast('投资交易已提交', 'info');
    await tx.wait();
    showToast('投资成功', 'success');
    investAmount.value = '';
    await loadData();
  } catch (error) {
    console.error(error);
    showToast('操作失败，请重试', 'error');
  } finally {
    isInvesting.value = false;
  }
};

const handleRegisterS6 = async () => {
  if (!canRegisterS6.value) return;
  const signer = walletState.signer;
  if (!signer || !walletState.address || !nbManagerAddress.value) return;

  try {
    isRegisteringS6.value = true;
    const nbManager = new ethers.Contract(nbManagerAddress.value, NBMANAGER_ABI, signer);
    const tx = await nbManager.registerS6(walletState.address);
    showToast('S6 激活交易已提交', 'info');
    await tx.wait();
    showToast('S6 激活成功', 'success');
    await loadData();
  } catch (error) {
    console.error(error);
    showToast('S6 激活失败，请重试', 'error');
  } finally {
    isRegisteringS6.value = false;
  }
};

const handleHarvestS6 = async () => {
  if (!canHarvestS6.value) return;
  const signer = walletState.signer;
  if (!signer || !nbManagerAddress.value) return;

  try {
    isHarvestingS6.value = true;
    const nbManager = new ethers.Contract(nbManagerAddress.value, NBMANAGER_ABI, signer);
    const tx = await nbManager.s6Harvest();
    showToast('领取交易已提交', 'info');
    await tx.wait();
    showToast('领取成功', 'success');
    await loadData();
  } catch (error) {
    console.error(error);
    showToast('领取失败，请重试', 'error');
  } finally {
    isHarvestingS6.value = false;
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

.s6-title {
  color: #ffb38d;
  text-shadow: 0 0 10px rgba(255, 69, 0, 0.3);
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
  gap: 12px;
  margin-bottom: 16px;
}

.data-item {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 99, 50, 0.15);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.data-label {
  color: #bba392;
  font-size: 0.75rem;
  margin-bottom: 6px;
}

.data-value {
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
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
  border-radius: 10px;
  padding: 14px;
}

.quota-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.quota-title {
  color: #dec5b1;
  font-size: 0.85rem;
  font-weight: 600;
}

.quota-value {
  font-size: 0.86rem;
  color: #ffcda5;
  text-align: right;
}

.quota-progress-track {
  margin-top: 10px;
  width: 100%;
  height: 8px;
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
  margin-top: 12px;
}

.dividend-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
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
  display: flex;
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
