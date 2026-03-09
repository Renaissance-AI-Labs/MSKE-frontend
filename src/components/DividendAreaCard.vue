<template>
  <div class="placeholder-box dividend-box">
    <h2>分红区域</h2>
    <p>暂无分红数据</p>
  </div>
</template>

<style scoped>
.placeholder-box {
  width: 100%;
  max-width: 600px;
  background: rgba(20, 10, 5, 0.3);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 69, 0, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  color: #bbb;
  transition: all 0.3s ease;
}

.placeholder-box:hover {
  background: rgba(255, 69, 0, 0.05);
  border-color: rgba(255, 69, 0, 0.3);
}

.placeholder-box h2 {
  font-size: 1.2rem;
  color: #ffd6b5;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.placeholder-box p {
  margin: 0;
  font-size: 0.9rem;
  color: #c9b5a5;
}

@media (max-width: 768px) {
  .placeholder-box {
    padding: 30px 16px;
  }
}
</style>
