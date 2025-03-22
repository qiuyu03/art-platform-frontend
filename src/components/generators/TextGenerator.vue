<script setup>
import { ref } from 'vue';
 
const keywords = ref('');
const emotion = ref('热血');
const generatedText = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
 
const generate = async () => {
  try {
    isLoading.value  = true;
    errorMessage.value  = '';
    
    const response = await fetch('http://localhost:3000/api/text/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        keywords: keywords.value.split(/[, ，]/),
        emotion: emotion.value  
      })
    });
 
    const data = await response.json(); 
    
    if (!data.success)  throw new Error(data.error); 
    
    generatedText.value  = data.content.replace(/\n/g,  '<br>');
    
  } catch (err) {
    errorMessage.value  = `生成失败: ${err.message}`; 
  } finally {
    isLoading.value  = false;
  }
};
</script>
 
<template>
  <div class="generator">
    <div class="input-group">
      <input 
        v-model="keywords"
        placeholder="输入关键词（用逗号分隔）"
        class="keyword-input"
      >
      <select v-model="emotion" class="emotion-select">
        <option value="热血">热血</option>
        <option value="温馨">温馨</option>
      </select>
      <button 
        @click="generate"
        :disabled="isLoading"
        class="generate-btn"
      >
        {{ isLoading ? '生成中...' : '开始生成' }}
      </button>
    </div>
 
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
 
    <div 
      v-html="generatedText"
      class="output-area"
    ></div>
  </div>
</template>
 
<style scoped>
.generator {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
}
 
.input-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
 
.keyword-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
 
.emotion-select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
 
.generate-btn {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
 
.generate-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}
 
.output-area {
  border: 1px solid #ddd;
  padding: 1rem;
  min-height: 200px;
  white-space: pre-wrap;
}
 
.error-message {
  color: #dc3545;
  margin: 1rem 0;
}
</style>