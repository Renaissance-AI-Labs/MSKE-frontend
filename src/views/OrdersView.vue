<template>
  <div class="page-shell">
    <div class="page-bg-glow"></div>

    <section class="page-header">
      <h1 class="page-title">{{ t('orders.title') }}</h1>
      <p class="page-subtitle">{{ t('orders.subtitle') }}</p>
    </section>

    <section class="panel">
      <div class="panel-decor"></div>

      <div class="top-control-bar">
        <div class="tabs">
          <button class="tab-btn" :class="{ active: activeStatus === 0 }" @click="switchStatus(0)">{{ t('orders.tab.active') }}</button>
          <button class="tab-btn" :class="{ active: activeStatus === 1 }" @click="switchStatus(1)">{{ t('orders.tab.redeemed') }}</button>
        </div>

        <div v-if="activeStatus === 0" class="stats-card-vertical">
          <div class="stat-item">
            <p class="stat-label">{{ t('orders.totalPendingReward') }}</p>
            <p class="stat-value">{{ totalPendingRewardUsdtText }} U <span class="sub-value">(≈ {{ totalPendingRewardMskeText }} MSKE)</span></p>
          </div>
          <div class="stat-item">
            <p class="stat-label">{{ t('orders.mskexPoints') }}</p>
            <p class="stat-value">{{ mskexPointsText }}</p>
          </div>
        </div>
      </div>

      <div class="order-list-container">
        <p v-if="!walletState.isConnected" class="hint-line">{{ t('orders.connectWalletHint') }}</p>
        <p v-else-if="loadingRecords && recordList.length === 0" class="hint-line">{{ t('orders.loading') }}</p>

        <div v-if="walletState.isConnected && recordList.length > 0" class="order-list">
          <article v-for="record in recordList" :key="record.key" class="order-card">
            <div class="order-header">
              <div class="order-title-wrap">
                <div class="order-title-row">
                  <p class="order-title">{{ t('orders.orderNumber', { index: record.displayIndex }) }}</p>
                  <span class="order-time">{{ record.stakeTimeText }}</span>
                </div>
                <div v-if="activeStatus === 0" class="order-days">
                  <p v-html="t('orders.effectiveRewardDays', { days: `<span class='highlight-days'>${record.rewardDays}</span>` })"></p>
                  <p v-html="t('orders.stakeDays', { days: `<span class='highlight-days'>${record.stakeDays}</span>` })"></p>
                </div>
              </div>
            </div>

          <div class="order-content-grid">
            <div class="info-block">
              <div class="order-grid-horizontal">
                <div class="row">
                  <span class="row-label">{{ t('orders.stakePrincipal') }}</span>
                  <span class="row-value strong">{{ record.amountText }} U</span>
                </div>
                <div class="row" v-if="activeStatus === 0">
                  <span class="row-label">{{ t('orders.dailyRewardRate') }}</span>
                  <span class="row-value highlight">{{ record.dailyRewardRateText }}</span>
                </div>
                <div class="row" v-if="activeStatus === 0">
                  <span class="row-label">{{ t('orders.currentUnstakeRate') }}</span>
                  <span class="row-value warn">{{ record.unstakeRateText }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="info-block full-width" v-if="activeStatus === 0">
            <div class="row row-horizontal">
              <span class="row-label">{{ t('orders.pendingReward') }}</span>
              <span class="row-value highlight">{{ record.pendingRewardUsdtText }} U<span class="sub-value"> (≈ {{ record.pendingRewardMskeText }} MSKE)</span></span>
            </div>
          </div>

            <div class="order-actions" v-if="activeStatus === 0">
              <button class="action-btn" :disabled="actionLoading || !isOrderHarvestEnabled" @click="handleHarvest(record)">
                {{ actionLoading && pendingHarvestRecord === record.key ? actionStatusText : t('orders.action.harvest') }}
              </button>
              <button class="action-btn danger" :disabled="actionLoading" @click="openUnstakeConfirm(record)">
                {{ t('orders.action.unstake') }}
              </button>
            </div>
          </article>

          <div v-if="totalPages > 1" class="pagination-controls">
            <button class="page-btn" :disabled="currentPage <= 1 || loadingRecords || actionLoading" @click="prevPage">
              {{ t('orders.pagination.prev') }}
            </button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button class="page-btn" :disabled="currentPage >= totalPages || loadingRecords || actionLoading" @click="nextPage">
              {{ t('orders.pagination.next') }}
            </button>
          </div>
        </div>

        <div v-else-if="walletState.isConnected && !loadingRecords" class="empty-state">
          <p>{{ t('orders.noData') }}</p>
        </div>
      </div>
    </section>

    <transition name="modal">
      <div v-if="unstakeConfirmVisible" class="modal-mask" @click.self="closeUnstakeConfirm">
        <div class="modal-container">
          <h3 class="modal-title">{{ t('orders.modal.title') }}</h3>
          <p class="modal-desc" v-html="t('orders.modal.desc', { rate: `<span class='highlight-rate'>${unstakeConfirmRateText}</span>` })"></p>
          <div class="modal-actions">
            <button class="modal-btn" @click="closeUnstakeConfirm" :disabled="actionLoading">{{ t('orders.modal.cancel') }}</button>
            <button class="modal-btn primary" :disabled="actionLoading" @click="confirmUnstake">
              {{ actionLoading ? actionStatusText : t('orders.modal.confirm') }}
            </button>
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
import { ENABLE_ORDER_HARVEST } from '@/services/environment';
import { showToast } from '@/services/notification';
import { t } from '@/i18n/index.js';
import stakingAbi from '@/abis/staking.json';
import erc20Abi from '@/abis/erc20.json';
import pancakeRouterV2Abi from '@/abis/pancakeRouterV2.json';

const PAGE_LIMIT = 5;
const FALLBACK_BASE_PERCENT = 10000n;
const REWARD_POLL_INTERVAL = 6000;
const VALUE_ANIMATION_DURATION = 1800;

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
const mskexPointsRaw = ref(0n);
const totalPendingRewardUsdtDisplay = ref(0);
const totalPendingRewardMskeDisplay = ref(0);
const recordList = ref([]);
const allRecordsList = ref([]);
const totalRecords = ref(0);
const currentPage = ref(1);
const loadingRecords = ref(false);
const actionLoading = ref(false);
const actionStatusText = ref('');
const pendingHarvestRecord = ref(null);
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
let rewardTimer = null;
let totalUsdtAnimationFrame = null;
let totalMskeAnimationFrame = null;
let pendingRewardRefreshing = false;

const recordDisplayValueMap = new Map();
const recordAnimationFrameMap = new Map();

const stakingAddress = computed(() => getContractAddress('Staking'));
const isOrderHarvestEnabled = ENABLE_ORDER_HARVEST;
const routerAddress = computed(() => getContractAddress('Router'));
const usdtAddress = computed(() => getContractAddress('USDT'));
const mskeAddress = computed(() => getContractAddress('MSKE'));
const mskexAddress = computed(() => getContractAddress('MSKEX'));

const totalPendingRewardUsdtText = computed(() => formatAnimatedAmount(totalPendingRewardUsdtDisplay.value, 2));
const totalPendingRewardMskeText = computed(() => formatAnimatedAmount(totalPendingRewardMskeDisplay.value, 2));
const mskexPointsText = computed(() => formatAmount(mskexPointsRaw.value, 18, 2));
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

function formatAmount(value, decimals = 18, precision = 2) {
  let text = '0';
  try {
    text = ethers.formatUnits(value || 0n, decimals);
  } catch (e) {
    text = '0';
  }
  const parts = text.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? parts[1].slice(0, precision) : '';
  
  const formattedInteger = Number(integerPart).toLocaleString('en-US');
  
  if (precision > 0) {
    const paddedDecimal = decimalPart.padEnd(precision, '0');
    return `${formattedInteger}.${paddedDecimal}`;
  }
  
  return formattedInteger;
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
  } catch (e) {
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
      frameId = requestAnimationFrame(tick);
    }
  };
  frameId = requestAnimationFrame(tick);
  return frameId;
}

