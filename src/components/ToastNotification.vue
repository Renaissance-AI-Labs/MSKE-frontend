<template>
  <transition name="toast-fade">
    <div v-if="notification.visible" class="toast-notification">
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
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background: #333;
  color: #fff;
  z-index: 9999;
  text-align: center;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
}
</style>
