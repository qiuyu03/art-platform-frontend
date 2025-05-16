<template>
    <div class="rule-customizer neural-card">
      <button class="close-button" @click="$emit('close')">×</button>
      <h3 class="text-xl font-bold mb-2">🎨 规则定制</h3>
  
      <div class="form-group">
        <label>关键词</label>
        <input v-model="keyword" class="input" placeholder="如：童话森林" />
      </div>
  
      <div class="form-group">
        <label>情绪</label>
        <input v-model="emotion" class="input" placeholder="如：温暖" />
      </div>
  
      <div class="form-group">
        <label>图像风格</label>
        <input v-model="imageStyle" class="input" placeholder="如：柔光插画风" />
      </div>
  
      <div class="form-group">
        <label>音乐风格</label>
        <input v-model="musicStyle" class="input" placeholder="如：原声吉他" />
      </div>
  
      <div class="form-group">
        <label>BPM</label>
        <input v-model.number="bpm" type="number" class="input" placeholder="如：90" />
      </div>
  
      <div class="form-group">
        <label>和弦类型</label>
        <input v-model="chordType" class="input" placeholder="如：柔和三和弦" />
      </div>
  
      <div class="form-group">
        <label>文本基调</label>
        <input v-model="textTone" class="input" placeholder="如：梦幻童话" />
      </div>
  
      <div class="form-group">
        <label>文本关键词</label>
        <input v-model="textKeywords" class="input" placeholder="如：童话元素,梦幻氛围,温馨结尾" />
      </div>
  
      <div class="form-group">
        <label>叙事节奏</label>
        <input v-model="narrativePace" class="input" placeholder="如：慢节奏" />
      </div>
  
      <button class="btn mt-2" @click="saveRule">保存规则</button>
  
      <div v-if="errorMessage" class="error mt-4">
        <p class="text-red-500">{{ errorMessage }}</p>
      </div>
  
      <div v-if="successMessage" class="success mt-4">
        <p class="text-green-500">{{ successMessage }}</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { defineEmits } from 'vue';
  
  const emits = defineEmits(['close']);
  
  const keyword = ref('');
  const emotion = ref('');
  const imageStyle = ref('');
  const musicStyle = ref('');
  const bpm = ref(90);
  const chordType = ref('');
  const textTone = ref('');
  const textKeywords = ref('');
  const narrativePace = ref('');
  const errorMessage = ref(null);
  const successMessage = ref(null);
  
  const saveRule = async () => {
    try {
      const rule = {
        keyword: keyword.value,
        emotion: emotion.value,
        imageStyle: imageStyle.value,
        musicStyle: musicStyle.value,
        bpm: bpm.value,
        chordType: chordType.value,
        textTone: textTone.value,
        text: {
          keywords: textKeywords.value.split(',').map(keyword => keyword.trim()),
          narrative_pace: narrativePace.value
        }
      };
  
      const res = await fetch('http://localhost:3001/api/rules/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });
  
      if (!res.ok) {
        throw new Error(`请求失败: ${res.statusText}`);
      }
  
      successMessage.value = '规则保存成功';
      errorMessage.value = null;
    } catch (error) {
      errorMessage.value = `发生错误: ${error.message}`;
      successMessage.value = null;
    }
  };
  </script>
  
  <style scoped>
  /* 添加关闭按钮样式 */
  .close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
  }
  
  /* 添加错误信息的样式 */
  .error {
    padding: 1rem;
    background-color: rgba(255, 0, 0, 0.2);
    color: #ff0000;
    border-radius: 0.5rem;
  }
  
  .success {
    padding: 1rem;
    background-color: rgba(0, 255, 0, 0.2);
    color: #00ff00;
    border-radius: 0.5rem;
  }
  
  .rule-customizer {
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border-radius: 1rem;
    background: rgba(0, 0, 0, 0.3);
    position: relative;
  }
  
  .form-group {
    margin-bottom: 0.75rem;
  }
  
  .input {
    width: 100%;
    padding: 0.4rem;
    border-radius: 0.5rem;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
  
  .btn {
    background: #00e1ff;
    color: #000;
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s ease;
  }
  
  .btn:hover {
    transform: scale(1.05);
  }
  </style>