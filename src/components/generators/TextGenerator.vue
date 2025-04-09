<template>
  <div class="neural-card animate-fade-in text-generator">
    <h5 class="section-title">文本生成</h5>

    <div class="input-group">
      <input 
        v-model="inputKeywords" 
        placeholder="关键词（逗号分隔）"
        @keyup.enter="handleGenerate" 
      />
      <select v-model="selectedEmotion">
        <option v-for="emotion in emotionOptions" :key="emotion">
          {{ emotion }}
        </option>
      </select>
    </div>
    
    <button 
      :disabled="isGenerating"
      @click="handleGenerate"
      class="action-button"
    >
      {{ isGenerating ? '生成中...' : '开始创作' }}
    </button>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="generatedText" class="output-box">
      <pre>{{ generatedText }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const inputKeywords = ref('');
const selectedEmotion = ref('默认');
const generatedText = ref('');
const isGenerating = ref(false);
const error = ref('');

const emotionOptions = JSON.parse(process.env.VUE_APP_EMOTION_OPTIONS || '["默认","热血","悲伤"]');

const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

const handleGenerate = async () => {
  try {
    isGenerating.value = true;
    error.value = '';

    const keywords = inputKeywords.value.split(',').map(k => k.trim());

    const response = await fetch(`${API_BASE_URL}/api/textGenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords,
        emotion: selectedEmotion.value
      }),
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    generatedText.value = data.content;
  } catch (err) {
    error.value = `生成失败: ${err.message}`;
  } finally {
    isGenerating.value = false;
  }
};
</script>

<style scoped>
.text-generator {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 1.5rem; /* 将标题字体调整为较小的大小 */
  font-weight: bold;
  color: #000; /* 颜色改为黑色 */
  margin: 0; /* 去掉外边距，使其更靠近左上角 */
  text-align: left; /* 左对齐 */
}

.input-group {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
}

input, select {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: var(--input-bg, #fff);
  color: var(--input-color, #333);
  transition: border-color 0.2s ease;
}

input:focus, select:focus {
  outline: none;
  border-color: #00e1ff;
}

.action-button {
  padding: 0.75rem 1.2rem;
  background: linear-gradient(135deg, #00e1ff, #6cf0e5);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.3s;
}

.action-button:hover:not(:disabled) {
  transform: scale(1.03);
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 输出区域样式 */
.output-box {
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  padding: 1rem;
  border-radius: 0.75rem;
  backdrop-filter: blur(6px);
  white-space: pre-wrap; /* 确保文本按行换行 */
  word-wrap: break-word; /* 遇到长单词时换行 */
  overflow-wrap: break-word; /* 同样处理长单词 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: 'JetBrains Mono', monospace;
  max-height: 300px; /* 设置最大高度，超出部分将可滚动 */
  overflow-y: auto; /* 垂直滚动条 */
}

.error-message {
  color: #ff6b6b;
  font-size: 0.9rem;
  padding-left: 0.5rem;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.6s ease both;
}

/* Dark Mode Styles */
.dark .text-generator {
  background: rgba(0, 0, 0, 0.6);
}

.dark input, .dark select {
  background-color: var(--input-bg-dark, #333);
  color: var(--input-color-dark, #fff);
  border-color: #444;
}

.dark .action-button {
  background: linear-gradient(135deg, #00e1ff, #6cf0e5);
  color: #000;
}

.dark .output-box {
  background: rgba(255, 255, 255, 0.12);
  color: inherit;
  border-color: rgba(255, 255, 255, 0.2);
}

.dark .error-message {
  color: #ff6b6b;
}
</style>
