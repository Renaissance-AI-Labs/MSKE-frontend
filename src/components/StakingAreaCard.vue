<template>
  <section class="staking-card">
    <div class="card-decor"></div>
    <h2 class="card-title">生态质押</h2>
    <p class="card-desc">质押简介占位：该板块将用于介绍生态质押规则、收益节奏与参与说明。</p>

    <div class="input-wrap">
      <label class="input-label">投入 USDT</label>
      <input
        v-model="stakeAmount"
        class="amount-input"
        type="text"
        inputmode="decimal"
        :placeholder="amountPlaceholder"
        @input="onAmountInput"
      />
      <p class="balance-hint">USDT 余额：{{ usdtBalanceText }}</p>
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
import erc20Abi from '@/abis/erc20.json';
import stakingAbi from '@/abis/staking.json';
import referralAbi from '@/abis/referral.json';

const DEFAULT_MIN_STAKE = 200;
const DEFAULT_DECIMALS = 18;
const stakeAmount = ref('');
const usdtBalanceRaw = ref(0n);
const minStakeRaw = ref(ethers.parseUnits(String(DEFAULT_MIN_STAKE), DEFAULT_DECIMALS));
const allowanceRaw = ref(0n);
const hasReferrer = ref(false);
const usdtDecimals = ref(DEFAULT_DECIMALS);
const loadingData = ref(false);
const checkingAllowance = ref(false);
const approving = ref(false);
const staking = ref(false);

const usdtAddress = computed(() => getContractAddress('USDT'));
const stakingAddress = computed(() => getContractAddress('Staking'));
const referralAddress = computed(() => getContractAddress('Referral'));

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
const amountPlaceholder = computed(() => `最少投入${minStakeText.value}U`);
const hasValidAmount = computed(() => Boolean(parsedStakeAmount.value && parsedStakeAmount.value > 0n));
const needsApproval = computed(() => {
  if (!hasValidAmount.value) return false;
  return allowanceRaw.value < parsedStakeAmount.value;
});

const primaryButtonText = computed(() => {
  if (loadingData.value || checkingAllowance.value) return '状态加载中...';
  if (approving.value) return '授权中...';
  if (staking.value) return '参与中...';
  if (!hasWalletReady.value) return '请先连接钱包';
  if (!isContractsConfigured.value) return '合约未配置';
  if (!hasReferrer.value) return '质押前请先绑定推荐人';
  if (!stakeAmount.value) return amountPlaceholder.value;
  if (!hasValidAmount.value) return '请输入有效金额';
  if (parsedStakeAmount.value < minStakeRaw.value) return `${minStakeText.value}U 起步`;
  if (parsedStakeAmount.value > usdtBalanceRaw.value) return 'USDT 余额不足';
  if (needsApproval.value) return '授权 USDT';
  return '参与生态';
});

const actionDisabled = computed(() => {
  return approving.value || staking.value || loadingData.value || checkingAllowance.value || !isContractsConfigured.value;
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
    usdtBalanceRaw.value = 0n;
    minStakeRaw.value = ethers.parseUnits(String(DEFAULT_MIN_STAKE), DEFAULT_DECIMALS);
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

    const [decimalsRaw, balanceRaw, minStakeAmountRaw, referrerAddress] = await Promise.all([
      usdt.decimals(),
      usdt.balanceOf(walletState.address),
      stake.minStakeAmount(),
      referral.getReferral(walletState.address)
    ]);

    usdtDecimals.value = Number(decimalsRaw);
    usdtBalanceRaw.value = balanceRaw;
    minStakeRaw.value = minStakeAmountRaw > 0n
      ? minStakeAmountRaw
      : ethers.parseUnits(String(DEFAULT_MIN_STAKE), usdtDecimals.value);
    hasReferrer.value = Boolean(referrerAddress && referrerAddress !== ethers.ZeroAddress);
    allowanceRaw.value = await usdt.allowance(walletState.address, stakingAddress.value);
  } catch (error) {
    usdtBalanceRaw.value = 0n;
    minStakeRaw.value = ethers.parseUnits(String(DEFAULT_MIN_STAKE), usdtDecimals.value);
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
    showToast('请先连接钱包', 'warning');
    return;
  }

  approving.value = true;
  try {
    const usdt = new ethers.Contract(usdtAddress.value, erc20Abi, signer);
    const tx = await usdt.approve(stakingAddress.value, ethers.MaxUint256);
    showToast('授权交易已提交', 'success');
    await tx.wait();
    await refreshAllowance();
    showToast('USDT 授权成功', 'success');
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast('已取消授权', 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast('授权失败，请稍后重试', 'error');
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
    showToast('请先连接钱包', 'warning');
    return;
  }

  staking.value = true;
  try {
    const usdt = new ethers.Contract(usdtAddress.value, erc20Abi, signer);
    const stakeContract = new ethers.Contract(stakingAddress.value, stakingAbi, signer);
    const userAddress = walletState.address;
    const allowance = await usdt.allowance(userAddress, stakingAddress.value);

    if (allowance < parsedStakeAmount.value) {
      showToast('授权额度不足，请先授权 USDT', 'warning');
      return;
    }

    const tx = await stakeContract.stake(parsedStakeAmount.value, 0n);
    showToast('质押交易已提交', 'success');
    await tx.wait();
    showToast('参与生态成功', 'success');
    stakeAmount.value = '';
    await refreshCardData();
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast('已取消质押', 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast('质押失败，请稍后重试', 'error');
    }
  } finally {
    staking.value = false;
  }
}

async function handlePrimaryAction() {
  if (!hasWalletReady.value) {
    showToast('请先连接钱包', 'warning');
    return;
  }
  if (!isContractsConfigured.value) {
    showToast('合约地址未完整配置', 'error');
    return;
  }
  if (!hasReferrer.value) {
    showToast('质押前请先绑定推荐人', 'warning');
    return;
  }
  if (!hasValidAmount.value) {
    showToast('请输入有效金额', 'warning');
    return;
  }
  if (parsedStakeAmount.value < minStakeRaw.value) {
    showToast(`最低参与门槛为 ${minStakeText.value}U`, 'warning');
    return;
  }
  if (parsedStakeAmount.value > usdtBalanceRaw.value) {
    showToast('USDT 余额不足', 'warning');
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
  await refreshCardData();
});
</script>

<style scoped>
.staking-card {
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

.staking-card:hover {
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

.input-wrap {
  margin-top: 12px;
}

.input-label {
  display: block;
  margin-bottom: 7px;
  font-size: 0.82rem;
  color: #d7c0b0;
}

.amount-input {
  width: 100%;
  height: 50px;
  border-radius: 10px;
  border: 1px solid rgba(255, 114, 67, 0.32);
  background: rgba(14, 9, 7, 0.8);
  outline: none;
  color: #fff;
  /* font-size: 1.4rem; */
  font-weight: 700;
  line-height: 50px;
  padding: 0 12px;
}

.amount-input::placeholder {
  color: #8f7c70;
  font-size: 1rem;
  font-weight: 500;
}

.balance-hint {
  margin: 8px 2px 0;
  text-align: right;
  color: rgba(222, 197, 177, 0.72);
  font-size: 0.76rem;
}

.actions {
  margin-top: 10px;
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
  .staking-card {
    padding: 12px;
  }

  .card-decor {
    margin: -12px -12px 12px;
  }

  .actions {
    display: block;
  }
}
</style>
