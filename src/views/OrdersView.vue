<template>
  <div class="page-shell">
    <div class="page-bg-glow"></div>

    <section class="page-header">
      <h1 class="page-title">订单</h1>
      <p class="page-subtitle">查看当前订单状态与历史记录</p>
    </section>

    <section class="panel">
      <div class="panel-decor"></div>

      <div class="top-control-bar">
        <div class="tabs">
          <button class="tab-btn" :class="{ active: activeStatus === 0 }" @click="switchStatus(0)">进行中</button>
          <button class="tab-btn" :class="{ active: activeStatus === 1 }" @click="switchStatus(1)">已赎回</button>
        </div>

        <div class="stats-card-vertical">
          <div class="stat-item">
            <p class="stat-label">待领收益</p>
            <p class="stat-value">{{ totalPendingRewardUsdtText }} U <span class="sub-value">(≈ {{ totalPendingRewardMskeText }} MSKE)</span></p>
          </div>
          <div class="stat-item">
            <p class="stat-label">当前订单数</p>
            <p class="stat-value">{{ totalRecords }}</p>
          </div>
        </div>
      </div>

      <div class="order-list-container">
        <p v-if="!walletState.isConnected" class="hint-line">请先连接钱包后查看订单。</p>
        <p v-else-if="loadingRecords && recordList.length === 0" class="hint-line">订单加载中...</p>

        <div v-if="walletState.isConnected && recordList.length > 0" class="order-list">
          <article v-for="record in recordList" :key="record.key" class="order-card">
            <div class="order-header">
              <div class="order-title-wrap">
                <div class="order-title-row">
                  <p class="order-title">订单 #{{ record.displayIndex }}</p>
                  <span class="order-time">{{ record.stakeTimeText }}</span>
                </div>
                <p class="order-days">已持有 <span class="highlight-days">{{ record.holdDays }}</span> 天</p>
              </div>
            </div>

          <div class="order-content-grid">
            <div class="info-block">
              <div class="order-grid">
                <div class="row">
                  <span class="row-label">质押本金</span>
                  <span class="row-value strong">{{ record.amountText }} U</span>
                </div>
                <div class="row">
                  <span class="row-label">LP 份额</span>
                  <span class="row-value">{{ record.lpAmountText }}<span class="sub-value"> (≈ {{ record.lpUAmountText }} U)</span></span>
                </div>
              </div>
            </div>

            <div class="info-block compact">
              <div class="order-grid">
                <div class="row">
                  <span class="row-label">当前日收益率</span>
                  <span class="row-value highlight">{{ record.dailyRewardRateText }}</span>
                </div>
                <div class="row" v-if="activeStatus === 0">
                  <span class="row-label">当前赎回比例</span>
                  <span class="row-value warn">{{ record.unstakeRateText }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="info-block full-width" v-if="activeStatus === 0">
            <div class="row row-horizontal">
              <span class="row-label">待领收益</span>
              <span class="row-value highlight">{{ record.pendingRewardUsdtText }} U<span class="sub-value"> (≈ {{ record.pendingRewardMskeText }} MSKE)</span></span>
            </div>
          </div>

            <div class="order-actions" v-if="activeStatus === 0">
              <button class="action-btn" :disabled="actionLoading" @click="handleHarvest(record)">
                领取收益
              </button>
              <button class="action-btn danger" :disabled="actionLoading" @click="openUnstakeConfirm(record)">
                赎回
              </button>
            </div>
          </article>

          <div v-if="totalPages > 1" class="pagination-controls">
            <button class="page-btn" :disabled="currentPage <= 1 || loadingRecords || actionLoading" @click="prevPage">
              上一页
            </button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button class="page-btn" :disabled="currentPage >= totalPages || loadingRecords || actionLoading" @click="nextPage">
              下一页
            </button>
          </div>
        </div>

        <div v-else-if="walletState.isConnected && !loadingRecords" class="empty-state">
          <p>暂无订单数据</p>
        </div>
      </div>
    </section>

    <transition name="modal">
      <div v-if="unstakeConfirmVisible" class="modal-mask" @click.self="closeUnstakeConfirm">
        <div class="modal-container">
          <h3 class="modal-title">赎回确认</h3>
          <p class="modal-desc">
            根据您当前持有天数，当前赎回比例为 {{ unstakeConfirmRateText }}，剩余本金将回流底池。赎回后将不再享受该笔订单分红。
          </p>
          <div class="modal-actions">
            <button class="modal-btn" @click="closeUnstakeConfirm">取消</button>
            <button class="modal-btn primary" :disabled="actionLoading" @click="confirmUnstake">确认赎回</button>
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
import { showToast } from '@/services/notification';
import stakingAbi from '@/abis/staking.json';
import pancakeRouterV2Abi from '@/abis/pancakeRouterV2.json';

const PAGE_LIMIT = 2;
const FALLBACK_BASE_PERCENT = 10000n;

// In testnet, 60s = 1 day. In mainnet, 86400s = 1 day.
// We determine this by checking the chainId.
// walletState.chainId is typically a BigInt or Number from ethers network.chainId
const isTestnet = computed(() => {
  const cid = Number(walletState.chainId);
  return cid === 97 || cid === 5600;
});
const oneDaySeconds = computed(() => isTestnet.value ? 60 : 86400);

const activeStatus = ref(0);
const totalPendingRewardUsdtRaw = ref(0n);
const totalPendingRewardMskeRaw = ref(0n);
const recordList = ref([]);
const allRecordsList = ref([]);
const totalRecords = ref(0);
const currentPage = ref(1);
const loadingRecords = ref(false);
const actionLoading = ref(false);
const nowTs = ref(Math.floor(Date.now() / 1000));
const unstakeConfirmVisible = ref(false);
const pendingUnstakeRecord = ref(null);

const rewardThresholds = ref([]);
const rewardRates = ref([]);
const unstakeThresholds = ref([]);
const unstakeRates = ref([]);
const basePercent = ref(FALLBACK_BASE_PERCENT);
const stakingDecimals = ref(18);

let nowTimer = null;

const stakingAddress = computed(() => getContractAddress('Staking'));
const routerAddress = computed(() => getContractAddress('Router'));
const usdtAddress = computed(() => getContractAddress('USDT'));
const mskeAddress = computed(() => getContractAddress('MSKE'));

const totalPendingRewardUsdtText = computed(() => formatAmount(totalPendingRewardUsdtRaw.value, stakingDecimals.value, 4));
const totalPendingRewardMskeText = computed(() => formatAmount(totalPendingRewardMskeRaw.value, stakingDecimals.value, 6));
const totalPages = computed(() => Math.ceil(totalRecords.value / PAGE_LIMIT) || 1);
const unstakeConfirmRateText = computed(() => {
  if (!pendingUnstakeRecord.value) return '--';
  return pendingUnstakeRecord.value.unstakeRateText;
});

function getReadProvider() {
  if (walletState.provider) return walletState.provider;
  if (!window.ethereum) return null;
  return new ethers.BrowserProvider(window.ethereum);
}

function getWriteSigner() {
  if (walletState.signer) return walletState.signer;
  if (!window.ethereum) return null;
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
}

function getReadStakingContract(provider) {
  return new ethers.Contract(stakingAddress.value, stakingAbi, provider);
}

async function getWriteStakingContract() {
  const signer = await getWriteSigner();
  if (!signer) return null;
  return new ethers.Contract(stakingAddress.value, stakingAbi, signer);
}

function formatAmount(value, decimals = 18, precision = 4) {
  const text = ethers.formatUnits(value, decimals);
  const numeric = Number(text);
  if (!Number.isFinite(numeric)) return '0';
  return numeric.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
  });
}