function stopAnimation(frameId) {
  if (frameId) {
    cancelAnimationFrame(frameId);
  }
}

function animateTotalPendingReward(usdtRaw, mskeRaw) {
  const nextUsdt = rawToDisplayNumber(usdtRaw, stakingDecimals.value);
  const nextMske = rawToDisplayNumber(mskeRaw, stakingDecimals.value);
  const fromUsdt = totalPendingRewardUsdtDisplay.value;
  const fromMske = totalPendingRewardMskeDisplay.value;

  stopAnimation(totalUsdtAnimationFrame);
  stopAnimation(totalMskeAnimationFrame);

  totalUsdtAnimationFrame = runValueAnimation({
    from: fromUsdt,
    to: nextUsdt,
    onUpdate: (value) => {
      totalPendingRewardUsdtDisplay.value = value;
    }
  });

  totalMskeAnimationFrame = runValueAnimation({
    from: fromMske,
    to: nextMske,
    onUpdate: (value) => {
      totalPendingRewardMskeDisplay.value = value;
    }
  });
}

function animateRecordPendingReward(item, rewardUsdtRaw, rewardMskeRaw) {
  const key = item.key;
  const nextUsdt = rawToDisplayNumber(rewardUsdtRaw, stakingDecimals.value);
  const nextMske = rawToDisplayNumber(rewardMskeRaw, stakingDecimals.value);
  const cached = recordDisplayValueMap.get(key) || { usdt: 0, mske: 0 };
  const frames = recordAnimationFrameMap.get(key) || { usdt: null, mske: null };

  stopAnimation(frames.usdt);
  stopAnimation(frames.mske);

  const nextFrames = { usdt: null, mske: null };
  nextFrames.usdt = runValueAnimation({
    from: cached.usdt,
    to: nextUsdt,
    onUpdate: (value) => {
      item.pendingRewardUsdtText = formatAnimatedAmount(value, 2);
      const current = recordDisplayValueMap.get(key) || { usdt: 0, mske: 0 };
      recordDisplayValueMap.set(key, { ...current, usdt: value });
    }
  });

  nextFrames.mske = runValueAnimation({
    from: cached.mske,
    to: nextMske,
    onUpdate: (value) => {
      item.pendingRewardMskeText = formatAnimatedAmount(value, 2);
      const current = recordDisplayValueMap.get(key) || { usdt: 0, mske: 0 };
      recordDisplayValueMap.set(key, { ...current, mske: value });
    }
  });

  recordAnimationFrameMap.set(key, nextFrames);
}

