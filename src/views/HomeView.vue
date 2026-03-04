<template>
  <div class="home-container">
    
    <!-- 背景特效 (火星、风沙、星空) -->
    <div class="background-effects">
      <!-- Three.js Mars Container -->
      <div class="mars-3d-container" ref="marsContainer"></div>

      <!-- 氛围与背景特效 -->
      <div class="mars-atmosphere"></div>
      
      <!-- 动态星火/沙粒颗粒 -->
      <div class="particles-container">
        <div
          v-for="item in particles"
          :key="item.id"
          class="particle"
          :style="{
            '--size': `${item.size}px`,
            '--left': `${item.left}%`,
            '--top': `${item.top}%`,
            '--duration': `${item.duration}s`,
            '--delay': `${item.delay}s`,
            '--drift-x': `${item.driftX}vw`,
            '--drift-y': `${item.driftY}vh`,
            '--particle-opacity': `${item.opacity}`,
            '--highlight-weight': `${item.highlightWeight}`
          }"
        ></div>
      </div>

      <!-- 流动风沙纹理层 -->
      <div class="dust-layer dust-1"></div>
      <div class="dust-layer dust-2"></div>
      
      <!-- 整体渐变遮罩 (控制火星可见度) -->
      <div class="background-fade-overlay"></div>
    </div>

    <!-- 1. 顶部：Logo标题和副标题 (火星风沙、寂静、现代风格) -->
    <section class="hero-section">
      <!-- 内容 -->
      <div class="hero-content">
        <h1 class="hero-title">MSKE</h1>
        <p class="hero-subtitle">Bitcoin Stamps inscription token</p>
        <p class="hero-subtitle-cn">{{ t('home.heroSubtitleSecondary') }}</p>
      </div>
    </section>

    <!-- 2. 中间：质押区域、绑定按钮、资讯按钮 (占位) -->
    <section class="middle-section">
      <div class="placeholder-box staking-box">
        <h2>{{ t('home.stakingAreaTitle') }}</h2>
        <p>{{ t('home.stakingAreaDesc') }}</p>
      </div>

      <div class="placeholder-box dividend-box">
        <h2>分红区域</h2>
        <p>暂无分红数据</p>
      </div>
    </section>

  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
import { walletState } from '@/services/wallet';
import { t } from '@/i18n/index.js';

const router = useRouter();
const marsContainer = ref(null);
let renderer, scene, camera, marsMesh, marsMaterial, animationId;
let handleResize;
let isUnmounted = false;
const textureObjectUrls = [];

const TEXTURE_CACHE_PREFIX = 'mske-mars-texture-cache';
const textureRevisionRaw =
  import.meta.env.VITE_TEXTURE_VERSION ||
  import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ||
  import.meta.env.VITE_APP_VERSION ||
  '1.0.0';
const TEXTURE_CACHE_REVISION = String(textureRevisionRaw).replace(/[^a-zA-Z0-9._-]/g, '_');
const TEXTURE_CACHE_KEY = `${TEXTURE_CACHE_PREFIX}-${TEXTURE_CACHE_REVISION}`;
const MARS_MAP_URL = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/4273/mars-map.jpg';
const MARS_BUMP_URL = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/4273/mars-bump.jpg';
const versionedTextureUrl = (url) => `${url}?v=${encodeURIComponent(TEXTURE_CACHE_REVISION)}`;
const PARTICLE_COUNT = 14;
const HIGHLIGHT_PARTICLE_COUNT = 4;

const particles = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
  const isHighlight = index < HIGHLIGHT_PARTICLE_COUNT;
  const duration = Number((Math.random() * 10 + 10).toFixed(2));
  const baseTop = isHighlight
    ? Number((Math.random() * 28 + 34).toFixed(2))
    : Number((Math.random() * 60 + 45).toFixed(2));
  return {
    id: `particle-${index}`,
    size: Number((Math.random() * (isHighlight ? 2.8 : 3.5) + (isHighlight ? 2.6 : 1.5)).toFixed(2)),
    left: Number((Math.random() * 120 - 20).toFixed(2)),
    top: baseTop,
    duration,
    // Use negative delay so particles are visible immediately on first paint.
    delay: -Number((Math.random() * duration).toFixed(2)),
    driftX: Number((Math.random() * 30 + 18).toFixed(2)),
    driftY: -Number((Math.random() * 42 + 40).toFixed(2)),
    opacity: Number((Math.random() * (isHighlight ? 0.25 : 0.35) + (isHighlight ? 0.8 : 0.6)).toFixed(2)),
    highlightWeight: isHighlight ? 1.45 : 1
  };
});