function getHeldDays(stakeTime) {
  const ts = Number(stakeTime || 0n);
  if (!Number.isFinite(ts) || ts <= 0) return 0;
  // Fallback to 86400 if oneDaySeconds is somehow 0 or missing
  const divisor = oneDaySeconds.value || 86400;
  const delta = Math.max(0, nowTs.value - ts);
  const days = Math.floor(delta / divisor);
  return days;
}

function pickRateByDays(days, thresholds, rates) {
  if (!thresholds.length || !rates.length) return 0n;
  let picked = rates[0] || 0n;
  for (let i = 0; i < thresholds.length; i += 1) {
    if (days >= Number(thresholds[i])) {
      picked = rates[i + 1] ?? picked;
    }
  }
  return picked;
}

function formatRatePercent(rawRate) {
  if (!basePercent.value || basePercent.value <= 0n) return '--';
  const scaled = Number(rawRate * 10000n / basePercent.value) / 100;
  if (!Number.isFinite(scaled)) return '--';
  return `${scaled.toFixed(2)}%`;
}

function formatStakeTime(timestampRaw) {
  const ts = Number(timestampRaw || 0n) * 1000;
  if (ts <= 0) return '--';
  const date = new Date(ts);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

function normalizeRecord(record, fallbackIndex) {
  const holdDays = getHeldDays(record.stakeTime);
  const rewardRateRaw = pickRateByDays(holdDays, rewardThresholds.value, rewardRates.value);
  const unstakeRateRaw = pickRateByDays(holdDays, unstakeThresholds.value, unstakeRates.value);
  const rawId = typeof record.id !== 'undefined' ? BigInt(record.id) : BigInt(fallbackIndex);
  const recordIndex = Number(rawId);

  return {
    key: `${recordIndex}-${record.stakeTime}-${record.amount}`,
    recordIndex,
    displayIndex: recordIndex + 1,
    holdDays,
    amountText: formatAmount(BigInt(record.amount || 0n), stakingDecimals.value),
    lpAmountText: formatAmount(BigInt(record.lpAmount || 0n), stakingDecimals.value),
    lpUAmountText: formatAmount(BigInt(record.lpUAmount || 0n), stakingDecimals.value),
    dailyRewardRateText: formatRatePercent(rewardRateRaw),
    unstakeRateText: formatRatePercent(unstakeRateRaw),
    stakeTimeText: formatStakeTime(record.stakeTime),
    pendingRewardUsdtText: '--',
    pendingRewardMskeText: '--'
  };
}

async function fetchConfigData(contract) {
  try {
    const [rewardConfig, unstakeConfig, basePercentRaw, decimalsRaw] = await Promise.all([
      contract.getRewardConfig(),
      contract.getUnstakeConfig(),
      contract.BASE_PERCENT(),
      contract.decimals()
    ]);
    rewardThresholds.value = rewardConfig?.thresholds || [];
    rewardRates.value = rewardConfig?.rates || [];
    unstakeThresholds.value = unstakeConfig?.thresholds || [];
    unstakeRates.value = unstakeConfig?.rates || [];
    basePercent.value = basePercentRaw > 0n ? basePercentRaw : FALLBACK_BASE_PERCENT;
    stakingDecimals.value = Number(decimalsRaw || 18);
  } catch (error) {
    rewardThresholds.value = [];
    rewardRates.value = [];
    unstakeThresholds.value = [];
    unstakeRates.value = [];
    basePercent.value = FALLBACK_BASE_PERCENT;
  }
}

async function getMskeAmountOut(usdtAmountRaw, provider) {
  if (!usdtAmountRaw || usdtAmountRaw <= 0n) return 0n;
  if (!provider) return 0n;
  if (!ethers.isAddress(routerAddress.value) || !ethers.isAddress(usdtAddress.value) || !ethers.isAddress(mskeAddress.value)) {
    return 0n;
  }
  try {
    const routerContract = new ethers.Contract(routerAddress.value, pancakeRouterV2Abi, provider);
    const path = [usdtAddress.value, mskeAddress.value];
    const amountsOut = await routerContract.getAmountsOut(usdtAmountRaw, path);
    return amountsOut[amountsOut.length - 1];
  } catch (e) {
    return 0n;
  }
}

async function fetchPendingReward(contract, provider) {
  if (!walletState.address) {
    totalPendingRewardUsdtRaw.value = 0n;
    totalPendingRewardMskeRaw.value = 0n;
    return;
  }
  try {
    const usdtRewardRaw = await contract.balanceOf(walletState.address);
    totalPendingRewardUsdtRaw.value = usdtRewardRaw;
    totalPendingRewardMskeRaw.value = await getMskeAmountOut(usdtRewardRaw, provider);
  } catch (error) {
    totalPendingRewardUsdtRaw.value = 0n;
    totalPendingRewardMskeRaw.value = 0n;
  }
}

async function fetchRecords({ reset = false } = {}) {
  if (!walletState.isConnected || !walletState.address || !ethers.isAddress(stakingAddress.value || '')) {
    recordList.value = [];
    allRecordsList.value = [];
    totalPendingRewardUsdtRaw.value = 0n;
    totalPendingRewardMskeRaw.value = 0n;
    totalRecords.value = 0;
    if (reset) currentPage.value = 1;
    return;
  }

  const provider = getReadProvider();
  if (!provider) return;
  const contract = getReadStakingContract(provider);

  try {
    if (reset) {
      currentPage.value = 1;
      loadingRecords.value = true;
      await Promise.all([fetchConfigData(contract), fetchPendingReward(contract, provider)]);

      let allFetchedRecords = [];
      let currentCursor = 0n;
      const FETCH_LIMIT = 100n;

      while (true) {
        const result = await contract.getUserRecords(walletState.address, currentCursor, FETCH_LIMIT, activeStatus.value);
        const rows = result?.records || [];
        allFetchedRecords = allFetchedRecords.concat(rows);
        
        currentCursor = BigInt(result?.nextCursor ?? 0n);
        if (currentCursor === 0n) {
          break;
        }
      }

      allRecordsList.value = allFetchedRecords;
      totalRecords.value = allFetchedRecords.length;
    }

    const startIndex = (currentPage.value - 1) * PAGE_LIMIT;
    const endIndex = startIndex + PAGE_LIMIT;
    const pageRecords = allRecordsList.value.slice(startIndex, endIndex);

    const mapped = pageRecords.map((record) => normalizeRecord(record, 0));

    if (activeStatus.value === 0) {
      await Promise.all(mapped.map(async (item) => {
        try {
          const rewardUsdtRaw = await contract.rewardOfSlot(walletState.address, item.recordIndex);
          const rewardMskeRaw = await getMskeAmountOut(rewardUsdtRaw, provider);
          item.pendingRewardUsdtText = formatAmount(rewardUsdtRaw, stakingDecimals.value, 4);
          item.pendingRewardMskeText = formatAmount(rewardMskeRaw, stakingDecimals.value, 6);
        } catch (e) {
          item.pendingRewardUsdtText = '0';
          item.pendingRewardMskeText = '0';
        }
      }));
    }

    recordList.value = mapped;

  } catch (error) {
    recordList.value = [];
    if (reset) {
      allRecordsList.value = [];
      totalRecords.value = 0;
    }
  } finally {
    loadingRecords.value = false;
  }
}

async function refreshAll() {
  await fetchRecords({ reset: true });
}

function switchStatus(status) {
  if (activeStatus.value === status) return;
  activeStatus.value = status;
  refreshAll();
}

async function prevPage() {
  if (currentPage.value > 1 && !loadingRecords.value && !actionLoading.value) {
    currentPage.value--;
    await fetchRecords({ reset: false });
  }
}

async function nextPage() {
  if (currentPage.value < totalPages.value && !loadingRecords.value && !actionLoading.value) {
    currentPage.value++;
    await fetchRecords({ reset: false });
  }
}

async function handleHarvest(record) {
  if (!walletState.isConnected || !walletState.address) {
    showToast('请先连接钱包', 'warning');
    return;
  }

  actionLoading.value = true;
  try {
    const contract = await getWriteStakingContract();
    if (!contract) throw new Error('NO_CONTRACT');
    const tx = await contract.harvest([record.recordIndex]);
    showToast('领取交易已提交', 'success');
    await tx.wait();
    showToast('领取成功', 'success');
    await refreshAll();
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast('已取消领取', 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast('领取失败，请稍后重试', 'error');
    }
  } finally {
    actionLoading.value = false;
  }
}

function openUnstakeConfirm(record) {
  pendingUnstakeRecord.value = record;
  unstakeConfirmVisible.value = true;
}

function closeUnstakeConfirm() {
  unstakeConfirmVisible.value = false;
  pendingUnstakeRecord.value = null;
}

async function confirmUnstake() {
  if (!pendingUnstakeRecord.value) return;
  actionLoading.value = true;
  try {
    const contract = await getWriteStakingContract();
    if (!contract) throw new Error('NO_CONTRACT');
    const tx = await contract.unstake([pendingUnstakeRecord.value.recordIndex]);
    showToast('赎回交易已提交', 'success');
    await tx.wait();
    showToast('赎回成功', 'success');
    closeUnstakeConfirm();
    await refreshAll();
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast('已取消赎回', 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast('赎回失败，请稍后重试', 'error');
    }
  } finally {
    actionLoading.value = false;
  }
}

watch(
  () => [walletState.isConnected, walletState.address, stakingAddress.value, activeStatus.value],
  async () => {
    await refreshAll();
  }
);

onMounted(async () => {
  nowTimer = setInterval(() => {
    nowTs.value = Math.floor(Date.now() / 1000);
  }, 60000);
  await refreshAll();
});

onBeforeUnmount(() => {
  if (nowTimer) {
    clearInterval(nowTimer);
    nowTimer = null;
  }
});
</script>

<style scoped>
.page-shell {
  min-height: 100vh;
  padding: 10px 0px 120px;
  position: relative;
  background-color: #050302;
  overflow-x: hidden;
}

.page-bg-glow {
  position: absolute;
  top: -180px;
  left: 50%;
  transform: translateX(-50%);
  width: min(720px, 100vw);
  height: 460px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 74, 28, 0.22) 0%, rgba(255, 74, 28, 0) 70%);
  filter: blur(6px);
  pointer-events: none;
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

