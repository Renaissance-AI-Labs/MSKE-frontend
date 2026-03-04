<template>
  <div class="page-shell">
    <div class="page-bg-glow"></div>

    <section class="page-header">
      <p class="page-badge">MSKE</p>
      <h1 class="page-title">订单</h1>
      <p class="page-subtitle">查看当前订单状态与历史记录</p>
    </section>

    <section class="panel">
      <div class="panel-decor"></div>
      <h2 class="panel-title">我的订单</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <p class="stat-label">进行中</p>
          <p class="stat-value">0</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">已完成</p>
          <p class="stat-value">0</p>
        </div>
      </div>
      <div class="empty-state">
        <p>暂无订单数据</p>
      </div>
    </section>
  </div>
</template>

<script setup>
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
  padding: 24px 20px;
  border-radius: 16px;
  background: rgba(21, 11, 6, 0.35);
  border: 1px solid rgba(255, 69, 0, 0.2);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  overflow: hidden;
}

.panel-decor {
  height: 3px;
  margin: -24px -20px 18px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 69, 0, 0.55) 50%, transparent 100%);
}

.panel-title {
  margin: 0 0 14px;
  color: #f7d2b2;
  font-size: 1rem;
  letter-spacing: 0.08em;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.stat-card {
  border: 1px solid rgba(255, 109, 60, 0.25);
  border-radius: 12px;
  padding: 14px 12px;
  background: rgba(255, 69, 0, 0.07);
}

.stat-label {
  margin: 0 0 6px;
  color: #d8b79b;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.stat-value {
  margin: 0;
  color: #ffe3ce;
  font-size: 20px;
  font-weight: 700;
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
