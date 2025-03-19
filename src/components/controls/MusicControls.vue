<template>
  <div class="input-group">
    <h3>音乐参数</h3>
    
    <div class="slider-group">
      <label>BPM：{{ modelValue.bpm  }}</label>
      <input 
        type="range"
        min="60"
        max="200"
        :value="modelValue.bpm" 
        @input="updateParam('bpm', $event.target.value)" 
      >
    </div>
 
    <div class="select-group">
      <label>和弦类型：</label>
      <select 
        :value="modelValue.chordType" 
        @change="updateParam('chordType', $event.target.value)" 
      >
        <option v-for="chord in chords" :key="chord">{{ chord }}</option>
      </select>
    </div>
 
    <div class="duration-control">
      <label>持续时间（秒）：</label>
      <input 
        type="number"
        min="15"
        max="300"
        :value="modelValue.duration" 
        @input="updateParam('duration', $event.target.value)" 
      >
    </div>
  </div>
</template>
 
<script setup>
import { defineProps, defineEmits } from 'vue'
 
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      bpm: 120,
      chordType: '强力和弦',
      duration: 30 
    })
  }
})
 
const emit = defineEmits(['update:modelValue'])
 
const chords = ['强力和弦', '小调和弦', '七和弦', '爵士和弦', '电子和弦']
 
const updateParam = (key, value) => {
  emit('update:modelValue', { 
    ...props.modelValue, 
    [key]: Number(value) || value 
  })
}
</script>
 
<style scoped>
.slider-group, .select-group, .duration-control {
  margin: 1.2rem 0;
}
 
.duration-control input {
  width: 80px;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
 
select {
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>