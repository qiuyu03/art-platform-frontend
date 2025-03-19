<template>
  <nav class="navbar">
    <h1>智能艺术创作平台</h1>
    <div class="nav-buttons">
      <button @click="$emit('save')">保存项目</button>
      <button @click="$emit('export')">导出</button>
    </div>
  </nav>
</template>
 
<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #0fe5f0;
  color: white;
}
</style>