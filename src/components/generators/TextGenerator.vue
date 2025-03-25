<template>
  <div class="generator-card">
    <div class="input-group">
      <input 
        v-model="inputKeywords" 
        placeholder="输入关键词（用逗号分隔）"
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

// 从环境变量加载情感选项
const emotionOptions = JSON.parse(process.env.VUE_APP_EMOTION_OPTIONS || '["默认","热血","悲伤"]');

// 从环境变量加载后端地址
const API_BASE_URL = process.env.NODE_ENV  === 'production' 
  ? '' 
  : 'http://localhost:3001';

const handleGenerate = async () => {
  try {
    isGenerating.value = true;
    error.value = '';

    const keywords = inputKeywords.value.split(',').map(k => k.trim());

    console.log('Sending request with:', { keywords, emotion: selectedEmotion.value }); // 打印请求参数

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
    console.log('Response data:', data); // 打印响应数据

    generatedText.value = data.content; // 确保字段名与后端返回一致
  } catch (err) {
    error.value = `生成失败: ${err.message}`;
  } finally {
    isGenerating.value = false;
  }
};
</script>

<style scoped>
.generator-card {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.input-group {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

button {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.output-box {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  white-space: pre-wrap;
}
</style>