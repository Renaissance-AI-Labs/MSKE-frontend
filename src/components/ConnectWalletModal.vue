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
                  <img :src="getWalletIcon(wallet.id)" :alt="wallet.name" :class="['wallet-icon', { 'wallet-icon-okx': wallet.id === 'okx' }]">
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 420px;
  padding: 30px;
  background: linear-gradient(160deg, rgba(25, 25, 25, 0.95), rgba(15, 15, 15, 0.98));
  border: 1px solid rgba(255, 69, 0, 0.2);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 69, 0, 0.1);
  color: #fff;
  transform: translateY(0);
  animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
}

.close-button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #a0a0a0;
  font-size: 1.2rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 69, 0, 0.1);
  color: #ff4500;
  border-color: rgba(255, 69, 0, 0.3);
  transform: rotate(90deg);
}

.modal-body h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  text-align: center;
  background: linear-gradient(135deg, #fff, #a0a0a0);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.connect-text {
  text-align: center;
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 25px;
}

.wallet-list ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.wallet-list ul > li {
  margin-bottom: 12px;
}

.wallet-list ul > li:last-child {
  margin-bottom: 0;
}

.wallet-option-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.wallet-option-btn:hover {
  background: rgba(255, 69, 0, 0.05);
  border-color: rgba(255, 69, 0, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 69, 0, 0.1);
}

.wallet-icon {
  width: 32px;
  height: 32px;
  margin-right: 16px;
  border-radius: 8px;
  object-fit: contain;
}

.wallet-icon-okx {
  background: #fff;
}

.no-wallet-view {
  text-align: center;
  color: #ff4444;
  padding: 20px;
  background: rgba(255, 68, 68, 0.1);
  border-radius: 12px;
}

.connected-view {
  text-align: center;
}

.info-group {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin: 20px 0;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 0.95rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-title {
  color: #888;
}

.info-content {
  color: #fff;
  font-weight: 600;
  font-family: monospace;
}

.disconnect-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #ff4444, #cc0000);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3);
}

.disconnect-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 68, 68, 0.5);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