const clearOldTextureCaches = async () => {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cacheKeys = await caches.keys();
    await Promise.all(
      cacheKeys
        .filter((key) => key.startsWith(TEXTURE_CACHE_PREFIX) && key !== TEXTURE_CACHE_KEY)
        .map((key) => caches.delete(key))
    );
  } catch (error) {
    console.warn('[HomeView] Failed to clear old texture caches:', error);
  }
};

const getCachedTextureUrl = async (url) => {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return url;
  }

  try {
    const cacheUrl = versionedTextureUrl(url);
    const cache = await caches.open(TEXTURE_CACHE_KEY);
    let response = await cache.match(cacheUrl);

    if (!response) {
      response = await fetch(cacheUrl, { mode: 'cors', cache: 'force-cache' });
      if (response && response.ok) {
        await cache.put(cacheUrl, response.clone());
      }
    }

    if (!response || !response.ok) {
      return url;
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    textureObjectUrls.push(objectUrl);
    return objectUrl;
  } catch (error) {
    // Fallback to direct URL when cache API or CORS fails.
    console.warn('[HomeView] Texture cache fallback:', error);
    return url;
  }
};

const loadMarsTextures = async (THREE_LIB) => {
  if (!marsMaterial) return;

  const textureLoader = new THREE_LIB.TextureLoader();

  try {
    const [mapUrl, bumpUrl] = await Promise.all([
      getCachedTextureUrl(MARS_MAP_URL),
      getCachedTextureUrl(MARS_BUMP_URL)
    ]);

    if (isUnmounted || !marsMaterial) return;

    const [mapTexture, bumpTexture] = await Promise.all([
      textureLoader.loadAsync(mapUrl),
      textureLoader.loadAsync(bumpUrl)
    ]);

    if (isUnmounted || !marsMaterial) {
      mapTexture.dispose();
      bumpTexture.dispose();
      return;
    }

    marsMaterial.map = mapTexture;
    marsMaterial.bumpMap = bumpTexture;
    marsMaterial.bumpScale = 12;
    marsMaterial.specular = new THREE_LIB.Color('#111111');
    marsMaterial.shininess = 5;
    marsMaterial.needsUpdate = true;
  } catch (error) {
    console.warn('[HomeView] Failed to load Mars textures:', error);
  }
};

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const refParam = urlParams.get('ref');
  if (refParam) {
    router.replace({ path: '/friends', query: { tab: 'recommendations', ref: refParam } });
  }
});

onMounted(async () => {
  clearOldTextureCaches();
  const THREE_LIB = await import('three');
  if (isUnmounted) return;

  const container = marsContainer.value;
  if (!container) return;
  
  const width = container.clientWidth;
  const height = container.clientHeight;

  scene = new THREE_LIB.Scene();

  // Ambient light for subtle fill
  const ambientLight = new THREE_LIB.AmbientLight(0xffffff, 0.05);
  scene.add(ambientLight);

  // Main directional light to create dramatic shadows (sunlight)
  const mainLight = new THREE_LIB.DirectionalLight(0xffeedd, 1.2);
  mainLight.position.set(-1000, 500, 500);
  scene.add(mainLight);

  // Rim light for premium sci-fi feel (orange/red glow on the dark edge)
  const rimLight = new THREE_LIB.DirectionalLight(0xff4500, 2);
  rimLight.position.set(1000, -500, -500);
  scene.add(rimLight);

  camera = new THREE_LIB.PerspectiveCamera(45, width / height, 0.1, 10000);
  // Position camera to look at the top curve of Mars (zoomed in)
  camera.position.set(0, 100, 600);
  camera.lookAt(0, -100, 0);

  // Create large sphere (reduced segments for performance)
  const marsGeo = new THREE_LIB.SphereGeometry(450, 48, 48);
  marsMaterial = new THREE_LIB.MeshPhongMaterial({
    // Keep base color neutral so texture colors are not tinted.
    color: '#ffffff'
  });
  marsMesh = new THREE_LIB.Mesh(marsGeo, marsMaterial);
  // Move sphere down so only the top curve is visible
  marsMesh.position.set(0, -380, 0);
  
  // Tilt the planet slightly for a more dynamic angle
  marsMesh.rotation.z = 0.2;
  marsMesh.rotation.x = 0.1;
  
  scene.add(marsMesh);

  // Disabled antialiasing for background performance, hint high-performance
  renderer = new THREE_LIB.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  // Cap pixel ratio to 1.5 to prevent massive fragment shader cost on retina
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  container.appendChild(renderer.domElement);

  const timer = new THREE_LIB.Timer();

  const animate = () => {
    animationId = requestAnimationFrame(animate);
    timer.update();
    const delta = timer.getDelta();
    // Faster, un-interactive rotation
    marsMesh.rotation.y += 0.08 * delta;
    renderer.render(scene, camera);
  };
  animate();
  loadMarsTextures(THREE_LIB);

  handleResize = () => {
    if (!container || !camera || !renderer) return;
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  };

  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  isUnmounted = true;
  if (handleResize) {
    window.removeEventListener('resize', handleResize);
  }
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  if (renderer) {
    renderer.dispose();
  }
  if (marsMesh) {
    marsMesh.geometry.dispose();
    marsMesh.material.dispose();
  }
  textureObjectUrls.forEach((url) => URL.revokeObjectURL(url));
});
</script>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  /* 寂静的暗黑色底调，更加深邃 */
  background-color: #050302;
  position: relative;
  overflow-x: hidden;
}

