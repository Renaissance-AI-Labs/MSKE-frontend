<template>
  <div class="page-shell">
    <div class="page-bg-glow"></div>

    <section class="page-header">
      <h1 class="page-title">好友</h1>
      <p class="page-subtitle">管理推荐关系与好友列表</p>
    </section>

    <section class="panel">
      <div class="panel-decor"></div>
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'recommendations' }"
          @click="activeTab = 'recommendations'"
        >
          我的推荐
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'friends' }"
          @click="activeTab = 'friends'"
        >
          我的好友
        </button>
      </div>

      <div class="tab-content" v-if="activeTab === 'recommendations'">
        <div class="friend-section">
          <h4 class="section-title">{{ t('bind.myReferrer') }}</h4>
          <p class="section-desc" v-if="!isBound">{{ t('bind.bindReferrerDesc') }}</p>
          <p class="section-desc success-text" v-else>{{ t('bind.bindSuccessDesc') }}</p>
          <div class="input-box">
            <textarea
              :value="displayReferrerInput"
              class="code-input code-textarea"
              :placeholder="t('bind.referrerPlaceholder')"
              :readonly="isBound || !walletState.isConnected"
              rows="1"
              ref="referrerTextarea"
              @focus="$event.target.select()"
              @input="handleReferrerInput"
            ></textarea>
            <button
              class="btn-action"
              @click="handleBindReferral"
              :disabled="bindButtonDisabled"
            >
              <span v-if="bindingReferrer">{{ t('bind.binding') }}</span>
              <span v-else>{{ isBound ? t('bind.bound') : t('bind.bind') }}</span>
            </button>
          </div>
        </div>

        <p v-if="!walletState.isConnected" class="compact-hint">
          {{ t('bind.connectWalletHint') }}
        </p>
        <p v-else-if="canBindReferrer === false && !isBound && referrerInput" class="compact-hint warning">
          {{ t('bind.referrerNotEligible') }}
        </p>

        <div class="friend-section link-section">
          <h4 class="section-title">{{ t('bind.myReferralLink') }}</h4>
          <p class="section-desc" v-if="isBound">{{ t('bind.referralLinkDesc') }}</p>
          <p class="section-desc" v-else>{{ t('bind.referralLinkLockedDesc') }}</p>
          <div class="input-box referral-box" :class="{ disabled: !isBound }">
            <textarea
              :value="displayReferralLink"
              readonly
              class="code-input code-textarea"
              rows="1"
              ref="referralTextarea"
              @focus="$event.target.select()"
            ></textarea>
            <button class="btn-action" @click="copyText(myReferralLink)" :disabled="!walletState.isConnected || !isBound">
              {{ t('bind.copy') }}
            </button>
          </div>
          <p class="section-hint" v-if="isBound">{{ t('bind.copyHint') }}</p>
          <p class="section-hint" v-else>{{ t('bind.copyHintLocked') }}</p>
        </div>
      </div>

      <div class="tab-content" v-else>
        <div class="section-block">
          <h4 class="section-title">{{ t('friends.myStatsTitle') }}</h4>
          <div class="stats-card">
            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-label">{{ t('friends.friendsCount') }}</span>
                <span class="stat-value">
                  {{ myStats.friendsCount }}
                  <span v-if="myStats.friendsCount !== PLACEHOLDER" class="unit">{{ t('friends.peopleUnit') }}</span>
                </span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-label">{{ t('friends.validFriendsCount') }}</span>
                <span class="stat-value">
                  {{ myStats.validFriendsCount }}
                  <span v-if="myStats.validFriendsCount !== PLACEHOLDER" class="unit">{{ t('friends.peopleUnit') }}</span>
                </span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-label">{{ t('friends.myStake') }}</span>
                <span class="stat-value">
                  {{ myStats.myStake }}
                  <span v-if="myStats.myStake !== PLACEHOLDER" class="unit">U</span>
                </span>
              </div>
            </div>

            <div class="stats-row-divider"></div>

            <div class="stats-row">
              <div class="stat-item">
                <span class="stat-label">{{ t('friends.teamCount') }}</span>
                <span class="stat-value">
                  {{ myStats.teamCount }}
                  <span v-if="myStats.teamCount !== PLACEHOLDER" class="unit">{{ t('friends.peopleUnit') }}</span>
                </span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-label">{{ t('friends.teamPerformance') }}</span>
                <span class="stat-value highlight">
                  {{ myStats.teamPerformance }}
                  <span v-if="myStats.teamPerformance !== PLACEHOLDER" class="unit">U</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="section-block">
          <div class="list-title-row">
            <h4 class="section-title">{{ t('friends.listTitle') }}</h4>
            <span class="page-indicator">{{ pageIndicator }}</span>
          </div>

          <div class="friend-card" v-if="currentFriend">
            <div class="card-header">
              <div class="avatar-circle">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <span class="address">{{ formatWalletAddress(currentFriend.address) }}</span>
            </div>

            <div class="friend-stats-grid">
              <div class="stat-box">
                <span class="stat-label">{{ t('friends.friendStake') }}</span>
                <span class="stat-value">
                  {{ currentFriend.friendStake }}
                  <span v-if="currentFriend.friendStake !== PLACEHOLDER" class="unit">U</span>
                </span>
              </div>
              <div class="stat-box">
                <span class="stat-label">{{ t('friends.teamCount') }}</span>
                <span class="stat-value">
                  {{ currentFriend.teamCount }}
                  <span v-if="currentFriend.teamCount !== PLACEHOLDER" class="unit">{{ t('friends.peopleUnit') }}</span>
                </span>
              </div>
              <div class="stat-box">
                <span class="stat-label">{{ t('friends.teamPerformance') }}</span>
                <span class="stat-value highlight">
                  {{ currentFriend.teamPerformance }}
                  <span v-if="currentFriend.teamPerformance !== PLACEHOLDER" class="unit">U</span>
                </span>
              </div>
            </div>
          </div>
          <div class="empty-state compact" v-else>
            <p>{{ walletState.isConnected ? t('home.noData') : t('bind.connectWalletHint') }}</p>
          </div>

          <div class="carousel-controls">
            <button class="nav-btn" @click="prevCard" :disabled="currentCardIndex === 0" aria-label="Previous friend">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"></path>
              </svg>
            </button>
            <button
              class="nav-btn"
              @click="nextCard"
              :disabled="currentCardIndex === friendList.length - 1 || friendList.length === 0"
              aria-label="Next friend"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <transition name="modal">
      <div v-if="isConfirmModalVisible" class="modal-mask confirm-mask">
        <div class="modal-container confirm-modal">
          <div class="modal-header">
            <h3>{{ t('bind.confirm.title') }}</h3>
          </div>
          <div class="modal-body">
            <p class="section-desc">{{ t('bind.confirm.desc') }}</p>
            <div class="confirm-address">{{ confirmAddress }}</div>
          </div>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" @click="closeConfirmModal">{{ t('bind.confirm.cancel') }}</button>
            <button
              class="confirm-btn primary"
              :disabled="confirmCountdown > 0 || bindingReferrer"
              @click="executeBindReferral"
            >
              {{ confirmCountdown > 0 ? t('bind.confirm.confirmWithCountdown', { seconds: confirmCountdown }) : t('bind.confirm.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ethers } from 'ethers';
import { walletState, formatAddress } from '@/services/wallet';
import { getContractAddress } from '@/services/contracts';
import { showToast } from '@/services/notification';
import referralAbi from '@/abis/referral.json';
import { t } from '@/i18n/index.js';

const route = useRoute();
const activeTab = ref('recommendations');
const PLACEHOLDER = '--';
const pageSize = 20;

const referrerInput = ref('');
const bindingReferrer = ref(false);
const checkingReferrer = ref(false);
const canBindReferrer = ref(null);
const isBound = ref(false);
const isConfirmModalVisible = ref(false);
const confirmAddress = ref('');
const confirmCountdown = ref(5);
const confirmTimer = ref(null);
const referrerTextarea = ref(null);
const referralTextarea = ref(null);

const myStats = ref({
  friendsCount: PLACEHOLDER,
  validFriendsCount: PLACEHOLDER,
  myStake: PLACEHOLDER,
  teamCount: PLACEHOLDER,
  teamPerformance: PLACEHOLDER
});
const friendList = ref([]);
const currentCardIndex = ref(0);

const currentFriend = computed(() => friendList.value[currentCardIndex.value] || null);
const pageIndicator = computed(() => {
  if (friendList.value.length === 0) {
    return '0 / 0';
  }
  return `${currentCardIndex.value + 1} / ${friendList.value.length}`;
});

const myReferralLink = computed(() => {
  if (!walletState.address) {
    return '';
  }
  return `${window.location.origin}${window.location.pathname}?ref=${walletState.address}`;
});

const displayReferralLink = computed(() => {
  if (!walletState.isConnected || !walletState.address) {
    return t('bind.connectWalletFirst');
  }
  if (!isBound.value) {
    return t('bind.linkLocked');
  }
  return myReferralLink.value;
});

const displayReferrerInput = computed(() => {
  if (!walletState.isConnected) {
    return t('bind.connectWalletFirst');
  }
  return referrerInput.value;
});

const bindButtonDisabled = computed(() => {
  if (!walletState.isConnected || isBound.value || bindingReferrer.value) return true;
  if (!referrerInput.value || !ethers.isAddress(referrerInput.value)) return true;
  if (walletState.address && referrerInput.value.toLowerCase() === walletState.address.toLowerCase()) return true;
  if (canBindReferrer.value === false || checkingReferrer.value) return true;
  return false;
});

const formatWalletAddress = (address) => {
  if (!address) {
    return PLACEHOLDER;
  }
  return formatAddress(address);
};

const getReadContract = async () => {
  const contractAddress = getContractAddress('Referral');
  if (!contractAddress || !window.ethereum) {
    return null;
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  return new ethers.Contract(contractAddress, referralAbi, provider);
};

const getWriteContract = async () => {
  const contractAddress = getContractAddress('Referral');
  if (!contractAddress || !window.ethereum) return null;
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(contractAddress, referralAbi, signer);
};

const adjustTextareaHeight = async () => {
  await nextTick();
  const textareaElements = [referrerTextarea.value, referralTextarea.value];
  textareaElements.forEach((el) => {
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  });
};

const normalizeReferrerInput = () => {
  if (!referrerInput.value) return;
  referrerInput.value = referrerInput.value.trim();
  if (ethers.isAddress(referrerInput.value)) {
    referrerInput.value = ethers.getAddress(referrerInput.value);
  }
};

const closeConfirmModal = () => {
  isConfirmModalVisible.value = false;
  if (confirmTimer.value) {
    clearInterval(confirmTimer.value);
    confirmTimer.value = null;
  }
};

const startConfirmCountdown = () => {
  closeConfirmModal();
  isConfirmModalVisible.value = true;
  confirmCountdown.value = 5;
  confirmTimer.value = setInterval(() => {
    if (confirmCountdown.value > 0) {
      confirmCountdown.value -= 1;
      return;
    }
    if (confirmTimer.value) {
      clearInterval(confirmTimer.value);
      confirmTimer.value = null;
    }
  }, 1000);
};

const checkUrlReferrer = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const refParam = urlParams.get('ref');
  if (!refParam || !ethers.isAddress(refParam)) return;
  if (!walletState.address) {
    referrerInput.value = refParam;
    return;
  }
  if (refParam.toLowerCase() === walletState.address.toLowerCase()) return;
  if (!isBound.value) {
    referrerInput.value = refParam;
  }
};

const checkReferrerEligible = async () => {
  if (!referrerInput.value || !ethers.isAddress(referrerInput.value)) {
    canBindReferrer.value = null;
    return;
  }
  if (walletState.address && referrerInput.value.toLowerCase() === walletState.address.toLowerCase()) {
    canBindReferrer.value = false;
    return;
  }

  checkingReferrer.value = true;
  try {
    const contract = await getReadContract();
    if (!contract) {
      canBindReferrer.value = null;
      return;
    }
    canBindReferrer.value = await contract.isBindReferral(referrerInput.value);
  } catch (error) {
    canBindReferrer.value = null;
  } finally {
    checkingReferrer.value = false;
  }
};

const fetchBindStatus = async () => {
  if (!walletState.isConnected || !walletState.address) {
    isBound.value = false;
    checkUrlReferrer();
    return;
  }

  try {
    const contract = await getReadContract();
    if (!contract) {
      checkUrlReferrer();
      return;
    }
    const onChainReferrer = await contract.getReferral(walletState.address);
    if (onChainReferrer && onChainReferrer !== ethers.ZeroAddress) {
      isBound.value = true;
      referrerInput.value = onChainReferrer;
      canBindReferrer.value = null;
      return;
    }
    isBound.value = false;
    checkUrlReferrer();
    await checkReferrerEligible();
  } catch (error) {
    isBound.value = false;
    checkUrlReferrer();
  } finally {
    await adjustTextareaHeight();
  }
};

const handleReferrerInput = (event) => {
  if (!walletState.isConnected || isBound.value) return;
  referrerInput.value = event.target.value;
};

const handleBindReferral = async () => {
  if (!walletState.isConnected) {
    showToast(t('toast.bind.connectWalletFirst'), 'warning');
    return;
  }
  if (!ethers.isAddress(referrerInput.value)) {
    showToast(t('toast.bind.invalidAddress'), 'error');
    return;
  }
  if (walletState.address && referrerInput.value.toLowerCase() === walletState.address.toLowerCase()) {
    showToast(t('toast.bind.selfBind'), 'error');
    return;
  }
  if (canBindReferrer.value === false) {
    showToast(t('toast.bind.referrerNotEligible'), 'error');
    return;
  }

  confirmAddress.value = referrerInput.value;
  startConfirmCountdown();
};

const executeBindReferral = async () => {
  bindingReferrer.value = true;
  closeConfirmModal();
  try {
    const contract = await getWriteContract();
    if (!contract) {
      throw new Error(t('toast.bind.contractUnavailable'));
    }

    const tx = await contract.bindReferral(confirmAddress.value);
    showToast(t('toast.bind.txSubmitted'), 'success');
    await tx.wait();

    referrerInput.value = confirmAddress.value;
    isBound.value = true;
    await adjustTextareaHeight();
    showToast(t('toast.bind.bindSuccess'), 'success');
  } catch (error) {
    if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') {
      showToast(t('toast.bind.txCancelled'), 'warning');
    } else if (error?.reason) {
      showToast(error.reason, 'error');
    } else {
      showToast(t('toast.bind.bindFailed'), 'error');
    }
  } finally {
    bindingReferrer.value = false;
  }
};

const copyText = (text) => {
  if (!isBound.value || !text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast(t('toast.bind.copySuccess'), 'success'))
      .catch(() => showToast(t('toast.bind.copyFailed'), 'error'));
    return;
  }
  showToast(t('toast.bind.copyFailed'), 'error');
};

const resetFriendsData = () => {
  myStats.value = {
    friendsCount: PLACEHOLDER,
    validFriendsCount: PLACEHOLDER,
    myStake: PLACEHOLDER,
    teamCount: PLACEHOLDER,
    teamPerformance: PLACEHOLDER
  };
  friendList.value = [];
  currentCardIndex.value = 0;
};

const loadFriendsData = async () => {
  if (!walletState.isConnected || !walletState.address) {
    resetFriendsData();
    return;
  }

  try {
    const contract = await getReadContract();
    if (!contract) {
      resetFriendsData();
      return;
    }

    const referralCountRaw = await contract.getReferralCount(walletState.address);
    myStats.value.friendsCount = referralCountRaw.toString();

    const allChildren = [];
    let cursor = 0;
    let keepLoading = true;
    let fetchRound = 0;

    while (keepLoading) {
      fetchRound += 1;
      if (fetchRound > 30) {
        break;
      }
      const result = await contract.getChildren(walletState.address, cursor, pageSize);
      const children = result[0] || [];
      const newCursor = Number(result[1]);
      const validChildren = children.filter((addr) => addr && addr !== ethers.ZeroAddress);
      allChildren.push(...validChildren);

      if (validChildren.length < pageSize) {
        keepLoading = false;
      } else {
        if (newCursor === cursor) {
          keepLoading = false;
          break;
        }
        cursor = newCursor;
      }
    }

    const uniqueChildren = [...new Set(allChildren.map((addr) => ethers.getAddress(addr)))];
    const teamCountResults = await Promise.allSettled(
      uniqueChildren.map((address) => contract.getTeamCount(address))
    );

    friendList.value = uniqueChildren.map((address, index) => ({
      address,
      friendStake: PLACEHOLDER,
      teamCount: teamCountResults[index].status === 'fulfilled' ? teamCountResults[index].value.toString() : PLACEHOLDER,
      teamPerformance: PLACEHOLDER
    }));

    myStats.value.teamCount = uniqueChildren.length.toString();

    if (currentCardIndex.value > friendList.value.length - 1) {
      currentCardIndex.value = 0;
    }
  } catch (error) {
    resetFriendsData();
  }
};

const prevCard = () => {
  if (currentCardIndex.value > 0) {
    currentCardIndex.value -= 1;
  }
};

const nextCard = () => {
  if (currentCardIndex.value < friendList.value.length - 1) {
    currentCardIndex.value += 1;
  }
};

const syncTabFromRoute = () => {
  const tab = route.query.tab;
  if (tab === 'friends' || tab === 'recommendations') {
    activeTab.value = tab;
  }
};

onMounted(async () => {
  syncTabFromRoute();
  await fetchBindStatus();
  if (activeTab.value === 'friends') {
    await loadFriendsData();
  }
});

watch(() => route.query.tab, () => {
  syncTabFromRoute();
});

watch(activeTab, async (tab) => {
  if (tab === 'recommendations') {
    await fetchBindStatus();
  } else {
    await loadFriendsData();
  }
});

watch(() => [walletState.address, walletState.isConnected], async () => {
  await fetchBindStatus();
  if (activeTab.value === 'friends') {
    await loadFriendsData();
  }
});

watch(referrerInput, async () => {
  await adjustTextareaHeight();
  if (!isBound.value) {
    normalizeReferrerInput();
    await checkReferrerEligible();
  }
});

onBeforeUnmount(() => {
  closeConfirmModal();
});
</script>

<style scoped>
.page-shell {
  min-height: 100vh;
  padding: 10px 20px 120px;
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
  padding: 18px;
  border-radius: 16px;
  background: rgba(21, 11, 6, 0.35);
  border: 1px solid rgba(255, 69, 0, 0.2);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.panel-decor {
  height: 3px;
  margin: -18px -18px 14px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 69, 0, 0.55) 50%, transparent 100%);
}

.tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
  padding: 6px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 1px solid rgba(255, 69, 0, 0.25);
  background: rgba(255, 69, 0, 0.08);
  color: #cfb49c;
  min-height: 44px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 0.04em;
  font-weight: 600;
  line-height: 1;
}

.tab-btn.active {
  color: #ffe0c7;
  background: rgba(255, 69, 0, 0.22);
  box-shadow: inset 0 0 0 1px rgba(255, 113, 68, 0.4);
}

.tab-btn:hover {
  color: #ffe0c7;
}

.tab-content {
  padding: 4px 2px 2px;
  display: grid;
}

.tab-content > * + * {
  margin-top: 12px;
}

.empty-state {
  min-height: 140px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 114, 67, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #af9f90;
}

.empty-state.compact {
  min-height: 110px;
}

.section-block {
  display: grid;
}

.section-block > * + * {
  margin-top: 8px;
}

.friend-section {
  display: grid;
}

.friend-section > * + * {
  margin-top: 8px;
}

.link-section {
  margin-top: 24px;
}

.section-title {
  margin: 0;
  font-size: 0.92rem;
  color: #ffcfac;
}

.section-desc {
  margin: 0;
  color: #d7c0b0;
  font-size: 0.82rem;
  line-height: 1.4;
}

.section-desc.success-text {
  color: #b9f8d0;
}

