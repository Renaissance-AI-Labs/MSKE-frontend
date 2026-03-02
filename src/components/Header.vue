<template>
    <div class="header-container" id="site-header">
        <div class="header-content">
            <!-- Logo -->
            <div class="logo-wrapper">
                <router-link to="/" class="logo" aria-label="MSKE Home">
                    <img src="/asset/images/logo/MSKE-logo-all-row.png" alt="MSKE Logo" class="logo-img" />
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
                <button v-if="!walletState.isConnected" @click.prevent="openModal" class="btn btn-theme connect-btn">
                    <span>{{ t('header.connectWallet') || 'Connect Wallet' }}</span>
                </button>
                <button v-else @click.prevent="openModal" class="btn btn-theme connect-btn connected">
                    <span class="status-dot"></span>
                    <span>{{ formattedAddress }}</span>
                </button>

                <!-- Language Selector -->
                <div class="lang-selector">
                    <button class="action-btn lang-btn" :class="{ 'menu-open': isLangMenuOpen }" @click.stop="toggleLanguageMenu" title="Change Language">
                        <span class="lang-text">{{ currentLanguage.toUpperCase() }}</span>
                        <svg class="arrow-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    
                    <!-- Language Dropdown -->
                    <transition name="fade">
                        <div v-if="isLangMenuOpen" class="lang-dropdown" @click.stop>
                            <button 
                                v-for="lang in availableLanguages" 
                                :key="lang.code"
                                class="lang-option"
                                :class="{ active: currentLanguage === lang.code }"
                                @click="handleLanguageSelect(lang.code)"
                            >
                                {{ lang.name }}
                            </button>
                        </div>
                    </transition>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { walletState, formatAddress } from '@/services/wallet.js';
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { t, availableLanguages, currentLanguage, setLanguage } from '@/i18n';

export default {
  name: 'Header',
  setup() {
    const formattedAddress = computed(() => formatAddress(walletState.address));
    const isLangMenuOpen = ref(false);

    const toggleLanguageMenu = () => {
      isLangMenuOpen.value = !isLangMenuOpen.value;
    };

    const closeLanguageMenu = () => {
      isLangMenuOpen.value = false;
    };

    const handleLanguageSelect = (code) => {
      setLanguage(code);
      closeLanguageMenu();
    };

    // Close dropdown when clicking outside
    onMounted(() => {
      document.addEventListener('click', closeLanguageMenu);
    });

    onUnmounted(() => {
      document.removeEventListener('click', closeLanguageMenu);
    });

    return {
      walletState,
      formattedAddress,
      t,
      isLangMenuOpen,
      toggleLanguageMenu,
      availableLanguages,
      currentLanguage,
      handleLanguageSelect
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
.header-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 64px;
  z-index: 1000;
  background: rgba(15, 15, 15, 0.8);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease-out;
}

.header-content {
  max-width: 1200px;
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

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.logo-img {
  height: 32px;
  width: auto;
  object-fit: contain;
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
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .nav-list > * {
    margin-right: 40px;
  }
  .nav-list > *:last-child {
    margin-right: 0;
  }
}

/* Actions */
.header-actions {
  display: flex;
  align-items: center;
}
.header-actions > * {
  margin-right: 16px;
}
.header-actions > *:last-child {
  margin-right: 0;
}

.lang-selector {
  position: relative;
}

.action-btn {
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover, &.menu-open {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 69, 0, 0.3);
    color: #ff4500;
  }
}

.arrow-icon {
  transition: transform 0.3s ease;
}

.lang-selector:hover .arrow-icon,
.menu-open .arrow-icon {
  transform: rotate(180deg);
}

.lang-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: rgba(15, 15, 15, 0.95);
  border: 1px solid rgba(255, 69, 0, 0.2);
  border-radius: 12px;
  padding: 8px;
  min-width: 120px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  z-index: 1001;
}

.lang-dropdown > * {
  margin-bottom: 4px;
}
.lang-dropdown > *:last-child {
  margin-bottom: 0;
}

.lang-option {
  width: 100%;
  text-align: left;
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: #a0a0a0;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
  }

  &.active {
    color: #ff4500;
    background: rgba(255, 69, 0, 0.1);
    font-weight: 600;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Base Button Style */
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  min-height: 44px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
  color: #fff;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  overflow: hidden;
  isolation: isolate;
  transition: transform 0.15s cubic-bezier(0.68, -0.55, 0.265, 1.55), box-shadow 0.15s ease-out;
}

.btn > * {
  margin-right: 8px;
}
.btn > *:last-child {
  margin-right: 0;
}

.btn span {
  position: relative;
  z-index: 1;
}

/* Theme Gradient Button */
.btn-theme {
  background: linear-gradient(135deg, #ff4500, #ff8c00);
  box-shadow: 0 0 20px rgba(255, 69, 0, 0.4);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 25px rgba(255, 69, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

/* Connect Wallet Button */
.connect-btn {
  .status-dot {
    width: 8px;
    height: 8px;
    display: inline-block;
    background: #00ff00;
    border-radius: 50%;
    box-shadow: 0 0 8px #00ff00;
    margin-right: 4px;
  }
}

@media (max-width: 640px) {
  .header-content {
    padding: 0 12px;
  }

  .header-actions > * {
    margin-right: 8px;
  }
  
  .logo-img {
    height: 20px;
  }
  
  .btn {
    padding: 6px 12px;
    font-size: 12px;
    min-height: 32px;
  }
  
  .action-btn {
    height: 32px;
    padding: 0 8px;
    font-size: 12px;
  }
}
</style>