/* =========================================
   全屏背景特效 (火星、风沙)
   ========================================= */
.background-effects {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

/* 3D Mars Container */
.mars-3d-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* 全局渐变遮罩：让火星向底部逐渐变暗 */
.background-fade-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(5, 3, 2, 0) 0%,       /* 顶部完全透明，显示火星 */
    rgba(5, 3, 2, 0.62) 50%,   /* 稍微减弱遮罩，提升粒子可见度 */
    rgba(5, 3, 2, 0.82) 80%,   /* 稍微减弱遮罩，提升粒子可见度 */
    rgba(5, 3, 2, 1) 100%      /* 底部完全融入背景色 */
  );
  z-index: 4; /* 盖在粒子和沙尘上面，但不挡住前面的UI */
  pointer-events: none;
}

/* =========================================
   1. 顶部 Hero Section
   ========================================= */
.hero-section {
  position: relative;
  width: 100%;
  height: 32vh;
  min-height: 290px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

/* 火星大气微光：作为遮罩层覆盖在火星上 */
.mars-atmosphere {
  position: absolute;
  inset: 0;
  background: 
    radial-gradient(circle at 50% 120%, rgba(255, 69, 0, 0.15) 0%, rgba(200, 40, 0, 0.05) 40%, rgba(5, 3, 2, 0) 80%),
    linear-gradient(180deg, rgba(5,3,2,0.8) 0%, rgba(20,8,3,0.2) 60%, rgba(50,15,5,0.9) 100%);
  pointer-events: none;
  z-index: 1;
}

/* 尘埃/沙暴 纹理层：强化混合模式让沙粒更有光泽 */
.dust-layer {
  position: absolute;
  inset: -150%; /* 扩大范围以支持带缩放的移动动画 */
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.06;
  mix-blend-mode: screen; /* Changed from color-dodge for performance */
  pointer-events: none;
  z-index: 2;
  will-change: transform;
}

/* 风沙流动动画 1：加入轻微缩放产生3D呼吸感 */
.dust-1 {
  animation: sand-drift-1 50s linear infinite;
}

/* 风沙流动动画 2 */
.dust-2 {
  opacity: 0.04;
  animation: sand-drift-2 70s linear infinite reverse;
}

@keyframes sand-drift-1 {
  0% { transform: translate(0, 0) scale(1) rotate(5deg); }
  50% { transform: translate(-5%, 5%) scale(1.1) rotate(5deg); }
  100% { transform: translate(-10%, 10%) scale(1) rotate(5deg); }
}

@keyframes sand-drift-2 {
  0% { transform: translate(0, 0) scale(1.1) rotate(-5deg); }
  50% { transform: translate(5%, 2%) scale(1) rotate(-5deg); }
  100% { transform: translate(10%, 5%) scale(1.1) rotate(-5deg); }
}

/* 动态星火/沙粒颗粒：增加高级影视感 */
.particles-container {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}

.particle {
  position: absolute;
  left: var(--left);
  top: var(--top);
  width: var(--size);
  height: var(--size);
  background: rgba(255, 178, 130, 0.42);
  border-radius: 50%;
  filter: blur(1px);
  box-shadow: 0 0 8px 1px rgba(255, 166, 112, calc(0.45 * var(--highlight-weight)));
  opacity: 0;
  will-change: transform, opacity;
  animation: float-up-right var(--duration) ease-in-out infinite var(--delay);
}

@keyframes float-up-right {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.5);
    background: rgba(255, 188, 145, 0.35);
    box-shadow: 0 0 6px 1px rgba(255, 175, 125, calc(0.3 * var(--highlight-weight)));
  }
  22% {
    opacity: calc(var(--particle-opacity) * 0.55 * var(--highlight-weight));
    background: rgba(255, 170, 120, 0.55);
    box-shadow: 0 0 9px 2px rgba(255, 140, 95, calc(0.45 * var(--highlight-weight)));
  }
  56% {
    opacity: calc(var(--particle-opacity) * var(--highlight-weight));
    background: rgba(255, 118, 58, 0.9);
    box-shadow: 0 0 13px 3px rgba(255, 80, 32, calc(0.78 * var(--highlight-weight)));
  }
  82% {
    opacity: calc(var(--particle-opacity) * 0.8 * var(--highlight-weight));
    background: rgba(255, 132, 70, 0.82);
    box-shadow: 0 0 11px 2px rgba(255, 92, 40, calc(0.65 * var(--highlight-weight)));
  }
  100% {
    opacity: 0;
    transform: translate(var(--drift-x), var(--drift-y)) scale(1.45);
    background: rgba(255, 172, 125, 0.4);
    box-shadow: 0 0 7px 1px rgba(255, 145, 98, calc(0.35 * var(--highlight-weight)));
  }
}

