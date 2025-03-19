<template>
  <div class="input-group">
    <h3>图像生成设置</h3>
    
    <div class="prompt-input">
      <textarea 
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)" 
        placeholder="输入图像描述（如：赛博朋克风格的未来城市，霓虹灯光）"
      ></textarea>
    </div>

    <div class="advanced-settings">
      <label>生成参数：</label>
      <div class="param-row">
        <div class="param-item">
          <span>精细度：</span>
          <input 
            type="number"
            min="1"
            max="100"
            :value="params.steps" 
            @input="updateParam('steps', $event.target.value)" 
          >
        </div>
        <div class="param-item">
          <span>创意度：</span>
          <input 
            type="range"
            min="5"
            max="15"
            step="0.5"
            :value="params.creativity" 
            @input="updateParam('creativity', $event.target.value)" 
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: String,
  params: {
    type: Object,
    default: () => ({
      steps: 50,
      creativity: 7.5 
    })
  }
})

const emit = defineEmits(['update:modelValue', 'update:params'])

const updateParam = (key, value) => {
  emit('update:params', {
    ...props.params, // 使用 props.params 而不是直接使用 params
    [key]: Number(value)
  })
}
</script>
 
<style scoped>
.prompt-input textarea {
  width: 100%;
  height: 100px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  resize: vertical;
}
 
.advanced-settings {
  margin-top: 1.5rem;
}
 
.param-row {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
}
 
.param-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
 
.param-item input[type="number"] {
  width: 70px;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>