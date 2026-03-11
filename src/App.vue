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
    <BottomNavBar />
    
    <transition name="modal">
      <ConnectWalletModal v-if="isModalVisible" @close="closeModal" />
    </transition>
  </div>
</template>

<script>
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';
import BottomNavBar from './components/BottomNavBar.vue';
import ConnectWalletModal from './components/ConnectWalletModal.vue';
import ToastNotification from './components/ToastNotification.vue';
import { autoConnectWallet } from './services/wallet.js';
import { initializeLanguage } from './i18n';

export default {
  name: 'App',
  components: {
    Header,
    Footer,
    BottomNavBar,
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

<style>
/* Global Styles */
body {
  margin: 0;
  padding: 0;
  background-color: #0a0a0a; /* Dark black background */
  color: #ffffff;
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html,
body,
#app {
  width: 100%;
  overflow-x: hidden;
}

* {
  box-sizing: border-box;
}

a {
  text-decoration: none;
  color: inherit;
}
</style>

<style scoped>
/* Removed visual styles, retained necessary layout if any */
#wrapper {
  padding-top: 64px; /* Ensure content doesn't hide behind fixed header */
  /* padding-bottom: 20px; Reserve space for bottom tab bar */
  /* min-height: 100vh; */
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}
</style>
