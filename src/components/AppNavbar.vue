<template>
  <nav class="navbar" :class="currentTheme">
    <h1 class="logo">🎨 智能艺术创作平台</h1>

    <div class="nav-controls">
      <button class="nav-btn" @click="$emit('save')">💾 保存</button>
      <button class="nav-btn" @click="$emit('export')">📤 导出</button>
      <button class="nav-btn toggle-theme" @click="$emit('theme-change')">
        {{ currentTheme === 'dark' ? '☀️ 明亮模式' : '🌙 黑暗模式' }}
      </button>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'AppNavbar',
  props: {
    currentTheme: {
      type: String,
      default: 'light',
    },
  },
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  transition: background 0.3s ease;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 1.4rem;
  font-weight: bold;
}

.nav-controls {
  display: flex;
  gap: 0.75rem;
}

.nav-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.2);
  color: inherit;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.toggle-theme {
  background: #00e1ff33;
  color: #00e1ff;
}

.dark .navbar {
  background: rgba(18, 18, 18, 0.85);
  color: #e0e0e0;
}

.light .navbar {
  background: rgba(255, 255, 255, 0.85);
  color: #333;
}
</style>