.compact-hint {
  margin: 2px 0 0;
  color: #bba392;
  font-size: 0.78rem;
}

.compact-hint.warning {
  color: #ffb38d;
}

.input-box {
  display: flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.25);
}

.input-box > * + * {
  margin-left: 8px;
}

.code-input {
  width: 100%;
  border: none;
  background: transparent;
  color: #fff;
  outline: none;
  font-size: 0.85rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.code-input::placeholder {
  color: #8f7c70;
}

.code-textarea {
  resize: none;
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.35;
  height: auto;
  overflow: hidden;
}

.btn-action {
  border: 1px solid rgba(255, 130, 60, 0.45);
  background: rgba(255, 92, 31, 0.14);
  color: #ffd0a9;
  padding: 7px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  font-size: 0.8rem;
}

.btn-action:hover:not(:disabled) {
  border-color: #ff4500;
  background: rgba(255, 69, 0, 0.28);
  color: #fff;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-box.referral-box {
  min-height: 58px;
}

.input-box.disabled {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
}

.input-box.disabled .code-input {
  color: #fff;
  opacity: 1;
  -webkit-text-fill-color: #fff;
}

.section-hint {
  margin: -2px 0 0;
  color: #bba392;
  font-size: 0.76rem;
}

.stats-card {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.22);
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stats-row-divider {
  height: 1px;
  margin: 9px 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
}

.stat-item {
  flex: 1;
  text-align: center;
  display: grid;
}

.stat-item > * + * {
  margin-top: 3px;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.12);
}

