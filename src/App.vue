<template>
  <div>
    <!-- Retaining core wallet functionality components -->
    <ToastNotification />
    
    <Header @open-get-started-modal="openModal" />
    
    <!-- Simplified Layout Wrapper -->
    <div id="wrapper">
      <router-view />
    </div>
    
    <Footer />
    
    <transition name="modal">
      <ConnectWalletModal v-if="isModalVisible" @close="closeModal" />
    </transition>
  </div>
</template>

<script>
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';
import ConnectWalletModal from './components/ConnectWalletModal.vue';
import ToastNotification from './components/ToastNotification.vue';
import { autoConnectWallet } from './services/wallet.js';
import { initializeLanguage } from './i18n';

export default {
  name: 'App',
  components: {
    Header,
    Footer,
    ConnectWalletModal,
    ToastNotification
  },
  data() {
    return {
      isModalVisible: false,
    };
  },
  methods: {
    openModal() {
      this.isModalVisible = true;
    },
    closeModal() {
      this.isModalVisible = false;
    }
  },
  mounted() {
    initializeLanguage();
    autoConnectWallet();
  }
}
</script>

<style scoped>
/* Removed visual styles, retained necessary layout if any */
#wrapper {
  padding-top: var(--header-height); /* Ensure content doesn't hide behind fixed header */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
