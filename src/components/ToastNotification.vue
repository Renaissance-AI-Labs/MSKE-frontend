<template>
  <transition name="toast-fade">
    <div v-if="notification.visible" class="toast-notification" :class="`toast-${notification.type}`">
      <span class="message">{{ notification.message }}</span>
    </div>
  </transition>
</template>

<script>
import { notificationState } from '../services/notification';

export default {
  name: 'ToastNotification',
  setup() {
    return {
      notification: notificationState,
    };
  }
};
</script>

<style scoped>
.toast-notification {
  position: fixed;
  top: 88px;
  left: 50%;
  transform: translateX(-50%);
  max-width: min(92vw, 560px);
  padding: 10px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: linear-gradient(180deg, rgba(22, 14, 10, 0.95), rgba(12, 9, 8, 0.95));
  color: #ffe7d1;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  z-index: 9999;
  text-align: center;
  font-size: 0.88rem;
  line-height: 1.35;
}

.toast-success {
  border-color: #ff4500;
  color: #ffe6cc;
}

.toast-error {
  border-color: rgba(255, 109, 109, 0.6);
  color: #ffd7d7;
}

.toast-warning {
  border-color: rgba(255, 186, 102, 0.6);
  color: #ffe8c7;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}
</style>
