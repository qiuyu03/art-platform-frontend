<template>
  <div class="control-group">
    <h3>风格控制</h3>
    <div class="emotion-selector">
      <button 
        v-for="emotion in emotions" 
        :key="emotion"
        @click="selectEmotion(emotion)"
        :class="{ active: selectedEmotion === emotion }"
      >
        {{ emotion }}
      </button>
    </div>
    <div class="color-picker">
      <label>主色调：</label>
      <input type="color" v-model="selectedColor">
    </div>
    <div class="slider-group">
      <label>对比度：{{ contrast }}%</label>
      <input 
        type="range" 
        min="0" 
        max="100" 
        v-model="contrast"
      >
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { defineEmits } from 'vue'

const emit = defineEmits(['update:modelValue'])

const styleParams = ref({
  selectedEmotion: '热血',
  selectedColor: '#ff4500',
  contrast: 80,
  emotions: ['热血', '悲伤', '温馨', '科幻']
})

// 响应式更新
watch(styleParams, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })

const selectEmotion = (emotion) => {
  styleParams.value.selectedEmotion = emotion
}
</script>

<style scoped>
/* 添加一些基本样式 */
.control-group {
  padding: 20px;
}

.emotion-selector button {
  margin-right: 10px;
}

.active {
  background-color: #ff4500;
  color: white;
}
</style>