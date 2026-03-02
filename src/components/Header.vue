<template>
    <div class="header-container" id="site-header">
        <div class="header-content">
            <!-- Logo -->
            <div class="logo-wrapper">
                <router-link to="/" class="logo-text">
                  MSKE
                </router-link>
            </div>

            <!-- Desktop Navigation (Structure Kept, Content Empty/Generic) -->
            <nav class="desktop-nav">
                <ul class="nav-list">
                    <!-- Navigation items placeholder -->
                </ul>
            </nav>

            <!-- Right Actions -->
            <div class="header-actions">
                <!-- Wallet Connect -->
                <a v-if="!walletState.isConnected" href="#" @click.prevent="openModal" class="connect-btn">
                    <span class="btn-text">{{ t('header.connectWallet') || 'Connect Wallet' }}</span>
                </a>
                <a v-else href="#" @click.prevent="openModal" class="connect-btn connected">
                    <span class="status-dot"></span>
                    <span class="address-text">{{ formattedAddress }}</span>
                </a>

                <!-- Language Selector -->
                <button class="action-btn lang-btn" @click="openLanguageModal" title="Change Language">
                    <span>🌐</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { walletState, formatAddress } from '@/services/wallet.js';
import { computed } from 'vue';
import { t } from '@/i18n';

export default {
  name: 'Header',
  setup() {
    const formattedAddress = computed(() => formatAddress(walletState.address));

    return {
      walletState,
      formattedAddress,
      t,
    };
  },
  methods: {
    openModal() {
      this.$emit('open-get-started-modal');
    },
    openLanguageModal() {
      this.$emit('open-language-modal');
    }
  }
}
</script>

<style scoped lang="scss">
/* LAYOUT ONLY STYLES */

.header-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: var(--header-height);
  z-index: 1000;
  /* Visual styles removed (background, border, shadow, radius) */
}

.header-content {
  max-width: var(--container-width, 1200px); /* Fallback added */
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Logo */
.logo-wrapper {
  flex-shrink: 0;
}

.logo-text {
  font-weight: bold;
  font-size: 20px;
  text-decoration: none;
  color: inherit; /* Inherit from parent/global */
}

/* Desktop Navigation */
.desktop-nav {
  display: none;

  @media (min-width: 992px) {
    display: block;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .nav-list {
    display: flex;
    align-items: center;
    gap: 40px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
}

/* Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  /* Visual styles removed */
}

/* Connect Wallet Button */
.connect-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  /* Visual styles removed (border, radius, background) */
  
  .status-dot {
    width: 8px;
    height: 8px;
    display: inline-block;
    background: green; /* kept minimal indicator */
    border-radius: 50%;
  }
}
</style>
