<template>
  <nav class="bottom-nav" :class="{ hidden: !isNavVisible }" aria-label="Page Navigation">
    <router-link
      v-for="item in navItems"
      :key="item.name"
      class="nav-item"
      :class="{ active: route.name === item.name }"
      :to="item.path"
    >
      <span class="nav-icon" v-html="item.icon" aria-hidden="true"></span>
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { t } from '@/i18n/index.js';

const route = useRoute();
const isNavVisible = ref(true);
let revealTimer = null;

const navItems = computed(() => [
  {
    name: 'Home',
    path: '/',
    label: t('nav.home'),
    icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`
  },
  {
    name: 'Orders',
    path: '/orders',
    label: t('nav.orders'),
    icon: `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`
  },
  {
    name: 'Trade',
    path: '/trade',
    label: t('nav.trade'),
    icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m11 4 3 3-3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 17H10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m13 14-3 3 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  },
  {
    name: 'Friends',
    path: '/friends',
    label: t('nav.friends'),
    icon: `<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="10.5" r="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M13 19a3.8 3.8 0 0 1 7.5 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`
  },
  {
    name: 'InvestNB',
    path: '/invest-nb',
    label: t('nav.investNB'),
    icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  }
]);

const handleScroll = () => {
  isNavVisible.value = false;
  if (revealTimer) {
    clearTimeout(revealTimer);
  }
  revealTimer = setTimeout(() => {
    isNavVisible.value = true;
  }, 180);
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
  if (revealTimer) {
    clearTimeout(revealTimer);
  }
});
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 0px);
  transform: translate(-50%, 0);
  width: min(560px, calc(100% - 24px));
  padding: 10px 12px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  border-radius: 18px;
  background: rgba(15, 10, 8, 0.86);
  border: 1px solid rgba(255, 99, 50, 0.2);
  backdrop-filter: blur(14px);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.48);
  z-index: 1200;
  transition: transform 0.25s ease, opacity 0.2s ease;
}

.bottom-nav.hidden {
  transform: translate(-50%, calc(100% + 10px));
  opacity: 0;
  pointer-events: none;
}

.nav-item {
  min-height: 58px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 12px;
  color: #b8ad9f;
  transition: all 0.25s ease;
}

.nav-icon {
  width: 22px;
  height: 22px;
  display: inline-flex;
}

.nav-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.nav-label {
  font-size: 12px;
  letter-spacing: 0.08em;
}

.nav-item.active {
  color: #ffd9b5;
  background: rgba(255, 69, 0, 0.16);
  box-shadow: inset 0 0 0 1px rgba(255, 69, 0, 0.35);
}

.nav-item:not(.active):hover {
  color: #f7c89b;
  background: rgba(255, 69, 0, 0.08);
}
</style>