function cleanupRecordAnimationState(validKeys) {
  for (const [key, frames] of recordAnimationFrameMap.entries()) {
    if (!validKeys.has(key)) {
      stopAnimation(frames.usdt);
      stopAnimation(frames.mske);
      recordAnimationFrameMap.delete(key);
      recordDisplayValueMap.delete(key);
    }
  }
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

function getEffectiveRewardStartTime(record) {
  const stakeTime = BigInt(record?.stakeTime || 0n);
  const rewardStartTime = BigInt(record?.rewardStartTime || 0n);
  return rewardStartTime === 0n ? stakeTime : rewardStartTime;
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

function formatRatePercent(rawRate, multiply100 = false) {
  if (!basePercent.value || basePercent.value <= 0n) return '--';
  let scaled = Number(rawRate * 10000n / basePercent.value) / 100;
  if (multiply100) {
    scaled = scaled * 100;
  }
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
  const effectiveRewardStartTime = getEffectiveRewardStartTime(record);
  const rewardDays = getHeldDays(effectiveRewardStartTime);
  const stakeDays = getHeldDays(record.stakeTime);
  const rewardRateRaw = pickRateByDays(rewardDays, rewardThresholds.value, rewardRates.value);
  const unstakeRateRaw = pickRateByDays(stakeDays, unstakeThresholds.value, unstakeRates.value);
  const rawId = typeof record.id !== 'undefined' ? BigInt(record.id) : BigInt(fallbackIndex);
  const recordIndex = Number(rawId);

  return {
    key: `${recordIndex}-${record.stakeTime}-${record.amount}`,
    recordIndex,
    displayIndex: recordIndex + 1,
    rewardDays,
    stakeDays,
    amountText: formatAmount(BigInt(record.amount || 0n), stakingDecimals.value),
    dailyRewardRateText: formatRatePercent(rewardRateRaw),
    unstakeRateText: formatRatePercent(unstakeRateRaw, true),
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
    animateTotalPendingReward(0n, 0n);
    return;
  }
  try {
    const usdtRewardRaw = await contract.balanceOf(walletState.address);
    totalPendingRewardUsdtRaw.value = usdtRewardRaw;
    totalPendingRewardMskeRaw.value = await getMskeAmountOut(usdtRewardRaw, provider);
    animateTotalPendingReward(totalPendingRewardUsdtRaw.value, totalPendingRewardMskeRaw.value);
  } catch (error) {
    totalPendingRewardUsdtRaw.value = 0n;
    totalPendingRewardMskeRaw.value = 0n;
    animateTotalPendingReward(0n, 0n);
  }
}

async function fetchMskexPoints(provider) {
  if (!walletState.address || !provider || !ethers.isAddress(mskexAddress.value || '')) {
    mskexPointsRaw.value = 0n;
    return;
  }
  try {
    const mskexContract = new ethers.Contract(mskexAddress.value, erc20Abi, provider);
    mskexPointsRaw.value = await mskexContract.balanceOf(walletState.address);
  } catch (error) {
    mskexPointsRaw.value = 0n;
  }
}

async function fetchRecordPendingRewards(contract, provider, records) {
  const tasks = records.map(async (item) => {
    try {
      const rewardUsdtRaw = await contract.rewardOfSlot(walletState.address, item.recordIndex);
      const rewardMskeRaw = await getMskeAmountOut(rewardUsdtRaw, provider);
      animateRecordPendingReward(item, rewardUsdtRaw, rewardMskeRaw);
    } catch (e) {
      animateRecordPendingReward(item, 0n, 0n);
    }
  });
  await Promise.all(tasks);
}

function clearRewardTimer() {
  if (rewardTimer) {
    clearInterval(rewardTimer);
    rewardTimer = null;
  }
}

function resetRewardAnimationForTotals() {
  stopAnimation(totalUsdtAnimationFrame);
  stopAnimation(totalMskeAnimationFrame);
  totalUsdtAnimationFrame = null;
  totalMskeAnimationFrame = null;
}

function startRewardPolling() {
  clearRewardTimer();
  if (!walletState.isConnected || !walletState.address || activeStatus.value !== 0) return;
  rewardTimer = setInterval(() => {
    refreshPendingRewardsOnly();
  }, REWARD_POLL_INTERVAL);
}

async function refreshPendingRewardsOnly() {
  if (pendingRewardRefreshing || activeStatus.value !== 0 || !walletState.isConnected || !walletState.address) return;
  const provider = getReadProvider();
  if (!provider) return;
  const contract = getReadStakingContract(provider);

  pendingRewardRefreshing = true;
  try {
    await fetchPendingReward(contract, provider);
    await fetchMskexPoints(provider);
    if (recordList.value.length > 0) {
      await fetchRecordPendingRewards(contract, provider, recordList.value);
    }
  } finally {
    pendingRewardRefreshing = false;
  }
}

async function fetchRecords({ reset = false } = {}) {
  if (!walletState.isConnected || !walletState.address || !ethers.isAddress(stakingAddress.value || '')) {
    recordList.value = [];
    allRecordsList.value = [];
    totalPendingRewardUsdtRaw.value = 0n;
    totalPendingRewardMskeRaw.value = 0n;
    mskexPointsRaw.value = 0n;
    animateTotalPendingReward(0n, 0n);
    totalRecords.value = 0;
    cleanupRecordAnimationState(new Set());
    clearRewardTimer();
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
      await Promise.all([fetchConfigData(contract), fetchPendingReward(contract, provider), fetchMskexPoints(provider)]);

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
    recordList.value = mapped;
    cleanupRecordAnimationState(new Set(mapped.map(item => item.key)));

    if (activeStatus.value === 0) {
      await fetchRecordPendingRewards(contract, provider, recordList.value);
    }

  } catch (error) {
    recordList.value = [];
    if (reset) {
      allRecordsList.value = [];
      totalRecords.value = 0;
    }
  } finally {
    loadingRecords.value = false;
    startRewardPolling();
  }
}

async function refreshAll() {
  await fetchRecords({ reset: true });
}

function switchStatus(status) {
  if (activeStatus.value === status) return;
  activeStatus.value = status;
  // Clear data immediately before fetching
  recordList.value = [];
  allRecordsList.value = [];
  totalRecords.value = 0;
  currentPage.value = 1;
  clearRewardTimer();
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
  if (!isOrderHarvestEnabled) {
    return;
  }

  if (!walletState.isConnected || !walletState.address) {
    showToast(t('toast.orders.connectWallet'), 'warning');
    return;
  }

  actionLoading.value = true;
  pendingHarvestRecord.value = record.key;
  actionStatusText.value = t('orders.status.waitingSignature');
  try {
    const contract = await getWriteStakingContract();
    if (!contract) throw new Error('NO_CONTRACT');
    console.log('[Contract Call] harvest() params:', {
      indices: [record.recordIndex]
    });
    const tx = await contract.harvest([record.recordIndex]);
    actionStatusText.value = t('orders.status.harvesting');
    showToast(t('toast.orders.harvestSubmitted'), 'success');
    await tx.wait();
    showToast(t('toast.orders.harvestSuccess'), 'success');
    await refreshAll();
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast(t('toast.orders.harvestCancelled'), 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast(t('toast.orders.harvestFailed'), 'error');
    }
  } finally {
    actionLoading.value = false;
    pendingHarvestRecord.value = null;
    actionStatusText.value = '';
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
  actionStatusText.value = t('orders.status.waitingSignature');
  try {
    const contract = await getWriteStakingContract();
    if (!contract) throw new Error('NO_CONTRACT');
    console.log('[Contract Call] unstake() params:', {
      indices: [pendingUnstakeRecord.value.recordIndex]
    });
    const tx = await contract.unstake([pendingUnstakeRecord.value.recordIndex]);
    actionStatusText.value = t('orders.status.unstaking');
    showToast(t('toast.orders.unstakeSubmitted'), 'success');
    await tx.wait();
    showToast(t('toast.orders.unstakeSuccess'), 'success');
    closeUnstakeConfirm();
    await refreshAll();
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast(t('toast.orders.unstakeCancelled'), 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast(t('toast.orders.unstakeFailed'), 'error');
    }
  } finally {
    actionLoading.value = false;
    actionStatusText.value = '';
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
  startRewardPolling();
});

onBeforeUnmount(() => {
  if (nowTimer) {
    clearInterval(nowTimer);
    nowTimer = null;
  }
  clearRewardTimer();
  resetRewardAnimationForTotals();
  cleanupRecordAnimationState(new Set());
});
</script>

<style scoped>
.page-shell {
  /* min-height: 100vh; */
  padding: 10px 0px;
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
  gap: 8px;
  border: 1px solid rgba(255, 109, 60, 0.15);
  border-radius: 10px;
  padding: 4px 14px;
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
  padding-top: 8px;
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
  font-variant-numeric: tabular-nums;
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
  padding: 8px 12px;
  background: linear-gradient(180deg, rgba(255, 89, 34, 0.08), rgba(255, 69, 0, 0.02));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  padding-bottom: 4px;
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
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cbb19d;
  font-size: 0.75rem;
}

.order-days p {
  margin: 0;
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
  display: block;
  margin-top: 4px;
}

.info-block {
  padding: 0;
}

.order-grid-horizontal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.row {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 20px;
  font-size: 0.8rem;
  /* gap: 2px; */
  flex: 1;
}

.order-grid-horizontal .row:first-child {
  align-items: flex-start;
  text-align: left;
}

.order-grid-horizontal .row:nth-child(2) {
  align-items: center;
  text-align: center;
}

.order-grid-horizontal .row:last-child {
  align-items: flex-end;
  text-align: right;
}

.row-horizontal {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: auto;
  gap: 8px;
}

.row-label {
  color: #cbb19d;
  font-size: 0.65rem;
}

.row-value {
  color: #f0d9c7;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}

.info-block.full-width {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed rgba(255, 164, 118, 0.15);
}

.info-block.full-width .row-horizontal .row-label {
  white-space: nowrap;
}

.info-block.full-width .row-horizontal .row-value {
  min-width: 0;
  text-align: right;
  white-space: nowrap;
}

.info-block.full-width .row-horizontal {
  display: grid;
  grid-template-columns: max-content 1fr;
  align-items: center;
  column-gap: 8px;
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
  margin-top: 6px;
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  border: 1px solid rgba(255, 130, 60, 0.45);
  border-radius: 8px;
  min-height: 28px;
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
  max-width: 360px;
  border-radius: 16px;
  border: 1px solid rgba(255, 109, 60, 0.25);
  background: linear-gradient(180deg, rgba(25, 14, 8, 0.98), rgba(14, 9, 7, 0.98));
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  color: #fff;
  padding: 20px;
}

.modal-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffe4cc;
}

.modal-desc {
  margin: 10px 0 0;
  color: #d7c0b0;
  font-size: 0.86rem;
  line-height: 1.5;
}

.highlight-rate {
  color: #ffc2a0;
  font-weight: 600;
}

.highlight-warn {
  color: #ff4500;
  font-weight: 600;
}

.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-btn {
  border: 1px solid rgba(201, 179, 162, 0.45);
  background: rgba(160, 130, 110, 0.1);
  color: #f2dac6;
  min-height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.modal-btn:hover:not(:disabled) {
  background: rgba(160, 130, 110, 0.2);
}

.modal-btn.primary {
  border-color: rgba(255, 130, 60, 0.45);
  background: rgba(255, 92, 31, 0.14);
  color: #ffd0a9;
  font-weight: 600;
}

.modal-btn.primary:hover:not(:disabled) {
  border-color: rgba(255, 130, 60, 0.72);
  background: rgba(255, 89, 34, 0.28);
  color: #fff0e4;
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