.stat-label {
  color: #d7c0b0;
  font-size: 0.72rem;
  line-height: 1.2;
}

.stat-value {
  color: #fff;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-value.highlight {
  color: #ffb073;
}

.unit {
  font-size: 0.72rem;
  font-weight: 400;
  color: #bca695;
}

.list-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-indicator {
  color: #bca695;
  font-size: 0.75rem;
}

.friend-card {
  border: 1px solid rgba(255, 130, 60, 0.25);
  border-radius: 12px;
  padding: 10px;
  background: linear-gradient(145deg, rgba(32, 18, 11, 0.72), rgba(14, 9, 7, 0.82));
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-header > * + * {
  margin-left: 8px;
}

.avatar-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffb073;
  background: rgba(255, 130, 60, 0.15);
}

.address {
  font-size: 0.88rem;
  color: #fff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.friend-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-top: 10px;
}

.stat-box {
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 8px 6px;
  text-align: center;
  background: rgba(0, 0, 0, 0.16);
  display: grid;
}

.stat-box > * + * {
  margin-top: 3px;
}

.carousel-controls {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.carousel-controls > * + * {
  margin-left: 8px;
}

.nav-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 130, 60, 0.55);
  background: rgba(255, 92, 31, 0.14);
  color: #ffd0a9;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  touch-action: manipulation;
}

