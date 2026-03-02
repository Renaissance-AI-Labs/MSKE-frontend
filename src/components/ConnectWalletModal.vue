<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <button @click="close" class="close-button">X</button>
      </div>

      <div class="modal-body">
        <!-- Not Connected View -->
        <div v-if="!walletState.isConnected">
          <h3>{{ t('wallet.connectTitle') || 'Connect Wallet' }}</h3>
          <p class="connect-text">{{ t('wallet.connectSubtitle') || 'Select your wallet' }}</p>
          
          <div class="wallet-list" v-if="availableWallets.length > 0">
            <ul>
              <li v-for="wallet in availableWallets" :key="wallet.id">
                <button class="wallet-option-btn" @click.prevent="handleConnect(wallet.id)">
                  <img :src="getWalletIcon(wallet.id)" :alt="wallet.name" class="wallet-icon">
                  <span>{{ wallet.name }}</span>
                </button>
              </li>
            </ul>
          </div>
          <div v-else class="no-wallet-view">
            <p>{{ t('wallet.noWalletDetected') || 'No wallet detected' }}</p>
          </div>
        </div>

        <!-- Connected View -->
        <div v-else class="connected-view">
          <h3>{{ t('wallet.connectedTitle') || 'Connected' }}</h3>
          
          <div class="info-group">
            <div class="info-item">
              <span class="info-title">{{ t('wallet.address') || 'Address' }}:</span>
              <span class="info-content">{{ formattedAddress }}</span>
            </div>
            <div class="info-item">
              <span class="info-title">{{ t('wallet.network') || 'Network' }}:</span>
              <span class="info-content">{{ uppercaseNetwork }}</span>
            </div>
          </div>
          
          <button @click.prevent="handleDisconnect" class="disconnect-btn">
              {{ t('wallet.disconnect') || 'Disconnect' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue';
import { walletState, connectWallet, disconnectWallet, detectWallets } from '@/services/wallet.js';
import { t } from '@/i18n';

export default {
  name: 'ConnectWalletModal',
  setup(props, { emit }) {
    const availableWallets = ref([]);

    const getWalletIcon = (walletId) => {
        // Keeping paths but removing specific styling classes
        const icons = {
            metamask: '/asset/images/wallet/MetaMask-icon-fox-with-margins.svg',
            tokenpocket: '/asset/images/wallet/tp-logo.png',
            okx: '/asset/images/wallet/okx-logo.png',
            binance: '/asset/images/wallet/binance-logo.png',
        };
        return icons[walletId] || '/asset/images/wallet/default-icon.png';
    };

    const close = () => {
      emit('close');
    };

    const handleConnect = async (walletType) => {
      const success = await connectWallet(walletType);
      if (success) {
        close();
      }
    };

    const handleDisconnect = () => {
      disconnectWallet();
      close();
    };
    
    onMounted(() => {
      availableWallets.value = detectWallets();
    });

    return {
      walletState,
      availableWallets,
      getWalletIcon,
      handleConnect,
      handleDisconnect,
      close,
      t,
    };
  },
  computed: {
    formattedAddress() {
      if (!this.walletState.address) return '';
      return `${this.walletState.address.substring(0, 6)}...${this.walletState.address.substring(this.walletState.address.length - 4)}`;
    },
    uppercaseNetwork() {
      return this.walletState.network ? this.walletState.network.toUpperCase() : '';
    }
  }
};
</script>

<style scoped>
/* FUNCTIONAL / LAYOUT STYLES ONLY */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5); /* Basic dimming */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 400px;
  padding: 20px;
  background: #fff; /* Basic white background for readability */
  border: 1px solid #ccc; /* Basic border */
}

.modal-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.wallet-list ul {
  list-style: none;
  padding: 0;
}

.wallet-list li {
  margin-bottom: 10px;
}

.wallet-option-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  cursor: pointer;
}

.wallet-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.disconnect-btn {
  width: 100%;
  padding: 10px;
  margin-top: 20px;
  background: #ff4444;
  color: white;
  border: none;
  cursor: pointer;
}
</style>
