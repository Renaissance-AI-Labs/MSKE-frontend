<template>
  <transition name="modal">
    <div v-if="modelValue" class="modal-mask" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ t('friends.modalTitle') }}</h3>
          <button class="icon-close" @click="closeModal" aria-label="Close"></button>
        </div>

        <div class="modal-body">
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

            <div class="carousel-controls">
              <button class="nav-btn" @click="prevCard" :disabled="currentCardIndex === 0" aria-label="Previous friend">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 18l-6-6 6-6"></path>
                </svg>
              </button>
              <button
                class="nav-btn"
                @click="nextCard"
                :disabled="currentCardIndex === friendList.length - 1"
                aria-label="Next friend"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18l6-6-6-6"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ethers } from 'ethers';
import { getContractAddress } from '@/services/contracts';
import { formatAddress } from '@/services/wallet';
import { t } from '@/i18n/index.js';
import referralAbi from '@/abis/referral.json';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  isConnected: { type: Boolean, default: false },
  userAddress: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue']);

const closeModal = () => {
  emit('update:modelValue', false);
};

const PLACEHOLDER = '--';
const pageSize = 20;

const formatWalletAddress = (address) => {
  if (!address) {
    return PLACEHOLDER;
  }
  return formatAddress(address);
};

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

const getReadContract = async () => {
  const contractAddress = getContractAddress('Referral');
  if (!contractAddress || !window.ethereum) {
    return null;
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  return new ethers.Contract(contractAddress, referralAbi, provider);
};

const resetData = () => {
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
  if (!props.isConnected || !props.userAddress) {
    resetData();
    return;
  }

  try {
    const contract = await getReadContract();
    if (!contract) {
      resetData();
      return;
    }

    const referralCountRaw = await contract.getReferralCount(props.userAddress);
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
      const result = await contract.getChildren(props.userAddress, cursor, pageSize);
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

    if (currentCardIndex.value > friendList.value.length - 1) {
      currentCardIndex.value = 0;
    }
  } catch (error) {
    resetData();
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

watch(() => props.modelValue, (visible) => {
  if (visible) {
    loadFriendsData();
  }
});

watch(() => [props.isConnected, props.userAddress], () => {
  if (!props.modelValue) {
    return;
  }
  loadFriendsData();
});
</script>

<style scoped>
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

.modal-container {
  width: 100%;
  max-width: 560px;
  border-radius: 14px;
  border: 1px solid rgba(255, 69, 0, 0.28);
  background: linear-gradient(180deg, rgba(20, 10, 5, 0.96), rgba(9, 6, 5, 0.96));
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.55);
  color: #fff;
}

.modal-header {
  padding: 12px 14px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #ffd2a4;
}

.icon-close {
  appearance: none;
  border: none;
  background: transparent;
  color: #c9b3a2;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1;
  padding: 2px;
}

.modal-body {
  padding: 12px 14px 14px;
  display: grid;
}

.modal-body > * + * {
  margin-top: 12px;
}

.section-block {
  display: grid;
}

.section-block > * + * {
  margin-top: 8px;
}

.section-title {
  margin: 0;
  font-size: 0.92rem;
  color: #ffcfac;
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

</style>