.nav-btn:hover:not(:disabled) {
  border-color: #ff4500;
  background: rgba(255, 69, 0, 0.28);
  color: #fff;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  background: rgba(0, 0, 0, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 12px;
}

.confirm-mask {
  z-index: 2100;
}

.modal-container {
  width: 100%;
  max-width: 460px;
  border-radius: 14px;
  border: 1px solid rgba(255, 69, 0, 0.25);
  background: linear-gradient(180deg, rgba(20, 10, 5, 0.96), rgba(9, 6, 5, 0.96));
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.55);
  color: #fff;
}

.modal-header {
  padding: 12px 14px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #ffd2a4;
}

.modal-body {
  padding: 12px 14px 14px;
}

.confirm-address {
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.2);
  color: #fff;
  word-break: break-all;
  font-size: 0.84rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.confirm-actions {
  padding: 0 14px 14px;
  display: flex;
  justify-content: flex-end;
}

.confirm-actions > * + * {
  margin-left: 8px;
}

.confirm-btn {
  border: 1px solid rgba(255, 130, 60, 0.45);
  background: rgba(255, 92, 31, 0.14);
  color: #ffd0a9;
  padding: 7px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
}

.confirm-btn:hover:not(:disabled) {
  border-color: #ff4500;
  background: rgba(255, 69, 0, 0.28);
  color: #fff;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-btn.cancel {
  border-color: rgba(201, 179, 162, 0.45);
  background: rgba(160, 130, 110, 0.1);
}
</style>