.panel {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
  padding: 18px 0px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(25, 14, 8, 0.5), rgba(14, 9, 7, 0.45));
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.panel-decor {
  height: 3px;
  margin: -24px -20px 18px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 69, 0, 0.55) 50%, transparent 100%);
}

.top-control-bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0 16px 16px;
}

.stats-card-vertical {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(255, 109, 60, 0.15);
  border-radius: 10px;
  padding: 12px 16px;
  background: linear-gradient(180deg, rgba(255, 88, 28, 0.04), rgba(255, 69, 0, 0.01));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.stat-item + .stat-item {
  border-top: 1px dashed rgba(255, 164, 118, 0.15);
  padding-top: 12px;
}

.stat-label {
  margin: 0;
  color: #bfa28d;
  font-size: 0.8rem;
  letter-spacing: 0.02em;
}

.stat-value {
  margin: 0;
  color: #e6ccb8;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.1;
  text-align: right;
}

.tabs {
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 99, 50, 0.26);
  border-radius: 11px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
  width: 100%;
  min-height: 40px;
}

.tab-btn {
  width: 50%;
  min-height: 40px;
  border: none;
  background: transparent;
  color: #cfb49c;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s ease;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.tab-btn + .tab-btn {
  border-left: 1px solid rgba(255, 99, 50, 0.26);
}

