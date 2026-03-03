<template>
  <transition name="modal">
    <div v-if="modelValue" class="modal-mask" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ t('bind.modalTitle') }}</h3>
          <button class="icon-close" @click="closeModal"></button>
        </div>

        <div class="modal-body">
          <div class="friend-section">
            <h4 class="section-title">{{ t('bind.myReferrer') }}</h4>
            <p class="section-desc" v-if="!isBound">{{ t('bind.bindReferrerDesc') }}</p>
            <p class="section-desc success-text" v-else>{{ t('bind.bindSuccessDesc') }}</p>
            <div class="input-box">
              <textarea
                :value="displayReferrerInput"
                class="code-input code-textarea"
                :placeholder="t('bind.referrerPlaceholder')"
                :readonly="isBound || !isConnected"
                rows="1"
                ref="referrerTextarea"
                @focus="$event.target.select()"
                @input="handleReferrerInput"
              ></textarea>
              <button
                class="btn-bind"
                @click="handleBindReferral"
                :disabled="bindButtonDisabled"
              >
                <span v-if="bindingReferrer">{{ t('bind.binding') }}</span>
                <span v-else>{{ isBound ? t('bind.bound') : t('bind.bind') }}</span>
              </button>
            </div>
          </div>

          <p v-if="!isConnected" class="compact-hint">
            {{ t('bind.connectWalletHint') }}
          </p>
          <p v-else-if="canBindReferrer === false && !isBound && referrerInput" class="compact-hint warning">
            {{ t('bind.referrerNotEligible') }}
          </p>

          <div class="friend-section">
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
              <button class="btn-copy" @click="copyText(myReferralLink)" :disabled="!isConnected || !isBound">
                {{ t('bind.copy') }}
              </button>
            </div>
            <p class="section-hint" v-if="isBound">{{ t('bind.copyHint') }}</p>
            <p class="section-hint" v-else>{{ t('bind.copyHintLocked') }}</p>
          </div>
        </div>
      </div>
    </div>
  </transition>

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
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { ethers } from 'ethers';
import { getContractAddress } from '@/services/contracts';
import { showToast } from '@/services/notification';
import referralAbi from '@/abis/referral.json';
import { t } from '@/i18n/index.js';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  isConnected: { type: Boolean, default: false },
  userAddress: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue']);

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

const myReferralLink = computed(() => {
  if (!props.userAddress) {
    return '';
  }
  return `${window.location.origin}${window.location.pathname}?ref=${props.userAddress}`;
});

const displayReferralLink = computed(() => {
  if (!props.isConnected || !props.userAddress) {
    return t('bind.connectWalletFirst');
  }
  if (!isBound.value) {
    return t('bind.linkLocked');
  }
  return myReferralLink.value;
});

const displayReferrerInput = computed(() => {
  if (!props.isConnected) {
    return t('bind.connectWalletFirst');
  }
  return referrerInput.value;
});

const bindButtonDisabled = computed(() => {
  if (!props.isConnected || isBound.value || bindingReferrer.value) return true;
  if (!referrerInput.value || !ethers.isAddress(referrerInput.value)) return true;
  if (props.userAddress && referrerInput.value.toLowerCase() === props.userAddress.toLowerCase()) return true;
  if (canBindReferrer.value === false) return true;
  return false;
});

const closeModal = () => {
  emit('update:modelValue', false);
};

const handleReferrerInput = (event) => {
  if (!props.isConnected || isBound.value) return;
  referrerInput.value = event.target.value;
};

const getReadContract = async () => {
  const contractAddress = getContractAddress('Referral');
  if (!contractAddress) return null;

  let provider = null;
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
  }
  if (!provider) return null;

  return new ethers.Contract(contractAddress, referralAbi, provider);
};

const getWriteContract = () => {
  const contractAddress = getContractAddress('Referral');
  if (!contractAddress || !window.ethereum) return null;
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner().then((signer) => new ethers.Contract(contractAddress, referralAbi, signer));
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
  if (!props.userAddress) {
    referrerInput.value = refParam;
    return;
  }
  if (refParam.toLowerCase() === props.userAddress.toLowerCase()) return;
  if (!isBound.value) {
    referrerInput.value = refParam;
  }
};

const fetchBindStatus = async () => {
  if (!props.isConnected || !props.userAddress) {
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

    const onChainReferrer = await contract.getReferral(props.userAddress);
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
  }
};

const checkReferrerEligible = async () => {
  if (!referrerInput.value || !ethers.isAddress(referrerInput.value)) {
    canBindReferrer.value = null;
    return;
  }

  if (props.userAddress && referrerInput.value.toLowerCase() === props.userAddress.toLowerCase()) {
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

const handleBindReferral = async () => {
  if (!props.isConnected) {
    showToast(t('toast.bind.connectWalletFirst'), 'warning');
    return;
  }
  if (!ethers.isAddress(referrerInput.value)) {
    showToast(t('toast.bind.invalidAddress'), 'error');
    return;
  }
  if (props.userAddress && referrerInput.value.toLowerCase() === props.userAddress.toLowerCase()) {
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

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      showToast(t('toast.bind.copySuccess'), 'success');
    } else {
      throw new Error('Copy failed');
    }
  } catch (error) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast(t('toast.bind.copySuccess'), 'success'))
        .catch(() => showToast(t('toast.bind.copyFailed'), 'error'));
    } else {
      showToast(t('toast.bind.copyFailed'), 'error');
    }
  }
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

watch(() => props.modelValue, async (visible) => {
  if (visible) {
    await fetchBindStatus();
    await adjustTextareaHeight();
  } else {
    closeConfirmModal();
  }
});

watch(() => [props.userAddress, props.isConnected], async () => {
  if (props.modelValue) {
    await fetchBindStatus();
    await adjustTextareaHeight();
  }
});

watch(referrerInput, () => {
  adjustTextareaHeight();
  if (!isBound.value) {
    normalizeReferrerInput();
    checkReferrerEligible();
  }
});

onBeforeUnmount(() => {
  closeConfirmModal();
});
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 12px;
}

.modal-container {
  width: 100%;
  max-width: 520px;
  border-radius: 14px;
  border: 1px solid rgba(255, 69, 0, 0.25);
  background: linear-gradient(180deg, rgba(20, 10, 5, 0.96), rgba(9, 6, 5, 0.96));
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
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
  font-size: 1.1rem;
  line-height: 1;
  padding: 0;
}

.modal-body {
  padding: 12px 14px 14px;
  display: grid;
}

.modal-body > * + * {
  margin-top: 30px;
}

.compact-hint {
  margin: 0;
  color: #bba392;
  font-size: 0.78rem;
}

.compact-hint.warning {
  color: #ffb38d;
}

.friend-section {
  display: grid;
}

.friend-section > * + * {
  margin-top: 8px;
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

.btn-bind,
.btn-copy {
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

.btn-bind:hover:not(:disabled),
.btn-copy:hover:not(:disabled) {
  border-color: #ff4500;
  background: rgba(255, 69, 0, 0.28);
  color: #fff;
}

.btn-bind:disabled,
.btn-copy:disabled {
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

.code-textarea {
  resize: none;
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.35;
  height: auto;
  overflow: hidden;
}

.section-hint {
  margin: -2px 0 0;
  color: #bba392;
  font-size: 0.76rem;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.confirm-mask {
  z-index: 2100;
}

.confirm-modal {
  max-width: 460px;
}

.confirm-address {
  margin-top: 2px;
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

@media (max-width: 420px) {
  .btn-bind,
  .btn-copy {
    padding: 7px 8px;
  }
}
</style>
