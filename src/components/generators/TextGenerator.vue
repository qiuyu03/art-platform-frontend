<template>
  <div class="text-generator">
    <div class="output-container">
      <div class="generated-text" v-html="formattedText"></div>
      <div v-if="isGenerating" class="loading-indicator">
        <div class="spinner"></div>
        <span>生成进度 {{ progress }}%</span>
      </div>
    </div>

    <div class="controls">
      <button @click="regenerate" :disabled="isGenerating">
        重新生成 
      </button>
      <button @click="copyText">
        复制文本 
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  content: String,
  isGenerating: Boolean,
  progress: Number 
})

const emit = defineEmits(['regenerate', 'update:content'])

const formattedText = computed(() => {
  return marked(props.content || '*等待生成...*')
})

const regenerate = () => {
  if (!props.isGenerating) {
    emit('regenerate')
  }
}

const copyText = async () => {
  try {
    await navigator.clipboard.writeText(props.content)
  } catch (err) {
    console.error('Failed to copy text: ', err)
  }
}
</script>
 
<style scoped>
.text-generator {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
}
 
.output-container {
  min-height: 200px;
  padding: 1.5rem;
  position: relative;
}
 
.generated-text {
  line-height: 1.8;
  white-space: pre-wrap;
}
 
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #666;
}
 
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
 
.controls {
  border-top: 1px solid #eee;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
 
button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s;
 
  &:hover {
    background: #e9ecef;
  }
 
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}
 
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>