.tab-btn.active {
  color: #ffe0c7;
  background: rgba(255, 69, 0, 0.22);
}

.tab-btn:hover:not(.active) {
  color: #e6ccb8;
  background: rgba(255, 69, 0, 0.08);
}

.hint-line {
  margin: 0 0 20px;
  color: #bba392;
  font-size: 0.85rem;
  text-align: center;
}

.order-list-container {
  min-height: 200px;
}

.order-list {
  display: grid;
  gap: 12px;
  padding: 0 16px;
}

.order-card {
  border: 1px solid rgba(255, 124, 78, 0.2);
  border-radius: 12px;
  padding: 10px 12px;
  background: linear-gradient(180deg, rgba(255, 89, 34, 0.08), rgba(255, 69, 0, 0.02));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 164, 118, 0.15);
}

.order-title-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.order-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.order-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #ffe4cc;
}

.order-time {
  font-size: 0.7rem;
  color: #a48c78;
  margin-left: 4px;
}

.order-days {
  margin: 0;
  color: #cbb19d;
  font-size: 0.75rem;
}

.highlight-days {
  color: #ff9e5e;
  font-weight: 600;
  font-size: 0.85rem;
}

.order-status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  border: 1px solid rgba(255, 143, 90, 0.3);
  background: rgba(255, 112, 61, 0.1);
  color: #ffd6b8;
  font-size: 0.65rem;
  font-weight: 600;
}

