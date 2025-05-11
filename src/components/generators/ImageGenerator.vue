<template>
  <div class="image-generator">
    <!-- 指令输入舱 -->
    <div class="input-pod">
      <h3 class="cyber-title">影像生成核心</h3>
      <textarea
        v-model="inputKeywords"
        placeholder="输入你想要生成的图片描述"
        class="neon-input"
      ></textarea>
    </div>

    <!-- 参数控制台 -->
    <div class="control-panel">
      <div class="param-module single-center">
        <label>情感选项</label>
        <select v-model="selectedEmotion" class="glow-select">
          <option v-for="(emotion, idx) in emotionOptions" :key="idx" :value="emotion">
            {{ emotion }}
          </option>
        </select>
      </div>
    </div>

    <!-- 生成中枢 -->
    <button @click="handleGenerate" :disabled="isGenerating" class="quantum-trigger">
      {{ isGenerating ? '时空解算中...' : '启动影像渲染' }}
    </button>

    <!-- 结果展示舱 -->
    <div v-if="computedImageUrl" class="output-pod">
      <img :src="computedImageUrl" alt="生成的图片" class="generated-image" />
      <button @click="download" class="data-saver">▼ 捕获时空片段</button>
    </div>

    <!-- 异常警告层 -->
    <div v-if="error" class="quantum-alarm">
      ⚠ 时空扰动：{{ error }}
      <button @click="error = null" class="alarm-close">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  prompt: String,
  imageUrl: String,
  steps: Number,
  emotion: String
});

const emotionOptions = ['默认', '热血', '悲伤'];
const API_BASE_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

const inputKeywords = ref('');
const selectedEmotion = ref('默认');
const imageUrlLocal = ref(null);
const isGenerating = ref(false);
const error = ref(null);

const computedImageUrl = computed(() => {
  console.log('Computed Image URL:', imageUrlLocal.value || props.imageUrl);
  return imageUrlLocal.value || props.imageUrl;
});

watch(() => props.prompt, (val) => {
  if (val) inputKeywords.value = val;
}, { immediate: true });

watch(() => props.emotion, (val) => {
  if (val) selectedEmotion.value = val;
}, { immediate: true });

const handleGenerate = async () => {
  try {
    isGenerating.value = true;
    error.value = '';

    const formattedPrompt = inputKeywords.value
      .split(',')
      .map(k => k.trim())
      .join(', ');

    const requestBody = {
      imageParams: {
        prompt: formattedPrompt,
        steps: props.steps || 40,
        guidance_scale: 9.5,
        height: 1024,
        width: 1024,
        emotion: selectedEmotion.value
      }
    };

    console.log('Request data:', requestBody);

    const response = await fetch(`${API_BASE_URL}/api/imageGenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    if (data.imageUrl) {
      imageUrlLocal.value = data.imageUrl;
      console.log('Image generated successfully:', data.imageUrl);
    } else {
      throw new Error('未返回有效图像链接');
    }
  } catch (err) {
    error.value = `生成失败: ${err.message}`;
    console.error('Image generation error:', err);
  } finally {
    isGenerating.value = false;
  }
};

const download = () => {
  if (!computedImageUrl.value) return;
  const link = document.createElement('a');
  link.href = computedImageUrl.value;
  link.download = `quantum_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<style scoped>
.image-generator {
  --quantum-blue: #2CB67D;
  --cyber-border: 1px solid rgba(255, 255, 255, 0.2);

  width: 60vw;
  height: 70vh;
  max-width: 800px;
  max-height: 700px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem;
  background: rgba(251, 251, 251, 0.9);
  border-radius: 12px;
  box-shadow: 0 0 30px rgba(44, 182, 125, 0.2);

  overflow-y: auto;
  overflow-x: hidden;
}

.input-pod {
  max-width: 500px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.cyber-title {
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #111;
  text-align: center;
}

.neon-input {
  width: 100%;
  height: 120px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: var(--cyber-border);
  color: #070000;
  font-size: 1.2em;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
  border-radius: 6px;
}

.control-panel {
  max-width: 500px;
  width: 100%;
  margin: 0 auto;
}

.glow-select {
  width: 100%;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: var(--cyber-border);
  color: #070000;
  font-size: 1em;
  border-radius: 6px;
}

.quantum-trigger {
  background: linear-gradient(135deg, #2CB67D 0%, #4FFFB0 100%);
  padding: 1rem 3rem;
  border-radius: 50px;
  font-weight: bold;
  transition: transform 0.2s ease;
  margin-top: 2rem;
  align-self: center;
}

.hologram-output {
  width: 100%;
  border: 2px solid var(--quantum-blue);
  border-radius: 8px;
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  font-family: monospace;
}

.generated-image {
  max-width: 100%;
  height: auto;
  margin-top: 1rem;
  border: 2px solid var(--quantum-blue);
  border-radius: 8px;
}

.data-saver {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background-color: #2CB67D;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

.quantum-alarm {
  background: rgba(255, 77, 79, 0.15);
  border: 1px solid #ff4d4f;
  padding: 1rem;
  margin-top: 1rem;
  border-radius: 6px;
}

.alarm-close {
  background: none;
  border: none;
  color: #ff4d4f;
  font-size: 1.2rem;
  float: right;
  cursor: pointer;
}

.param-module.single-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
</style>
