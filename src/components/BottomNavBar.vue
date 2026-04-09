<template>
  <div ref="navShellRef" class="bottom-nav-shell" :class="{ hidden: !isNavVisible }">
    <transition name="invest-panel">
      <div v-if="isInvestPanelOpen" id="invest-entry-panel" class="invest-panel" aria-label="Investment Entry Panel">
        <router-link
          v-for="item in investEntries"
          :key="item.name"
          class="invest-card"
          :class="[`invest-card--${item.tone}`, { active: route.name === item.name }]"
          :to="item.path"
          :title="item.description"
          @click="closeInvestPanel"
        >
          <span class="invest-card-icon" v-html="item.icon" aria-hidden="true"></span>
          <span class="invest-card-title">{{ item.label }}</span>
        </router-link>
      </div>
    </transition>

    <nav class="bottom-nav" aria-label="Page Navigation">
      <router-link
        v-for="item in leadingNavItems"
        :key="item.name"
        class="nav-item"
        :class="{ active: route.name === item.name }"
        :to="item.path"
        @click="closeInvestPanel"
      >
        <span class="nav-icon" v-html="item.icon" aria-hidden="true"></span>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>

      <button
        type="button"
        class="nav-item nav-item--invest"
        :class="{ active: isInvestActive, expanded: isInvestPanelOpen }"
        aria-controls="invest-entry-panel"
        :aria-expanded="isInvestPanelOpen"
        @click="toggleInvestPanel"
      >
        <span class="nav-icon" v-html="investButtonIcon" aria-hidden="true"></span>
        <span class="nav-label">{{ t('nav.invest') }}</span>
      </button>

      <router-link
        v-for="item in trailingNavItems"
        :key="item.name"
        class="nav-item"
        :class="{ active: route.name === item.name }"
        :to="item.path"
        @click="closeInvestPanel"
      >
        <span class="nav-icon" v-html="item.icon" aria-hidden="true"></span>
        <span class="nav-label">{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { t } from '@/i18n/index.js';

const route = useRoute();
const navShellRef = ref(null);
const isNavVisible = ref(true);
const isInvestPanelOpen = ref(false);
let revealTimer = null;

const homeIcon = `<svg viewBox="0 0 24 24" fill="none"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;
const ordersIcon = `<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const tradeIcon = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m11 4 3 3-3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 17H10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m13 14-3 3 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const friendsIcon = `<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="3" stroke="currentColor" stroke-width="1.8"/><circle cx="16.5" cy="10.5" r="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M13 19a3.8 3.8 0 0 1 7.5 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const investButtonIcon = `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m6.2 6.2 2.8 2.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M3 12h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m17 9 2.8-2.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z" stroke="currentColor" stroke-width="1.8"/><path d="m10.8 12 1 1 2.4-2.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const leadingNavItems = computed(() => [
  {
    name: 'Home',
    path: '/',
    label: t('nav.home'),
    icon: homeIcon
  },
  {
    name: 'Orders',
    path: '/orders',
    label: t('nav.orders'),
    icon: ordersIcon
  }
]);

const trailingNavItems = computed(() => [
  {
    name: 'Trade',
    path: '/trade',
    label: t('nav.trade'),
    icon: tradeIcon
  },
  {
    name: 'Friends',
    path: '/friends',
    label: t('nav.friends'),
    icon: friendsIcon
  }
]);

const investEntries = computed(() => [
  {
    name: 'InvestNB',
    path: '/invest-nb',
    label: t('investHub.nb'),
    description: t('investHub.nbDesc'),
    tone: 'warm',
    icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  },
  {
    name: 'InvestLobster',
    path: '/invest-lobster',
    label: t('investHub.lobster'),
    description: t('investHub.lobsterDesc'),
    tone: 'lobster',
    icon: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 4c2.6 0 4.8 1.3 6 3.2M12 4c-2.6 0-4.8 1.3-6 3.2M12 4v3M6 7.2 4.5 5.7M18 7.2l1.5-1.5M8 11.5c0 2.2 1.8 4 4 4s4-1.8 4-4M7.4 12.5 5 14.5M16.6 12.5l2.4 2M9.2 15.3 8 20M14.8 15.3 16 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 10.5h.01M15 10.5h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`
  }
]);

const isInvestPage = computed(() => investEntries.value.some((item) => item.name === route.name));
const isInvestActive = computed(() => isInvestPanelOpen.value || isInvestPage.value);

const closeInvestPanel = () => {
  isInvestPanelOpen.value = false;
};

const toggleInvestPanel = () => {
  isInvestPanelOpen.value = !isInvestPanelOpen.value;
  isNavVisible.value = true;
};

const handleScroll = () => {
  isNavVisible.value = false;
  closeInvestPanel();
  if (revealTimer) {
    clearTimeout(revealTimer);
  }
  revealTimer = setTimeout(() => {
    isNavVisible.value = true;
  }, 180);
};

const handleDocumentPointerDown = (event) => {
  if (!isInvestPanelOpen.value) return;
  if (navShellRef.value?.contains(event.target)) return;
  closeInvestPanel();
};

const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closeInvestPanel();
  }
};

watch(() => route.fullPath, () => {
  closeInvestPanel();
});

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('pointerdown', handleDocumentPointerDown);
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('pointerdown', handleDocumentPointerDown);
  document.removeEventListener('keydown', handleEscape);
  if (revealTimer) {
    clearTimeout(revealTimer);
  }
});
</script>

<style scoped>
.bottom-nav-shell {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 0px);
  transform: translate(-50%, 0);
  width: min(560px, calc(100% - 24px));
  z-index: 1200;
  transition: transform 0.25s ease, opacity 0.2s ease;
}

.bottom-nav-shell.hidden {
  transform: translate(-50%, calc(100% + 10px));
  opacity: 0;
  pointer-events: none;
}

.bottom-nav {
  padding: 10px 12px 12px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  border-radius: 18px;
  background: rgba(15, 10, 8, 0.88);
  border: 1px solid rgba(255, 99, 50, 0.2);
  backdrop-filter: blur(14px);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.48);
}

.invest-panel {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: fit-content;
  max-width: calc(100% - 56px);
  bottom: calc(100% + 12px);
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(16, 10, 8, 0.96), rgba(10, 7, 5, 0.94));
  border: 1px solid rgba(255, 120, 66, 0.18);
  backdrop-filter: blur(18px);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.36);
}

.invest-panel::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -7px;
  width: 14px;
  height: 14px;
  transform: translateX(-50%) rotate(45deg);
  background: rgba(10, 7, 5, 0.94);
  border-right: 1px solid rgba(255, 120, 66, 0.18);
  border-bottom: 1px solid rgba(255, 120, 66, 0.18);
}

.invest-card {
  width: 72px;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  text-align: center;
  color: #f9e7d4;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.invest-card--warm {
  background: linear-gradient(180deg, rgba(255, 107, 43, 0.2), rgba(48, 22, 10, 0.88));
}

.invest-card--lobster {
  background: linear-gradient(180deg, rgba(255, 118, 64, 0.26), rgba(86, 28, 15, 0.9));
}

.invest-card--lobster .invest-card-icon {
  background: rgba(255, 146, 98, 0.14);
}

.invest-card--lobster.active,
.invest-card--lobster:hover {
  border-color: rgba(255, 172, 128, 0.52);
  box-shadow: 0 12px 24px rgba(255, 96, 43, 0.2);
}

.invest-card.active,
.invest-card:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 205, 162, 0.42);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.22);
}

.invest-card-icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.08);
}

.invest-card-icon :deep(svg) {
  width: 15px;
  height: 15px;
}

.invest-card-title {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0.02em;
  word-break: break-word;
}

.nav-item {
  min-height: 58px;
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 12px;
  color: #b8ad9f;
  font: inherit;
  transition: all 0.25s ease;
  cursor: pointer;
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
  white-space: nowrap;
}

.nav-item:not(.nav-item--invest).active {
  color: #ffd9b5;
  background: rgba(255, 69, 0, 0.16);
  box-shadow: inset 0 0 0 1px rgba(255, 69, 0, 0.35);
}

.nav-item:not(.nav-item--invest):not(.active):hover {
  color: #f7c89b;
  background: rgba(255, 69, 0, 0.08);
}

.nav-item--invest {
  position: relative;
  min-height: 58px;
  color: #fff3df;
  background: linear-gradient(180deg, rgba(255, 129, 73, 0.26) 0%, rgba(255, 91, 37, 0.16) 100%);
  border: none;
  box-shadow: inset 0 1px 0 rgba(255, 241, 226, 0.14), 0 8px 18px rgba(255, 91, 37, 0.12);
}

.nav-item--invest::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 50%;
  width: 22px;
  height: 2px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 236, 214, 0), rgba(255, 236, 214, 0.88), rgba(255, 236, 214, 0));
}

.nav-item--invest .nav-icon {
  width: 22px;
  height: 22px;
}

.nav-item--invest .nav-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.nav-item--invest.active,
.nav-item--invest.expanded,
.nav-item--invest:hover {
  color: #fffaf3;
  background: linear-gradient(180deg, rgba(255, 150, 95, 0.34) 0%, rgba(255, 102, 49, 0.22) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 245, 235, 0.22), 0 10px 20px rgba(255, 104, 47, 0.18);
}

.invest-panel-enter-active,
.invest-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.invest-panel-enter-from,
.invest-panel-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

@media (max-width: 420px) {
  .invest-panel {
    max-width: calc(100% - 40px);
    padding: 6px;
    gap: 6px;
  }

  .invest-card {
    width: 64px;
    padding: 6px 4px;
  }

  .invest-card-title {
    font-size: 10px;
  }

  .nav-label {
    font-size: 11px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bottom-nav-shell,
  .nav-item,
  .invest-card,
  .invest-panel-enter-active,
  .invest-panel-leave-active {
    transition: none;
  }
}
</style>