.order-status-chip.done {
  border-color: rgba(189, 169, 154, 0.25);
  background: rgba(166, 140, 120, 0.08);
  color: #dbc5b5;
}

.order-content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  align-items: start;
}

.info-block {
  padding: 2px 0;
}

.info-block.full-width {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed rgba(255, 164, 118, 0.15);
}

.info-block + .info-block:not(.full-width) {
  margin-top: 0;
  padding-top: 4px;
  border-top: none;
  padding-left: 12px;
}

.order-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2px;
}

.row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-height: 28px;
  font-size: 0.8rem;
  gap: 2px;
}

.row-horizontal {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.row-label {
  color: #cbb19d;
  font-size: 0.7rem;
}

.row-value {
  color: #f0d9c7;
  font-size: 0.85rem;
}

.row-value.strong {
  font-weight: 700;
  color: #ffe4cc;
}

.highlight {
  color: #b5f8ca;
}

.warn {
  color: #ffc2a0;
}

.sub-value {
  color: #a48c78;
  font-size: 0.65rem;
  margin-left: 2px;
}

.order-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  border: 1px solid rgba(255, 130, 60, 0.45);
  border-radius: 8px;
  min-height: 30px;
  background: rgba(255, 92, 31, 0.14);
  color: #ffd0a9;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover:not(:disabled) {
  border-color: rgba(255, 130, 60, 0.72);
  background: rgba(255, 89, 34, 0.28);
  color: #fff0e4;
}

.action-btn.danger {
  border-color: rgba(255, 158, 116, 0.4);
  background: rgba(205, 122, 88, 0.16);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
  padding: 8px 0;
}

.page-btn {
  border: 1px solid rgba(255, 130, 60, 0.45);
  border-radius: 8px;
  min-height: 32px;
  padding: 0 16px;
  background: rgba(255, 92, 31, 0.14);
  color: #ffd0a9;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled) {
  border-color: rgba(255, 130, 60, 0.72);
  background: rgba(255, 89, 34, 0.28);
  color: #fff0e4;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: rgba(255, 130, 60, 0.2);
}

.page-info {
  color: #d7bca8;
  font-size: 0.85rem;
  font-weight: 600;
  min-width: 48px;
  text-align: center;
}

.empty-state {
  min-height: 140px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 114, 67, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #af9f90;
  font-size: 0.9rem;
  margin: 0 16px;
  background: rgba(255, 89, 34, 0.02);
}

@media (max-width: 560px) {
  .panel {
    padding: 14px 0px;
  }
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
}

.modal-btn.primary {
  border-color: rgba(255, 130, 60, 0.45);
  background: rgba(255, 92, 31, 0.14);
  color: #ffd0a9;
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
