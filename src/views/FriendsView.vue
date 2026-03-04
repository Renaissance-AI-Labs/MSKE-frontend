<template>
  <div class="page-shell">
    <div class="page-bg-glow"></div>

    <section class="page-header">
      <p class="page-badge">MSKE</p>
      <h1 class="page-title">好友</h1>
      <p class="page-subtitle">管理推荐关系与好友列表</p>
    </section>

    <section class="panel">
      <div class="panel-decor"></div>
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'recommendations' }"
          @click="activeTab = 'recommendations'"
        >
          我的推荐
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'friends' }"
          @click="activeTab = 'friends'"
        >
          我的好友
        </button>
      </div>

      <div class="tab-content" v-if="activeTab === 'recommendations'">
        <h2 class="panel-title">我的推荐</h2>
        <div class="empty-state">
          <p>暂无推荐记录</p>
        </div>
      </div>

      <div class="tab-content" v-else>
        <h2 class="panel-title">我的好友</h2>
        <div class="empty-state">
          <p>暂无好友数据</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const activeTab = ref('recommendations');
</script>

<style scoped>
.page-shell {
  min-height: 100vh;
  padding: 14px 20px 120px;
  position: relative;
  background-color: #050302;
  overflow-x: hidden;
}

.page-bg-glow {
  position: absolute;
  top: -180px;
  left: 50%;
  transform: translateX(-50%);
  width: min(720px, 100vw);
  height: 460px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 74, 28, 0.22) 0%, rgba(255, 74, 28, 0) 70%);
  filter: blur(6px);
  pointer-events: none;
}

.page-header {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 18px auto 18px;
  text-align: center;
}

.page-badge {
  margin: 0;
  color: #f6a362;
  letter-spacing: 0.16em;
  font-size: 12px;
}

.page-title {
  margin: 8px 0 10px;
  font-size: clamp(2rem, 8vw, 3rem);
  font-weight: 800;
  background: linear-gradient(180deg, #fff 0%, #ffcda5 50%, #ff4500 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.page-subtitle {
  margin: 0;
  color: rgba(234, 215, 198, 0.78);
  letter-spacing: 0.06em;
}

.panel {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
  padding: 18px;
  border-radius: 16px;
  background: rgba(21, 11, 6, 0.35);
  border: 1px solid rgba(255, 69, 0, 0.2);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.panel-decor {
  height: 3px;
  margin: -18px -18px 14px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 69, 0, 0.55) 50%, transparent 100%);
}

.tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  border: 1px solid rgba(255, 69, 0, 0.25);
  background: rgba(255, 69, 0, 0.08);
  color: #cfb49c;
  min-height: 42px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  letter-spacing: 0.04em;
}

.tab-btn.active {
  color: #ffe0c7;
  background: rgba(255, 69, 0, 0.22);
  box-shadow: inset 0 0 0 1px rgba(255, 113, 68, 0.4);
}

.tab-btn:hover {
  color: #ffe0c7;
}

.tab-content {
  padding: 4px 2px 2px;
}

.panel-title {
  margin: 0 0 14px;
  color: #f7d2b2;
  font-size: 1rem;
  letter-spacing: 0.08em;
}

.empty-state {
  min-height: 140px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 114, 67, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #af9f90;
}
</style>