/* 内容层 */
.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 0 20px;
  margin-top: 50px;
}

/* 文字背景高光层，提升文字质感和可读性 */
.hero-content::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 150%;
  height: 150%;
  background: radial-gradient(circle, rgba(255, 69, 0, 0.15) 0%, rgba(255, 69, 0, 0) 65%);
  z-index: -1;
  pointer-events: none;
  filter: blur(25px);
}

/* 现代感的大标题：金属与火星结合的渐变质感 */
.hero-title {
  font-size: clamp(3.5rem, 10vw, 6.5rem);
  font-weight: 900;
  letter-spacing: 0.15em;
  margin: 0 0 12px 0;
  line-height: 1.1;
  background: linear-gradient(180deg, #ffffff 0%, #ffcda5 40%, #ff4500 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0px 10px 30px rgba(255, 69, 0, 0.4));
  text-transform: uppercase;
}

/* 副标题：沙粒般的暗金色，字间距拉开体现寂静感 */
.hero-subtitle {
  font-size: clamp(0.75rem, 1.6vw, 1rem);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #e8cfb8;
  margin: 0;
  font-weight: 500;
  opacity: 0.9;
  line-height: 1.7;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  max-width: min(90vw, 920px);
}

.hero-subtitle-cn {
  margin: 2px 0 0;
  font-size: clamp(0.78rem, 1.5vw, 0.96rem);
  letter-spacing: 0.12em;
  line-height: 1.7;
  font-weight: 400;
  color: rgba(239, 214, 190, 0.82);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
  max-width: min(88vw, 780px);
}

/* =========================================
   2. 中间 & 底部 Section (占位设计)
   ========================================= */
.middle-section {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1200px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.middle-section > * {
  margin-bottom: 24px;
}
.middle-section > *:last-child {
  margin-bottom: 0;
}

/* 占位框通用样式 */
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
  color: #aaa;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.placeholder-box p {
  margin: 0;
  font-size: 0.9rem;
}

/* 按钮组 */
.dividend-box h2 {
  color: #ffd6b5;
}

.dividend-box p {
  color: #c9b5a5;
}

@media (max-width: 768px) {
  .hero-section {
    height: 25vh;
    min-height: 250px;
  }
  
  .middle-section {
    padding: 30px 16px;
  }
  
  .placeholder-box {
    padding: 30px 16px;
  }

}
</style>
